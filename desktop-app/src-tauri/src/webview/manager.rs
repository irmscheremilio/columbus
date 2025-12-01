use crate::Citation;
use enigo::{Enigo, Keyboard, Key, Settings, Mouse, Button, Coordinate};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
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
        let user_agent = self.get_user_agent();
        eprintln!("Creating webview {} with User-Agent: {}... (visible: {})", label, &user_agent[..50], visible);

        let _webview = WebviewWindowBuilder::new(app, label, WebviewUrl::External(url.parse().unwrap()))
            .title(format!("Columbus Scan - {}", label))
            .inner_size(1200.0, 800.0)
            .visible(visible)
            .user_agent(user_agent)
            .build()
            .map_err(|e| format!("Failed to create webview: {}", e))?;

        self.active_webviews.insert(label.to_string());
        Ok(())
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
        competitors: &[String],
    ) -> Result<CollectResponse, String> {
        let window = app
            .get_webview_window(label)
            .ok_or("Webview not found")?;

        eprintln!("Collecting response from {} in webview {}", platform, label);

        // Inject script that collects response and sets location.hash with encoded result
        let script = get_collect_script(platform, brand, competitors);
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

        _ => {
            eprintln!("[Columbus] Unknown platform: {}", platform);
            String::new()
        },
    }
}

fn get_collect_script(platform: &str, brand: &str, competitors: &[String]) -> String {
    let escaped_brand = brand.replace('\\', "\\\\").replace('"', "\\\"");
    let competitors_json = serde_json::to_string(competitors).unwrap_or_default();

    format!(r#"
        (function() {{
            console.log('[Columbus] Collecting response for platform: {}');
            const brand = "{}";
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

            // Check for credit exhaustion
            const pageText = document.body?.innerText?.toLowerCase() || '';
            const creditsExhausted = creditChecks.some(indicator =>
                pageText.includes(indicator.toLowerCase())
            );
            console.log('[Columbus] Credits exhausted:', creditsExhausted);

            // Get chat URL (current page URL without hash)
            const chatUrl = window.location.href.split('#')[0];
            console.log('[Columbus] Chat URL:', chatUrl);

            // Check brand mention
            const brandLower = brand.toLowerCase();
            const responseLower = responseText.toLowerCase();
            const brandMentioned = responseLower.includes(brandLower);
            console.log('[Columbus] Brand "' + brand + '" mentioned:', brandMentioned);

            // Check competitor mentions with position calculation
            // Position = rank among all brands (brand + competitors) based on first mention
            const allBrands = [
                {{ name: brand, isBrand: true }},
                ...competitors.map(c => ({{ name: c, isBrand: false }}))
            ];

            // Find first occurrence position of each brand
            const brandPositions = [];
            for (const b of allBrands) {{
                const idx = responseLower.indexOf(b.name.toLowerCase());
                if (idx !== -1) {{
                    brandPositions.push({{ name: b.name, isBrand: b.isBrand, index: idx }});
                }}
            }}

            // Sort by position in text
            brandPositions.sort((a, b) => a.index - b.index);

            // Calculate position (1-indexed rank)
            const competitorMentions = [];
            const competitorDetails = [];
            for (const c of competitors) {{
                const cLower = c.toLowerCase();
                if (responseLower.includes(cLower)) {{
                    competitorMentions.push(c);
                    const rank = brandPositions.findIndex(bp => bp.name.toLowerCase() === cLower);
                    competitorDetails.push({{
                        name: c,
                        position: rank !== -1 ? rank + 1 : null,
                        sentiment: 'neutral'
                    }});
                }}
            }}

            // Also calculate brand position
            let brandPosition = null;
            if (brandMentioned) {{
                const brandRank = brandPositions.findIndex(bp => bp.isBrand);
                if (brandRank !== -1) {{
                    brandPosition = brandRank + 1;
                }}
            }}
            console.log('[Columbus] Brand position:', brandPosition);
            console.log('[Columbus] Competitor mentions:', competitorMentions);
            console.log('[Columbus] Competitor details:', competitorDetails);

            // Extract citations (links) using extension's working selectors
            const citations = [];
            const citationSelectors = [
                '.citation-link',
                '[data-testid="citation"]',
                'a[href^="http"]:not([href*="' + window.location.hostname + '"])',
                '.source-link',
                '[class*="source-number"]',
                '[class*="citation-number"]'
            ];

            // Domains to exclude (AI provider pages, support pages, etc.)
            const excludedDomains = [
                'anthropic.com',
                'claude.ai',
                'openai.com',
                'chat.openai.com',
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

            for (const citeSel of citationSelectors) {{
                try {{
                    const links = document.querySelectorAll(citeSel);
                    links.forEach((link, i) => {{
                        if (link.href && !citations.some(c => c.url === link.href) && !isExcludedDomain(link.href)) {{
                            citations.push({{
                                url: link.href,
                                title: link.textContent || link.title || '',
                                position: citations.length + 1
                            }});
                        }}
                    }});
                }} catch(e) {{}}
            }}
            console.log('[Columbus] Citations found (after filtering):', citations.length);

            // Build result object
            const result = {{
                responseText: responseText.substring(0, 10000), // Limit size for title
                brandMentioned,
                citationPresent: citations.length > 0,
                position: brandPosition,
                sentiment: 'neutral',
                competitorMentions,
                competitorDetails,
                citations: citations.slice(0, 10), // Limit citations
                creditsExhausted,
                chatUrl: responseText.length > 0 ? chatUrl : null
            }};

            // Store result globally for debugging
            window.__columbusResult = result;

            console.log('[Columbus] Collection complete:', JSON.stringify({{
                responseLen: responseText.length,
                brandMentioned,
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
    "#, platform, escaped_brand, competitors_json, platform)
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
