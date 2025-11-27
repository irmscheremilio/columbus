<template>
  <div class="min-h-screen bg-gray-50">
    <div class="p-4 lg:p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Competitors</h1>
          <p class="text-sm text-gray-500">Track visibility vs competitors</p>
        </div>
        <button
          class="inline-flex items-center gap-2 px-3 py-1.5 bg-brand text-white text-sm font-medium rounded-md hover:bg-brand/90 transition-colors"
          @click="showAddModal = true"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Competitor
        </button>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Total</div>
          <div class="text-lg font-bold text-gray-900">{{ competitors.length }}</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Active</div>
          <div class="text-lg font-bold text-green-600">{{ activeCount }}</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Avg Score</div>
          <div class="text-lg font-bold text-gray-900">{{ avgScore }}</div>
        </div>
        <div class="bg-white rounded border border-gray-200 px-3 py-2">
          <div class="text-[10px] font-medium text-gray-400 uppercase">Your Rank</div>
          <div class="text-lg font-bold text-brand">#{{ yourRank }}</div>
        </div>
      </div>

      <!-- Competitors Table -->
      <div class="bg-white rounded-lg border border-gray-200">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent"></div>
        </div>
        <div v-else-if="!competitors.length" class="text-center py-12">
          <p class="text-sm text-gray-500 mb-2">No competitors tracked yet</p>
          <p class="text-xs text-gray-400 mb-4">Add competitors to compare your AI visibility</p>
          <button
            class="inline-flex items-center gap-2 px-3 py-1.5 bg-brand text-white text-sm font-medium rounded-md hover:bg-brand/90 transition-colors"
            @click="showAddModal = true"
          >
            Add First Competitor
          </button>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th class="text-left px-4 py-2 font-medium">Competitor</th>
                <th class="text-left px-4 py-2 font-medium hidden sm:table-cell">Domain</th>
                <th class="text-center px-4 py-2 font-medium">Score</th>
                <th class="text-center px-4 py-2 font-medium">Status</th>
                <th class="text-right px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="competitor in competitors"
                :key="competitor.id"
                class="text-sm hover:bg-gray-50"
              >
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-900">{{ competitor.name }}</div>
                </td>
                <td class="px-4 py-3 hidden sm:table-cell">
                  <span class="text-gray-500 text-xs">{{ competitor.domain || '-' }}</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="font-medium" :class="getScoreColor(competitor.visibilityScore)">
                    {{ competitor.visibilityScore || '-' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <button
                    @click.stop="toggleActive(competitor)"
                    class="inline-flex px-2 py-0.5 rounded text-xs font-medium transition-colors"
                    :class="competitor.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'"
                  >
                    {{ competitor.is_active ? 'Active' : 'Inactive' }}
                  </button>
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    @click="removeCompetitor(competitor)"
                    class="text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove"
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
const competitors = ref<any[]>([])
const showAddModal = ref(false)
const isSubmitting = ref(false)
const newCompetitor = ref({ name: '', domain: '' })

const activeCount = computed(() => competitors.value.filter(c => c.is_active).length)
const avgScore = computed(() => {
  const scores = competitors.value.filter(c => c.visibilityScore).map(c => c.visibilityScore)
  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : '-'
})
const yourRank = computed(() => {
  // Placeholder - would compare against your product's score
  return competitors.value.length > 0 ? '1' : '-'
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
    const { data } = await supabase
      .from('competitors')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    competitors.value = data || []
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
    const domain = newCompetitor.value.domain
      ? new URL(newCompetitor.value.domain).hostname.replace('www.', '')
      : null

    await supabase.from('competitors').insert({
      product_id: productId,
      name: newCompetitor.value.name,
      domain: domain,
      is_active: true
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

const toggleActive = async (competitor: any) => {
  try {
    await supabase
      .from('competitors')
      .update({ is_active: !competitor.is_active })
      .eq('id', competitor.id)

    await loadCompetitors()
  } catch (error) {
    console.error('Error toggling competitor:', error)
  }
}

const removeCompetitor = async (competitor: any) => {
  if (!confirm(`Remove ${competitor.name}?`)) return

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
  if (!score) return 'text-gray-400'
  if (score >= 70) return 'text-green-600'
  if (score >= 40) return 'text-yellow-600'
  return 'text-red-600'
}
</script>
