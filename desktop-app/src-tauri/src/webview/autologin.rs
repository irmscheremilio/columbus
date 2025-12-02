use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

/// Result of login detection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LoginState {
    /// User is logged in and ready to use the platform
    LoggedIn,
    /// User is on login page, can attempt auto-login
    LoginPage,
    /// User needs to enter 2FA code
    TwoFactorRequired { method: TwoFactorMethod },
    /// User needs to click magic link in email
    MagicLinkRequired,
    /// CAPTCHA detected
    CaptchaRequired,
    /// Unknown state
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TwoFactorMethod {
    /// SMS or authenticator code
    Code,
    /// Phone push notification
    PhonePush,
    /// Email code
    EmailCode,
}

/// Detect current login state for a platform
pub async fn detect_login_state(
    app: &AppHandle,
    label: &str,
    platform: &str,
) -> Result<LoginState, String> {
    let window = app
        .get_webview_window(label)
        .ok_or("Webview not found")?;

    let script = get_login_state_detection_script(platform);

    // Execute script and get result via URL hash
    window
        .eval(&script)
        .map_err(|e| format!("Script error: {}", e))?;

    // Wait for script execution
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

    // Read result from URL hash
    let url = window.url().map_err(|e| format!("Failed to get URL: {}", e))?;
    let url_str = url.as_str();

    if let Some(hash_pos) = url_str.find("#COLUMBUS_LOGIN_STATE:") {
        let state = &url_str[hash_pos + 22..];
        return parse_login_state(state);
    }

    Ok(LoginState::Unknown)
}

fn parse_login_state(state: &str) -> Result<LoginState, String> {
    match state {
        "LOGGED_IN" => Ok(LoginState::LoggedIn),
        "LOGIN_PAGE" => Ok(LoginState::LoginPage),
        "2FA_CODE" => Ok(LoginState::TwoFactorRequired { method: TwoFactorMethod::Code }),
        "2FA_PHONE" => Ok(LoginState::TwoFactorRequired { method: TwoFactorMethod::PhonePush }),
        "2FA_EMAIL" => Ok(LoginState::TwoFactorRequired { method: TwoFactorMethod::EmailCode }),
        "MAGIC_LINK" => Ok(LoginState::MagicLinkRequired),
        "CAPTCHA" => Ok(LoginState::CaptchaRequired),
        _ => Ok(LoginState::Unknown),
    }
}

