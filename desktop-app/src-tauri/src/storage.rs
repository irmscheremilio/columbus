use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::Write;
use std::path::PathBuf;

use crate::AuthState;

/// Write to a debug log file for troubleshooting
fn debug_log(msg: &str) {
    let log_path = get_config_dir().join("debug.log");
    if let Ok(mut file) = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
    {
        let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");
        let _ = writeln!(file, "[{}] {}", timestamp, msg);
    }
}

/// Get the config directory path
fn get_config_dir() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("columbus")
}

/// Persistent app data stored locally
#[derive(Clone, Serialize, Deserialize, Default)]
pub struct PersistedState {
    pub auth: Option<PersistedAuth>,
    pub last_product_id: Option<String>,
    /// Per-product configurations keyed by product_id
    #[serde(default)]
    pub product_configs: HashMap<String, ProductConfig>,
}

/// Auth credentials to persist (tokens only, not sensitive user data)
#[derive(Clone, Serialize, Deserialize)]
pub struct PersistedAuth {
    pub access_token: String,
    pub refresh_token: String,
    pub user_id: String,
    pub user_email: String,
    pub expires_at: i64,
}

/// Per-product configuration
#[derive(Clone, Serialize, Deserialize)]
pub struct ProductConfig {
    /// Which platforms are enabled for this product
    pub ready_platforms: Vec<String>,
    /// Number of samples per prompt
    pub samples_per_prompt: u32,
    /// Whether auto-run is enabled for this product
    pub auto_run_enabled: bool,
    /// Target scans per day
    pub scans_per_day: u32,
    /// Date of last auto scan (ISO format: YYYY-MM-DD)
    pub last_auto_scan_date: Option<String>,
    /// Number of scans completed today
    pub scans_today: u32,
}

impl Default for ProductConfig {
    fn default() -> Self {
        Self {
            ready_platforms: Vec::new(),
            samples_per_prompt: 1,
            auto_run_enabled: true,
            scans_per_day: 1,
            last_auto_scan_date: None,
            scans_today: 0,
        }
    }
}

/// Get the path to the config file
fn get_config_path() -> PathBuf {
    let config_dir = get_config_dir();

    // Ensure directory exists
    if !config_dir.exists() {
        debug_log(&format!("Creating config directory: {:?}", config_dir));
        match fs::create_dir_all(&config_dir) {
            Ok(_) => debug_log("Config directory created successfully"),
            Err(e) => debug_log(&format!("ERROR creating config directory: {}", e)),
        }
    }

    config_dir.join("state.json")
}

/// Load persisted state from disk
pub fn load_state() -> PersistedState {
    let path = get_config_path();
    debug_log(&format!("load_state: path = {:?}", path));

    if !path.exists() {
        debug_log("load_state: file does not exist, returning default");
        return PersistedState::default();
    }

    match fs::read_to_string(&path) {
        Ok(content) => {
            debug_log(&format!("load_state: read {} bytes", content.len()));
            serde_json::from_str(&content).unwrap_or_else(|e| {
                debug_log(&format!("load_state: parse error: {}", e));
                PersistedState::default()
            })
        }
        Err(e) => {
            debug_log(&format!("load_state: read error: {}", e));
            PersistedState::default()
        }
    }
}

/// Save persisted state to disk
pub fn save_state(state: &PersistedState) -> Result<(), String> {
    let path = get_config_path();
    debug_log(&format!("save_state: path = {:?}", path));

    let content = serde_json::to_string_pretty(state)
        .map_err(|e| format!("Failed to serialize state: {}", e))?;

    match fs::write(&path, &content) {
        Ok(_) => {
            debug_log(&format!("save_state: saved {} bytes", content.len()));
            Ok(())
        }
        Err(e) => {
            debug_log(&format!("save_state: write error: {}", e));
            Err(format!("Failed to write state file: {}", e))
        }
    }
}

/// Convert AuthState to PersistedAuth for storage
impl From<&AuthState> for Option<PersistedAuth> {
    fn from(auth: &AuthState) -> Self {
        match (&auth.access_token, &auth.refresh_token, &auth.user) {
            (Some(access), Some(refresh), Some(user)) => Some(PersistedAuth {
                access_token: access.clone(),
                refresh_token: refresh.clone(),
                user_id: user.id.clone(),
                user_email: user.email.clone(),
                expires_at: auth.expires_at.unwrap_or(0),
            }),
            _ => None,
        }
    }
}

/// Convert PersistedAuth back to AuthState
impl From<&PersistedAuth> for AuthState {
    fn from(persisted: &PersistedAuth) -> Self {
        AuthState {
            access_token: Some(persisted.access_token.clone()),
            refresh_token: Some(persisted.refresh_token.clone()),
            user: Some(crate::User {
                id: persisted.user_id.clone(),
                email: persisted.user_email.clone(),
            }),
            expires_at: Some(persisted.expires_at),
        }
    }
}

// Helper functions to update specific parts of the state

/// Update auth in persisted state
pub fn update_auth(auth: Option<PersistedAuth>) -> Result<(), String> {
    debug_log(&format!("update_auth: auth present = {}", auth.is_some()));
    let mut state = load_state();
    state.auth = auth;
    save_state(&state)
}

/// Update last selected product
pub fn update_last_product(product_id: Option<String>) -> Result<(), String> {
    debug_log(&format!("update_last_product: {:?}", product_id));
    let mut state = load_state();
    state.last_product_id = product_id;
    save_state(&state)
}

/// Get config for a specific product
pub fn get_product_config(product_id: &str) -> ProductConfig {
    let state = load_state();
    state.product_configs.get(product_id).cloned().unwrap_or_default()
}

/// Update config for a specific product
pub fn update_product_config(product_id: &str, config: &ProductConfig) -> Result<(), String> {
    debug_log(&format!("update_product_config: product={}, platforms={:?}, auto_run={}, scans_per_day={}",
        product_id, config.ready_platforms, config.auto_run_enabled, config.scans_per_day));
    let mut state = load_state();
    state.product_configs.insert(product_id.to_string(), config.clone());
    save_state(&state)
}

/// Get all product configs (for auto-scan to iterate over)
pub fn get_all_product_configs() -> HashMap<String, ProductConfig> {
    load_state().product_configs
}

/// Clear auth (for logout)
pub fn clear_auth() -> Result<(), String> {
    let mut state = load_state();
    state.auth = None;
    save_state(&state)
}
