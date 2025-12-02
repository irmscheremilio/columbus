use crate::{AppState, Product, Prompt, ScanResult, SUPABASE_ANON_KEY, SUPABASE_URL};
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;

// Cached AI platforms
lazy_static::lazy_static! {
    static ref CACHED_PLATFORMS: Mutex<Option<Vec<AIPlatform>>> = Mutex::new(None);
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct AIPlatform {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub logo_url: Option<String>,
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub website_url: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct StatusResponse {
    pub user: UserInfo,
    pub products: Vec<Product>,
    #[serde(rename = "activeProduct")]
    pub active_product: Option<Product>,
}

#[derive(Serialize, Deserialize)]
pub struct UserInfo {
    pub id: String,
    pub email: String,
}

#[derive(Serialize, Deserialize)]
pub struct PromptsResponse {
    pub product: ProductInfo,
    pub prompts: Vec<Prompt>,
    pub competitors: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct ProductInfo {
    pub id: String,
    pub name: String,
    pub brand: String,
}

async fn api_request<T: serde::de::DeserializeOwned>(
    endpoint: &str,
    method: &str,
    body: Option<serde_json::Value>,
    state: &State<'_, Arc<AppState>>,
) -> Result<T, String> {
    let token = {
        let auth = state.auth.lock();
        auth.access_token.clone().ok_or("Not authenticated")?
    };

    let client = reqwest::Client::new();
    let url = format!("{}{}", SUPABASE_URL, endpoint);

    let mut request = match method {
        "POST" => client.post(&url),
        _ => client.get(&url),
    };

    request = request
        .header("Authorization", format!("Bearer {}", token))
        .header("apikey", SUPABASE_ANON_KEY)
        .header("Content-Type", "application/json");

    if let Some(b) = body {
        request = request.json(&b);
    }

    let response = request.send().await.map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("API error {}: {}", status, error_text));
    }

    response.json().await.map_err(|e| format!("Parse error: {}", e))
}

#[tauri::command]
pub async fn get_status(state: State<'_, Arc<AppState>>) -> Result<StatusResponse, String> {
    api_request("/functions/v1/extension-status", "GET", None, &state).await
}

#[tauri::command]
pub async fn get_prompts(
    product_id: String,
    state: State<'_, Arc<AppState>>,
) -> Result<PromptsResponse, String> {
    let endpoint = format!("/functions/v1/extension-prompts?productId={}", product_id);
    api_request(&endpoint, "GET", None, &state).await
}

#[tauri::command]
pub async fn submit_scan_result(
    result: ScanResult,
    state: State<'_, Arc<AppState>>,
) -> Result<serde_json::Value, String> {
    api_request(
        "/functions/v1/extension-scan-results",
        "POST",
        Some(serde_json::to_value(&result).map_err(|e| e.to_string())?),
        &state,
    )
    .await
}

#[tauri::command]
pub async fn finalize_scan(
    scan_session_id: String,
    product_id: String,
    state: State<'_, Arc<AppState>>,
) -> Result<serde_json::Value, String> {
    api_request(
        "/functions/v1/extension-finalize-scan",
        "POST",
        Some(serde_json::json!({
            "scanSessionId": scan_session_id,
            "productId": product_id
        })),
        &state,
    )
    .await
}

/// Fetch AI platforms from the database (public, no auth required)
#[tauri::command]
pub async fn get_ai_platforms(force_refresh: Option<bool>) -> Result<Vec<AIPlatform>, String> {
    // Check cache first
    if force_refresh != Some(true) {
        let cache = CACHED_PLATFORMS.lock();
        if let Some(platforms) = cache.as_ref() {
            return Ok(platforms.clone());
        }
    }

    // Fetch from Supabase REST API (public table with RLS allowing SELECT)
    let client = reqwest::Client::new();
    let url = format!("{}/rest/v1/ai_platforms?select=*&order=name", SUPABASE_URL);

    let response = client
        .get(&url)
        .header("apikey", SUPABASE_ANON_KEY)
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch platforms: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("API error {}: {}", status, error_text));
    }

    let platforms: Vec<AIPlatform> = response
        .json()
        .await
        .map_err(|e| format!("Parse error: {}", e))?;

    // Cache the platforms
    {
        let mut cache = CACHED_PLATFORMS.lock();
        *cache = Some(platforms.clone());
    }

    Ok(platforms)
}

/// Get platform URL for opening login. Uses cached platforms or fallback.
pub fn get_platform_url(platform_id: &str) -> Option<String> {
    // Try to get from cache
    let cache = CACHED_PLATFORMS.lock();
    if let Some(platforms) = cache.as_ref() {
        if let Some(p) = platforms.iter().find(|p| p.id == platform_id) {
            return p.website_url.clone();
        }
    }

    // Fallback to hardcoded URLs for common platforms
    match platform_id {
        "chatgpt" => Some("https://chatgpt.com/".to_string()),
        "claude" => Some("https://claude.ai/new".to_string()),
        "gemini" => Some("https://gemini.google.com/app".to_string()),
        "perplexity" => Some("https://www.perplexity.ai/".to_string()),
        _ => None,
    }
}
