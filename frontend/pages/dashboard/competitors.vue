<template>
  <div>
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Competitor Tracking</h1>
            <p class="mt-2 text-gray-600">
              Track and compare your visibility against competitors
            </p>
          </div>
          <button class="btn-primary" @click="showAddModal = true">
            Add Competitor
          </button>
        </div>

        <!-- Competitors List -->
        <div v-if="loading" class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
        </div>

        <div v-else-if="!competitors.length" class="card-highlight text-center py-12">
          <p class="text-gray-500 mb-4">
            No competitors added yet. Start tracking your competitors to see where they appear in AI responses.
          </p>
          <button class="btn-primary" @click="showAddModal = true">
            Add Your First Competitor
          </button>
        </div>

        <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="competitor in competitors"
            :key="competitor.id"
            class="card-highlight"
          >
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-lg font-semibold">{{ competitor.name }}</h3>
                <p class="text-sm text-gray-500">{{ competitor.domain }}</p>
              </div>
              <button
                @click="toggleActive(competitor)"
                class="text-sm px-3 py-1 rounded-full"
                :class="competitor.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
              >
                {{ competitor.is_active ? 'Active' : 'Inactive' }}
              </button>
            </div>

            <div class="space-y-2 mb-4">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Visibility Score</span>
                <span class="font-semibold">{{ competitor.visibilityScore || 'N/A' }}</span>
              </div>
            </div>

            <div class="flex gap-2">
              <button
                @click="removeCompetitor(competitor)"
                class="btn-outline text-sm flex-1"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Add Competitor Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="showAddModal = false"
    >
      <div class="bg-white rounded-lg p-8 max-w-md w-full">
        <h3 class="text-2xl font-bold mb-4">Add Competitor</h3>
        <form @submit.prevent="addCompetitor" class="space-y-4">
          <div>
            <label class="label">Competitor Name</label>
            <input
              v-model="newCompetitor.name"
              type="text"
              required
              class="input"
              placeholder="Competitor Inc."
            />
          </div>
          <div>
            <label class="label">Website (Optional)</label>
            <input
              v-model="newCompetitor.domain"
              type="url"
              class="input"
              placeholder="https://competitor.com"
            />
          </div>
          <div class="flex gap-3">
            <button
              type="button"
              @click="showAddModal = false"
              class="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn-primary flex-1"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Adding...' : 'Add Competitor' }}
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
const user = useSupabaseUser()
const { activeProductId, initialized: productInitialized } = useActiveProduct()

const loading = ref(true)
const competitors = ref<any[]>([])
const showAddModal = ref(false)
const isSubmitting = ref(false)
const newCompetitor = ref({ name: '', domain: '' })

// Watch for product changes to reload data
watch(activeProductId, async (newProductId) => {
  if (newProductId) {
    await loadCompetitors()
  }
})

onMounted(async () => {
  // Wait for product to be initialized
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
</script>
