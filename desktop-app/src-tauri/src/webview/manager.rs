use crate::Citation;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

#[derive(Default)]
pub struct WebviewManager {
    active_webviews: HashSet<String>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct CollectResponse {
    pub response_text: String,
    pub brand_mentioned: bool,
    pub citation_present: bool,
    pub position: Option<i32>,
    pub sentiment: String,
    pub competitor_mentions: Vec<String>,
    pub citations: Vec<Citation>,
}

impl WebviewManager {
    pub fn new() -> Self {
        Self::default()
    }

    pub async fn create_webview(
        &mut self,
        app: &AppHandle,
        label: &str,
        url: &str,
        visible: bool,
    ) -> Result<(), String> {
        let _webview = WebviewWindowBuilder::new(app, label, WebviewUrl::External(url.parse().unwrap()))
            .title("Columbus Scan")
            .inner_size(1200.0, 800.0)
            .visible(visible)
            .build()
            .map_err(|e| format!("Failed to create webview: {}", e))?;

        self.active_webviews.insert(label.to_string());
        Ok(())
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
        let _result = window
            .eval(&script)
            .map_err(|e| format!("Script error: {}", e))?;

        // For now, assume logged in if no error
        // In a full implementation, we'd use IPC to get the result
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

        let script = get_submit_script(platform, prompt);
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

        let script = get_collect_script(platform, brand, competitors);
        window
            .eval(&script)
            .map_err(|e| format!("Script error: {}", e))?;

        // Wait for response to be collected
        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;

        // For now, return a placeholder - in full implementation, use IPC
        Ok(CollectResponse {
            response_text: "Response collected".to_string(),
            brand_mentioned: false,
            citation_present: false,
            position: None,
            sentiment: "neutral".to_string(),
            competitor_mentions: vec![],
            citations: vec![],
        })
    }
}

fn get_login_check_script(platform: &str) -> String {
    match platform {
        "chatgpt" => r#"
            (function() {
                const hasEditor = !!document.querySelector('#prompt-textarea') ||
                                  !!document.querySelector('[data-testid="send-button"]');
                return hasEditor;
            })();
        "#.to_string(),
        "claude" => r#"
            (function() {
                const hasEditor = !!document.querySelector('[contenteditable="true"]') ||
                                  !!document.querySelector('.ProseMirror');
                return hasEditor;
            })();
        "#.to_string(),
        "gemini" => r#"
            (function() {
                const hasEditor = !!document.querySelector('.ql-editor') ||
                                  !!document.querySelector('[contenteditable="true"]');
                return hasEditor;
            })();
        "#.to_string(),
        "perplexity" => r#"
            (function() {
                const hasEditor = !!document.querySelector('textarea[placeholder]') ||
                                  !!document.querySelector('[data-testid="ask-input"]');
                return hasEditor;
            })();
        "#.to_string(),
        _ => "true".to_string(),
    }
}

fn get_submit_script(platform: &str, prompt: &str) -> String {
    let escaped_prompt = prompt.replace('\\', "\\\\").replace('"', "\\\"").replace('\n', "\\n");

    match platform {
        "chatgpt" => format!(r#"
            (async function() {{
                const prompt = "{}";

                // Find textarea
                const textarea = document.querySelector('#prompt-textarea') ||
                                 document.querySelector('textarea[data-id]');
                if (!textarea) return;

                // Focus and set value
                textarea.focus();
                textarea.value = prompt;
                textarea.dispatchEvent(new Event('input', {{ bubbles: true }}));

                await new Promise(r => setTimeout(r, 500));

                // Find and click send button
                const sendBtn = document.querySelector('[data-testid="send-button"]') ||
                                document.querySelector('button[data-testid="fruitjuice-send-button"]');
                if (sendBtn) sendBtn.click();
            }})();
        "#, escaped_prompt),

        "claude" => format!(r#"
            (async function() {{
                const prompt = "{}";

                // Find contenteditable
                const input = document.querySelector('[contenteditable="true"]') ||
                              document.querySelector('.ProseMirror');
                if (!input) return;

                // Set content
                input.focus();
                input.innerHTML = '';
                input.appendChild(document.createTextNode(prompt));
                input.dispatchEvent(new Event('input', {{ bubbles: true }}));

                await new Promise(r => setTimeout(r, 500));

                // Find and click send button
                const buttons = document.querySelectorAll('button');
                for (const btn of buttons) {{
                    const label = btn.getAttribute('aria-label') || '';
                    if (label.toLowerCase().includes('send') || label.toLowerCase().includes('senden')) {{
                        btn.click();
                        break;
                    }}
                }}
            }})();
        "#, escaped_prompt),

        "gemini" => format!(r#"
            (async function() {{
                const prompt = "{}";

                // Find editor
                const editor = document.querySelector('.ql-editor') ||
                               document.querySelector('[contenteditable="true"]');
                if (!editor) return;

                // Set content
                editor.focus();
                editor.innerHTML = '<p>' + prompt + '</p>';
                editor.dispatchEvent(new Event('input', {{ bubbles: true }}));

                await new Promise(r => setTimeout(r, 500));

                // Find send button
                const sendBtn = document.querySelector('[aria-label="Send message"]') ||
                                document.querySelector('button[aria-label*="send"]');
                if (sendBtn) sendBtn.click();
            }})();
        "#, escaped_prompt),

        "perplexity" => format!(r#"
            (async function() {{
                const prompt = "{}";

                // Find textarea
                const textarea = document.querySelector('textarea[placeholder]') ||
                                 document.querySelector('[data-testid="ask-input"]');
                if (!textarea) return;

                // Set value
                textarea.focus();
                textarea.value = prompt;
                textarea.dispatchEvent(new Event('input', {{ bubbles: true }}));

                await new Promise(r => setTimeout(r, 500));

                // Submit
                textarea.dispatchEvent(new KeyboardEvent('keydown', {{
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true
                }}));
            }})();
        "#, escaped_prompt),

        _ => String::new(),
    }
}

fn get_collect_script(_platform: &str, brand: &str, competitors: &[String]) -> String {
    let escaped_brand = brand.replace('\\', "\\\\").replace('"', "\\\"");
    let competitors_json = serde_json::to_string(competitors).unwrap_or_default();

    format!(r#"
        (function() {{
            const brand = "{}";
            const competitors = {};

            // Get response text based on platform
            let responseText = '';
            const selectors = [
                '.markdown',
                '[data-message-author-role="assistant"]',
                '.prose',
                '.response-content',
                '[data-testid="message-content"]'
            ];

            for (const sel of selectors) {{
                const els = document.querySelectorAll(sel);
                if (els.length > 0) {{
                    responseText = els[els.length - 1].innerText || '';
                    break;
                }}
            }}

            // Check brand mention
            const brandMentioned = responseText.toLowerCase().includes(brand.toLowerCase());

            // Check competitor mentions
            const competitorMentions = competitors.filter(c =>
                responseText.toLowerCase().includes(c.toLowerCase())
            );

            // Extract citations (links)
            const citations = [];
            const links = document.querySelectorAll('a[href^="http"]');
            links.forEach((link, i) => {{
                if (link.closest('.response-content, .markdown, .prose')) {{
                    citations.push({{
                        url: link.href,
                        title: link.textContent || '',
                        position: i + 1
                    }});
                }}
            }});

            console.log('Columbus collect:', {{
                responseText: responseText.substring(0, 100),
                brandMentioned,
                competitorMentions,
                citations: citations.length
            }});

            return {{
                responseText,
                brandMentioned,
                citationPresent: citations.length > 0,
                competitorMentions,
                citations
            }};
        }})();
    "#, escaped_brand, competitors_json)
}
