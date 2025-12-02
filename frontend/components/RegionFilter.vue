<template>
  <div class="relative" ref="dropdownRef">
    <button
      type="button"
      @click="showDropdown = !showDropdown"
      class="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors shadow-sm"
      :class="{ 'ring-2 ring-brand/20 border-brand': showDropdown }"
    >
      <span v-if="selectedRegion" class="text-base leading-none">{{ selectedRegionInfo?.flag }}</span>
      <svg v-else class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span class="text-gray-700 font-medium">
        {{ selectedRegion ? selectedRegionInfo?.name : 'All Regions' }}
      </span>
      <svg class="w-4 h-4 text-gray-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="showDropdown"
        class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1 max-h-72 overflow-y-auto"
      >
        <!-- All Regions option -->
        <button
          type="button"
          @click="selectRegion(null)"
          class="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
          :class="{ 'bg-brand/5 text-brand': !selectedRegion }"
        >
          <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="font-medium">All Regions</span>
          <svg v-if="!selectedRegion" class="w-4 h-4 ml-auto text-brand" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>

        <!-- Divider -->
        <div v-if="availableRegions.length > 0" class="border-t border-gray-100 my-1"></div>

        <!-- Available regions -->
        <button
          v-for="region in availableRegions"
          :key="region.code"
          type="button"
          @click="selectRegion(region.code)"
          class="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
          :class="{ 'bg-brand/5 text-brand': selectedRegion === region.code }"
        >
          <span class="text-lg leading-none">{{ region.flag }}</span>
          <span class="font-medium">{{ region.name }}</span>
          <svg v-if="selectedRegion === region.code" class="w-4 h-4 ml-auto text-brand" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>

        <!-- Empty state -->
        <div v-if="availableRegions.length === 0 && !loadingRegions" class="px-4 py-3 text-sm text-gray-400 text-center">
          No region data available yet
        </div>

        <!-- Loading state -->
        <div v-if="loadingRegions" class="px-4 py-3 text-sm text-gray-400 text-center flex items-center justify-center gap-2">
          <div class="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-brand"></div>
          Loading...
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
  (e: 'change', value: string | null): void
}>()

const {
  availableRegions,
  selectedRegion,
  selectedRegionInfo,
  loadingRegions,
  loadAvailableRegions,
  setSelectedRegion
} = useRegionFilter()

const showDropdown = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// Sync with v-model
watch(() => props.modelValue, (newVal) => {
  setSelectedRegion(newVal)
}, { immediate: true })

const selectRegion = (code: string | null) => {
  setSelectedRegion(code)
  emit('update:modelValue', code)
  emit('change', code)
  showDropdown.value = false
}

// Close dropdown when clicking outside
const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  loadAvailableRegions()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
