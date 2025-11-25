<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardNav />

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- Page header -->
      <div class="px-4 py-6 sm:px-0">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
            <svg class="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">ROI Calculator</h1>
            <p class="text-gray-500">Track your return on investment from AI visibility.</p>
          </div>
        </div>
      </div>

      <!-- ROI Stats Grid -->
      <div class="px-4 py-4 sm:px-0">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Total AI Sessions -->
          <div class="bg-white rounded-xl p-5 border border-gray-200">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-600">AI Sessions</span>
            </div>
            <div class="text-4xl font-bold text-gray-900 mb-1">{{ formatNumber(summary.totalSessions) }}</div>
            <div class="text-sm text-gray-400">from AI referrals</div>
          </div>

          <!-- Total Conversions -->
          <div class="bg-white rounded-xl p-5 border border-gray-200">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-600">Conversions</span>
            </div>
            <div class="text-4xl font-bold text-gray-900 mb-1">{{ formatNumber(summary.totalConversions) }}</div>
            <div class="text-sm text-gray-400">{{ summary.conversionRate.toFixed(1) }}% rate</div>
          </div>

          <!-- Conversion Value -->
          <div class="bg-white rounded-xl p-5 border border-gray-200">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-600">Revenue</span>
            </div>
            <div class="text-4xl font-bold text-gray-900 mb-1">${{ formatNumber(summary.conversionValue) }}</div>
            <div class="text-sm text-gray-400">from AI traffic</div>
          </div>

          <!-- ROI -->
          <div class="bg-white rounded-xl p-5 border border-gray-200">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-600">ROI</span>
            </div>
            <div class="text-4xl font-bold mb-1" :class="summary.roiPercentage >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ summary.roiPercentage >= 0 ? '+' : '' }}{{ summary.roiPercentage.toFixed(0) }}%
            </div>
            <div class="text-sm text-gray-400">return on investment</div>
          </div>
        </div>
      </div>

      <!-- Traffic by Source -->
      <div class="px-4 py-4 sm:px-0">
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <h2 class="text-lg font-semibold text-gray-900">Traffic by AI Source</h2>
            </div>
            <select
              v-model="selectedPeriod"
              @change="loadData"
              class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
            >
              <option :value="7">Last 7 days</option>
              <option :value="14">Last 14 days</option>
              <option :value="30">Last 30 days</option>
              <option :value="90">Last 90 days</option>
            </select>
          </div>

          <div v-if="loading" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
          </div>

          <div v-else-if="topSources.length === 0" class="text-center py-12">
            <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            </svg>
            <p class="text-gray-500 mb-2">No traffic data yet</p>
            <p class="text-sm text-gray-400">Start tracking conversions to see your ROI</p>
          </div>

          <div v-else class="space-y-4">
            <div v-for="source in topSources" :key="source.source" class="flex items-center gap-4">
              <div class="w-24 flex-shrink-0">
                <span class="font-medium text-gray-900 capitalize">{{ source.source }}</span>
              </div>
              <div class="flex-1">
                <div class="h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    class="h-full bg-brand rounded-lg transition-all duration-500"
                    :style="{ width: `${(source.sessions / maxSessions) * 100}%` }"
                  ></div>
                </div>
              </div>
              <div class="w-32 text-right">
                <span class="font-medium text-gray-900">{{ formatNumber(source.sessions) }}</span>
                <span class="text-gray-500 text-sm ml-1">sessions</span>
              </div>
              <div class="w-24 text-right">
                <span class="text-green-600 font-medium">{{ source.conversions }}</span>
                <span class="text-gray-500 text-sm ml-1">conv.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Record Conversion & Settings -->
      <div class="px-4 py-4 sm:px-0">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Record Manual Conversion -->
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="flex items-center gap-3 mb-5">
              <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 class="text-lg font-semibold text-gray-900">Record Conversion</h2>
            </div>
            <form @submit.prevent="recordConversion" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                  <input
                    v-model="newConversion.eventName"
                    type="text"
                    placeholder="e.g., purchase, signup"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">AI Source</label>
                  <select
                    v-model="newConversion.source"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm"
                  >
                    <option value="chatgpt">ChatGPT</option>
                    <option value="claude">Claude</option>
                    <option value="gemini">Gemini</option>
                    <option value="perplexity">Perplexity</option>
                    <option value="copilot">Copilot</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Value ($)</label>
                <input
                  v-model.number="newConversion.value"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm"
                />
              </div>
              <button
                type="submit"
                :disabled="recording"
                class="w-full py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {{ recording ? 'Recording...' : 'Record Conversion' }}
              </button>
            </form>
          </div>

          <!-- Settings -->
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="flex items-center gap-3 mb-5">
              <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 class="text-lg font-semibold text-gray-900">ROI Settings</h2>
            </div>
            <form @submit.prevent="saveSettings" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Conversion Goal</label>
                <input
                  v-model="settings.conversionGoal"
                  type="text"
                  placeholder="e.g., purchase, signup, demo_request"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Average Conversion Value ($)</label>
                <input
                  v-model.number="settings.avgConversionValue"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm"
                />
              </div>
              <button
                type="submit"
                :disabled="savingSettings"
                class="w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {{ savingSettings ? 'Saving...' : 'Save Settings' }}
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Recent Conversions -->
      <div class="px-4 py-4 sm:px-0">
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-gray-900">Recent Conversions</h2>
          </div>

          <div v-if="recentConversions.length === 0" class="text-center py-8">
            <p class="text-gray-500">No conversions recorded yet</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="conv in recentConversions"
              :key="conv.id"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg class="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div class="font-medium text-gray-900 text-sm">{{ conv.event_name }}</div>
                  <div class="text-xs text-gray-500">{{ formatDate(conv.occurred_at) }}</div>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-medium capitalize">
                  {{ conv.source }}
                </span>
                <span class="font-medium text-green-600">${{ conv.value?.toFixed(2) || '0.00' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()

const loading = ref(true)
const recording = ref(false)
const savingSettings = ref(false)
const selectedPeriod = ref(30)

const summary = ref({
  totalSessions: 0,
  totalConversions: 0,
  conversionValue: 0,
  conversionRate: 0,
  roiPercentage: 0
})

const topSources = ref<any[]>([])
const recentConversions = ref<any[]>([])

const newConversion = ref({
  eventName: '',
  source: 'chatgpt',
  value: 0
})

const settings = ref({
  conversionGoal: '',
  avgConversionValue: 0
})

const maxSessions = computed(() => {
  return Math.max(...topSources.value.map(s => s.sessions), 1)
})

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data, error } = await supabase.functions.invoke('roi-calculator', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      method: 'GET',
      query: { action: 'summary', days: selectedPeriod.value.toString() }
    })

    if (error) throw error

    if (data?.summary) {
      summary.value = {
        totalSessions: data.summary.total_ai_sessions || data.summary.totalSessions || 0,
        totalConversions: data.summary.total_conversions || data.summary.totalConversions || 0,
        conversionValue: data.summary.total_conversion_value || data.summary.conversionValue || 0,
        conversionRate: (data.summary.conversion_rate || data.summary.conversionRate || 0) * 100,
        roiPercentage: data.summary.roi_percentage || 0
      }
    }

    if (data?.trafficTrend) {
      // Aggregate by source
      const sourceMap = new Map()
      for (const item of data.trafficTrend) {
        const existing = sourceMap.get(item.source) || { sessions: 0, conversions: 0 }
        existing.sessions += item.sessions || 0
        existing.conversions += item.conversions || 0
        sourceMap.set(item.source, existing)
      }
      topSources.value = Array.from(sourceMap.entries())
        .map(([source, data]) => ({ source, ...data }))
        .sort((a, b) => b.sessions - a.sessions)
    }

    recentConversions.value = data?.recentConversions || []

    if (data?.integration) {
      settings.value = {
        conversionGoal: data.integration.conversionGoal || '',
        avgConversionValue: data.integration.avgConversionValue || 0
      }
    }
  } catch (error) {
    console.error('Error loading ROI data:', error)
  } finally {
    loading.value = false
  }
}

const recordConversion = async () => {
  recording.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const { error } = await supabase.functions.invoke('roi-calculator', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: {
        eventName: newConversion.value.eventName,
        source: newConversion.value.source,
        value: newConversion.value.value
      },
      method: 'POST',
      query: { action: 'record-conversion' }
    })

    if (error) throw error

    newConversion.value = { eventName: '', source: 'chatgpt', value: 0 }
    await loadData()
  } catch (error: any) {
    console.error('Error recording conversion:', error)
    alert(`Failed to record conversion: ${error.message}`)
  } finally {
    recording.value = false
  }
}

const saveSettings = async () => {
  savingSettings.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const { error } = await supabase.functions.invoke('roi-calculator', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: {
        conversionGoal: settings.value.conversionGoal,
        avgConversionValue: settings.value.avgConversionValue
      },
      method: 'POST',
      query: { action: 'save-settings' }
    })

    if (error) throw error
    alert('Settings saved!')
  } catch (error: any) {
    console.error('Error saving settings:', error)
    alert(`Failed to save settings: ${error.message}`)
  } finally {
    savingSettings.value = false
  }
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}
</script>
