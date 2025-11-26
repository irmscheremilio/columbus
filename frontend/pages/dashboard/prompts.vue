<template>
  <div>
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <!-- Page header -->
      <div class="px-4 py-6 sm:px-0">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Search Prompts</h1>
            <p class="mt-2 text-gray-600">
              Manage and customize the search prompts used to test your AI visibility
            </p>
          </div>
          <button @click="showAddPrompt = true" class="btn-primary">
            + Add Custom Prompt
          </button>
        </div>

        <!-- Product Info -->
        <div v-if="productAnalysis" class="card-highlight mb-6">
          <h2 class="text-lg font-semibold mb-2">{{ productAnalysis.product_name }}</h2>
          <p class="text-gray-600 text-sm mb-4">{{ productAnalysis.product_description }}</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="feature in productAnalysis.key_features"
              :key="feature"
              class="px-3 py-1 bg-brand/10 text-brand rounded-full text-sm"
            >
              {{ feature }}
            </span>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div class="card-highlight">
            <div class="text-sm text-gray-500">Total Prompts</div>
            <div class="text-2xl font-bold">{{ prompts.length }}</div>
          </div>
          <div class="card-highlight">
            <div class="text-sm text-gray-500">Level 1 (Broad)</div>
            <div class="text-2xl font-bold">{{ promptsByLevel[1] || 0 }}</div>
          </div>
          <div class="card-highlight">
            <div class="text-sm text-gray-500">Level 2 (Specific)</div>
            <div class="text-2xl font-bold">{{ promptsByLevel[2] || 0 }}</div>
          </div>
          <div class="card-highlight">
            <div class="text-sm text-gray-500">Level 3 (Detailed)</div>
            <div class="text-2xl font-bold">{{ promptsByLevel[3] || 0 }}</div>
          </div>
        </div>

        <!-- Filter tabs -->
        <div class="mb-6 flex gap-2">
          <button
            @click="filter = 'all'"
            class="px-4 py-2 rounded-lg font-medium transition-colors"
            :class="filter === 'all' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            All Prompts
          </button>
          <button
            @click="filter = 1"
            class="px-4 py-2 rounded-lg font-medium transition-colors"
            :class="filter === 1 ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            Level 1
          </button>
          <button
            @click="filter = 2"
            class="px-4 py-2 rounded-lg font-medium transition-colors"
            :class="filter === 2 ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            Level 2
          </button>
          <button
            @click="filter = 3"
            class="px-4 py-2 rounded-lg font-medium transition-colors"
            :class="filter === 3 ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            Level 3
          </button>
          <button
            @click="filter = 'custom'"
            class="px-4 py-2 rounded-lg font-medium transition-colors"
            :class="filter === 'custom' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            Custom
          </button>
        </div>

        <!-- Prompts List -->
        <div class="space-y-3">
          <div
            v-for="prompt in filteredPrompts"
            :key="prompt.id"
            class="card-highlight hover:border-brand/30 transition-colors"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <span
                    class="px-2 py-1 rounded text-xs font-bold text-white"
                    :class="getLevelColor(prompt.granularity_level)"
                  >
                    L{{ prompt.granularity_level }}
                  </span>
                  <span
                    v-if="prompt.is_custom"
                    class="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium"
                  >
                    Custom
                  </span>
                  <span
                    v-if="prompt.category"
                    class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                  >
                    {{ prompt.category }}
                  </span>
                </div>
                <p class="text-gray-900 font-medium">{{ prompt.prompt_text }}</p>
                <p v-if="prompt.lastTested" class="text-sm text-gray-500 mt-2">
                  Last tested: {{ formatDate(prompt.lastTested) }}
                </p>
              </div>
              <div class="flex gap-2">
                <button
                  @click="editPrompt(prompt)"
                  class="p-2 text-gray-400 hover:text-brand transition-colors"
                  title="Edit"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>
                <button
                  @click="deletePrompt(prompt.id)"
                  class="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div v-if="filteredPrompts.length === 0" class="text-center py-12 text-gray-500">
            No prompts found for this filter.
          </div>
        </div>
      </div>
    </main>

    <!-- Add/Edit Prompt Modal -->
    <Teleport to="body">
      <div
        v-if="showAddPrompt || editingPrompt"
        class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        @click.self="closeModal"
      >
        <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
          <!-- Modal Header -->
          <div class="flex items-center justify-between p-6 border-b border-gray-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-semibold text-gray-900">
                  {{ editingPrompt ? 'Edit Prompt' : 'Add Custom Prompt' }}
                </h2>
                <p class="text-sm text-gray-500">Create a custom search prompt to test</p>
              </div>
            </div>
            <button
              @click="closeModal"
              class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                Prompt Text
              </label>
              <textarea
                v-model="promptForm.text"
                rows="3"
                class="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
                placeholder="e.g., What tools can help agencies create quick demos?"
              ></textarea>
              <p class="text-xs text-gray-400 mt-1.5">Write a natural question that users might ask AI assistants</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  Granularity Level
                </label>
                <select
                  v-model.number="promptForm.level"
                  class="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand appearance-none cursor-pointer"
                >
                  <option :value="1">Level 1 - Broad</option>
                  <option :value="2">Level 2 - Specific</option>
                  <option :value="3">Level 3 - Detailed</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  Category
                  <span class="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  v-model="promptForm.category"
                  type="text"
                  class="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  placeholder="e.g., discovery"
                />
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
            <button
              @click="closeModal"
              class="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="savePrompt"
              class="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors"
            >
              <svg v-if="!editingPrompt" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {{ editingPrompt ? 'Save Changes' : 'Add Prompt' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
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

const prompts = ref<any[]>([])
const productAnalysis = ref<any>(null)
const filter = ref<'all' | 1 | 2 | 3 | 'custom'>('all')
const showAddPrompt = ref(false)
const editingPrompt = ref<any>(null)

const promptForm = ref({
  text: '',
  level: 1,
  category: ''
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

// Watch for product changes to reload data
watch(activeProductId, async (newProductId) => {
  if (newProductId) {
    await loadPrompts()
    await loadProductAnalysis()
  }
})

onMounted(async () => {
  // Wait for product to be initialized
  if (productInitialized.value && activeProductId.value) {
    await loadPrompts()
    await loadProductAnalysis()
  } else {
    const unwatch = watch(productInitialized, async (initialized) => {
      if (initialized && activeProductId.value) {
        await loadPrompts()
        await loadProductAnalysis()
        unwatch()
      }
    })
  }
})

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

const loadProductAnalysis = async () => {
  const productId = activeProductId.value
  if (!productId) return

  const { data } = await supabase
    .from('product_analyses')
    .select('*')
    .eq('product_id', productId)
    .single()

  productAnalysis.value = data
}

const getLevelColor = (level: number) => {
  switch (level) {
    case 1: return 'bg-green-500'
    case 2: return 'bg-yellow-500'
    case 3: return 'bg-orange-500'
    default: return 'bg-gray-500'
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const editPrompt = (prompt: any) => {
  editingPrompt.value = prompt
  promptForm.value = {
    text: prompt.prompt_text,
    level: prompt.granularity_level || 1,
    category: prompt.category || ''
  }
}

const closeModal = () => {
  showAddPrompt.value = false
  editingPrompt.value = null
  promptForm.value = {
    text: '',
    level: 1,
    category: ''
  }
}

const savePrompt = async () => {
  if (!promptForm.value.text) return

  const productId = activeProductId.value
  if (!productId) return

  try {
    if (editingPrompt.value) {
      // Update existing prompt
      await supabase
        .from('prompts')
        .update({
          prompt_text: promptForm.value.text,
          granularity_level: promptForm.value.level,
          category: promptForm.value.category || null
        })
        .eq('id', editingPrompt.value.id)
    } else {
      // Insert new custom prompt
      await supabase
        .from('prompts')
        .insert({
          product_id: productId,
          prompt_text: promptForm.value.text,
          granularity_level: promptForm.value.level,
          category: promptForm.value.category || null,
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
  if (!confirm('Are you sure you want to delete this prompt?')) return

  try {
    await supabase
      .from('prompts')
      .delete()
      .eq('id', promptId)

    await loadPrompts()
  } catch (error) {
    console.error('Error deleting prompt:', error)
    alert('Failed to delete prompt')
  }
}
</script>
