//! Commands for managing platform credentials and bulk authentication

use crate::storage::{self, PlatformCredentials};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Response for credential status checks
#[derive(Serialize)]
pub struct CredentialsStatusResponse {
    /// Whether onboarding has been completed
    pub onboarding_completed: bool,
    /// List of platforms with credentials stored
    pub platforms_with_credentials: Vec<String>,
    /// Whether any credentials are stored
    pub has_credentials: bool,
}

/// Response for authentication status
#[derive(Serialize)]
pub struct AuthenticationStatusResponse {
    /// Timestamp of last authentication (unix epoch)
    pub last_authenticated_on: Option<i64>,
    /// Hash of prompt regions at last auth
    pub last_authenticated_hash: Option<String>,
    /// Whether auth is older than 30 days
    pub is_stale: bool,
    /// Whether the current config hash matches stored hash
    pub hash_matches: bool,
    /// Whether re-authentication is needed
    pub needs_reauth: bool,
}

/// Platform credential info (without password for frontend display)
#[derive(Serialize)]
pub struct PlatformCredentialInfo {
    pub platform: String,
    pub email: String,
    pub has_password: bool,
    pub updated_at: Option<i64>,
}

/// Input for saving credentials
#[derive(Deserialize)]
pub struct SaveCredentialsInput {
    pub platform: String,
    pub email: String,
    pub password: String,
}

/// Input for bulk credentials save (onboarding)
#[derive(Deserialize)]
pub struct BulkCredentialsInput {
    pub credentials: Vec<SaveCredentialsInput>,
}

/// Get current credentials status
#[tauri::command]
pub fn get_credentials_status() -> CredentialsStatusResponse {
    CredentialsStatusResponse {
        onboarding_completed: storage::is_onboarding_completed(),
        platforms_with_credentials: storage::get_platforms_with_credentials(),
        has_credentials: storage::has_platform_credentials(),
    }
}

/// Get all stored credentials (without passwords)
#[tauri::command]
pub fn get_all_credentials() -> Vec<PlatformCredentialInfo> {
    storage::get_all_platform_credentials()
        .into_iter()
        .map(|(_, creds)| PlatformCredentialInfo {
            platform: creds.platform,
            email: creds.email,
            has_password: !creds.password.is_empty(),
            updated_at: creds.updated_at,
        })
        .collect()
}

/// Get credentials for a specific platform (without password)
#[tauri::command]
pub fn get_platform_credential_info(platform: String) -> Option<PlatformCredentialInfo> {
    storage::get_platform_credentials(&platform).map(|creds| PlatformCredentialInfo {
        platform: creds.platform,
        email: creds.email,
        has_password: !creds.password.is_empty(),
        updated_at: creds.updated_at,
    })
}

/// Save credentials for a single platform
#[tauri::command]
pub fn save_platform_credentials(
    platform: String,
    email: String,
    password: String,
) -> Result<(), String> {
    storage::update_platform_credentials(&platform, &email, &password)
}

/// Save credentials for multiple platforms (onboarding)
#[tauri::command]
pub fn save_bulk_credentials(credentials: Vec<SaveCredentialsInput>) -> Result<(), String> {
    for cred in credentials {
        storage::update_platform_credentials(&cred.platform, &cred.email, &cred.password)?;
    }
    Ok(())
}

/// Remove credentials for a platform
#[tauri::command]
pub fn delete_platform_credentials(platform: String) -> Result<(), String> {
    storage::remove_platform_credentials(&platform)
}

/// Mark onboarding as completed
#[tauri::command]
pub fn complete_onboarding() -> Result<(), String> {
    storage::set_onboarding_completed(true)
}

/// Get authentication status
#[tauri::command]
pub fn get_authentication_status(current_hash: String) -> AuthenticationStatusResponse {
    let is_stale = storage::is_authentication_stale();
    let hash_matches = storage::does_authentication_hash_match(&current_hash);
    let last_hash = storage::get_platforms_last_authenticated_hash();

    // Need re-auth if: no hash stored, hash doesn't match, or is stale (for warning)
    let needs_reauth = last_hash.is_none() || !hash_matches;

    AuthenticationStatusResponse {
        last_authenticated_on: storage::get_platforms_last_authenticated_on(),
        last_authenticated_hash: last_hash,
        is_stale,
        hash_matches,
        needs_reauth,
    }
}

/// Compute hash from prompt regions map
#[tauri::command]
pub fn compute_config_hash(prompt_regions: HashMap<String, Vec<String>>) -> String {
    storage::compute_prompt_regions_hash(&prompt_regions)
}

/// Update authentication tracking after successful bulk auth
#[tauri::command]
pub fn update_authentication_tracking(hash: String) -> Result<(), String> {
    storage::update_platforms_authentication(&hash)
}

/// Clear all authentication tracking
#[tauri::command]
pub fn clear_auth_tracking() -> Result<(), String> {
    storage::clear_authentication_tracking()
}

/// Get internal credentials for a platform (used by auth flow, includes password)
/// This is internal and not exposed to frontend directly
pub fn get_credentials_for_auth(platform: &str) -> Option<PlatformCredentials> {
    storage::get_platform_credentials(platform)
}
