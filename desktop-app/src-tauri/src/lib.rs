use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

mod commands;
mod webview;

pub use commands::*;
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
#[derive(Default)]
pub struct AppState {
    pub auth: Mutex<AuthState>,
    pub scan: Mutex<ScanState>,
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
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
