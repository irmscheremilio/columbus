<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
    <div class="p-4 lg:p-6 space-y-5">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-gray-900 tracking-tight">Scan History</h1>
          <p class="text-sm text-gray-500">View all scan sessions and their results</p>
        </div>
        <div class="flex items-center gap-3">
          <RegionFilter v-model="selectedRegion" @change="onRegionChange" />
          <NuxtLink
            to="/dashboard/visibility"
            class="inline-flex items-center gap-2 px-4 py-2 text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Visibility
          </NuxtLink>
        </div>
      </div>

      <!-- Scan Sessions List -->
      <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100/80 bg-gradient-to-r from-gray-50/50 to-transparent">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold text-gray-900">Recent Scans</h2>
            <span class="text-xs text-gray-500 bg-gray-100/80 px-2 py-0.5 rounded-full">
              {{ totalScans }} total
            </span>
          </div>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent"></div>
        </div>

        <div v-else-if="!scanSessions.length" class="text-center py-12 text-sm text-gray-500">
          <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          No scan sessions yet. Run a visibility scan to see history here.
        </div>

        <div v-else>
          <!-- Session Cards -->
          <div class="divide-y divide-gray-100/80">
            <div
              v-for="session in scanSessions"
              :key="session.scan_session_id"
              class="p-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
              @click="toggleSession(session.scan_session_id)"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      Scan {{ formatDate(session.started_at) }}
                    </div>
                    <div class="text-xs text-gray-500 flex items-center gap-2">
                      <span>{{ session.total_prompts }} prompts across {{ session.platforms?.length || 1 }} platform(s)</span>
                      <!-- Region indicators -->
                      <span v-if="session.regions?.length > 0" class="flex items-center gap-1">
                        <span class="text-gray-300">•</span>
                        <span
                          v-for="region in session.regions"
                          :key="region"
                          :title="getCountryName(region)"
                          class="text-sm"
                        >{{ getCountryFlag(region) }}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <div class="hidden sm:flex items-center gap-3">
                    <div class="text-center" title="Brand mentioned in response">
                      <div class="text-xs font-medium text-emerald-600">{{ session.mention_rate }}%</div>
                      <div class="text-[10px] text-gray-400">Mentioned</div>
                    </div>
                    <div class="text-center" title="Brand website was cited">
                      <div class="text-xs font-medium text-brand">{{ session.citation_rate }}%</div>
                      <div class="text-[10px] text-gray-400">Brand Cited</div>
                    </div>
                  </div>
                  <svg
                    class="w-5 h-5 text-gray-400 transition-transform duration-200"
                    :class="{ 'rotate-180': expandedSession === session.scan_session_id }"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <!-- Expanded Session Results -->
              <div
                v-if="expandedSession === session.scan_session_id"
                class="mt-4 pt-4 border-t border-gray-100"
                @click.stop
              >
                <div v-if="loadingResults" class="flex items-center justify-center py-6">
                  <div class="animate-spin rounded-full h-5 w-5 border-2 border-brand border-t-transparent"></div>
                </div>
                <div v-else-if="sessionResults.length === 0" class="text-center py-6 text-sm text-gray-500">
                  No results found for this scan session.
                </div>
                <div v-else class="space-y-4">
                  <!-- Sources Donut Chart -->
                  <div v-if="sessionSources.length > 0" class="bg-gray-50/80 rounded-xl p-4">
                    <div class="flex items-center justify-between mb-3">
                      <h3 class="text-xs font-semibold text-gray-700 uppercase tracking-wider">Citation Sources</h3>
                      <span class="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                        {{ totalSessionCitations }} citations
                      </span>
                    </div>
                    <div class="flex flex-col sm:flex-row items-center gap-4">
                      <!-- Donut Chart -->
                      <div class="relative w-28 h-28 flex-shrink-0">
                        <canvas :id="`sources-chart-${session.scan_session_id}`"></canvas>
                        <div class="absolute inset-0 flex flex-col items-center justify-center">
                          <span class="text-lg font-bold text-gray-900">{{ brandSourcePercent }}%</span>
                          <span class="text-[9px] text-gray-500">Your site</span>
                        </div>
                      </div>
                      <!-- Legend -->
                      <div class="flex-1 w-full">
                        <div class="grid grid-cols-2 gap-x-4 gap-y-1">
                          <div
                            v-for="(source, idx) in topSources"
                            :key="source.domain"
                            class="flex items-center justify-between text-xs py-1"
                          >
                            <div class="flex items-center gap-1.5 min-w-0">
                              <div
                                class="w-2 h-2 rounded-full flex-shrink-0"
                                :style="{ backgroundColor: getSourceColor(idx, source.isBrand) }"
                              ></div>
                              <span class="truncate" :class="source.isBrand ? 'font-medium text-emerald-600' : 'text-gray-600'">
                                {{ source.domain }}
                              </span>
                            </div>
                            <span class="text-gray-900 font-medium ml-1">{{ source.count }}</span>
                          </div>
                        </div>
                        <div v-if="sessionSources.length > 5" class="mt-1 text-[10px] text-gray-400">
                          +{{ sessionSources.length - 5 }} more sources
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="bg-gray-50/80 rounded-xl p-4 text-center">
                    <p class="text-xs text-gray-500">No citations detected in this scan</p>
                  </div>

                  <!-- Region Comparison Chart -->
                  <div v-if="session.regionStats?.length > 1" class="bg-gray-50/80 rounded-xl p-4">
                    <h3 class="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Mention Rate by Region</h3>
                    <div class="space-y-2">
                      <div
                        v-for="stat in session.regionStats"
                        :key="stat.region"
                        class="flex items-center gap-3"
                      >
                        <span class="text-lg w-6 text-center" :title="getCountryName(stat.region)">{{ getCountryFlag(stat.region) }}</span>
                        <div class="flex-1">
                          <div class="flex items-center justify-between mb-1">
                            <span class="text-xs text-gray-600">{{ getCountryName(stat.region) }}</span>
                            <span class="text-xs font-semibold text-gray-900">{{ stat.mentionRate }}%</span>
                          </div>
                          <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              class="h-full bg-gradient-to-r from-brand to-brand/80 rounded-full transition-all duration-500"
                              :style="{ width: `${stat.mentionRate}%` }"
                            ></div>
                          </div>
                        </div>
                        <span class="text-[10px] text-gray-400 w-16 text-right">{{ stat.mentioned }}/{{ stat.total }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Results Table -->
                  <div class="overflow-x-auto -mx-4">
                  <table class="w-full">
                    <thead>
                      <tr class="text-[11px] text-gray-500 uppercase tracking-wider border-b border-gray-100/80 bg-gray-50/30">
                        <th class="text-left px-4 py-2.5 font-medium w-[130px]">Platform</th>
                        <th class="text-center px-4 py-2.5 font-medium w-[70px]">Region</th>
                        <th class="text-left px-4 py-2.5 font-medium">Prompt</th>
                        <th class="text-center px-4 py-2.5 font-medium w-[75px]">Mentioned</th>
                        <th class="text-center px-4 py-2.5 font-medium w-[70px]" title="AI used sources in response">Sources</th>
                        <th class="text-center px-4 py-2.5 font-medium w-[80px]" title="Brand website was cited">Cited</th>
                        <th class="text-center px-4 py-2.5 font-medium w-[55px]">Limit</th>
                        <th class="text-center px-4 py-2.5 font-medium w-[55px]">Chat</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100/50">
                      <tr
                        v-for="result in sessionResults"
                        :key="result.id"
                        class="group text-sm hover:bg-gray-50/80 transition-colors cursor-pointer"
                        @click="openResultDetail(result)"
                      >
                        <td class="px-4 py-2.5">
                          <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded-lg bg-gray-50 group-hover:bg-gray-100 flex items-center justify-center flex-shrink-0 transition-colors">
                              <img
                                v-if="getPlatformLogo(result.ai_model)"
                                :src="getPlatformLogo(result.ai_model)"
                                :alt="formatModelName(result.ai_model)"
                                class="w-3.5 h-3.5 object-contain"
                                @error="($event.target as HTMLImageElement).style.display = 'none'"
                              />
                              <span v-else class="text-[9px] font-bold text-gray-500">{{ formatModelName(result.ai_model).charAt(0) }}</span>
                            </div>
                            <span class="text-xs font-medium text-gray-700 truncate">{{ formatModelName(result.ai_model) }}</span>
                          </div>
                        </td>
                        <td class="px-4 py-2.5 text-center">
                          <span
                            :title="getCountryName(result.request_country || 'local')"
                            class="text-base"
                          >{{ getCountryFlag(result.request_country || 'local') }}</span>
                        </td>
                        <td class="px-4 py-2.5">
                          <div class="text-gray-900 truncate max-w-xs text-sm" :title="result.prompt">
                            {{ result.prompt }}
                          </div>
                        </td>
                        <td class="px-4 py-2.5 text-center">
                          <div class="flex items-center justify-center">
                            <span
                              class="inline-flex w-5 h-5 rounded-full items-center justify-center"
                              :class="result.brand_mentioned ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'"
                            >
                              <svg v-if="result.brand_mentioned" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              <span v-else class="text-[10px]">−</span>
                            </span>
                          </div>
                        </td>
                        <td class="px-4 py-2.5 text-center">
                          <div class="flex items-center justify-center">
                            <span
                              class="inline-flex w-5 h-5 rounded-full items-center justify-center"
                              :class="result.has_sources ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'"
                              :title="result.has_sources ? `${result.source_count} source(s) used` : 'No sources'"
                            >
                              <svg v-if="result.has_sources" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              <span v-else class="text-[10px]">−</span>
                            </span>
                          </div>
                        </td>
                        <td class="px-4 py-2.5 text-center">
                          <div class="flex items-center justify-center">
                            <span
                              class="inline-flex w-5 h-5 rounded-full items-center justify-center"
                              :class="result.citation_present ? 'bg-brand/15 text-brand' : 'bg-gray-100 text-gray-400'"
                              :title="result.citation_present ? 'Brand website was cited' : 'Brand not cited'"
                            >
                              <svg v-if="result.citation_present" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              <span v-else class="text-[10px]">−</span>
                            </span>
                          </div>
                        </td>
                        <td class="px-4 py-2.5 text-center">
                          <span
                            v-if="result.credits_exhausted"
                            class="inline-flex w-5 h-5 rounded-full items-center justify-center bg-amber-100 text-amber-600"
                            title="Credit limit exceeded"
                          >
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </span>
                          <span v-else class="text-gray-300">−</span>
                        </td>
                        <td class="px-4 py-2.5 text-center">
                          <a
                            v-if="result.chat_url"
                            :href="result.chat_url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex w-5 h-5 rounded items-center justify-center bg-brand/10 text-brand hover:bg-brand/20 transition-colors"
                            title="Open chat"
                            @click.stop
                          >
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                          <span v-else class="text-gray-300">−</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="px-4 py-3 border-t border-gray-100/80 flex items-center justify-between">
            <div class="text-xs text-gray-500">
              Page {{ currentPage }} of {{ totalPages }}
            </div>
            <div class="flex items-center gap-2">
              <button
                :disabled="currentPage <= 1"
                class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
                :class="currentPage <= 1 ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'"
                @click="goToPage(currentPage - 1)"
              >
                Previous
              </button>
              <button
                :disabled="currentPage >= totalPages"
                class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
                :class="currentPage >= totalPages ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'"
                @click="goToPage(currentPage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scan Result Detail Modal -->
    <Teleport to="body">
      <div
        v-if="showDetailModal && selectedResult"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="closeDetailModal"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <img
                  v-if="getPlatformLogo(selectedResult.ai_model)"
                  :src="getPlatformLogo(selectedResult.ai_model)"
                  :alt="formatModelName(selectedResult.ai_model)"
                  class="w-5 h-5 object-contain"
                />
                <span v-else class="text-sm font-bold text-gray-500">{{ formatModelName(selectedResult.ai_model).charAt(0) }}</span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-semibold text-gray-900">{{ formatModelName(selectedResult.ai_model) }}</h3>
                  <span
                    v-if="selectedResult.request_country"
                    class="text-base"
                    :title="getCountryName(selectedResult.request_country)"
                  >{{ getCountryFlag(selectedResult.request_country) }}</span>
                </div>
                <p class="text-xs text-gray-500">{{ formatDateTime(selectedResult.tested_at) }}</p>
              </div>
            </div>
            <button
              @click="closeDetailModal"
              class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- Status Indicators Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div class="flex items-center gap-3 px-4 py-3 rounded-xl border" :class="selectedResult.brand_mentioned ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="selectedResult.brand_mentioned ? 'bg-emerald-100' : 'bg-gray-200'">
                  <svg class="w-4 h-4" :class="selectedResult.brand_mentioned ? 'text-emerald-600' : 'text-gray-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path v-if="selectedResult.brand_mentioned" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <div class="text-[10px] uppercase tracking-wider" :class="selectedResult.brand_mentioned ? 'text-emerald-600' : 'text-gray-400'">Brand</div>
                  <div class="text-xs font-semibold" :class="selectedResult.brand_mentioned ? 'text-emerald-700' : 'text-gray-500'">{{ selectedResult.brand_mentioned ? 'Mentioned' : 'Not Mentioned' }}</div>
                </div>
              </div>

              <div class="flex items-center gap-3 px-4 py-3 rounded-xl border" :class="selectedResult.has_sources ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="selectedResult.has_sources ? 'bg-blue-100' : 'bg-gray-200'">
                  <svg class="w-4 h-4" :class="selectedResult.has_sources ? 'text-blue-600' : 'text-gray-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <div class="text-[10px] uppercase tracking-wider" :class="selectedResult.has_sources ? 'text-blue-600' : 'text-gray-400'">Sources</div>
                  <div class="text-xs font-semibold" :class="selectedResult.has_sources ? 'text-blue-700' : 'text-gray-500'">{{ selectedResult.has_sources ? selectedResult.source_count : 'None' }}</div>
                </div>
              </div>

              <div class="flex items-center gap-3 px-4 py-3 rounded-xl border" :class="selectedResult.citation_present ? 'bg-brand/5 border-brand/30' : 'bg-gray-50 border-gray-200'">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="selectedResult.citation_present ? 'bg-brand/15' : 'bg-gray-200'">
                  <svg class="w-4 h-4" :class="selectedResult.citation_present ? 'text-brand' : 'text-gray-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <div class="text-[10px] uppercase tracking-wider" :class="selectedResult.citation_present ? 'text-brand' : 'text-gray-400'">Brand Cited</div>
                  <div class="text-xs font-semibold" :class="selectedResult.citation_present ? 'text-brand' : 'text-gray-500'">{{ selectedResult.citation_present ? 'Yes' : 'No' }}</div>
                </div>
              </div>

              <div class="flex items-center gap-3 px-4 py-3 rounded-xl border" :class="selectedResult.position ? 'bg-violet-50 border-violet-200' : 'bg-gray-50 border-gray-200'">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="selectedResult.position ? 'bg-violet-100' : 'bg-gray-200'">
                  <span class="text-xs font-bold" :class="selectedResult.position ? 'text-violet-600' : 'text-gray-400'">#</span>
                </div>
                <div>
                  <div class="text-[10px] uppercase tracking-wider" :class="selectedResult.position ? 'text-violet-600' : 'text-gray-400'">Position</div>
                  <div class="text-xs font-semibold" :class="selectedResult.position ? 'text-violet-700' : 'text-gray-500'">{{ selectedResult.position || 'N/A' }}</div>
                </div>
              </div>
            </div>

            <!-- Additional Status Row -->
            <div class="flex flex-wrap gap-2">
              <div class="flex items-center gap-2 px-3 py-2 rounded-lg border" :class="getSentimentClass(selectedResult.sentiment)">
                <span class="w-2 h-2 rounded-full" :class="selectedResult.sentiment === 'positive' ? 'bg-emerald-500' : selectedResult.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-400'"></span>
                <span class="text-xs font-medium capitalize">{{ selectedResult.sentiment || 'neutral' }} sentiment</span>
              </div>
              <div v-if="selectedResult.credits_exhausted" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span class="text-xs font-medium">Credit Limit Exceeded</span>
              </div>
              <a
                v-if="selectedResult.chat_url"
                :href="selectedResult.chat_url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand/10 border border-brand/20 text-brand hover:bg-brand/20 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span class="text-xs font-medium">View Original Chat</span>
              </a>
            </div>

            <!-- Prompt Section -->
            <div>
              <div class="flex items-center gap-2 mb-3">
                <div class="w-1 h-4 rounded-full bg-gray-300"></div>
                <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Prompt</h3>
              </div>
              <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p class="text-sm text-gray-800 leading-relaxed">{{ selectedResult.prompt }}</p>
              </div>
            </div>

            <!-- Response Section -->
            <div>
              <div class="flex items-center gap-2 mb-3">
                <div class="w-1 h-4 rounded-full bg-brand"></div>
                <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Response</h3>
              </div>
              <div class="bg-gray-50 rounded-xl p-4 border border-gray-100 max-h-[350px] overflow-y-auto">
                <p v-if="selectedResult.response_text" class="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{{ selectedResult.response_text }}</p>
                <p v-else class="text-sm text-gray-400 italic">Response not available</p>
              </div>
            </div>

            <!-- Competitor Mentions -->
            <div v-if="selectedResult.competitor_mentions?.length">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-1 h-4 rounded-full bg-orange-400"></div>
                <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Competitor Mentions</h3>
              </div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="competitor in selectedResult.competitor_mentions"
                  :key="competitor"
                  class="px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-medium rounded-lg border border-orange-200"
                >
                  {{ competitor }}
                </span>
              </div>
            </div>

            <!-- Citations Section -->
            <div v-if="selectedResultCitations.length > 0">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-1 h-4 rounded-full bg-blue-400"></div>
                <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Citations</h3>
                <span class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{{ selectedResultCitations.length }}</span>
              </div>
              <div class="space-y-2">
                <a
                  v-for="citation in selectedResultCitations"
                  :key="citation.id"
                  :href="citation.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors group"
                  :class="citation.is_brand_source ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50' : 'bg-gray-50/50 border-gray-100 hover:bg-gray-100'"
                >
                  <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" :class="citation.is_brand_source ? 'bg-emerald-100' : 'bg-gray-200'">
                    <span class="text-xs font-bold" :class="citation.is_brand_source ? 'text-emerald-600' : 'text-gray-500'">#{{ citation.citation_position }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate" :class="citation.is_brand_source ? 'text-emerald-700' : 'text-gray-700'">
                      {{ citation.source_title || citation.source_domain }}
                    </div>
                    <div class="text-xs text-gray-400 truncate">{{ citation.source_domain }}</div>
                  </div>
                  <svg class="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-4 border-t border-gray-100 bg-gray-50/80">
            <button
              @click="closeDetailModal"
              class="w-full px-4 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import Chart from 'chart.js/auto'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const supabase = useSupabaseClient()
const { activeProductId, initialized: productInitialized } = useActiveProduct()
const { formatModelName: formatPlatformName, getPlatformLogo } = useAIPlatforms()
const { getCountryFlag, getCountryName } = useRegionFilter()

const loading = ref(true)
const loadingResults = ref(false)
const scanSessions = ref<any[]>([])
const sessionResults = ref<any[]>([])
const sessionSources = ref<{ domain: string; count: number; isBrand: boolean }[]>([])
const totalSessionCitations = ref(0)
const brandSessionCitations = ref(0)
const expandedSession = ref<string | null>(null)
const currentPage = ref(1)
const pageSize = 10
const totalScans = ref(0)
let sourcesChart: Chart | null = null

// Detail modal state
const showDetailModal = ref(false)
const selectedResult = ref<any>(null)
const selectedResultCitations = ref<any[]>([])

// Region filter
const selectedRegion = ref<string | null>(null)

const onRegionChange = (region: string | null) => {
  selectedRegion.value = region
  currentPage.value = 1
  expandedSession.value = null
  if (activeProductId.value) {
    loadScanSessions()
  }
}

const sourceColors = [
  '#10b981', // emerald (brand)
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

const getSourceColor = (index: number, isBrand: boolean) => {
  if (isBrand) return '#10b981'
  return sourceColors[(index % (sourceColors.length - 1)) + 1]
}

const brandSourcePercent = computed(() => {
  if (totalSessionCitations.value === 0) return 0
  return Math.round((brandSessionCitations.value / totalSessionCitations.value) * 100)
})

const topSources = computed(() => sessionSources.value.slice(0, 5))

const totalPages = computed(() => Math.ceil(totalScans.value / pageSize))

watch(activeProductId, async (newProductId) => {
  if (newProductId) {
    currentPage.value = 1
    await loadScanSessions()
  }
})

onMounted(async () => {
  if (productInitialized.value && activeProductId.value) {
    await loadScanSessions()
  } else {
    const unwatch = watch(productInitialized, async (initialized) => {
      if (initialized && activeProductId.value) {
        await loadScanSessions()
        unwatch()
      }
    })
  }
})

const loadScanSessions = async () => {
  const productId = activeProductId.value
  if (!productId) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    // Get count for pagination
    let countQuery = supabase
      .from('prompt_results')
      .select('scan_session_id', { count: 'exact', head: true })
      .eq('product_id', productId)
      .not('scan_session_id', 'is', null)

    if (selectedRegion.value) {
      countQuery = countQuery.ilike('request_country', selectedRegion.value)
    }

    const { count } = await countQuery

    // Get distinct scan sessions with stats
    let dataQuery = supabase
      .from('prompt_results')
      .select('scan_session_id, ai_model, brand_mentioned, citation_present, tested_at, request_country')
      .eq('product_id', productId)
      .not('scan_session_id', 'is', null)
      .order('tested_at', { ascending: false })

    if (selectedRegion.value) {
      dataQuery = dataQuery.ilike('request_country', selectedRegion.value)
    }

    const { data } = await dataQuery

    if (data) {
      // Group by scan_session_id and calculate stats
      const sessionMap = new Map<string, any>()

      for (const row of data) {
        if (!row.scan_session_id) continue

        if (!sessionMap.has(row.scan_session_id)) {
          sessionMap.set(row.scan_session_id, {
            scan_session_id: row.scan_session_id,
            started_at: row.tested_at,
            total_prompts: 0,
            mentioned_count: 0,
            cited_count: 0,
            platforms: new Set(),
            regions: new Set(),
            regionStats: new Map() // Track per-region stats
          })
        }

        const session = sessionMap.get(row.scan_session_id)
        session.total_prompts++
        if (row.brand_mentioned) session.mentioned_count++
        if (row.citation_present) session.cited_count++
        session.platforms.add(row.ai_model)

        // Track regions
        const region = row.request_country || 'local'
        session.regions.add(region)

        // Track per-region stats for comparison chart
        if (!session.regionStats.has(region)) {
          session.regionStats.set(region, { total: 0, mentioned: 0 })
        }
        const regionStat = session.regionStats.get(region)
        regionStat.total++
        if (row.brand_mentioned) regionStat.mentioned++

        if (new Date(row.tested_at) < new Date(session.started_at)) {
          session.started_at = row.tested_at
        }
      }

      // Convert to array and calculate rates
      const sessions = Array.from(sessionMap.values()).map(s => ({
        ...s,
        platforms: Array.from(s.platforms),
        regions: Array.from(s.regions),
        regionStats: Array.from(s.regionStats.entries()).map(([region, stats]) => ({
          region,
          total: stats.total,
          mentioned: stats.mentioned,
          mentionRate: stats.total > 0 ? Math.round((stats.mentioned / stats.total) * 100) : 0
        })),
        mention_rate: s.total_prompts > 0 ? Math.round((s.mentioned_count / s.total_prompts) * 100) : 0,
        citation_rate: s.total_prompts > 0 ? Math.round((s.cited_count / s.total_prompts) * 100) : 0
      }))

      // Sort by date and paginate
      sessions.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())

      totalScans.value = sessions.length
      const start = (currentPage.value - 1) * pageSize
      scanSessions.value = sessions.slice(start, start + pageSize)
    }
  } catch (error) {
    console.error('Error loading scan sessions:', error)
  } finally {
    loading.value = false
  }
}

