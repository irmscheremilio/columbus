<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <nav class="bg-white shadow-sm sticky top-0 z-10">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <NuxtLink to="/" class="text-xl font-bold brand-text">Columbus</NuxtLink>
        <div class="flex items-center gap-4">
          <NuxtLink to="/docs/sdk" class="text-sm font-medium text-brand">SDK Docs</NuxtLink>
          <NuxtLink to="/auth/login" class="text-sm text-gray-600 hover:text-gray-900">Login</NuxtLink>
        </div>
      </div>
    </nav>

    <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Hero -->
      <div class="mb-12">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">Columbus Tracking SDK</h1>
        <p class="text-xl text-gray-600">
          Track visitors coming from AI platforms and measure your ROI from AI visibility.
        </p>
      </div>

      <!-- Quick Install -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Quick Install</h2>
        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-600 mb-2">NPM / Yarn</p>
            <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <code class="text-green-400 text-sm">npm install @columbus/tracker</code>
            </div>
          </div>
          <div>
            <p class="text-sm text-gray-600 mb-2">CDN (add to your HTML)</p>
            <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <code class="text-green-400 text-sm whitespace-pre">&lt;script src="https://cdn.columbus-aeo.com/tracker.min.js"&gt;&lt;/script&gt;</code>
            </div>
          </div>
        </div>
      </div>

      <!-- Basic Usage -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Basic Usage</h2>

        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="border-b border-gray-200 px-4 py-2 bg-gray-50">
            <span class="text-sm font-medium text-gray-600">JavaScript</span>
          </div>
          <div class="p-4 bg-gray-900 overflow-x-auto">
            <pre class="text-sm text-gray-300"><code>import { ColumbusTracker } from '@columbus/tracker';

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
});</code></pre>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Features</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center mb-3">
              <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 mb-1">Automatic AI Detection</h3>
            <p class="text-sm text-gray-600">Detects visitors from ChatGPT, Claude, Gemini, Perplexity, Copilot, and more</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
              <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 mb-1">Session Tracking</h3>
            <p class="text-sm text-gray-600">Maintains session across page navigation with cookie-based persistence</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
              <svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 mb-1">Conversion Attribution</h3>
            <p class="text-sm text-gray-600">Attributes conversions to the AI source that referred the user</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
              <svg class="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 mb-1">Lightweight</h3>
            <p class="text-sm text-gray-600">~3KB minified and gzipped, with offline support</p>
          </div>
        </div>
      </section>

      <!-- Supported Platforms -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Supported AI Platforms</h2>
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Platform</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Detection Method</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">ChatGPT</td>
                <td class="px-4 py-3 text-sm text-gray-600"><code class="bg-gray-100 px-1.5 py-0.5 rounded">chat.openai.com</code>, <code class="bg-gray-100 px-1.5 py-0.5 rounded">chatgpt.com</code> referrer</td>
              </tr>
              <tr>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">Claude</td>
                <td class="px-4 py-3 text-sm text-gray-600"><code class="bg-gray-100 px-1.5 py-0.5 rounded">claude.ai</code> referrer</td>
              </tr>
              <tr>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">Gemini</td>
                <td class="px-4 py-3 text-sm text-gray-600"><code class="bg-gray-100 px-1.5 py-0.5 rounded">gemini.google.com</code>, <code class="bg-gray-100 px-1.5 py-0.5 rounded">bard.google.com</code> referrer</td>
              </tr>
              <tr>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">Perplexity</td>
                <td class="px-4 py-3 text-sm text-gray-600"><code class="bg-gray-100 px-1.5 py-0.5 rounded">perplexity.ai</code> referrer</td>
              </tr>
              <tr>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">Copilot</td>
                <td class="px-4 py-3 text-sm text-gray-600"><code class="bg-gray-100 px-1.5 py-0.5 rounded">copilot.microsoft.com</code>, <code class="bg-gray-100 px-1.5 py-0.5 rounded">bing.com/chat</code> referrer</td>
              </tr>
              <tr>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">You.com</td>
                <td class="px-4 py-3 text-sm text-gray-600"><code class="bg-gray-100 px-1.5 py-0.5 rounded">you.com</code> referrer</td>
              </tr>
              <tr>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">Phind</td>
                <td class="px-4 py-3 text-sm text-gray-600"><code class="bg-gray-100 px-1.5 py-0.5 rounded">phind.com</code> referrer</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- API Reference -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">API Reference</h2>

        <!-- Constructor -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">Constructor Options</h3>
          <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
            <pre class="text-sm text-gray-300"><code>interface ColumbusConfig {
  organizationId: string;  // Required: Your Columbus organization ID
  apiKey: string;          // Required: Your Columbus API key
  endpoint?: string;       // Optional: Custom API endpoint
  debug?: boolean;         // Optional: Enable debug logging (default: false)
  cookieDomain?: string;   // Optional: Cookie domain for session tracking
  sessionDuration?: number; // Optional: Session duration in minutes (default: 30)
}</code></pre>
          </div>
        </div>

        <!-- Methods -->
        <div class="space-y-4">
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              <code class="text-brand">trackPageView(metadata?: object)</code>
            </h3>
            <p class="text-gray-600 mb-3">Tracks a page view. Only sends data if the visitor came from an AI platform.</p>
            <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre class="text-sm text-gray-300"><code>tracker.trackPageView();

