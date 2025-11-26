# Columbus AI Traffic Tracking SDK

Track visitors coming from AI platforms (ChatGPT, Claude, Gemini, Perplexity) and measure ROI from AI visibility.

## Installation

```bash
npm install @columbus/tracker
```

Or include via CDN:

```html
<script src="https://cdn.columbus-aeo.com/tracker.min.js"></script>
```

## Quick Start

```javascript
import { ColumbusTracker } from '@columbus/tracker';

// Initialize the tracker
const tracker = new ColumbusTracker({
  organizationId: 'your-org-id',  // From your Columbus dashboard
  apiKey: 'your-api-key',         // From your Columbus dashboard
  debug: false                     // Set to true for console logging
});

// Track page views (automatically detects AI referrer)
tracker.trackPageView();

// Track conversions
tracker.trackConversion('purchase', {
  value: 99.99,
  currency: 'USD',
  metadata: {
    product_id: 'prod_123',
    plan: 'pro'
  }
});
```

## Features

- **Automatic AI Detection**: Detects visitors from ChatGPT, Claude, Gemini, Perplexity, Copilot, and more
- **Session Tracking**: Maintains session across page navigation
- **Conversion Attribution**: Attributes conversions to the AI source that referred the user
- **Lightweight**: ~3KB minified and gzipped
- **Privacy-Friendly**: No personal data collection, only AI source attribution
- **Offline Support**: Queues events when offline, sends when connection restored

## Supported AI Platforms

| Platform | Detection Method |
|----------|------------------|
| ChatGPT | `chat.openai.com`, `chatgpt.com` referrer |
| Claude | `claude.ai` referrer |
| Gemini | `gemini.google.com`, `bard.google.com` referrer |
| Perplexity | `perplexity.ai` referrer |
| Copilot | `copilot.microsoft.com`, `bing.com/chat` referrer |
| You.com | `you.com` referrer |
| Phind | `phind.com` referrer |
| Andi | `andisearch.com` referrer |

## API Reference

### Constructor Options

```typescript
interface ColumbusConfig {
  organizationId: string;  // Required: Your Columbus organization ID
  apiKey: string;          // Required: Your Columbus API key
  endpoint?: string;       // Optional: Custom API endpoint
  debug?: boolean;         // Optional: Enable debug logging (default: false)
  cookieDomain?: string;   // Optional: Cookie domain for session tracking
  sessionDuration?: number; // Optional: Session duration in minutes (default: 30)
}
```

### Methods

#### `trackPageView(metadata?: object)`

Tracks a page view. Only sends data if the visitor came from an AI platform.

```javascript
tracker.trackPageView();

// With metadata
tracker.trackPageView({
  page_type: 'product',
  category: 'electronics'
});
```

#### `trackConversion(eventName: string, options?: object)`

Tracks a conversion event. Always sends data (AI attribution is determined server-side if not detected client-side).

```javascript
// Simple conversion
tracker.trackConversion('signup');

// With value
tracker.trackConversion('purchase', {
  value: 149.99,
  currency: 'USD'
});

// With metadata
tracker.trackConversion('demo_request', {
  value: 0,
  metadata: {
    company_size: '100+',
    industry: 'saas'
  }
});
```

#### `isFromAI(): boolean`

Returns `true` if the current visitor came from an AI platform.

```javascript
if (tracker.isFromAI()) {
  console.log('Visitor came from AI!');
}
```

#### `getSource(): string | null`

Returns the AI platform name or `null` if not from AI.

```javascript
const source = tracker.getSource();
// Returns: 'chatgpt', 'claude', 'gemini', 'perplexity', etc.
```

#### `getSessionId(): string`

Returns the current session ID.

```javascript
const sessionId = tracker.getSessionId();
```

#### `setSource(source: string)`

Manually set the AI source (useful for server-side detection).

```javascript
tracker.setSource('chatgpt');
```

#### `destroy()`

Cleanup the tracker (flushes pending events and removes listeners).

```javascript
tracker.destroy();
```

## Global Functions

For simpler usage without managing the tracker instance:

```javascript
import { initColumbus, trackPageView, trackConversion, isFromAI, getAISource } from '@columbus/tracker';

// Initialize once
initColumbus({
  organizationId: 'your-org-id',
  apiKey: 'your-api-key'
});

// Use anywhere
trackPageView();
trackConversion('purchase', { value: 99.99 });

if (isFromAI()) {
  console.log(`Visitor from ${getAISource()}`);
}
```

## Framework Integration

### React

