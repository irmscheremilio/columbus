<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
    <div class="p-4 lg:p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Browser Extension</h1>
          <p class="text-sm text-gray-500">Monitor AI platforms using your own browser sessions</p>
        </div>
        <div v-if="extensionConnected" class="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Connected
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
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div class="flex-1">
                <h2 class="text-lg font-semibold text-gray-900 mb-1">100% ToS Compliant Monitoring</h2>
                <p class="text-sm text-gray-600 mb-4">
                  The Columbus extension runs scans using your own authenticated browser sessions.
                  This means you're simply querying your own AI accounts - completely legal and ToS compliant.
                </p>
                <div class="flex flex-wrap gap-3">
                  <a
                    href="https://chrome.google.com/webstore/detail/columbus-aeo-monitor"
                    target="_blank"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand/90 transition-colors"
                  >
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-3.953 6.848c.062.002.124.007.187.007 6.627 0 12-5.373 12-12 0-.807-.08-1.596-.232-2.361z"/>
                    </svg>
                    Install Chrome Extension
                  </a>
                  <button
                    @click="showInstructions = !showInstructions"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ showInstructions ? 'Hide' : 'View' }} Instructions
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Instructions Card -->
          <div v-if="showInstructions" class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-6">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">Getting Started</h3>
            <ol class="space-y-4">
              <li class="flex gap-3">
                <span class="flex-shrink-0 w-6 h-6 bg-brand/10 text-brand text-sm font-semibold rounded-full flex items-center justify-center">1</span>
                <div>
                  <div class="font-medium text-gray-900">Install the Extension</div>
                  <p class="text-sm text-gray-600">Click the "Install Chrome Extension" button above to add Columbus to your browser.</p>
                </div>
              </li>
              <li class="flex gap-3">
                <span class="flex-shrink-0 w-6 h-6 bg-brand/10 text-brand text-sm font-semibold rounded-full flex items-center justify-center">2</span>
                <div>
                  <div class="font-medium text-gray-900">Log In to Columbus</div>
                  <p class="text-sm text-gray-600">Click the Columbus icon in your browser toolbar and sign in with your account.</p>
                </div>
              </li>
              <li class="flex gap-3">
                <span class="flex-shrink-0 w-6 h-6 bg-brand/10 text-brand text-sm font-semibold rounded-full flex items-center justify-center">3</span>
                <div>
                  <div class="font-medium text-gray-900">Log In to AI Platforms</div>
                  <p class="text-sm text-gray-600">Make sure you're logged into the AI platforms you want to monitor (ChatGPT, Claude, Gemini, Perplexity).</p>
                </div>
              </li>
              <li class="flex gap-3">
                <span class="flex-shrink-0 w-6 h-6 bg-brand/10 text-brand text-sm font-semibold rounded-full flex items-center justify-center">4</span>
                <div>
                  <div class="font-medium text-gray-900">Run Your First Scan</div>
                  <p class="text-sm text-gray-600">Select a product in the extension popup and click "Run Scan". Results will appear here in your dashboard.</p>
                </div>
              </li>
            </ol>
          </div>

          <!-- How It Works -->
          <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-6">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">How It Works</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="text-center p-4">
                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </div>
                <h4 class="font-medium text-gray-900 mb-1">Your Browser</h4>
                <p class="text-xs text-gray-500">Scans run in your browser using your own AI platform accounts</p>
              </div>
              <div class="text-center p-4">
                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <h4 class="font-medium text-gray-900 mb-1">100% Compliant</h4>
                <p class="text-xs text-gray-500">No ToS violations - you're querying your own accounts</p>
              </div>
              <div class="text-center p-4">
                <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <h4 class="font-medium text-gray-900 mb-1">Instant Analysis</h4>
                <p class="text-xs text-gray-500">Results are analyzed and displayed in your dashboard</p>
              </div>
            </div>
          </div>

          <!-- Recent Extension Scans -->
          <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-100/80">
              <h3 class="text-sm font-semibold text-gray-900">Recent Extension Scans</h3>
            </div>
            <div v-if="loading" class="flex items-center justify-center py-8">
              <div class="w-5 h-5 animate-spin rounded-full border-2 border-brand border-t-transparent"></div>
            </div>
            <div v-else-if="recentScans.length === 0" class="text-center py-8">
              <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="text-sm text-gray-500 mb-2">No extension scans yet</p>
              <p class="text-xs text-gray-400">Install the extension and run your first scan to see results here</p>
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
          <!-- Platform Status -->
          <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-3">Supported Platforms</h3>
            <div class="space-y-3">
              <a
                v-for="platform in platforms"
                :key="platform.id"
                :href="platform.url"
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
                  <div class="text-xs text-gray-500">{{ platform.url }}</div>
                </div>
                <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

          <!-- Extension Status -->
          <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-3">Extension Status</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Connection</span>
                <span :class="extensionConnected ? 'text-green-600' : 'text-gray-400'">
                  {{ extensionConnected ? 'Connected' : 'Not detected' }}
                </span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Last Scan</span>
                <span class="text-gray-900">{{ lastScanTime || 'Never' }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Scans Today</span>
                <span class="text-gray-900">{{ scansToday }}</span>
              </div>
            </div>
          </div>

          <!-- Benefits -->
          <div class="bg-gradient-to-br from-brand/5 to-brand/10 rounded-xl border border-brand/20 p-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-3">Why Use the Extension?</h3>
            <ul class="space-y-2 text-sm text-gray-600">
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

const supabase = useSupabaseClient()
const { activeProductId } = useActiveProduct()

const loading = ref(true)
const showInstructions = ref(false)
const extensionConnected = ref(false)
const recentScans = ref<any[]>([])
const lastScanTime = ref<string | null>(null)
const scansToday = ref(0)

const platforms = [
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com', color: '#10a37f' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai', color: '#d97757' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com', color: '#4285f4' },
  { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai', color: '#20b8cd' }
]

onMounted(async () => {
  await loadExtensionData()
})

watch(activeProductId, async () => {
  if (activeProductId.value) {
    await loadExtensionData()
  }
})

const loadExtensionData = async () => {
  if (!activeProductId.value) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    // Get recent extension scans
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

    const { count } = await supabase
      .from('prompt_results')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', activeProductId.value)
      .eq('source', 'extension')
      .gte('tested_at', today.toISOString())

    scansToday.value = count || 0

    // Get last scan time
    if (scans && scans.length > 0) {
      lastScanTime.value = formatRelativeTime(scans[0].tested_at)
    }

    // Check extension connection (via extension_sessions table)
    const { data: session } = await supabase
      .from('extension_sessions')
      .select('*')
      .eq('product_id', activeProductId.value)
      .single()

    if (session?.last_scan_at) {
      const lastScan = new Date(session.last_scan_at)
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
      extensionConnected.value = lastScan > hourAgo
    }
  } catch (error) {
    console.error('Error loading extension data:', error)
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
