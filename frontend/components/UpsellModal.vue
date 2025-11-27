<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close"></div>

        <!-- Modal -->
        <div class="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
          <!-- Header -->
          <div class="relative bg-gradient-to-r from-brand to-brand/80 px-6 py-8 text-white">
            <button @click="close" class="absolute top-4 right-4 text-white/80 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div class="text-center">
              <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-4">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 class="text-xl font-bold">{{ title }}</h2>
              <p class="text-white/80 mt-1 text-sm">{{ subtitle }}</p>
            </div>
          </div>

          <!-- Content -->
          <div class="p-6">
            <!-- Usage info -->
            <div v-if="current !== undefined && limit !== undefined" class="mb-6">
              <div class="flex items-center justify-between text-sm mb-2">
                <span class="text-gray-600">{{ usageLabel }}</span>
                <span class="font-medium text-gray-900">{{ current }} / {{ limit }}</span>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="usagePercent >= 100 ? 'bg-red-500' : 'bg-brand'"
                  :style="{ width: `${Math.min(usagePercent, 100)}%` }"
                ></div>
              </div>
            </div>

            <!-- Features list -->
            <div class="space-y-3 mb-6">
              <p class="text-sm font-medium text-gray-900">Upgrade to unlock:</p>
              <div v-for="feature in features" :key="feature" class="flex items-start gap-3">
                <div class="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <svg class="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="text-sm text-gray-600">{{ feature }}</span>
              </div>
            </div>

            <!-- Plans comparison -->
            <div class="grid grid-cols-2 gap-3 mb-6">
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="text-xs font-medium text-gray-400 uppercase mb-1">Current</div>
                <div class="text-lg font-bold text-gray-900">{{ currentPlan }}</div>
                <div class="text-xs text-gray-500">{{ currentPlanDesc }}</div>
              </div>
              <div class="border-2 border-brand rounded-lg p-4 bg-brand/5">
                <div class="text-xs font-medium text-brand uppercase mb-1">Recommended</div>
                <div class="text-lg font-bold text-gray-900">{{ recommendedPlan }}</div>
                <div class="text-xs text-gray-500">{{ recommendedPlanDesc }}</div>
              </div>
            </div>

            <!-- CTA buttons -->
            <div class="space-y-3">
              <button
                @click="upgrade"
                class="w-full py-3 px-4 bg-brand text-white font-medium rounded-lg hover:bg-brand/90 transition-colors flex items-center justify-center gap-2"
              >
                <span>Upgrade Now</span>
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                @click="close"
                class="w-full py-2.5 px-4 text-gray-600 text-sm font-medium hover:text-gray-900 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  subtitle?: string
  usageLabel?: string
  current?: number
  limit?: number
  features?: string[]
  currentPlan?: string
  currentPlanDesc?: string
  recommendedPlan?: string
  recommendedPlanDesc?: string
}>(), {
  title: 'Upgrade Your Plan',
  subtitle: 'Get more out of Columbus',
  usageLabel: 'Monthly usage',
  features: () => [
    'Unlimited visibility scans',
    'Advanced competitor tracking',
    'Priority AI model access',
    'Custom report generation',
    'Email notifications'
  ],
  currentPlan: 'Free',
  currentPlanDesc: '2 scans/month',
  recommendedPlan: 'Pro',
  recommendedPlanDesc: 'Unlimited scans'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'upgrade': []
}>()

const usagePercent = computed(() => {
  if (props.limit === undefined || props.limit === 0) return 0
  return ((props.current || 0) / props.limit) * 100
})

const close = () => {
  emit('update:modelValue', false)
}

const upgrade = () => {
  emit('upgrade')
  navigateTo('/dashboard/settings?tab=billing')
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95) translateY(10px);
}
</style>
