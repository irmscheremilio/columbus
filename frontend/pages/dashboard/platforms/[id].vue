<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
    <div class="p-4 lg:p-6 space-y-5">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2 sm:gap-4">
          <NuxtLink
            to="/dashboard/platforms"
            class="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-lg transition-colors"
          >
            <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </NuxtLink>
          <div class="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center overflow-hidden shadow-sm">
            <img
              v-if="platform?.logo_url"
              :src="platform.logo_url"
              :alt="platform.name"
              class="w-5 h-5 sm:w-7 sm:h-7 object-contain"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
            <span v-else class="text-sm sm:text-lg font-semibold text-gray-400">{{ platform?.name?.charAt(0)?.toUpperCase() }}</span>
          </div>
          <div class="min-w-0">
            <h1 class="text-base sm:text-xl font-semibold text-gray-900 tracking-tight truncate">{{ platform?.name || 'Platform' }}</h1>
            <p class="text-xs sm:text-sm text-gray-500">{{ platform?.provider || 'AI Platform' }}</p>
          </div>
        </div>
        <DateRangeSelector />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
      </div>

      <template v-else-if="platform">
        <!-- Stats Hero Card -->
        <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
          <div class="px-3 sm:px-5 py-3 sm:py-4 border-l-4 border-l-brand">
            <!-- Desktop layout -->
            <div class="hidden sm:flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <img
                    v-if="platform.logo_url"
                    :src="platform.logo_url"
                    :alt="platform.name"
                    class="w-6 h-6 object-contain"
                  />
                  <svg v-else class="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div class="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">Mention Rate</div>
                  <div class="flex items-baseline gap-2">
                    <span class="text-3xl font-bold text-gray-900">{{ metrics.mentionRate }}</span>
                    <span class="text-lg font-medium text-gray-400">%</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="text-center px-3 py-1.5 bg-gray-50 rounded-lg">
                  <div class="text-base font-bold text-gray-900">{{ metrics.totalTests }}</div>
                  <div class="text-[10px] text-gray-500">Total Tests</div>
                </div>
                <div class="text-center px-3 py-1.5 bg-emerald-50 rounded-lg">
                  <div class="text-base font-bold text-emerald-600">{{ metrics.mentions }}</div>
                  <div class="text-[10px] text-gray-500">Mentions</div>
                </div>
                <div class="text-center px-3 py-1.5 bg-blue-50 rounded-lg">
                  <div class="text-base font-bold text-blue-600">{{ metrics.avgPosition ? `#${metrics.avgPosition}` : '-' }}</div>
                  <div class="text-[10px] text-gray-500">Avg Position</div>
                </div>
                <div class="text-center px-3 py-1.5 bg-violet-50 rounded-lg">
                  <div class="text-base font-bold text-violet-600">{{ metrics.citationRate }}%</div>
                  <div class="text-[10px] text-gray-500">Citation Rate</div>
                </div>
              </div>
            </div>
            <!-- Mobile layout -->
            <div class="sm:hidden">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                    <img
                      v-if="platform.logo_url"
                      :src="platform.logo_url"
                      :alt="platform.name"
                      class="w-5 h-5 object-contain"
                    />
                    <svg v-else class="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div class="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Mention Rate</div>
                    <div class="flex items-baseline gap-1">
                      <span class="text-2xl font-bold text-gray-900">{{ metrics.mentionRate }}</span>
                      <span class="text-sm font-medium text-gray-400">%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-4 gap-2">
                <div class="text-center px-2 py-1.5 bg-gray-50 rounded-lg">
                  <div class="text-sm font-bold text-gray-900">{{ metrics.totalTests }}</div>
                  <div class="text-[9px] text-gray-500">Tests</div>
                </div>
                <div class="text-center px-2 py-1.5 bg-emerald-50 rounded-lg">
                  <div class="text-sm font-bold text-emerald-600">{{ metrics.mentions }}</div>
                  <div class="text-[9px] text-gray-500">Mentions</div>
                </div>
                <div class="text-center px-2 py-1.5 bg-blue-50 rounded-lg">
                  <div class="text-sm font-bold text-blue-600">{{ metrics.avgPosition ? `#${metrics.avgPosition}` : '-' }}</div>
                  <div class="text-[9px] text-gray-500">Position</div>
                </div>
                <div class="text-center px-2 py-1.5 bg-violet-50 rounded-lg">
                  <div class="text-sm font-bold text-violet-600">{{ metrics.citationRate }}%</div>
                  <div class="text-[9px] text-gray-500">Citations</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <!-- Visibility Over Time Chart -->
          <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden">
            <div class="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100/80 flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-1 h-4 rounded-full bg-brand flex-shrink-0"></div>
                <div class="min-w-0">
                  <h2 class="text-xs sm:text-sm font-semibold text-gray-900 truncate">Visibility Over Time</h2>
                  <p class="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 truncate">Mention rate trend on {{ platform.name }}</p>
                </div>
              </div>
              <select
                v-model="chartMetric"
                @change="loadChartData"
                class="text-[10px] sm:text-[11px] bg-gray-100/80 border-0 rounded-md pl-2 pr-4 sm:pr-5 py-1 text-gray-600 font-medium cursor-pointer focus:ring-1 focus:ring-brand/30 flex-shrink-0"
              >
                <option value="mention_rate">Rate</option>
                <option value="position">Position</option>
                <option value="citation_rate">Citations</option>
              </select>
            </div>
            <div class="p-3 sm:p-4">
              <div class="relative h-40 sm:h-48">
                <canvas ref="trendChartCanvas"></canvas>
              </div>
            </div>
          </div>

          <!-- Cited Pages Chart -->
          <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div class="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100/80 flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-1 h-4 rounded-full bg-emerald-500 flex-shrink-0"></div>
                <div class="min-w-0">
                  <h2 class="text-xs sm:text-sm font-semibold text-gray-900 truncate">Your Most Cited Pages</h2>
                  <p class="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 truncate">Pages cited by {{ platform.name }}</p>
                </div>
              </div>
              <span class="text-[10px] sm:text-xs text-gray-500 bg-gray-100/80 px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
                {{ brandUrlStats.length }} pages
              </span>
            </div>

            <div v-if="loadingCitations" class="flex items-center justify-center py-8 sm:py-12">
              <div class="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-2 border-brand border-t-transparent"></div>
            </div>

            <div v-else-if="brandUrlStats.length === 0" class="text-center py-8 sm:py-12 text-xs sm:text-sm text-gray-500">
              <div class="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <svg class="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              No citations from {{ platform.name }} yet
            </div>

            <div v-else class="p-3 sm:p-4">
              <div class="space-y-2.5 sm:space-y-3 overflow-y-auto" :class="showAllCitedPages ? 'max-h-40 sm:max-h-48' : ''">
                <div
                  v-for="(urlStat, idx) in showAllCitedPages ? brandUrlStats : brandUrlStats.slice(0, 5)"
                  :key="urlStat.url"
                  class="group"
                >
                  <div class="flex items-center gap-2 sm:gap-3">
                    <div class="w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center text-[9px] sm:text-[10px] font-bold bg-emerald-100 text-emerald-700 shrink-0">
                      {{ idx + 1 }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between mb-0.5 sm:mb-1">
                        <a
                          :href="urlStat.url"
                          target="_blank"
                          class="text-[10px] sm:text-xs font-medium text-gray-700 hover:text-brand truncate transition-colors"
                          :title="urlStat.url"
                        >
                          {{ formatUrlPath(urlStat.url) }}
                        </a>
                        <span class="text-[10px] sm:text-xs font-bold text-emerald-600 ml-2 shrink-0">{{ urlStat.count }}</span>
                      </div>
                      <div class="h-1 sm:h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          class="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                          :style="{ width: `${(urlStat.count / maxBrandUrlCount) * 100}%` }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="brandUrlStats.length > 5" class="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100 text-center">
                <button
                  @click="showAllCitedPages = !showAllCitedPages"
                  class="text-[10px] sm:text-xs text-brand hover:text-brand/80 font-medium transition-colors"
                >
                  {{ showAllCitedPages ? 'Show less' : `+${brandUrlStats.length - 5} more` }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Scan Results Table -->
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 hover:shadow-md transition-shadow duration-200">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-4 pb-2.5 sm:pb-3 border-b border-gray-100/80">
            <div class="flex items-center gap-2">
              <div class="w-1 h-4 rounded-full bg-blue-500"></div>
              <h2 class="text-xs sm:text-sm font-semibold text-gray-900">Scan Results</h2>
              <span class="text-[10px] sm:text-xs text-gray-500 bg-gray-100/80 px-1.5 sm:px-2 py-0.5 rounded-full">
                {{ totalResults }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search..."
                class="text-xs sm:text-sm bg-gray-50/80 border border-gray-200/50 rounded-lg px-2.5 sm:px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand/20 w-full sm:w-48"
              />
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full table-fixed">
              <thead class="bg-gray-50/50">
                <tr>
                  <th class="text-left text-[10px] sm:text-[11px] font-medium text-gray-500 uppercase tracking-wide px-3 sm:px-4 py-2 sm:py-2.5">Prompt</th>
                  <th class="text-center text-[10px] sm:text-[11px] font-medium text-gray-500 uppercase tracking-wide px-2 sm:px-4 py-2 sm:py-2.5 w-[50px] sm:w-[80px]">
                    <span class="hidden sm:inline">Mentioned</span>
                    <span class="sm:hidden">M</span>
                  </th>
                  <th class="text-center text-[10px] sm:text-[11px] font-medium text-gray-500 uppercase tracking-wide px-2 sm:px-4 py-2 sm:py-2.5 w-[50px] sm:w-[80px] hidden sm:table-cell">Pos</th>
                  <th class="text-center text-[10px] sm:text-[11px] font-medium text-gray-500 uppercase tracking-wide px-2 sm:px-4 py-2 sm:py-2.5 w-[50px] sm:w-[80px] hidden md:table-cell">Cite</th>
                  <th class="text-center text-[10px] sm:text-[11px] font-medium text-gray-500 uppercase tracking-wide px-2 sm:px-4 py-2 sm:py-2.5 w-[40px] sm:w-[70px]">
                    <span class="hidden sm:inline">Chat</span>
                    <svg class="w-3.5 h-3.5 sm:hidden mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </th>
                  <th class="text-left text-[10px] sm:text-[11px] font-medium text-gray-500 uppercase tracking-wide px-2 sm:px-4 py-2 sm:py-2.5 w-[70px] sm:w-[120px] hidden sm:table-cell">Date</th>
                </tr>
              </thead>
            </table>
            <div class="max-h-72 sm:max-h-96 overflow-y-auto">
              <table class="w-full table-fixed">
                <tbody class="divide-y divide-gray-100/80">
                  <tr
                    v-for="result in scanResults"
                    :key="result.id"
                    class="hover:bg-gray-50/50 transition-colors"
                  >
                    <td class="py-2 sm:py-2.5 px-3 sm:px-4">
                      <span class="text-xs sm:text-sm text-gray-900 line-clamp-2" :title="result.prompt_text">
                        {{ result.prompt_text }}
                      </span>
                    </td>
                    <td class="py-2 sm:py-2.5 px-2 sm:px-4 w-[50px] sm:w-[80px] text-center">
                      <span
                        class="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[10px] sm:text-xs font-medium"
                        :class="result.brand_mentioned ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'"
                      >
                        {{ result.brand_mentioned ? '✓' : '✗' }}
                      </span>
                    </td>
                    <td class="py-2 sm:py-2.5 px-2 sm:px-4 w-[50px] sm:w-[80px] text-center hidden sm:table-cell">
                      <span v-if="result.position" class="text-xs sm:text-sm font-medium text-gray-900">#{{ result.position }}</span>
                      <span v-else class="text-gray-400">-</span>
                    </td>
                    <td class="py-2 sm:py-2.5 px-2 sm:px-4 w-[50px] sm:w-[80px] text-center hidden md:table-cell">
                      <span
                        class="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[10px] sm:text-xs font-medium"
                        :class="result.citation_present ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'"
                      >
                        {{ result.citation_present ? '✓' : '✗' }}
                      </span>
                    </td>
                    <td class="py-2 sm:py-2.5 px-2 sm:px-4 w-[40px] sm:w-[70px] text-center">
                      <a
                        v-if="result.chat_url"
                        :href="result.chat_url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex w-5 h-5 sm:w-6 sm:h-6 rounded items-center justify-center text-xs bg-brand/10 text-brand hover:bg-brand/20 transition-colors"
                        title="Open chat"
                      >
                        <svg class="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <span v-else class="text-gray-300">−</span>
                    </td>
                    <td class="py-2 sm:py-2.5 px-2 sm:px-4 w-[70px] sm:w-[120px] hidden sm:table-cell">
                      <span class="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                        {{ formatDate(result.tested_at) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="loadingResults" class="flex items-center justify-center py-6 sm:py-8">
              <div class="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-brand border-t-transparent"></div>
            </div>

            <div v-else-if="scanResults.length === 0" class="text-center py-6 sm:py-8">
              <p class="text-xs sm:text-sm text-gray-500">No scan results found</p>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-t border-gray-100/80 bg-gray-50/30">
            <span class="text-[10px] sm:text-xs text-gray-500">
              <span class="hidden sm:inline">Page {{ currentPage }} of {{ totalPages }} ({{ totalResults }} results)</span>
              <span class="sm:hidden">{{ currentPage }}/{{ totalPages }}</span>
            </span>
            <div class="flex items-center gap-1">
              <button
                @click="goToPage(1)"
                :disabled="currentPage === 1"
                class="px-1.5 sm:px-2 py-1 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-100/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hidden sm:block"
                title="First page"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                @click="goToPage(currentPage - 1)"
                :disabled="currentPage === 1"
                class="px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-100/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span class="hidden sm:inline">Previous</span>
                <span class="sm:hidden">Prev</span>
              </button>
              <span class="px-1.5 sm:px-2 text-[10px] sm:text-xs text-gray-500">
                {{ currentPage }}/{{ totalPages }}
              </span>
              <button
                @click="goToPage(currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-100/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
              <button
                @click="goToPage(totalPages)"
                :disabled="currentPage === totalPages"
                class="px-1.5 sm:px-2 py-1 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-100/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hidden sm:block"
                title="Last page"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Not Found -->
      <div v-else class="text-center py-12 sm:py-20">
        <div class="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg class="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-base sm:text-lg font-semibold text-gray-900 mb-2">Platform not found</h3>
        <p class="text-xs sm:text-sm text-gray-500 mb-4">The platform you're looking for doesn't exist</p>
        <NuxtLink to="/dashboard/platforms" class="text-brand hover:text-brand/80 text-xs sm:text-sm font-medium">
          ← Back to Platforms
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const route = useRoute()
const supabase = useSupabaseClient()
const { activeProductId } = useActiveProduct()
const { selectedRegion } = useRegionFilter()
const { platforms: allPlatforms, loadPlatforms } = useAIPlatforms()
const { dateRange, version: dateRangeVersion } = useDateRange()

const platformId = route.params.id as string

const loading = ref(true)
const loadingResults = ref(false)
const loadingCitations = ref(false)
const platform = ref<any>(null)
const chartMetric = ref<'mention_rate' | 'position' | 'citation_rate'>('mention_rate')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 25
const totalResults = ref(0)
const scanResults = ref<any[]>([])
const brandUrlStats = ref<{ url: string; count: number }[]>([])
const showAllCitedPages = ref(false)

const trendChartCanvas = ref<HTMLCanvasElement | null>(null)
let trendChart: Chart | null = null

const metrics = ref({
  mentionRate: 0,
  totalTests: 0,
  mentions: 0,
  avgPosition: null as number | null,
  citationRate: 0,
  citations: 0
})

const maxBrandUrlCount = computed(() => {
  if (brandUrlStats.value.length === 0) return 1
  return brandUrlStats.value[0].count
})

const totalPages = computed(() => Math.max(1, Math.ceil(totalResults.value / pageSize)))

const getDateFilter = () => {
  const startDate = dateRange.value.startDate
  const endDate = dateRange.value.endDate
  return {
    start: startDate ? startDate.toISOString() : null,
    end: endDate ? endDate.toISOString() : null
  }
}

const loadPlatform = async () => {
  loading.value = true
  try {
    await loadPlatforms()

    // Find platform by ID
    platform.value = allPlatforms.value.find(p => p.id === platformId) || null

    if (platform.value && activeProductId.value) {
      await Promise.all([
        loadMetrics(),
        loadScanResults(),
        loadBrandCitations(),
        loadChartData()
      ])
    }
  } catch (error) {
    console.error('Error loading platform:', error)
  } finally {
    loading.value = false
  }
}

const loadMetrics = async () => {
  if (!activeProductId.value || !platform.value) return

  try {
    const dateFilter = getDateFilter()

    let query = supabase
      .from('prompt_results')
      .select('brand_mentioned, position, citation_present')
      .eq('product_id', activeProductId.value)
      .eq('ai_model', platformId)

    if (dateFilter.start) {
      query = query.gte('tested_at', dateFilter.start)
    }
    if (dateFilter.end) {
      query = query.lte('tested_at', dateFilter.end)
    }

    if (selectedRegion.value) {
      query = query.ilike('request_country', selectedRegion.value)
    }

    const { data: results } = await query

    if (results && results.length > 0) {
      const mentions = results.filter(r => r.brand_mentioned).length
      const citations = results.filter(r => r.citation_present).length
      const positions = results.filter(r => r.position).map(r => r.position)

      metrics.value = {
        totalTests: results.length,
        mentions,
        mentionRate: Math.round((mentions / results.length) * 100),
        citations,
        citationRate: Math.round((citations / results.length) * 100),
        avgPosition: positions.length > 0
          ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
          : null
      }
    } else {
      metrics.value = {
        totalTests: 0,
        mentions: 0,
        mentionRate: 0,
        citations: 0,
        citationRate: 0,
        avgPosition: null
      }
    }
  } catch (error) {
    console.error('Error loading metrics:', error)
  }
}

const loadScanResults = async () => {
  if (!activeProductId.value || !platform.value) return

  loadingResults.value = true
  try {
    const dateFilter = getDateFilter()
    const offset = (currentPage.value - 1) * pageSize

    // Get total count
    let countQuery = supabase
      .from('prompt_results')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', activeProductId.value)
      .eq('ai_model', platformId)

    if (dateFilter.start) {
      countQuery = countQuery.gte('tested_at', dateFilter.start)
    }
    if (dateFilter.end) {
      countQuery = countQuery.lte('tested_at', dateFilter.end)
    }

    if (selectedRegion.value) {
      countQuery = countQuery.ilike('request_country', selectedRegion.value)
    }

    if (searchQuery.value) {
      // We'll filter by prompt text via join
    }

    const { count } = await countQuery
    totalResults.value = count || 0

    // Get paginated results with prompt text
    let query = supabase
      .from('prompt_results')
      .select(`
        id,
        brand_mentioned,
        position,
        citation_present,
        chat_url,
        tested_at,
        prompts(prompt_text)
      `)
      .eq('product_id', activeProductId.value)
      .eq('ai_model', platformId)
      .order('tested_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (dateFilter.start) {
      query = query.gte('tested_at', dateFilter.start)
    }
    if (dateFilter.end) {
      query = query.lte('tested_at', dateFilter.end)
    }

    if (selectedRegion.value) {
      query = query.ilike('request_country', selectedRegion.value)
    }

    const { data } = await query

    scanResults.value = (data || []).map(r => ({
      ...r,
      prompt_text: (r.prompts as any)?.prompt_text || 'Unknown prompt'
    }))
  } catch (error) {
    console.error('Error loading scan results:', error)
  } finally {
    loadingResults.value = false
  }
}

const loadBrandCitations = async () => {
  if (!activeProductId.value || !platform.value) return

  loadingCitations.value = true
  try {
    const dateFilter = getDateFilter()

    // Get filtered result IDs for this platform
    let resultIdsQuery = supabase
      .from('prompt_results')
      .select('id')
      .eq('product_id', activeProductId.value)
      .eq('ai_model', platformId)

    if (dateFilter.start) {
      resultIdsQuery = resultIdsQuery.gte('tested_at', dateFilter.start)
    }
    if (dateFilter.end) {
      resultIdsQuery = resultIdsQuery.lte('tested_at', dateFilter.end)
    }

    if (selectedRegion.value) {
      resultIdsQuery = resultIdsQuery.ilike('request_country', selectedRegion.value)
    }

    const { data: resultIds } = await resultIdsQuery

    if (!resultIds || resultIds.length === 0) {
      brandUrlStats.value = []
      loadingCitations.value = false
      return
    }

    const ids = resultIds.map(r => r.id)

    // Load brand citations for these results in batches
    let allCitations: { url: string }[] = []
    const batchSize = 100

    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)
      const { data: citations } = await supabase
        .from('prompt_citations')
        .select('url')
        .eq('product_id', activeProductId.value)
        .eq('is_brand_source', true)
        .in('prompt_result_id', batch)

      if (citations) {
        allCitations = allCitations.concat(citations)
      }
    }

    // Aggregate by URL
    const urlCounts: Record<string, number> = {}
    for (const c of allCitations) {
      if (c.url) {
        urlCounts[c.url] = (urlCounts[c.url] || 0) + 1
      }
    }

    brandUrlStats.value = Object.entries(urlCounts)
      .map(([url, count]) => ({ url, count }))
      .sort((a, b) => b.count - a.count)
  } catch (error) {
    console.error('Error loading brand citations:', error)
    brandUrlStats.value = []
  } finally {
    loadingCitations.value = false
  }
}

const loadChartData = async () => {
  if (!activeProductId.value || !platform.value || !trendChartCanvas.value) return

  try {
    const dateFilter = getDateFilter()

    let query = supabase
      .from('prompt_results')
      .select('tested_at, brand_mentioned, position, citation_present')
      .eq('product_id', activeProductId.value)
      .eq('ai_model', platformId)
      .order('tested_at', { ascending: true })

    if (dateFilter.start) {
      query = query.gte('tested_at', dateFilter.start)
    }
    if (dateFilter.end) {
      query = query.lte('tested_at', dateFilter.end)
    }

    if (selectedRegion.value) {
      query = query.ilike('request_country', selectedRegion.value)
    }

    const { data: results } = await query

    if (!results || results.length === 0) {
      renderEmptyChart()
      return
    }

    // Group by day
    const dailyData = new Map<string, { mentions: number; total: number; positions: number[]; citations: number }>()

    for (const r of results) {
      const day = new Date(r.tested_at).toISOString().split('T')[0]
      if (!dailyData.has(day)) {
        dailyData.set(day, { mentions: 0, total: 0, positions: [], citations: 0 })
      }
      const d = dailyData.get(day)!
      d.total++
      if (r.brand_mentioned) d.mentions++
      if (r.position) d.positions.push(r.position)
      if (r.citation_present) d.citations++
    }

    const labels = Array.from(dailyData.keys()).map(d => {
      const date = new Date(d)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })

    let data: number[]
    let label: string
    let yMax: number
    let isReversed = false

    if (chartMetric.value === 'mention_rate') {
      data = Array.from(dailyData.values()).map(d => Math.round((d.mentions / d.total) * 100))
      label = 'Mention Rate %'
      yMax = 100
    } else if (chartMetric.value === 'position') {
      data = Array.from(dailyData.values()).map(d =>
        d.positions.length > 0 ? Math.round((d.positions.reduce((a, b) => a + b, 0) / d.positions.length) * 10) / 10 : 0
      )
      label = 'Avg Position'
      yMax = Math.max(10, ...data)
      isReversed = true
    } else {
      data = Array.from(dailyData.values()).map(d => Math.round((d.citations / d.total) * 100))
      label = 'Citation Rate %'
      yMax = 100
    }

    renderChart(labels, data, label, yMax, isReversed)
  } catch (error) {
    console.error('Error loading chart data:', error)
  }
}

const renderChart = (labels?: string[], data?: number[], label?: string, yMax?: number, isReversed?: boolean) => {
  if (!trendChartCanvas.value) return

  if (trendChart) {
    trendChart.destroy()
  }

  // If called without params, reload data
  if (!labels) {
    loadChartData()
    return
  }

  const ctx = trendChartCanvas.value.getContext('2d')
  if (!ctx) return

  const gradient = ctx.createLinearGradient(0, 0, 0, 200)
  gradient.addColorStop(0, 'rgba(242, 153, 1, 0.15)')
  gradient.addColorStop(1, 'rgba(242, 153, 1, 0)')

  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data,
        borderColor: '#F29901',
        backgroundColor: gradient,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointBackgroundColor: '#F29901',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
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
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          titleFont: { size: 11, weight: '600' },
          bodyFont: { size: 11 },
          padding: { x: 12, y: 10 },
          cornerRadius: 8,
          callbacks: {
            label: (context) => {
              const value = context.parsed.y
              if (chartMetric.value === 'position') return ` Position: #${value}`
              return ` ${label}: ${value}%`
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            font: { size: 10 },
            color: '#9CA3AF',
            maxTicksLimit: 6
          }
        },
        y: {
          min: isReversed ? 1 : 0,
          max: yMax,
          reverse: isReversed,
          grid: {
            color: 'rgba(0, 0, 0, 0.04)',
            drawTicks: false
          },
          border: { display: false },
          ticks: {
            font: { size: 10 },
            color: '#9CA3AF',
            callback: (v) => chartMetric.value === 'position' ? `#${v}` : `${v}%`
          }
        }
      },
      animation: {
        duration: 600,
        easing: 'easeOutQuart'
      }
    }
  })
}

