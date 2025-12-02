use crate::storage::{self, CountryPlatformAuth, ProxyConfig};
use crate::AppState;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

// Use the same Supabase URL as the rest of the app
const API_BASE_URL: &str = "https://yvhzxuoqodutmllfhcsa.supabase.co/functions/v1";

#[derive(Serialize, Deserialize, Debug)]
pub struct ProxyConfigResponse {
    pub proxy: ProxyInfo,
    pub countries: Vec<CountryInfo>,
    #[serde(rename = "urlTemplate")]
    pub url_template: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ProxyInfo {
    pub provider: String,
    pub hostname: String,
    #[serde(rename = "portHttp")]
    pub port_http: u16,
    #[serde(rename = "portSocks5")]
    pub port_socks5: u16,
    pub username: String,
    pub password: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CountryInfo {
    pub code: String,
    pub name: String,
    pub flag_emoji: Option<String>,
    pub region: Option<String>,
}

#[derive(Serialize)]
pub struct CountryAuthStatus {
    pub country_code: String,
    pub country_name: String,
    pub flag_emoji: Option<String>,
    pub platforms: HashMap<String, bool>, // platform -> is_authenticated
}

/// Fetch proxy configuration from the API (only works for paid users)
#[tauri::command]
pub async fn fetch_proxy_config(
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<Vec<CountryInfo>, String> {
    println!("[Proxy] fetch_proxy_config called");

    let access_token = {
        let auth = state.auth.lock();
        auth.access_token.clone()
    };

    let token = access_token.ok_or_else(|| {
        println!("[Proxy] Not authenticated");
        "Not authenticated".to_string()
    })?;

    println!("[Proxy] Fetching from API...");

    let client = reqwest::Client::new();
    let response = client
        .get(&format!("{}/proxy-config", API_BASE_URL))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if response.status() == 403 {
        // User doesn't have a paid plan
        return Err("Geo-targeting requires a paid plan. Please upgrade to access this feature.".to_string());
    }

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("API error {}: {}", status, text));
    }

    let config_response: ProxyConfigResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    // Store proxy config locally
    let proxy_config = ProxyConfig {
        provider: config_response.proxy.provider,
        hostname: config_response.proxy.hostname,
        port_http: config_response.proxy.port_http,
        port_socks5: config_response.proxy.port_socks5,
        username: config_response.proxy.username,
        password: config_response.proxy.password,
        fetched_at: chrono::Utc::now().timestamp(),
    };

    storage::update_proxy_config(proxy_config)
        .map_err(|e| format!("Failed to store proxy config: {}", e))?;

    println!("[Proxy] Fetched and stored proxy config, {} countries available", config_response.countries.len());

    Ok(config_response.countries)
}

/// Check if proxy config is available (user has paid plan and config is cached)
#[tauri::command]
pub async fn has_proxy_config() -> Result<bool, String> {
    Ok(storage::get_proxy_config().is_some())
}

/// Clear cached proxy config
#[tauri::command]
pub async fn clear_proxy_config() -> Result<(), String> {
    storage::clear_proxy_config()
}

/// Get all country/platform authentication statuses
#[tauri::command]
pub async fn get_country_auth_statuses(
    countries: Vec<CountryInfo>,
    platforms: Vec<String>,
) -> Result<Vec<CountryAuthStatus>, String> {
    let all_auth = storage::get_all_country_platform_auth();

    let statuses: Vec<CountryAuthStatus> = countries
        .into_iter()
        .map(|country| {
            let mut platform_status = HashMap::new();
            for platform in &platforms {
                let key = format!("{}:{}", country.code.to_lowercase(), platform.to_lowercase());
                let is_auth = all_auth
                    .get(&key)
                    .map(|a| a.is_authenticated)
                    .unwrap_or(false);
                platform_status.insert(platform.clone(), is_auth);
            }
            CountryAuthStatus {
                country_code: country.code,
                country_name: country.name,
                flag_emoji: country.flag_emoji,
                platforms: platform_status,
            }
        })
        .collect();

    Ok(statuses)
}

/// Get authentication status for a specific country/platform
#[tauri::command]
pub async fn get_country_platform_auth(
    country_code: String,
    platform: String,
) -> Result<Option<CountryPlatformAuth>, String> {
    Ok(storage::get_country_platform_auth(&country_code, &platform))
}

/// Update authentication status for a country/platform
#[tauri::command]
pub async fn set_country_platform_auth(
    country_code: String,
    platform: String,
    is_authenticated: bool,
) -> Result<(), String> {
    storage::update_country_platform_auth(&country_code, &platform, is_authenticated)
}

/// Get all authenticated platforms for a country
#[tauri::command]
pub async fn get_authenticated_platforms(country_code: String) -> Result<Vec<String>, String> {
    Ok(storage::get_authenticated_platforms_for_country(&country_code))
}

/// Get all authenticated countries for a platform
#[tauri::command]
pub async fn get_authenticated_countries(platform: String) -> Result<Vec<String>, String> {
    Ok(storage::get_authenticated_countries_for_platform(&platform))
}

/// Update product's scan countries
#[tauri::command]
pub async fn set_product_scan_countries(
    product_id: String,
    scan_countries: Vec<String>,
) -> Result<(), String> {
    let mut config = storage::get_product_config(&product_id);
    config.scan_countries = scan_countries;
    storage::update_product_config(&product_id, &config)
}

/// Get product's scan countries
#[tauri::command]
pub async fn get_product_scan_countries(product_id: String) -> Result<Vec<String>, String> {
    let config = storage::get_product_config(&product_id);
    Ok(config.scan_countries)
}
