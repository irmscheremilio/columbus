<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
    <div class="p-4 lg:p-6 space-y-5">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 class="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">Visibility</h1>
          <p class="text-xs sm:text-sm text-gray-500">Track brand presence across AI platforms</p>
        </div>
        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <DateRangeSelector />
          <button
            class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-brand text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm shadow-brand/25 hover:shadow-md hover:shadow-brand/30 hover:bg-brand/95 transition-all duration-200 whitespace-nowrap"
            @click="refreshData"
          >
            <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span class="hidden sm:inline">Refresh</span>
            <span class="sm:hidden">↻</span>
          </button>
        </div>
      </div>

      <!-- Mention Rate Hero Card -->
      <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
        <div class="px-3 sm:px-5 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 border-l-brand">
          <div class="flex items-center gap-3 sm:gap-4">
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <div class="text-[10px] sm:text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">Mention Rate</div>
              <div class="flex items-baseline gap-1.5 sm:gap-2">
                <span class="text-2xl sm:text-3xl font-bold text-gray-900">{{ mentionRate }}</span>
                <span class="text-base sm:text-lg font-medium text-gray-400">%</span>
              </div>
            </div>
          </div>
          <!-- Mobile: horizontal scroll stats -->
          <div class="flex items-center gap-2 sm:gap-4 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-1 sm:pb-0">
            <div class="text-center px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-50 rounded-lg flex-shrink-0">
              <div class="text-sm sm:text-base font-bold text-gray-900">{{ totalTests }}</div>
              <div class="text-[9px] sm:text-[10px] text-gray-500 whitespace-nowrap">Tests</div>
            </div>
            <div class="text-center px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-50 rounded-lg flex-shrink-0">
              <div class="text-sm sm:text-base font-bold text-gray-900">{{ citationRate }}%</div>
              <div class="text-[9px] sm:text-[10px] text-gray-500 whitespace-nowrap">Cited</div>
            </div>
            <div class="text-center px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-50 rounded-lg flex-shrink-0">
              <div class="text-sm sm:text-base font-bold text-gray-900">#{{ avgPosition || '-' }}</div>
              <div class="text-[9px] sm:text-[10px] text-gray-500 whitespace-nowrap">Avg Pos</div>
            </div>
            <div class="text-center px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-50 rounded-lg flex-shrink-0">
              <div class="text-sm sm:text-base font-bold text-emerald-600">{{ positiveSentiment }}%</div>
              <div class="text-[9px] sm:text-[10px] text-emerald-600 whitespace-nowrap">Positive</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Platform Comparison Table -->
        <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div class="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100/80 flex items-center gap-2">
            <div class="w-1 h-3 sm:h-4 rounded-full bg-brand"></div>
            <div>
              <h2 class="text-xs sm:text-sm font-semibold text-gray-900">Platform Comparison</h2>
              <p class="text-[9px] sm:text-[10px] text-gray-500 mt-0.5">Visibility by AI platform</p>
            </div>
          </div>
          <div class="divide-y divide-gray-100/80">
            <a
              v-for="platform in platformsWithStats"
              :key="platform.id"
              :href="platform.website_url"
              target="_blank"
              class="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50/50 transition-colors group"
            >
              <div class="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-100 transition-colors">
                <img
                  v-if="platform.logo_url"
                  :src="platform.logo_url"
                  :alt="platform.name"
                  class="w-3.5 h-3.5 sm:w-5 sm:h-5 object-contain"
                  @error="($event.target as HTMLImageElement).style.display = 'none'"
                />
                <span v-else class="text-[9px] sm:text-[10px] font-bold text-gray-600">{{ platform.name.charAt(0) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-[11px] sm:text-xs font-medium text-gray-900 truncate">{{ platform.name }}</div>
                <div class="h-1 sm:h-1.5 bg-gray-100 rounded-full mt-1 sm:mt-1.5 overflow-hidden">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-brand to-amber-400 transition-all duration-500"
                    :style="{ width: `${platform.score}%` }"
                  ></div>
                </div>
              </div>
              <div class="text-right shrink-0">
                <div class="text-xs sm:text-sm font-bold text-gray-900">{{ platform.score }}%</div>
                <div class="text-[9px] sm:text-[10px] text-gray-400">{{ platform.mentions }}/{{ platform.tests }}</div>
              </div>
            </a>
          </div>
          <div v-if="!platformsWithStats.length" class="px-3 sm:px-4 py-6 sm:py-8 text-center text-xs sm:text-sm text-gray-500">
            No platforms configured
          </div>
          <div v-else class="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50/50 border-t border-gray-100/80">
            <div class="flex justify-between text-[11px] sm:text-xs">
              <span class="text-gray-500">Best performer</span>
              <span class="font-semibold text-gray-900">{{ bestPlatform }}</span>
            </div>
          </div>
        </div>

        <!-- Chart Section -->
        <div class="lg:col-span-2 flex">
          <VisibilityChart :product-id="activeProductId" @period-change="onPeriodChange" class="flex-1" chart-height="100%" />
        </div>
      </div>

      <!-- Recent Results Table -->
      <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div class="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100/80 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-transparent">
          <h2 class="text-xs sm:text-sm font-semibold text-gray-900">Recent Scan Results</h2>
          <div class="flex items-center gap-2">
            <span class="text-[10px] sm:text-xs text-gray-500 bg-gray-100/80 px-1.5 sm:px-2 py-0.5 rounded-full">{{ results.length }}</span>
            <NuxtLink
              to="/dashboard/scans"
              class="text-[10px] sm:text-xs font-medium text-brand hover:text-brand/80 flex items-center gap-1 transition-colors"
            >
              <span class="hidden sm:inline">View all scans</span>
              <span class="sm:hidden">All</span>
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>
          </div>
        </div>
        <div v-if="loading" class="flex items-center justify-center py-6 sm:py-8">
          <div class="animate-spin rounded-full h-5 w-5 border-2 border-brand border-t-transparent"></div>
        </div>
        <div v-else-if="!results.length" class="text-center py-6 sm:py-8 text-xs sm:text-sm text-gray-500">
          No scan results yet. Run a visibility scan to see data here.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-wider border-b border-gray-100/80 bg-gray-50/30">
                <th class="text-left px-3 sm:px-4 py-2 sm:py-3 font-medium">Platform</th>
                <th class="text-left px-2 sm:px-4 py-2 sm:py-3 font-medium hidden sm:table-cell">Prompt</th>
                <th class="text-center px-2 sm:px-4 py-2 sm:py-3 font-medium">
                  <span class="hidden sm:inline">Mentioned</span>
                  <span class="sm:hidden" title="Mentioned">✓</span>
                </th>
                <th class="text-center px-2 sm:px-4 py-2 sm:py-3 font-medium hidden md:table-cell" title="AI used sources in response">Sources</th>
                <th class="text-center px-2 sm:px-4 py-2 sm:py-3 font-medium" title="Brand website was cited">
                  <span class="hidden sm:inline">Cited</span>
                  <span class="sm:hidden" title="Cited">🔗</span>
                </th>
                <th class="text-center px-2 sm:px-4 py-2 sm:py-3 font-medium hidden lg:table-cell">Position</th>
                <th class="text-center px-2 sm:px-4 py-2 sm:py-3 font-medium hidden lg:table-cell">Sentiment</th>
                <th class="text-center px-2 sm:px-4 py-2 sm:py-3 font-medium hidden xl:table-cell">Limit</th>
                <th class="text-right px-3 sm:px-4 py-2 sm:py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100/80">
              <tr
                v-for="result in results"
                :key="result.id"
                class="group text-xs sm:text-sm hover:bg-gray-50/80 transition-colors cursor-pointer"
                @click="openResultDetail(result)"
              >
                <td class="px-3 sm:px-4 py-2 sm:py-3">
                  <div class="flex items-center gap-1.5 sm:gap-2.5">
                    <div class="w-5 h-5 sm:w-7 sm:h-7 rounded-lg bg-gray-50 group-hover:bg-gray-100 flex items-center justify-center flex-shrink-0 transition-colors">
                      <img
                        v-if="getPlatformLogo(result.ai_model)"
                        :src="getPlatformLogo(result.ai_model)"
                        :alt="formatModelName(result.ai_model)"
                        class="w-3 h-3 sm:w-4 sm:h-4 object-contain"
                        @error="($event.target as HTMLImageElement).style.display = 'none'"
                      />
                      <span v-else class="text-[8px] sm:text-[10px] font-bold text-gray-500">{{ formatModelName(result.ai_model).charAt(0) }}</span>
                    </div>
                    <span class="text-[10px] sm:text-xs font-medium text-gray-700 truncate max-w-[60px] sm:max-w-none">{{ formatModelName(result.ai_model) }}</span>
                  </div>
                </td>
                <td class="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
                  <div class="text-gray-900 truncate max-w-[120px] lg:max-w-xs text-xs sm:text-sm" :title="result.prompt">{{ result.prompt }}</div>
                </td>
                <td class="px-2 sm:px-4 py-2 sm:py-3 text-center">
                  <div class="flex items-center justify-center">
                    <span
                      class="inline-flex w-5 h-5 sm:w-6 sm:h-6 rounded-full items-center justify-center"
                      :class="result.brand_mentioned ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'"
                    >
                      <svg v-if="result.brand_mentioned" class="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span v-else class="text-[10px] sm:text-xs">−</span>
                    </span>
                  </div>
                </td>
                <td class="px-2 sm:px-4 py-2 sm:py-3 text-center hidden md:table-cell">
                  <div class="flex items-center justify-center">
                    <span
                      class="inline-flex w-5 h-5 sm:w-6 sm:h-6 rounded-full items-center justify-center"
                      :class="result.has_sources ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'"
                      :title="result.has_sources ? `${result.source_count} source(s) used` : 'No sources'"
                    >
                      <svg v-if="result.has_sources" class="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span v-else class="text-[10px] sm:text-xs">−</span>
                    </span>
                  </div>
                </td>
                <td class="px-2 sm:px-4 py-2 sm:py-3 text-center">
                  <div class="flex items-center justify-center">
                    <span
                      class="inline-flex w-5 h-5 sm:w-6 sm:h-6 rounded-full items-center justify-center"
                      :class="result.citation_present ? 'bg-brand/15 text-brand' : 'bg-gray-100 text-gray-400'"
                      :title="result.citation_present ? 'Brand website was cited' : 'Brand not cited'"
                    >
                      <svg v-if="result.citation_present" class="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span v-else class="text-[10px] sm:text-xs">−</span>
                    </span>
                  </div>
                </td>
                <td class="px-2 sm:px-4 py-2 sm:py-3 text-center hidden lg:table-cell">
                  <span v-if="result.position" class="inline-flex items-center justify-center min-w-[20px] sm:min-w-[24px] h-5 sm:h-6 px-1 sm:px-1.5 rounded-md bg-blue-50 text-blue-700 text-[10px] sm:text-xs font-semibold">
                    #{{ result.position }}
                  </span>
                  <span v-else class="text-gray-300">−</span>
                </td>
                <td class="px-2 sm:px-4 py-2 sm:py-3 text-center hidden lg:table-cell">
                  <span
                    class="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full"
                    :class="result.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700' : result.sentiment === 'negative' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500'"
                  >
                    <span v-if="result.sentiment === 'positive'" class="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500"></span>
                    <span v-else-if="result.sentiment === 'negative'" class="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-500"></span>
                    <span v-else class="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-gray-400"></span>
                    {{ result.sentiment || 'neutral' }}
                  </span>
                </td>
                <td class="px-2 sm:px-4 py-2 sm:py-3 text-center hidden xl:table-cell">
                  <span
                    v-if="result.credits_exhausted"
                    class="inline-flex w-5 h-5 sm:w-6 sm:h-6 rounded-full items-center justify-center bg-amber-100 text-amber-600"
                    title="Credit limit exceeded"
                  >
                    <svg class="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </span>
                  <span v-else class="text-gray-300">−</span>
                </td>
                <td class="px-3 sm:px-4 py-2 sm:py-3 text-right">
                  <span class="text-[10px] sm:text-xs text-gray-500">{{ formatDate(result.tested_at) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Scan Result Detail Modal -->
    <Teleport to="body">
      <Transition name="modal">
      <div
        v-if="showDetailModal && selectedResult"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
        @click.self="closeDetailModal"
      >
        <div class="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
            <div class="flex items-center gap-2 sm:gap-4">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <img
                  v-if="getPlatformLogo(selectedResult.ai_model)"
                  :src="getPlatformLogo(selectedResult.ai_model)"
                  :alt="formatModelName(selectedResult.ai_model)"
                  class="w-4 h-4 sm:w-5 sm:h-5 object-contain"
                />
                <span v-else class="text-xs sm:text-sm font-bold text-gray-500">{{ formatModelName(selectedResult.ai_model).charAt(0) }}</span>
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-semibold text-gray-900">{{ formatModelName(selectedResult.ai_model) }}</h3>
                <p class="text-[10px] sm:text-xs text-gray-500">{{ formatDateTime(selectedResult.tested_at) }}</p>
              </div>
            </div>
            <button
              @click="closeDetailModal"
              class="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            <!-- Status Indicators Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div class="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-2 sm:py-3 rounded-xl border" :class="selectedResult.brand_mentioned ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'">
                <div class="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0" :class="selectedResult.brand_mentioned ? 'bg-emerald-100' : 'bg-gray-200'">
                  <svg class="w-3 h-3 sm:w-4 sm:h-4" :class="selectedResult.brand_mentioned ? 'text-emerald-600' : 'text-gray-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path v-if="selectedResult.brand_mentioned" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] sm:text-[10px] uppercase tracking-wider" :class="selectedResult.brand_mentioned ? 'text-emerald-600' : 'text-gray-400'">Brand</div>
                  <div class="text-[10px] sm:text-xs font-semibold truncate" :class="selectedResult.brand_mentioned ? 'text-emerald-700' : 'text-gray-500'">{{ selectedResult.brand_mentioned ? 'Mentioned' : 'Not Mentioned' }}</div>
                </div>
              </div>

              <div class="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-2 sm:py-3 rounded-xl border" :class="selectedResult.has_sources ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'">
                <div class="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0" :class="selectedResult.has_sources ? 'bg-blue-100' : 'bg-gray-200'">
                  <svg class="w-3 h-3 sm:w-4 sm:h-4" :class="selectedResult.has_sources ? 'text-blue-600' : 'text-gray-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] sm:text-[10px] uppercase tracking-wider" :class="selectedResult.has_sources ? 'text-blue-600' : 'text-gray-400'">Sources</div>
                  <div class="text-[10px] sm:text-xs font-semibold" :class="selectedResult.has_sources ? 'text-blue-700' : 'text-gray-500'">{{ selectedResult.has_sources ? selectedResult.source_count : 'None' }}</div>
                </div>
              </div>

              <div class="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-2 sm:py-3 rounded-xl border" :class="selectedResult.citation_present ? 'bg-brand/5 border-brand/30' : 'bg-gray-50 border-gray-200'">
                <div class="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0" :class="selectedResult.citation_present ? 'bg-brand/15' : 'bg-gray-200'">
                  <svg class="w-3 h-3 sm:w-4 sm:h-4" :class="selectedResult.citation_present ? 'text-brand' : 'text-gray-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] sm:text-[10px] uppercase tracking-wider" :class="selectedResult.citation_present ? 'text-brand' : 'text-gray-400'">Cited</div>
                  <div class="text-[10px] sm:text-xs font-semibold" :class="selectedResult.citation_present ? 'text-brand' : 'text-gray-500'">{{ selectedResult.citation_present ? 'Yes' : 'No' }}</div>
                </div>
              </div>

              <div class="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-2 sm:py-3 rounded-xl border" :class="selectedResult.position ? 'bg-violet-50 border-violet-200' : 'bg-gray-50 border-gray-200'">
                <div class="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0" :class="selectedResult.position ? 'bg-violet-100' : 'bg-gray-200'">
                  <span class="text-[10px] sm:text-xs font-bold" :class="selectedResult.position ? 'text-violet-600' : 'text-gray-400'">#</span>
                </div>
                <div class="min-w-0">
                  <div class="text-[9px] sm:text-[10px] uppercase tracking-wider" :class="selectedResult.position ? 'text-violet-600' : 'text-gray-400'">Position</div>
                  <div class="text-[10px] sm:text-xs font-semibold" :class="selectedResult.position ? 'text-violet-700' : 'text-gray-500'">{{ selectedResult.position || 'N/A' }}</div>
                </div>
              </div>
            </div>

            <!-- Additional Status Row -->
            <div class="flex flex-wrap gap-1.5 sm:gap-2">
              <div class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border" :class="getSentimentClass(selectedResult.sentiment)">
                <span class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" :class="selectedResult.sentiment === 'positive' ? 'bg-emerald-500' : selectedResult.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-400'"></span>
                <span class="text-[10px] sm:text-xs font-medium capitalize">{{ selectedResult.sentiment || 'neutral' }}</span>
              </div>
              <div v-if="selectedResult.credits_exhausted" class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span class="text-[10px] sm:text-xs font-medium">Limit Exceeded</span>
              </div>
              <a
                v-if="selectedResult.chat_url"
                :href="selectedResult.chat_url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-brand/10 border border-brand/20 text-brand hover:bg-brand/20 transition-colors"
              >
                <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span class="text-[10px] sm:text-xs font-medium">View Chat</span>
              </a>
            </div>

            <!-- Prompt Section -->
            <div>
              <div class="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <div class="w-1 h-3 sm:h-4 rounded-full bg-gray-300"></div>
                <h3 class="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Prompt</h3>
              </div>
              <div class="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100">
                <p class="text-xs sm:text-sm text-gray-800 leading-relaxed">{{ selectedResult.prompt }}</p>
              </div>
            </div>

            <!-- Response Section -->
            <div>
              <div class="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <div class="w-1 h-3 sm:h-4 rounded-full bg-brand"></div>
                <h3 class="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Response</h3>
              </div>
              <div class="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100 max-h-[250px] sm:max-h-[350px] overflow-y-auto">
                <p v-if="selectedResult.response_text" class="text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{{ selectedResult.response_text }}</p>
                <p v-else class="text-xs sm:text-sm text-gray-400 italic">Response not available</p>
              </div>
            </div>

            <!-- Competitor Mentions -->
            <div v-if="selectedResult.competitor_mentions?.length">
              <div class="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <div class="w-1 h-3 sm:h-4 rounded-full bg-orange-400"></div>
                <h3 class="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Competitor Mentions</h3>
              </div>
              <div class="flex flex-wrap gap-1.5 sm:gap-2">
                <span
                  v-for="competitor in selectedResult.competitor_mentions"
                  :key="competitor"
                  class="px-2 sm:px-3 py-1 sm:py-1.5 bg-orange-50 text-orange-700 text-[10px] sm:text-xs font-medium rounded-lg border border-orange-200"
                >
                  {{ competitor }}
                </span>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 bg-gray-50/80 flex-shrink-0">
            <button
              @click="closeDetailModal"
              class="w-full px-4 py-2 sm:py-2.5 bg-gray-900 text-white text-sm sm:text-base rounded-xl font-medium hover:bg-gray-800 transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const supabase = useSupabaseClient()
const { activeProductId, initialized: productInitialized } = useActiveProduct()
const { platforms: aiPlatforms, loadPlatforms, formatModelName, getPlatformColor, getPlatformLogo } = useAIPlatforms()
const { selectedRegion } = useRegionFilter()
const { dateRange, version: dateRangeVersion } = useDateRange()

const loading = ref(true)
const overallScore = ref(0)
const totalTests = ref(0)
const mentionRate = ref(0)
const citationRate = ref(0)
const avgPosition = ref(0)
const positiveSentiment = ref(0)

// Platform stats (keyed by platform id)
const platformStats = ref<Record<string, { score: number; mentions: number; tests: number }>>({})

const results = ref<any[]>([])
const showDetailModal = ref(false)
const selectedResult = ref<any>(null)

// Watch for global region filter changes
watch(selectedRegion, () => {
  if (activeProductId.value) {
    loadVisibilityData()
  }
})

// Watch for global date range changes
watch(dateRangeVersion, () => {
  if (activeProductId.value) {
    loadVisibilityData()
  }
})

// Combine platform data with stats for display
const platformsWithStats = computed(() => {
  return aiPlatforms.value.map(p => ({
    ...p,
    score: platformStats.value[p.id]?.score || 0,
    mentions: platformStats.value[p.id]?.mentions || 0,
    tests: platformStats.value[p.id]?.tests || 0
  }))
})

const bestPlatform = computed(() => {
  const sorted = [...platformsWithStats.value].sort((a, b) => b.score - a.score)
  return sorted[0]?.score > 0 ? sorted[0].name : '-'
})

const totalMentions = computed(() => {
  return Object.values(platformStats.value).reduce((sum, p) => sum + p.mentions, 0)
})

watch(activeProductId, async (newProductId) => {
  if (newProductId) {
    await loadVisibilityData()
  }
})

onMounted(async () => {
  if (productInitialized.value && activeProductId.value) {
    await loadVisibilityData()
  } else {
    const unwatch = watch(productInitialized, async (initialized) => {
      if (initialized && activeProductId.value) {
        await loadVisibilityData()
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
    // Load platforms first
    await loadPlatforms()

    // Use global date range
    const startDate = dateRange.value.startDate
    const endDate = dateRange.value.endDate

    // Build base query for ALL results within date range for accurate stats calculation
    let allResultsQuery = supabase
      .from('prompt_results')
      .select('id, ai_model, brand_mentioned, citation_present, position, sentiment, request_country')
      .eq('product_id', productId)

    if (startDate) {
      allResultsQuery = allResultsQuery.gte('tested_at', startDate.toISOString())
    }
    if (endDate) {
      allResultsQuery = allResultsQuery.lte('tested_at', endDate.toISOString())
    }

    // Apply region filter if selected
    if (selectedRegion.value) {
      allResultsQuery = allResultsQuery.ilike('request_country', selectedRegion.value)
    }

    const { data: allResults } = await allResultsQuery

    // Load only 50 recent results for display table (with prompt text)
    let promptResultsQuery = supabase
      .from('prompt_results')
      .select('*, prompts(prompt_text)')
      .eq('product_id', productId)

    if (startDate) {
      promptResultsQuery = promptResultsQuery.gte('tested_at', startDate.toISOString())
    }
    if (endDate) {
      promptResultsQuery = promptResultsQuery.lte('tested_at', endDate.toISOString())
    }

    // Apply region filter if selected
    if (selectedRegion.value) {
      promptResultsQuery = promptResultsQuery.ilike('request_country', selectedRegion.value)
    }

    const { data: promptResults } = await promptResultsQuery
      .order('tested_at', { ascending: false })
      .limit(50)

    // Map results with prompt text
    const mappedResults = promptResults?.map(r => ({
      ...r,
      prompt: r.prompts?.prompt_text || 'Unknown prompt',
      has_sources: false,
      source_count: 0
    })) || []

    // Fetch citation counts for display results
    if (mappedResults.length > 0) {
      const resultIds = mappedResults.map(r => r.id)
      const { data: citations } = await supabase
        .from('prompt_citations')
        .select('prompt_result_id')
        .in('prompt_result_id', resultIds)

      // Count sources per result
      const sourcesPerResult: Record<string, number> = {}
      for (const citation of citations || []) {
        sourcesPerResult[citation.prompt_result_id] = (sourcesPerResult[citation.prompt_result_id] || 0) + 1
      }

      // Update results with source counts
      for (const result of mappedResults) {
        const count = sourcesPerResult[result.id] || 0
        result.has_sources = count > 0
        result.source_count = count
      }
    }

    results.value = mappedResults

    // Calculate stats from ALL results in date range
    const statsData = allResults || []
    if (statsData.length > 0) {
      totalTests.value = statsData.length

      const mentioned = statsData.filter(r => r.brand_mentioned).length
      mentionRate.value = Math.round((mentioned / totalTests.value) * 100)

      const cited = statsData.filter(r => r.citation_present).length
      citationRate.value = Math.round((cited / totalTests.value) * 100)

      const positions = statsData.filter(r => r.position !== null).map(r => r.position)
      avgPosition.value = positions.length > 0
        ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length)
        : 0

      // Only count sentiment from results where brand was mentioned
      const mentionedResults = statsData.filter(r => r.brand_mentioned)
      const positive = mentionedResults.filter(r => r.sentiment === 'positive').length
      positiveSentiment.value = mentionedResults.length > 0
        ? Math.round((positive / mentionedResults.length) * 100)
        : 0

      // Overall score = mention rate (primary metric)
      overallScore.value = mentionRate.value

      // Calculate platform stats dynamically from loaded platforms
      const newStats: Record<string, { score: number; mentions: number; tests: number }> = {}
      for (const platform of aiPlatforms.value) {
        const platformResults = statsData.filter(r => r.ai_model === platform.id)
        const tests = platformResults.length
        const mentions = platformResults.filter(r => r.brand_mentioned).length
        newStats[platform.id] = {
          tests,
          mentions,
          score: tests > 0 ? Math.round((mentions / tests) * 100) : 0
        }
      }
      platformStats.value = newStats
    } else {
      // Reset all stats when no data
      totalTests.value = 0
      mentionRate.value = 0
      citationRate.value = 0
      avgPosition.value = 0
      positiveSentiment.value = 0
      overallScore.value = 0
      platformStats.value = {}
    }
  } catch (error) {
    console.error('Error loading visibility data:', error)
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await loadVisibilityData()
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const openResultDetail = (result: any) => {
  selectedResult.value = result
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedResult.value = null
}

const getPlatformClass = (model: string) => {
  const color = getPlatformColor(model)
  // Generate a class based on the platform color - use a generic approach
  // since we can't dynamically generate Tailwind classes
  return 'bg-gray-100 text-gray-700'
}

const getSentimentClass = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return 'bg-emerald-50 border-emerald-200 text-emerald-700'
    case 'negative': return 'bg-red-50 border-red-200 text-red-700'
    default: return 'bg-gray-100 border-gray-200 text-gray-500'
  }
}
</script>

<style scoped>
/* Modal transition animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.2s ease;
}

/* Mobile: slide up from bottom */
@media (max-width: 639px) {
  .modal-enter-from > div,
  .modal-leave-to > div {
    transform: translateY(100%);
  }
}

/* Desktop: scale and fade */
@media (min-width: 640px) {
  .modal-enter-from > div,
  .modal-leave-to > div {
    transform: scale(0.95);
  }
}
</style>