const renderEmptyChart = () => {
  if (!trendChartCanvas.value) return

  if (trendChart) {
    trendChart.destroy()
  }

  const ctx = trendChartCanvas.value.getContext('2d')
  if (!ctx) return

  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['No data'],
      datasets: [{
        data: [0],
        borderColor: '#e5e7eb',
        backgroundColor: 'transparent'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      }
    }
  })
}

const goToPage = async (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  await loadScanResults()
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatUrlPath = (url: string) => {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname + parsed.search
    return path.length > 50 ? path.substring(0, 50) + '...' : path || '/'
  } catch {
    return url.length > 50 ? url.substring(0, 50) + '...' : url
  }
}

// Watch for changes
watch(activeProductId, async () => {
  if (activeProductId.value && platform.value) {
    currentPage.value = 1
    await Promise.all([
      loadMetrics(),
      loadScanResults(),
      loadBrandCitations(),
      loadChartData()
    ])
  }
})

watch(selectedRegion, async () => {
  if (activeProductId.value && platform.value) {
    currentPage.value = 1
    await Promise.all([
      loadMetrics(),
      loadScanResults(),
      loadBrandCitations(),
      loadChartData()
    ])
  }
})

watch(dateRangeVersion, async () => {
  if (activeProductId.value && platform.value) {
    currentPage.value = 1
    await Promise.all([
      loadMetrics(),
      loadScanResults(),
      loadBrandCitations(),
      loadChartData()
    ])
  }
})

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    currentPage.value = 1
    await loadScanResults()
  }, 300)
})

onMounted(async () => {
  await loadPlatform()

  // Render chart after mount
  nextTick(() => {
    if (platform.value) {
      loadChartData()
    }
  })
})

onUnmounted(() => {
  if (trendChart) {
    trendChart.destroy()
  }
})
</script>
