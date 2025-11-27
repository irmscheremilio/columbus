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
                <th class="text-center px-4 py-2 font-medium hidden sm:table-cell">Type</th>
                <th class="text-right px-4 py-2 font-medium w-24">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="prompt in filteredPrompts"
                :key="prompt.id"
                class="text-sm hover:bg-gray-50"
              >
                <td class="px-4 py-3">
                  <div class="text-gray-900">{{ prompt.prompt_text }}</div>
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
                      @click="editPrompt(prompt)"
                      class="p-1.5 text-gray-400 hover:text-brand transition-colors"
                      title="Edit"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                    <button
                      @click="deletePrompt(prompt.id)"
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
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const supabase = useSupabaseClient()
const { activeProductId, initialized: productInitialized } = useActiveProduct()

const prompts = ref<any[]>([])
const filter = ref<'all' | 1 | 2 | 3 | 'custom'>('all')
const showAddPrompt = ref(false)
const editingPrompt = ref<any>(null)

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

watch(activeProductId, async (newProductId) => {
  if (newProductId) await loadPrompts()
})

onMounted(async () => {
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
    category: prompt.category || ''
  }
}

const closeModal = () => {
  showAddPrompt.value = false
  editingPrompt.value = null
  promptForm.value = { text: '', level: 1, category: '' }
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
          category: promptForm.value.category || null
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
</script>
