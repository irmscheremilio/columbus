use crate::commands::api::get_platform_url;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
pub async fn open_platform_login(platform: String, app: AppHandle) -> Result<(), String> {
    let url = get_platform_url(&platform)
        .ok_or_else(|| format!("Unknown platform: {}", platform))?;

    let label = format!("login-{}", platform);

    // Check if window already exists
    if let Some(window) = app.get_webview_window(&label) {
        // Focus existing window
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Create a visible webview for the user to log in
    let parsed_url: url::Url = url.parse().map_err(|_| "Invalid platform URL")?;
    WebviewWindowBuilder::new(&app, &label, WebviewUrl::External(parsed_url))
        .title(format!("Login to {} - Columbus", platform_display_name(&platform)))
        .inner_size(1200.0, 800.0)
        .visible(true)
        .center()
        .build()
        .map_err(|e| format!("Failed to open login window: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn open_url_in_browser(url: String, app: AppHandle) -> Result<(), String> {
    // Validate URL
    let parsed_url: url::Url = url.parse().map_err(|_| "Invalid URL")?;

    // Only allow http/https URLs
    if parsed_url.scheme() != "http" && parsed_url.scheme() != "https" {
        return Err("Only HTTP/HTTPS URLs are allowed".to_string());
    }

    let label = "columbus-browser";

    // Check if browser window already exists
    if let Some(window) = app.get_webview_window(label) {
        // Navigate to new URL
        let _ = window.navigate(parsed_url);
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Create a new browser window
    WebviewWindowBuilder::new(&app, label, WebviewUrl::External(parsed_url))
        .title("Columbus Browser")
        .inner_size(1200.0, 800.0)
        .visible(true)
        .center()
        .build()
        .map_err(|e| format!("Failed to open browser: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn close_platform_login(platform: String, app: AppHandle) -> Result<(), String> {
    let label = format!("login-{}", platform);

    if let Some(window) = app.get_webview_window(&label) {
        window.close().map_err(|e| e.to_string())?;
    }

    Ok(())
}

fn platform_display_name(platform: &str) -> &str {
    match platform {
        "chatgpt" => "ChatGPT",
        "claude" => "Claude",
        "gemini" => "Gemini",
        "perplexity" => "Perplexity",
        _ => platform,
    }
}
