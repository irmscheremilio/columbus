use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};

mod autoscan;
mod commands;
mod storage;
mod webview;

pub use commands::*;
pub use storage::*;
pub use webview::*;

// Configuration
pub const SUPABASE_URL: &str = "https://yvhzxuoqodutmllfhcsa.supabase.co";
pub const SUPABASE_ANON_KEY: &str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2aHp4dW9xb2R1dG1sbGZoY3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MDMwOTIsImV4cCI6MjA3OTQ3OTA5Mn0.UxDcyOAGSGKBW26ElQXAyiVC6GRicphIVcrMs8tdkRI";

// Platform URLs
pub const PLATFORM_URLS: &[(&str, &str)] = &[
    ("chatgpt", "https://chatgpt.com/"),
    ("claude", "https://claude.ai/new"),
    ("gemini", "https://gemini.google.com/app"),
    ("perplexity", "https://www.perplexity.ai/"),
];

// Application state
pub struct AppState {
    pub auth: Mutex<AuthState>,
    pub scan: Mutex<ScanState>,
    pub last_product_id: Mutex<Option<String>>,
}

impl Default for AppState {
    fn default() -> Self {
        // Load persisted state on startup
        let persisted = storage::load_state();

        // Restore auth state from persisted data
        let auth_state = match &persisted.auth {
            Some(a) => {
                println!("[AppState] Loaded persisted auth for user: {}", a.user_email);
                println!("[AppState] Token expires at: {}, now: {}", a.expires_at, chrono::Utc::now().timestamp());
                AuthState::from(a)
            }
            None => {
                println!("[AppState] No persisted auth found");
                AuthState::default()
            }
        };

        Self {
            auth: Mutex::new(auth_state),
            scan: Mutex::new(ScanState::default()),
            last_product_id: Mutex::new(persisted.last_product_id),
        }
    }
}

#[derive(Default, Clone, Serialize, Deserialize)]
pub struct AuthState {
    pub access_token: Option<String>,
    pub refresh_token: Option<String>,
    pub user: Option<User>,
    pub expires_at: Option<i64>,
}

#[derive(Default, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub email: String,
}

#[derive(Default, Clone, Serialize, Deserialize)]
pub struct ScanState {
    pub is_running: bool,
    pub phase: String,
    pub scan_session_id: Option<String>,
    pub product_id: Option<String>,
    pub platforms: HashMap<String, PlatformState>,
    pub total_prompts: usize,
    pub completed_prompts: usize,
}

#[derive(Default, Clone, Serialize, Deserialize)]
pub struct PlatformState {
    pub status: String,  // pending, submitting, waiting, collecting, complete, skipped
    pub total: usize,
    pub submitted: usize,
    pub collected: usize,
    pub failed: usize,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Product {
    pub id: String,
    pub name: String,
    pub brand: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Prompt {
    pub id: String,
    pub text: String,
    pub category: Option<String>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ScanProgress {
    pub phase: String,
    pub current: usize,
    pub total: usize,
    pub platforms: HashMap<String, PlatformState>,
}

// ScanResult uses camelCase to match the Supabase API expected format
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanResult {
    pub product_id: String,
    pub scan_session_id: String,
    pub platform: String,
    pub prompt_id: String,
    pub prompt_text: String,
    pub response_text: String,
    pub brand_mentioned: bool,
    pub citation_present: bool,
    pub position: Option<i32>,
    pub sentiment: String,
    pub competitor_mentions: Vec<String>,
    pub citations: Vec<Citation>,
    pub credits_exhausted: bool,
    pub chat_url: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Citation {
    pub url: String,
    pub title: String,
    pub position: i32,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ScanComplete {
    pub total_prompts: usize,
    pub successful_prompts: usize,
    pub mention_rate: f64,
    pub citation_rate: f64,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    println!("[Columbus] Starting application...");

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // When a second instance tries to run, show the existing window
            println!("[Columbus] Second instance detected, focusing existing window");
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .manage(Arc::new(AppState::default()))
        .invoke_handler(tauri::generate_handler![
            commands::auth::login,
            commands::auth::logout,
            commands::auth::get_auth_status,
            commands::auth::login_with_google,
            commands::api::get_status,
            commands::api::get_prompts,
            commands::api::submit_scan_result,
            commands::api::finalize_scan,
            commands::scan::start_scan,
            commands::scan::cancel_scan,
            commands::scan::get_scan_progress,
            commands::platform::open_platform_login,
            commands::platform::close_platform_login,
            commands::platform::open_url_in_browser,
            commands::settings::get_product_config,
            commands::settings::set_product_config,
            commands::settings::get_last_product_id,
            commands::settings::set_last_product_id,
            commands::settings::get_autostart_enabled,
            commands::settings::set_autostart_enabled,
        ])
        .setup(|app| {
            println!("[Columbus] Setup starting...");

            // Build system tray menu
            let show_item = MenuItem::with_id(app, "show", "Show Columbus", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            // Create system tray if we have an icon
            if let Some(icon) = app.default_window_icon().cloned() {
                println!("[Columbus] Creating system tray...");
                let tray_result = TrayIconBuilder::new()
                    .icon(icon)
                    .menu(&menu)
                    .tooltip("Columbus - AI Brand Monitor")
                    .on_menu_event(|app, event| match event.id.as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    })
                    .on_tray_icon_event(|tray, event| {
                        if let TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } = event
                        {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    })
                    .build(app);

                match &tray_result {
                    Ok(_) => println!("[Columbus] System tray created successfully"),
                    Err(e) => {
                        eprintln!("[Columbus] ERROR creating system tray: {}", e);
                    }
                }

                // Store tray handle to keep it alive (important!)
                if let Ok(tray) = tray_result {
                    app.manage(tray);
                }
            } else {
                eprintln!("[Columbus] No window icon available, skipping system tray");
            }

            // Check if started minimized (via --minimized arg)
            let args: Vec<String> = std::env::args().collect();
            if args.contains(&"--minimized".to_string()) {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            }

            // Start the auto-scan scheduler
            println!("[Columbus] Starting auto-scan scheduler...");
            autoscan::start_scheduler(app.handle().clone());

            println!("[Columbus] Setup complete");
            Ok(())
        })
        .on_window_event(|window, event| {
            // Hide window instead of closing when user clicks X
            if let WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
