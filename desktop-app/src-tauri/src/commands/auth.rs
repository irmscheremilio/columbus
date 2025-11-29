use crate::{AppState, AuthState, User, SUPABASE_ANON_KEY, SUPABASE_URL};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;
use std::io::{BufRead, BufReader, Write};
use std::net::TcpListener;

#[derive(Deserialize)]
struct LoginResponse {
    access_token: String,
    refresh_token: String,
    expires_in: i64,
    user: SupabaseUser,
}

#[derive(Deserialize)]
struct SupabaseUser {
    id: String,
    email: String,
}

#[derive(Serialize)]
pub struct AuthStatusResponse {
    pub authenticated: bool,
    pub user: Option<User>,
}

#[tauri::command]
pub async fn login(
    email: String,
    password: String,
    state: State<'_, Arc<AppState>>,
) -> Result<User, String> {
    let client = reqwest::Client::new();

    let url = format!("{}/auth/v1/token?grant_type=password", SUPABASE_URL);

    let response = client
        .post(&url)
        .header("apikey", SUPABASE_ANON_KEY)
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "email": email,
            "password": password
        }))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Login failed: {}", error_text));
    }

    let login_data: LoginResponse = response
        .json()
        .await
        .map_err(|e| format!("Parse error: {}", e))?;

    let user = User {
        id: login_data.user.id,
        email: login_data.user.email,
    };

    // Store auth state
    {
        let mut auth = state.auth.lock();
        auth.access_token = Some(login_data.access_token);
        auth.refresh_token = Some(login_data.refresh_token);
        auth.user = Some(user.clone());
        auth.expires_at = Some(chrono::Utc::now().timestamp() + login_data.expires_in);
    }

    Ok(user)
}

#[tauri::command]
pub async fn logout(state: State<'_, Arc<AppState>>) -> Result<(), String> {
    let mut auth = state.auth.lock();
    *auth = AuthState::default();
    Ok(())
}

#[tauri::command]
pub async fn get_auth_status(state: State<'_, Arc<AppState>>) -> Result<AuthStatusResponse, String> {
    let auth = state.auth.lock();

    if let Some(ref user) = auth.user {
        // Check if token is expired
        if let Some(expires_at) = auth.expires_at {
            if chrono::Utc::now().timestamp() >= expires_at {
                return Ok(AuthStatusResponse {
                    authenticated: false,
                    user: None,
                });
            }
        }

        Ok(AuthStatusResponse {
            authenticated: true,
            user: Some(user.clone()),
        })
    } else {
        Ok(AuthStatusResponse {
            authenticated: false,
            user: None,
        })
    }
}

#[tauri::command]
pub async fn login_with_google(
    state: State<'_, Arc<AppState>>,
) -> Result<User, String> {
    // Start a local server to receive the OAuth callback
    let listener = TcpListener::bind("127.0.0.1:0")
        .map_err(|e| format!("Failed to start callback server: {}", e))?;

    let port = listener.local_addr()
        .map_err(|e| format!("Failed to get port: {}", e))?
        .port();

    let redirect_uri = format!("http://localhost:{}", port);

    // Build the Supabase OAuth URL
    let auth_url = format!(
        "{}/auth/v1/authorize?provider=google&redirect_to={}",
        SUPABASE_URL,
        urlencoding::encode(&redirect_uri)
    );

    // Open the browser
    open::that(&auth_url).map_err(|e| format!("Failed to open browser: {}", e))?;

    // Wait for the callback (with timeout)
    listener.set_nonblocking(false).ok();

    let (mut stream, _) = listener.accept()
        .map_err(|e| format!("Failed to accept connection: {}", e))?;

    let mut reader = BufReader::new(&stream);
    let mut request_line = String::new();
    reader.read_line(&mut request_line)
        .map_err(|e| format!("Failed to read request: {}", e))?;

    // Parse the URL from the GET request
    let url_part = request_line
        .split_whitespace()
        .nth(1)
        .ok_or("Invalid request")?;

    // Send a response to close the browser tab
    let response = "HTTP/1.1 200 OK\r\n\
                    Content-Type: text/html\r\n\
                    Connection: close\r\n\r\n\
                    <html><body><h1>Login successful!</h1>\
                    <p>You can close this window and return to Columbus.</p>\
                    <script>window.close();</script></body></html>";

    stream.write_all(response.as_bytes()).ok();
    stream.flush().ok();
    drop(stream);

    // Parse tokens from the URL fragment or query
    // Supabase returns tokens in the URL fragment: #access_token=...&refresh_token=...
    let full_url = format!("http://localhost{}", url_part);

    // The tokens might be in the fragment, so we need to check for both
    let (access_token, refresh_token, expires_in) = parse_oauth_tokens(&full_url)?;

    // Get user info from Supabase
    let client = reqwest::Client::new();
    let user_response = client
        .get(&format!("{}/auth/v1/user", SUPABASE_URL))
        .header("Authorization", format!("Bearer {}", access_token))
        .header("apikey", SUPABASE_ANON_KEY)
        .send()
        .await
        .map_err(|e| format!("Failed to get user info: {}", e))?;

    if !user_response.status().is_success() {
        return Err("Failed to get user info".to_string());
    }

    let supabase_user: SupabaseUser = user_response
        .json()
        .await
        .map_err(|e| format!("Failed to parse user: {}", e))?;

    let user = User {
        id: supabase_user.id,
        email: supabase_user.email,
    };

    // Store auth state
    {
        let mut auth = state.auth.lock();
        auth.access_token = Some(access_token);
        auth.refresh_token = Some(refresh_token);
        auth.user = Some(user.clone());
        auth.expires_at = Some(chrono::Utc::now().timestamp() + expires_in);
    }

    Ok(user)
}

fn parse_oauth_tokens(url: &str) -> Result<(String, String, i64), String> {
    // Check for tokens in fragment (#) or query (?)
    let parse_params = |params: &str| -> Option<(String, String, i64)> {
        let mut access_token = None;
        let mut refresh_token = None;
        let mut expires_in = 3600i64;

        for pair in params.split('&') {
            let parts: Vec<&str> = pair.splitn(2, '=').collect();
            if parts.len() == 2 {
                match parts[0] {
                    "access_token" => access_token = Some(parts[1].to_string()),
                    "refresh_token" => refresh_token = Some(parts[1].to_string()),
                    "expires_in" => expires_in = parts[1].parse().unwrap_or(3600),
                    _ => {}
                }
            }
        }

        if let (Some(at), Some(rt)) = (access_token, refresh_token) {
            Some((at, rt, expires_in))
        } else {
            None
        }
    };

    // Try fragment first
    if let Some(fragment_pos) = url.find('#') {
        let fragment = &url[fragment_pos + 1..];
        if let Some(tokens) = parse_params(fragment) {
            return Ok(tokens);
        }
    }

    // Try query params
    if let Some(query_pos) = url.find('?') {
        let query = &url[query_pos + 1..];
        // Handle case where fragment comes after query
        let query = query.split('#').next().unwrap_or(query);
        if let Some(tokens) = parse_params(query) {
            return Ok(tokens);
        }
    }

    Err("No tokens found in OAuth callback".to_string())
}
