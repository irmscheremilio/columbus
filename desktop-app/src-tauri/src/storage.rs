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
    /// Cached proxy configuration (fetched from API for paid users)
    #[serde(default)]
    pub proxy_config: Option<ProxyConfig>,
    /// Country/platform authentication status
    /// Key format: "{country_code}:{platform}" e.g., "us:chatgpt"
    #[serde(default)]
    pub country_platform_auth: HashMap<String, CountryPlatformAuth>,
    /// Platform credentials stored locally (per-platform email/password)
    /// Key format: platform name (e.g., "chatgpt", "perplexity")
    #[serde(default)]
    pub platform_credentials: HashMap<String, PlatformCredentials>,
    /// Timestamp of last successful "Authenticate All Platforms" run
    #[serde(default)]
    pub platforms_last_authenticated_on: Option<i64>,
    /// Hash of prompt regions config at time of last authentication
    /// Format: hash of JSON {"promptId": ["region1", "region2"], ...}
    #[serde(default)]
    pub platforms_last_authenticated_hash: Option<String>,
    /// Whether onboarding (initial credential setup) has been completed
    #[serde(default)]
    pub onboarding_completed: bool,
}

/// Proxy configuration from the API
#[derive(Clone, Serialize, Deserialize)]
pub struct ProxyConfig {
    pub provider: String,
    pub hostname: String,
    pub port_http: u16,
    pub port_socks5: u16,
    pub username: String,
    pub password: String,
    /// When the config was last fetched
    pub fetched_at: i64,
}

/// Country information for geo-targeting
#[derive(Clone, Serialize, Deserialize)]
pub struct ProxyCountry {
    pub code: String,
    pub name: String,
    pub flag_emoji: Option<String>,
    pub region: Option<String>,
}

/// Authentication status for a country/platform combination
#[derive(Clone, Serialize, Deserialize)]
pub struct CountryPlatformAuth {
    pub country_code: String,
    pub platform: String,
    pub is_authenticated: bool,
    /// Timestamp of last verification
    pub last_verified: Option<i64>,
    /// Timestamp of last successful login
    pub last_login: Option<i64>,
}

/// Platform login credentials stored locally (plain text)
#[derive(Clone, Serialize, Deserialize)]
pub struct PlatformCredentials {
    pub platform: String,
    pub email: String,
    pub password: String,
    /// When credentials were last updated
    pub updated_at: Option<i64>,
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
    /// Start hour of the scan time window (0-23), default 9 (9 AM)
    #[serde(default = "default_start_hour")]
    pub time_window_start: u32,
    /// End hour of the scan time window (0-23), default 17 (5 PM)
    #[serde(default = "default_end_hour")]
    pub time_window_end: u32,
    /// Date of last auto scan (ISO format: YYYY-MM-DD)
    pub last_auto_scan_date: Option<String>,
    /// Number of scans completed today
    pub scans_today: u32,
    /// Scheduled scan times for today (hours in 24h format)
    #[serde(default)]
    pub scheduled_times: Vec<u32>,
    /// Countries to scan this product in (empty = user's actual location, no proxy)
    #[serde(default)]
    pub scan_countries: Vec<String>,
}

fn default_start_hour() -> u32 { 9 }
fn default_end_hour() -> u32 { 17 }