/// Generate JavaScript to detect login state
fn get_login_state_detection_script(platform: &str) -> String {
    match platform {
        "chatgpt" => r#"
            (function() {
                let state = 'UNKNOWN';

                // Check if logged in (has chat input)
                const hasEditor = document.querySelector('#prompt-textarea') ||
                                  document.querySelector('textarea[placeholder*="Message"]') ||
                                  document.querySelector('[contenteditable="true"][data-placeholder]');
                if (hasEditor) {
                    state = 'LOGGED_IN';
                }
                // Check for login page
                else if (document.querySelector('button[data-testid="login-button"]') ||
                         document.querySelector('button[data-action="login"]') ||
                         window.location.pathname.includes('/auth/login')) {
                    state = 'LOGIN_PAGE';
                }
                // Check for 2FA
                else if (document.querySelector('input[name="code"]') ||
                         document.querySelector('input[autocomplete="one-time-code"]')) {
                    state = '2FA_CODE';
                }
                // Check for CAPTCHA
                else if (document.querySelector('.cf-turnstile') ||
                         document.querySelector('[data-callback="onCaptchaSuccess"]') ||
                         document.querySelector('iframe[src*="captcha"]')) {
                    state = 'CAPTCHA';
                }

                window.location.hash = 'COLUMBUS_LOGIN_STATE:' + state;
            })();
        "#.to_string(),

        "claude" => r#"
            (function() {
                let state = 'UNKNOWN';

                // Check if logged in (has chat input)
                const hasEditor = document.querySelector('.ProseMirror') ||
                                  document.querySelector('[contenteditable="true"]') ||
                                  document.querySelector('div[data-placeholder*="Reply"]');
                if (hasEditor) {
                    state = 'LOGGED_IN';
                }
                // Check for login page (email input)
                else if (document.querySelector('input[type="email"][name="email"]') ||
                         document.querySelector('input[autocomplete="email"]')) {
                    state = 'LOGIN_PAGE';
                }
                // Check for magic link confirmation page
                else if (document.body.textContent.includes('Check your email') ||
                         document.body.textContent.includes('click the link') ||
                         document.body.textContent.includes('magic link')) {
                    state = 'MAGIC_LINK';
                }
                // Check for CAPTCHA
                else if (document.querySelector('.cf-turnstile') ||
                         document.querySelector('iframe[src*="captcha"]')) {
                    state = 'CAPTCHA';
                }

                window.location.hash = 'COLUMBUS_LOGIN_STATE:' + state;
            })();
        "#.to_string(),

        "gemini" => r#"
            (function() {
                let state = 'UNKNOWN';

                // Check if logged in (has chat input)
                const hasEditor = document.querySelector('rich-textarea') ||
                                  document.querySelector('.ql-editor') ||
                                  document.querySelector('[contenteditable="true"]') ||
                                  document.querySelector('textarea');
                if (hasEditor && !window.location.hostname.includes('accounts.google')) {
                    state = 'LOGGED_IN';
                }
                // Check for Google login page
                else if (window.location.hostname.includes('accounts.google.com')) {
                    // Check what stage of login we're at
                    if (document.querySelector('input[type="email"]')) {
                        state = 'LOGIN_PAGE';
                    } else if (document.querySelector('input[type="password"]')) {
                        state = 'LOGIN_PAGE'; // Password stage
                    } else if (document.querySelector('input[name="totpPin"]') ||
                               document.querySelector('input[type="tel"][id*="code"]')) {
                        state = '2FA_CODE';
                    } else if (document.body.textContent.includes('Confirm it') ||
                               document.body.textContent.includes('Check your phone')) {
                        state = '2FA_PHONE';
                    }
                }
                // Check for CAPTCHA
                else if (document.querySelector('.g-recaptcha') ||
                         document.querySelector('iframe[src*="recaptcha"]')) {
                    state = 'CAPTCHA';
                }

                window.location.hash = 'COLUMBUS_LOGIN_STATE:' + state;
            })();
        "#.to_string(),

        "perplexity" => r#"
            (function() {
                let state = 'UNKNOWN';

                // Check if logged in (has chat input)
                const hasEditor = document.querySelector('textarea[placeholder*="Ask"]') ||
                                  document.querySelector('textarea[placeholder*="Search"]') ||
                                  document.querySelector('[contenteditable="true"]');
                if (hasEditor) {
                    state = 'LOGGED_IN';
                }
                // Check for login modal/page
                else if (document.querySelector('input[type="email"]') ||
                         document.querySelector('button[data-testid="sign-in-button"]') ||
                         window.location.pathname.includes('/sign-in')) {
                    state = 'LOGIN_PAGE';
                }
                // Check for 2FA
                else if (document.querySelector('input[name="code"]') ||
                         document.querySelector('input[autocomplete="one-time-code"]')) {
                    state = '2FA_CODE';
                }
                // Check for email verification
                else if (document.body.textContent.includes('check your email') ||
                         document.body.textContent.includes('verification email')) {
                    state = '2FA_EMAIL';
                }

                window.location.hash = 'COLUMBUS_LOGIN_STATE:' + state;
            })();
        "#.to_string(),

        _ => r#"
            (function() {
                window.location.hash = 'COLUMBUS_LOGIN_STATE:UNKNOWN';
            })();
        "#.to_string(),
    }
}

/// Fill login credentials and submit
pub async fn fill_and_submit_login(
    app: &AppHandle,
    label: &str,
    platform: &str,
    email: &str,
    password: &str,
) -> Result<(), String> {
    let window = app
        .get_webview_window(label)
        .ok_or("Webview not found")?;

    let script = get_login_fill_script(platform, email, password);

    window
        .eval(&script)
        .map_err(|e| format!("Script error: {}", e))?;

    Ok(())
}

