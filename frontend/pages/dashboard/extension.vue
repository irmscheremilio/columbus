<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
    <div class="p-4 lg:p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Desktop App</h1>
          <p class="text-sm text-gray-500">Automated AI visibility monitoring on your computer</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Hero Card -->
          <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-6 hover:shadow-md transition-shadow duration-200">
            <div class="flex items-start gap-4">
              <div class="w-16 h-16 bg-gradient-to-br from-brand/20 to-brand/10 rounded-xl flex items-center justify-center">
                <svg class="w-8 h-8 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                </svg>
              </div>
              <div class="flex-1">
                <h2 class="text-lg font-semibold text-gray-900 mb-1">Columbus Desktop App</h2>
                <p class="text-sm text-gray-600 mb-4">
                  The Columbus desktop app runs scans automatically in the background using your own AI platform accounts.
                  Set it up once and let it monitor your brand visibility across ChatGPT, Claude, Gemini, and Perplexity.
                </p>
                <div class="flex flex-wrap gap-3">
                  <a
                    :href="downloadUrl"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand/90 transition-colors"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download for Windows
                  </a>
                  <button
                    @click="showInstructions = !showInstructions"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ showInstructions ? 'Hide' : 'View' }} Setup Guide
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Setup Guide Card -->
          <div v-if="showInstructions" class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-6">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">Setup Guide</h3>
            <ol class="space-y-4">
              <li class="flex gap-3">
                <span class="flex-shrink-0 w-6 h-6 bg-brand/10 text-brand text-sm font-semibold rounded-full flex items-center justify-center">1</span>
                <div>
                  <div class="font-medium text-gray-900">Download & Install</div>
                  <p class="text-sm text-gray-600">Click the download button above and run the installer. The app will appear in your system tray.</p>
                </div>
              </li>
              <li class="flex gap-3">
                <span class="flex-shrink-0 w-6 h-6 bg-brand/10 text-brand text-sm font-semibold rounded-full flex items-center justify-center">2</span>
                <div>
                  <div class="font-medium text-gray-900">Sign In to Columbus</div>
                  <p class="text-sm text-gray-600">Open the app from the system tray and sign in with your Columbus account.</p>
                </div>
              </li>
              <li class="flex gap-3">
                <span class="flex-shrink-0 w-6 h-6 bg-brand/10 text-brand text-sm font-semibold rounded-full flex items-center justify-center">3</span>
                <div>
                  <div class="font-medium text-gray-900">Log In to AI Platforms</div>
                  <p class="text-sm text-gray-600">The app will open each AI platform in a browser window. Sign in to your accounts for ChatGPT, Claude, Gemini, and Perplexity.</p>
                </div>
              </li>
              <li class="flex gap-3">
                <span class="flex-shrink-0 w-6 h-6 bg-brand/10 text-brand text-sm font-semibold rounded-full flex items-center justify-center">4</span>
                <div>
                  <div class="font-medium text-gray-900">Mark Platforms as Ready</div>
                  <p class="text-sm text-gray-600">Once logged in, mark each platform as "ready" in the app. This tells Columbus which platforms to include in scans.</p>
                </div>
              </li>
              <li class="flex gap-3">
                <span class="flex-shrink-0 w-6 h-6 bg-brand/10 text-brand text-sm font-semibold rounded-full flex items-center justify-center">5</span>
                <div>
                  <div class="font-medium text-gray-900">Configure Auto-Scan (Optional)</div>
                  <p class="text-sm text-gray-600">Enable automatic scanning to run scans in the background. Configure how many scans to run per day and whether to start automatically with Windows.</p>
                </div>
              </li>
            </ol>
          </div>

          <!-- How It Works -->
          <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-6">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">How It Works</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="text-center p-4">
                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                  </svg>
                </div>
                <h4 class="font-medium text-gray-900 mb-1">Runs Locally</h4>
                <p class="text-xs text-gray-500">The app runs on your computer using embedded browser windows</p>
              </div>
              <div class="text-center p-4">
                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h4 class="font-medium text-gray-900 mb-1">Your Sessions</h4>
                <p class="text-xs text-gray-500">Uses your own logged-in AI platform accounts</p>
              </div>
              <div class="text-center p-4">
                <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 class="font-medium text-gray-900 mb-1">Auto-Scheduled</h4>
                <p class="text-xs text-gray-500">Scans run automatically based on your configured schedule</p>
              </div>
              <div class="text-center p-4">
                <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <h4 class="font-medium text-gray-900 mb-1">Instant Results</h4>
                <p class="text-xs text-gray-500">Data syncs to your dashboard in real-time</p>
              </div>
            </div>
          </div>

          <!-- What the App Does -->
          <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-6">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">What the Desktop App Does</h3>
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <div>
                  <div class="font-medium text-gray-900">Sends prompts to AI platforms</div>
                  <p class="text-sm text-gray-600">The app sends your configured prompts to each AI platform using your logged-in sessions, exactly like a real user would.</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <div>
                  <div class="font-medium text-gray-900">Analyzes AI responses</div>
                  <p class="text-sm text-gray-600">Responses are analyzed to detect brand mentions, competitor mentions, citations, and sentiment.</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                  </svg>
                </div>
                <div>
                  <div class="font-medium text-gray-900">Tracks visibility over time</div>
                  <p class="text-sm text-gray-600">Results are synced to your dashboard so you can track how your brand visibility changes across platforms.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Desktop App Scans -->
          <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-100/80">
              <h3 class="text-sm font-semibold text-gray-900">Recent Desktop App Scans</h3>
            </div>
            <div v-if="loading" class="flex items-center justify-center py-8">
              <div class="w-5 h-5 animate-spin rounded-full border-2 border-brand border-t-transparent"></div>
            </div>
            <div v-else-if="recentScans.length === 0" class="text-center py-8">
              <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="text-sm text-gray-500 mb-2">No desktop app scans yet</p>
              <p class="text-xs text-gray-400">Download the app and run your first scan to see results here</p>
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <th class="text-left px-4 py-2 font-medium">Platform</th>
                    <th class="text-left px-4 py-2 font-medium">Prompt</th>
                    <th class="text-center px-4 py-2 font-medium">Mentioned</th>
                    <th class="text-center px-4 py-2 font-medium">Citations</th>
                    <th class="text-right px-4 py-2 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="scan in recentScans" :key="scan.id" class="text-sm hover:bg-gray-50/80 transition-colors">
                    <td class="px-4 py-2.5">
                      <span
                        class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                        :class="getPlatformClass(scan.ai_model)"
                      >
                        {{ scan.ai_model }}
                      </span>
                    </td>
                    <td class="px-4 py-2.5 max-w-xs truncate text-gray-600">
                      {{ scan.prompts?.prompt_text || 'Unknown prompt' }}
                    </td>
                    <td class="px-4 py-2.5 text-center">
                      <span v-if="scan.brand_mentioned" class="text-green-600">✓</span>
                      <span v-else class="text-gray-400">—</span>
                    </td>
                    <td class="px-4 py-2.5 text-center">
                      <span v-if="scan.citation_present" class="text-green-600">✓</span>
                      <span v-else class="text-gray-400">—</span>
                    </td>
                    <td class="px-4 py-2.5 text-right text-gray-500 text-xs">
                      {{ formatRelativeTime(scan.tested_at) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Prerequisites -->
          <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-3">Prerequisites</h3>
            <p class="text-xs text-gray-500 mb-3">You need accounts on these AI platforms to run scans:</p>
            <div class="space-y-3">
              <a
                v-for="platform in platforms"
                :key="platform.id"
                :href="platform.signupUrl"
                target="_blank"
                class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center"
                  :style="{ backgroundColor: platform.color + '20' }"
                >
                  <div class="w-4 h-4 rounded" :style="{ backgroundColor: platform.color }"></div>
                </div>
                <div class="flex-1">
                  <div class="text-sm font-medium text-gray-900">{{ platform.name }}</div>
                  <div class="text-xs text-gray-500">{{ platform.accountType }}</div>
                </div>
                <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

          <!-- Scan Stats -->
          <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-3">Scan Statistics</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Last Scan</span>
                <span class="text-gray-900">{{ lastScanTime || 'Never' }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Scans Today</span>
                <span class="text-gray-900">{{ scansToday }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Total Scans</span>
                <span class="text-gray-900">{{ totalScans }}</span>
              </div>
            </div>
          </div>

          <!-- Benefits -->
          <div class="bg-gradient-to-br from-brand/5 to-brand/10 rounded-xl border border-brand/20 p-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-3">Why Use the Desktop App?</h3>
            <ul class="space-y-2 text-sm text-gray-600">
              <li class="flex items-start gap-2">
                <svg class="w-4 h-4 text-brand mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>Fully automated background scanning</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-4 h-4 text-brand mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>100% Terms of Service compliant</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-4 h-4 text-brand mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>See exactly what real users see</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-4 h-4 text-brand mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>Uses your subscription tier (GPT-4, etc.)</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-4 h-4 text-brand mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>No API costs for you or Columbus</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-4 h-4 text-brand mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>Starts automatically with Windows</span>
              </li>
            </ul>
          </div>

          <!-- System Requirements -->
          <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-3">System Requirements</h3>
            <ul class="space-y-2 text-sm text-gray-600">
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Windows 10 or later</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>4 GB RAM minimum</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Internet connection</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const config = useRuntimeConfig()
const supabase = useSupabaseClient()
const { activeProductId } = useActiveProduct()
const { platforms: aiPlatforms, loadPlatforms } = useAIPlatforms()

const loading = ref(true)
const showInstructions = ref(false)
const recentScans = ref<any[]>([])
const lastScanTime = ref<string | null>(null)
const scansToday = ref(0)
const totalScans = ref(0)

// Download URL from config, with fallback
const downloadUrl = computed(() => config.public.desktopAppDownloadUrl || '#')

// Map AI platforms to include signup URLs
const platforms = computed(() => aiPlatforms.value.map(p => ({
  id: p.id,
  name: p.name,
  signupUrl: p.website_url,
  color: p.color,
  accountType: getAccountType(p.id)
})))

const getAccountType = (platformId: string) => {
  switch (platformId) {
    case 'chatgpt': return 'Free or Plus account'
    case 'claude': return 'Free or Pro account'
    case 'gemini': return 'Google account required'
    case 'perplexity': return 'Free or Pro account'
    default: return 'Free or paid account'
  }
}

onMounted(async () => {
  await loadPlatforms()
  await loadDesktopAppData()
})

watch(activeProductId, async () => {
  if (activeProductId.value) {
    await loadDesktopAppData()
  }
})

const loadDesktopAppData = async () => {
  if (!activeProductId.value) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    // Get recent desktop app scans (source = 'extension' since desktop app uses same source)
    const { data: scans } = await supabase
      .from('prompt_results')
      .select('*, prompts(prompt_text)')
      .eq('product_id', activeProductId.value)
      .eq('source', 'extension')
      .order('tested_at', { ascending: false })
      .limit(10)

    recentScans.value = scans || []

    // Calculate today's scans
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count: todayCount } = await supabase
      .from('prompt_results')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', activeProductId.value)
      .eq('source', 'extension')
      .gte('tested_at', today.toISOString())

    scansToday.value = todayCount || 0

    // Get total scans
    const { count: total } = await supabase
      .from('prompt_results')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', activeProductId.value)
      .eq('source', 'extension')

    totalScans.value = total || 0

    // Get last scan time
    if (scans && scans.length > 0) {
      lastScanTime.value = formatRelativeTime(scans[0].tested_at)
    }
  } catch (error) {
    console.error('Error loading desktop app data:', error)
  } finally {
    loading.value = false
  }
}

const getPlatformClass = (model: string) => {
  switch (model?.toLowerCase()) {
    case 'chatgpt': return 'bg-emerald-100 text-emerald-700'
    case 'claude': return 'bg-orange-100 text-orange-700'
    case 'gemini': return 'bg-blue-100 text-blue-700'
    case 'perplexity': return 'bg-cyan-100 text-cyan-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>