impl Default for ProductConfig {
    fn default() -> Self {
        Self {
            ready_platforms: Vec::new(),
            samples_per_prompt: 1,
            auto_run_enabled: true,
            scans_per_day: 1,
            time_window_start: 9,
            time_window_end: 17,
            last_auto_scan_date: None,
            scans_today: 0,
            scheduled_times: Vec::new(),
            scan_countries: Vec::new(),
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

// ============== Proxy Configuration ==============

/// Get cached proxy config
pub fn get_proxy_config() -> Option<ProxyConfig> {
    load_state().proxy_config
}

/// Save proxy config (fetched from API)
pub fn update_proxy_config(config: ProxyConfig) -> Result<(), String> {
    debug_log("update_proxy_config: saving proxy configuration");
    let mut state = load_state();
    state.proxy_config = Some(config);
    save_state(&state)
}

/// Clear proxy config (e.g., when user downgrades from paid plan)
pub fn clear_proxy_config() -> Result<(), String> {
    debug_log("clear_proxy_config: removing proxy configuration");
    let mut state = load_state();
    state.proxy_config = None;
    save_state(&state)
}

/// Build a proxy URL for a specific country
/// This now returns a local proxy URL that handles authentication automatically
pub fn build_proxy_url(_country_code: &str) -> Option<String> {
    // We no longer use this synchronously - use build_proxy_url_async instead
    // Return None to indicate async version should be used
    None
}

/// Build a proxy URL asynchronously (starts local proxy server if needed)
pub async fn build_proxy_url_async(country_code: &str) -> Option<String> {
    // Check if proxy config exists
    if get_proxy_config().is_none() {
        return None;
    }

    // Get local proxy URL (this starts a local proxy server that handles auth)
    match crate::proxy_server::get_local_proxy_for_country(country_code).await {
        Ok(url) => {
            eprintln!("[Proxy] Using local proxy for country {}: {}", country_code, url);
            Some(url)
        }
        Err(e) => {
            eprintln!("[Proxy] Failed to get local proxy for {}: {}", country_code, e);
            None
        }
    }
}

/// Get proxy credentials for manual entry or display
pub fn get_proxy_credentials(country_code: &str) -> Option<(String, String)> {
    let config = get_proxy_config()?;
    let password_with_country = format!("{}_country-{}", config.password, country_code.to_lowercase());
    Some((config.username.clone(), password_with_country))
}

// ============== Country/Platform Authentication ==============

/// Generate key for country/platform auth map
fn country_platform_key(country_code: &str, platform: &str) -> String {
    format!("{}:{}", country_code.to_lowercase(), platform.to_lowercase())
}

/// Get authentication status for a country/platform combination
pub fn get_country_platform_auth(country_code: &str, platform: &str) -> Option<CountryPlatformAuth> {
    let state = load_state();
    let key = country_platform_key(country_code, platform);
    state.country_platform_auth.get(&key).cloned()
}

/// Check if a country/platform combination is authenticated
pub fn is_country_platform_authenticated(country_code: &str, platform: &str) -> bool {
    get_country_platform_auth(country_code, platform)
        .map(|auth| auth.is_authenticated)
        .unwrap_or(false)
}

/// Update authentication status for a country/platform combination
pub fn update_country_platform_auth(
    country_code: &str,
    platform: &str,
    is_authenticated: bool,
) -> Result<(), String> {
    debug_log(&format!(
        "update_country_platform_auth: {}:{} = {}",
        country_code, platform, is_authenticated
    ));
    let mut state = load_state();
    let key = country_platform_key(country_code, platform);
    let now = chrono::Utc::now().timestamp();

    let auth = CountryPlatformAuth {
        country_code: country_code.to_lowercase(),
        platform: platform.to_lowercase(),
        is_authenticated,
        last_verified: Some(now),
        last_login: if is_authenticated { Some(now) } else {
            // Preserve last_login if just marking as not authenticated
            state.country_platform_auth.get(&key).and_then(|a| a.last_login)
        },
    };
    state.country_platform_auth.insert(key, auth);
    save_state(&state)
}

/// Get all country/platform auth statuses
pub fn get_all_country_platform_auth() -> HashMap<String, CountryPlatformAuth> {
    load_state().country_platform_auth
}

/// Get all authenticated platforms for a specific country
pub fn get_authenticated_platforms_for_country(country_code: &str) -> Vec<String> {
    let state = load_state();
    let prefix = format!("{}:", country_code.to_lowercase());
    state.country_platform_auth
        .iter()
        .filter(|(key, auth)| key.starts_with(&prefix) && auth.is_authenticated)
        .map(|(_, auth)| auth.platform.clone())
        .collect()
}

/// Get all authenticated countries for a specific platform
pub fn get_authenticated_countries_for_platform(platform: &str) -> Vec<String> {
    let state = load_state();
    let suffix = format!(":{}", platform.to_lowercase());
    state.country_platform_auth
        .iter()
        .filter(|(key, auth)| key.ends_with(&suffix) && auth.is_authenticated)
        .map(|(_, auth)| auth.country_code.clone())
        .collect()
}

/// Clear all country/platform auth (e.g., on logout)
pub fn clear_all_country_platform_auth() -> Result<(), String> {
    debug_log("clear_all_country_platform_auth: clearing all auth statuses");
    let mut state = load_state();
    state.country_platform_auth.clear();
    save_state(&state)
}

// ============== Webview Data Directory ==============

/// Get the data directory for a specific country/platform webview session
/// This provides cookie isolation per country/platform combination
pub fn get_webview_data_dir(country_code: &str, platform: &str) -> PathBuf {
    get_config_dir()
        .join("webview-data")
        .join(country_code.to_lowercase())
        .join(platform.to_lowercase())
}

/// Get the data directory for user's actual location (no proxy)
pub fn get_webview_data_dir_local(platform: &str) -> PathBuf {
    get_config_dir()
        .join("webview-data")
        .join("local")
        .join(platform.to_lowercase())
}

/// Ensure webview data directory exists
pub fn ensure_webview_data_dir(country_code: &str, platform: &str) -> Result<PathBuf, String> {
    let dir = get_webview_data_dir(country_code, platform);
    if !dir.exists() {
        fs::create_dir_all(&dir)
            .map_err(|e| format!("Failed to create webview data dir: {}", e))?;
    }
    Ok(dir)
}

/// Ensure webview data directory exists for local (no proxy)
pub fn ensure_webview_data_dir_local(platform: &str) -> Result<PathBuf, String> {
    let dir = get_webview_data_dir_local(platform);
    if !dir.exists() {
        fs::create_dir_all(&dir)
            .map_err(|e| format!("Failed to create webview data dir: {}", e))?;
    }
    Ok(dir)
}

// ============== Platform Credentials ==============

/// Get credentials for a specific platform
pub fn get_platform_credentials(platform: &str) -> Option<PlatformCredentials> {
    let state = load_state();
    state.platform_credentials.get(&platform.to_lowercase()).cloned()
}

/// Get all platform credentials
pub fn get_all_platform_credentials() -> HashMap<String, PlatformCredentials> {
    load_state().platform_credentials
}

/// Save or update credentials for a platform
pub fn update_platform_credentials(
    platform: &str,
    email: &str,
    password: &str,
) -> Result<(), String> {
    debug_log(&format!(
        "update_platform_credentials: platform={}, email={}",
        platform, email
    ));
    let mut state = load_state();
    let now = chrono::Utc::now().timestamp();

    let creds = PlatformCredentials {
        platform: platform.to_lowercase(),
        email: email.to_string(),
        password: password.to_string(),
        updated_at: Some(now),
    };
    state.platform_credentials.insert(platform.to_lowercase(), creds);
    save_state(&state)
}

/// Remove credentials for a platform
pub fn remove_platform_credentials(platform: &str) -> Result<(), String> {
    debug_log(&format!("remove_platform_credentials: {}", platform));
    let mut state = load_state();
    state.platform_credentials.remove(&platform.to_lowercase());
    save_state(&state)
}

/// Check if any platform credentials are stored
pub fn has_platform_credentials() -> bool {
    !load_state().platform_credentials.is_empty()
}

/// Get list of platforms that have credentials stored
pub fn get_platforms_with_credentials() -> Vec<String> {
    load_state()
        .platform_credentials
        .keys()
        .cloned()
        .collect()
}

// ============== Onboarding & Authentication Tracking ==============

/// Check if onboarding has been completed
pub fn is_onboarding_completed() -> bool {
    load_state().onboarding_completed
}

/// Mark onboarding as completed
pub fn set_onboarding_completed(completed: bool) -> Result<(), String> {
    debug_log(&format!("set_onboarding_completed: {}", completed));
    let mut state = load_state();
    state.onboarding_completed = completed;
    save_state(&state)
}

/// Get the last authentication timestamp
pub fn get_platforms_last_authenticated_on() -> Option<i64> {
    load_state().platforms_last_authenticated_on
}

/// Get the last authentication hash
pub fn get_platforms_last_authenticated_hash() -> Option<String> {
    load_state().platforms_last_authenticated_hash
}

/// Update authentication tracking after successful bulk authentication
pub fn update_platforms_authentication(hash: &str) -> Result<(), String> {
    debug_log(&format!("update_platforms_authentication: hash={}", hash));
    let mut state = load_state();
    let now = chrono::Utc::now().timestamp();
    state.platforms_last_authenticated_on = Some(now);
    state.platforms_last_authenticated_hash = Some(hash.to_string());
    save_state(&state)
}

/// Check if authentication is stale (older than 30 days)
pub fn is_authentication_stale() -> bool {
    const THIRTY_DAYS_SECS: i64 = 30 * 24 * 60 * 60;
    match load_state().platforms_last_authenticated_on {
        Some(timestamp) => {
            let now = chrono::Utc::now().timestamp();
            now - timestamp > THIRTY_DAYS_SECS
        }
        None => true, // No authentication recorded = stale
    }
}

/// Check if authentication hash matches the given hash
pub fn does_authentication_hash_match(current_hash: &str) -> bool {
    match load_state().platforms_last_authenticated_hash {
        Some(stored_hash) => stored_hash == current_hash,
        None => false,
    }
}

/// Compute hash of prompt regions configuration
/// Input: HashMap<prompt_id, Vec<region_code>>
pub fn compute_prompt_regions_hash(prompt_regions: &HashMap<String, Vec<String>>) -> String {
    use std::collections::BTreeMap;

    // Sort for consistent hashing
    let sorted: BTreeMap<&String, &Vec<String>> = prompt_regions.iter().collect();
    let json = serde_json::to_string(&sorted).unwrap_or_default();

    // Simple hash using std (no external crate needed)
    use std::hash::{Hash, Hasher};
    use std::collections::hash_map::DefaultHasher;

    let mut hasher = DefaultHasher::new();
    json.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

/// Clear all authentication tracking (e.g., on logout)
pub fn clear_authentication_tracking() -> Result<(), String> {
    debug_log("clear_authentication_tracking");
    let mut state = load_state();
    state.platforms_last_authenticated_on = None;
    state.platforms_last_authenticated_hash = None;
    save_state(&state)
}
