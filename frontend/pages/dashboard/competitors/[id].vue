<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
    <div class="p-4 lg:p-6 space-y-5">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/dashboard/competitors"
            class="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-lg transition-colors"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </NuxtLink>
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center overflow-hidden shadow-sm">
            <img
              v-if="competitor?.icon_url || competitor?.domain"
              :src="competitor?.icon_url || getFaviconUrl(competitor?.domain, 64)"
              :alt="competitor?.name"
              class="w-7 h-7"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
            <span v-else class="text-lg font-semibold text-red-400">{{ competitor?.name?.charAt(0)?.toUpperCase() }}</span>
          </div>
          <div>
            <h1 class="text-xl font-semibold text-gray-900 tracking-tight">{{ competitor?.name || 'Competitor' }}</h1>
            <a :href="`https://${competitor?.domain}`" target="_blank" class="text-sm text-gray-500 hover:text-brand transition-colors">
              {{ competitor?.domain || 'Competitor analysis' }}
            </a>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <DateRangeSelector />
          <button
            @click="removeCompetitor"
            class="inline-flex items-center gap-2 px-3 py-1.5 text-red-600 text-sm font-medium rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Stop Tracking
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
      </div>

      <template v-else-if="competitor">
        <!-- Hero: Battle Summary -->
        <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100/80 flex items-center gap-2">
            <div class="w-1 h-4 rounded-full bg-brand"></div>
            <div>
              <h2 class="text-sm font-semibold text-gray-900">Battle Summary</h2>
              <p class="text-[10px] text-gray-500 mt-0.5">Head-to-head performance comparison</p>
            </div>
          </div>
          <div class="px-6 py-6">
            <div class="flex items-center justify-between">
              <!-- Your Brand Side -->
              <div class="flex-1 text-center">
                <div class="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-brand to-amber-500 flex items-center justify-center shadow-lg shadow-brand/30 mb-3">
                  <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                </div>
                <div class="text-gray-500 text-xs uppercase tracking-wider mb-1">{{ productName }}</div>
                <div class="text-4xl font-bold text-gray-900">{{ brandMetrics.mentionRate }}%</div>
                <div class="text-gray-400 text-xs mt-1">Mention Rate</div>
              </div>

              <!-- VS Indicator -->
              <div class="px-6">
                <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <span class="text-gray-400 font-bold text-lg">VS</span>
                </div>
                <div class="text-center mt-2">
                  <span
                    class="text-xs font-semibold px-2 py-1 rounded-full"
                    :class="getOverallWinnerClass()"
                  >
                    {{ getOverallWinnerText() }}
                  </span>
                </div>
              </div>

              <!-- Competitor Side -->
              <div class="flex-1 text-center">
                <div class="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 mb-3 overflow-hidden">
                  <img
                    v-if="competitor?.icon_url || competitor?.domain"
                    :src="competitor?.icon_url || getFaviconUrl(competitor?.domain, 64)"
                    :alt="competitor?.name"
                    class="w-8 h-8"
                    @error="($event.target as HTMLImageElement).parentElement?.classList.add('text-white'); ($event.target as HTMLImageElement).style.display = 'none'"
                  />
                  <span class="text-2xl font-bold text-white hidden">{{ competitor?.name?.charAt(0)?.toUpperCase() }}</span>
                </div>
                <div class="text-gray-500 text-xs uppercase tracking-wider mb-1">{{ competitor.name }}</div>
                <div class="text-4xl font-bold text-gray-900">{{ competitorMetrics.mentionRate }}%</div>
                <div class="text-gray-400 text-xs mt-1">Mention Rate</div>
              </div>
            </div>

            <!-- Quick Stats Row -->
            <div class="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div class="text-center">
                <div class="text-gray-400 text-[10px] uppercase tracking-wider">{{ productName }} Position</div>
                <div class="text-xl font-bold text-gray-900 mt-1">{{ brandMetrics.avgPosition ? `#${brandMetrics.avgPosition}` : '-' }}</div>
              </div>
              <div class="text-center">
                <div class="text-gray-400 text-[10px] uppercase tracking-wider">{{ competitor.name }} Position</div>
                <div class="text-xl font-bold text-gray-900 mt-1">{{ competitorMetrics.avgPosition ? `#${competitorMetrics.avgPosition}` : '-' }}</div>
              </div>
              <div class="text-center">
                <div class="text-gray-400 text-[10px] uppercase tracking-wider">{{ productName }} Citations</div>
                <div class="text-xl font-bold text-gray-900 mt-1">{{ brandMetrics.citationRate }}%</div>
              </div>
              <div class="text-center">
                <div class="text-gray-400 text-[10px] uppercase tracking-wider">Period</div>
                <div class="text-xl font-bold text-gray-900 mt-1">{{ displayLabel }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Comparison Table -->
        <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100/80 flex items-center gap-2">
            <div class="w-1 h-4 rounded-full bg-violet-500"></div>
            <div>
              <h2 class="text-sm font-semibold text-gray-900">Head to Head Comparison</h2>
              <p class="text-[10px] text-gray-500 mt-0.5">Metric-by-metric breakdown</p>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-gray-50/80">
                  <th class="text-left text-xs font-medium text-gray-500 px-4 py-3">Metric</th>
                  <th class="text-center text-xs font-medium text-gray-500 px-4 py-3">{{ productName }}</th>
                  <th class="text-center text-xs font-medium text-gray-500 px-4 py-3">{{ competitor.name }}</th>
                  <th class="text-center text-xs font-medium text-gray-500 px-4 py-3">Difference</th>
                  <th class="text-center text-xs font-medium text-gray-500 px-4 py-3">Winner</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <!-- Mention Rate -->
                <tr class="hover:bg-gray-50/50 transition-colors">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <svg class="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <span class="text-sm font-medium text-gray-900">Mention Rate</span>
                    </div>
                  </td>
                  <td class="text-center px-4 py-3">
                    <span class="text-sm font-bold text-brand">{{ brandMetrics.mentionRate }}%</span>
                  </td>
                  <td class="text-center px-4 py-3">
                    <span class="text-sm font-bold text-gray-700">{{ competitorMetrics.mentionRate }}%</span>
                  </td>
                  <td class="text-center px-4 py-3">
                    <span
                      class="text-sm font-medium"
                      :class="brandMetrics.mentionRate >= competitorMetrics.mentionRate ? 'text-emerald-600' : 'text-red-600'"
                    >
                      {{ brandMetrics.mentionRate >= competitorMetrics.mentionRate ? '+' : '' }}{{ brandMetrics.mentionRate - competitorMetrics.mentionRate }}%
                    </span>
                  </td>
                  <td class="text-center px-4 py-3">
                    <span
                      class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                      :class="getWinnerBadgeClass(brandMetrics.mentionRate, competitorMetrics.mentionRate, 'higher')"
                    >
                      {{ getWinnerText(brandMetrics.mentionRate, competitorMetrics.mentionRate, 'higher') }}
                    </span>
                  </td>
                </tr>

                <!-- Citation Rate -->
                <tr class="hover:bg-gray-50/50 transition-colors">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                        <svg class="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <span class="text-sm font-medium text-gray-900">Citation Rate</span>
                    </div>
                  </td>
                  <td class="text-center px-4 py-3">
                    <span class="text-sm font-bold text-brand">{{ brandMetrics.citationRate }}%</span>
                  </td>
                  <td class="text-center px-4 py-3">
                    <span class="text-sm font-bold" :class="competitorMetrics.citationRate !== null ? 'text-gray-700' : 'text-gray-400'">
                      {{ competitorMetrics.citationRate !== null ? `${competitorMetrics.citationRate}%` : 'N/A' }}
                    </span>
                  </td>
                  <td class="text-center px-4 py-3">
                    <span
                      class="text-sm font-medium"
                      :class="competitorMetrics.citationRate !== null ? (citationDiff !== null && citationDiff >= 0 ? 'text-emerald-600' : 'text-red-600') : 'text-gray-400'"
                    >
                      {{ competitorMetrics.citationRate !== null ? (citationDiff !== null && citationDiff > 0 ? `+${citationDiff}%` : `${citationDiff}%`) : '-' }}
                    </span>
                  </td>
                  <td class="text-center px-4 py-3">
                    <span
                      class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                      :class="getWinnerBadgeClass(brandMetrics.citationRate, competitorMetrics.citationRate, 'higher')"
                    >
                      {{ getWinnerText(brandMetrics.citationRate, competitorMetrics.citationRate, 'higher') }}
                    </span>
                  </td>
                </tr>

                <!-- Average Position -->
                <tr class="hover:bg-gray-50/50 transition-colors">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                        <svg class="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                        </svg>
                      </div>
                      <div>
                        <span class="text-sm font-medium text-gray-900">Avg Position</span>
                        <span class="text-[10px] text-gray-400 block">Lower is better</span>
                      </div>
                    </div>
                  </td>
                  <td class="text-center px-4 py-3">
                    <span class="text-sm font-bold text-brand">{{ brandMetrics.avgPosition ? `#${brandMetrics.avgPosition}` : '-' }}</span>
                  </td>
                  <td class="text-center px-4 py-3">
                    <span class="text-sm font-bold text-gray-700">{{ competitorMetrics.avgPosition ? `#${competitorMetrics.avgPosition}` : '-' }}</span>
                  </td>
                  <td class="text-center px-4 py-3">
                    <span
                      v-if="brandMetrics.avgPosition && competitorMetrics.avgPosition"
                      class="text-sm font-medium"
                      :class="brandMetrics.avgPosition <= competitorMetrics.avgPosition ? 'text-emerald-600' : 'text-red-600'"
                    >
                      {{ brandMetrics.avgPosition <= competitorMetrics.avgPosition ? '' : '+' }}{{ (brandMetrics.avgPosition - competitorMetrics.avgPosition).toFixed(1) }}
                    </span>
                    <span v-else class="text-sm text-gray-400">-</span>
                  </td>
                  <td class="text-center px-4 py-3">
                    <span
                      v-if="brandMetrics.avgPosition && competitorMetrics.avgPosition"
                      class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                      :class="getWinnerBadgeClass(brandMetrics.avgPosition, competitorMetrics.avgPosition, 'lower')"
                    >
                      {{ getWinnerText(brandMetrics.avgPosition, competitorMetrics.avgPosition, 'lower') }}
                    </span>
                    <span v-else class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                      N/A
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Visual Comparison Bars -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Mention Rate Comparison -->
          <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-100/80 flex items-center gap-2">
              <div class="w-1 h-4 rounded-full bg-blue-500"></div>
              <h2 class="text-sm font-semibold text-gray-900">Mention Rate Battle</h2>
            </div>
            <div class="p-4">
              <div class="space-y-4">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-medium text-gray-700">{{ productName }}</span>
                    <span class="text-sm font-bold text-brand">{{ brandMetrics.mentionRate }}%</span>
                  </div>
                  <div class="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-brand to-amber-400 rounded-full transition-all duration-700"
                      :style="{ width: `${brandMetrics.mentionRate}%` }"
                    ></div>
                  </div>
                </div>
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-medium text-gray-700">{{ competitor.name }}</span>
                    <span class="text-sm font-bold text-red-500">{{ competitorMetrics.mentionRate }}%</span>
                  </div>
                  <div class="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all duration-700"
                      :style="{ width: `${competitorMetrics.mentionRate}%` }"
                    ></div>
                  </div>
                </div>
              </div>
              <div class="mt-4 pt-4 border-t border-gray-100 text-center">
                <span
                  class="text-sm font-medium"
                  :class="brandMetrics.mentionRate >= competitorMetrics.mentionRate ? 'text-emerald-600' : 'text-red-600'"
                >
                  {{ brandMetrics.mentionRate >= competitorMetrics.mentionRate ? `${productName} is winning` : `${competitor.name} is winning` }}
                  by {{ Math.abs(brandMetrics.mentionRate - competitorMetrics.mentionRate) }} percentage points
                </span>
              </div>
            </div>
          </div>

          <!-- Position Comparison -->
          <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-100/80 flex items-center gap-2">
              <div class="w-1 h-4 rounded-full bg-amber-500"></div>
              <h2 class="text-sm font-semibold text-gray-900">Position Battle</h2>
            </div>
            <div class="p-4">
              <div class="flex items-center justify-around py-4">
                <div class="text-center">
                  <div
                    class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2"
                    :class="positionWinner === 'brand' ? 'bg-emerald-100 ring-4 ring-emerald-200' : 'bg-gray-100'"
                  >
                    <span class="text-2xl font-bold" :class="positionWinner === 'brand' ? 'text-emerald-600' : 'text-gray-600'">
                      {{ brandMetrics.avgPosition ? `#${brandMetrics.avgPosition}` : '-' }}
                    </span>
                  </div>
                  <span class="text-xs font-medium text-gray-700">{{ productName }}</span>
                </div>
                <div class="text-2xl font-bold text-gray-300">VS</div>
                <div class="text-center">
                  <div
                    class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2"
                    :class="positionWinner === 'competitor' ? 'bg-red-100 ring-4 ring-red-200' : 'bg-gray-100'"
                  >
                    <span class="text-2xl font-bold" :class="positionWinner === 'competitor' ? 'text-red-600' : 'text-gray-600'">
                      {{ competitorMetrics.avgPosition ? `#${competitorMetrics.avgPosition}` : '-' }}
                    </span>
                  </div>
                  <span class="text-xs font-medium text-gray-700">{{ competitor.name }}</span>
                </div>
              </div>
              <div class="mt-2 pt-4 border-t border-gray-100 text-center">
                <span
                  v-if="positionWinner"
                  class="text-sm font-medium"
                  :class="positionWinner === 'brand' ? 'text-emerald-600' : 'text-red-600'"
                >
                  {{ positionWinner === 'brand' ? `${productName} ranks higher` : `${competitor.name} ranks higher` }}
                  <span class="text-gray-400">(lower position = better)</span>
                </span>
                <span v-else class="text-sm text-gray-400">Position data unavailable</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Trend Chart -->
        <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100/80 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-1 h-4 rounded-full bg-emerald-500"></div>
              <div>
                <h2 class="text-sm font-semibold text-gray-900">Trend Comparison</h2>
                <p class="text-[10px] text-gray-500 mt-0.5">Performance over time</p>
              </div>
            </div>
            <select
              v-model="chartMetric"
              class="text-xs bg-gray-100 border-0 rounded-lg pl-2 pr-6 py-1.5 text-gray-600 cursor-pointer focus:ring-1 focus:ring-brand/30"
            >
              <option value="mention_rate">Mention Rate</option>
              <option value="position">Avg Position</option>
            </select>
          </div>
          <div class="p-4">
            <div class="relative h-72">
              <div v-if="chartLoading" class="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                <div class="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent"></div>
              </div>
              <canvas ref="trendChartCanvas"></canvas>
            </div>
            <!-- Legend -->
            <div class="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-brand"></div>
                <span class="text-xs text-gray-700 font-medium">{{ productName }}</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-red-400"></div>
                <span class="text-xs text-gray-500">{{ competitor.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Cited Pages Chart -->
        <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div class="px-4 py-3 border-b border-gray-100/80 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-1 h-4 rounded-full bg-violet-500"></div>
              <div>
                <h2 class="text-sm font-semibold text-gray-900">{{ competitor.name }}'s Most Cited Pages</h2>
                <p class="text-[10px] text-gray-500 mt-0.5">Which pages of their site are being cited by AI</p>
              </div>
            </div>
            <span class="text-xs text-gray-500 bg-gray-100/80 px-2 py-0.5 rounded-full">
              {{ competitorUrlStats.length }} unique pages
            </span>
          </div>

          <div v-if="loadingCitations" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent"></div>
          </div>

          <div v-else-if="competitorUrlStats.length === 0" class="text-center py-12 text-sm text-gray-500">
            <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            No citations found for {{ competitor.name }}
          </div>

          <div v-else class="p-4">
            <!-- Bar Chart -->
            <div class="space-y-3 overflow-y-auto" :class="showAllCitedPages ? 'max-h-80' : ''">
              <div
                v-for="(urlStat, idx) in showAllCitedPages ? competitorUrlStats : competitorUrlStats.slice(0, 10)"
                :key="urlStat.url"
                class="group"
              >
                <div class="flex items-center gap-3">
                  <div class="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold bg-red-100 text-red-700 shrink-0">
                    {{ idx + 1 }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                      <a
                        :href="urlStat.url"
                        target="_blank"
                        class="text-xs font-medium text-gray-700 hover:text-brand truncate transition-colors"
                        :title="urlStat.url"
                      >
                        {{ formatUrlPath(urlStat.url) }}
                      </a>
                      <span class="text-xs font-bold text-red-600 ml-2 shrink-0">{{ urlStat.count }}</span>
                    </div>
                    <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
                        :style="{ width: `${(urlStat.count / maxCompetitorUrlCount) * 100}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="competitorUrlStats.length > 10" class="mt-4 pt-4 border-t border-gray-100 text-center">
              <button
                @click="showAllCitedPages = !showAllCitedPages"
                class="text-xs text-brand hover:text-brand/80 font-medium transition-colors"
              >
                {{ showAllCitedPages ? 'Show less' : `+${competitorUrlStats.length - 10} more pages cited` }}
              </button>
            </div>
          </div>
        </div>

        <!-- Recent Mentions -->
        <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100/80 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-1 h-4 rounded-full bg-red-500"></div>
              <div>
                <h2 class="text-sm font-semibold text-gray-900">Recent Competitor Mentions</h2>
                <p class="text-[10px] text-gray-500 mt-0.5">Where {{ competitor.name }} was mentioned in AI responses</p>
              </div>
            </div>
            <span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
              {{ recentMentions.length }} recent
            </span>
          </div>
          <div v-if="recentMentions.length === 0" class="text-center py-12">
            <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p class="text-sm text-gray-500">No recent mentions found</p>
            <p class="text-xs text-gray-400 mt-1">Run more scans to see competitor mentions</p>
          </div>
          <div v-else class="divide-y divide-gray-100/80">
            <div
              v-for="mention in recentMentions"
              :key="mention.id"
              class="px-4 py-4 hover:bg-gray-50/50 transition-colors"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center flex-wrap gap-2 mb-2">
                    <span class="text-xs font-medium px-2 py-1 rounded-lg bg-gray-100 text-gray-700">
                      {{ formatModel(mention.ai_model) }}
                    </span>
                    <span v-if="mention.position" class="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700">
                      Position #{{ mention.position }}
                    </span>
                    <span
                      class="text-xs px-2 py-1 rounded-lg"
                      :class="getSentimentClass(mention.sentiment)"
                    >
                      {{ mention.sentiment }}
                    </span>
                    <a
                      v-if="mention.prompt_results?.chat_url"
                      :href="mention.prompt_results.chat_url"
                      target="_blank"
                      class="text-xs text-brand hover:text-brand/80 inline-flex items-center gap-1 ml-auto"
                      @click.stop
                    >
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View Chat
                    </a>
                  </div>
                  <p v-if="mention.mention_context" class="text-sm text-gray-600 line-clamp-2 bg-gray-50 rounded-lg px-3 py-2 italic">
                    "{{ mention.mention_context }}"
                  </p>
                </div>
                <div class="text-xs text-gray-400 flex-shrink-0 text-right">
                  <div>{{ formatDate(mention.detected_at) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Not Found -->
      <div v-else class="text-center py-20">
        <p class="text-gray-500">Competitor not found</p>
        <NuxtLink to="/dashboard/competitors" class="text-brand hover:underline text-sm mt-2 inline-block">
          Back to competitors
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Chart from 'chart.js/auto'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const { getFaviconUrl } = useFavicon()
const { formatModelName } = useAIPlatforms()

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const { activeProductId, initialized: productInitialized } = useActiveProduct()
const { selectedRegion } = useRegionFilter()
const { dateRange, displayLabel } = useDateRange()

const competitorId = route.params.id as string

const loading = ref(true)
const chartLoading = ref(false)
const loadingCitations = ref(false)
const competitor = ref<any>(null)
const product = ref<any>(null)
const recentMentions = ref<any[]>([])
const competitorUrlStats = ref<{ url: string; count: number }[]>([])
const showAllCitedPages = ref(false)

const trendChartCanvas = ref<HTMLCanvasElement | null>(null)
const chartMetric = ref<'mention_rate' | 'position'>('mention_rate')
let trendChart: Chart | null = null

// Metrics
const brandMetrics = ref({
  mentionRate: 0,
  citationRate: 0,
  avgPosition: null as number | null
})

const competitorMetrics = ref({
  mentionRate: 0,
  citationRate: null as number | null,
  avgPosition: null as number | null
})

// Product name for display
const productName = computed(() => product.value?.name || 'Your Brand')

const positionWinner = computed(() => {
  if (!brandMetrics.value.avgPosition || !competitorMetrics.value.avgPosition) return null
  if (brandMetrics.value.avgPosition < competitorMetrics.value.avgPosition) return 'brand'
  if (brandMetrics.value.avgPosition > competitorMetrics.value.avgPosition) return 'competitor'
  return 'tie'
})

const citationDiff = computed(() => {
  if (competitorMetrics.value.citationRate === null) return null
  return brandMetrics.value.citationRate - competitorMetrics.value.citationRate
})

const maxCompetitorUrlCount = computed(() => {
  if (competitorUrlStats.value.length === 0) return 1
  return competitorUrlStats.value[0].count
})

// Watch for region filter changes
watch(selectedRegion, async () => {
  if (activeProductId.value && competitor.value) {
    await Promise.all([
      loadBrandMetrics(activeProductId.value),
      loadCompetitorMetrics(),
      loadRecentMentions(),
      loadCompetitorCitations(),
      loadChartData()
    ])
  }
})

watch(chartMetric, () => {
  loadChartData()
})

// Watch for global date range changes
watch(dateRange, async () => {
  if (activeProductId.value && competitor.value) {
    await Promise.all([
      loadBrandMetrics(activeProductId.value),
      loadCompetitorMetrics(),
      loadRecentMentions(),
      loadCompetitorCitations(),
      loadChartData()
    ])
  }
}, { deep: true })

onMounted(async () => {
  if (productInitialized.value && activeProductId.value) {
    await loadCompetitor()
  } else {
    const unwatch = watch(productInitialized, async (initialized) => {
      if (initialized && activeProductId.value) {
        await loadCompetitor()
        unwatch()
      }
    })
  }
})

onUnmounted(() => {
  if (trendChart) {
    trendChart.destroy()
  }
})

const loadCompetitor = async () => {
  const productId = activeProductId.value
  if (!productId) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    // Load product data for brand name display
    const { data: productData } = await supabase
      .from('products')
      .select('id, name, domain, icon_url')
      .eq('id', productId)
      .single()

    product.value = productData

    // Load competitor
    const { data } = await supabase
      .from('competitors')
      .select('*')
      .eq('id', competitorId)
      .eq('product_id', productId)
      .single()

    if (!data) {
      competitor.value = null
      return
    }

    competitor.value = data

    // Load metrics (but not chart yet - canvas not ready)
    await Promise.all([
      loadBrandMetrics(productId),
      loadCompetitorMetrics(),
      loadRecentMentions(),
      loadCompetitorCitations()
    ])
  } catch (error) {
    console.error('Error loading competitor:', error)
  } finally {
    loading.value = false
    // Load chart after loading is done and DOM is updated
    await nextTick()
    await loadChartData()
  }
}

const loadBrandMetrics = async (productId: string) => {
  const startDate = dateRange.value.startDate

  let query = supabase
    .from('prompt_results')
    .select('brand_mentioned, citation_present, position')
    .eq('product_id', productId)

  if (startDate) {
    query = query.gte('tested_at', startDate.toISOString())
  }

  if (selectedRegion.value) {
    query = query.ilike('request_country', selectedRegion.value)
  }

  const { data: results } = await query

  if (results && results.length > 0) {
    const mentioned = results.filter(r => r.brand_mentioned).length
    brandMetrics.value.mentionRate = Math.round((mentioned / results.length) * 100)

    const cited = results.filter(r => r.citation_present).length
    brandMetrics.value.citationRate = Math.round((cited / results.length) * 100)

    const positions = results.filter(r => r.position !== null).map(r => r.position as number)
    brandMetrics.value.avgPosition = positions.length > 0
      ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
      : null
  }
}

const loadCompetitorMetrics = async () => {
  const startDate = dateRange.value.startDate
  const productId = activeProductId.value

  // Get count of prompt results for the period (for calculating rates)
  let countQuery = supabase
    .from('prompt_results')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)

  if (startDate) {
    countQuery = countQuery.gte('tested_at', startDate.toISOString())
  }

  if (selectedRegion.value) {
    countQuery = countQuery.ilike('request_country', selectedRegion.value)
  }

  const { count: totalResults } = await countQuery

  if (!totalResults || totalResults === 0) {
    competitorMetrics.value.mentionRate = 0
    competitorMetrics.value.citationRate = null
    competitorMetrics.value.avgPosition = null
    return
  }

  // Query competitor mentions directly by product_id and date (much faster)
  let mentionsQuery = supabase
    .from('competitor_mentions')
    .select('prompt_result_id, position, sentiment, prompt_results!inner(request_country)')
    .eq('product_id', productId)
    .eq('competitor_id', competitorId)

  if (startDate) {
    mentionsQuery = mentionsQuery.gte('detected_at', startDate.toISOString())
  }

  if (selectedRegion.value) {
    mentionsQuery = mentionsQuery.ilike('prompt_results.request_country', selectedRegion.value)
  }

  const { data: mentions } = await mentionsQuery

  // Count unique prompt results where this competitor was mentioned
  const uniqueResultIds = new Set((mentions || []).map(m => m.prompt_result_id).filter(Boolean))
  const mentionCount = uniqueResultIds.size

  competitorMetrics.value.mentionRate = totalResults > 0
    ? Math.round((mentionCount / totalResults) * 100)
    : 0

  const positions = (mentions || []).filter(m => m.position !== null).map(m => m.position as number)
  competitorMetrics.value.avgPosition = positions.length > 0
    ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
    : null

  // Calculate citation rate by direct domain matching
  // Link citations through source_domain in prompt_citations to domain in competitors
  if (competitor.value?.domain) {
    const normalizedDomain = competitor.value.domain.toLowerCase().replace('www.', '')

    // Query all citations for the product (not filtered by is_competitor_source)
    // We match directly by source_domain to competitor domain
    let citationsQuery = supabase
      .from('prompt_citations')
      .select('source_domain, prompt_result_id, prompt_results!inner(request_country)')
      .eq('product_id', productId)

    if (startDate) {
      citationsQuery = citationsQuery.gte('created_at', startDate.toISOString())
    }

    if (selectedRegion.value) {
      citationsQuery = citationsQuery.ilike('prompt_results.request_country', selectedRegion.value)
    }

    const { data: citations } = await citationsQuery

    if (citations && citations.length > 0) {
      // Find citations that match this competitor's domain (exact or subdomain match)
      const matchingCitations = citations.filter(c => {
        const citationDomain = c.source_domain?.toLowerCase().replace('www.', '') || ''
        return citationDomain === normalizedDomain || citationDomain.endsWith('.' + normalizedDomain)
      })
      const uniqueCitedResults = new Set(matchingCitations.map(c => c.prompt_result_id)).size
      competitorMetrics.value.citationRate = totalResults > 0
        ? Math.round((uniqueCitedResults / totalResults) * 100)
        : null
    } else {
      competitorMetrics.value.citationRate = 0
    }
  } else {
    competitorMetrics.value.citationRate = null  // No domain to match
  }
}

const loadRecentMentions = async () => {
  // If region is selected, we need to filter mentions by the region of their prompt_results
  if (selectedRegion.value) {
    // First get prompt_result_ids that match the region filter
    const { data: filteredResults } = await supabase
      .from('prompt_results')
      .select('id')
      .eq('product_id', activeProductId.value)
      .ilike('request_country', selectedRegion.value)

    const filteredResultIds = (filteredResults || []).map(r => r.id)

    if (filteredResultIds.length === 0) {
      recentMentions.value = []
      return
    }

    const { data } = await supabase
      .from('competitor_mentions')
      .select(`
        *,
        prompt_results(chat_url, request_country)
      `)
      .eq('competitor_id', competitorId)
      .in('prompt_result_id', filteredResultIds)
      .order('detected_at', { ascending: false })
      .limit(10)

    recentMentions.value = data || []
  } else {
    const { data } = await supabase
      .from('competitor_mentions')
      .select(`
        *,
        prompt_results(chat_url, request_country)
      `)
      .eq('competitor_id', competitorId)
      .order('detected_at', { ascending: false })
      .limit(10)

    recentMentions.value = data || []
  }
}

const loadCompetitorCitations = async () => {
  if (!competitor.value?.domain) {
    competitorUrlStats.value = []
    return
  }

  loadingCitations.value = true
  try {
    const productId = activeProductId.value
    const startDate = dateRange.value.startDate
    const normalizedDomain = competitor.value.domain.toLowerCase().replace('www.', '')

    // Get filtered result IDs based on region
    let filteredResultIds: string[] | null = null
    if (selectedRegion.value) {
      let regionQuery = supabase
        .from('prompt_results')
        .select('id')
        .eq('product_id', productId)
        .ilike('request_country', selectedRegion.value)

      if (startDate) {
        regionQuery = regionQuery.gte('tested_at', startDate.toISOString())
      }

      const { data: regionResults } = await regionQuery

      filteredResultIds = (regionResults || []).map(r => r.id)
      if (filteredResultIds.length === 0) {
        competitorUrlStats.value = []
        loadingCitations.value = false
        return
      }
    }

    // Load all citations and filter by competitor domain
    let allCitationsData: { url: string; source_domain: string }[] = []
    let offset = 0
    const batchSize = 1000

    while (true) {
      let query = supabase
        .from('prompt_citations')
        .select('url, source_domain')
        .eq('product_id', productId)
        .range(offset, offset + batchSize - 1)

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString())
      }

      if (filteredResultIds) {
        query = query.in('prompt_result_id', filteredResultIds)
      }

      const { data: batchData } = await query
      if (!batchData || batchData.length === 0) break

      allCitationsData = allCitationsData.concat(batchData)
      if (batchData.length < batchSize) break
      offset += batchSize
    }

    // Filter by competitor domain and aggregate by URL
    const urlCounts: Record<string, number> = {}
    for (const c of allCitationsData) {
      const citationDomain = c.source_domain?.toLowerCase().replace('www.', '') || ''
      if (citationDomain === normalizedDomain || citationDomain.endsWith('.' + normalizedDomain)) {
        if (c.url) {
          urlCounts[c.url] = (urlCounts[c.url] || 0) + 1
        }
      }
    }

    competitorUrlStats.value = Object.entries(urlCounts)
      .map(([url, count]) => ({ url, count }))
      .sort((a, b) => b.count - a.count)

  } catch (error) {
    console.error('Error loading competitor citations:', error)
    competitorUrlStats.value = []
  } finally {
    loadingCitations.value = false
  }
}

const loadChartData = async () => {
  const productId = activeProductId.value
  if (!productId || !competitor.value) return

  chartLoading.value = true

  try {
    const startDate = dateRange.value.startDate
    // Calculate number of days for label generation
    const daysAgo = startDate ? Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 30

    // Load brand data (with region filter)
    let brandQuery = supabase
      .from('prompt_results')
      .select('id, tested_at, brand_mentioned, position')
      .eq('product_id', productId)
      .order('tested_at', { ascending: true })

    if (startDate) {
      brandQuery = brandQuery.gte('tested_at', startDate.toISOString())
    }

    if (selectedRegion.value) {
      brandQuery = brandQuery.ilike('request_country', selectedRegion.value)
    }

    const { data: brandResults } = await brandQuery

    // Load competitor mentions using direct filters (much faster than IN with hundreds of IDs)
    let competitorMentions: any[] = []
    let mentionsQuery = supabase
      .from('competitor_mentions')
      .select('prompt_result_id, detected_at, position, prompt_results!inner(request_country)')
      .eq('product_id', productId)
      .eq('competitor_id', competitorId)
      .order('detected_at', { ascending: true })

    if (startDate) {
      mentionsQuery = mentionsQuery.gte('detected_at', startDate.toISOString())
    }

    if (selectedRegion.value) {
      mentionsQuery = mentionsQuery.ilike('prompt_results.request_country', selectedRegion.value)
    }

    const { data: mentionsData } = await mentionsQuery
    competitorMentions = mentionsData || []

    // Generate labels and group by day
    const labels: string[] = []
    const dayMap = new Map<string, { brandResults: any[], competitorMentions: any[] }>()

    const chartStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    for (let i = 0; i < daysAgo; i++) {
      const date = new Date(chartStartDate)
      date.setDate(date.getDate() + i)
      const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      labels.push(dateKey)
      dayMap.set(dateKey, { brandResults: [], competitorMentions: [] })
    }

    // Group data
    for (const result of brandResults || []) {
      const dateKey = new Date(result.tested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const day = dayMap.get(dateKey)
      if (day) day.brandResults.push(result)
    }

    for (const mention of competitorMentions) {
      const dateKey = new Date(mention.detected_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const day = dayMap.get(dateKey)
      if (day) day.competitorMentions.push(mention)
    }

    // Calculate metrics
    const brandData: (number | null)[] = []
    const competitorData: (number | null)[] = []

    for (const label of labels) {
      const day = dayMap.get(label)!
      const totalResults = day.brandResults.length

      if (chartMetric.value === 'mention_rate') {
        if (totalResults > 0) {
          const mentioned = day.brandResults.filter(r => r.brand_mentioned).length
          brandData.push(Math.round((mentioned / totalResults) * 100))
          competitorData.push(Math.round((day.competitorMentions.length / totalResults) * 100))
        } else {
          brandData.push(null)
          competitorData.push(null)
        }
      } else {
        // Position
        const brandPositions = day.brandResults.filter(r => r.position !== null).map(r => r.position as number)
        if (brandPositions.length > 0) {
          brandData.push(Math.round((brandPositions.reduce((a, b) => a + b, 0) / brandPositions.length) * 10) / 10)
        } else {
          brandData.push(null)
        }

        const compPositions = day.competitorMentions.filter(m => m.position !== null).map(m => m.position as number)
        if (compPositions.length > 0) {
          competitorData.push(Math.round((compPositions.reduce((a, b) => a + b, 0) / compPositions.length) * 10) / 10)
        } else {
          competitorData.push(null)
        }
      }
    }

    await nextTick()
    renderChart(labels, brandData, competitorData)
  } catch (error) {
    console.error('Error loading chart data:', error)
  } finally {
    chartLoading.value = false
  }
}

const renderChart = (labels: string[], brandData: (number | null)[], competitorData: (number | null)[]) => {
  if (!trendChartCanvas.value) return

  if (trendChart) {
    trendChart.destroy()
  }

  const ctx = trendChartCanvas.value.getContext('2d')
  if (!ctx) return

  const isPositionMetric = chartMetric.value === 'position'

  const datasets = [
    {
      label: productName.value,
      data: brandData,
      borderColor: '#F29901',
      backgroundColor: '#F2990115',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#F29901',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      spanGaps: true
    },
    {
      label: competitor.value?.name || 'Competitor',
      data: competitorData,
      borderColor: '#f87171',
      backgroundColor: '#f8717115',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#f87171',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      spanGaps: true
    }
  ]

  let maxValue = isPositionMetric ? 10 : 100
  if (isPositionMetric) {
    const allValues = [
      ...brandData.filter(v => v !== null) as number[],
      ...competitorData.filter(v => v !== null) as number[]
    ]
    if (allValues.length > 0) {
      maxValue = Math.max(10, Math.ceil(Math.max(...allValues) / 5) * 5)
    }
  }

  trendChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 12,
          titleFont: { size: 13 },
          bodyFont: { size: 12 },
          callbacks: {
            label: (context) => {
              const value = context.parsed.y
              if (value === null) return `${context.dataset.label}: No data`
              if (isPositionMetric) return `${context.dataset.label}: #${value}`
              return `${context.dataset.label}: ${value}%`
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, color: '#9ca3af', maxRotation: 0 }
        },
        y: {
          min: isPositionMetric ? 1 : 0,
          max: maxValue,
          reverse: isPositionMetric,
          grid: { color: '#f3f4f6' },
          ticks: {
            font: { size: 10 },
            color: '#9ca3af',
            callback: (v) => isPositionMetric ? `#${v}` : `${v}%`
          }
        }
      }
    }
  })
}