const toggleSession = async (sessionId: string) => {
  if (expandedSession.value === sessionId) {
    expandedSession.value = null
    sessionResults.value = []
    sessionSources.value = []
    if (sourcesChart) {
      sourcesChart.destroy()
      sourcesChart = null
    }
    return
  }

  expandedSession.value = sessionId
  loadingResults.value = true

  try {
    // Load prompt results for this session
    const { data } = await supabase
      .from('prompt_results')
      .select('*, prompts(prompt_text)')
      .eq('scan_session_id', sessionId)
      .order('tested_at', { ascending: true })

    const results = data?.map(r => ({
      ...r,
      prompt: r.prompts?.prompt_text || 'Unknown prompt',
      has_sources: false,
      source_count: 0
    })) || []

    // Load citations for this session's results to determine source counts
    const resultIds = results.map(r => r.id)
    if (resultIds.length > 0) {
      const { data: citations } = await supabase
        .from('prompt_citations')
        .select('prompt_result_id, source_domain, is_brand_source')
        .in('prompt_result_id', resultIds)

      // Count sources per result
      const sourcesPerResult: Record<string, number> = {}
      for (const citation of citations || []) {
        sourcesPerResult[citation.prompt_result_id] = (sourcesPerResult[citation.prompt_result_id] || 0) + 1
      }

      // Update results with source counts
      for (const result of results) {
        const count = sourcesPerResult[result.id] || 0
        result.has_sources = count > 0
        result.source_count = count
      }

      // Aggregate by domain for the chart
      const domainCounts: Record<string, { count: number; isBrand: boolean }> = {}
      let total = 0
      let brand = 0

      for (const row of citations || []) {
        const key = row.source_domain
        if (!domainCounts[key]) {
          domainCounts[key] = { count: 0, isBrand: row.is_brand_source }
        }
        domainCounts[key].count++
        total++
        if (row.is_brand_source) brand++
      }

      sessionSources.value = Object.entries(domainCounts)
        .map(([domain, { count, isBrand }]) => ({ domain, count, isBrand }))
        .sort((a, b) => b.count - a.count)

      totalSessionCitations.value = total
      brandSessionCitations.value = brand

      // Render chart after DOM updates
      renderSourcesChart(sessionId)
    } else {
      sessionSources.value = []
      totalSessionCitations.value = 0
      brandSessionCitations.value = 0
    }

    sessionResults.value = results
  } catch (error) {
    console.error('Error loading session results:', error)
    sessionResults.value = []
    sessionSources.value = []
  } finally {
    loadingResults.value = false
  }
}

