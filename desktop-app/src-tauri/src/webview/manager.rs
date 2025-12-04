use crate::Citation;
use crate::storage;
use enigo::{Enigo, Keyboard, Key, Settings, Mouse, Button, Coordinate};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

#[derive(Clone, Serialize, Deserialize, Debug, Default)]
pub struct CompetitorDetail {
    pub name: String,
    pub position: Option<i32>,
    pub sentiment: String,
}

// Multiple realistic User-Agents to rotate through on captcha detection
const USER_AGENTS: &[&str] = &[
    // Chrome 131 (latest stable as of Nov 2024)
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    // Chrome 130
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    // Edge (Chromium-based)
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
    // Firefox
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
];

// Maximum retries for captcha detection
const MAX_CAPTCHA_RETRIES: usize = 3;

#[derive(Default)]
pub struct WebviewManager {
    active_webviews: HashSet<String>,
    user_agent_index: usize,
}

#[derive(Clone, Serialize, Deserialize, Debug, Default)]
pub struct CollectResponse {
    pub response_text: String,
    pub brand_mentioned: bool,
    pub citation_present: bool,
    pub position: Option<i32>,
    pub sentiment: String,
    pub competitor_mentions: Vec<String>,
    pub competitor_details: Vec<CompetitorDetail>,
    pub citations: Vec<Citation>,
    pub credits_exhausted: bool,
    pub chat_url: Option<String>,
}

impl WebviewManager {
    pub fn new() -> Self {
        Self::default()
    }

