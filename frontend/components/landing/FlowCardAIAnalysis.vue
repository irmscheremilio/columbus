<template>
  <div
    class="group relative h-[340px] md:h-[380px] overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-sm"
  >
    <!-- Animated SVG visualization -->
    <div class="pointer-events-none relative flex h-[240px] md:h-[280px] w-full select-none items-center justify-center overflow-hidden" style="mask: radial-gradient(ellipse 80% 70% at 50% 45%, white 30%, transparent 70%);">
      <svg class="w-full h-full" viewBox="0 0 400 250" fill="none">
        <!-- Glow filters -->
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="connection-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="flash-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#F29901" stop-opacity="0" />
            <stop offset="40%" stop-color="#F29901" stop-opacity="1" />
            <stop offset="60%" stop-color="#FFCC66" stop-opacity="1" />
            <stop offset="100%" stop-color="#F29901" stop-opacity="0" />
          </linearGradient>
        </defs>

        <!-- Background grid -->
        <g stroke="rgba(255,255,255,0.06)" stroke-width="1">
          <line x1="80" y1="0" x2="80" y2="250" />
          <line x1="160" y1="0" x2="160" y2="250" />
          <line x1="240" y1="0" x2="240" y2="250" />
          <line x1="320" y1="0" x2="320" y2="250" />
        </g>

        <!-- Connections (behind nodes) -->
        <g
          :style="{ opacity: isHovered ? 0.7 : 0.4 }"
          :filter="isHovered ? 'url(#connection-glow)' : 'none'"
          class="transition-all duration-500"
        >
          <line x1="88" y1="60" x2="190" y2="85" stroke="#F29901" stroke-width="1" />
          <line x1="88" y1="60" x2="190" y2="135" stroke="#F29901" stroke-width="1" />
          <line x1="88" y1="110" x2="190" y2="85" stroke="#F29901" stroke-width="1" />
          <line x1="88" y1="110" x2="190" y2="135" stroke="#F29901" stroke-width="1" />
          <line x1="88" y1="160" x2="190" y2="85" stroke="#F29901" stroke-width="1" />
          <line x1="88" y1="160" x2="190" y2="135" stroke="#F29901" stroke-width="1" />
          <line x1="210" y1="85" x2="308" y2="110" stroke="#F29901" stroke-width="1" />
          <line x1="210" y1="135" x2="308" y2="110" stroke="#F29901" stroke-width="1" />
        </g>

        <!-- Animated flash lines -->
        <g filter="url(#glow)">
          <template v-for="flash in flashes" :key="flash.id">
            <line
              :x1="getFlashCoords(flash).x1"
              :y1="getFlashCoords(flash).y1"
              :x2="getFlashCoords(flash).x2"
              :y2="getFlashCoords(flash).y2"
              stroke="url(#flash-gradient)"
              stroke-width="2"
              stroke-linecap="round"
              :style="{ opacity: flash.opacity }"
            />
          </template>
        </g>

        <!-- Neural network nodes -->
        <g>
          <!-- Input layer -->
          <circle cx="80" cy="60" r="8" fill="rgba(242,153,1,0.08)" stroke="rgba(242,153,1,0.4)" stroke-width="1" />
          <circle cx="80" cy="110" r="8" fill="rgba(242,153,1,0.08)" stroke="rgba(242,153,1,0.4)" stroke-width="1" />
          <circle cx="80" cy="160" r="8" fill="rgba(242,153,1,0.08)" stroke="rgba(242,153,1,0.4)" stroke-width="1" />
          <!-- Hidden layer -->
          <circle cx="200" cy="85" r="10" fill="rgba(242,153,1,0.1)" stroke="rgba(242,153,1,0.5)" stroke-width="1" />
          <circle cx="200" cy="135" r="10" fill="rgba(242,153,1,0.1)" stroke="rgba(242,153,1,0.5)" stroke-width="1" />
          <!-- Output layer -->
          <circle cx="320" cy="110" r="12" fill="rgba(242,153,1,0.12)" stroke="rgba(242,153,1,0.6)" stroke-width="1.5" />
        </g>

        <!-- Node flash rings (overlay) -->
        <g filter="url(#glow)">
          <circle cx="80" cy="60" r="12" fill="none" stroke="#F29901" stroke-width="1" :style="{ opacity: nodeFlash.L1 * 0.4 }" />
          <circle cx="80" cy="110" r="12" fill="none" stroke="#F29901" stroke-width="1" :style="{ opacity: nodeFlash.L2 * 0.4 }" />
          <circle cx="80" cy="160" r="12" fill="none" stroke="#F29901" stroke-width="1" :style="{ opacity: nodeFlash.L3 * 0.4 }" />
          <circle cx="200" cy="85" r="14" fill="none" stroke="#F29901" stroke-width="1" :style="{ opacity: nodeFlash.H1 * 0.4 }" />
          <circle cx="200" cy="135" r="14" fill="none" stroke="#F29901" stroke-width="1" :style="{ opacity: nodeFlash.H2 * 0.4 }" />
          <circle cx="320" cy="110" r="16" fill="none" stroke="#F29901" stroke-width="1" :style="{ opacity: nodeFlash.O * 0.4 }" />
        </g>
      </svg>
    </div>
    <!-- Text content -->
    <div class="absolute bottom-0 left-0 z-10 flex w-full flex-col gap-2 p-6 md:p-8 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent">
      <span class="text-xs font-bold tracking-wider text-brand uppercase">Step 2</span>
      <h3 class="text-lg font-semibold text-white">AI Analysis</h3>
      <p class="text-sm text-slate-400 max-w-[320px]">Our AI analyzes responses to find mentions, citations, and competitive gaps.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Flash {
  id: number
  pathIndex: number
  progress: number
  opacity: number
  triggered: boolean
}

