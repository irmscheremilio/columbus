use crate::{
    commands::api::get_platform_url,
    update_tray_status, webview::WebviewManager, AppState, PlatformState, Prompt, ScanComplete,
    ScanProgress, ScanResult,
};
use serde::Serialize;
use std::collections::HashMap;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};
use uuid::Uuid;

#[derive(Clone, Serialize)]
pub struct ScanProgressEvent {
    pub phase: String,
    pub current: usize,
    pub total: usize,
    pub platforms: HashMap<String, PlatformState>,
    #[serde(rename = "countdownSeconds")]
    pub countdown_seconds: Option<usize>,
}

#[tauri::command]
pub async fn start_scan(
    product_id: String,
    samples_per_prompt: Option<usize>,
    platforms: Option<Vec<String>>,
    app: AppHandle,
    state: State<'_, Arc<AppState>>,
) -> Result<(), String> {
    start_scan_internal(product_id, samples_per_prompt, platforms, app, state.inner().clone()).await
}

/// Internal scan function that can be called without Tauri State wrapper
pub async fn start_scan_internal(
    product_id: String,
    samples_per_prompt: Option<usize>,
    platforms: Option<Vec<String>>,
    app: AppHandle,
    state: Arc<AppState>,
) -> Result<(), String> {
    // Default to common platforms if none specified
    let selected_platforms: Vec<String> = platforms.unwrap_or_else(|| {
        vec!["chatgpt".to_string(), "claude".to_string(), "gemini".to_string(), "perplexity".to_string()]
    });
    // Check if scan is already running
    {
        let scan = state.scan.lock();
        if scan.is_running {
            return Err("Scan already in progress".to_string());
        }
    }

    // Ensure we have a valid auth token (refresh if expired)
    let token = crate::commands::auth::ensure_valid_token(&state).await?;

    // Get prompts from API
    let prompts_response: crate::commands::api::PromptsResponse = {

        let client = reqwest::Client::new();
        let url = format!(
            "{}/functions/v1/extension-prompts?productId={}",
            crate::SUPABASE_URL,
            product_id
        );

        let response = client
            .get(&url)
            .header("Authorization", format!("Bearer {}", token))
            .header("apikey", crate::SUPABASE_ANON_KEY)
            .send()
            .await
            .map_err(|e| format!("Failed to fetch prompts: {}", e))?;

        if !response.status().is_success() {
            return Err("Failed to fetch prompts".to_string());
        }

        response.json().await.map_err(|e| format!("Parse error: {}", e))?
    };

    if prompts_response.prompts.is_empty() {
        return Err("No prompts found for this product".to_string());
    }

    let samples = samples_per_prompt.unwrap_or(1);
    let scan_session_id = Uuid::new_v4().to_string();
    let platform_count = selected_platforms.len();

    // Initialize scan state
    {
        let mut scan = state.scan.lock();
        scan.is_running = true;
        scan.phase = "initializing".to_string();
        scan.scan_session_id = Some(scan_session_id.clone());
        scan.product_id = Some(product_id.clone());
        scan.total_prompts = prompts_response.prompts.len() * samples * platform_count;
        scan.completed_prompts = 0;

        // Initialize platform states for selected platforms only
        scan.platforms.clear();
        for platform in &selected_platforms {
            scan.platforms.insert(
                platform.clone(),
                PlatformState {
                    status: "pending".to_string(),
                    total: prompts_response.prompts.len() * samples,
                    submitted: 0,
                    collected: 0,
                    failed: 0,
                },
            );
        }
    }

    // Update tray to show scanning
    update_tray_status(&app, true);

    // Emit initial progress
    emit_progress_with_state(&app, &state);

    // Clone necessary data for async task
    let state_clone = state.clone();
    let app_clone = app.clone();
    let prompts = prompts_response.prompts.clone();
    let brand = prompts_response.product.brand.clone();
    let competitors = prompts_response.competitors.clone();
    let platforms_for_scan = selected_platforms.clone();

    // Spawn scan task
    tokio::spawn(async move {
        let result = run_scan(
            app_clone.clone(),
            state_clone.clone(),
            prompts,
            samples,
            scan_session_id.clone(),
            product_id.clone(),
            brand,
            competitors,
            platforms_for_scan,
        )
        .await;

        // Handle completion or error
        match result {
            Ok(stats) => {
                let _ = app_clone.emit("scan:complete", stats);
            }
            Err(e) => {
                let _ = app_clone.emit("scan:error", e.clone());
                eprintln!("Scan error: {}", e);
            }
        }

        // Reset tray to normal
        update_tray_status(&app_clone, false);

        // Reset scan state
        let mut scan = state_clone.scan.lock();
        scan.is_running = false;
        scan.phase = "complete".to_string();
    });

    Ok(())
}