    /// Get the current User-Agent
    fn get_user_agent(&self) -> &'static str {
        USER_AGENTS[self.user_agent_index % USER_AGENTS.len()]
    }

    /// Rotate to next User-Agent
    fn rotate_user_agent(&mut self) {
        self.user_agent_index = (self.user_agent_index + 1) % USER_AGENTS.len();
        eprintln!("Rotated to User-Agent index {}: {}", self.user_agent_index, &self.get_user_agent()[..50]);
    }

    /// Create a webview with the current User-Agent
    fn create_webview_internal(
        &mut self,
        app: &AppHandle,
        label: &str,
        url: &str,
        visible: bool,
    ) -> Result<(), String> {
        self.create_webview_with_options(app, label, url, visible, None, None)
    }

    /// Create a webview with optional proxy and data directory for geo-targeting
    fn create_webview_with_options(
        &mut self,
        app: &AppHandle,
        label: &str,
        url: &str,
        visible: bool,
        proxy_url: Option<&str>,
        data_dir: Option<PathBuf>,
    ) -> Result<(), String> {
        let user_agent = self.get_user_agent();

        if let Some(proxy) = &proxy_url {
            eprintln!("Creating webview {} with proxy: {}... (visible: {})", label, proxy, visible);
        } else {
            eprintln!("Creating webview {} without proxy (visible: {})", label, visible);
        }

        let mut builder = WebviewWindowBuilder::new(app, label, WebviewUrl::External(url.parse().unwrap()))
            .title(format!("Columbus Scan - {}", label))
            .inner_size(1200.0, 800.0)
            .visible(visible)
            .user_agent(user_agent);

        // Add proxy if specified
        if let Some(proxy) = proxy_url {
            if let Ok(proxy_url_parsed) = proxy.parse() {
                builder = builder.proxy_url(proxy_url_parsed);
                eprintln!("Proxy URL set: {}", proxy);
            } else {
                eprintln!("Warning: Failed to parse proxy URL: {}", proxy);
            }
        }

        // Add data directory for cookie isolation (Windows only, other platforms use dataStoreIdentifier)
        #[cfg(target_os = "windows")]
        if let Some(dir) = data_dir {
            // Ensure directory exists
            if let Err(e) = std::fs::create_dir_all(&dir) {
                eprintln!("Warning: Failed to create data dir {:?}: {}", dir, e);
            } else {
                builder = builder.data_directory(dir.clone());
                eprintln!("Data directory set: {:?}", dir);
            }
        }

        let _webview = builder
            .build()
            .map_err(|e| format!("Failed to create webview: {}", e))?;

        self.active_webviews.insert(label.to_string());
        Ok(())
    }

    /// Create a webview for a specific country (with proxy and isolated cookies)
    pub async fn create_webview_for_country(
        &mut self,
        app: &AppHandle,
        label: &str,
        url: &str,
        visible: bool,
        country_code: &str,
        platform: &str,
    ) -> Result<(), String> {
        // Get proxy URL for this country (async - starts local proxy server)
        let proxy_url = storage::build_proxy_url_async(country_code).await;

        // Get isolated data directory for this country/platform
        let data_dir = storage::ensure_webview_data_dir(country_code, platform)?;

        eprintln!("Creating geo-targeted webview for country={}, platform={}", country_code, platform);

        self.create_webview_with_options(
            app,
            label,
            url,
            visible,
            proxy_url.as_deref(),
            Some(data_dir),
        )
    }

    /// Create a webview for local (user's actual location, no proxy, but still isolated cookies per platform)
    pub fn create_webview_local(
        &mut self,
        app: &AppHandle,
        label: &str,
        url: &str,
        visible: bool,
        platform: &str,
    ) -> Result<(), String> {
        // Get isolated data directory for local/platform
        let data_dir = storage::ensure_webview_data_dir_local(platform)?;

        eprintln!("Creating local webview for platform={}", platform);

        self.create_webview_with_options(
            app,
            label,
            url,
            visible,
            None,
            Some(data_dir),
        )
    }

    /// Show the webview window (for captcha solving)
    fn show_webview(&self, app: &AppHandle, label: &str) {
        if let Some(window) = app.get_webview_window(label) {
            let _ = window.show();
            let _ = window.set_focus();
            eprintln!("Showing webview {} for captcha solving", label);
        }
    }

    /// Hide the webview window
    fn hide_webview(&self, app: &AppHandle, label: &str) {
        if let Some(window) = app.get_webview_window(label) {
            let _ = window.hide();
            eprintln!("Hiding webview {}", label);
        }
    }

    /// Check if the current page is a captcha/bot detection page (URL-based check)
    fn is_captcha_url(&self, app: &AppHandle, label: &str) -> bool {
        let window = match app.get_webview_window(label) {
            Some(w) => w,
            None => return false,
        };

        if let Ok(url) = window.url() {
            let url_str = url.as_str().to_lowercase();
            url_str.contains("/sorry/") ||
               url_str.contains("captcha") ||
               url_str.contains("recaptcha") ||
               url_str.contains("challenge") ||
               url_str.contains("consent.google")
        } else {
            false
        }
    }

    /// Check if the current page is a captcha/bot detection page
    pub async fn check_for_captcha(&self, app: &AppHandle, label: &str) -> bool {
        let window = match app.get_webview_window(label) {
            Some(w) => w,
            None => return false,
        };

        // Check URL for captcha indicators
        if let Ok(url) = window.url() {
            let url_str = url.as_str().to_lowercase();
            if url_str.contains("/sorry/") ||
               url_str.contains("captcha") ||
               url_str.contains("recaptcha") ||
               url_str.contains("challenge") ||
               url_str.contains("consent.google") {
                eprintln!("Captcha detected via URL: {}", url_str);
                return true;
            }
        }

        // Inject script to check page content for captcha indicators
        let captcha_check_script = r#"
            (function() {
                const indicators = [
                    // Google captcha indicators
                    document.querySelector('iframe[src*="recaptcha"]'),
                    document.querySelector('iframe[src*="captcha"]'),
                    document.querySelector('.g-recaptcha'),
                    document.querySelector('#captcha'),
                    document.querySelector('[data-sitekey]'),
                    // Google "unusual traffic" page
                    document.body?.innerText?.includes('unusual traffic'),
                    document.body?.innerText?.includes('not a robot'),
                    document.body?.innerText?.includes('verify you'),
                    document.title?.toLowerCase().includes('captcha'),
                    document.title?.toLowerCase().includes('verify'),
                    // Gemini specific
                    document.querySelector('form[action*="sorry"]'),
                ];

                const hasCaptcha = indicators.some(i => !!i);
                window.location.hash = 'CAPTCHA_CHECK:' + (hasCaptcha ? 'true' : 'false');
            })();
        "#;

        if let Err(e) = window.eval(captcha_check_script) {
            eprintln!("Failed to run captcha check script: {}", e);
            return false;
        }

        // Wait a moment for script to execute
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

        // Read the result from URL hash
        if let Ok(url) = window.url() {
            let url_str = url.as_str();
            if url_str.contains("#CAPTCHA_CHECK:true") {
                eprintln!("Captcha detected via page content check");
                return true;
            }
        }

        false
    }

    /// Try to solve the captcha using real OS-level input
    /// User's approach: click body → Tab → Space with 1s intervals, wait 5s
    async fn try_solve_captcha(&self, app: &AppHandle, label: &str) -> bool {
        let window = match app.get_webview_window(label) {
            Some(w) => w,
            None => return false,
        };

        eprintln!("Attempting to solve captcha for {} using OS-level input...", label);

        // Focus the window first
        if let Err(e) = window.set_focus() {
            eprintln!("Failed to focus window: {}", e);
        }
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

        // Get window position to calculate click coordinates
        let window_pos = match window.outer_position() {
            Ok(pos) => pos,
            Err(e) => {
                eprintln!("Failed to get window position: {}", e);
                return false;
            }
        };

        let window_size = match window.inner_size() {
            Ok(size) => size,
            Err(e) => {
                eprintln!("Failed to get window size: {}", e);
                return false;
            }
        };

        // Calculate click position - center of window for "white space"
        let click_x = window_pos.x + (window_size.width as i32 / 2);
        let click_y = window_pos.y + (window_size.height as i32 / 2);

        eprintln!("Window position: ({}, {}), size: {}x{}",
                 window_pos.x, window_pos.y, window_size.width, window_size.height);
        eprintln!("Will click at screen coordinates: ({}, {})", click_x, click_y);

        // Create enigo instance for OS-level input
        let mut enigo = match Enigo::new(&Settings::default()) {
            Ok(e) => e,
            Err(e) => {
                eprintln!("Failed to create Enigo: {:?}", e);
                return false;
            }
        };

        // Step 1: Click on white space (center of page)
        eprintln!("Step 1: Clicking on white space at ({}, {})...", click_x, click_y);
        if let Err(e) = enigo.move_mouse(click_x, click_y, Coordinate::Abs) {
            eprintln!("Failed to move mouse: {:?}", e);
        }
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        if let Err(e) = enigo.button(Button::Left, enigo::Direction::Click) {
            eprintln!("Failed to click: {:?}", e);
        }
        eprintln!("Step 1 complete: Clicked on page body");

        // Wait 1 second
        tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;

        // Step 2: Press Tab
        eprintln!("Step 2: Pressing Tab...");
        if let Err(e) = enigo.key(Key::Tab, enigo::Direction::Click) {
            eprintln!("Failed to press Tab: {:?}", e);
        }
        eprintln!("Step 2 complete: Pressed Tab");

        // Wait 1 second
        tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;

        // Step 3: Press Space
        eprintln!("Step 3: Pressing Space...");
        if let Err(e) = enigo.key(Key::Space, enigo::Direction::Click) {
            eprintln!("Failed to press Space: {:?}", e);
        }
        eprintln!("Step 3 complete: Pressed Space");

        // Wait 5 seconds for captcha to process
        eprintln!("Waiting 5 seconds for captcha to process...");
        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;

        // Check if still on captcha page
        let still_captcha = self.is_captcha_url(app, label);
        if still_captcha {
            eprintln!("Still on captcha page after solve attempt");
            return false;
        }

        eprintln!("Captcha may have been solved!");
        true
    }

    /// Create webview with captcha detection, auto-solve attempt, and retry logic
    /// Webviews are invisible by default, shown only when captcha needs user interaction
    pub async fn create_webview(
        &mut self,
        app: &AppHandle,
        label: &str,
        url: &str,
        _visible: bool,
    ) -> Result<(), String> {
        for attempt in 0..MAX_CAPTCHA_RETRIES {
            // Create a unique label for retries (close old one first if retrying)
            if attempt > 0 {
                self.close_webview(app, label);
                self.rotate_user_agent();
                // Add delay between retries
                tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
                eprintln!("Retry {} for webview {} with new User-Agent", attempt + 1, label);
            }

            // Create the webview (invisible by default)
            self.create_webview_internal(app, label, url, false)?;

            // Wait for page to load
            tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

            // Check for captcha
            if self.check_for_captcha(app, label).await {
                eprintln!("Captcha detected on attempt {}", attempt + 1);

                // Show the window so user can see and OS-level input can interact
                self.show_webview(app, label);

                // Try to solve the captcha automatically
                let solved = self.try_solve_captcha(app, label).await;

                if solved {
                    // Captcha was solved, hide the window again
                    self.hide_webview(app, label);
                    eprintln!("Captcha solved successfully on attempt {}", attempt + 1);
                    return Ok(());
                }

                // Hide the window before retry
                self.hide_webview(app, label);

                // Captcha not solved
                eprintln!("Captcha not solved, will retry with different User-Agent");
                if attempt == MAX_CAPTCHA_RETRIES - 1 {
                    // Last attempt failed, return error
                    self.close_webview(app, label);
                    return Err(format!("Captcha detected after {} retries", MAX_CAPTCHA_RETRIES));
                }
                continue;
            }

            // No captcha, success! Keep window invisible
            return Ok(());
        }

        Err("Failed to create webview without captcha".to_string())
    }

    /// Create webview with captcha handling for a specific country (geo-targeted)
    /// Uses proxy and isolated cookie storage for the country/platform combination
    pub async fn create_webview_geo(
        &mut self,
        app: &AppHandle,
        label: &str,
        url: &str,
        country_code: &str,
        platform: &str,
    ) -> Result<(), String> {
        // Get proxy URL for this country
        let proxy_url = storage::build_proxy_url(country_code);

        // Get isolated data directory for this country/platform
        let data_dir = storage::ensure_webview_data_dir(country_code, platform)?;

        eprintln!("Creating geo-targeted webview: label={}, country={}, platform={}", label, country_code, platform);

        for attempt in 0..MAX_CAPTCHA_RETRIES {
            if attempt > 0 {
                self.close_webview(app, label);
                self.rotate_user_agent();
                tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
                eprintln!("Retry {} for geo webview {} with new User-Agent", attempt + 1, label);
            }

            // Create the webview with proxy and data directory
            self.create_webview_with_options(
                app,
                label,
                url,
                false,
                proxy_url.as_deref(),
                Some(data_dir.clone()),
            )?;

            // Wait for page to load
            tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

            // Check for captcha
            if self.check_for_captcha(app, label).await {
                eprintln!("Captcha detected on attempt {} (geo)", attempt + 1);
                self.show_webview(app, label);

                let solved = self.try_solve_captcha(app, label).await;

                if solved {
                    self.hide_webview(app, label);
                    eprintln!("Captcha solved successfully on attempt {} (geo)", attempt + 1);
                    return Ok(());
                }

                self.hide_webview(app, label);
                eprintln!("Captcha not solved (geo), will retry with different User-Agent");

                if attempt == MAX_CAPTCHA_RETRIES - 1 {
                    self.close_webview(app, label);
                    return Err(format!("Captcha detected after {} retries (geo)", MAX_CAPTCHA_RETRIES));
                }
                continue;
            }

            // No captcha, success!
            return Ok(());
        }

        Err("Failed to create geo webview without captcha".to_string())
    }

    /// Create webview with captcha handling for local (no proxy, but isolated cookies per platform)
    pub async fn create_webview_local_async(
        &mut self,
        app: &AppHandle,
        label: &str,
        url: &str,
        platform: &str,
    ) -> Result<(), String> {
        // Get isolated data directory for local/platform
        let data_dir = storage::ensure_webview_data_dir_local(platform)?;

        eprintln!("Creating local webview: label={}, platform={}", label, platform);

        for attempt in 0..MAX_CAPTCHA_RETRIES {
            if attempt > 0 {
                self.close_webview(app, label);
                self.rotate_user_agent();
                tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
                eprintln!("Retry {} for local webview {} with new User-Agent", attempt + 1, label);
            }

            // Create the webview with data directory (no proxy)
            self.create_webview_with_options(
                app,
                label,
                url,
                false,
                None,
                Some(data_dir.clone()),
            )?;

            // Wait for page to load
            tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

            // Check for captcha
            if self.check_for_captcha(app, label).await {
                eprintln!("Captcha detected on attempt {} (local)", attempt + 1);
                self.show_webview(app, label);

                let solved = self.try_solve_captcha(app, label).await;

                if solved {
                    self.hide_webview(app, label);
                    eprintln!("Captcha solved successfully on attempt {} (local)", attempt + 1);
                    return Ok(());
                }

                self.hide_webview(app, label);
                eprintln!("Captcha not solved (local), will retry with different User-Agent");

                if attempt == MAX_CAPTCHA_RETRIES - 1 {
                    self.close_webview(app, label);
                    return Err(format!("Captcha detected after {} retries (local)", MAX_CAPTCHA_RETRIES));
                }
                continue;
            }

            // No captcha, success!
            return Ok(());
        }

        Err("Failed to create local webview without captcha".to_string())
    }

    pub fn close_webview(&mut self, app: &AppHandle, label: &str) {
        if let Some(window) = app.get_webview_window(label) {
            let _ = window.close();
        }
        self.active_webviews.remove(label);
    }

    pub fn close_all(&mut self, app: &AppHandle) {
        for label in self.active_webviews.drain() {
            if let Some(window) = app.get_webview_window(&label) {
                let _ = window.close();
            }
        }
    }

    pub async fn check_login(
        &self,
        app: &AppHandle,
        label: &str,
        platform: &str,
    ) -> Result<bool, String> {
        let window = app
            .get_webview_window(label)
            .ok_or("Webview not found")?;

        let script = get_login_check_script(platform);
        window
            .eval(&script)
            .map_err(|e| format!("Script error: {}", e))?;

        // For now, assume logged in if no error
        Ok(true)
    }

    pub async fn submit_prompt(
        &self,
        app: &AppHandle,
        label: &str,
        platform: &str,
        prompt: &str,
    ) -> Result<(), String> {
        let window = app
            .get_webview_window(label)
            .ok_or("Webview not found")?;

        // First log what we're doing
        eprintln!("Submitting prompt to {} in webview {}", platform, label);
        eprintln!("Prompt: {}", &prompt[..prompt.len().min(100)]);

        let script = get_submit_script(platform, prompt);
        eprintln!("Script length: {} chars", script.len());

        window
            .eval(&script)
            .map_err(|e| format!("Script error: {}", e))?;

        Ok(())
    }

    pub async fn collect_response(
        &self,
        app: &AppHandle,
        label: &str,
        platform: &str,
        brand: &str,
        brand_domain: Option<&str>,
        domain_aliases: Option<&[String]>,
        competitors: &[String],
    ) -> Result<CollectResponse, String> {
        let window = app
            .get_webview_window(label)
            .ok_or("Webview not found")?;

        eprintln!("Collecting response from {} in webview {}", platform, label);

        // For Gemini, we need to click the Sources button first to open the sidebar
        if platform == "gemini" {
            let open_sources_script = r#"
                (function() {
                    console.log('[Columbus] Opening Gemini sources sidebar...');
                    // Try to find and click the Sources button
                    const sourcesButton = document.querySelector('button.legacy-sources-sidebar-button, button[class*="sources-sidebar"], button mat-icon[fonticon="link"]');
                    if (sourcesButton) {
                        // Find the actual button if we matched the icon
                        const btn = sourcesButton.closest('button') || sourcesButton;
                        btn.click();
                        console.log('[Columbus] Clicked Gemini sources button');
                    } else {
                        console.log('[Columbus] No Gemini sources button found');
                    }
                })();
            "#;
            window.eval(open_sources_script).ok();
            // Wait for sidebar to open
            tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;
        }

        // For Perplexity, click the sources button to expand the sources panel
        if platform == "perplexity" {
            let open_sources_script = r#"
                (function() {
                    console.log('[Columbus] Looking for Perplexity sources button...');
                    // Find button that contains "Quellen" or "Sources" text, or has favicon images inside
                    const buttons = document.querySelectorAll('button');
                    for (const btn of buttons) {
                        const text = btn.textContent?.toLowerCase() || '';
                        // Match buttons with "X Quellen" or "X Sources" text
                        if (/\d+\s*(quellen|sources|source)/i.test(text)) {
                            console.log('[Columbus] Found Perplexity sources button:', text);
                            btn.click();
                            return;
                        }
                        // Also check for button with multiple favicon images (the sources indicator)
                        const favicons = btn.querySelectorAll('img[alt*="favicon"]');
                        if (favicons.length >= 2) {
                            console.log('[Columbus] Found Perplexity sources button via favicons');
                            btn.click();
                            return;
                        }
                    }
                    console.log('[Columbus] No Perplexity sources button found');
                })();
            "#;
            window.eval(open_sources_script).ok();
            // Wait for sources panel to expand
            tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;
        }

        // For Google AI Overview, click "Show more AI Overview" and "Show all" buttons
        if platform == "google_aio" {
            let expand_aio_script = r#"
                (async function() {
                    console.log('[Columbus] Google AIO: Looking for Show more button...');

                    // Click "Show more AI Overview" button if present
                    // Selector: div.Jzkafd[aria-label="Show more AI Overview"] containing div.in7vHe
                    let showMoreBtn = document.querySelector('div.Jzkafd[aria-label="Show more AI Overview"]');
                    if (!showMoreBtn) showMoreBtn = document.querySelector('div[aria-label="Show more AI Overview"]');
                    if (!showMoreBtn) showMoreBtn = document.querySelector('[aria-label*="Show more"][aria-label*="AI Overview"]');

                    if (showMoreBtn) {
                        const clickable = showMoreBtn.querySelector('div.in7vHe') || showMoreBtn;
                        clickable.click();
                        console.log('[Columbus] Google AIO: Clicked Show more button');
                        await new Promise(r => setTimeout(r, 1500));
                    } else {
                        console.log('[Columbus] Google AIO: No Show more button found (may already be expanded)');
                    }

                    // Click "Show all" button to reveal all sources
                    // Selector: div.BjvG9b[aria-label="Show all related links"]
                    let showAllBtn = document.querySelector('div.BjvG9b[aria-label="Show all related links"]');
                    if (!showAllBtn) showAllBtn = document.querySelector('div[aria-label="Show all related links"]');
                    if (!showAllBtn) showAllBtn = document.querySelector('[aria-label*="Show all"]');

                    if (showAllBtn) {
                        showAllBtn.click();
                        console.log('[Columbus] Google AIO: Clicked Show all button');
                        await new Promise(r => setTimeout(r, 1000));
                    } else {
                        console.log('[Columbus] Google AIO: No Show all button found');
                    }
                })();
            "#;
            window.eval(expand_aio_script).ok();
            // Wait for expansions to complete
            tokio::time::sleep(tokio::time::Duration::from_millis(2500)).await;
        }

        // Inject script that collects response and sets location.hash with encoded result
        let script = get_collect_script(platform, brand, brand_domain, domain_aliases, competitors);
        window
            .eval(&script)
            .map_err(|e| format!("Script error: {}", e))?;

        // Wait for script to execute and set the hash
        tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

        // Read the URL which contains our result in the hash
        let url = window.url().map_err(|e| format!("Failed to get URL: {}", e))?;
        let url_str = url.as_str();

        eprintln!("Window URL: {}", &url_str[..url_str.len().min(200)]);

        // Parse the result from URL hash
        if let Some(hash_pos) = url_str.find("#COLUMBUS_RESULT:") {
            let data = &url_str[hash_pos + 17..]; // Skip "#COLUMBUS_RESULT:"
            // Decode base64 and parse JSON
            match decode_base64_and_parse(data) {
                Ok(response) => {
                    eprintln!("Successfully parsed response: brand_mentioned={}, citation_present={}, text_len={}",
                             response.brand_mentioned, response.citation_present, response.response_text.len());
                    return Ok(response);
                }
                Err(e) => {
                    eprintln!("Failed to parse result from hash: {}", e);
                }
            }
        } else {
            eprintln!("URL doesn't contain result marker");
        }

        // Fallback: return empty response if parsing failed
        Ok(CollectResponse::default())
    }
}

