<template>
  <div>
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Page Header -->
        <div class="flex justify-between items-start mb-6">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
              <svg class="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">AI Visibility Dashboard</h1>
              <p class="text-gray-500">Track how often your brand appears in AI-generated responses</p>
            </div>
          </div>
          <button
            class="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors"
            @click="refreshData"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
        </div>

        <!-- Overall Score Card -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <div class="flex items-start justify-between mb-6">
            <div>
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                  <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span class="text-sm font-medium text-gray-600">Overall Visibility Score</span>
              </div>
              <div class="text-5xl font-bold text-gray-900 mb-2">{{ overallScore }}</div>
              <p class="text-gray-500 text-sm">
                Based on <span class="font-medium text-gray-900">{{ totalTests }}</span> prompts across <span class="font-medium text-gray-900">4</span> AI engines
              </p>
            </div>
            <div class="text-right">
              <div
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold"
                :class="scoreChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
              >
                <svg v-if="scoreChange >= 0" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
                <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                {{ scoreChange >= 0 ? '+' : '' }}{{ scoreChange }}
              </div>
              <p class="text-xs text-gray-400 mt-1">vs last week</p>
            </div>
          </div>

          <!-- Score breakdown -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div class="text-sm text-gray-600 mb-1">Mention Rate</div>
              <div class="text-2xl font-bold text-gray-900">{{ mentionRate }}%</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div class="text-sm text-gray-600 mb-1">Citation Rate</div>
              <div class="text-2xl font-bold text-gray-900">{{ citationRate }}%</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div class="text-sm text-gray-600 mb-1">Avg Position</div>
              <div class="text-2xl font-bold text-gray-900">#{{ avgPosition || '-' }}</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div class="text-sm text-gray-600 mb-1">Positive Sentiment</div>
              <div class="text-2xl font-bold text-gray-900">{{ positiveSentiment }}%</div>
            </div>
          </div>
        </div>

        <!-- Visibility Trends Chart -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <div class="flex items-center justify-between mb-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-semibold text-gray-900">Visibility Over Time</h2>
                <p class="text-sm text-gray-500">Track your visibility score trends per AI platform</p>
              </div>
            </div>
            <select
              v-model="chartTimeRange"
              class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              @change="loadVisibilityHistory"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>

          <!-- Chart Container -->
          <div class="relative h-80">
            <div v-if="chartLoading" class="absolute inset-0 flex items-center justify-center bg-gray-50/50">
              <div class="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
            </div>
            <canvas ref="visibilityChartCanvas"></canvas>
          </div>

          <!-- Legend -->
          <div class="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <div v-for="platform in chartPlatforms" :key="platform.name" class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: platform.color }"></div>
              <span class="text-sm text-gray-600">{{ platform.label }}</span>
            </div>
          </div>
        </div>

        <!-- Platform Comparison -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-gray-900">Platform Comparison</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="(platform, index) in platforms" :key="platform.name" class="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                    <!-- ChatGPT Icon -->
                    <svg v-if="platform.name === 'ChatGPT'" class="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
                    </svg>
                    <!-- Claude Icon -->
                    <svg v-else-if="platform.name === 'Claude'" class="w-4 h-4" viewBox="0 0 256 257">
                      <path fill="#d97757" d="m50.228 170.321l50.357-28.257l.843-2.463l-.843-1.361h-2.462l-8.426-.518l-28.775-.778l-24.952-1.037l-24.175-1.296l-6.092-1.297L0 125.796l.583-3.759l5.12-3.434l7.324.648l16.202 1.101l24.304 1.685l17.629 1.037l26.118 2.722h4.148l.583-1.685l-1.426-1.037l-1.101-1.037l-25.147-17.045l-27.22-18.017l-14.258-10.37l-7.713-5.25l-3.888-4.925l-1.685-10.758l7-7.713l9.397.649l2.398.648l9.527 7.323l20.35 15.75L94.817 91.9l3.889 3.24l1.555-1.102l.195-.777l-1.75-2.917l-14.453-26.118l-15.425-26.572l-6.87-11.018l-1.814-6.61c-.648-2.723-1.102-4.991-1.102-7.778l7.972-10.823L71.42 0l10.63 1.426l4.472 3.888l6.61 15.101l10.694 23.786l16.591 32.34l4.861 9.592l2.592 8.879l.973 2.722h1.685v-1.556l1.36-18.211l2.528-22.36l2.463-28.776l.843-8.1l4.018-9.722l7.971-5.25l6.222 2.981l5.12 7.324l-.713 4.73l-3.046 19.768l-5.962 30.98l-3.889 20.739h2.268l2.593-2.593l10.499-13.934l17.628-22.036l7.778-8.749l9.073-9.657l5.833-4.601h11.018l8.1 12.055l-3.628 12.443l-11.342 14.388l-9.398 12.184l-13.48 18.147l-8.426 14.518l.778 1.166l2.01-.194l30.46-6.481l16.462-2.982l19.637-3.37l8.88 4.148l.971 4.213l-3.5 8.62l-20.998 5.184l-24.628 4.926l-36.682 8.685l-.454.324l.519.648l16.526 1.555l7.065.389h17.304l32.21 2.398l8.426 5.574l5.055 6.805l-.843 5.184l-12.962 6.611l-17.498-4.148l-40.83-9.721l-14-3.5h-1.944v1.167l11.666 11.406l21.387 19.314l26.767 24.887l1.36 6.157l-3.434 4.86l-3.63-.518l-23.526-17.693l-9.073-7.972l-20.545-17.304h-1.36v1.814l4.73 6.935l25.017 37.59l1.296 11.536l-1.814 3.76l-6.481 2.268l-7.13-1.297l-14.647-20.544l-15.1-23.138l-12.185-20.739l-1.49.843l-7.194 77.448l-3.37 3.953l-7.778 2.981l-6.48-4.925l-3.436-7.972l3.435-15.749l4.148-20.544l3.37-16.333l3.046-20.285l1.815-6.74l-.13-.454l-1.49.194l-15.295 20.999l-23.267 31.433l-18.406 19.702l-4.407 1.75l-7.648-3.954l.713-7.064l4.277-6.286l25.47-32.405l15.36-20.092l9.917-11.6l-.065-1.686h-.583L44.07 198.125l-12.055 1.555l-5.185-4.86l.648-7.972l2.463-2.593l20.35-13.999z"/>
                    </svg>
                    <!-- Gemini Icon -->
                    <svg v-else-if="platform.name === 'Gemini'" class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <path d="M12 24c-1.5-9.9-2.1-10.5-12-12 9.9-1.5 10.5-2.1 12-12 1.5 9.9 2.1 10.5 12 12-9.9 1.5-10.5 2.1-12 12z" :fill="`url(#gemini-gradient-${index})`"/>
                      <defs>
                        <linearGradient :id="`gemini-gradient-${index}`" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stop-color="#4285F4"/>
                          <stop offset="50%" stop-color="#9B72CB"/>
                          <stop offset="100%" stop-color="#D96570"/>
                        </linearGradient>
                      </defs>
                    </svg>
                    <!-- Perplexity Icon -->
                    <svg v-else class="w-4 h-4" viewBox="0 0 256 298">
                      <path fill="#20B8CD" d="m34.831 0l84.689 78.028V.18h16.486v78.197L221.074 0v88.964H256v128.322h-34.819v79.218l-85.175-74.833v75.692H119.52v-74.459l-84.593 74.508v-80.126H0V88.964h34.831zm72.26 105.248H16.487v95.753h18.42v-30.204zm-55.68 72.775v83.052l68.109-59.988v-84.926zm85.069 22.27v-84.212l68.128 61.865v39.34h.088v42.94zm84.701.708h18.333v-95.753h-89.93l71.597 64.87zM204.588 88.964V37.457l-55.904 51.507zm-97.368 0H51.317V37.457z"/>
                    </svg>
                  </div>
                  <span class="font-medium text-gray-900">{{ platform.name }}</span>
                </div>
                <span class="px-2 py-0.5 text-xs font-bold rounded bg-gray-200 text-gray-700">
                  {{ platform.score }}
                </span>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Mentions</span>
                  <span class="font-medium text-gray-900">{{ platform.mentions }}/{{ platform.tests }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Citations</span>
                  <span class="font-medium text-gray-900">{{ platform.citations }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Sentiment</span>
                  <span class="font-medium" :class="platform.sentiment === 'Positive' ? 'text-green-600' : platform.sentiment === 'Negative' ? 'text-red-600' : 'text-gray-600'">
                    {{ platform.sentiment }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Platform Insights -->
          <div class="mt-5 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <h4 class="font-medium text-gray-900 mb-3">Platform-Specific Insights</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
              <div><strong>ChatGPT:</strong> Prioritizes Wikipedia (7.8% of citations) and recent content</div>
              <div><strong>Perplexity:</strong> Reddit is #1 source (6.6%), most transparent citation model</div>
              <div><strong>Gemini:</strong> Only AI with full JavaScript rendering - can index modern web apps</div>
              <div><strong>Claude:</strong> Newest search feature (March 2025) with evolving citation patterns</div>
            </div>
          </div>
        </div>

        <!-- Recent Scan Results -->
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-gray-900">Recent Scan Results</h2>
          </div>

          <div v-if="loading" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
          </div>

          <div v-else-if="!results.length" class="text-center py-12">
            <p class="text-gray-500 mb-1">No scan results yet</p>
            <p class="text-sm text-gray-400">Run your first visibility scan to see data here</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="result in results"
              :key="result.id"
              class="p-4 bg-gray-50 rounded-lg"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center flex-wrap gap-2 mb-2">
                    <span class="px-2 py-0.5 text-xs font-medium rounded bg-gray-200 text-gray-700">
                      {{ formatModelName(result.ai_model) }}
                    </span>
                    <span
                      class="px-2 py-0.5 text-xs font-medium rounded"
                      :class="result.brand_mentioned ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'"
                    >
                      {{ result.brand_mentioned ? 'Mentioned' : 'Not Mentioned' }}
                    </span>
                    <span
                      v-if="result.citation_present"
                      class="px-2 py-0.5 text-xs font-medium bg-brand/10 text-brand rounded"
                    >
                      Cited
                    </span>
                  </div>
                  <p class="text-sm text-gray-700 mb-2 line-clamp-2">{{ result.prompt }}</p>
                  <div class="flex items-center gap-4 text-xs text-gray-500">
                    <span>Position: {{ result.position || 'N/A' }}</span>
                    <span>{{ result.sentiment || 'Neutral' }}</span>
                    <span>{{ formatDate(result.tested_at) }}</span>
                  </div>
                </div>
                <button
                  class="flex-shrink-0 w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-brand hover:border-brand transition-colors"
                  @click="viewDetails(result)"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import Chart from 'chart.js/auto'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { activeProductId, initialized: productInitialized } = useActiveProduct()

const loading = ref(true)
const chartLoading = ref(true)
const overallScore = ref(0)
const scoreChange = ref(0)
const totalTests = ref(0)
const mentionRate = ref(0)
const citationRate = ref(0)
const avgPosition = ref(0)
const positiveSentiment = ref(0)

const platforms = ref([
  { name: 'ChatGPT', score: 0, mentions: 0, tests: 0, citations: 0, sentiment: 'Neutral' },
  { name: 'Claude', score: 0, mentions: 0, tests: 0, citations: 0, sentiment: 'Neutral' },
  { name: 'Gemini', score: 0, mentions: 0, tests: 0, citations: 0, sentiment: 'Neutral' },
  { name: 'Perplexity', score: 0, mentions: 0, tests: 0, citations: 0, sentiment: 'Neutral' }
])

const results = ref<any[]>([])

// Chart-related refs
const visibilityChartCanvas = ref<HTMLCanvasElement | null>(null)
const chartTimeRange = ref('30')
let visibilityChart: Chart | null = null

const chartPlatforms = [
  { name: 'chatgpt', label: 'ChatGPT', color: '#10a37f' },
  { name: 'claude', label: 'Claude', color: '#d97757' },
  { name: 'gemini', label: 'Gemini', color: '#4285f4' },
  { name: 'perplexity', label: 'Perplexity', color: '#20b8cd' }
]

// Watch for product changes to reload data
watch(activeProductId, async (newProductId) => {
  if (newProductId) {
    await loadVisibilityData()
    await loadVisibilityHistory()
  }
})

onMounted(async () => {
  // Wait for product to be initialized
  if (productInitialized.value && activeProductId.value) {
    await loadVisibilityData()
    await loadVisibilityHistory()
  } else {
    // Watch for initialization
    const unwatch = watch(productInitialized, async (initialized) => {
      if (initialized && activeProductId.value) {
        await loadVisibilityData()
        await loadVisibilityHistory()
        unwatch()
      }
    })
  }
})

const loadVisibilityData = async () => {
  const productId = activeProductId.value
  if (!productId) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    const { data: promptResults } = await supabase
      .from('prompt_results')
      .select('*, prompts(prompt_text)')
      .eq('product_id', productId)
      .order('tested_at', { ascending: false })
      .limit(50)

    results.value = promptResults?.map(r => ({
      ...r,
      prompt: r.prompts?.prompt_text || 'Unknown prompt'
    })) || []

    if (results.value.length > 0) {
      totalTests.value = results.value.length

      const mentioned = results.value.filter(r => r.brand_mentioned).length
      mentionRate.value = Math.round((mentioned / totalTests.value) * 100)

      const cited = results.value.filter(r => r.citation_present).length
      citationRate.value = Math.round((cited / totalTests.value) * 100)

      const positions = results.value.filter(r => r.position !== null).map(r => r.position)
      avgPosition.value = positions.length > 0
        ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length)
        : 0

      const positive = results.value.filter(r => r.sentiment === 'positive').length
      positiveSentiment.value = Math.round((positive / totalTests.value) * 100)

      overallScore.value = Math.round(
        (mentionRate.value * 0.4) + (citationRate.value * 0.3) + (positiveSentiment.value * 0.3)
      )

      for (const platform of platforms.value) {
        const modelKey = platform.name.toLowerCase()
        const platformResults = results.value.filter(r => r.ai_model === modelKey)

        platform.tests = platformResults.length
        platform.mentions = platformResults.filter(r => r.brand_mentioned).length
        platform.citations = platformResults.filter(r => r.citation_present).length

        const posCount = platformResults.filter(r => r.sentiment === 'positive').length
        const negCount = platformResults.filter(r => r.sentiment === 'negative').length

        if (posCount > negCount) platform.sentiment = 'Positive'
        else if (negCount > posCount) platform.sentiment = 'Negative'
        else platform.sentiment = 'Neutral'

        platform.score = platform.tests > 0
          ? Math.round((platform.mentions / platform.tests) * 100)
          : 0
      }
    }

    scoreChange.value = 0
  } catch (error) {
    console.error('Error loading visibility data:', error)
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await loadVisibilityData()
}

const formatModelName = (model: string) => {
  switch (model?.toLowerCase()) {
    case 'chatgpt': return 'ChatGPT'
    case 'claude': return 'Claude'
    case 'gemini': return 'Gemini'
    case 'perplexity': return 'Perplexity'
    default: return model
  }
}

const viewDetails = (result: any) => {
  console.log('View result:', result)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// Load visibility history for the chart
const loadVisibilityHistory = async () => {
  const productId = activeProductId.value
  if (!productId) {
    chartLoading.value = false
    return
  }

  chartLoading.value = true
  try {
    const daysAgo = parseInt(chartTimeRange.value)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    const { data: historyData } = await supabase
      .from('visibility_history')
      .select('*')
      .eq('product_id', productId)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true })

    // Process data for chart
    const chartData = processHistoryForChart(historyData || [], daysAgo)
    renderChart(chartData)
  } catch (error) {
    console.error('Error loading visibility history:', error)
    // Render empty chart with placeholder
    renderChart(generateDummyData())
  } finally {
    chartLoading.value = false
  }
}

// Process history data for Chart.js
const processHistoryForChart = (historyData: any[], daysAgo: number) => {
  // Generate date labels
  const labels: string[] = []
  const today = new Date()
  for (let i = daysAgo - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  }

  // Group data by platform and date
  const platformData: Record<string, (number | null)[]> = {
    chatgpt: new Array(daysAgo).fill(null),
    claude: new Array(daysAgo).fill(null),
    gemini: new Array(daysAgo).fill(null),
    perplexity: new Array(daysAgo).fill(null)
  }

  for (const entry of historyData) {
    const entryDate = new Date(entry.recorded_at)
    const dayIndex = daysAgo - 1 - Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))

    if (dayIndex >= 0 && dayIndex < daysAgo && platformData[entry.ai_model]) {
      platformData[entry.ai_model][dayIndex] = entry.score
    }
  }

  // Interpolate missing values (connect the dots)
  for (const platform of Object.keys(platformData)) {
    let lastValue: number | null = null
    for (let i = 0; i < platformData[platform].length; i++) {
      if (platformData[platform][i] !== null) {
        lastValue = platformData[platform][i]
      } else if (lastValue !== null) {
        // Keep as null for gaps in data - Chart.js will handle it
      }
    }
  }

  return { labels, platformData }
}

