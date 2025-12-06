<template>
  <div class="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-xl p-0.5 shadow-sm border border-white/50">
    <button
      v-for="preset in visiblePresets"
      :key="preset.value"
      @click="selectPreset(preset.value)"
      class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200"
      :class="selectedPreset === preset.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
    >
      {{ preset.label }}
    </button>

    <!-- Custom Date Picker Trigger -->
    <div class="relative">
      <button
        @click="toggleCustomPicker"
        class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1"
        :class="selectedPreset === 'custom' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span v-if="selectedPreset === 'custom'">{{ customLabel }}</span>
        <span v-else>Custom</span>
      </button>
    </div>
  </div>

  <!-- Teleport modal to body -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="showCustomPicker"
        class="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998] flex items-end sm:items-center justify-center p-0 sm:p-4"
        @click.self="cancelCustom"
      >
        <div
          class="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:w-auto sm:min-w-[320px] max-h-[85vh] sm:max-h-[90vh] overflow-hidden"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 class="text-sm font-semibold text-gray-900">Custom Date Range</h3>
            <button
              @click="cancelCustom"
              class="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="p-4 space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">Start Date</label>
              <input
                type="date"
                v-model="tempStartDate"
                :max="tempEndDate || today"
                class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">End Date</label>
              <input
                type="date"
                v-model="tempEndDate"
                :min="tempStartDate"
                :max="today"
                class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <button
              @click="cancelCustom"
              class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="applyCustom"
              :disabled="!tempStartDate || !tempEndDate"
              class="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { presets, selectedPreset, setPreset, setCustomRange, customStartDate, customEndDate } = useDateRange()

const showCustomPicker = ref(false)
const tempStartDate = ref('')
const tempEndDate = ref('')

// Only show preset buttons (not custom - that's handled separately)
const visiblePresets = computed(() => presets.filter(p => p.value !== 'custom'))

const today = computed(() => {
  const d = new Date()
  return d.toISOString().split('T')[0]
})

const customLabel = computed(() => {
  if (customStartDate.value && customEndDate.value) {
    const startStr = customStartDate.value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = customEndDate.value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${startStr} - ${endStr}`
  }
  return 'Custom'
})

const selectPreset = (preset: string) => {
  setPreset(preset)
  showCustomPicker.value = false
}

// Helper to format Date as YYYY-MM-DD using local timezone
const formatDateLocal = (d: Date): string => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const toggleCustomPicker = () => {
  if (showCustomPicker.value) {
    cancelCustom()
  } else {
    // Initialize with current custom values or last 7 days
    if (customStartDate.value) {
      // Format as local date string to avoid timezone issues
      tempStartDate.value = formatDateLocal(customStartDate.value)
    } else {
      const d = new Date()
      d.setDate(d.getDate() - 7)
      tempStartDate.value = formatDateLocal(d)
    }

    if (customEndDate.value) {
      tempEndDate.value = formatDateLocal(customEndDate.value)
    } else {
      tempEndDate.value = today.value
    }

    showCustomPicker.value = true
  }
}

const applyCustom = () => {
  if (tempStartDate.value && tempEndDate.value) {
    // Parse as LOCAL dates (not UTC) to avoid timezone issues
    // new Date("YYYY-MM-DD") parses as UTC, causing off-by-one day errors
    const [startYear, startMonth, startDay] = tempStartDate.value.split('-').map(Number)
    const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0)

    const [endYear, endMonth, endDay] = tempEndDate.value.split('-').map(Number)
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999)

    setCustomRange(start, end)
    showCustomPicker.value = false
  }
}

const cancelCustom = () => {
  showCustomPicker.value = false
  tempStartDate.value = ''
  tempEndDate.value = ''
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: translateY(100%);
}

@media (min-width: 640px) {
  .modal-enter-from > div,
  .modal-leave-to > div {
    transform: scale(0.95);
  }
}
</style>
