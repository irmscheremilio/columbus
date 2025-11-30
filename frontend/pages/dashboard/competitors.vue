<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
    <div class="p-4 lg:p-6 space-y-5">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-gray-900 tracking-tight">Competitors</h1>
          <p class="text-sm text-gray-500">Track visibility vs competitors</p>
        </div>
        <button
          class="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand/90 transition-colors shadow-sm"
          @click="showAddModal = true"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Competitor
        </button>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 px-4 py-3">
          <div class="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Tracking</div>
          <div class="text-xl font-bold text-gray-900">{{ trackingCompetitors.length }}</div>
        </div>
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 px-4 py-3">
          <div class="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Proposed</div>
          <div class="text-xl font-bold text-amber-600">{{ proposedCompetitors.length }}</div>
        </div>
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 px-4 py-3">
          <div class="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Avg Score</div>
          <div class="text-xl font-bold text-gray-900">{{ avgScore }}</div>
        </div>
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 px-4 py-3">
          <div class="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Your Rank</div>
          <div class="text-xl font-bold text-brand">#{{ yourRank }}</div>
        </div>
      </div>

      <!-- Proposed Competitors Section -->
      <div v-if="proposedCompetitors.length > 0" class="bg-amber-50/80 backdrop-blur-sm rounded-xl shadow-sm border border-amber-100/50 overflow-hidden">
        <div class="px-4 py-3 border-b border-amber-100/80 bg-gradient-to-r from-amber-100/50 to-transparent">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h2 class="text-sm font-semibold text-amber-800">Detected Competitors</h2>
            <span class="text-xs text-amber-600 bg-amber-100/80 px-2 py-0.5 rounded-full">{{ proposedCompetitors.length }} new</span>
          </div>
          <p class="text-xs text-amber-700 mt-1">AI detected these competitors in responses. Review and start tracking.</p>
        </div>
        <div class="divide-y divide-amber-100/80">
          <div
            v-for="competitor in proposedCompetitors"
            :key="competitor.id"
            class="px-4 py-3 flex items-center justify-between gap-4"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900">{{ competitor.name }}</span>
                <span v-if="competitor.detection_count > 1" class="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                  {{ competitor.detection_count }}x detected
                </span>
              </div>
              <p v-if="competitor.detection_context" class="text-xs text-gray-500 truncate mt-0.5" :title="competitor.detection_context">
                "{{ competitor.detection_context }}"
              </p>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                @click="approveCompetitor(competitor)"
                class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Track
              </button>
              <button
                @click="denyCompetitor(competitor)"
                class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tracking Competitors Table -->
      <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100/80 bg-gradient-to-r from-gray-50/50 to-transparent">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold text-gray-900">Tracking</h2>
            <span class="text-xs text-gray-500 bg-gray-100/80 px-2 py-0.5 rounded-full">
              {{ trackingCompetitors.length }} competitors
            </span>
          </div>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent"></div>
        </div>
        <div v-else-if="!trackingCompetitors.length" class="text-center py-12">
          <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p class="text-sm text-gray-500 mb-2">No competitors tracked yet</p>
          <p class="text-xs text-gray-400 mb-4">Add competitors manually or approve detected ones</p>
          <button
            class="inline-flex items-center gap-2 px-3 py-1.5 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand/90 transition-colors"
            @click="showAddModal = true"
          >
            Add Competitor
          </button>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-[11px] text-gray-500 uppercase tracking-wide border-b border-gray-100/80 bg-gray-50/30">
                <th class="text-left px-4 py-2.5 font-medium">Competitor</th>
                <th class="text-left px-4 py-2.5 font-medium hidden sm:table-cell">Domain</th>
                <th class="text-center px-4 py-2.5 font-medium">Mention Rate</th>
                <th class="text-center px-4 py-2.5 font-medium">Detections</th>
                <th class="text-right px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100/80">
              <tr
                v-for="competitor in trackingCompetitors"
                :key="competitor.id"
                class="text-sm hover:bg-gray-50/50 transition-colors"
              >
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="font-medium text-gray-900">{{ competitor.name }}</div>
                    <span v-if="competitor.is_auto_detected" class="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      auto
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3 hidden sm:table-cell">
                  <span class="text-gray-500 text-xs">{{ competitor.domain || '-' }}</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="font-medium" :class="getScoreColor(competitor.mention_rate)">
                    {{ competitor.mention_rate ? `${competitor.mention_rate}%` : '-' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="text-gray-500 text-xs">{{ competitor.detection_count || 0 }}</span>
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    @click="removeCompetitor(competitor)"
                    class="text-gray-400 hover:text-red-500 transition-colors"
                    title="Stop tracking"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add Competitor Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="showAddModal = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-sm w-full">
        <h3 class="text-lg font-semibold mb-4">Add Competitor</h3>
        <form @submit.prevent="addCompetitor" class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input
              v-model="newCompetitor.name"
              type="text"
              required
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
              placeholder="Competitor Inc."
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Website (Optional)</label>
            <input
              v-model="newCompetitor.domain"
              type="url"
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
              placeholder="https://competitor.com"
            />
          </div>
          <div class="flex gap-2 pt-2">
            <button
              type="button"
              @click="showAddModal = false"
              class="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 px-3 py-2 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand/90 transition-colors disabled:opacity-50"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Adding...' : 'Add' }}
            </button>
          </div>
        </form>
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
const { activeProductId, initialized: productInitialized } = useActiveProduct()

const loading = ref(true)
const allCompetitors = ref<any[]>([])
const visibilityScores = ref<Map<string, any>>(new Map())
const showAddModal = ref(false)
const isSubmitting = ref(false)
const newCompetitor = ref({ name: '', domain: '' })

// Split competitors by status
const trackingCompetitors = computed(() =>
  allCompetitors.value
    .filter(c => c.status === 'tracking')
    .map(c => ({
      ...c,
      mention_rate: visibilityScores.value.get(c.id)?.mention_rate || null
    }))
)

const proposedCompetitors = computed(() =>
  allCompetitors.value
    .filter(c => c.status === 'proposed')
    .sort((a, b) => (b.detection_count || 0) - (a.detection_count || 0))
)

const avgScore = computed(() => {
  const scores = trackingCompetitors.value
    .filter(c => c.mention_rate !== null)
    .map(c => c.mention_rate)
  return scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) + '%' : '-'
})

const yourRank = computed(() => {
  // Placeholder - would compare against your product's score
  return trackingCompetitors.value.length > 0 ? '1' : '-'
})

watch(activeProductId, async (newProductId) => {
  if (newProductId) await loadCompetitors()
})

onMounted(async () => {
  if (productInitialized.value && activeProductId.value) {
    await loadCompetitors()
  } else {
    const unwatch = watch(productInitialized, async (initialized) => {
      if (initialized && activeProductId.value) {
        await loadCompetitors()
        unwatch()
      }
    })
  }
})

const loadCompetitors = async () => {
  const productId = activeProductId.value
  if (!productId) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    // Load all competitors (excluding denied)
    const { data: competitors } = await supabase
      .from('competitors')
      .select('*')
      .eq('product_id', productId)
      .neq('status', 'denied')
      .order('created_at', { ascending: false })

    allCompetitors.value = competitors || []

    // Load visibility scores for tracking competitors
    const trackingIds = (competitors || [])
      .filter(c => c.status === 'tracking')
      .map(c => c.id)

    if (trackingIds.length > 0) {
      const { data: scores } = await supabase
        .from('competitor_visibility_scores')
        .select('competitor_id, mention_rate, score')
        .in('competitor_id', trackingIds)
        .eq('ai_model', 'overall')

      visibilityScores.value = new Map(
        (scores || []).map(s => [s.competitor_id, s])
      )
    }
  } catch (error) {
    console.error('Error loading competitors:', error)
  } finally {
    loading.value = false
  }
}

