<template>
  <Transition name="slide-up">
    <div
      v-if="jobCount > 0"
      class="fixed bottom-4 right-4 z-50"
    >
      <div class="flex items-center gap-2 px-3 py-1.5 bg-gray-900/90 backdrop-blur-sm text-white text-xs font-medium rounded-full shadow-lg">
        <div class="w-2 h-2 rounded-full bg-brand animate-pulse"></div>
        <span>{{ primaryJobLabel }}</span>
        <span v-if="additionalJobsCount > 0" class="text-gray-400">+{{ additionalJobsCount }}</span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { jobCount, primaryJobLabel, additionalJobsCount, subscribe } = useActiveJobs()

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
