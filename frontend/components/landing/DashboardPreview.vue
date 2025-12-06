<template>
  <section class="py-16 sm:py-24 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
    <div class="container mx-auto px-4">
      <!-- Section Header -->
      <div class="text-center mb-8 sm:mb-12">
        <span class="inline-block px-3 sm:px-4 py-1 bg-brand/10 text-brand rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">Live Dashboard</span>
        <h2 class="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
          See Your <span class="brand-text">Visibility</span> in Action
        </h2>
        <p class="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto px-2">
          Real-time insights into how AI platforms see your brand
        </p>
      </div>

      <!-- Product Selector (Fake) -->
      <div class="max-w-6xl mx-auto mb-6 sm:mb-8">
        <div class="flex items-center justify-center">
          <div class="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-white rounded-xl shadow-sm border border-gray-200">
            <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <img src="https://www.google.com/s2/favicons?domain=monday.com&sz=32" alt="monday.com" class="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div class="text-xs sm:text-sm font-semibold text-gray-900">monday.com</div>
              <div class="text-[9px] sm:text-[10px] text-gray-500">monday.com</div>
            </div>
            <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 ml-1 sm:ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Dashboard Preview Grid -->
      <div class="max-w-6xl mx-auto">
        <!-- Top Row: 2 cards side by side -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <!-- Platform Comparison Card -->
          <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-100/80 flex items-center gap-2">
              <div class="w-1 h-4 rounded-full bg-brand"></div>
              <div>
                <h2 class="text-sm font-semibold text-gray-900">Platform Comparison</h2>
                <p class="text-[10px] text-gray-500 mt-0.5">Visibility by AI platform</p>
              </div>
            </div>
            <div class="divide-y divide-gray-100/80">
              <div
                v-for="platform in platformsWithScores"
                :key="platform.id"
                class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors"
              >
                <div class="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <img
                    :src="platform.logo_url"
                    :alt="platform.name"
                    class="w-5 h-5 object-contain"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-medium text-gray-900">{{ platform.name }}</div>
                  <div class="h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-brand to-amber-400 transition-all duration-700"
                      :style="{ width: `${platform.score}%` }"
                    ></div>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <div class="text-sm font-bold text-gray-900 transition-all duration-500">{{ platform.score }}%</div>
                  <div class="text-[10px] text-gray-400">{{ platform.mentions }}/{{ platform.tests }}</div>
                </div>
              </div>
            </div>
            <div class="px-4 py-3 bg-gray-50/50 border-t border-gray-100/80">
              <div class="flex justify-between text-xs">
                <span class="text-gray-500">Best performer</span>
                <span class="font-semibold text-gray-900">{{ bestPlatform }}</span>
              </div>
            </div>
          </div>

          <!-- Top Citation Sources -->
          <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-100/80 flex items-center gap-2">
              <div class="w-1 h-4 rounded-full bg-blue-500"></div>
              <div>
                <h2 class="text-sm font-semibold text-gray-900">Top Citation Sources</h2>
                <p class="text-[10px] text-gray-500 mt-0.5">Most cited domains</p>
              </div>
            </div>
            <div class="divide-y divide-gray-100/80">
              <div
                v-for="(source, idx) in citationSources"
                :key="source.domain"
                class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors"
              >
                <div
                  class="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                  :class="source.isBrand ? 'bg-emerald-100 text-emerald-700' : idx < 3 ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-500'"
                >
                  {{ idx + 1 }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-medium truncate" :class="source.isBrand ? 'text-brand' : 'text-gray-900'">
                      {{ source.domain }}
                    </span>
                    <span v-if="source.isBrand" class="px-1.5 py-0.5 text-[9px] font-medium bg-emerald-50 text-emerald-700 rounded-full shrink-0">
                      You
                    </span>
                  </div>
                  <div class="h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-700"
                      :class="source.isBrand ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-brand to-amber-400'"
                      :style="{ width: `${source.percent}%` }"
                    ></div>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <div class="text-sm font-bold text-gray-900 transition-all duration-500">{{ source.percent }}%</div>
                  <div class="text-[10px] text-gray-400">{{ source.count }} cites</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Row: Full width chart -->
        <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100/80 flex items-center gap-2">
            <div class="w-1 h-4 rounded-full bg-emerald-500"></div>
            <div>
              <h2 class="text-sm font-semibold text-gray-900">Performance Over Time</h2>
              <p class="text-[10px] text-gray-500 mt-0.5">Visibility trends across competitors</p>
            </div>
          </div>
          <div class="p-4">
            <div class="h-56 relative">
              <canvas ref="chartCanvas"></canvas>
            </div>
            <!-- Legend -->
            <div class="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-gray-100">
              <div class="flex items-center gap-1.5">
                <div class="w-4 h-0.5 rounded-full bg-brand"></div>
                <span class="text-[10px] text-gray-600 font-medium">monday.com</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-4 h-0.5 rounded-full bg-[#F06A6A] opacity-70" style="background: repeating-linear-gradient(90deg, #F06A6A 0, #F06A6A 4px, transparent 4px, transparent 8px);"></div>
                <span class="text-[10px] text-gray-500">Asana</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-4 h-0.5 rounded-full bg-[#7B68EE] opacity-70" style="background: repeating-linear-gradient(90deg, #7B68EE 0, #7B68EE 4px, transparent 4px, transparent 8px);"></div>
                <span class="text-[10px] text-gray-500">ClickUp</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-4 h-0.5 rounded-full bg-[#00A1E0] opacity-70" style="background: repeating-linear-gradient(90deg, #00A1E0 0, #00A1E0 4px, transparent 4px, transparent 8px);"></div>
                <span class="text-[10px] text-gray-500">Salesforce</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Optimization Recommendations -->
        <div class="mt-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100/80 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-1 h-4 rounded-full bg-violet-500"></div>
              <div>
                <h2 class="text-sm font-semibold text-gray-900">Optimization Recommendations</h2>
                <p class="text-[10px] text-gray-500 mt-0.5">Suggestions to improve your visibility</p>
              </div>
            </div>
            <span class="px-2 py-1 text-[10px] font-semibold bg-violet-100 text-violet-700 rounded-full">3 new</span>
          </div>
          <div class="divide-y divide-gray-100/80">
            <!-- Recommendation 1: High Priority -->
            <div class="p-4 hover:bg-gray-50/50 transition-colors">
              <div class="flex gap-4">
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                    <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="px-1.5 py-0.5 text-[9px] font-bold bg-red-100 text-red-700 rounded uppercase tracking-wide">High Priority</span>
                    <span class="text-[10px] text-gray-400">ChatGPT & Claude</span>
                  </div>
                  <h3 class="text-sm font-semibold text-gray-900 mb-1">Add structured FAQ schema to pricing page</h3>
                  <p class="text-xs text-gray-500 mb-3">AI models are not finding answers to common pricing questions. Adding FAQ schema could increase visibility by ~15%.</p>
                  <div class="flex items-center gap-4">
                    <div class="flex items-center gap-1.5">
                      <div class="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div class="h-full w-[85%] bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"></div>
                      </div>
                      <span class="text-[10px] font-medium text-emerald-600">+15% impact</span>
                    </div>
                    <span class="text-[10px] text-gray-400">~2 hours effort</span>
                  </div>
                </div>
                <div class="flex-shrink-0 self-center">
                  <button class="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>

            <!-- Recommendation 2: Medium Priority -->
            <div class="p-4 hover:bg-gray-50/50 transition-colors">
              <div class="flex gap-4">
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 rounded uppercase tracking-wide">Medium Priority</span>
                    <span class="text-[10px] text-gray-400">Perplexity</span>
                  </div>
                  <h3 class="text-sm font-semibold text-gray-900 mb-1">Create comparison content vs. Asana & ClickUp</h3>
                  <p class="text-xs text-gray-500 mb-3">Competitors are being cited more in comparison queries. Publishing detailed comparison guides could capture this traffic.</p>
                  <div class="flex items-center gap-4">
                    <div class="flex items-center gap-1.5">
                      <div class="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div class="h-full w-[60%] bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"></div>
                      </div>
                      <span class="text-[10px] font-medium text-emerald-600">+10% impact</span>
                    </div>
                    <span class="text-[10px] text-gray-400">~4 hours effort</span>
                  </div>
                </div>
                <div class="flex-shrink-0 self-center">
                  <button class="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>

            <!-- Recommendation 3: Quick Win -->
            <div class="p-4 hover:bg-gray-50/50 transition-colors">
              <div class="flex gap-4">
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-700 rounded uppercase tracking-wide">Quick Win</span>
                    <span class="text-[10px] text-gray-400">All platforms</span>
                  </div>
                  <h3 class="text-sm font-semibold text-gray-900 mb-1">Update meta descriptions with feature keywords</h3>
                  <p class="text-xs text-gray-500 mb-3">Your meta descriptions are missing key feature terms that AI models use for context. Simple update across 12 pages.</p>
                  <div class="flex items-center gap-4">
                    <div class="flex items-center gap-1.5">
                      <div class="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div class="h-full w-[40%] bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"></div>
                      </div>
                      <span class="text-[10px] font-medium text-emerald-600">+5% impact</span>
                    </div>
                    <span class="text-[10px] text-gray-400">~30 min effort</span>
                  </div>
                </div>
                <div class="flex-shrink-0 self-center">
                  <button class="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div class="text-center mt-8 sm:mt-12">
          <NuxtLink
            to="/pricing"
            class="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-xl font-semibold bg-gradient-to-r from-brand to-yellow-500 text-white shadow-lg shadow-brand/30 hover:shadow-xl hover:shadow-brand/40 hover:scale-105 transition-all duration-300"
          >
            Start Tracking Your Visibility
            <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip } from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip)

const supabase = useSupabaseClient()

// Fetch platforms from database
const aiPlatforms = ref<Array<{ id: string; name: string; logo_url: string }>>([])

const { data: platformData } = await supabase
  .from('ai_platforms')
  .select('id, name, logo_url')
  .order('name')

if (platformData) {
  aiPlatforms.value = platformData
}

// ===========================================
// SINGLE SOURCE OF TRUTH FOR ALL FAKE DATA
// ===========================================

// Platform visibility data - mentions/tests determines the percentage
// Store initial values for mean reversion
const initialPlatformMentions: Record<string, number> = {
  chatgpt: 134,
  claude: 116,
  perplexity: 144,
  gemini: 90,
  google_aio: 104,
  google_ai_mode: 76,
}

const platformScores = ref<Record<string, { mentions: number; tests: number }>>({
  chatgpt: { mentions: 134, tests: 200 },
  claude: { mentions: 116, tests: 200 },
  perplexity: { mentions: 144, tests: 200 },
  gemini: { mentions: 90, tests: 200 },
  google_aio: { mentions: 104, tests: 200 },
  google_ai_mode: { mentions: 76, tests: 200 },
})

// Computed: Platform scores with calculated percentage
const platformsWithScores = computed(() => {
  return aiPlatforms.value.map(p => {
    const data = platformScores.value[p.id] || { mentions: 100, tests: 200 }
    const score = Math.round((data.mentions / data.tests) * 100)
    return {
      ...p,
      score,
      mentions: data.mentions,
      tests: data.tests,
    }
  })
})

// Computed: Average visibility across all platforms (for chart's last data point)
const averageVisibility = computed(() => {
  const scores = platformsWithScores.value.map(p => p.score)
  if (scores.length === 0) return 55
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
})

const bestPlatform = computed(() => {
  const sorted = [...platformsWithScores.value].sort((a, b) => b.score - a.score)
  return sorted[0]?.name || '-'
})

// Citation sources - count is the source, percentage is calculated from total
// Store initial values for mean reversion
const initialCitationCounts = [89, 67, 52, 41, 35, 28]

const citationCounts = ref([
  { domain: 'monday.com', count: 89, isBrand: true },
  { domain: 'wikipedia.org', count: 67, isBrand: false },
  { domain: 'asana.com', count: 52, isBrand: false },
  { domain: 'clickup.com', count: 41, isBrand: false },
  { domain: 'salesforce.com', count: 35, isBrand: false },
  { domain: 'g2.com', count: 28, isBrand: false },
])

// Computed: Citation sources with calculated percentages
const citationSources = computed(() => {
  const total = citationCounts.value.reduce((sum, s) => sum + s.count, 0)
  return citationCounts.value.map(s => ({
    ...s,
    percent: Math.round((s.count / total) * 100),
  }))
})

// Chart.js setup
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const competitorColors = ['#F06A6A', '#7B68EE', '#00A1E0']

// Chart data - historical data is fixed, only last point updates
const chartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
const mondayData = ref([42, 45, 48, 52, 55, 58, 54, 62, 65, 55]) // Last value will be overwritten
const asanaData = ref([48, 50, 49, 51, 52, 50, 53, 51, 54, 52])
const clickupData = ref([32, 35, 38, 40, 44, 48, 50, 52, 55, 53])
const salesforceData = ref([58, 56, 54, 52, 50, 48, 46, 44, 42, 40])

const renderChart = () => {
  if (!chartCanvas.value) return

  if (chart) {
    chart.destroy()
  }

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  // Create gradient for brand line fill
  const brandGradient = ctx.createLinearGradient(0, 0, 0, 224)
  brandGradient.addColorStop(0, 'rgba(242, 153, 1, 0.15)')
  brandGradient.addColorStop(1, 'rgba(242, 153, 1, 0)')

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartLabels,
      datasets: [
        {
          label: 'monday.com',
          data: mondayData.value,
          borderColor: '#F29901',
          backgroundColor: brandGradient,
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: '#F29901',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
        {
          label: 'Asana',
          data: asanaData.value,
          borderColor: competitorColors[0] + 'AA',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointBackgroundColor: competitorColors[0],
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          borderDash: [4, 4],
        },
        {
          label: 'ClickUp',
          data: clickupData.value,
          borderColor: competitorColors[1] + 'AA',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointBackgroundColor: competitorColors[1],
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          borderDash: [4, 4],
        },
        {
          label: 'Salesforce',
          data: salesforceData.value,
          borderColor: competitorColors[2] + 'AA',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointBackgroundColor: competitorColors[2],
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          borderDash: [4, 4],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          titleFont: { size: 11, weight: 'bold', family: 'system-ui' },
          bodyFont: { size: 11, family: 'system-ui' },
          padding: { x: 12, y: 10 },
          cornerRadius: 8,
          boxPadding: 4,
          usePointStyle: true,
          callbacks: {
            label: (context) => ` ${context.dataset.label}: ${context.parsed.y}%`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            font: { size: 10, family: 'system-ui' },
            color: '#9CA3AF',
            maxRotation: 0,
            padding: 8,
          },
        },
        y: {
          min: 0,
          max: 100,
          grid: {
            color: 'rgba(0, 0, 0, 0.04)',
            drawTicks: false,
          },
          border: { display: false },
          ticks: {
            font: { size: 10, family: 'system-ui' },
            color: '#9CA3AF',
            padding: 8,
            callback: (v) => `${v}%`,
          },
        },
      },
      animation: {
        duration: 600,
        easing: 'easeOutQuart',
      },
    },
  })
}