// With metadata
tracker.trackPageView({
  page_type: 'product',
  category: 'electronics'
});</code></pre>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              <code class="text-brand">trackConversion(eventName: string, options?: object)</code>
            </h3>
            <p class="text-gray-600 mb-3">Tracks a conversion event. Always sends data (AI attribution determined server-side if not detected client-side).</p>
            <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre class="text-sm text-gray-300"><code>// Simple conversion
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
});</code></pre>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              <code class="text-brand">isFromAI(): boolean</code>
            </h3>
            <p class="text-gray-600 mb-3">Returns <code class="bg-gray-100 px-1.5 py-0.5 rounded">true</code> if the current visitor came from an AI platform.</p>
            <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre class="text-sm text-gray-300"><code>if (tracker.isFromAI()) {
  console.log('Visitor came from AI!');
}</code></pre>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              <code class="text-brand">getSource(): string | null</code>
            </h3>
            <p class="text-gray-600 mb-3">Returns the AI platform name or <code class="bg-gray-100 px-1.5 py-0.5 rounded">null</code> if not from AI.</p>
            <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre class="text-sm text-gray-300"><code>const source = tracker.getSource();
// Returns: 'chatgpt', 'claude', 'gemini', 'perplexity', etc.</code></pre>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              <code class="text-brand">setSource(source: string)</code>
            </h3>
            <p class="text-gray-600 mb-3">Manually set the AI source (useful for server-side detection).</p>
            <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre class="text-sm text-gray-300"><code>tracker.setSource('chatgpt');</code></pre>
            </div>
          </div>
        </div>
      </section>

      <!-- Framework Integration -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Framework Integration</h2>

        <!-- React -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
          <div class="border-b border-gray-200 px-4 py-3 bg-gray-50 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.41 16.09V5.91c0-.51.41-.91.91-.91s.91.41.91.91v12.18c0 .51-.41.91-.91.91s-.91-.41-.91-.91z"/>
            </svg>
            <span class="font-medium text-gray-900">React</span>
          </div>
          <div class="p-4 bg-gray-900 overflow-x-auto">
            <pre class="text-sm text-gray-300"><code>// hooks/useColumbus.js
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
  }, []);

  return tracker;
}