async fn run_scan(
    app: AppHandle,
    state: Arc<AppState>,
    prompts: Vec<Prompt>,
    samples: usize,
    scan_session_id: String,
    product_id: String,
    brand: String,
    competitors: Vec<String>,
    selected_platforms: Vec<String>,
) -> Result<ScanComplete, String> {
    let mut manager = WebviewManager::new();

    // Update phase
    {
        let mut scan = state.scan.lock();
        scan.phase = "submitting".to_string();
    }
    emit_progress_with_state(&app, &state);

    let mut total_collected = 0;
    let mut total_mentioned = 0;
    let mut total_cited = 0;

    // Process each selected platform
    for platform_str in &selected_platforms {
        let url = get_platform_url(platform_str)
            .ok_or_else(|| format!("Unknown platform: {}", platform_str))?;
        let platform = platform_str.as_str();

        // Update platform status
        {
            let mut scan = state.scan.lock();
            if let Some(ps) = scan.platforms.get_mut(platform_str) {
                ps.status = "submitting".to_string();
            }
        }
        emit_progress_with_state(&app, &state);

        // Check if user is logged in by creating a test webview
        let webview_label = format!("scan-{}-check", platform);
        let login_check = manager
            .create_webview(&app, &webview_label, &url, true)
            .await;

        if login_check.is_err() {
            // Mark platform as skipped
            {
                let mut scan = state.scan.lock();
                if let Some(ps) = scan.platforms.get_mut(platform_str) {
                    ps.status = "skipped".to_string();
                }
            }
            emit_progress_with_state(&app, &state);
            continue;
        }

        // Wait for page to load
        tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

        // Check login status
        let is_logged_in = manager
            .check_login(&app, &webview_label, platform)
            .await
            .unwrap_or(false);

        // Close check webview
        manager.close_webview(&app, &webview_label);

        if !is_logged_in {
            {
                let mut scan = state.scan.lock();
                if let Some(ps) = scan.platforms.get_mut(platform_str) {
                    ps.status = "skipped".to_string();
                }
            }
            emit_progress_with_state(&app, &state);
            continue;
        }

        // Process prompts for this platform
        for (prompt_idx, prompt) in prompts.iter().enumerate() {
            for sample in 0..samples {
                // Check if scan was cancelled
                {
                    let scan = state.scan.lock();
                    if !scan.is_running {
                        return Err("Scan cancelled".to_string());
                    }
                }

                let webview_label = format!("scan-{}-{}-{}", platform, prompt_idx, sample);

                // Create webview for this prompt
                if let Err(e) = manager.create_webview(&app, &webview_label, &url, false).await {
                    eprintln!("Failed to create webview: {}", e);
                    {
                        let mut scan = state.scan.lock();
                        if let Some(ps) = scan.platforms.get_mut(platform_str) {
                            ps.failed += 1;
                        }
                    }
                    continue;
                }

                // Wait for page load
                tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

                // Submit prompt
                let submit_result = manager
                    .submit_prompt(&app, &webview_label, platform, &prompt.text)
                    .await;

                if submit_result.is_ok() {
                    {
                        let mut scan = state.scan.lock();
                        if let Some(ps) = scan.platforms.get_mut(platform_str) {
                            ps.submitted += 1;
                        }
                    }
                    emit_progress_with_state(&app, &state);
                }
            }
        }

        // Update to waiting phase
        {
            let mut scan = state.scan.lock();
            if let Some(ps) = scan.platforms.get_mut(platform_str) {
                ps.status = "waiting".to_string();
            }
        }
        emit_progress_with_state(&app, &state);
    }

    // Wait for responses with countdown
    {
        let mut scan = state.scan.lock();
        scan.phase = "waiting".to_string();
    }

    // Countdown from 45 seconds, emitting progress every second
    const WAIT_SECONDS: usize = 45;
    for remaining in (0..=WAIT_SECONDS).rev() {
        emit_progress_with_countdown(&app, &state, remaining);
        if remaining > 0 {
            tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
        }
    }

    // Collection phase
    {
        let mut scan = state.scan.lock();
        scan.phase = "collecting".to_string();
    }
    emit_progress_with_state(&app, &state);

    // Collect responses from all webviews
    for platform_str in &selected_platforms {
        let platform = platform_str.as_str();

        {
            let mut scan = state.scan.lock();
            if let Some(ps) = scan.platforms.get_mut(platform_str) {
                if ps.status == "skipped" {
                    continue;
                }
                ps.status = "collecting".to_string();
            }
        }
        emit_progress_with_state(&app, &state);

        for (prompt_idx, prompt) in prompts.iter().enumerate() {
            for sample in 0..samples {
                let webview_label = format!("scan-{}-{}-{}", platform, prompt_idx, sample);

                // Collect response
                let collect_result = manager
                    .collect_response(&app, &webview_label, platform, &brand, &competitors)
                    .await;

                match collect_result {
                    Ok(response) => {
                        total_collected += 1;
                        if response.brand_mentioned {
                            total_mentioned += 1;
                        }
                        if response.citation_present {
                            total_cited += 1;
                        }

                        // Submit result to API
                        let scan_result = ScanResult {
                            product_id: product_id.clone(),
                            scan_session_id: scan_session_id.clone(),
                            platform: platform_str.clone(),
                            prompt_id: prompt.id.clone(),
                            prompt_text: prompt.text.clone(),
                            response_text: response.response_text,
                            brand_mentioned: response.brand_mentioned,
                            citation_present: response.citation_present,
                            position: response.position,
                            sentiment: response.sentiment.clone(),
                            competitor_mentions: response.competitor_mentions,
                            competitor_details: response.competitor_details.iter().map(|cd| {
                                crate::CompetitorDetailResult {
                                    name: cd.name.clone(),
                                    position: cd.position,
                                    sentiment: cd.sentiment.clone(),
                                }
                            }).collect(),
                            citations: response.citations,
                            credits_exhausted: response.credits_exhausted,
                            chat_url: response.chat_url,
                        };

                        // Submit to API with logging - ensure token is still valid
                        let token = match crate::commands::auth::ensure_valid_token(&state).await {
                            Ok(t) => Some(t),
                            Err(_) => {
                                let auth = state.auth.lock();
                                auth.access_token.clone()
                            }
                        };

                        if let Some(token) = token {
                            let client = reqwest::Client::new();
                            eprintln!("Submitting scan result for {} prompt {} to API...", platform_str, prompt.id);

                            match client
                                .post(format!(
                                    "{}/functions/v1/extension-scan-results",
                                    crate::SUPABASE_URL
                                ))
                                .header("Authorization", format!("Bearer {}", token))
                                .header("apikey", crate::SUPABASE_ANON_KEY)
                                .header("Content-Type", "application/json")
                                .json(&scan_result)
                                .send()
                                .await
                            {
                                Ok(response) => {
                                    let status = response.status();
                                    if status.is_success() {
                                        eprintln!("API submission successful: {}", status);
                                    } else {
                                        let body = response.text().await.unwrap_or_default();
                                        eprintln!("API submission failed: {} - {}", status, body);
                                    }
                                }
                                Err(e) => {
                                    eprintln!("API request error: {}", e);
                                }
                            }
                        } else {
                            eprintln!("No auth token available for API submission");
                        }

                        {
                            let mut scan = state.scan.lock();
                            if let Some(ps) = scan.platforms.get_mut(platform_str) {
                                ps.collected += 1;
                            }
                            scan.completed_prompts += 1;
                        }
                    }
                    Err(e) => {
                        eprintln!("Failed to collect response: {}", e);
                        {
                            let mut scan = state.scan.lock();
                            if let Some(ps) = scan.platforms.get_mut(platform_str) {
                                ps.failed += 1;
                            }
                        }
                    }
                }

                emit_progress_with_state(&app, &state);

                // Close webview
                manager.close_webview(&app, &webview_label);
            }
        }

        // Mark platform complete
        {
            let mut scan = state.scan.lock();
            if let Some(ps) = scan.platforms.get_mut(platform_str) {
                ps.status = "complete".to_string();
            }
        }
        emit_progress_with_state(&app, &state);
    }

    // Finalize scan - refresh token if needed since scan might have taken a while
    {
        let token = match crate::commands::auth::ensure_valid_token(&state).await {
            Ok(t) => Some(t),
            Err(e) => {
                eprintln!("[Scan] Token refresh failed before finalize: {}", e);
                None
            }
        };

        if let Some(token) = token {
            let client = reqwest::Client::new();
            eprintln!("Finalizing scan session {}...", scan_session_id);

            match client
                .post(format!(
                    "{}/functions/v1/extension-finalize-scan",
                    crate::SUPABASE_URL
                ))
                .header("Authorization", format!("Bearer {}", token))
                .header("apikey", crate::SUPABASE_ANON_KEY)
                .header("Content-Type", "application/json")
                .json(&serde_json::json!({
                    "scanSessionId": scan_session_id,
                    "productId": product_id
                }))
                .send()
                .await
            {
                Ok(response) => {
                    let status = response.status();
                    if status.is_success() {
                        eprintln!("Finalize scan successful: {}", status);
                    } else {
                        let body = response.text().await.unwrap_or_default();
                        eprintln!("Finalize scan failed: {} - {}", status, body);
                    }
                }
                Err(e) => {
                    eprintln!("Finalize scan request error: {}", e);
                }
            }
        } else {
            eprintln!("No auth token available for finalize scan");
        }
    }

    let mention_rate = if total_collected > 0 {
        (total_mentioned as f64 / total_collected as f64) * 100.0
    } else {
        0.0
    };

    let citation_rate = if total_collected > 0 {
        (total_cited as f64 / total_collected as f64) * 100.0
    } else {
        0.0
    };

    Ok(ScanComplete {
        total_prompts: prompts.len() * samples * 4,
        successful_prompts: total_collected,
        mention_rate,
        citation_rate,
    })
}

