/**
 * Global date range composable for consistent date filtering across all pages
 */

export interface DateRange {
  startDate: Date | null
  endDate: Date | null
  preset: string // '7', '30', '90', 'all', 'custom'
}

// Global state shared across all components
const selectedPreset = ref<string>('7')
const customStartDate = ref<Date | null>(null)
const customEndDate = ref<Date | null>(null)

export const useDateRange = () => {
  const presets = [
    { value: '7', label: '7D' },
    { value: '30', label: '30D' },
    { value: '90', label: '90D' },
    { value: 'all', label: 'All' },
    { value: 'custom', label: 'Custom' }
  ]

  const dateRange = computed<DateRange>(() => {
    if (selectedPreset.value === 'custom') {
      return {
        startDate: customStartDate.value,
        endDate: customEndDate.value,
        preset: 'custom'
      }
    }

    if (selectedPreset.value === 'all') {
      return {
        startDate: null,
        endDate: null,
        preset: 'all'
      }
    }

    const daysAgo = parseInt(selectedPreset.value)
    const start = new Date()
    start.setDate(start.getDate() - daysAgo)
    start.setHours(0, 0, 0, 0)

    return {
      startDate: start,
      endDate: new Date(),
      preset: selectedPreset.value
    }
  })

  const setPreset = (preset: string) => {
    selectedPreset.value = preset
  }

  const setCustomRange = (start: Date, end: Date) => {
    customStartDate.value = start
    customEndDate.value = end
    selectedPreset.value = 'custom'
  }

  // Get ISO string for database queries (null for 'all')
  const getStartDateISO = (): string | null => {
    return dateRange.value.startDate?.toISOString() || null
  }

  const getEndDateISO = (): string | null => {
    return dateRange.value.endDate?.toISOString() || null
  }

  // Get days as number (for backwards compatibility)
  const getDays = (): number | null => {
    if (selectedPreset.value === 'all' || selectedPreset.value === 'custom') {
      return null
    }
    return parseInt(selectedPreset.value)
  }

  // Format display label
  const displayLabel = computed(() => {
    if (selectedPreset.value === 'custom' && customStartDate.value && customEndDate.value) {
      const startStr = customStartDate.value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const endStr = customEndDate.value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      return `${startStr} - ${endStr}`
    }
    const preset = presets.find(p => p.value === selectedPreset.value)
    return preset?.label || '7D'
  })

  return {
    presets,
    selectedPreset,
    customStartDate,
    customEndDate,
    dateRange,
    displayLabel,
    setPreset,
    setCustomRange,
    getStartDateISO,
    getEndDateISO,
    getDays
  }
}