// Usage in component
function ProductPage() {
  const tracker = useColumbus();

  const handlePurchase = () => {
    tracker?.trackConversion('purchase', { value: 99.99 });
  };

  return &lt;button onClick={handlePurchase}&gt;Buy Now&lt;/button&gt;;
}</code></pre>
          </div>
        </div>

        <!-- Next.js -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
          <div class="border-b border-gray-200 px-4 py-3 bg-gray-50 flex items-center gap-2">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM9.5 8.5l5 3.5-5 3.5v-7z"/>
            </svg>
            <span class="font-medium text-gray-900">Next.js</span>
          </div>
          <div class="p-4 bg-gray-900 overflow-x-auto">
            <pre class="text-sm text-gray-300"><code>// app/providers.jsx
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
}</code></pre>
          </div>
        </div>

        <!-- Vue/Nuxt -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
          <div class="border-b border-gray-200 px-4 py-3 bg-gray-50 flex items-center gap-2">
            <svg class="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 3l10 18L22 3h-4l-6 10.5L6 3H2z"/>
            </svg>
            <span class="font-medium text-gray-900">Vue / Nuxt</span>
          </div>
          <div class="p-4 bg-gray-900 overflow-x-auto">
            <pre class="text-sm text-gray-300"><code>// plugins/columbus.client.js
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
$columbus.trackConversion('signup');</code></pre>
          </div>
        </div>

        <!-- Vanilla JS -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="border-b border-gray-200 px-4 py-3 bg-gray-50 flex items-center gap-2">
            <svg class="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 3h18v18H3V3zm16.525 13.707c-.131-.821-.666-1.511-2.252-2.155-.552-.259-1.165-.438-1.349-.854-.068-.248-.078-.382-.034-.529.113-.484.687-.629 1.137-.495.293.086.567.327.733.663.775-.507.775-.507 1.316-.852-.2-.314-.304-.451-.439-.586-.473-.528-1.103-.798-2.126-.775l-.528.067c-.507.124-.991.395-1.283.754-.855.968-.608 2.655.427 3.354 1.023.765 2.521.933 2.712 1.653.18.878-.652 1.159-1.475 1.058-.607-.136-.945-.439-1.316-1.002l-1.372.788c.157.359.337.517.607.832 1.305 1.316 4.568 1.249 5.153-.754.021-.067.18-.558.068-1.303l-.009.067z"/>
            </svg>
            <span class="font-medium text-gray-900">Vanilla JavaScript (CDN)</span>
          </div>
          <div class="p-4 bg-gray-900 overflow-x-auto">
            <pre class="text-sm text-gray-300"><code>&lt;script src="https://cdn.columbus-aeo.com/tracker.min.js"&gt;&lt;/script&gt;
&lt;script&gt;
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
&lt;/script&gt;</code></pre>
          </div>
        </div>
      </section>

      <!-- UTM Parameters -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">UTM Parameter Support</h2>
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <p class="text-gray-600 mb-4">The SDK also detects AI traffic via UTM parameters:</p>
          <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre class="text-sm text-gray-300"><code>https://yoursite.com/page?utm_source=chatgpt&amp;utm_medium=ai
https://yoursite.com/page?utm_source=claude&amp;utm_medium=llm
https://yoursite.com/page?from_chatgpt=true
https://yoursite.com/page?ai_ref=perplexity</code></pre>
          </div>
        </div>
      </section>

      <!-- Privacy -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Privacy & Data</h2>
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <h3 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                What we collect
              </h3>
              <ul class="text-sm text-gray-600 space-y-1">
                <li>AI source (which AI platform referred the user)</li>
                <li>Session ID (anonymous, random UUID)</li>
                <li>Page URLs (landing page and current page)</li>
                <li>Conversion events and values</li>
                <li>Timestamps</li>
              </ul>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                What we DON'T collect
              </h3>
              <ul class="text-sm text-gray-600 space-y-1">
                <li>Personal information</li>
                <li>IP addresses</li>
                <li>Browser fingerprints</li>
                <li>Cookies from other domains</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Support -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Support</h2>
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="grid md:grid-cols-3 gap-4">
            <a href="https://github.com/columbus-aeo/tracker-sdk/issues" target="_blank" class="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <svg class="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span class="font-medium text-gray-900">GitHub Issues</span>
            </a>
            <a href="mailto:support@columbus-aeo.com" class="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <svg class="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span class="font-medium text-gray-900">Email Support</span>
            </a>
            <NuxtLink to="/dashboard/roi" class="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <svg class="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span class="font-medium text-gray-900">ROI Dashboard</span>
            </NuxtLink>
          </div>
        </div>
      </section>

      <div class="mt-12 pt-8 border-t">
        <NuxtLink to="/" class="text-brand hover:opacity-80">
          &larr; Back to Home
        </NuxtLink>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

useHead({
  title: 'SDK Documentation - Columbus',
  meta: [
    { name: 'description', content: 'Track visitors from AI platforms and measure ROI with the Columbus Tracking SDK.' }
  ]
})
</script>
