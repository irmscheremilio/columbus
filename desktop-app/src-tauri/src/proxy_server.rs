//! Local proxy server that forwards requests to IPRoyal with authentication
//!
//! This solves the WebView2 limitation where embedded proxy credentials are not supported.
//! The webview connects to localhost:PORT (no auth), and this server forwards to IPRoyal with auth.

use std::collections::HashMap;
use std::sync::Arc;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::RwLock;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};

/// Manages local proxy servers for different countries
pub struct ProxyServerManager {
    /// Map of country_code -> local port
    servers: Arc<RwLock<HashMap<String, u16>>>,
    /// Starting port for local proxies
    base_port: u16,
}

impl ProxyServerManager {
    pub fn new() -> Self {
        Self {
            servers: Arc::new(RwLock::new(HashMap::new())),
            base_port: 19800, // Start from this port
        }
    }

    /// Get or create a local proxy server for a country
    /// Returns the local port to connect to
    pub async fn get_proxy_port(&self, country_code: &str) -> Result<u16, String> {
        // Check if we already have a server for this country
        {
            let servers = self.servers.read().await;
            if let Some(port) = servers.get(country_code) {
                return Ok(*port);
            }
        }

        // Get proxy config
        let config = crate::storage::get_proxy_config()
            .ok_or("No proxy config available")?;

        // Find an available port
        let port = {
            let servers = self.servers.read().await;
            self.base_port + servers.len() as u16
        };

        // Build upstream proxy URL with auth
        let password_with_country = format!("{}_country-{}", config.password, country_code.to_lowercase());
        let upstream_host = config.hostname.clone();
        let upstream_port = config.port_http;
        let username = config.username.clone();

        // Start the proxy server
        let country = country_code.to_string();

        tokio::spawn(async move {
            if let Err(e) = run_proxy_server(port, upstream_host, upstream_port, username, password_with_country).await {
                eprintln!("[ProxyServer] Error running proxy for {}: {}", country, e);
            }
        });

        // Give the server a moment to start
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        // Store the port
        {
            let mut servers = self.servers.write().await;
            servers.insert(country_code.to_string(), port);
        }

        eprintln!("[ProxyServer] Started local proxy for {} on port {}", country_code, port);
        Ok(port)
    }

    /// Get the local proxy URL for a country
    pub async fn get_local_proxy_url(&self, country_code: &str) -> Result<String, String> {
        let port = self.get_proxy_port(country_code).await?;
        Ok(format!("http://127.0.0.1:{}", port))
    }
}

impl Default for ProxyServerManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Run a local proxy server that forwards to upstream with authentication
async fn run_proxy_server(
    local_port: u16,
    upstream_host: String,
    upstream_port: u16,
    username: String,
    password: String,
) -> Result<(), String> {
    let listener = TcpListener::bind(format!("127.0.0.1:{}", local_port))
        .await
        .map_err(|e| format!("Failed to bind to port {}: {}", local_port, e))?;

    eprintln!("[ProxyServer] Listening on 127.0.0.1:{}", local_port);

    loop {
        match listener.accept().await {
            Ok((client_stream, addr)) => {
                let upstream_host = upstream_host.clone();
                let username = username.clone();
                let password = password.clone();

                tokio::spawn(async move {
                    if let Err(e) = handle_client(
                        client_stream,
                        &upstream_host,
                        upstream_port,
                        &username,
                        &password,
                    ).await {
                        eprintln!("[ProxyServer] Error handling client {}: {}", addr, e);
                    }
                });
            }
            Err(e) => {
                eprintln!("[ProxyServer] Accept error: {}", e);
            }
        }
    }
}

/// Handle a single client connection
async fn handle_client(
    mut client: TcpStream,
    upstream_host: &str,
    upstream_port: u16,
    username: &str,
    password: &str,
) -> Result<(), String> {
    // Read the initial request
    let mut buffer = vec![0u8; 8192];
    let n = client.read(&mut buffer).await
        .map_err(|e| format!("Failed to read from client: {}", e))?;

    if n == 0 {
        return Ok(());
    }

    let request = String::from_utf8_lossy(&buffer[..n]);

    // Check if it's a CONNECT request (HTTPS)
    if request.starts_with("CONNECT ") {
        handle_connect_request(client, &request, upstream_host, upstream_port, username, password).await
    } else {
        handle_http_request(client, &buffer[..n], upstream_host, upstream_port, username, password).await
    }
}

