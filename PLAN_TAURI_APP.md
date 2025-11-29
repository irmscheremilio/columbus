# Columbus Tauri Desktop Application - Implementation Plan

## Overview

Create a Tauri desktop application that replicates the Chrome extension functionality for AI brand visibility scanning. The desktop app will be more stable and reliable than the browser extension.

## Architecture

### Tech Stack
- **Frontend**: HTML/CSS/JavaScript (reuse extension popup UI)
- **Backend**: Rust (Tauri)
- **Webviews**: Tauri's built-in webview (WebView2 on Windows, WebKit on macOS/Linux)

### Core Components

```
desktop-app/
├── src/                    # Rust backend
│   ├── main.rs            # Entry point
│   ├── lib.rs             # Library exports
│   ├── commands/          # Tauri commands
│   │   ├── mod.rs
│   │   ├── auth.rs        # Authentication commands
│   │   ├── scan.rs        # Scan orchestration
│   │   └── api.rs         # Backend API calls
│   ├── webview/           # Webview management
│   │   ├── mod.rs
│   │   └── manager.rs     # Multi-webview orchestration
│   └── scripts/           # Injected JS (embedded)
│       ├── mod.rs
│       ├── chatgpt.js
│       ├── claude.js
│       ├── gemini.js
│       └── perplexity.js
├── src-tauri/             # Tauri config
│   ├── tauri.conf.json
│   ├── Cargo.toml
│   └── icons/
├── ui/                    # Frontend (copied from extension)
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── package.json
```

## Implementation Steps

### Phase 1: Project Setup
1. Initialize Tauri project in `desktop-app/` directory
2. Configure Tauri for multi-window support
3. Set up build scripts and development environment

### Phase 2: Frontend UI
1. Adapt extension popup UI for desktop
2. Create main window with:
   - Login view
   - Product selector
   - Scan control panel
   - Per-platform progress display
3. Add settings for scan configuration

### Phase 3: Rust Backend - Authentication
1. Implement Supabase authentication (email/password)
2. Store tokens securely (using OS keychain via `keyring` crate)
3. Token refresh logic
4. API client for backend communication

### Phase 4: Rust Backend - Webview Management
1. Create webview manager for handling multiple AI platform windows
2. Implement webview creation with proper user agent
3. Cookie/session persistence for AI platform logins
4. JavaScript injection system

### Phase 5: Content Scripts (JavaScript)
1. Port extension content scripts to Tauri-compatible format
2. Adapt for Tauri's `evaluateJavascript` API
3. Implement message passing between injected JS and Rust

### Phase 6: Scan Orchestration
1. Implement scan state machine in Rust
2. Parallel webview management (one per platform per prompt)
3. Progress tracking and UI updates
4. Error handling and retry logic

### Phase 7: Testing & Polish
1. Test on Windows (primary)
2. Test on macOS
3. Add system tray support
4. Add auto-update functionality

## Key Differences from Extension

| Aspect | Extension | Tauri App |
|--------|-----------|-----------|
| Window Management | Chrome APIs (unreliable) | Native Rust (reliable) |
| JS Injection | Content scripts | `evaluateJavascript` |
| Tab Focus | Required, often fails | Not required |
| Background Execution | Service worker (can sleep) | Native process (always on) |
| Cookie Access | Shared with browser | Isolated (need user login) |

## Tauri Commands (Rust → Frontend)

```rust
#[tauri::command]
async fn login(email: String, password: String) -> Result<User, String>

#[tauri::command]
async fn logout() -> Result<(), String>

#[tauri::command]
async fn get_status() -> Result<AppStatus, String>

#[tauri::command]
async fn get_products() -> Result<Vec<Product>, String>

#[tauri::command]
async fn start_scan(product_id: String) -> Result<ScanSession, String>

#[tauri::command]
async fn cancel_scan() -> Result<(), String>

#[tauri::command]
async fn get_scan_progress() -> Result<ScanProgress, String>
```

