<template>
  <div v-if="jobCount > 0" class="fixed bottom-0 right-0 z-50 pointer-events-none">
    <!-- Hover detection zone -->
    <div
      class="absolute bottom-0 right-0 w-48 h-20 pointer-events-auto"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    ></div>

    <!-- Badge -->
    <Transition name="slide-up">
      <div
        v-if="jobCount > 0"
        class="absolute bottom-4 right-4 transition-transform duration-300 ease-out"
        :class="isHovered ? 'translate-y-16' : 'translate-y-0'"
      >
        <div class="flex items-center gap-2 px-3 py-1.5 bg-gray-900/90 backdrop-blur-sm text-white text-xs font-medium rounded-full shadow-lg whitespace-nowrap">
          <div class="w-2 h-2 rounded-full bg-brand animate-pulse shrink-0"></div>
          <span>{{ primaryJobLabel }}</span>
          <span v-if="additionalJobsCount > 0" class="text-gray-400">+{{ additionalJobsCount }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const { jobCount, primaryJobLabel, additionalJobsCount, subscribe } = useActiveJobs()

const isHovered = ref(false)
let cleanup: (() => void) | undefined

onMounted(async () => {
  cleanup = await subscribe()
})

onUnmounted(() => {
  cleanup?.()
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