const removeCompetitor = async () => {
  if (!competitor.value) return
  if (!confirm(`Stop tracking ${competitor.value.name}?`)) return

  try {
    await supabase
      .from('competitors')
      .delete()
      .eq('id', competitorId)

    router.push('/dashboard/competitors')
  } catch (error) {
    console.error('Error removing competitor:', error)
    alert('Failed to remove competitor')
  }
}

const getOverallWinnerClass = () => {
  let brandWins = 0
  let competitorWins = 0

  // Mention rate comparison
  if (brandMetrics.value.mentionRate > competitorMetrics.value.mentionRate) brandWins++
  else if (competitorMetrics.value.mentionRate > brandMetrics.value.mentionRate) competitorWins++

  // Citation rate comparison
  if (competitorMetrics.value.citationRate !== null) {
    if (brandMetrics.value.citationRate > competitorMetrics.value.citationRate) brandWins++
    else if (competitorMetrics.value.citationRate > brandMetrics.value.citationRate) competitorWins++
  }

  // Position comparison (lower is better)
  if (brandMetrics.value.avgPosition && competitorMetrics.value.avgPosition) {
    if (brandMetrics.value.avgPosition < competitorMetrics.value.avgPosition) brandWins++
    else if (competitorMetrics.value.avgPosition < brandMetrics.value.avgPosition) competitorWins++
  }

  if (brandWins > competitorWins) return 'bg-emerald-100 text-emerald-700'
  if (competitorWins > brandWins) return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-600'
}