/// Handle CONNECT requests (for HTTPS tunneling)
async fn handle_connect_request(
    mut client: TcpStream,
    request: &str,
    upstream_host: &str,
    upstream_port: u16,
    username: &str,
    password: &str,
) -> Result<(), String> {
    // Connect to upstream proxy
    let mut upstream = TcpStream::connect(format!("{}:{}", upstream_host, upstream_port))
        .await
        .map_err(|e| format!("Failed to connect to upstream: {}", e))?;

    // Build auth header
    let auth = format!("{}:{}", username, password);
    let auth_b64 = BASE64.encode(auth.as_bytes());

    // Forward CONNECT request with auth
    let lines: Vec<&str> = request.lines().collect();
    let mut modified_request = String::new();
    modified_request.push_str(lines[0]); // CONNECT host:port HTTP/1.1
    modified_request.push_str("\r\n");
    modified_request.push_str(&format!("Proxy-Authorization: Basic {}\r\n", auth_b64));

    // Add other headers except any existing Proxy-Authorization
    for line in &lines[1..] {
        if line.is_empty() {
            break;
        }
        if !line.to_lowercase().starts_with("proxy-authorization:") {
            modified_request.push_str(line);
            modified_request.push_str("\r\n");
        }
    }
    modified_request.push_str("\r\n");

    upstream.write_all(modified_request.as_bytes()).await
        .map_err(|e| format!("Failed to write to upstream: {}", e))?;

    // Read upstream response
    let mut response_buf = vec![0u8; 4096];
    let n = upstream.read(&mut response_buf).await
        .map_err(|e| format!("Failed to read upstream response: {}", e))?;

    let response = String::from_utf8_lossy(&response_buf[..n]);

    // Check if connection was established
    if response.contains("200") {
        // Send success to client
        client.write_all(b"HTTP/1.1 200 Connection Established\r\n\r\n").await
            .map_err(|e| format!("Failed to write to client: {}", e))?;

        // Now tunnel the data
        tunnel_data(client, upstream).await
    } else {
        // Forward the error response
        client.write_all(&response_buf[..n]).await
            .map_err(|e| format!("Failed to write error to client: {}", e))?;
        Err(format!("Upstream rejected CONNECT: {}", response.lines().next().unwrap_or("")))
    }
}

/// Handle regular HTTP requests
async fn handle_http_request(
    client: TcpStream,
    request: &[u8],
    upstream_host: &str,
    upstream_port: u16,
    username: &str,
    password: &str,
) -> Result<(), String> {
    // Connect to upstream proxy
    let mut upstream = TcpStream::connect(format!("{}:{}", upstream_host, upstream_port))
        .await
        .map_err(|e| format!("Failed to connect to upstream: {}", e))?;

    // Build auth header
    let auth = format!("{}:{}", username, password);
    let auth_b64 = BASE64.encode(auth.as_bytes());

    // Parse and modify request to add auth
    let request_str = String::from_utf8_lossy(request);
    let lines: Vec<&str> = request_str.lines().collect();

    let mut modified_request = String::new();
    modified_request.push_str(lines[0]); // Request line
    modified_request.push_str("\r\n");
    modified_request.push_str(&format!("Proxy-Authorization: Basic {}\r\n", auth_b64));

    for line in &lines[1..] {
        if !line.to_lowercase().starts_with("proxy-authorization:") {
            modified_request.push_str(line);
            modified_request.push_str("\r\n");
        }
    }

    upstream.write_all(modified_request.as_bytes()).await
        .map_err(|e| format!("Failed to write to upstream: {}", e))?;

    // Forward response back to client
    tunnel_data(client, upstream).await
}

/// Tunnel data bidirectionally between client and upstream
async fn tunnel_data(mut client: TcpStream, mut upstream: TcpStream) -> Result<(), String> {
    let (mut client_read, mut client_write) = client.split();
    let (mut upstream_read, mut upstream_write) = upstream.split();

    let client_to_upstream = async {
        let mut buf = vec![0u8; 8192];
        loop {
            match client_read.read(&mut buf).await {
                Ok(0) => break,
                Ok(n) => {
                    if upstream_write.write_all(&buf[..n]).await.is_err() {
                        break;
                    }
                }
                Err(_) => break,
            }
        }
    };

    let upstream_to_client = async {
        let mut buf = vec![0u8; 8192];
        loop {
            match upstream_read.read(&mut buf).await {
                Ok(0) => break,
                Ok(n) => {
                    if client_write.write_all(&buf[..n]).await.is_err() {
                        break;
                    }
                }
                Err(_) => break,
            }
        }
    };

    tokio::select! {
        _ = client_to_upstream => {}
        _ = upstream_to_client => {}
    }

    Ok(())
}

// Global proxy server manager
lazy_static::lazy_static! {
    pub static ref PROXY_MANAGER: ProxyServerManager = ProxyServerManager::new();
}

/// Get local proxy URL for a country (convenience function)
pub async fn get_local_proxy_for_country(country_code: &str) -> Result<String, String> {
    PROXY_MANAGER.get_local_proxy_url(country_code).await
}