/// Generate JavaScript to fill and submit login form
fn get_login_fill_script(platform: &str, email: &str, password: &str) -> String {
    let escaped_email = email.replace('\\', "\\\\").replace('"', "\\\"");
    let escaped_password = password.replace('\\', "\\\\").replace('"', "\\\"");

    match platform {
        "chatgpt" => format!(r#"
            (async function() {{
                console.log('[Columbus] Auto-login for ChatGPT...');
                const email = "{email}";
                const password = "{password}";

                // Step 1: Click "Log in" button if present
                let loginBtn = document.querySelector('button[data-testid="login-button"]') ||
                               document.querySelector('button[data-action="login"]') ||
                               Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Log in'));
                if (loginBtn) {{
                    loginBtn.click();
                    await new Promise(r => setTimeout(r, 2000));
                }}

                // Step 2: Fill email
                let emailInput = document.querySelector('input[type="email"]') ||
                                 document.querySelector('input[name="email"]') ||
                                 document.querySelector('input[autocomplete="email"]');
                if (emailInput) {{
                    emailInput.focus();
                    emailInput.value = email;
                    emailInput.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    emailInput.dispatchEvent(new Event('change', {{ bubbles: true }}));
                    console.log('[Columbus] Email filled');

                    // Click continue/next button
                    await new Promise(r => setTimeout(r, 500));
                    let continueBtn = document.querySelector('button[type="submit"]') ||
                                      Array.from(document.querySelectorAll('button')).find(b =>
                                          b.textContent.includes('Continue') || b.textContent.includes('Next'));
                    if (continueBtn) {{
                        continueBtn.click();
                        await new Promise(r => setTimeout(r, 2000));
                    }}
                }}

                // Step 3: Fill password
                let passwordInput = document.querySelector('input[type="password"]') ||
                                    document.querySelector('input[name="password"]');
                if (passwordInput) {{
                    passwordInput.focus();
                    passwordInput.value = password;
                    passwordInput.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    passwordInput.dispatchEvent(new Event('change', {{ bubbles: true }}));
                    console.log('[Columbus] Password filled');

                    // Click login button
                    await new Promise(r => setTimeout(r, 500));
                    let submitBtn = document.querySelector('button[type="submit"]') ||
                                    Array.from(document.querySelectorAll('button')).find(b =>
                                        b.textContent.includes('Log in') || b.textContent.includes('Sign in'));
                    if (submitBtn) {{
                        submitBtn.click();
                        console.log('[Columbus] Login submitted');
                    }}
                }}
            }})();
        "#, email = escaped_email, password = escaped_password),

        "claude" => format!(r#"
            (async function() {{
                console.log('[Columbus] Auto-login for Claude (email only - magic link)...');
                const email = "{email}";

                // Claude uses magic link, so we only fill email
                let emailInput = document.querySelector('input[type="email"]') ||
                                 document.querySelector('input[name="email"]') ||
                                 document.querySelector('input[autocomplete="email"]');
                if (emailInput) {{
                    emailInput.focus();
                    emailInput.value = email;
                    emailInput.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    emailInput.dispatchEvent(new Event('change', {{ bubbles: true }}));
                    console.log('[Columbus] Email filled');

                    // Click continue button
                    await new Promise(r => setTimeout(r, 500));
                    let continueBtn = document.querySelector('button[type="submit"]') ||
                                      Array.from(document.querySelectorAll('button')).find(b =>
                                          b.textContent.includes('Continue') || b.textContent.includes('Send'));
                    if (continueBtn) {{
                        continueBtn.click();
                        console.log('[Columbus] Magic link requested - check email');
                    }}
                }}
            }})();
        "#, email = escaped_email),

        "gemini" => format!(r#"
            (async function() {{
                console.log('[Columbus] Auto-login for Gemini (Google)...');
                const email = "{email}";
                const password = "{password}";

                // Check what stage we're at
                let emailInput = document.querySelector('input[type="email"]');
                let passwordInput = document.querySelector('input[type="password"]');

                if (emailInput && emailInput.offsetParent !== null) {{
                    // Email stage
                    emailInput.focus();
                    emailInput.value = email;
                    emailInput.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    console.log('[Columbus] Email filled');

                    await new Promise(r => setTimeout(r, 500));
                    let nextBtn = document.querySelector('#identifierNext') ||
                                  Array.from(document.querySelectorAll('button')).find(b =>
                                      b.textContent.includes('Next'));
                    if (nextBtn) {{
                        nextBtn.click();
                        console.log('[Columbus] Clicked Next after email');
                    }}
                }} else if (passwordInput && passwordInput.offsetParent !== null) {{
                    // Password stage
                    passwordInput.focus();
                    passwordInput.value = password;
                    passwordInput.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    console.log('[Columbus] Password filled');

                    await new Promise(r => setTimeout(r, 500));
                    let nextBtn = document.querySelector('#passwordNext') ||
                                  Array.from(document.querySelectorAll('button')).find(b =>
                                      b.textContent.includes('Next'));
                    if (nextBtn) {{
                        nextBtn.click();
                        console.log('[Columbus] Clicked Next after password');
                    }}
                }}
            }})();
        "#, email = escaped_email, password = escaped_password),

        "perplexity" => format!(r#"
            (async function() {{
                console.log('[Columbus] Auto-login for Perplexity...');
                const email = "{email}";
                const password = "{password}";

                // Click sign in button if on main page
                let signInBtn = document.querySelector('button[data-testid="sign-in-button"]') ||
                                Array.from(document.querySelectorAll('button')).find(b =>
                                    b.textContent.includes('Sign In') || b.textContent.includes('Log in'));
                if (signInBtn) {{
                    signInBtn.click();
                    await new Promise(r => setTimeout(r, 1000));
                }}

                // Fill email
                let emailInput = document.querySelector('input[type="email"]') ||
                                 document.querySelector('input[name="email"]');
                if (emailInput) {{
                    emailInput.focus();
                    emailInput.value = email;
                    emailInput.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    console.log('[Columbus] Email filled');
                }}

                // Fill password if visible
                let passwordInput = document.querySelector('input[type="password"]');
                if (passwordInput) {{
                    passwordInput.focus();
                    passwordInput.value = password;
                    passwordInput.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    console.log('[Columbus] Password filled');
                }}

                // Click submit
                await new Promise(r => setTimeout(r, 500));
                let submitBtn = document.querySelector('button[type="submit"]') ||
                                Array.from(document.querySelectorAll('button')).find(b =>
                                    b.textContent.includes('Continue') || b.textContent.includes('Sign in'));
                if (submitBtn) {{
                    submitBtn.click();
                    console.log('[Columbus] Login submitted');
                }}
            }})();
        "#, email = escaped_email, password = escaped_password),

        _ => String::new(),
    }
}

/// Submit 2FA code
pub async fn submit_two_factor_code(
    app: &AppHandle,
    label: &str,
    platform: &str,
    code: &str,
) -> Result<(), String> {
    let window = app
        .get_webview_window(label)
        .ok_or("Webview not found")?;

    let script = get_2fa_submit_script(platform, code);

    window
        .eval(&script)
        .map_err(|e| format!("Script error: {}", e))?;

    Ok(())
}

/// Generate JavaScript to submit 2FA code
fn get_2fa_submit_script(platform: &str, code: &str) -> String {
    let escaped_code = code.replace('\\', "\\\\").replace('"', "\\\"");

    match platform {
        "chatgpt" | "perplexity" => format!(r#"
            (async function() {{
                console.log('[Columbus] Submitting 2FA code...');
                const code = "{code}";

                let codeInput = document.querySelector('input[name="code"]') ||
                                document.querySelector('input[autocomplete="one-time-code"]') ||
                                document.querySelector('input[type="tel"]');
                if (codeInput) {{
                    codeInput.focus();
                    codeInput.value = code;
                    codeInput.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    console.log('[Columbus] 2FA code filled');

                    await new Promise(r => setTimeout(r, 500));
                    let submitBtn = document.querySelector('button[type="submit"]') ||
                                    Array.from(document.querySelectorAll('button')).find(b =>
                                        b.textContent.includes('Verify') || b.textContent.includes('Continue'));
                    if (submitBtn) {{
                        submitBtn.click();
                        console.log('[Columbus] 2FA submitted');
                    }}
                }}
            }})();
        "#, code = escaped_code),

        "gemini" => format!(r#"
            (async function() {{
                console.log('[Columbus] Submitting Google 2FA code...');
                const code = "{code}";

                let codeInput = document.querySelector('input[name="totpPin"]') ||
                                document.querySelector('input[type="tel"]') ||
                                document.querySelector('input[autocomplete="one-time-code"]');
                if (codeInput) {{
                    codeInput.focus();
                    codeInput.value = code;
                    codeInput.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    console.log('[Columbus] 2FA code filled');

                    await new Promise(r => setTimeout(r, 500));
                    let nextBtn = document.querySelector('#totpNext') ||
                                  Array.from(document.querySelectorAll('button')).find(b =>
                                      b.textContent.includes('Next') || b.textContent.includes('Verify'));
                    if (nextBtn) {{
                        nextBtn.click();
                        console.log('[Columbus] 2FA submitted');
                    }}
                }}
            }})();
        "#, code = escaped_code),

        _ => String::new(),
    }
}

/// Check if the page shows a successful login (user is now logged in)
pub async fn verify_login_success(
    app: &AppHandle,
    label: &str,
    platform: &str,
) -> Result<bool, String> {
    // Wait a bit for redirect after login
    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

    let state = detect_login_state(app, label, platform).await?;

    match state {
        LoginState::LoggedIn => Ok(true),
        _ => Ok(false),
    }
}
