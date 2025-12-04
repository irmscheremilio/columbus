<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
    <div class="p-4 lg:p-6 space-y-5">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-gray-900 tracking-tight">Competitors</h1>
          <p class="text-sm text-gray-500">Track visibility vs competitors</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            class="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand/90 transition-colors shadow-sm"
            @click="showAddModal = true"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Competitor
          </button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 px-4 py-3">
          <div class="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Tracking</div>
          <div class="text-xl font-bold text-gray-900">{{ trackingCompetitors.length }}</div>
        </div>
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 px-4 py-3">
          <div class="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Your Mention Rate</div>
          <div class="text-xl font-bold text-brand">{{ brandMentionRate }}%</div>
        </div>
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 px-4 py-3">
          <div class="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Avg Competitor Rate</div>
          <div class="text-xl font-bold text-gray-900">{{ avgCompetitorRate }}%</div>
        </div>
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 px-4 py-3">
          <div class="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Your Rank</div>
          <div class="text-xl font-bold" :class="yourRank === 1 ? 'text-emerald-600' : yourRank <= 3 ? 'text-brand' : 'text-gray-900'">
            {{ yourRank ? `#${yourRank}` : '-' }}
          </div>
        </div>
      </div>

      <!-- Visibility Bar Chart - Brand vs Competitors -->
      <div v-if="trackingCompetitors.length > 0" class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100/80 bg-gradient-to-r from-gray-50/80 to-transparent">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-1 h-4 bg-brand rounded-full"></div>
              <h2 class="text-sm font-semibold text-gray-900">Visibility Comparison</h2>
            </div>
            <div class="flex items-center gap-3 text-[10px]">
              <div class="flex items-center gap-1.5">
                <div class="w-2 h-2 rounded-sm bg-brand"></div>
                <span class="text-gray-500 font-medium">Your Brand</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-2 h-2 rounded-sm bg-gray-300"></div>
                <span class="text-gray-500 font-medium">Competitors</span>
              </div>
            </div>
          </div>
          <p class="text-[11px] text-gray-400 mt-1 ml-3">AI mention rate comparison · Last 30 days</p>
        </div>
        <div class="p-4">
          <div class="h-72">
            <canvas ref="visibilityBarChartCanvas"></canvas>
          </div>
        </div>
      </div>

      <!-- Trend Chart -->
      <div v-if="trackingCompetitors.length > 0" class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100/80 bg-gradient-to-r from-gray-50/80 to-transparent">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-1 h-4 bg-emerald-500 rounded-full"></div>
              <h2 class="text-sm font-semibold text-gray-900">Performance Over Time</h2>
            </div>
            <div class="flex items-center gap-2">
              <select
                v-model="chartMetric"
                class="text-[11px] bg-gray-100/80 border-0 rounded-md pl-2.5 pr-6 py-1.5 text-gray-600 font-medium cursor-pointer focus:ring-1 focus:ring-brand/30 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20fill%3d%22none%22%20viewBox%3d%220%200%2024%2024%22%20stroke%3d%22%239ca3af%22%20stroke-width%3d%222%22%3e%3cpath%20stroke-linecap%3d%22round%22%20stroke-linejoin%3d%22round%22%20d%3d%22M19%209l-7%207-7-7%22%2f%3e%3c%2fsvg%3e')] bg-[length:14px_14px] bg-[right_6px_center] bg-no-repeat"
              >
                <option value="mention_rate">Mention Rate</option>
                <option value="position">Avg Position</option>
                <option value="citation_rate">Citation Rate</option>
              </select>
              <div class="flex items-center bg-gray-100/80 rounded-md p-0.5">
                <button
                  v-for="period in periods"
                  :key="period.value"
                  @click="chartPeriod = period.value"
                  class="px-2 py-1 text-[11px] font-medium rounded transition-all duration-200"
                  :class="chartPeriod === period.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
                >
                  {{ period.label }}
                </button>
              </div>
            </div>
          </div>
          <p class="text-[11px] text-gray-400 mt-1 ml-3">Track visibility trends · {{ chartMetricLabel }}</p>
        </div>
        <div class="p-4">
          <div class="relative h-72">
            <div v-if="chartLoading" class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10 rounded-lg">
              <div class="flex flex-col items-center gap-2">
                <div class="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent"></div>
                <span class="text-[11px] text-gray-400">Loading data...</span>
              </div>
            </div>
            <canvas ref="comparisonChartCanvas"></canvas>
          </div>
          <!-- Legend -->
          <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 pt-3 border-t border-gray-100/80">
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-[3px] rounded-full bg-brand"></div>
              <span class="text-[11px] text-gray-700 font-medium">Your Brand</span>
            </div>
            <div v-for="(competitor, idx) in chartCompetitors" :key="competitor.id" class="flex items-center gap-1.5">
              <div class="w-3 h-[2px] rounded-full opacity-70" :style="{ backgroundColor: competitorColors[idx % competitorColors.length] }"></div>
              <span class="text-[11px] text-gray-500">{{ competitor.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tracking Competitors Table -->
      <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100/80 bg-gradient-to-r from-gray-50/50 to-transparent">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold text-gray-900">Tracked Competitors</h2>
            <span class="text-xs text-gray-500 bg-gray-100/80 px-2 py-0.5 rounded-full">
              {{ trackingCompetitors.length }} competitors
            </span>
          </div>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent"></div>
        </div>
        <div v-else-if="!trackingCompetitors.length" class="text-center py-12">
          <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p class="text-sm text-gray-500 mb-2">No competitors tracked yet</p>
          <p class="text-xs text-gray-400 mb-4">Add competitors manually or approve detected ones</p>
          <button
            class="inline-flex items-center gap-2 px-3 py-1.5 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand/90 transition-colors"
            @click="showAddModal = true"
          >
            Add Competitor
          </button>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-[11px] text-gray-500 uppercase tracking-wide border-b border-gray-100/80 bg-gray-50/30">
                <th
                  class="text-left px-4 py-2.5 font-medium cursor-pointer hover:text-gray-700 transition-colors select-none"
                  @click="toggleSort('name')"
                >
                  Brand {{ getSortIcon('name') }}
                </th>
                <th
                  class="text-center px-4 py-2.5 font-medium cursor-pointer hover:text-gray-700 transition-colors select-none"
                  @click="toggleSort('mention_rate')"
                >
                  Mention Rate {{ getSortIcon('mention_rate') }}
                </th>
                <th
                  class="text-center px-4 py-2.5 font-medium hidden sm:table-cell cursor-pointer hover:text-gray-700 transition-colors select-none"
                  @click="toggleSort('avg_position')"
                >
                  Avg Position {{ getSortIcon('avg_position') }}
                </th>
                <th
                  class="text-center px-4 py-2.5 font-medium hidden md:table-cell cursor-pointer hover:text-gray-700 transition-colors select-none"
                  @click="toggleSort('citation_rate')"
                  title="Brand website was cited"
                >
                  Brand Cited {{ getSortIcon('citation_rate') }}
                </th>
                <th
                  class="text-center px-4 py-2.5 font-medium hidden lg:table-cell cursor-pointer hover:text-gray-700 transition-colors select-none"
                  @click="toggleSort('detection_count')"
                >
                  Detections {{ getSortIcon('detection_count') }}
                </th>
                <th class="text-right px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100/80">
              <tr
                v-for="competitor in trackingCompetitors"
                :key="competitor.id"
                class="text-sm transition-colors"
                :class="competitor.is_own_brand ? 'bg-brand/5 hover:bg-brand/10' : 'hover:bg-gray-50/50 cursor-pointer'"
                @click="!competitor.is_own_brand && $router.push(`/dashboard/competitors/${competitor.id}`)"
              >
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                      :class="competitor.is_own_brand ? 'bg-brand/20' : 'bg-gray-100'"
                    >
                      <img
                        v-if="competitor.icon_url || competitor.domain"
                        :src="competitor.icon_url || getFaviconUrl(competitor.domain, 32)"
                        :alt="competitor.name"
                        class="w-5 h-5"
                        @error="($event.target as HTMLImageElement).style.display = 'none'"
                      />
                      <span v-else class="text-xs font-medium" :class="competitor.is_own_brand ? 'text-brand' : 'text-gray-400'">{{ competitor.name.charAt(0).toUpperCase() }}</span>
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <div class="font-medium" :class="competitor.is_own_brand ? 'text-brand' : 'text-gray-900'">{{ competitor.name }}</div>
                        <span v-if="competitor.is_own_brand" class="text-[10px] text-brand bg-brand/10 px-1.5 py-0.5 rounded font-medium">
                          You
                        </span>
                        <span v-else-if="competitor.is_auto_detected" class="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          auto
                        </span>
                      </div>
                      <div v-if="competitor.domain" class="text-xs text-gray-400">{{ competitor.domain }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-center">
                  <div class="flex items-center justify-center gap-1">
                    <span class="font-medium" :class="competitor.is_own_brand ? 'text-brand' : getMentionColor(competitor.mention_rate)">
                      {{ competitor.mention_rate !== null ? `${competitor.mention_rate}%` : '-' }}
                    </span>
                    <span v-if="!competitor.is_own_brand && competitor.mention_rate !== null && brandMentionRate !== null" class="text-[10px]" :class="competitor.mention_rate < brandMentionRate ? 'text-emerald-500' : competitor.mention_rate > brandMentionRate ? 'text-red-500' : 'text-gray-400'">
                      {{ competitor.mention_rate < brandMentionRate ? '↓' : competitor.mention_rate > brandMentionRate ? '↑' : '=' }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3 text-center hidden sm:table-cell">
                  <span class="font-medium" :class="competitor.is_own_brand ? 'text-brand' : 'text-gray-700'">
                    {{ competitor.avg_position ? `#${competitor.avg_position.toFixed(1)}` : '-' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center hidden md:table-cell">
                  <span class="font-medium" :class="competitor.is_own_brand ? 'text-brand' : 'text-gray-700'">
                    {{ competitor.citation_rate !== null ? `${competitor.citation_rate}%` : '-' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center hidden lg:table-cell">
                  <span v-if="!competitor.is_own_brand" class="text-gray-500 text-xs">{{ competitor.detection_count || 0 }}</span>
                  <span v-else class="text-gray-400 text-xs">-</span>
                </td>
                <td class="px-4 py-3 text-right">
                  <div v-if="!competitor.is_own_brand" class="flex items-center justify-end gap-1">
                    <button
                      @click.stop="openEditModal(competitor)"
                      class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit competitor"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      @click.stop="removeCompetitor(competitor)"
                      class="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Stop tracking"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Proposed Competitors Section (Moved to Bottom) -->
      <div v-if="proposedCompetitors.length > 0" class="bg-amber-50/80 backdrop-blur-sm rounded-xl shadow-sm border border-amber-100/50 overflow-hidden">
        <div class="px-4 py-3 border-b border-amber-100/80 bg-gradient-to-r from-amber-100/50 to-transparent">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h2 class="text-sm font-semibold text-amber-800">Detected Competitors</h2>
            <span class="text-xs text-amber-600 bg-amber-100/80 px-2 py-0.5 rounded-full">{{ proposedCompetitors.length }} new</span>
          </div>
          <p class="text-xs text-amber-700 mt-1">AI detected these competitors in responses. Review and start tracking.</p>
        </div>
        <div class="divide-y divide-amber-100/80">
          <div
            v-for="competitor in proposedCompetitors"
            :key="competitor.id"
            class="px-4 py-3 flex items-center justify-between gap-4"
          >
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  v-if="competitor.icon_url || competitor.domain"
                  :src="competitor.icon_url || getFaviconUrl(competitor.domain, 32)"
                  :alt="competitor.name"
                  class="w-5 h-5"
                  @error="($event.target as HTMLImageElement).style.display = 'none'"
                />
                <span v-else class="text-xs font-medium text-amber-600">{{ competitor.name.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-900">{{ competitor.name }}</span>
                  <span v-if="competitor.detection_count > 1" class="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                    {{ competitor.detection_count }}x detected
                  </span>
                </div>
                <p v-if="competitor.detection_context" class="text-xs text-gray-500 truncate mt-0.5" :title="competitor.detection_context">
                  "{{ competitor.detection_context }}"
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                @click="approveCompetitor(competitor)"
                class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Track
              </button>
              <button
                @click="denyCompetitor(competitor)"
                class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Competitor Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="showAddModal = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-sm w-full">
        <h3 class="text-lg font-semibold mb-4">Add Competitor</h3>
        <form @submit.prevent="addCompetitor" class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input
              v-model="newCompetitor.name"
              type="text"
              required
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
              placeholder="Competitor Inc."
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Website (Optional)</label>
            <input
              v-model="newCompetitor.domain"
              type="url"
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
              placeholder="https://competitor.com"
            />
          </div>
          <div class="flex gap-2 pt-2">
            <button
              type="button"
              @click="showAddModal = false"
              class="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 px-3 py-2 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand/90 transition-colors disabled:opacity-50"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Adding...' : 'Add' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Competitor Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="showEditModal = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-sm w-full">
        <h3 class="text-lg font-semibold mb-4">Edit Competitor</h3>
        <form @submit.prevent="updateCompetitor" class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input
              v-model="editForm.name"
              type="text"
              required
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
              placeholder="Competitor Inc."
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Website (Optional)</label>
            <input
              v-model="editForm.domain"
              type="text"
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
              placeholder="competitor.com"
            />
          </div>
          <div class="flex gap-2 pt-2">
            <button
              type="button"
              @click="showEditModal = false; editingCompetitor = null"
              class="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 px-3 py-2 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand/90 transition-colors disabled:opacity-50"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
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

const supabase = useSupabaseClient()
const { activeProductId, initialized: productInitialized } = useActiveProduct()
const { selectedRegion } = useRegionFilter()

const loading = ref(true)
const chartLoading = ref(false)
const allCompetitors = ref<any[]>([])
const showAddModal = ref(false)
const showEditModal = ref(false)
const isSubmitting = ref(false)
const newCompetitor = ref({ name: '', domain: '' })
const editingCompetitor = ref<any>(null)
const editForm = ref({ name: '', domain: '' })

// Watch for global region filter changes
watch(selectedRegion, () => {
  if (activeProductId.value) {
    loadCompetitors()
  }
})

// Sorting
const sortColumn = ref<'name' | 'mention_rate' | 'avg_position' | 'citation_rate' | 'detection_count'>('mention_rate')
const sortDirection = ref<'asc' | 'desc'>('desc')

// Chart state
const comparisonChartCanvas = ref<HTMLCanvasElement | null>(null)
const visibilityBarChartCanvas = ref<HTMLCanvasElement | null>(null)
const chartMetric = ref<'mention_rate' | 'position' | 'citation_rate'>('mention_rate')
const chartPeriod = ref('30')
let comparisonChart: Chart | null = null
let visibilityBarChart: Chart | null = null

const periods = [
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '90D' }
]

const competitorColors = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16'  // lime
]

// Brand metrics
const brandMentionRate = ref<number | null>(null)
const brandCitationRate = ref<number | null>(null)
const brandAvgPosition = ref<number | null>(null)

// Product data for own brand display
const product = ref<any>(null)

// Competitor metrics map
const competitorMetrics = ref<Map<string, { mention_rate: number | null; citation_rate: number | null; avg_position: number | null }>>(new Map())

// Split competitors by status
const trackingCompetitorsRaw = computed(() =>
  allCompetitors.value
    .filter(c => c.status === 'tracking')
    .map(c => {
      const metrics = competitorMetrics.value.get(c.id)
      return {
        ...c,
        mention_rate: metrics?.mention_rate ?? null,
        citation_rate: metrics?.citation_rate ?? null,
        avg_position: metrics?.avg_position ?? null,
        is_own_brand: false
      }
    })
)

// Own brand entry for the table
const ownBrandEntry = computed(() => {
  if (!product.value) return null
  return {
    id: 'own-brand',
    name: product.value.name,
    domain: product.value.domain,
    icon_url: product.value.icon_url,
    mention_rate: brandMentionRate.value,
    citation_rate: brandCitationRate.value,
    avg_position: brandAvgPosition.value,
    detection_count: null,
    is_own_brand: true,
    is_auto_detected: false
  }
})

// Combined and sorted list including own brand
const trackingCompetitors = computed(() => {
  const items = [...trackingCompetitorsRaw.value]
  if (ownBrandEntry.value) {
    items.unshift(ownBrandEntry.value)
  }

  // Sort
  items.sort((a, b) => {
    // Own brand always stays at top when sorted by name ascending, otherwise sort normally
    let aVal: any = a[sortColumn.value]
    let bVal: any = b[sortColumn.value]

    // Handle nulls - push them to the end
    if (aVal === null && bVal === null) return 0
    if (aVal === null) return 1
    if (bVal === null) return -1

    // For position, lower is better so we invert the sort
    if (sortColumn.value === 'avg_position') {
      // Lower position is better, so ascending means lower first
      if (sortDirection.value === 'asc') {
        return aVal - bVal
      } else {
        return bVal - aVal
      }
    }

    // For other metrics, higher is better
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }

    if (sortDirection.value === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
    }
  })

  return items
})

const chartCompetitors = computed(() => trackingCompetitorsRaw.value.slice(0, 8))

const chartMetricLabel = computed(() => {
  switch (chartMetric.value) {
    case 'mention_rate': return 'Mention Rate %'
    case 'position': return 'Average Position'
    case 'citation_rate': return 'Citation Rate %'
    default: return ''
  }
})

const proposedCompetitors = computed(() =>
  allCompetitors.value
    .filter(c => c.status === 'proposed')
    .sort((a, b) => (b.detection_count || 0) - (a.detection_count || 0))
)

const avgCompetitorRate = computed(() => {
  const rates = trackingCompetitors.value
    .filter(c => c.mention_rate !== null)
    .map(c => c.mention_rate as number)
  return rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0
})

// Calculate rank based on mention rate
const yourRank = computed(() => {
  if (brandMentionRate.value === null) return null

  const allRates = [
    { name: 'brand', rate: brandMentionRate.value },
    ...trackingCompetitors.value
      .filter(c => c.mention_rate !== null)
      .map(c => ({ name: c.name, rate: c.mention_rate as number }))
  ]

  // Sort by rate descending (higher is better)
  allRates.sort((a, b) => b.rate - a.rate)

  const brandIndex = allRates.findIndex(r => r.name === 'brand')
  return brandIndex !== -1 ? brandIndex + 1 : null
})

watch(activeProductId, async (newProductId) => {
  if (newProductId) await loadCompetitors()
})

watch([chartMetric, chartPeriod], () => {
  loadChartData()
})

onMounted(async () => {
  if (productInitialized.value && activeProductId.value) {
    await loadCompetitors()
  } else {
    const unwatch = watch(productInitialized, async (initialized) => {
      if (initialized && activeProductId.value) {
        await loadCompetitors()
        unwatch()
      }
    })
  }
})

onUnmounted(() => {
  if (comparisonChart) {
    comparisonChart.destroy()
  }
  if (visibilityBarChart) {
    visibilityBarChart.destroy()
  }
})

const loadCompetitors = async () => {
  const productId = activeProductId.value
  if (!productId) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    // Load product data for own brand display
    const { data: productData } = await supabase
      .from('products')
      .select('id, name, domain, icon_url')
      .eq('id', productId)
      .single()

    product.value = productData

    // Load all competitors (excluding denied)
    const { data: competitors } = await supabase
      .from('competitors')
      .select('*')
      .eq('product_id', productId)
      .neq('status', 'denied')
      .order('created_at', { ascending: false })

    allCompetitors.value = competitors || []

    // Load brand metrics (last 30 days)
    await loadBrandMetrics(productId)

    // Load competitor metrics
    await loadCompetitorMetrics(productId)

    // Render visibility bar chart
    await nextTick()
    setTimeout(() => {
      renderVisibilityBarChart()
    }, 100)

    // Load trend chart data
    await loadChartData()
  } catch (error) {
    console.error('Error loading competitors:', error)
  } finally {
    loading.value = false
  }
}

const loadBrandMetrics = async (productId: string) => {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  let query = supabase
    .from('prompt_results')
    .select('brand_mentioned, citation_present, position')
    .eq('product_id', productId)
    .gte('tested_at', startDate.toISOString())

  if (selectedRegion.value) {
    query = query.ilike('request_country', selectedRegion.value)
  }

  const { data: results } = await query

  if (results && results.length > 0) {
    const mentioned = results.filter(r => r.brand_mentioned).length
    brandMentionRate.value = Math.round((mentioned / results.length) * 100)

    const cited = results.filter(r => r.citation_present).length
    brandCitationRate.value = Math.round((cited / results.length) * 100)

    const positions = results.filter(r => r.position !== null).map(r => r.position as number)
    brandAvgPosition.value = positions.length > 0
      ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
      : null
  } else {
    brandMentionRate.value = 0
    brandCitationRate.value = 0
    brandAvgPosition.value = null
  }
}

const loadCompetitorMetrics = async (productId: string) => {
  const trackingIds = allCompetitors.value
    .filter(c => c.status === 'tracking')
    .map(c => c.id)

  if (trackingIds.length === 0) {
    competitorMetrics.value = new Map()
    return
  }

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  // Load total prompt results count for the period (with region filter if applicable)
  let promptResultsQuery = supabase
    .from('prompt_results')
    .select('id')
    .eq('product_id', productId)
    .gte('tested_at', startDate.toISOString())

  if (selectedRegion.value) {
    promptResultsQuery = promptResultsQuery.ilike('request_country', selectedRegion.value)
  }

  const { data: promptResults } = await promptResultsQuery
  const totalResults = promptResults?.length || 0

  if (totalResults === 0) {
    // No results, set all metrics to null
    for (const competitorId of trackingIds) {
      const comp = competitors.value.find(c => c.id === competitorId)
      if (comp) {
        comp.mention_rate = null
        comp.avg_position = null
      }
    }
    return
  }

  // Get the prompt result IDs we care about (filtered by region if applicable)
  const promptResultIds = promptResults.map(r => r.id)

  // Load competitor mentions only for the filtered prompt results
  const { data: mentions } = await supabase
    .from('competitor_mentions')
    .select('competitor_id, prompt_result_id, position, sentiment')
    .in('competitor_id', trackingIds)
    .in('prompt_result_id', promptResultIds)

  // Load competitor citations by domain matching
  // Get all competitors with domains to check for citations
  const competitorsWithDomains = allCompetitors.value.filter(c => c.domain && trackingIds.includes(c.id))
  const competitorDomains = competitorsWithDomains.map(c => c.domain!.toLowerCase().replace('www.', ''))

  let citationsByDomain: Record<string, Set<string>> = {}

  if (competitorDomains.length > 0) {
    // Query competitor citations for all competitor domains
    const { data: citations } = await supabase
      .from('prompt_citations')
      .select('source_domain, prompt_result_id')
      .eq('is_competitor_source', true)
      .in('prompt_result_id', promptResultIds)

    // Group citations by domain
    if (citations) {
      for (const citation of citations) {
        const normalizedDomain = citation.source_domain?.toLowerCase().replace('www.', '') || ''
        if (!citationsByDomain[normalizedDomain]) {
          citationsByDomain[normalizedDomain] = new Set()
        }
        citationsByDomain[normalizedDomain].add(citation.prompt_result_id)
      }
    }
  }

  // Calculate metrics per competitor
  const metricsMap = new Map<string, { mention_rate: number | null; citation_rate: number | null; avg_position: number | null }>()

  for (const competitorId of trackingIds) {
    const competitorMentions = (mentions || []).filter(m => m.competitor_id === competitorId)
    // Count unique prompt_result_ids to get accurate mention rate (competitor may be mentioned multiple times in same response)
    const uniqueResultIds = new Set(competitorMentions.map(m => m.prompt_result_id).filter(Boolean))
    const mentionCount = uniqueResultIds.size
    const mentionRate = totalResults > 0 ? Math.round((mentionCount / totalResults) * 100) : null

    const positions = competitorMentions.filter(m => m.position !== null).map(m => m.position as number)
    const avgPosition = positions.length > 0
      ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
      : null

    // Calculate citation rate by matching competitor domain
    let citationRate: number | null = null
    const competitor = allCompetitors.value.find(c => c.id === competitorId)
    if (competitor?.domain) {
      const normalizedDomain = competitor.domain.toLowerCase().replace('www.', '')
      // Find citations that match this competitor's domain (exact or subdomain)
      const matchingCitations = Object.entries(citationsByDomain)
        .filter(([domain]) => domain === normalizedDomain || domain.endsWith('.' + normalizedDomain))
        .flatMap(([_, resultIds]) => [...resultIds])
      const uniqueCitedResults = new Set(matchingCitations).size
      citationRate = totalResults > 0 ? Math.round((uniqueCitedResults / totalResults) * 100) : null
    }

    metricsMap.set(competitorId, {
      mention_rate: mentionRate,
      citation_rate: citationRate,
      avg_position: avgPosition
    })
  }

  competitorMetrics.value = metricsMap
}

const loadChartData = async () => {
  const productId = activeProductId.value
  if (!productId || trackingCompetitors.value.length === 0) return

  chartLoading.value = true

  try {
    const daysAgo = parseInt(chartPeriod.value)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    // Load brand data by day
    let brandQuery = supabase
      .from('prompt_results')
      .select('id, tested_at, brand_mentioned, citation_present, position')
      .eq('product_id', productId)
      .gte('tested_at', startDate.toISOString())
      .order('tested_at', { ascending: true })

    if (selectedRegion.value) {
      brandQuery = brandQuery.ilike('request_country', selectedRegion.value)
    }

    const { data: brandResults } = await brandQuery

    // Get prompt result IDs for filtering competitor mentions (respects region filter)
    const promptResultIds = (brandResults || []).map(r => r.id).filter(Boolean)

    // Load competitor mentions only for the filtered prompt results
    const competitorIds = chartCompetitors.value.map(c => c.id)
    let competitorMentions: any[] = []

    if (promptResultIds.length > 0 && competitorIds.length > 0) {
      const { data } = await supabase
        .from('competitor_mentions')
        .select('competitor_id, prompt_result_id, detected_at, position')
        .in('competitor_id', competitorIds)
        .in('prompt_result_id', promptResultIds)
        .order('detected_at', { ascending: true })
      competitorMentions = data || []
    }

    // Generate labels (days)
    const labels: string[] = []
    const dayMap = new Map<string, { brandResults: any[], competitorMentions: Map<string, any[]> }>()

    for (let i = 0; i < daysAgo; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      labels.push(dateKey)
      dayMap.set(dateKey, { brandResults: [], competitorMentions: new Map() })
    }

    // Group brand results by day
    for (const result of brandResults || []) {
      const dateKey = new Date(result.tested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const day = dayMap.get(dateKey)
      if (day) {
        day.brandResults.push(result)
      }
    }

    // Group competitor mentions by day
    for (const mention of competitorMentions || []) {
      const dateKey = new Date(mention.detected_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const day = dayMap.get(dateKey)
      if (day) {
        if (!day.competitorMentions.has(mention.competitor_id)) {
          day.competitorMentions.set(mention.competitor_id, [])
        }
        day.competitorMentions.get(mention.competitor_id)!.push(mention)
      }
    }

    // Calculate metrics per day
    const brandData: (number | null)[] = []
    const competitorData = new Map<string, (number | null)[]>()

    for (const competitor of chartCompetitors.value) {
      competitorData.set(competitor.id, [])
    }

    for (const label of labels) {
      const day = dayMap.get(label)!
      const totalResults = day.brandResults.length

      if (chartMetric.value === 'mention_rate') {
        // Brand mention rate
        if (totalResults > 0) {
          const mentioned = day.brandResults.filter(r => r.brand_mentioned).length
          brandData.push(Math.round((mentioned / totalResults) * 100))
        } else {
          brandData.push(null)
        }

        // Competitor mention rates (count unique prompt_result_ids)
        for (const competitor of chartCompetitors.value) {
          const mentions = day.competitorMentions.get(competitor.id) || []
          const uniqueResultIds = new Set(mentions.map(m => m.prompt_result_id).filter(Boolean))
          const mentionCount = uniqueResultIds.size
          if (totalResults > 0) {
            competitorData.get(competitor.id)!.push(Math.round((mentionCount / totalResults) * 100))
          } else {
            competitorData.get(competitor.id)!.push(null)
          }
        }
      } else if (chartMetric.value === 'position') {
        // Brand avg position
        const positions = day.brandResults.filter(r => r.position !== null).map(r => r.position as number)
        if (positions.length > 0) {
          brandData.push(Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10)
        } else {
          brandData.push(null)
        }

        // Competitor avg positions
        for (const competitor of chartCompetitors.value) {
          const mentions = day.competitorMentions.get(competitor.id) || []
          const compPositions = mentions.filter(m => m.position !== null).map(m => m.position as number)
          if (compPositions.length > 0) {
            competitorData.get(competitor.id)!.push(Math.round((compPositions.reduce((a, b) => a + b, 0) / compPositions.length) * 10) / 10)
          } else {
            competitorData.get(competitor.id)!.push(null)
          }
        }
      } else if (chartMetric.value === 'citation_rate') {
        // Brand citation rate
        if (totalResults > 0) {
          const cited = day.brandResults.filter(r => r.citation_present).length
          brandData.push(Math.round((cited / totalResults) * 100))
        } else {
          brandData.push(null)
        }

        // Competitor citation rate (using mention as proxy since we don't track competitor citations)
        for (const competitor of chartCompetitors.value) {
          competitorData.get(competitor.id)!.push(null)
        }
      }
    }

    // Render chart
    await nextTick()
    renderComparisonChart(labels, brandData, competitorData)
  } catch (error) {
    console.error('Error loading chart data:', error)
  } finally {
    chartLoading.value = false
  }
}

const renderComparisonChart = (
  labels: string[],
  brandData: (number | null)[],
  competitorData: Map<string, (number | null)[]>
) => {
  if (!comparisonChartCanvas.value) return

  if (comparisonChart) {
    comparisonChart.destroy()
  }

  const ctx = comparisonChartCanvas.value.getContext('2d')
  if (!ctx) return

  const isPositionMetric = chartMetric.value === 'position'

  // Create gradient for brand line fill
  const brandGradient = ctx.createLinearGradient(0, 0, 0, 300)
  brandGradient.addColorStop(0, 'rgba(242, 153, 1, 0.15)')
  brandGradient.addColorStop(1, 'rgba(242, 153, 1, 0)')

  const datasets = [
    {
      label: 'Your Brand',
      data: brandData,
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
      pointHoverBorderWidth: 2,
      spanGaps: true
    },
    ...chartCompetitors.value.map((competitor, idx) => ({
      label: competitor.name,
      data: competitorData.get(competitor.id) || [],
      borderColor: competitorColors[idx % competitorColors.length] + 'AA',
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      fill: false,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointBackgroundColor: competitorColors[idx % competitorColors.length],
      pointBorderColor: '#fff',
      pointBorderWidth: 1,
      spanGaps: true,
      borderDash: [4, 4]
    }))
  ]

  let maxValue = isPositionMetric ? 10 : 100
  if (isPositionMetric) {
    const allValues = [
      ...brandData.filter(v => v !== null) as number[],
      ...Array.from(competitorData.values()).flatMap(arr => arr.filter(v => v !== null) as number[])
    ]
    if (allValues.length > 0) {
      maxValue = Math.max(10, Math.ceil(Math.max(...allValues) / 5) * 5)
    }
  }

  comparisonChart = new Chart(ctx, {
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
          enabled: true,
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          titleFont: { size: 11, weight: '600', family: 'system-ui' },
          bodyFont: { size: 11, family: 'system-ui' },
          padding: { x: 12, y: 10 },
          cornerRadius: 8,
          boxPadding: 4,
          usePointStyle: true,
          callbacks: {
            title: (items) => items[0].label,
            label: (context) => {
              const value = context.parsed.y
              if (value === null) return ` ${context.dataset.label}: No data`
              if (isPositionMetric) return ` ${context.dataset.label}: #${value}`
              return ` ${context.dataset.label}: ${value}%`
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          border: { display: false },
          ticks: {
            font: { size: 10, family: 'system-ui' },
            color: '#9CA3AF',
            maxRotation: 0,
            padding: 8
          }
        },
        y: {
          min: isPositionMetric ? 1 : 0,
          max: maxValue,
          reverse: isPositionMetric,
          grid: {
            color: 'rgba(0, 0, 0, 0.04)',
            drawTicks: false
          },
          border: { display: false },
          ticks: {
            font: { size: 10, family: 'system-ui' },
            color: '#9CA3AF',
            padding: 8,
            callback: (v) => isPositionMetric ? `#${v}` : `${v}%`
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

const renderVisibilityBarChart = () => {
  if (!visibilityBarChartCanvas.value) return

  if (visibilityBarChart) {
    visibilityBarChart.destroy()
    visibilityBarChart = null
  }

  // Build data for the chart - brand + competitors sorted by mention rate
  const chartData: Array<{ name: string; mentionRate: number; isYou: boolean; rank: number }> = []

  // Add brand
  if (brandMentionRate.value !== null) {
    chartData.push({
      name: product.value?.name || 'Your Brand',
      mentionRate: brandMentionRate.value,
      isYou: true,
      rank: 0
    })
  }

  // Add competitors with metrics
  for (const competitor of trackingCompetitorsRaw.value) {
    if (competitor.mention_rate !== null) {
      chartData.push({
        name: competitor.name,
        mentionRate: competitor.mention_rate,
        isYou: false,
        rank: 0
      })
    }
  }

  if (chartData.length === 0) return

  // Sort by mention rate descending and assign ranks
  chartData.sort((a, b) => b.mentionRate - a.mentionRate)
  chartData.forEach((d, i) => d.rank = i + 1)

  // Limit to top 10 for cleaner display
  const displayData = chartData.slice(0, 10)

  const labels = displayData.map(d => d.name)
  const data = displayData.map(d => d.mentionRate)

  // Create gradient colors for brand bar
  const ctx = visibilityBarChartCanvas.value.getContext('2d')
  if (!ctx) return

  const brandGradient = ctx.createLinearGradient(0, 0, 400, 0)
  brandGradient.addColorStop(0, '#F29901')
  brandGradient.addColorStop(1, '#FBBF24')

  const competitorGradient = ctx.createLinearGradient(0, 0, 400, 0)
  competitorGradient.addColorStop(0, '#E5E7EB')
  competitorGradient.addColorStop(1, '#F3F4F6')

  const colors = displayData.map(d => d.isYou ? brandGradient : competitorGradient)
  const borderColors = displayData.map(d => d.isYou ? '#F29901' : '#D1D5DB')

  visibilityBarChart = new Chart(visibilityBarChartCanvas.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
        barThickness: 24,
        maxBarThickness: 28
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      layout: {
        padding: { right: 50 }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          titleFont: { size: 12, weight: '600' },
          bodyFont: { size: 11 },
          padding: 10,
          cornerRadius: 6,
          displayColors: false,
          callbacks: {
            title: (items) => {
              const idx = items[0].dataIndex
              const item = displayData[idx]
              return `#${item.rank} ${item.name}`
            },
            label: (ctx) => `Mention Rate: ${ctx.parsed.x}%`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value) => `${value}%`,
            font: { size: 9, family: 'system-ui' },
            color: '#9CA3AF',
            stepSize: 25
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.04)',
            drawTicks: false
          },
          border: { display: false }
        },
        y: {
          ticks: {
            font: { size: 11, family: 'system-ui', weight: '500' },
            color: '#4B5563',
            padding: 8,
            callback: function(value, index) {
              const item = displayData[index]
              return item.isYou ? `● ${item.name}` : item.name
            }
          },
          grid: { display: false },
          border: { display: false }
        }
      },
      animation: {
        duration: 600,
        easing: 'easeOutQuart'
      }
    },
    plugins: [{
      id: 'valueLabels',
      afterDatasetsDraw(chart) {
        const ctx = chart.ctx
        chart.data.datasets.forEach((dataset, i) => {
          const meta = chart.getDatasetMeta(i)
          meta.data.forEach((bar, index) => {
            const value = dataset.data[index] as number
            const item = displayData[index]
            ctx.save()
            ctx.fillStyle = item.isYou ? '#B45309' : '#6B7280'
            ctx.font = '600 10px system-ui'
            ctx.textAlign = 'left'
            ctx.textBaseline = 'middle'
            ctx.fillText(`${value}%`, bar.x + 8, bar.y)
            ctx.restore()
          })
        })
      }
    }]
  })
}

const addCompetitor = async () => {
  const productId = activeProductId.value
  if (!productId) return

  isSubmitting.value = true
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, active_organization_id')
      .single()

    const organizationId = profile?.active_organization_id || profile?.organization_id

    const domain = newCompetitor.value.domain
      ? new URL(newCompetitor.value.domain).hostname.replace('www.', '')
      : null

    // Generate icon URL if domain is provided
    const iconUrl = domain
      ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
      : null

    await supabase.from('competitors').insert({
      organization_id: organizationId,
      product_id: productId,
      name: newCompetitor.value.name,
      domain: domain,
      icon_url: iconUrl,
      status: 'tracking',
      is_auto_detected: false
    })

    showAddModal.value = false
    newCompetitor.value = { name: '', domain: '' }
    await loadCompetitors()
  } catch (error) {
    console.error('Error adding competitor:', error)
    alert('Failed to add competitor')
  } finally {
    isSubmitting.value = false
  }
}

const approveCompetitor = async (competitor: any) => {
  try {
    await supabase
      .from('competitors')
      .update({
        status: 'tracking',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', competitor.id)

    await loadCompetitors()
  } catch (error) {
    console.error('Error approving competitor:', error)
  }
}

const denyCompetitor = async (competitor: any) => {
  try {
    await supabase
      .from('competitors')
      .update({
        status: 'denied',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', competitor.id)

    await loadCompetitors()
  } catch (error) {
    console.error('Error denying competitor:', error)
  }
}

const removeCompetitor = async (competitor: any) => {
  if (!confirm(`Stop tracking ${competitor.name}?`)) return

  try {
    await supabase
      .from('competitors')
      .delete()
      .eq('id', competitor.id)

    await loadCompetitors()
  } catch (error) {
    console.error('Error removing competitor:', error)
  }
}

const getMentionColor = (rate: number | null) => {
  if (rate === null) return 'text-gray-400'
  if (rate >= 50) return 'text-emerald-600'
  if (rate >= 25) return 'text-amber-600'
  return 'text-gray-600'
}

// Sorting
const toggleSort = (column: typeof sortColumn.value) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    // Default to desc for metrics (higher is better), asc for name
    sortDirection.value = column === 'name' ? 'asc' : 'desc'
  }
}

const getSortIcon = (column: typeof sortColumn.value) => {
  if (sortColumn.value !== column) return ''
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

// Edit competitor
const openEditModal = (competitor: any) => {
  editingCompetitor.value = competitor
  editForm.value = {
    name: competitor.name,
    domain: competitor.domain || ''
  }
  showEditModal.value = true
}

const updateCompetitor = async () => {
  if (!editingCompetitor.value) return

  isSubmitting.value = true
  try {
    const domain = editForm.value.domain
      ? editForm.value.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
      : null

    // Generate icon URL if domain is provided
    const iconUrl = domain
      ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
      : null

    await supabase
      .from('competitors')
      .update({
        name: editForm.value.name,
        domain: domain,
        icon_url: iconUrl
      })
      .eq('id', editingCompetitor.value.id)

    showEditModal.value = false
    editingCompetitor.value = null
    await loadCompetitors()
  } catch (error) {
    console.error('Error updating competitor:', error)
    alert('Failed to update competitor')
  } finally {
    isSubmitting.value = false
  }
}
</script>
