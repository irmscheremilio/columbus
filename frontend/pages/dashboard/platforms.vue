<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
    <div class="p-4 lg:p-6 space-y-5">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-gray-900 tracking-tight">Platforms</h1>
          <p class="text-sm text-gray-500">Performance across AI platforms</p>
        </div>
        <div class="flex items-center gap-3">
          <RegionFilter v-model="selectedRegion" @change="onRegionChange" />
          <button
            class="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg shadow-sm shadow-brand/25 hover:shadow-md hover:shadow-brand/30 hover:bg-brand/95 transition-all duration-200"
            @click="loadPlatformData"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
      </div>

      <template v-else>
        <!-- Platform Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="platform in platformsWithStats"
            :key="platform.id"
            class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-4 hover:shadow-md transition-all duration-200"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                <img
                  v-if="platform.logo_url"
                  :src="platform.logo_url"
                  :alt="platform.name"
                  class="w-6 h-6 object-contain"
                  @error="($event.target as HTMLImageElement).style.display = 'none'"
                />
                <span v-else class="text-sm font-bold text-gray-600">{{ platform.name.charAt(0) }}</span>
              </div>
              <div class="flex-1">
                <h3 class="text-sm font-semibold text-gray-900">{{ platform.name }}</h3>
                <p class="text-xs text-gray-500">{{ platform.provider }}</p>
              </div>
            </div>

            <div class="space-y-3">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs text-gray-500">Mention Rate</span>
                  <span class="text-sm font-bold" :class="getScoreColor(platform.mentionRate)">{{ platform.mentionRate }}%</span>
                </div>
                <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="getBarColor(platform.mentionRate)"
                    :style="{ width: `${platform.mentionRate}%` }"
                  ></div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                <div>
                  <div class="text-[10px] text-gray-400 uppercase">Tests</div>
                  <div class="text-sm font-semibold text-gray-900">{{ platform.tests }}</div>
                </div>
                <div>
                  <div class="text-[10px] text-gray-400 uppercase">Mentions</div>
                  <div class="text-sm font-semibold text-brand">{{ platform.mentions }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="platformsWithStats.length === 0" class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-12 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No platform data yet</h3>
          <p class="text-sm text-gray-500 mb-4">Run a visibility scan to see performance across AI platforms</p>
          <NuxtLink to="/dashboard/visibility" class="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg">
            Go to Visibility
          </NuxtLink>
        </div>

        <!-- Platform Comparison Table -->
        <div v-if="platformsWithStats.length > 0" class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100/80 bg-gradient-to-r from-gray-50/50 to-transparent">
            <h2 class="text-sm font-semibold text-gray-900">Platform Comparison</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100/80">
                  <th class="text-left px-4 py-2 font-medium">Platform</th>
                  <th class="text-center px-4 py-2 font-medium">Tests</th>
                  <th class="text-center px-4 py-2 font-medium">Mentions</th>
                  <th class="text-center px-4 py-2 font-medium">Citations</th>
                  <th class="text-center px-4 py-2 font-medium">Mention Rate</th>
                  <th class="text-center px-4 py-2 font-medium">Avg Position</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100/50">
                <tr v-for="platform in platformsWithStats" :key="platform.id" class="text-sm hover:bg-gray-50/50">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                        <img
                          v-if="platform.logo_url"
                          :src="platform.logo_url"
                          :alt="platform.name"
                          class="w-4 h-4 object-contain"
                        />
                        <span v-else class="text-[10px] font-bold text-gray-600">{{ platform.name.charAt(0) }}</span>
                      </div>
                      <span class="font-medium text-gray-900">{{ platform.name }}</span>
                    </div>
                  </td>
                  <td class="text-center px-4 py-3 text-gray-600">{{ platform.tests }}</td>
                  <td class="text-center px-4 py-3 text-gray-600">{{ platform.mentions }}</td>
                  <td class="text-center px-4 py-3 text-gray-600">{{ platform.citations }}</td>
                  <td class="text-center px-4 py-3">
                    <span class="font-semibold" :class="getScoreColor(platform.mentionRate)">{{ platform.mentionRate }}%</span>
                  </td>
                  <td class="text-center px-4 py-3 text-gray-600">
                    {{ platform.avgPosition ? `#${platform.avgPosition}` : '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const supabase = useSupabaseClient()
const { activeProductId, initialized: productInitialized } = useActiveProduct()
const { platforms: aiPlatforms, loadPlatforms } = useAIPlatforms()

const loading = ref(true)
const selectedRegion = ref<string | null>(null)

interface PlatformStats {
  id: string
  name: string
  provider: string
  logo_url: string | null
  tests: number
  mentions: number
  citations: number
  mentionRate: number
  avgPosition: number | null
}

const platformsWithStats = ref<PlatformStats[]>([])

const onRegionChange = (region: string | null) => {
  selectedRegion.value = region
  loadPlatformData()
}

watch(activeProductId, async (newProductId) => {
  if (newProductId) await loadPlatformData()
})

onMounted(async () => {
  await loadPlatforms()

  if (productInitialized.value && activeProductId.value) {
    await loadPlatformData()
  } else {
    const unwatch = watch(productInitialized, async (initialized) => {
      if (initialized && activeProductId.value) {
        await loadPlatformData()
        unwatch()
      }
    })
  }
})

const loadPlatformData = async () => {
  const productId = activeProductId.value
  if (!productId) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    // Get prompt results for this product
    let query = supabase
      .from('prompt_results')
      .select('ai_model, brand_mentioned, citation_present, position')
      .eq('product_id', productId)

    if (selectedRegion.value) {
      query = query.ilike('request_country', selectedRegion.value)
    }

    const { data: results, error } = await query

    if (error) {
      console.error('Error loading platform data:', error)
      loading.value = false
      return
    }

    // Calculate stats per platform
    const statsMap = new Map<string, { tests: number; mentions: number; citations: number; positions: number[] }>()

    for (const result of results || []) {
      const platformId = result.ai_model
      if (!statsMap.has(platformId)) {
        statsMap.set(platformId, { tests: 0, mentions: 0, citations: 0, positions: [] })
      }
      const stats = statsMap.get(platformId)!
      stats.tests++
      if (result.brand_mentioned) stats.mentions++
      if (result.citation_present) stats.citations++
      if (result.position) stats.positions.push(result.position)
    }

    // Map to platform info
    platformsWithStats.value = aiPlatforms.value
      .filter(p => statsMap.has(p.id))
      .map(p => {
        const stats = statsMap.get(p.id)!
        const positions = stats.positions.filter(pos => pos > 0)
        return {
          id: p.id,
          name: p.name,
          provider: p.provider || '',
          logo_url: p.logo_url,
          tests: stats.tests,
          mentions: stats.mentions,
          citations: stats.citations,
          mentionRate: stats.tests > 0 ? Math.round((stats.mentions / stats.tests) * 100) : 0,
          avgPosition: positions.length > 0 ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length) : null
        }
      })
      .sort((a, b) => b.mentionRate - a.mentionRate)

  } catch (error) {
    console.error('Error loading platform data:', error)
  } finally {
    loading.value = false
  }
}

const getScoreColor = (score: number) => {
  if (score >= 60) return 'text-emerald-600'
  if (score >= 30) return 'text-amber-600'
  return 'text-red-600'
}

const getBarColor = (score: number) => {
  if (score >= 60) return 'bg-emerald-500'
  if (score >= 30) return 'bg-amber-500'
  return 'bg-red-500'
}
</script>