## Events (Rust → Frontend, real-time)

```rust
// Emitted during scan
app.emit_all("scan:progress", ScanProgressPayload)
app.emit_all("scan:platform_status", PlatformStatusPayload)
app.emit_all("scan:complete", ScanCompletePayload)
app.emit_all("scan:error", ScanErrorPayload)
```

## Webview Injection Flow

```
1. Create hidden webview for platform (e.g., claude.ai/new)
2. Wait for page load (DOMContentLoaded)
3. Inject content script via evaluateJavascript()
4. Script sends ready signal to Rust
5. Rust sends prompt to inject
6. Script enters prompt, clicks send
7. Script waits for response, extracts data
8. Script sends result back to Rust
9. Rust processes result, updates UI, moves to next
```

## Configuration (tauri.conf.json highlights)

```json
{
  "tauri": {
    "windows": [
      {
        "title": "Columbus - AI Brand Monitor",
        "width": 400,
        "height": 600,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "dangerousRemoteUrlIpcAccess": [
        {
          "url": "https://chatgpt.com/*",
          "events": ["scan:*"],
          "commands": ["submit_result"]
        },
        {
          "url": "https://claude.ai/*",
          "events": ["scan:*"],
          "commands": ["submit_result"]
        },
        {
          "url": "https://gemini.google.com/*",
          "events": ["scan:*"],
          "commands": ["submit_result"]
        },
        {
          "url": "https://*.perplexity.ai/*",
          "events": ["scan:*"],
          "commands": ["submit_result"]
        }
      ]
    }
  }
}
```

## Dependencies (Cargo.toml)

```toml
[dependencies]
tauri = { version = "2.0", features = ["webview", "shell-open"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
reqwest = { version = "0.11", features = ["json"] }
tokio = { version = "1", features = ["full"] }
keyring = "2"  # Secure credential storage
uuid = { version = "1", features = ["v4"] }
chrono = "0.4"
```

## Files to Create

1. `desktop-app/package.json` - NPM config
2. `desktop-app/src-tauri/tauri.conf.json` - Tauri config
3. `desktop-app/src-tauri/Cargo.toml` - Rust dependencies
4. `desktop-app/src-tauri/src/main.rs` - Entry point
5. `desktop-app/src-tauri/src/lib.rs` - Library
6. `desktop-app/src-tauri/src/commands/mod.rs` - Command module
7. `desktop-app/src-tauri/src/commands/auth.rs` - Auth commands
8. `desktop-app/src-tauri/src/commands/scan.rs` - Scan commands
9. `desktop-app/src-tauri/src/commands/api.rs` - API client
10. `desktop-app/src-tauri/src/webview/mod.rs` - Webview module
11. `desktop-app/src-tauri/src/webview/manager.rs` - Webview manager
12. `desktop-app/ui/index.html` - Main UI
13. `desktop-app/ui/styles.css` - Styles
14. `desktop-app/ui/app.js` - Frontend logic
15. Embedded JS scripts for each platform

## Estimated Effort

- Phase 1 (Setup): ~30 min
- Phase 2 (Frontend): ~1 hour (mostly copying)
- Phase 3 (Auth): ~1 hour
- Phase 4 (Webview): ~2 hours
- Phase 5 (Scripts): ~1 hour (porting)
- Phase 6 (Orchestration): ~2 hours
- Phase 7 (Testing): ~1 hour

**Total: ~8-10 hours**

## Notes

1. **Cookie Isolation**: Unlike the extension which shares cookies with the browser, Tauri webviews have their own cookie store. Users will need to log in to each AI platform within the app.

2. **Platform Detection**: We'll need to detect if user is logged in by checking for login elements vs chat interface.

3. **Headless Mode**: Webviews can be hidden during scanning for better UX.

4. **Single Instance**: App should prevent multiple instances to avoid conflicts.
