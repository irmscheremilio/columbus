<template>
  <div class="min-h-screen bg-gray-50">
    <div class="p-4 lg:p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Prompts</h1>
          <p class="text-sm text-gray-500">Manage search prompts for visibility testing</p>
        </div>
        <button
          class="inline-flex items-center gap-2 px-3 py-1.5 bg-brand text-white text-sm font-medium rounded-md hover:bg-brand/90 transition-colors"
          @click="showAddPrompt = true"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Prompt
        </button>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Total</div>
          <div class="text-lg font-bold text-gray-900">{{ prompts.length }}</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Broad (L1)</div>
          <div class="text-lg font-bold text-green-600">{{ promptsByLevel[1] || 0 }}</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Specific (L2)</div>
          <div class="text-lg font-bold text-yellow-600">{{ promptsByLevel[2] || 0 }}</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Detailed (L3)</div>
          <div class="text-lg font-bold text-orange-600">{{ promptsByLevel[3] || 0 }}</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg border border-gray-200 p-3 mb-4">
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="f in filters"
            :key="f.value"
            @click="filter = f.value"
            class="px-2 py-1 text-xs font-medium rounded-md transition-colors"
            :class="filter === f.value ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'"
          >
            {{ f.label }}
          </button>
          <div class="ml-auto text-xs text-gray-500">{{ filteredPrompts.length }} prompts</div>
        </div>
      </div>

      <!-- Prompts Table -->
      <div class="bg-white rounded-lg border border-gray-200">
        <div v-if="filteredPrompts.length === 0" class="text-center py-12 text-sm text-gray-500">
          No prompts found for this filter
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th class="text-left px-4 py-2 font-medium">Prompt</th>
                <th class="text-center px-4 py-2 font-medium w-20">Level</th>
                <th class="text-center px-4 py-2 font-medium hidden sm:table-cell">Regions</th>
                <th class="text-center px-4 py-2 font-medium hidden sm:table-cell">Type</th>
                <th class="text-right px-4 py-2 font-medium w-24">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="prompt in filteredPrompts"
                :key="prompt.id"
                class="text-sm hover:bg-gray-50 cursor-pointer"
                @click="openPerformanceModal(prompt)"
              >
                <td class="px-4 py-3">
                  <div class="text-gray-900 flex items-center gap-2">
                    {{ prompt.prompt_text }}
                    <svg class="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div v-if="prompt.category" class="text-xs text-gray-400 mt-0.5">{{ prompt.category }}</div>
                </td>
                <td class="px-4 py-3 text-center">
                  <span
                    class="inline-flex w-6 h-6 rounded text-[10px] font-bold text-white items-center justify-center"
                    :class="getLevelColor(prompt.granularity_level)"
                  >
                    {{ prompt.granularity_level }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center hidden sm:table-cell">
                  <div v-if="prompt.target_regions && prompt.target_regions.length > 0" class="flex items-center justify-center gap-0.5">
                    <span
                      v-for="code in prompt.target_regions.slice(0, 3)"
                      :key="code"
                      class="text-base"
                      :title="getCountryName(code)"
                    >{{ getCountryFlag(code) }}</span>
                    <span v-if="prompt.target_regions.length > 3" class="text-xs text-gray-400 ml-1">
                      +{{ prompt.target_regions.length - 3 }}
                    </span>
                  </div>
                  <span v-else class="text-xs text-gray-400">Local</span>
                </td>
                <td class="px-4 py-3 text-center hidden sm:table-cell">
                  <span
                    v-if="prompt.is_custom"
                    class="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700"
                  >
                    Custom
                  </span>
                  <span v-else class="text-xs text-gray-400">Auto</span>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      @click.stop="editPrompt(prompt)"
                      class="p-1.5 text-gray-400 hover:text-brand transition-colors"
                      title="Edit"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                    <button
                      @click.stop="deletePrompt(prompt.id)"
                      class="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add/Edit Prompt Modal -->
    <Teleport to="body">
      <div
        v-if="showAddPrompt || editingPrompt"
        class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        @click.self="closeModal"
      >
        <div class="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 class="text-lg font-semibold mb-4">{{ editingPrompt ? 'Edit Prompt' : 'Add Prompt' }}</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Prompt Text</label>
              <textarea
                v-model="promptForm.text"
                rows="3"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand resize-none"
                placeholder="What tools can help with..."
              ></textarea>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Level</label>
                <select
                  v-model.number="promptForm.level"
                  class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option :value="1">1 - Broad</option>
                  <option :value="2">2 - Specific</option>
                  <option :value="3">3 - Detailed</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <input
                  v-model="promptForm.category"
                  type="text"
                  class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand"
                  placeholder="Optional"
                />
              </div>
            </div>

            <!-- Target Regions -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Target Regions</label>
              <p class="text-xs text-gray-400 mb-2">Select countries where this prompt should be tested. Leave empty for your local region only.</p>
              <div class="relative">
                <button
                  type="button"
                  @click="showRegionDropdown = !showRegionDropdown"
                  class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand text-left flex items-center justify-between bg-white"
                >
                  <span v-if="promptForm.targetRegions.length === 0" class="text-gray-400">
                    Select regions...
                  </span>
                  <span v-else class="flex flex-wrap gap-1">
                    <span
                      v-for="code in promptForm.targetRegions"
                      :key="code"
                      class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-brand/10 text-brand rounded text-xs"
                    >
                      <span class="text-sm">{{ getCountryFlag(code) }}</span>
                      {{ code.toUpperCase() }}
                    </span>
                  </span>
                  <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <!-- Dropdown -->
                <div
                  v-if="showRegionDropdown"
                  class="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  <div
                    v-for="country in availableCountries"
                    :key="country.code"
                    @click="toggleRegion(country.code)"
                    class="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 flex items-center gap-2"
                    :class="{ 'bg-brand/5': promptForm.targetRegions.includes(country.code) }"
                  >
                    <span class="text-lg">{{ country.flag_emoji || '🌐' }}</span>
                    <span class="flex-1">{{ country.name }}</span>
                    <svg
                      v-if="promptForm.targetRegions.includes(country.code)"
                      class="w-4 h-4 text-brand"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div v-if="availableCountries.length === 0" class="px-3 py-4 text-sm text-gray-400 text-center">
                    No regions available
                  </div>
                </div>
              </div>

              <!-- Clear button -->
              <button
                v-if="promptForm.targetRegions.length > 0"
                type="button"
                @click="promptForm.targetRegions = []"
                class="mt-1 text-xs text-gray-400 hover:text-gray-600"
              >
                Clear all regions
              </button>
            </div>
          </div>
          <div class="flex gap-2 mt-5">
            <button
              @click="closeModal"
              class="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="savePrompt"
              class="flex-1 px-3 py-2 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand/90 transition-colors"
            >
              {{ editingPrompt ? 'Save' : 'Add' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Performance Modal -->
    <Teleport to="body">
      <div
        v-if="selectedPrompt"
        class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        @click.self="closePerformanceModal"
      >
        <div class="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
            <div class="flex-1 min-w-0 pr-4">
              <h3 class="text-lg font-semibold text-gray-900 mb-1">Prompt Performance</h3>
              <p class="text-sm text-gray-600 line-clamp-2">{{ selectedPrompt.prompt_text }}</p>
            </div>
            <button
              @click="closePerformanceModal"
              class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- Loading State -->
            <div v-if="loadingPerformance" class="flex items-center justify-center py-20">
              <div class="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
            </div>

            <template v-else>
              <!-- Stats Summary -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="bg-gradient-to-br from-brand/10 to-brand/5 rounded-xl p-4">
                  <div class="text-xs font-medium text-brand/70 uppercase mb-1">Total Tests</div>
                  <div class="text-2xl font-bold text-brand">{{ performanceStats.totalTests }}</div>
                </div>
                <div class="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4">
                  <div class="text-xs font-medium text-emerald-600/70 uppercase mb-1">Mention Rate</div>
                  <div class="text-2xl font-bold text-emerald-600">{{ performanceStats.mentionRate }}%</div>
                </div>
                <div class="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4">
                  <div class="text-xs font-medium text-blue-600/70 uppercase mb-1">Avg Position</div>
                  <div class="text-2xl font-bold text-blue-600">{{ performanceStats.avgPosition || '—' }}</div>
                </div>
                <div class="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4">
                  <div class="text-xs font-medium text-purple-600/70 uppercase mb-1">Brand Cited</div>
                  <div class="text-2xl font-bold text-purple-600">{{ performanceStats.citationRate }}%</div>
                </div>
              </div>

              <!-- Charts Row -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Performance Over Time by Platform -->
                <div class="bg-white border border-gray-200 rounded-xl p-5">
                  <h4 class="text-sm font-semibold text-gray-900 mb-4">Mention Rate Over Time by Platform</h4>
                  <div class="h-64">
                    <canvas ref="timeChartCanvas"></canvas>
                  </div>
                </div>

                <!-- Brand vs Competitors -->
                <div class="bg-white border border-gray-200 rounded-xl p-5">
                  <h4 class="text-sm font-semibold text-gray-900 mb-4">Brand vs Competitors Visibility</h4>
                  <div class="h-64">
                    <canvas ref="comparisonChartCanvas"></canvas>
                  </div>
                </div>
              </div>

              <!-- Platform Breakdown -->
              <div class="bg-white border border-gray-200 rounded-xl p-5">
                <h4 class="text-sm font-semibold text-gray-900 mb-4">Performance by Platform</h4>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div
                    v-for="platform in platformStats"
                    :key="platform.name"
                    class="text-center p-4 rounded-lg bg-gray-50"
                  >
                    <div class="text-xs font-medium text-gray-500 mb-2">{{ formatPlatformName(platform.name) }}</div>
                    <div class="text-xl font-bold" :class="platform.mentionRate >= 50 ? 'text-emerald-600' : 'text-gray-600'">
                      {{ platform.mentionRate }}%
                    </div>
                    <div class="text-xs text-gray-400 mt-1">{{ platform.tests }} tests</div>
                  </div>
                </div>
              </div>

              <!-- Competitor Details -->
              <div v-if="competitorStats.length > 0" class="bg-white border border-gray-200 rounded-xl p-5">
                <h4 class="text-sm font-semibold text-gray-900 mb-4">Competitor Mention Rates</h4>
                <div class="space-y-3">
                  <div
                    v-for="comp in competitorStats"
                    :key="comp.name"
                    class="flex items-center gap-4"
                  >
                    <div class="w-32 text-sm font-medium text-gray-700 truncate">{{ comp.name }}</div>
                    <div class="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        :class="comp.isYou ? 'bg-brand' : 'bg-gray-400'"
                        :style="{ width: `${comp.mentionRate}%` }"
                      ></div>
                    </div>
                    <div class="w-16 text-right text-sm font-semibold" :class="comp.isYou ? 'text-brand' : 'text-gray-600'">
                      {{ comp.mentionRate }}%
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="performanceStats.totalTests === 0" class="text-center py-12">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">No scan data yet</h3>
                <p class="text-sm text-gray-500 mb-4">Run a visibility scan to see performance data for this prompt.</p>
                <NuxtLink
                  to="/dashboard/scans"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg"
                >
                  Go to Scans
                </NuxtLink>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import Chart from 'chart.js/auto'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const supabase = useSupabaseClient()
const { activeProductId, initialized: productInitialized } = useActiveProduct()
const { formatModelName } = useAIPlatforms()

const prompts = ref<any[]>([])
const filter = ref<'all' | 1 | 2 | 3 | 'custom'>('all')
const showAddPrompt = ref(false)
const editingPrompt = ref<any>(null)
const showRegionDropdown = ref(false)
const availableCountries = ref<Array<{ code: string; name: string; flag_emoji: string | null; region: string | null }>>([])

// Performance modal state
const selectedPrompt = ref<any>(null)
const loadingPerformance = ref(false)
const timeChartCanvas = ref<HTMLCanvasElement | null>(null)
const comparisonChartCanvas = ref<HTMLCanvasElement | null>(null)
let timeChart: Chart | null = null
let comparisonChart: Chart | null = null

const performanceStats = ref({
  totalTests: 0,
  mentionRate: 0,
  avgPosition: null as number | null,
  citationRate: 0
})

const platformStats = ref<Array<{ name: string; tests: number; mentionRate: number }>>([])
const competitorStats = ref<Array<{ name: string; mentionRate: number; isYou: boolean }>>([])

const formatPlatformName = (model: string) => formatModelName(model)

const filters = [
  { label: 'All', value: 'all' as const },
  { label: 'L1', value: 1 as const },
  { label: 'L2', value: 2 as const },
  { label: 'L3', value: 3 as const },
  { label: 'Custom', value: 'custom' as const }
]

const promptForm = ref({
  text: '',
  level: 1,
  category: '',
  targetRegions: [] as string[]
})

const promptsByLevel = computed(() => {
  const counts: Record<number, number> = {}
  prompts.value.forEach(p => {
    const level = p.granularity_level || 1
    counts[level] = (counts[level] || 0) + 1
  })
  return counts
})

const filteredPrompts = computed(() => {
  if (filter.value === 'all') return prompts.value
  if (filter.value === 'custom') return prompts.value.filter(p => p.is_custom)
  return prompts.value.filter(p => p.granularity_level === filter.value)
})

watch(activeProductId, async (newProductId) => {
  if (newProductId) await loadPrompts()
})

onMounted(async () => {
  // Load available countries for region selection
  await loadCountries()

  if (productInitialized.value && activeProductId.value) {
    await loadPrompts()
  } else {
    const unwatch = watch(productInitialized, async (initialized) => {
      if (initialized && activeProductId.value) {
        await loadPrompts()
        unwatch()
      }
    })
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.relative')) {
    showRegionDropdown.value = false
  }
}

const loadCountries = async () => {
  try {
    // Get countries that have static proxies configured via RPC function
    const { data: configuredCountries, error: proxyError } = await supabase
      .rpc('get_configured_proxy_countries')

    if (proxyError) {
      console.error('Error loading configured proxies:', proxyError)
      return
    }

    // Get unique country codes that have proxies
    const countryCodes = (configuredCountries || []).map((p: { country_code: string }) => p.country_code)

    if (countryCodes.length === 0) {
      availableCountries.value = []
      return
    }

    // Then fetch country details for only those countries
    const { data, error } = await supabase
      .from('proxy_countries')
      .select('code, name, flag_emoji, region')
      .eq('is_active', true)
      .in('code', countryCodes)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error loading countries:', error)
      return
    }

    availableCountries.value = data || []
  } catch (error) {
    console.error('Error loading countries:', error)
  }
}

const toggleRegion = (code: string) => {
  const index = promptForm.value.targetRegions.indexOf(code)
  if (index === -1) {
    promptForm.value.targetRegions.push(code)
  } else {
    promptForm.value.targetRegions.splice(index, 1)
  }
}

const getCountryFlag = (code: string): string => {
  const country = availableCountries.value.find(c => c.code === code)
  return country?.flag_emoji || '🌐'
}

const getCountryName = (code: string): string => {
  const country = availableCountries.value.find(c => c.code === code)
  return country?.name || code.toUpperCase()
}

const loadPrompts = async () => {
  const productId = activeProductId.value
  if (!productId) return

  const { data } = await supabase
    .from('prompts')
    .select('*')
    .eq('product_id', productId)
    .order('granularity_level', { ascending: true })

  prompts.value = data || []
}

const getLevelColor = (level: number) => {
  switch (level) {
    case 1: return 'bg-green-500'
    case 2: return 'bg-yellow-500'
    case 3: return 'bg-orange-500'
    default: return 'bg-gray-500'
  }
}

const editPrompt = (prompt: any) => {
  editingPrompt.value = prompt
  promptForm.value = {
    text: prompt.prompt_text,
    level: prompt.granularity_level || 1,
    category: prompt.category || '',
    targetRegions: prompt.target_regions || []
  }
  showRegionDropdown.value = false
}

const closeModal = () => {
  showAddPrompt.value = false
  editingPrompt.value = null
  showRegionDropdown.value = false
  promptForm.value = { text: '', level: 1, category: '', targetRegions: [] }
}

const savePrompt = async () => {
  if (!promptForm.value.text) return

  const productId = activeProductId.value
  if (!productId) return

  try {
    if (editingPrompt.value) {
      await supabase
        .from('prompts')
        .update({
          prompt_text: promptForm.value.text,
          granularity_level: promptForm.value.level,
          category: promptForm.value.category || null,
          target_regions: promptForm.value.targetRegions.length > 0 ? promptForm.value.targetRegions : null
        })
        .eq('id', editingPrompt.value.id)
    } else {
      await supabase
        .from('prompts')
        .insert({
          product_id: productId,
          prompt_text: promptForm.value.text,
          granularity_level: promptForm.value.level,
          category: promptForm.value.category || null,
          target_regions: promptForm.value.targetRegions.length > 0 ? promptForm.value.targetRegions : null,
          is_custom: true
        })
    }

    await loadPrompts()
    closeModal()
  } catch (error) {
    console.error('Error saving prompt:', error)
    alert('Failed to save prompt')
  }
}

const deletePrompt = async (promptId: string) => {
  if (!confirm('Delete this prompt?')) return

  try {
    await supabase.from('prompts').delete().eq('id', promptId)
    await loadPrompts()
  } catch (error) {
    console.error('Error deleting prompt:', error)
    alert('Failed to delete prompt')
  }
}

// Performance Modal Functions
const openPerformanceModal = async (prompt: any) => {
  selectedPrompt.value = prompt
  loadingPerformance.value = true

  try {
    await loadPerformanceData(prompt.id)
  } finally {
    loadingPerformance.value = false
  }
}

const closePerformanceModal = () => {
  selectedPrompt.value = null

  // Destroy charts
  if (timeChart) {
    timeChart.destroy()
    timeChart = null
  }
  if (comparisonChart) {
    comparisonChart.destroy()
    comparisonChart = null
  }

  // Reset stats
  performanceStats.value = {
    totalTests: 0,
    mentionRate: 0,
    avgPosition: null,
    citationRate: 0
  }
  platformStats.value = []
  competitorStats.value = []
}

const loadPerformanceData = async (promptId: string) => {
  const productId = activeProductId.value
  if (!productId) return

  // Fetch prompt results for this prompt
  const { data: results, error } = await supabase
    .from('prompt_results')
    .select('*')
    .eq('prompt_id', promptId)
    .eq('product_id', productId)
    .order('tested_at', { ascending: true })

  if (error) {
    console.error('Error loading performance data:', error)
    return
  }

  if (!results || results.length === 0) {
    performanceStats.value = {
      totalTests: 0,
      mentionRate: 0,
      avgPosition: null,
      citationRate: 0
    }
    platformStats.value = []
    competitorStats.value = []
    return
  }

  // Calculate stats
  const totalTests = results.length
  const mentions = results.filter(r => r.brand_mentioned).length
  const mentionRate = Math.round((mentions / totalTests) * 100)
  const withPosition = results.filter(r => r.position !== null && r.position > 0)
  const avgPosition = withPosition.length > 0
    ? Math.round((withPosition.reduce((sum, r) => sum + r.position, 0) / withPosition.length) * 10) / 10
    : null
  const citations = results.filter(r => r.citation_present).length
  const citationRate = Math.round((citations / totalTests) * 100)

  performanceStats.value = {
    totalTests,
    mentionRate,
    avgPosition,
    citationRate
  }

  // Calculate platform stats
  const platformMap = new Map<string, { tests: number; mentions: number }>()
  for (const r of results) {
    const platform = r.ai_model || 'unknown'
    const existing = platformMap.get(platform) || { tests: 0, mentions: 0 }
    existing.tests++
    if (r.brand_mentioned) existing.mentions++
    platformMap.set(platform, existing)
  }

  platformStats.value = Array.from(platformMap.entries()).map(([name, stats]) => ({
    name,
    tests: stats.tests,
    mentionRate: Math.round((stats.mentions / stats.tests) * 100)
  }))

  // Calculate competitor stats
  await loadCompetitorStats(promptId, productId, results)

  // Render charts after data is loaded - use setTimeout to ensure DOM is ready
  // Retry a few times in case the canvas isn't available immediately
  const tryRenderCharts = (attempts = 0) => {
    if (attempts > 5) {
      console.log('[Chart] Failed to render charts after 5 attempts')
      return
    }

    setTimeout(() => {
      if (timeChartCanvas.value && comparisonChartCanvas.value) {
        renderTimeChart(results)
        renderComparisonChart()
      } else {
        console.log(`[Chart] Canvas not ready, retrying... (attempt ${attempts + 1})`)
        tryRenderCharts(attempts + 1)
      }
    }, 100)
  }

  tryRenderCharts()
}

const loadCompetitorStats = async (promptId: string, productId: string, brandResults: any[]) => {
  // Get product info for brand name
  const { data: product } = await supabase
    .from('products')
    .select('name')
    .eq('id', productId)
    .single()

  // Get competitors
  const { data: competitors } = await supabase
    .from('competitors')
    .select('id, name')
    .eq('product_id', productId)

  if (!competitors || competitors.length === 0) {
    competitorStats.value = []
    return
  }

  // Deduplicate competitors by name (case-insensitive)
  const uniqueCompetitors = new Map<string, { id: string; name: string }>()
  for (const comp of competitors) {
    const key = comp.name.toLowerCase()
    if (!uniqueCompetitors.has(key)) {
      uniqueCompetitors.set(key, comp)
    }
  }

  // Calculate brand mention rate
  const brandMentionRate = performanceStats.value.mentionRate

  const stats: Array<{ name: string; mentionRate: number; isYou: boolean }> = [
    { name: product?.name || 'Your Brand', mentionRate: brandMentionRate, isYou: true }
  ]

  // Get competitor mention rates from the response texts
  for (const comp of uniqueCompetitors.values()) {
    let compMentions = 0
    for (const result of brandResults) {
      const responseText = (result.response_text || '').toLowerCase()
      if (responseText.includes(comp.name.toLowerCase())) {
        compMentions++
      }
    }
    const rate = brandResults.length > 0
      ? Math.round((compMentions / brandResults.length) * 100)
      : 0
    stats.push({ name: comp.name, mentionRate: rate, isYou: false })
  }

  // Sort by mention rate descending
  stats.sort((a, b) => b.mentionRate - a.mentionRate)
  competitorStats.value = stats
}

const renderTimeChart = (results: any[]) => {
  if (!timeChartCanvas.value) {
    console.log('[Chart] Time chart canvas not available')
    return
  }

  if (!results || results.length === 0) {
    console.log('[Chart] No results for time chart')
    return
  }

  // Destroy existing chart
  if (timeChart) {
    timeChart.destroy()
    timeChart = null
  }

  // Group results by date and platform
  const platformColors: Record<string, string> = {
    chatgpt: '#10B981',
    claude: '#8B5CF6',
    gemini: '#3B82F6',
    perplexity: '#F59E0B',
    searchgpt: '#EF4444'
  }

  // Get unique platforms
  const platforms = [...new Set(results.map(r => r.ai_model))]

  // Group by date (month)
  const dateGroups = new Map<string, Map<string, { total: number; mentions: number }>>()

  for (const r of results) {
    const date = new Date(r.tested_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!dateGroups.has(monthKey)) {
      dateGroups.set(monthKey, new Map())
    }

    const platformMap = dateGroups.get(monthKey)!
    const platform = r.ai_model || 'unknown'
    const existing = platformMap.get(platform) || { total: 0, mentions: 0 }
    existing.total++
    if (r.brand_mentioned) existing.mentions++
    platformMap.set(platform, existing)
  }

  // Sort dates
  const sortedDates = Array.from(dateGroups.keys()).sort()

  // Create datasets
  const datasets = platforms.map(platform => {
    const data = sortedDates.map(date => {
      const platformData = dateGroups.get(date)?.get(platform)
      if (!platformData || platformData.total === 0) return null
      return Math.round((platformData.mentions / platformData.total) * 100)
    })

    return {
      label: formatPlatformName(platform),
      data,
      borderColor: platformColors[platform] || '#6B7280',
      backgroundColor: platformColors[platform] || '#6B7280',
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6,
      spanGaps: true
    }
  })

  timeChart = new Chart(timeChartCanvas.value, {
    type: 'line',
    data: {
      labels: sortedDates.map(d => {
        const [year, month] = d.split('-')
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      }),
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: { size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value) => `${value}%`,
            font: { size: 10 }
          },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: {
          ticks: { font: { size: 10 } },
          grid: { display: false }
        }
      }
    }
  })
}

const renderComparisonChart = () => {
  if (!comparisonChartCanvas.value) {
    console.log('[Chart] Comparison chart canvas not available')
    return
  }

  if (competitorStats.value.length === 0) {
    console.log('[Chart] No competitor stats for comparison chart')
    return
  }

  // Destroy existing chart
  if (comparisonChart) {
    comparisonChart.destroy()
    comparisonChart = null
  }

  const labels = competitorStats.value.map(c => c.name)
  const data = competitorStats.value.map(c => c.mentionRate)
  const colors = competitorStats.value.map(c => c.isYou ? '#6366F1' : '#D1D5DB')

  comparisonChart = new Chart(comparisonChartCanvas.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderRadius: 6,
        barThickness: 32
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `Mention Rate: ${ctx.parsed.x}%`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value) => `${value}%`,
            font: { size: 10 }
          },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        y: {
          ticks: { font: { size: 11 } },
          grid: { display: false }
        }
      }
    }
  })
}
</script>