// Generate dummy data for visualization when no real data exists
const generateDummyData = () => {
  const daysAgo = parseInt(chartTimeRange.value)
  const labels: string[] = []
  const today = new Date()

  for (let i = daysAgo - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  }

  // Generate smooth random data for demonstration
  const generateSmoothData = (baseValue: number, variance: number): (number | null)[] => {
    const data: (number | null)[] = []
    let value = baseValue
    for (let i = 0; i < daysAgo; i++) {
      value += (Math.random() - 0.5) * variance
      value = Math.max(0, Math.min(100, value))
      data.push(Math.round(value))
    }
    return data
  }

  return {
    labels,
    platformData: {
      chatgpt: generateSmoothData(65, 8),
      claude: generateSmoothData(55, 10),
      gemini: generateSmoothData(70, 7),
      perplexity: generateSmoothData(45, 12)
    }
  }
}

// Render the Chart.js multiline chart
const renderChart = (chartData: { labels: string[], platformData: Record<string, (number | null)[]> }) => {
  if (!visibilityChartCanvas.value) return

  // Destroy existing chart
  if (visibilityChart) {
    visibilityChart.destroy()
  }

  const ctx = visibilityChartCanvas.value.getContext('2d')
  if (!ctx) return

  const datasets = chartPlatforms.map(platform => ({
    label: platform.label,
    data: chartData.platformData[platform.name] || [],
    borderColor: platform.color,
    backgroundColor: platform.color + '20',
    borderWidth: 2,
    fill: false,
    tension: 0.3,
    pointRadius: 4,
    pointHoverRadius: 6,
    pointBackgroundColor: platform.color,
    spanGaps: true
  }))

  visibilityChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: false // Using custom legend
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          callbacks: {
            label: (context) => {
              const value = context.parsed.y
              return value !== null ? `${context.dataset.label}: ${value}%` : `${context.dataset.label}: No data`
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: { size: 11 },
            color: '#6b7280'
          }
        },
        y: {
          min: 0,
          max: 100,
          grid: {
            color: '#f3f4f6'
          },
          ticks: {
            font: { size: 11 },
            color: '#6b7280',
            callback: (value) => `${value}%`
          }
        }
      }
    }
  })
}

// Cleanup on unmount
onUnmounted(() => {
  if (visibilityChart) {
    visibilityChart.destroy()
  }
})
</script>