fn decode_base64_and_parse(data: &str) -> Result<CollectResponse, String> {
    use std::str;

    // Decode base64
    let decoded = base64_decode(data).map_err(|e| format!("Base64 decode error: {}", e))?;

    // The JavaScript uses btoa(unescape(encodeURIComponent(str))) which produces ASCII-safe base64
    // After decoding, we have a percent-encoded UTF-8 string that needs URL decoding
    let percent_encoded = str::from_utf8(&decoded).map_err(|e| format!("UTF-8 error: {}", e))?;
    let json_str = urlencoding::decode(percent_encoded)
        .map_err(|e| format!("URL decode error: {}", e))?;

    // Parse the JavaScript object format
    let parsed: serde_json::Value = serde_json::from_str(&json_str)
        .map_err(|e| format!("JSON parse error: {}", e))?;

    Ok(CollectResponse {
        response_text: parsed.get("responseText")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        brand_mentioned: parsed.get("brandMentioned")
            .and_then(|v| v.as_bool())
            .unwrap_or(false),
        citation_present: parsed.get("citationPresent")
            .and_then(|v| v.as_bool())
            .unwrap_or(false),
        position: parsed.get("position")
            .and_then(|v| v.as_i64())
            .map(|v| v as i32),
        sentiment: parsed.get("sentiment")
            .and_then(|v| v.as_str())
            .unwrap_or("neutral")
            .to_string(),
        competitor_mentions: parsed.get("competitorMentions")
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter()
                .filter_map(|v| v.as_str().map(|s| s.to_string()))
                .collect())
            .unwrap_or_default(),
        competitor_details: parsed.get("competitorDetails")
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter()
                .filter_map(|v| {
                    Some(CompetitorDetail {
                        name: v.get("name")?.as_str()?.to_string(),
                        position: v.get("position").and_then(|p| p.as_i64()).map(|p| p as i32),
                        sentiment: v.get("sentiment").and_then(|s| s.as_str()).unwrap_or("neutral").to_string(),
                    })
                })
                .collect())
            .unwrap_or_default(),
        citations: parsed.get("citations")
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter()
                .filter_map(|v| {
                    Some(Citation {
                        url: v.get("url")?.as_str()?.to_string(),
                        title: v.get("title").and_then(|t| t.as_str()).unwrap_or("").to_string(),
                        position: v.get("position").and_then(|p| p.as_i64()).unwrap_or(0) as i32,
                    })
                })
                .collect())
            .unwrap_or_default(),
        credits_exhausted: parsed.get("creditsExhausted")
            .and_then(|v| v.as_bool())
            .unwrap_or(false),
        chat_url: parsed.get("chatUrl")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
    })
}

