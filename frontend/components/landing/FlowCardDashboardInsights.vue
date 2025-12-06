<template>
  <div
    class="group relative h-[340px] md:h-[380px] overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-sm"
  >
    <!-- Animated SVG visualization -->
    <div class="pointer-events-none relative flex h-[240px] md:h-[280px] w-full select-none items-center justify-center overflow-hidden" style="mask: radial-gradient(ellipse 80% 70% at 50% 45%, white 30%, transparent 70%);">
      <svg class="w-full h-full" viewBox="0 0 400 250" fill="none">
        <!-- Chart grid -->
        <g stroke="rgba(255,255,255,0.1)" stroke-width="1">
          <line x1="60" y1="40" x2="60" y2="200" />
          <line x1="60" y1="200" x2="340" y2="200" />
          <line x1="60" y1="80" x2="340" y2="80" stroke-dasharray="4 4" stroke="rgba(255,255,255,0.05)" />
          <line x1="60" y1="120" x2="340" y2="120" stroke-dasharray="4 4" stroke="rgba(255,255,255,0.05)" />
          <line x1="60" y1="160" x2="340" y2="160" stroke-dasharray="4 4" stroke="rgba(255,255,255,0.05)" />
        </g>
        <!-- Y-axis labels -->
        <g fill="rgba(255,255,255,0.4)" font-size="10">
          <text x="45" y="44" text-anchor="end">50%</text>
          <text x="45" y="84" text-anchor="end">40%</text>
          <text x="45" y="124" text-anchor="end">30%</text>
          <text x="45" y="164" text-anchor="end">20%</text>
          <text x="45" y="204" text-anchor="end">10%</text>
        </g>
        <!-- Competitor line (gray, flatter) -->
        <path
          d="M60 165 Q100 160 140 155 T220 150 T300 140 T340 135"
          stroke="rgba(150,150,150,0.5)"
          stroke-width="2"
          fill="none"
          stroke-linecap="round"
          :stroke-dasharray="isHovered ? '500 1000' : '60 1000'"
          :style="{ opacity: isHovered ? 0.7 : 0.25 }"
          class="transition-all duration-1000 ease-out"
        />
        <!-- Animated line chart (your visibility) -->
        <path
          d="M60 180 Q100 170 140 150 T220 120 T300 70 T340 60"
          stroke="url(#chart-gradient-4)"
          stroke-width="2"
          fill="none"
          stroke-linecap="round"
          :stroke-dasharray="isHovered ? '500 1000' : '80 1000'"
          :style="{ opacity: isHovered ? 1 : 0.4 }"
          class="transition-all duration-1000 ease-out"
        />
        <!-- Area under curve with clip for fill animation -->
        <defs>
          <clipPath id="area-clip">
            <rect
              x="60"
              :y="isHovered ? 40 : 200"
              width="280"
              height="160"
              class="transition-all duration-1000 ease-out"
            />
          </clipPath>
        </defs>
        <path
          d="M60 180 Q100 170 140 150 T220 120 T300 70 T340 60 L340 200 L60 200 Z"
          fill="url(#area-gradient-4)"
          clip-path="url(#area-clip)"
          :style="{ opacity: isHovered ? 0.5 : 0.15 }"
          class="transition-opacity duration-1000 ease-out"
        />
        <!-- Competitor data point -->
        <g>
          <circle
            cx="300" cy="140"
            fill="rgba(150,150,150,0.8)"
            :r="isHovered ? 4 : 2"
            :style="{ opacity: isHovered ? 0.7 : 0.2 }"
            class="transition-all duration-700 ease-out delay-400"
          />
          <!-- Competitor tooltip -->
          <g
            :style="{ opacity: isHovered ? 1 : 0 }"
            class="transition-all duration-500 ease-out delay-600"
          >
            <rect x="260" :y="isHovered ? 150 : 160" width="80" height="32" rx="4" fill="rgba(30,41,59,0.95)" stroke="rgba(150,150,150,0.3)" stroke-width="1" filter="url(#tooltip-shadow)" class="transition-all duration-500 ease-out" />
            <text x="300" :y="isHovered ? 164 : 174" fill="rgba(255,255,255,0.5)" font-size="9" text-anchor="middle" class="transition-all duration-500 ease-out">Competitor</text>
            <text x="300" :y="isHovered ? 176 : 186" fill="rgba(180,180,180,0.9)" font-size="11" font-weight="bold" text-anchor="middle" class="transition-all duration-500 ease-out">23.4%</text>
          </g>
        </g>
        <!-- Your data point -->
        <g>
          <circle
            cx="300" cy="70"
            fill="#F29901"
            :r="isHovered ? 6 : 3"
            :style="{ opacity: isHovered ? 1 : 0.3 }"
            class="transition-all duration-700 ease-out delay-500"
          />
          <!-- Tooltip -->
          <g
            :style="{ opacity: isHovered ? 1 : 0 }"
            class="transition-all duration-500 ease-out delay-700"
          >
            <rect x="260" :y="isHovered ? 30 : 40" width="80" height="32" rx="4" fill="rgba(30,41,59,0.95)" stroke="rgba(242,153,1,0.4)" stroke-width="1" filter="url(#tooltip-shadow)" class="transition-all duration-500 ease-out" />
            <text x="300" :y="isHovered ? 44 : 54" fill="rgba(255,255,255,0.6)" font-size="9" text-anchor="middle" class="transition-all duration-500 ease-out">Your Visibility</text>
            <text x="300" :y="isHovered ? 56 : 66" fill="#F29901" font-size="11" font-weight="bold" text-anchor="middle" class="transition-all duration-500 ease-out">51.9%</text>
          </g>
        </g>
        <defs>
          <linearGradient id="chart-gradient-4" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#F29901" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#F29901" />
          </linearGradient>
          <linearGradient id="area-gradient-4" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#F29901" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#F29901" stop-opacity="0.05" />
          </linearGradient>
          <filter id="tooltip-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.1"/>
          </filter>
        </defs>
      </svg>
    </div>
    <!-- Text content -->
    <div class="absolute bottom-0 left-0 z-10 flex w-full flex-col gap-2 p-6 md:p-8 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent">
      <span class="text-xs font-bold tracking-wider text-brand uppercase">Step 3</span>
      <h3 class="text-lg font-semibold text-white">View Insights</h3>
      <p class="text-sm text-slate-400 max-w-[320px]">Beautiful dashboard with visibility scores and actionable recommendations.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const isHovered = ref(true) // Start in hovered/animated state
</script>
