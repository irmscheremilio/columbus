//! Bulk authentication flow - "Authenticate All Platforms" feature
//!
//! This module handles authenticating all required platform/region combinations
//! automatically using stored credentials.

use crate::storage;
use crate::webview::{
    detect_login_state, fill_and_submit_login, submit_two_factor_code, verify_login_success,
    LoginState, TwoFactorMethod, WebviewManager,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::{AppHandle, Emitter, Manager};

/// Status of a single authentication task
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AuthTaskStatus {
    Pending,
    InProgress,
    WaitingFor2FA,
    Success,
    Failed,
    Skipped,
}

/// Progress event for bulk authentication
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BulkAuthProgress {
    /// Current task index (0-based)
    pub current_index: usize,
    /// Total number of tasks
    pub total_tasks: usize,
    /// Current platform being authenticated
    pub current_platform: String,
    /// Current region being authenticated
    pub current_region: String,
    /// Status of the current task
    pub current_status: AuthTaskStatus,
    /// All task statuses (key: "platform:region")
    pub task_statuses: HashMap<String, AuthTaskStatus>,
    /// Error message if any
    pub error: Option<String>,
    /// Whether 2FA is required for current task
    pub needs_2fa: bool,
    /// 2FA method if needed
    pub two_factor_method: Option<String>,
    /// Webview label for 2FA input (if needed)
    pub webview_label: Option<String>,
}

/// Input for starting bulk authentication
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BulkAuthInput {
    /// Map of platform -> list of regions to authenticate
    /// e.g., {"chatgpt": ["us", "de"], "perplexity": ["us"]}
    pub platform_regions: HashMap<String, Vec<String>>,
    /// Hash of the prompt regions config (for tracking)
    pub config_hash: String,
}

/// Result of bulk authentication
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BulkAuthResult {
    pub success: bool,
    pub total_tasks: usize,
    pub successful: usize,
    pub failed: usize,
    pub skipped: usize,
    pub errors: Vec<String>,
}

/// Start the bulk authentication process
/// This runs in the background and emits progress events
#[tauri::command]
pub async fn start_bulk_auth(app: AppHandle, input: BulkAuthInput) -> Result<(), String> {
    // Build list of tasks (platform, region) pairs
    let mut tasks: Vec<(String, String)> = Vec::new();
    for (platform, regions) in &input.platform_regions {
        for region in regions {
            tasks.push((platform.clone(), region.clone()));
        }
    }

    if tasks.is_empty() {
        return Err("No authentication tasks to perform".to_string());
    }

    eprintln!(
        "[BulkAuth] Starting bulk authentication for {} tasks",
        tasks.len()
    );

    // Initialize task statuses
    let mut task_statuses: HashMap<String, AuthTaskStatus> = HashMap::new();
    for (platform, region) in &tasks {
        let key = format!("{}:{}", platform, region);
        task_statuses.insert(key, AuthTaskStatus::Pending);
    }

    // Emit initial progress
    let initial_progress = BulkAuthProgress {
        current_index: 0,
        total_tasks: tasks.len(),
        current_platform: tasks[0].0.clone(),
        current_region: tasks[0].1.clone(),
        current_status: AuthTaskStatus::Pending,
        task_statuses: task_statuses.clone(),
        error: None,
        needs_2fa: false,
        two_factor_method: None,
        webview_label: None,
    };
    let _ = app.emit("bulk-auth-progress", &initial_progress);

    // Process each task
    let mut successful = 0;
    let mut failed = 0;
    let mut skipped = 0;
    let mut errors: Vec<String> = Vec::new();

    for (index, (platform, region)) in tasks.iter().enumerate() {
        let key = format!("{}:{}", platform, region);

        // Check if already authenticated
        if storage::is_country_platform_authenticated(region, platform) {
            eprintln!(
                "[BulkAuth] Already authenticated: {}:{}, skipping",
                platform, region
            );
            task_statuses.insert(key.clone(), AuthTaskStatus::Skipped);
            skipped += 1;

            let progress = BulkAuthProgress {
                current_index: index,
                total_tasks: tasks.len(),
                current_platform: platform.clone(),
                current_region: region.clone(),
                current_status: AuthTaskStatus::Skipped,
                task_statuses: task_statuses.clone(),
                error: None,
                needs_2fa: false,
                two_factor_method: None,
                webview_label: None,
            };
            let _ = app.emit("bulk-auth-progress", &progress);
            continue;
        }

        // Get credentials for this platform
        let credentials = match storage::get_platform_credentials(platform) {
            Some(creds) => creds,
            None => {
                eprintln!(
                    "[BulkAuth] No credentials for platform {}, skipping",
                    platform
                );
                task_statuses.insert(key.clone(), AuthTaskStatus::Skipped);
                skipped += 1;
                errors.push(format!("No credentials for {}", platform));
                continue;
            }
        };

        // Update status to in progress
        task_statuses.insert(key.clone(), AuthTaskStatus::InProgress);
        let progress = BulkAuthProgress {
            current_index: index,
            total_tasks: tasks.len(),
            current_platform: platform.clone(),
            current_region: region.clone(),
            current_status: AuthTaskStatus::InProgress,
            task_statuses: task_statuses.clone(),
            error: None,
            needs_2fa: false,
            two_factor_method: None,
            webview_label: None,
        };
        let _ = app.emit("bulk-auth-progress", &progress);

        // Perform authentication
        match authenticate_single(&app, platform, region, &credentials.email, &credentials.password)
            .await
        {
            Ok(AuthSingleResult::Success) => {
                eprintln!("[BulkAuth] Successfully authenticated {}:{}", platform, region);
                task_statuses.insert(key.clone(), AuthTaskStatus::Success);
                successful += 1;

                let progress = BulkAuthProgress {
                    current_index: index,
                    total_tasks: tasks.len(),
                    current_platform: platform.clone(),
                    current_region: region.clone(),
                    current_status: AuthTaskStatus::Success,
                    task_statuses: task_statuses.clone(),
                    error: None,
                    needs_2fa: false,
                    two_factor_method: None,
                    webview_label: None,
                };
                let _ = app.emit("bulk-auth-progress", &progress);
            }
            Ok(AuthSingleResult::Needs2FA {
                method,
                webview_label,
            }) => {
                eprintln!(
                    "[BulkAuth] 2FA required for {}:{}, method: {:?}",
                    platform, region, method
                );
                task_statuses.insert(key.clone(), AuthTaskStatus::WaitingFor2FA);

                let progress = BulkAuthProgress {
                    current_index: index,
                    total_tasks: tasks.len(),
                    current_platform: platform.clone(),
                    current_region: region.clone(),
                    current_status: AuthTaskStatus::WaitingFor2FA,
                    task_statuses: task_statuses.clone(),
                    error: None,
                    needs_2fa: true,
                    two_factor_method: Some(match method {
                        TwoFactorMethod::Code => "code".to_string(),
                        TwoFactorMethod::PhonePush => "phone_push".to_string(),
                        TwoFactorMethod::EmailCode => "email_code".to_string(),
                    }),
                    webview_label: Some(webview_label),
                };
                let _ = app.emit("bulk-auth-progress", &progress);

                // Wait for 2FA to be submitted via submit_bulk_auth_2fa command
                // The frontend will call that command when user enters the code
                // For now, we'll pause here and the task will be resumed by the 2FA handler
                return Ok(());
            }
            Err(e) => {
                eprintln!("[BulkAuth] Failed to authenticate {}:{}: {}", platform, region, e);
                task_statuses.insert(key.clone(), AuthTaskStatus::Failed);
                failed += 1;
                errors.push(format!("{}:{} - {}", platform, region, e));

                let progress = BulkAuthProgress {
                    current_index: index,
                    total_tasks: tasks.len(),
                    current_platform: platform.clone(),
                    current_region: region.clone(),
                    current_status: AuthTaskStatus::Failed,
                    task_statuses: task_statuses.clone(),
                    error: Some(e),
                    needs_2fa: false,
                    two_factor_method: None,
                    webview_label: None,
                };
                let _ = app.emit("bulk-auth-progress", &progress);
            }
        }

        // Small delay between tasks
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    }

    // Update authentication tracking
    if successful > 0 || skipped > 0 {
        let _ = storage::update_platforms_authentication(&input.config_hash);
    }

    // Emit completion
    let result = BulkAuthResult {
        success: failed == 0,
        total_tasks: tasks.len(),
        successful,
        failed,
        skipped,
        errors,
    };
    let _ = app.emit("bulk-auth-complete", &result);

    Ok(())
}

/// Result of a single authentication attempt
enum AuthSingleResult {
    Success,
    Needs2FA {
        method: TwoFactorMethod,
        webview_label: String,
    },
}

/// Authenticate a single platform/region combination
async fn authenticate_single(
    app: &AppHandle,
    platform: &str,
    region: &str,
    email: &str,
    password: &str,
) -> Result<AuthSingleResult, String> {
    let platform_urls = crate::PLATFORM_URLS;
    let url = platform_urls
        .iter()
        .find(|(p, _)| *p == platform)
        .map(|(_, u)| *u)
        .ok_or_else(|| format!("Unknown platform: {}", platform))?;

    let label = format!("bulk-auth-{}-{}", region, platform);

    // Create webview manager
    let mut manager = WebviewManager::new();

    // Create webview with country proxy
    // In debug builds, make webviews visible for debugging
    let visible = cfg!(debug_assertions);
    manager
        .create_webview_for_country(app, &label, url, visible, region, platform)
        .await
        .map_err(|e| format!("Failed to create webview: {}", e))?;

    // Wait for page to load
    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

    // Detect initial state
    let initial_state = detect_login_state(app, &label, platform).await?;
    eprintln!("[BulkAuth] Initial state for {}:{}: {:?}", platform, region, initial_state);

    match initial_state {
        LoginState::LoggedIn => {
            // Already logged in
            storage::update_country_platform_auth(region, platform, true)?;
            close_webview(app, &label);
            return Ok(AuthSingleResult::Success);
        }
        LoginState::LoginPage => {
            // Fill and submit credentials
            fill_and_submit_login(app, &label, platform, email, password).await?;

            // Wait for login to process
            tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

            // Check new state
            let new_state = detect_login_state(app, &label, platform).await?;
            eprintln!("[BulkAuth] State after credentials: {:?}", new_state);

            match new_state {
                LoginState::LoggedIn => {
                    storage::update_country_platform_auth(region, platform, true)?;
                    close_webview(app, &label);
                    return Ok(AuthSingleResult::Success);
                }
                LoginState::TwoFactorRequired { method } => {
                    // Don't close webview - frontend will handle 2FA
                    return Ok(AuthSingleResult::Needs2FA {
                        method,
                        webview_label: label,
                    });
                }
                LoginState::CaptchaRequired => {
                    close_webview(app, &label);
                    return Err("CAPTCHA required - please authenticate manually".to_string());
                }
                LoginState::MagicLinkRequired => {
                    close_webview(app, &label);
                    return Err("Magic link required - please authenticate manually".to_string());
                }
                _ => {
                    close_webview(app, &label);
                    return Err("Login failed - unknown state after submitting credentials".to_string());
                }
            }
        }
        LoginState::TwoFactorRequired { method } => {
            // Already at 2FA page - don't close webview, frontend will handle 2FA
            // Note: If user doesn't complete 2FA within timeout, cancel_bulk_auth should be called
            return Ok(AuthSingleResult::Needs2FA {
                method,
                webview_label: label,
            });
        }
        LoginState::CaptchaRequired => {
            close_webview(app, &label);
            return Err("CAPTCHA required - please authenticate manually".to_string());
        }
        LoginState::MagicLinkRequired => {
            close_webview(app, &label);
            return Err("Magic link required - please authenticate manually".to_string());
        }
        LoginState::Unknown => {
            close_webview(app, &label);
            return Err("Unknown login state - please authenticate manually".to_string());
        }
    }
}

/// Submit 2FA code during bulk authentication
#[tauri::command]
pub async fn submit_bulk_auth_2fa(
    app: AppHandle,
    webview_label: String,
    platform: String,
    region: String,
    code: String,
    config_hash: String,
) -> Result<bool, String> {
    eprintln!(
        "[BulkAuth] Submitting 2FA code for {}:{}, label: {}",
        platform, region, webview_label
    );

    // Submit the 2FA code
    submit_two_factor_code(&app, &webview_label, &platform, &code).await?;

    // Wait for login to process
    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

    // Verify login
    let success = verify_login_success(&app, &webview_label, &platform).await?;

    if success {
        storage::update_country_platform_auth(&region, &platform, true)?;
        let _ = storage::update_platforms_authentication(&config_hash);
        eprintln!("[BulkAuth] 2FA successful for {}:{}", platform, region);
    } else {
        eprintln!("[BulkAuth] 2FA failed for {}:{}", platform, region);
    }

    // Close the webview
    close_webview(&app, &webview_label);

    // Emit event to continue with remaining tasks
    let _ = app.emit("bulk-auth-2fa-complete", &serde_json::json!({
        "success": success,
        "platform": platform,
        "region": region,
    }));

    Ok(success)
}

/// Cancel bulk authentication and clean up
#[tauri::command]
pub async fn cancel_bulk_auth(app: AppHandle, webview_label: Option<String>) -> Result<(), String> {
    eprintln!("[BulkAuth] Cancelling bulk authentication");

    // Close the specific webview if provided
    if let Some(label) = webview_label {
        close_webview(&app, &label);
    }

    // Also close any bulk-auth webviews that might be lingering
    // This handles cases where the label wasn't passed or multiple webviews exist
    let platforms = ["chatgpt", "claude", "gemini", "perplexity"];
    let regions = ["us", "uk", "de", "fr", "es", "it", "nl", "local"]; // Common regions

    for region in regions {
        for platform in platforms {
            let label = format!("bulk-auth-{}-{}", region, platform);
            close_webview(&app, &label);
        }
    }

    // Emit cancellation event
    let _ = app.emit("bulk-auth-cancelled", &());

    Ok(())
}

/// Helper to close a webview
fn close_webview(app: &AppHandle, label: &str) {
    if let Some(window) = app.get_webview_window(label) {
        let _ = window.close();
    }
}

/// Get required auth tasks for a product's prompts
/// Returns map of platform -> regions that need authentication
#[tauri::command]
pub fn get_required_auth_tasks(
    prompt_regions: HashMap<String, Vec<String>>,
    platforms: Vec<String>,
) -> HashMap<String, Vec<String>> {
    let mut result: HashMap<String, Vec<String>> = HashMap::new();

    // Collect all unique regions from prompts
    let mut all_regions: Vec<String> = prompt_regions
        .values()
        .flat_map(|regions| regions.iter().cloned())
        .collect();
    all_regions.sort();
    all_regions.dedup();

    // If no regions specified, use "local" (no proxy)
    if all_regions.is_empty() {
        all_regions.push("local".to_string());
    }

    // For each platform, check which regions need authentication
    for platform in platforms {
        let mut regions_needing_auth: Vec<String> = Vec::new();

        for region in &all_regions {
            if !storage::is_country_platform_authenticated(region, &platform) {
                regions_needing_auth.push(region.clone());
            }
        }

        if !regions_needing_auth.is_empty() {
            result.insert(platform, regions_needing_auth);
        }
    }

    result
}