const updateChart = () => {
  if (!chart) return

  chart.data.datasets[0].data = mondayData.value
  chart.data.datasets[1].data = asanaData.value
  chart.data.datasets[2].data = clickupData.value
  chart.data.datasets[3].data = salesforceData.value
  chart.update('none')
}

// Live update simulation
let updateInterval: ReturnType<typeof setInterval> | null = null

// Mean-reverting random variation - tends to return toward initial value
const meanRevertingVariation = (current: number, initial: number, range: number) => {
  // Random change
  const randomChange = (Math.random() - 0.5) * 2 * range
  // Pull toward initial value (mean reversion factor)
  const reversion = (initial - current) * 0.3
  // Combine random walk with mean reversion
  const newValue = current + randomChange + reversion
  return Math.round(newValue)
}

const updateData = () => {
  // Update platform mentions with mean reversion
  for (const key in platformScores.value) {
    const p = platformScores.value[key]
    const initial = initialPlatformMentions[key] || p.mentions
    platformScores.value[key] = {
      ...p,
      mentions: Math.max(50, Math.min(p.tests, meanRevertingVariation(p.mentions, initial, 3))),
    }
  }

  // Update citation counts with mean reversion
  citationCounts.value = citationCounts.value.map((s, idx) => ({
    ...s,
    count: Math.max(10, meanRevertingVariation(s.count, initialCitationCounts[idx], 3)),
  }))

  // Update chart's last data point based on average visibility
  const lastIdx = mondayData.value.length - 1
  mondayData.value[lastIdx] = averageVisibility.value

  // Update the chart
  updateChart()
}

onMounted(() => {
  // Initialize chart's last data point
  mondayData.value[mondayData.value.length - 1] = averageVisibility.value
  renderChart()
  updateInterval = setInterval(updateData, 3000)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
  if (chart) {
    chart.destroy()
  }
})
</script>
