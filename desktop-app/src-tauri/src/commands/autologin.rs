use crate::webview::{
    detect_login_state, fill_and_submit_login, submit_two_factor_code, verify_login_success,
    LoginState, TwoFactorMethod, WebviewManager,
};
use crate::storage;
use serde::Serialize;
use tauri::{AppHandle, Manager};

/// Login state response for frontend
#[derive(Serialize)]
pub struct LoginStateResponse {
    pub state: String,
    pub two_factor_method: Option<String>,
}

impl From<LoginState> for LoginStateResponse {
    fn from(state: LoginState) -> Self {
        match state {
            LoginState::LoggedIn => LoginStateResponse {
                state: "logged_in".to_string(),
                two_factor_method: None,
            },
            LoginState::LoginPage => LoginStateResponse {
                state: "login_page".to_string(),
                two_factor_method: None,
            },
            LoginState::TwoFactorRequired { method } => LoginStateResponse {
                state: "two_factor_required".to_string(),
                two_factor_method: Some(match method {
                    TwoFactorMethod::Code => "code".to_string(),
                    TwoFactorMethod::PhonePush => "phone_push".to_string(),
                    TwoFactorMethod::EmailCode => "email_code".to_string(),
                }),
            },
            LoginState::MagicLinkRequired => LoginStateResponse {
                state: "magic_link_required".to_string(),
                two_factor_method: None,
            },
            LoginState::CaptchaRequired => LoginStateResponse {
                state: "captcha_required".to_string(),
                two_factor_method: None,
            },
            LoginState::Unknown => LoginStateResponse {
                state: "unknown".to_string(),
                two_factor_method: None,
            },
        }
    }
}

/// Open a platform login webview for a specific country
/// This creates an isolated session with proxy for that country
#[tauri::command]
pub async fn open_country_login(
    app: AppHandle,
    country_code: String,
    platform: String,
) -> Result<String, String> {
    let platform_urls = crate::PLATFORM_URLS;
    let url = platform_urls
        .iter()
        .find(|(p, _)| *p == platform)
        .map(|(_, u)| *u)
        .ok_or_else(|| format!("Unknown platform: {}", platform))?;

    let label = format!("login-{}-{}", country_code, platform);

    // Create webview manager
    let mut manager = WebviewManager::new();

    // Create webview with country proxy and isolated data directory
    manager
        .create_webview_for_country(&app, &label, url, true, &country_code, &platform)
        .await
        .map_err(|e| format!("Failed to create login webview: {}", e))?;

    eprintln!(
        "[AutoLogin] Opened login webview for country={}, platform={}",
        country_code, platform
    );

    Ok(label)
}

/// Open a platform login webview for local (no proxy)
#[tauri::command]
pub async fn open_local_login(app: AppHandle, platform: String) -> Result<String, String> {
    let platform_urls = crate::PLATFORM_URLS;
    let url = platform_urls
        .iter()
        .find(|(p, _)| *p == platform)
        .map(|(_, u)| *u)
        .ok_or_else(|| format!("Unknown platform: {}", platform))?;

    let label = format!("login-local-{}", platform);

    // Create webview manager
    let mut manager = WebviewManager::new();

    // Create webview with isolated data directory (no proxy)
    manager
        .create_webview_local(&app, &label, url, true, &platform)
        .map_err(|e| format!("Failed to create login webview: {}", e))?;

    eprintln!("[AutoLogin] Opened local login webview for platform={}", platform);

    Ok(label)
}

/// Detect the current login state for a webview
#[tauri::command]
pub async fn detect_webview_login_state(
    app: AppHandle,
    label: String,
    platform: String,
) -> Result<LoginStateResponse, String> {
    let state = detect_login_state(&app, &label, &platform).await?;
    Ok(state.into())
}

/// Auto-fill and submit login credentials
#[tauri::command]
pub async fn auto_login(
    app: AppHandle,
    label: String,
    platform: String,
    email: String,
    password: String,
) -> Result<(), String> {
    fill_and_submit_login(&app, &label, &platform, &email, &password).await
}

/// Submit 2FA code to the login form
#[tauri::command]
pub async fn submit_2fa_code(
    app: AppHandle,
    label: String,
    platform: String,
    code: String,
) -> Result<(), String> {
    submit_two_factor_code(&app, &label, &platform, &code).await
}

/// Verify if login was successful and update auth status
#[tauri::command]
pub async fn verify_and_save_login(
    app: AppHandle,
    label: String,
    platform: String,
    country_code: Option<String>,
) -> Result<bool, String> {
    let success = verify_login_success(&app, &label, &platform).await?;

    if success {
        // Update auth status in storage
        let country = country_code.unwrap_or_else(|| "local".to_string());
        storage::update_country_platform_auth(&country, &platform, true)?;
        eprintln!(
            "[AutoLogin] Login verified and saved: country={}, platform={}",
            country, platform
        );
    }

    Ok(success)
}

/// Close a login webview
#[tauri::command]
pub async fn close_login_webview(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window
            .close()
            .map_err(|e| format!("Failed to close webview: {}", e))?;
    }
    Ok(())
}

/// Perform full auto-login flow for a country/platform
/// This opens the webview, detects state, fills credentials, handles 2FA if needed
#[tauri::command]
pub async fn perform_auto_login(
    app: AppHandle,
    country_code: Option<String>,
    platform: String,
    email: String,
    password: String,
) -> Result<LoginStateResponse, String> {
    let label = if let Some(ref country) = country_code {
        open_country_login(app.clone(), country.clone(), platform.clone()).await?
    } else {
        open_local_login(app.clone(), platform.clone()).await?
    };

    // Wait for page to load
    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

    // Detect initial state
    let initial_state = detect_login_state(&app, &label, &platform).await?;
    eprintln!("[AutoLogin] Initial state: {:?}", initial_state);

    match initial_state {
        LoginState::LoggedIn => {
            // Already logged in, update auth status
            let country = country_code.unwrap_or_else(|| "local".to_string());
            storage::update_country_platform_auth(&country, &platform, true)?;
            return Ok(initial_state.into());
        }
        LoginState::LoginPage => {
            // Fill credentials
            fill_and_submit_login(&app, &label, &platform, &email, &password).await?;

            // Wait for login to process
            tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

            // Check new state
            let new_state = detect_login_state(&app, &label, &platform).await?;
            eprintln!("[AutoLogin] State after credentials: {:?}", new_state);

            if matches!(new_state, LoginState::LoggedIn) {
                let country = country_code.unwrap_or_else(|| "local".to_string());
                storage::update_country_platform_auth(&country, &platform, true)?;
            }

            return Ok(new_state.into());
        }
        LoginState::TwoFactorRequired { .. }
        | LoginState::MagicLinkRequired
        | LoginState::CaptchaRequired => {
            // Return the state so frontend can prompt user
            return Ok(initial_state.into());
        }
        LoginState::Unknown => {
            return Ok(initial_state.into());
        }
    }
}
