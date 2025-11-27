# Columbus AEO Monitor - Chrome Extension

Monitor your brand visibility across AI platforms (ChatGPT, Claude, Gemini, Perplexity) using your own authenticated sessions.

## Features

- 100% ToS compliant - uses your own browser sessions
- Captures authentic AI responses as users would see them
- Real-time visibility scoring and analysis
- Competitor mention tracking
- Citation extraction and tracking
- Sign in with email/password or Google OAuth

## Setup for Development

### 1. Configure Supabase Connection

Edit `lib/config.js` and update:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon key

### 2. Configure Google OAuth (Required for "Sign in with Google")

The extension uses Supabase's OAuth flow via `chrome.identity.launchWebAuthFlow()`,
which works regardless of extension ID changes during development.

**Supabase Setup:**
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add your Google OAuth credentials (from Google Cloud Console)
4. Add the Chrome extension redirect URL to allowed redirects:
   - Format: `https://<extension-id>.chromiumapp.org/`
   - Get your extension ID from `chrome://extensions/` after loading the unpacked extension
   - Example: `https://abcdefghijklmnop.chromiumapp.org/`

**Google Cloud Console Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials (Web application type)
3. Add authorized redirect URIs:
   - Your Supabase callback URL: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase Google provider settings

### 3. Generate Icons

Create icons at these sizes in the `assets/` folder:
- `icon-16.png` (16x16)
- `icon-32.png` (32x32)
- `icon-48.png` (48x48)
- `icon-128.png` (128x128)

You can use any icon generator or create them from a base SVG.

### 4. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension/` folder

### 5. Test the Extension

1. Click the Columbus icon in Chrome toolbar
2. Log in with your Columbus account
3. Select a product to monitor
4. Ensure you're logged into the AI platforms you want to scan
5. Click "Run Scan"

## How It Works

1. **Background Service Worker** (`background/service-worker.js`)
   - Coordinates the scanning process
   - Manages authentication state
   - Sends results to Columbus backend

2. **Content Scripts** (`content-scripts/`)
   - Injected into AI platform pages
   - Handle prompt execution
   - Capture and extract responses

3. **Popup UI** (`popup/`)
   - Login interface
   - Product selection
   - Scan progress tracking

## API Endpoints Used

- `extension-status`: Get user status and products
- `extension-prompts`: Fetch prompts for scanning
- `extension-scan-results`: Submit scan results

## File Structure

```
extension/
├── manifest.json           # Chrome Extension manifest v3
├── popup/                  # Extension popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── background/
│   └── service-worker.js   # Background orchestration
├── content-scripts/        # Platform-specific scripts
│   ├── chatgpt.js
│   ├── claude.js
│   ├── gemini.js
│   └── perplexity.js
├── lib/                    # Shared utilities
│   ├── config.js
│   ├── storage.js
│   └── api-client.js
└── assets/                 # Icons
    └── icon-*.png
```

## Publishing to Chrome Web Store

1. Create developer account at https://chrome.google.com/webstore/devconsole/
2. Pay one-time $5 registration fee
3. Create store listing with screenshots and description
4. Submit extension for review
5. Typical review time: 1-3 days

## Privacy & Compliance

This extension:
- Only accesses AI platforms when user initiates a scan
- Only sends AI responses to Columbus servers
- Does not track browsing history
- Does not access personal conversations
- Requires explicit user consent for all operations