```jsx
// hooks/useColumbus.js
import { useEffect } from 'react';
import { ColumbusTracker } from '@columbus/tracker';

let tracker = null;

export function useColumbus() {
  useEffect(() => {
    if (!tracker) {
      tracker = new ColumbusTracker({
        organizationId: process.env.REACT_APP_COLUMBUS_ORG_ID,
        apiKey: process.env.REACT_APP_COLUMBUS_API_KEY
      });
    }

    tracker.trackPageView();

    return () => {
      // Don't destroy on unmount - keep session alive
    };
  }, []);

  return tracker;
}

// Usage in component
function ProductPage() {
  const tracker = useColumbus();

  const handlePurchase = () => {
    tracker?.trackConversion('purchase', { value: 99.99 });
  };

  return <button onClick={handlePurchase}>Buy Now</button>;
}
```

### Next.js

```jsx
// app/providers.jsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initColumbus, trackPageView } from '@columbus/tracker';

export function ColumbusProvider({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    initColumbus({
      organizationId: process.env.NEXT_PUBLIC_COLUMBUS_ORG_ID,
      apiKey: process.env.NEXT_PUBLIC_COLUMBUS_API_KEY
    });
  }, []);

  useEffect(() => {
    trackPageView();
  }, [pathname]);

  return children;
}
```

### Vue/Nuxt

```javascript
// plugins/columbus.client.js
import { ColumbusTracker } from '@columbus/tracker';

export default defineNuxtPlugin((nuxtApp) => {
  const tracker = new ColumbusTracker({
    organizationId: useRuntimeConfig().public.columbusOrgId,
    apiKey: useRuntimeConfig().public.columbusApiKey
  });

  // Track page views on route change
  nuxtApp.hook('page:finish', () => {
    tracker.trackPageView();
  });

  return {
    provide: {
      columbus: tracker
    }
  };
});

// Usage in component
const { $columbus } = useNuxtApp();
$columbus.trackConversion('signup');
```

### Vanilla JavaScript

```html
<script src="https://cdn.columbus-aeo.com/tracker.min.js"></script>
<script>
  // Initialize
  window.ColumbusTracker = new Columbus.ColumbusTracker({
    organizationId: 'your-org-id',
    apiKey: 'your-api-key'
  });

  // Track page view
  window.ColumbusTracker.trackPageView();

  // Track conversion on button click
  document.getElementById('buy-btn').addEventListener('click', function() {
    window.ColumbusTracker.trackConversion('purchase', { value: 99.99 });
  });
</script>
```

## UTM Parameter Support

The SDK also detects AI traffic via UTM parameters:

```
https://yoursite.com/page?utm_source=chatgpt&utm_medium=ai
https://yoursite.com/page?utm_source=claude&utm_medium=llm
https://yoursite.com/page?from_chatgpt=true
https://yoursite.com/page?ai_ref=perplexity
```

## Server-Side Detection

If you detect AI traffic server-side (e.g., via User-Agent or headers), you can pass it to the client:

```javascript
// Server sends AI source in page data
const aiSource = window.__AI_SOURCE__; // Set by server

if (aiSource) {
  tracker.setSource(aiSource);
}
```

## Privacy & Data

The Columbus SDK collects:

- AI source (which AI platform referred the user)
- Session ID (anonymous, random UUID)
- Page URLs (landing page and current page)
- Conversion events and values
- Timestamps

The SDK does NOT collect:

- Personal information
- IP addresses
- Browser fingerprints
- Cookies from other domains

## Debugging

Enable debug mode to see console logs:

```javascript
const tracker = new ColumbusTracker({
  organizationId: 'your-org-id',
  apiKey: 'your-api-key',
  debug: true  // Enable console logging
});
```

Console output:
```
[Columbus] Columbus Tracker initialized { sessionId: "abc-123", source: "chatgpt" }
[Columbus] Event queued { type: "pageview", source: "chatgpt", ... }
[Columbus] Events flushed (fetch) 2
```

## TypeScript

The SDK is written in TypeScript and includes type definitions:

```typescript
import { ColumbusTracker, ColumbusConfig, ConversionOptions } from '@columbus/tracker';

const config: ColumbusConfig = {
  organizationId: 'your-org-id',
  apiKey: 'your-api-key'
};

const tracker = new ColumbusTracker(config);

const options: ConversionOptions = {
  value: 99.99,
  currency: 'USD',
  metadata: { plan: 'pro' }
};

tracker.trackConversion('purchase', options);
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## License

MIT

## Support

- Documentation: https://columbus-aeo.com/docs/sdk
- Issues: https://github.com/columbus-aeo/tracker-sdk/issues
- Email: support@columbus-aeo.com