const renderSourcesChart = async (sessionId: string) => {
  // Wait for DOM to be ready
  await nextTick()

  if (sessionSources.value.length === 0) return

  // Get canvas by ID
  const canvas = document.getElementById(`sources-chart-${sessionId}`) as HTMLCanvasElement | null
  if (!canvas) {
    // Retry after a short delay if DOM not ready
    setTimeout(() => renderSourcesChart(sessionId), 50)
    return
  }

  if (sourcesChart) {
    sourcesChart.destroy()
    sourcesChart = null
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Take top 5 for chart, rest in "Other"
  const chartSources = sessionSources.value.slice(0, 5)
  const otherCount = sessionSources.value.slice(5).reduce((sum, s) => sum + s.count, 0)

  const labels = chartSources.map(s => s.domain)
  const data = chartSources.map(s => s.count)
  const backgroundColors = chartSources.map((s, i) => getSourceColor(i, s.isBrand))

  if (otherCount > 0) {
    labels.push('Other')
    data.push(otherCount)
    backgroundColors.push('#9ca3af')
  }

  sourcesChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors,
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '65%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed
              const percent = Math.round((value / totalSessionCitations.value) * 100)
              return `${context.label}: ${value} (${percent}%)`
            }
          }
        }
      }
    }
  })
}

const goToPage = async (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  expandedSession.value = null
  sessionResults.value = []
  await loadScanSessions()
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const formatModelName = (model: string) => {
  return formatPlatformName(model)
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

const openResultDetail = async (result: any) => {
  selectedResult.value = result
  showDetailModal.value = true

  // Load citations for this result
  try {
    const { data: citations } = await supabase
      .from('prompt_citations')
      .select('*')
      .eq('prompt_result_id', result.id)
      .order('position', { ascending: true })

    selectedResultCitations.value = citations || []
  } catch (error) {
    console.error('Error loading citations:', error)
    selectedResultCitations.value = []
  }
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedResult.value = null
  selectedResultCitations.value = []
}

const getSentimentClass = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return 'bg-emerald-50 border-emerald-200 text-emerald-700'
    case 'negative': return 'bg-red-50 border-red-200 text-red-700'
    default: return 'bg-gray-100 border-gray-200 text-gray-500'
  }
}

onUnmounted(() => {
  if (sourcesChart) {
    sourcesChart.destroy()
  }
})
</script>