#[tauri::command]
pub async fn cancel_scan(app: AppHandle, state: State<'_, Arc<AppState>>) -> Result<(), String> {
    let mut scan = state.scan.lock();
    scan.is_running = false;
    scan.phase = "cancelled".to_string();

    // Reset tray to normal
    update_tray_status(&app, false);

    Ok(())
}

#[tauri::command]
pub async fn get_scan_progress(state: State<'_, Arc<AppState>>) -> Result<ScanProgress, String> {
    let scan = state.scan.lock();
    Ok(ScanProgress {
        phase: scan.phase.clone(),
        current: scan.completed_prompts,
        total: scan.total_prompts,
        platforms: scan.platforms.clone(),
    })
}

#[tauri::command]
pub async fn is_scan_running(state: State<'_, Arc<AppState>>) -> Result<bool, String> {
    let scan = state.scan.lock();
    Ok(scan.is_running)
}

fn emit_progress_with_state(app: &AppHandle, state: &Arc<AppState>) {
    let scan = state.scan.lock();
    let _ = app.emit(
        "scan:progress",
        ScanProgressEvent {
            phase: scan.phase.clone(),
            current: scan.completed_prompts,
            total: scan.total_prompts,
            platforms: scan.platforms.clone(),
            countdown_seconds: None,
        },
    );
}

fn emit_progress_with_countdown(app: &AppHandle, state: &Arc<AppState>, countdown: usize) {
    let scan = state.scan.lock();
    let _ = app.emit(
        "scan:progress",
        ScanProgressEvent {
            phase: scan.phase.clone(),
            current: scan.completed_prompts,
            total: scan.total_prompts,
            platforms: scan.platforms.clone(),
            countdown_seconds: Some(countdown),
        },
    );
}