fn base64_decode(input: &str) -> Result<Vec<u8>, String> {
    // Simple base64 decoding
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    // Handle URL-safe base64 variant
    let input = input.trim().replace('-', "+").replace('_', "/");
    let input = input.trim_end_matches('=');

    let mut result = Vec::new();
    let mut buffer = 0u32;
    let mut bits = 0;

    for c in input.chars() {
        let val = CHARS.iter().position(|&x| x == c as u8)
            .ok_or_else(|| format!("Invalid base64 char: {}", c))? as u32;
        buffer = (buffer << 6) | val;
        bits += 6;

        if bits >= 8 {
            bits -= 8;
            result.push((buffer >> bits) as u8);
            buffer &= (1 << bits) - 1;
        }
    }

    Ok(result)
}

fn get_login_check_script(platform: &str) -> String {
    format!(r#"
        console.log('[Columbus] Checking login for {}');
        (function() {{
            const hasEditor = !!document.querySelector('textarea, [contenteditable="true"], .ProseMirror');
            console.log('[Columbus] Has editor:', hasEditor);
            return hasEditor;
        }})();
    "#, platform)
}

fn get_submit_script(platform: &str, prompt: &str) -> String {
    let escaped_prompt = prompt
        .replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('\n', "\\n")
        .replace('\r', "");

    match platform {
        "chatgpt" => format!(r#"
            (async function() {{
                console.log('[Columbus] ChatGPT submit starting...');
                const prompt = "{}";

                // Wait for page to be ready
                await new Promise(r => setTimeout(r, 2000));

                // Find the textarea using extension's working selectors
                let textarea = document.querySelector('#prompt-textarea');
                if (!textarea) textarea = document.querySelector('textarea[data-id]');
                if (!textarea) textarea = document.querySelector('[contenteditable="true"][data-placeholder]');
                if (!textarea) textarea = document.querySelector('textarea[placeholder*="Message"]');
                if (!textarea) textarea = document.querySelector('textarea[placeholder*="Send a message"]');
                if (!textarea) textarea = document.querySelector('textarea');

                console.log('[Columbus] Found textarea:', !!textarea, textarea?.tagName);
                if (!textarea) {{
                    console.error('[Columbus] No textarea found! Page HTML:', document.body.innerHTML.substring(0, 500));
                    return;
                }}

                // Focus
                textarea.focus();
                await new Promise(r => setTimeout(r, 300));

                // Set value based on element type
                if (textarea.contentEditable === 'true' || textarea.tagName === 'DIV') {{
                    // For contenteditable
                    textarea.textContent = prompt;
                    textarea.dispatchEvent(new InputEvent('input', {{ bubbles: true, inputType: 'insertText', data: prompt }}));
                }} else {{
                    // For textarea - use native setter for React
                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                    nativeSetter.call(textarea, prompt);
                    textarea.dispatchEvent(new Event('input', {{ bubbles: true }}));
                }}

                console.log('[Columbus] Prompt inserted, waiting for button...');
                await new Promise(r => setTimeout(r, 1000));

                // Find send button using extension's working selectors
                let sendBtn = document.querySelector('[data-testid="send-button"]:not([disabled])');
                if (!sendBtn) sendBtn = document.querySelector('button[aria-label="Send prompt"]:not([disabled])');
                if (!sendBtn) sendBtn = document.querySelector('button[aria-label="Send"]:not([disabled])');
                if (!sendBtn) sendBtn = document.querySelector('form button[type="submit"]:not([disabled])');

                console.log('[Columbus] Found send button:', !!sendBtn, sendBtn?.disabled);
                if (sendBtn && !sendBtn.disabled) {{
                    sendBtn.click();
                    console.log('[Columbus] Send button clicked!');
                }} else {{
                    console.log('[Columbus] Trying Enter key...');
                    textarea.dispatchEvent(new KeyboardEvent('keydown', {{
                        key: 'Enter',
                        code: 'Enter',
                        keyCode: 13,
                        bubbles: true,
                        cancelable: true
                    }}));
                }}
            }})();
        "#, escaped_prompt),

        "claude" => format!(r#"
            (async function() {{
                console.log('[Columbus] Claude submit starting...');
                const prompt = "{}";

                await new Promise(r => setTimeout(r, 2000));

                // Find input using extension's working selectors
                let input = document.querySelector('.ProseMirror[contenteditable="true"]');
                if (!input) input = document.querySelector('[contenteditable="true"]');
                if (!input) input = document.querySelector('div[data-placeholder]');

                console.log('[Columbus] Found input:', !!input);
                if (!input) {{
                    console.error('[Columbus] No input found!');
                    return;
                }}

                // Focus and set content
                input.focus();
                await new Promise(r => setTimeout(r, 300));

                // Clear and insert text as paragraph
                input.innerHTML = '<p>' + prompt + '</p>';
                input.dispatchEvent(new InputEvent('input', {{ bubbles: true, inputType: 'insertText' }}));

                console.log('[Columbus] Prompt inserted, waiting for button...');
                await new Promise(r => setTimeout(r, 1000));

                // Find send button using extension's multi-language selectors
                let sendBtn = document.querySelector('button[aria-label="Send Message"]:not([disabled])');
                if (!sendBtn) sendBtn = document.querySelector('button[aria-label="Send message"]:not([disabled])');
                if (!sendBtn) sendBtn = document.querySelector('button[aria-label="Send"]:not([disabled])');
                if (!sendBtn) sendBtn = document.querySelector('button[aria-label="Nachricht senden"]:not([disabled])');
                if (!sendBtn) sendBtn = document.querySelector('button[aria-label="Senden"]:not([disabled])');
                if (!sendBtn) sendBtn = document.querySelector('button[aria-label="Envoyer le message"]:not([disabled])');
                if (!sendBtn) sendBtn = document.querySelector('button[aria-label="Envoyer"]:not([disabled])');
                if (!sendBtn) sendBtn = document.querySelector('button[aria-label="Enviar mensaje"]:not([disabled])');
                if (!sendBtn) sendBtn = document.querySelector('button[aria-label="Enviar"]:not([disabled])');
                if (!sendBtn) sendBtn = document.querySelector('[data-testid="send-button"]:not([disabled])');
                if (!sendBtn) sendBtn = document.querySelector('fieldset button[type="button"]:not([disabled])');

                console.log('[Columbus] Found send button:', !!sendBtn);
                if (sendBtn && !sendBtn.disabled) {{
                    sendBtn.click();
                    console.log('[Columbus] Send button clicked!');
                }} else {{
                    console.log('[Columbus] Send button not found or disabled');
                }}
            }})();
        "#, escaped_prompt),

        "gemini" => format!(r#"
            (async function() {{
                console.log('[Columbus] Gemini submit starting...');
                const prompt = "{}";

                await new Promise(r => setTimeout(r, 2000));

                // Find input using extension's working logic for rich-textarea
                let input = null;
                const richTextarea = document.querySelector('rich-textarea');
                console.log('[Columbus] Found rich-textarea:', !!richTextarea);

                if (richTextarea) {{
                    // Gemini's custom textarea - find inner editable
                    input = richTextarea.querySelector('[contenteditable="true"]');
                    if (!input) input = richTextarea.querySelector('.ql-editor');
                    console.log('[Columbus] Inner contenteditable found:', !!input);
                }}
                if (!input) input = document.querySelector('.ql-editor');
                if (!input) input = document.querySelector('[contenteditable="true"]');
                if (!input) input = document.querySelector('textarea');

                console.log('[Columbus] Final input element:', !!input, input?.tagName, input?.className);
                if (!input) {{
                    console.error('[Columbus] No input found! Page content:', document.body.innerHTML.substring(0, 500));
                    return;
                }}

                // Focus and type like extension does
                input.focus();
                await new Promise(r => setTimeout(r, 300));

                // Use textContent like extension (not innerHTML)
                if (input.getAttribute('contenteditable') === 'true' || input.classList.contains('ql-editor')) {{
                    input.textContent = prompt;
                    input.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    // Additional events for Gemini's reactive system
                    input.dispatchEvent(new Event('change', {{ bubbles: true }}));
                    input.dispatchEvent(new Event('blur', {{ bubbles: true }}));
                    input.focus();
                }} else if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {{
                    input.value = prompt;
                    input.dispatchEvent(new Event('input', {{ bubbles: true }}));
                }}

                console.log('[Columbus] Prompt inserted, waiting for button...');
                await new Promise(r => setTimeout(r, 1000));

                // Find send button using extension's working selectors
                let sendBtn = document.querySelector('button[aria-label="Send message"]:not([disabled])');
                if (!sendBtn) sendBtn = document.querySelector('[data-test-id="send-button"]:not([disabled])');
                if (!sendBtn) sendBtn = document.querySelector('button.send-button:not([disabled])');
                if (!sendBtn) sendBtn = document.querySelector('button[type="submit"]:not([disabled])');
                if (!sendBtn) sendBtn = document.querySelector('mat-icon-button[aria-label*="Send"]:not([disabled])');

                // Try to find any button with send-related SVG icon
                if (!sendBtn) {{
                    const buttons = document.querySelectorAll('button:not([disabled])');
                    for (const btn of buttons) {{
                        const svg = btn.querySelector('svg');
                        if (svg && (btn.closest('form') || btn.closest('rich-textarea'))) {{
                            sendBtn = btn;
                            console.log('[Columbus] Found send button via SVG search');
                            break;
                        }}
                    }}
                }}

                console.log('[Columbus] Found send button:', !!sendBtn);
                if (sendBtn && !sendBtn.disabled) {{
                    sendBtn.click();
                    console.log('[Columbus] Send button clicked!');
                }} else {{
                    // Try Enter key as fallback
                    console.log('[Columbus] Trying Enter key...');
                    input.dispatchEvent(new KeyboardEvent('keydown', {{
                        key: 'Enter',
                        code: 'Enter',
                        keyCode: 13,
                        which: 13,
                        bubbles: true
                    }}));
                }}
            }})();
        "#, escaped_prompt),

        "perplexity" => format!(r#"
            (async function() {{
                console.log('[Columbus] Perplexity submit starting...');
                const prompt = "{}";

                await new Promise(r => setTimeout(r, 2000));

                // Find input using extension's working selectors (Lexical editor)
                let input = document.querySelector('#ask-input');
                if (!input) input = document.querySelector('[data-lexical-editor="true"]');
                if (!input) input = document.querySelector('[role="textbox"][contenteditable="true"]');
                if (!input) input = document.querySelector('[contenteditable="true"][data-lexical-editor]');
                if (!input) input = document.querySelector('textarea[placeholder*="Ask"]');
                if (!input) input = document.querySelector('textarea[placeholder*="ask"]');
                if (!input) input = document.querySelector('[data-testid="search-input"]');
                if (!input) input = document.querySelector('[data-testid="query-input"]');
                if (!input) input = document.querySelector('textarea');

                console.log('[Columbus] Found input:', !!input, input?.tagName);
                if (!input) {{
                    console.error('[Columbus] No input found!');
                    return;
                }}

                input.focus();
                await new Promise(r => setTimeout(r, 300));

                // Handle different input types
                if (input.contentEditable === 'true' || input.hasAttribute('data-lexical-editor')) {{
                    // Lexical editor
                    input.textContent = prompt;
                    input.dispatchEvent(new InputEvent('input', {{ bubbles: true, inputType: 'insertText', data: prompt }}));
                }} else if (input.tagName === 'TEXTAREA') {{
                    // Standard textarea with React native setter
                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                    nativeSetter.call(input, prompt);
                    input.dispatchEvent(new Event('input', {{ bubbles: true }}));
                }} else {{
                    input.value = prompt;
                    input.dispatchEvent(new Event('input', {{ bubbles: true }}));
                }}

                console.log('[Columbus] Prompt inserted, waiting for button...');
                await new Promise(r => setTimeout(r, 1000));

                // Find submit button using extension's working selectors
                let submitBtn = document.querySelector('[data-testid="submit-button"]:not([disabled])');
                if (!submitBtn) submitBtn = document.querySelector('button[aria-label="Submit"]:not([disabled])');
                if (!submitBtn) submitBtn = document.querySelector('button[type="submit"]:not([disabled])');

                console.log('[Columbus] Found submit button:', !!submitBtn);
                if (submitBtn && !submitBtn.disabled) {{
                    submitBtn.click();
                    console.log('[Columbus] Submit button clicked!');
                }} else {{
                    console.log('[Columbus] Trying Enter key...');
                    input.dispatchEvent(new KeyboardEvent('keydown', {{
                        key: 'Enter',
                        code: 'Enter',
                        keyCode: 13,
                        bubbles: true
                    }}));
                }}
            }})();
        "#, escaped_prompt),

        "google_aio" => format!(r#"
            (async function() {{
                console.log('[Columbus] Google AI Overview submit starting...');
                const prompt = "{}";

                await new Promise(r => setTimeout(r, 2000));

                // Find Google search input - multiple selector fallbacks
                let input = document.querySelector('textarea[name="q"]');
                if (!input) input = document.querySelector('input[name="q"]');
                if (!input) input = document.querySelector('textarea[title="Search"]');
                if (!input) input = document.querySelector('input[title="Search"]');
                if (!input) input = document.querySelector('textarea[aria-label="Search"]');
                if (!input) input = document.querySelector('input[aria-label="Search"]');
                if (!input) input = document.querySelector('.gLFyf');

                console.log('[Columbus] Found Google search input:', !!input, input?.tagName);
                if (!input) {{
                    console.error('[Columbus] No Google search input found!');
                    return;
                }}

                input.focus();
                await new Promise(r => setTimeout(r, 300));

                // Set value using native setter for React compatibility
                if (input.tagName === 'TEXTAREA') {{
                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                    nativeSetter.call(input, prompt);
                }} else {{
                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    nativeSetter.call(input, prompt);
                }}
                input.dispatchEvent(new Event('input', {{ bubbles: true }}));

                console.log('[Columbus] Prompt inserted, waiting for search...');
                await new Promise(r => setTimeout(r, 500));

                // Submit the search form
                const form = input.closest('form');
                if (form) {{
                    form.submit();
                    console.log('[Columbus] Search form submitted!');
                }} else {{
                    // Fallback: press Enter
                    console.log('[Columbus] No form found, pressing Enter...');
                    input.dispatchEvent(new KeyboardEvent('keydown', {{
                        key: 'Enter',
                        code: 'Enter',
                        keyCode: 13,
                        which: 13,
                        bubbles: true
                    }}));
                }}
            }})();
        "#, escaped_prompt),

        _ => {
            eprintln!("[Columbus] Unknown platform: {}", platform);
            String::new()
        },
    }
}

fn get_collect_script(platform: &str, brand: &str, brand_domain: Option<&str>, domain_aliases: Option<&[String]>, competitors: &[String]) -> String {
    let escaped_brand = brand.replace('\\', "\\\\").replace('"', "\\\"");
    let escaped_domain = brand_domain
        .map(|d| d.replace('\\', "\\\\").replace('"', "\\\""))
        .unwrap_or_default();
    let aliases_json = serde_json::to_string(&domain_aliases.unwrap_or(&[])).unwrap_or_default();
    let competitors_json = serde_json::to_string(competitors).unwrap_or_default();

    format!(r#"
        (function() {{
            console.log('[Columbus] Collecting response for platform: {}');
            const brand = "{}";
            const brandDomain = "{}";
            const domainAliases = {};
            const competitors = {};

            // Platform-specific response selectors from working extension
            const platformSelectors = {{
                'chatgpt': [
                    '[data-message-author-role="assistant"]',
                    '.agent-turn .markdown',
                    '[class*="markdown"]',
                    '.prose'
                ],
                'claude': [
                    '[data-testid="message-content"]',
                    '.font-claude-message',
                    '[class*="claude-message"]',
                    '[class*="assistant-message"]',
                    '.prose',
                    'div[class*="markdown"]'
                ],
                'gemini': [
                    '.model-response-text',
                    'message-content',
                    '[data-message-author-role="model"]',
                    '.response-content',
                    '[class*="model"]',
                    '[class*="response"]'
                ],
                'perplexity': [
                    '[data-testid="answer-content"]',
                    '.prose',
                    '.markdown',
                    '[class*="answer"]',
                    '[class*="response"]'
                ],
                'google_aio': [
                    'div.EyBRub',
                    'div.pOOWX',
                    'div[jsname="dvXlsc"]',
                    'div[class*="EyBRub"]',
                    'div[class*="Jzkafd"]'
                ]
            }};

            // Platform-specific credit exhaustion indicators
            const creditIndicators = {{
                'chatgpt': [
                    "you've reached the limit",
                    "you've hit the limit",
                    "reached your limit",
                    "message limit",
                    "upgrade to plus",
                    "upgrade to chatgpt plus",
                    "limit reached",
                    "usage cap",
                    "too many requests",
                    "rate limit"
                ],
                'claude': [
                    "run out of messages",
                    "out of free messages",
                    "usage limit",
                    "message limit reached",
                    "you've used all",
                    "upgrade to claude pro",
                    "limit reached",
                    "wait until",
                    "rate limit"
                ],
                'gemini': [
                    "quota exceeded",
                    "limit reached",
                    "too many requests",
                    "try again later",
                    "rate limit",
                    "usage limit"
                ],
                'perplexity': [
                    "upgrade to pro",
                    "reached your limit",
                    "out of searches",
                    "limit reached",
                    "pro search limit",
                    "daily limit"
                ]
            }};

            const platform = '{}';
            const selectors = platformSelectors[platform] || Object.values(platformSelectors).flat();
            const creditChecks = creditIndicators[platform] || [];

            // Get response text
            let responseText = '';
            for (const sel of selectors) {{
                const els = document.querySelectorAll(sel);
                console.log('[Columbus] Selector', sel, 'found', els.length, 'elements');
                if (els.length > 0) {{
                    // Get the last (most recent) response
                    responseText = els[els.length - 1].innerText || '';
                    if (responseText.length > 50) {{
                        console.log('[Columbus] Using selector:', sel);
                        break;
                    }}
                }}
            }}

            console.log('[Columbus] Response length:', responseText.length);
            console.log('[Columbus] Response preview:', responseText.substring(0, 300));

            // Validate response - reject non-responses like "Thinking", loading states, etc.
            const invalidResponses = [
                'thinking',
                'thinking...',
                'loading',
                'loading...',
                'generating',
                'generating...',
                'please wait',
                'just a moment',
                'working on it'
            ];
            const responseTrimmed = responseText.trim().toLowerCase();
            const isInvalidResponse = responseText.length < 100 ||
                invalidResponses.some(inv => responseTrimmed === inv || responseTrimmed.startsWith(inv + '\n'));

            if (isInvalidResponse) {{
                console.log('[Columbus] Invalid/incomplete response detected, returning empty');
                responseText = '';
            }}

            // Check for credit exhaustion
            const pageText = document.body?.innerText?.toLowerCase() || '';
            const creditsExhausted = creditChecks.some(indicator =>
                pageText.includes(indicator.toLowerCase())
            );
            console.log('[Columbus] Credits exhausted:', creditsExhausted);

            // Get chat URL (current page URL without hash)
            const chatUrl = window.location.href.split('#')[0];
            console.log('[Columbus] Chat URL:', chatUrl);

            // Check brand mention (basic text search - AI worker will do proper evaluation)
            const brandLower = brand.toLowerCase();
            const responseLower = responseText.toLowerCase();
            const brandMentioned = responseLower.includes(brandLower);
            console.log('[Columbus] Brand "' + brand + '" mentioned:', brandMentioned);

            // Check which competitors are mentioned (names only - AI worker will evaluate position/sentiment)
            const competitorMentions = [];
            const competitorDetails = [];
            for (const c of competitors) {{
                const cLower = c.toLowerCase();
                if (responseLower.includes(cLower)) {{
                    competitorMentions.push(c);
                    // Position and sentiment will be evaluated by AI worker
                    competitorDetails.push({{
                        name: c,
                        position: null,
                        sentiment: 'neutral'
                    }});
                }}
            }}

            console.log('[Columbus] Competitor mentions:', competitorMentions);

            // Extract citations (links) using platform-specific selectors
            const citations = [];

            // Domains to exclude (AI provider pages, support pages, etc.)
            const excludedDomains = [
                'anthropic.com',
                'claude.ai',
                'openai.com',
                'chat.openai.com',
                'chatgpt.com',
                'google.com',
                'gemini.google.com',
                'support.google.com',
                'accounts.google.com',
                'perplexity.ai',
                'microsoft.com',
                'bing.com',
                'copilot.microsoft.com'
            ];

            const isExcludedDomain = (url) => {{
                try {{
                    const hostname = new URL(url).hostname.toLowerCase();
                    return excludedDomains.some(domain =>
                        hostname === domain || hostname.endsWith('.' + domain)
                    );
                }} catch {{
                    return false;
                }}
            }};

            // Clean UTM parameters and tracking from URLs
            const cleanUrl = (url) => {{
                try {{
                    const parsed = new URL(url);
                    // Remove common tracking parameters
                    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(param => {{
                        parsed.searchParams.delete(param);
                    }});
                    return parsed.href;
                }} catch {{
                    return url;
                }}
            }};

            // Platform-specific citation extraction
            if (platform === 'chatgpt') {{
                // ChatGPT uses citation pills with data-testid="webpage-citation-pill"
                // Example: <span data-testid="webpage-citation-pill"><a href="https://...?utm_source=chatgpt.com">
                const citationPills = document.querySelectorAll('[data-testid="webpage-citation-pill"] a[href]');
                console.log('[Columbus] ChatGPT citation pills found:', citationPills.length);
                citationPills.forEach((link, i) => {{
                    const url = cleanUrl(link.href);
                    if (url && !citations.some(c => c.url === url) && !isExcludedDomain(url)) {{
                        // Title is in the inner span
                        const titleSpan = link.querySelector('span.truncate, span[class*="truncate"]');
                        citations.push({{
                            url: url,
                            title: titleSpan?.textContent?.trim() || link.textContent?.trim() || '',
                            position: citations.length + 1
                        }});
                    }}
                }});
            }} else if (platform === 'claude') {{
                // Claude uses inline citations with group/tag class
                // Example: <span class="inline-flex"><a href="..." class="group/tag">
                const claudeCitations = document.querySelectorAll('span.inline-flex a[href^="http"], a.group\\/tag[href^="http"], [class*="inline-flex"] a[href^="http"]');
                console.log('[Columbus] Claude citation elements found:', claudeCitations.length);
                claudeCitations.forEach((link, i) => {{
                    const url = cleanUrl(link.href);
                    if (url && !citations.some(c => c.url === url) && !isExcludedDomain(url)) {{
                        // Title is in nested span with text-nowrap class
                        const titleSpan = link.querySelector('span.text-nowrap, span[class*="truncate"]');
                        citations.push({{
                            url: url,
                            title: titleSpan?.textContent?.trim() || link.textContent?.trim() || '',
                            position: citations.length + 1
                        }});
                    }}
                }});
            }} else if (platform === 'gemini') {{
                // Gemini has sources in a sidebar - check if it's already open or if we need to use the button
                // The sidebar should already be opened by a pre-collection script

                // Look for sources in the sidebar
                const geminiSources = document.querySelectorAll('side-bar-sources inline-source-card a[href], side-bar-sources a[href^="http"], .inline-source-card a[href], .all-sources a[href]');
                console.log('[Columbus] Gemini source cards found:', geminiSources.length);
                geminiSources.forEach((link, i) => {{
                    const url = cleanUrl(link.href);
                    if (url && !citations.some(c => c.url === url) && !isExcludedDomain(url)) {{
                        // Title is in .title element or .source-path
                        const card = link.closest('.inline-source-card-container, inline-source-card, .inline-source-card');
                        const titleEl = card?.querySelector('.title, .source-path, .gds-title-m, .gds-title-s');
                        const domainEl = card?.querySelector('.info, .gds-label-m-alt');
                        citations.push({{
                            url: url,
                            title: titleEl?.textContent?.trim() || link.textContent?.trim() || '',
                            position: citations.length + 1
                        }});
                    }}
                }});

                // Also check for any Sources button to see if there are sources available
                // If button exists and shows "Sources", that means there are sources
                const sourcesButton = document.querySelector('button.legacy-sources-sidebar-button, button[class*="sources-sidebar"]');
                if (sourcesButton && citations.length === 0) {{
                    // Check if button text indicates sources are present
                    const buttonText = sourcesButton.textContent?.toLowerCase() || '';
                    if (buttonText.includes('source')) {{
                        console.log('[Columbus] Gemini Sources button present but sidebar not open - sources may exist');
                    }}
                }}

                // Also check for inline citations in the response text (some Gemini responses have inline links)
                const geminiInlineCites = document.querySelectorAll('message-content a[href^="http"], .model-response-text a[href^="http"], [data-message-author-role="model"] a[href^="http"]');
                geminiInlineCites.forEach((link, i) => {{
                    const url = cleanUrl(link.href);
                    if (url && !citations.some(c => c.url === url) && !isExcludedDomain(url)) {{
                        citations.push({{
                            url: url,
                            title: link.textContent?.trim() || '',
                            position: citations.length + 1
                        }});
                    }}
                }});
            }} else if (platform === 'perplexity') {{
                // Perplexity citations detection - must be VERY specific to avoid false positives
                // Only detect citations when we find the expanded sources panel with source cards

                console.log('[Columbus] Starting Perplexity citation detection...');

                // Look for the specific source card structure from the expanded sources panel
                // Source cards have: div with rounded-lg AND bg-subtler classes, containing favicon img
                // The link wraps the card and has class="group" and target="_blank"

                // First, find all favicon images that indicate a source card
                const faviconImages = document.querySelectorAll('img[alt*="favicon"]');
                console.log('[Columbus] Perplexity favicon images found:', faviconImages.length);

                faviconImages.forEach((favicon) => {{
                    // Navigate up to find the parent link (should be a.group with href)
                    const parentLink = favicon.closest('a[href^="http"][target="_blank"]');
                    if (!parentLink) return;

                    // Verify this is inside a source card (has bg-subtler styling)
                    const sourceCard = parentLink.querySelector('div.bg-subtler') || parentLink.querySelector('div[class*="bg-subtler"]');
                    if (!sourceCard) {{
                        console.log('[Columbus] Perplexity: favicon found but no source card styling, skipping');
                        return;
                    }}

                    const url = cleanUrl(parentLink.href);
                    if (url && !citations.some(c => c.url === url) && !isExcludedDomain(url)) {{
                        // Get title from the card
                        const titleEl = parentLink.querySelector('span.line-clamp-1, span.line-clamp-2, div[class*="text-base"] span');
                        citations.push({{
                            url: url,
                            title: titleEl?.textContent?.trim() || '',
                            position: citations.length + 1
                        }});
                        console.log('[Columbus] Found Perplexity source card:', url);
                    }}
                }});

                // Method 2: Look for inline citation badges (numbered references in text)
                // These have very specific structure: span.citation.inline with data-state and aria-label
                if (citations.length === 0) {{
                    const inlineCitations = document.querySelectorAll('span.citation.inline[data-state][aria-label] a[href^="http"]');
                    console.log('[Columbus] Perplexity inline citation elements:', inlineCitations.length);

                    inlineCitations.forEach((link, i) => {{
                        const url = cleanUrl(link.href);
                        if (url && !citations.some(c => c.url === url) && !isExcludedDomain(url)) {{
                            // Get title from aria-label on parent span
                            const parentSpan = link.closest('span.citation[aria-label]');
                            const title = parentSpan?.getAttribute('aria-label') || '';
                            citations.push({{
                                url: url,
                                title: title,
                                position: citations.length + 1
                            }});
                            console.log('[Columbus] Found Perplexity inline citation:', url);
                        }}
                    }});
                }}

                console.log('[Columbus] Perplexity total citations found:', citations.length);
            }} else if (platform === 'google_aio') {{
                // Google AI Overview citation extraction
                // Sources are in ul.bTFeG containing li.CyMdWb items
                // Each source has: a.NDNGvf for link, div.Nn35F for title, span.R0r5R for source name

                console.log('[Columbus] Starting Google AI Overview citation detection...');

                // Primary selector: sources list after "Show all" is clicked
                const sourceItems = document.querySelectorAll('ul.bTFeG li.CyMdWb');
                console.log('[Columbus] Google AIO source items found:', sourceItems.length);

                sourceItems.forEach((item, i) => {{
                    const link = item.querySelector('a.NDNGvf[href]');
                    if (!link) return;

                    const url = cleanUrl(link.href);
                    if (url && !citations.some(c => c.url === url) && !isExcludedDomain(url)) {{
                        // Get title from div.Nn35F
                        const titleEl = item.querySelector('div.Nn35F');
                        // Get source name from span.R0r5R (optional)
                        const sourceNameEl = item.querySelector('span.R0r5R');
                        const title = titleEl?.textContent?.trim() || '';

                        citations.push({{
                            url: url,
                            title: title,
                            position: citations.length + 1
                        }});
                        console.log('[Columbus] Found Google AIO source:', url, '- Title:', title);
                    }}
                }});

                // Fallback: Try alternative selectors if primary didn't work
                if (citations.length === 0) {{
                    console.log('[Columbus] Google AIO: Trying fallback selectors...');

                    // Try any links within the AI Overview container
                    const aioContainer = document.querySelector('div.EyBRub') || document.querySelector('div[class*="EyBRub"]');
                    if (aioContainer) {{
                        const links = aioContainer.querySelectorAll('a[href^="http"]');
                        links.forEach((link) => {{
                            const url = cleanUrl(link.href);
                            if (url && !citations.some(c => c.url === url) && !isExcludedDomain(url)) {{
                                citations.push({{
                                    url: url,
                                    title: link.textContent?.trim() || '',
                                    position: citations.length + 1
                                }});
                                console.log('[Columbus] Found Google AIO fallback source:', url);
                            }}
                        }});
                    }}
                }}

                console.log('[Columbus] Google AIO total citations found:', citations.length);
            }} else {{
                // Fallback for unknown platforms - generic link extraction
                const genericLinks = document.querySelectorAll('.citation-link a[href], [data-testid="citation"] a[href], a[href^="http"]:not([href*="' + window.location.hostname + '"])');
                genericLinks.forEach((link, i) => {{
                    const url = cleanUrl(link.href);
                    if (url && !citations.some(c => c.url === url) && !isExcludedDomain(url)) {{
                        citations.push({{
                            url: url,
                            title: link.textContent?.trim() || '',
                            position: citations.length + 1
                        }});
                    }}
                }});
            }}

            console.log('[Columbus] Citations found (after filtering):', citations.length);

            // Check if brand domain or any alias is cited (citationPresent means brand was cited, not just any citation exists)
            let brandCited = false;
            if (citations.length > 0) {{
                // Build list of all brand domains to check (main domain + aliases)
                const allBrandDomains = [];
                if (brandDomain) {{
                    allBrandDomains.push(brandDomain.toLowerCase().replace('www.', ''));
                }}
                if (domainAliases && Array.isArray(domainAliases)) {{
                    domainAliases.forEach(alias => {{
                        if (alias) {{
                            allBrandDomains.push(alias.toLowerCase().replace('www.', ''));
                        }}
                    }});
                }}
                console.log('[Columbus] Checking against brand domains:', allBrandDomains);

                brandCited = citations.some(c => {{
                    try {{
                        const citationHostname = new URL(c.url).hostname.toLowerCase().replace('www.', '');
                        // Check if citation domain matches any brand domain (either contains the other)
                        for (const brandDom of allBrandDomains) {{
                            const matches = citationHostname.includes(brandDom) || brandDom.includes(citationHostname);
                            if (matches) {{
                                console.log('[Columbus] BRAND CITED! Citation URL matches brand domain:', c.url, '(matched:', brandDom + ')');
                                return true;
                            }}
                        }}
                        return false;
                    }} catch {{
                        return false;
                    }}
                }});
            }}

            if (citations.length > 0) {{
                console.log('[Columbus] CITATION DETAILS:');
                citations.forEach((c, i) => {{
                    console.log('[Columbus]   Citation ' + (i + 1) + ':');
                    console.log('[Columbus]     URL: ' + c.url);
                    console.log('[Columbus]     Title: ' + c.title);
                }});
                console.log('[Columbus] Brand domain: ' + brandDomain);
                console.log('[Columbus] Domain aliases: ' + JSON.stringify(domainAliases));
                console.log('[Columbus] Brand was cited: ' + brandCited);
            }} else {{
                console.log('[Columbus] NO CITATIONS DETECTED for platform: ' + platform);
            }}

            // Build result object
            // Position and sentiment will be evaluated by AI worker - we only collect raw data here
            // citationPresent = true only if the brand's website was cited, not just any citation exists
            const result = {{
                responseText: responseText.substring(0, 10000), // Limit size
                brandMentioned,
                citationPresent: brandCited,
                position: null,  // AI worker will evaluate
                sentiment: 'neutral',  // AI worker will evaluate
                competitorMentions,
                competitorDetails,  // Position/sentiment will be filled by AI worker
                citations: citations.slice(0, 10), // Limit citations (all citations, not just brand)
                creditsExhausted,
                chatUrl: responseText.length > 0 ? chatUrl : null
            }};

            // Store result globally for debugging
            window.__columbusResult = result;

            console.log('[Columbus] Collection complete:', JSON.stringify({{
                responseLen: responseText.length,
                brandMentioned,
                brandCited,
                competitorCount: competitorMentions.length,
                citationCount: citations.length,
                creditsExhausted,
                chatUrl: result.chatUrl
            }}));

            // Set location.hash with base64-encoded result for Rust to read via window.url()
            try {{
                const jsonStr = JSON.stringify(result);
                const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
                window.location.hash = 'COLUMBUS_RESULT:' + base64;
                console.log('[Columbus] Hash set with result, length:', base64.length);
            }} catch(e) {{
                console.error('[Columbus] Failed to set hash:', e);
            }}

            return result;
        }})();
    "#, platform, escaped_brand, escaped_domain, aliases_json, competitors_json, platform)
}

fn get_read_response_script(_platform: &str, _brand: &str, _competitors: &[String]) -> String {
    // This is a simpler script to just log the current state
    format!(r#"
        console.log('[Columbus] Reading stored result...');
        if (window.__columbusResult) {{
            console.log('[Columbus] Result:', JSON.stringify(window.__columbusResult, null, 2));
        }} else {{
            console.log('[Columbus] No result stored yet');
        }}
    "#)
}
