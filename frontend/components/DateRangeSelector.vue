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

      <!-- Custom Date Picker Dropdown -->
      <Transition name="dropdown">
        <div
          v-if="showCustomPicker"
          class="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 min-w-[280px]"
        >
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                v-model="tempStartDate"
                :max="tempEndDate || today"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                v-model="tempEndDate"
                :min="tempStartDate"
                :max="today"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                @click="cancelCustom"
                class="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                @click="applyCustom"
                :disabled="!tempStartDate || !tempEndDate"
                class="px-3 py-1.5 text-xs font-medium bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>

  <!-- Backdrop to close picker -->
  <div
    v-if="showCustomPicker"
    class="fixed inset-0 z-40"
    @click="cancelCustom"
  ></div>
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

const toggleCustomPicker = () => {
  if (showCustomPicker.value) {
    cancelCustom()
  } else {
    // Initialize with current custom values or last 7 days
    if (customStartDate.value) {
      tempStartDate.value = customStartDate.value.toISOString().split('T')[0]
    } else {
      const d = new Date()
      d.setDate(d.getDate() - 7)
      tempStartDate.value = d.toISOString().split('T')[0]
    }

    if (customEndDate.value) {
      tempEndDate.value = customEndDate.value.toISOString().split('T')[0]
    } else {
      tempEndDate.value = today.value
    }

    showCustomPicker.value = true
  }
}

const applyCustom = () => {
  if (tempStartDate.value && tempEndDate.value) {
    const start = new Date(tempStartDate.value)
    start.setHours(0, 0, 0, 0)

    const end = new Date(tempEndDate.value)
    end.setHours(23, 59, 59, 999)

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
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
