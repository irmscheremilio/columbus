<template>
  <div
    class="group relative h-[340px] md:h-[380px] overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-sm"
  >
    <!-- Animated SVG visualization -->
    <div class="pointer-events-none relative flex h-[240px] md:h-[280px] w-full select-none items-center justify-center overflow-hidden" style="mask: radial-gradient(ellipse 80% 70% at 50% 45%, white 30%, transparent 70%);">
      <svg class="w-full h-full" viewBox="0 0 400 250" fill="none">
        <defs>
          <linearGradient id="radar-sweep-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#F29901" stop-opacity="0" />
            <stop offset="70%" stop-color="#F29901" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#F29901" stop-opacity="0.6" />
          </linearGradient>
          <filter id="radar-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="blip-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- Background grid -->
        <g stroke="rgba(255,255,255,0.06)" stroke-width="1">
          <!-- Vertical lines -->
          <line x1="80" y1="0" x2="80" y2="250" />
          <line x1="160" y1="0" x2="160" y2="250" />
          <line x1="240" y1="0" x2="240" y2="250" />
          <line x1="320" y1="0" x2="320" y2="250" />
          <!-- Horizontal lines -->
          <line x1="0" y1="50" x2="400" y2="50" />
          <line x1="0" y1="100" x2="400" y2="100" />
          <line x1="0" y1="150" x2="400" y2="150" />
          <line x1="0" y1="200" x2="400" y2="200" />
        </g>

        <!-- Radar center point -->
        <g transform="translate(200, 125)">
          <!-- Radar circles and cross lines -->
          <g
            :style="{ opacity: isHovered ? 0.7 : 0.4 }"
            :filter="isHovered ? 'url(#radar-glow)' : 'none'"
            class="transition-all duration-500"
          >
            <circle r="100" fill="none" stroke="#F29901" stroke-width="1" />
            <circle r="70" fill="none" stroke="#F29901" stroke-width="1" />
            <circle r="40" fill="none" stroke="#F29901" stroke-width="1" />

            <!-- Cross lines -->
            <line x1="-100" y1="0" x2="100" y2="0" stroke="#F29901" stroke-width="1" />
            <line x1="0" y1="-100" x2="0" y2="100" stroke="#F29901" stroke-width="1" />
          </g>

          <!-- Center dot -->
          <circle r="4" fill="#F29901" :fill-opacity="isHovered ? 0.6 : 0.4" class="transition-all duration-300" />

          <!-- Radar sweep -->
          <g :style="{ transform: `rotate(${sweepAngle}deg)`, transformOrigin: '0 0' }">
            <!-- Sweep trail (pie slice) -->
            <path
              d="M0,0 L0,-100 A100,100 0 0,1 70.7,-70.7 Z"
              :fill="isHovered ? 'url(#radar-sweep-gradient)' : 'none'"
              :opacity="isHovered ? 0.5 : 0"
              class="transition-opacity duration-300"
            />
            <!-- Sweep line -->
            <line
              x1="0" y1="0" x2="0" y2="-100"
              stroke="#F29901"
              :stroke-opacity="isHovered ? 0.8 : 0.2"
              stroke-width="2"
              filter="url(#radar-glow)"
              class="transition-all duration-300"
            />
          </g>

          <!-- Platform blips -->
          <!-- ChatGPT - top right -->
          <g transform="translate(55, -45)" filter="url(#blip-glow)">
            <circle r="8"
              fill="#F29901"
              :fill-opacity="blipStates[0]"
            />
            <circle r="12"
              fill="none"
              stroke="#F29901"
              :stroke-opacity="blipStates[0] * 0.5"
              stroke-width="1"
            />
            <!-- Pulse ring -->
            <circle r="12"
              fill="none"
              stroke="#F29901"
              :stroke-opacity="pulseOpacity[0]"
              stroke-width="2"
              :style="{ transform: `scale(${pulseRings[0]})` }"
            />
          </g>

          <!-- Claude - top left -->
          <g transform="translate(-50, -55)" filter="url(#blip-glow)">
            <circle r="8"
              fill="#F29901"
              :fill-opacity="blipStates[1]"
            />
            <circle r="12"
              fill="none"
              stroke="#F29901"
              :stroke-opacity="blipStates[1] * 0.5"
              stroke-width="1"
            />
            <!-- Pulse ring -->
            <circle r="12"
              fill="none"
              stroke="#F29901"
              :stroke-opacity="pulseOpacity[1]"
              stroke-width="2"
              :style="{ transform: `scale(${pulseRings[1]})` }"
            />
          </g>

          <!-- Gemini - right -->
          <g transform="translate(75, 15)" filter="url(#blip-glow)">
            <circle r="8"
              fill="#F29901"
              :fill-opacity="blipStates[2]"
            />
            <circle r="12"
              fill="none"
              stroke="#F29901"
              :stroke-opacity="blipStates[2] * 0.5"
              stroke-width="1"
            />
            <!-- Pulse ring -->
            <circle r="12"
              fill="none"
              stroke="#F29901"
              :stroke-opacity="pulseOpacity[2]"
              stroke-width="2"
              :style="{ transform: `scale(${pulseRings[2]})` }"
            />
          </g>

          <!-- Perplexity - bottom left -->
          <g transform="translate(-60, 40)" filter="url(#blip-glow)">
            <circle r="8"
              fill="#F29901"
              :fill-opacity="blipStates[3]"
            />
            <circle r="12"
              fill="none"
              stroke="#F29901"
              :stroke-opacity="blipStates[3] * 0.5"
              stroke-width="1"
            />
            <!-- Pulse ring -->
            <circle r="12"
              fill="none"
              stroke="#F29901"
              :stroke-opacity="pulseOpacity[3]"
              stroke-width="2"
              :style="{ transform: `scale(${pulseRings[3]})` }"
            />
          </g>

          <!-- Google AI - bottom -->
          <g transform="translate(15, 65)" filter="url(#blip-glow)">
            <circle r="8"
              fill="#F29901"
              :fill-opacity="blipStates[4]"
            />
            <circle r="12"
              fill="none"
              stroke="#F29901"
              :stroke-opacity="blipStates[4] * 0.5"
              stroke-width="1"
            />
            <!-- Pulse ring -->
            <circle r="12"
              fill="none"
              stroke="#F29901"
              :stroke-opacity="pulseOpacity[4]"
              stroke-width="2"
              :style="{ transform: `scale(${pulseRings[4]})` }"
            />
          </g>
        </g>
      </svg>
    </div>
    <!-- Text content -->
    <div class="absolute bottom-0 left-0 z-10 flex w-full flex-col gap-2 p-6 md:p-8 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent">
      <span class="text-xs font-bold tracking-wider text-brand uppercase">Step 1</span>
      <h3 class="text-lg font-semibold text-white">Automated Scanning</h3>
      <p class="text-sm text-slate-400 max-w-[320px]">Scans run fully automated in the background using your own AI accounts. Set it and forget it.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const isHovered = ref(true) // Start in hovered state
const sweepAngle = ref(0)
const blipStates = ref([0.15, 0.15, 0.15, 0.15, 0.15])
const pulseRings = ref([0, 0, 0, 0, 0])
const pulseOpacity = ref([0, 0, 0, 0, 0])

const blipAngles = [
  51,   // ChatGPT (55, -45) - top right
  318,  // Claude (-50, -55) - top left
  101,  // Gemini (75, 15) - right
  236,  // Perplexity (-60, 40) - bottom left
  167   // Google AI (15, 65) - bottom
]

let animationFrame: number | null = null

const startAnimation = () => {
  isHovered.value = true

  const animate = () => {
    if (!isHovered.value) return

    sweepAngle.value = (sweepAngle.value + 0.3) % 360

    blipAngles.forEach((angle, index) => {
      const diff = (sweepAngle.value - angle + 360) % 360

      if (diff >= 0 && diff < 0.5) {
        pulseRings.value[index] = 1
        pulseOpacity.value[index] = 0.2
      }

      if (pulseRings.value[index] > 0) {
        pulseRings.value[index] = Math.min(1.8, pulseRings.value[index] + 0.012)
        pulseOpacity.value[index] = Math.max(0, pulseOpacity.value[index] - 0.004)
      }
    })

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