const addCompetitor = async () => {
  const productId = activeProductId.value
  if (!productId) return

  isSubmitting.value = true
  try {
    // Get organization_id from user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, active_organization_id')
      .single()

    const organizationId = profile?.active_organization_id || profile?.organization_id

    const domain = newCompetitor.value.domain
      ? new URL(newCompetitor.value.domain).hostname.replace('www.', '')
      : null

    await supabase.from('competitors').insert({
      organization_id: organizationId,
      product_id: productId,
      name: newCompetitor.value.name,
      domain: domain,
      status: 'tracking',
      is_auto_detected: false
    })

    showAddModal.value = false
    newCompetitor.value = { name: '', domain: '' }
    await loadCompetitors()
  } catch (error) {
    console.error('Error adding competitor:', error)
    alert('Failed to add competitor')
  } finally {
    isSubmitting.value = false
  }
}

const approveCompetitor = async (competitor: any) => {
  try {
    await supabase
      .from('competitors')
      .update({
        status: 'tracking',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', competitor.id)

    await loadCompetitors()
  } catch (error) {
    console.error('Error approving competitor:', error)
  }
}

const denyCompetitor = async (competitor: any) => {
  try {
    await supabase
      .from('competitors')
      .update({
        status: 'denied',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', competitor.id)

    await loadCompetitors()
  } catch (error) {
    console.error('Error denying competitor:', error)
  }
}

const removeCompetitor = async (competitor: any) => {
  if (!confirm(`Stop tracking ${competitor.name}?`)) return

  try {
    await supabase
      .from('competitors')
      .delete()
      .eq('id', competitor.id)

    await loadCompetitors()
  } catch (error) {
    console.error('Error removing competitor:', error)
  }
}

const getScoreColor = (score: number | null) => {
  if (score === null) return 'text-gray-400'
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-600'
}
</script>