const getOverallWinnerText = () => {
  let brandWins = 0
  let competitorWins = 0

  // Mention rate comparison
  if (brandMetrics.value.mentionRate > competitorMetrics.value.mentionRate) brandWins++
  else if (competitorMetrics.value.mentionRate > brandMetrics.value.mentionRate) competitorWins++

  // Citation rate comparison
  if (competitorMetrics.value.citationRate !== null) {
    if (brandMetrics.value.citationRate > competitorMetrics.value.citationRate) brandWins++
    else if (competitorMetrics.value.citationRate > brandMetrics.value.citationRate) competitorWins++
  }

  // Position comparison (lower is better)
  if (brandMetrics.value.avgPosition && competitorMetrics.value.avgPosition) {
    if (brandMetrics.value.avgPosition < competitorMetrics.value.avgPosition) brandWins++
    else if (competitorMetrics.value.avgPosition < brandMetrics.value.avgPosition) competitorWins++
  }

  if (brandWins > competitorWins) return 'Winning'
  if (competitorWins > brandWins) return 'Losing'
  return 'Tied'
}

const getWinnerBadgeClass = (brandValue: number | null, competitorValue: number | null, betterIs: 'higher' | 'lower') => {
  if (brandValue === null || competitorValue === null) return 'bg-gray-100 text-gray-500'

  const brandWins = betterIs === 'higher'
    ? brandValue > competitorValue
    : brandValue < competitorValue
  const isTied = brandValue === competitorValue

  if (isTied) return 'bg-gray-100 text-gray-600'
  if (brandWins) return 'bg-emerald-100 text-emerald-700'
  return 'bg-red-100 text-red-700'
}

const getWinnerText = (brandValue: number | null, competitorValue: number | null, betterIs: 'higher' | 'lower') => {
  if (brandValue === null || competitorValue === null) return 'N/A'

  const brandWins = betterIs === 'higher'
    ? brandValue > competitorValue
    : brandValue < competitorValue
  const isTied = brandValue === competitorValue

  if (isTied) return 'Tied'
  return brandWins ? productName.value : competitor.value?.name || 'Competitor'
}

const getSentimentClass = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return 'bg-emerald-50 text-emerald-700'
    case 'negative': return 'bg-red-50 text-red-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

const formatModel = (model: string) => {
  return formatModelName(model)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const formatUrlPath = (url: string) => {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname + parsed.search
    return path.length > 60 ? path.substring(0, 60) + '...' : path || '/'
  } catch {
    return url.length > 60 ? url.substring(0, 60) + '...' : url
  }
}
</script>