interface PathData {
  x1: number
  y1: number
  x2: number
  y2: number
  target: string
}

const pathData: PathData[] = [
  { x1: 88, y1: 60, x2: 190, y2: 85, target: 'H1' },
  { x1: 88, y1: 60, x2: 190, y2: 135, target: 'H2' },
  { x1: 88, y1: 110, x2: 190, y2: 85, target: 'H1' },
  { x1: 88, y1: 110, x2: 190, y2: 135, target: 'H2' },
  { x1: 88, y1: 160, x2: 190, y2: 85, target: 'H1' },
  { x1: 88, y1: 160, x2: 190, y2: 135, target: 'H2' },
  { x1: 210, y1: 85, x2: 308, y2: 110, target: 'O' },
  { x1: 210, y1: 135, x2: 308, y2: 110, target: 'O' }
]

const isHovered = ref(true) // Start in hovered state
const flashes = ref<Flash[]>([])
const nodeFlash = ref({
  L1: 0,
  L2: 0,
  L3: 0,
  H1: 0,
  H2: 0,
  O: 0
})

let animationFrame: number | null = null
let flashIdCounter = 0

const flashLength = 0.15

const getFlashCoords = (flash: Flash) => {
  const path = pathData[flash.pathIndex]
  const start = Math.max(0, flash.progress - flashLength)
  const end = Math.min(1, flash.progress)

  return {
    x1: path.x1 + (path.x2 - path.x1) * start,
    y1: path.y1 + (path.y2 - path.y1) * start,
    x2: path.x1 + (path.x2 - path.x1) * end,
    y2: path.y1 + (path.y2 - path.y1) * end
  }
}

const triggerNodeFlash = (nodeId: string) => {
  const key = nodeId as keyof typeof nodeFlash.value
  nodeFlash.value[key] = 1
}

const startAnimation = () => {
  isHovered.value = true
  flashes.value = []
  flashIdCounter = 0

  // Create initial flash with delay
  setTimeout(() => {
    if (!isHovered.value) return
    flashes.value.push({
      id: flashIdCounter++,
      pathIndex: 0,
      progress: 0,
      opacity: 0.6,
      triggered: false
    })
  }, 200)

  const animate = () => {
    if (!isHovered.value) return

    // Fade out node rings slowly
    Object.keys(nodeFlash.value).forEach(key => {
      const k = key as keyof typeof nodeFlash.value
      if (nodeFlash.value[k] > 0) {
        nodeFlash.value[k] = Math.max(0, nodeFlash.value[k] - 0.015)
      }
    })

    flashes.value = flashes.value
      .map(flash => {
        const newProgress = flash.progress + 0.018
        const opacity = newProgress > 0.85 ? Math.max(0, 0.6 * (1 - (newProgress - 0.85) / 0.15)) : 0.6

        if (!flash.triggered && newProgress >= 0.8) {
          const target = pathData[flash.pathIndex].target
          triggerNodeFlash(target)
          return { ...flash, progress: newProgress, opacity, triggered: true }
        }

        return { ...flash, progress: newProgress, opacity }
      })
      .filter(flash => flash.progress < 1)

    // Spawn new flashes more frequently
    if (flashes.value.length < 4 && Math.random() > 0.94) {
      const randomPath = Math.floor(Math.random() * pathData.length)
      flashes.value.push({
        id: flashIdCounter++,
        pathIndex: randomPath,
        progress: 0,
        opacity: 0.6,
        triggered: false
      })
    }

    animationFrame = requestAnimationFrame(animate)
  }

  animationFrame = requestAnimationFrame(animate)
}

// Start animation immediately on mount
onMounted(() => {
  startAnimation()
})

onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
})
</script>
