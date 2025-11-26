<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardNav />

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Page Header -->
        <div class="flex justify-between items-start mb-6">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
              <svg class="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Fix Recommendations</h1>
              <p class="text-gray-500">Platform-specific guides to improve your AEO visibility</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              @click="refreshRecommendations"
              :disabled="loading"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              class="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50"
              @click="runWebsiteAnalysis"
              :disabled="analyzing"
            >
              <svg v-if="!analyzing" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <div v-else class="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              {{ analyzing ? 'Analyzing...' : 'Run New Analysis' }}
            </button>
          </div>
        </div>

        <!-- Summary Stats -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="text-2xl font-bold text-gray-900">{{ pendingCount }}</div>
            <div class="text-sm text-gray-500">Pending</div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="text-2xl font-bold text-gray-900">{{ inProgressCount }}</div>
            <div class="text-sm text-gray-500">In Progress</div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="text-2xl font-bold text-gray-900">{{ completedCount }}</div>
            <div class="text-sm text-gray-500">Completed</div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="text-2xl font-bold text-gray-900">{{ highImpactCount }}</div>
            <div class="text-sm text-gray-500">High Impact</div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <div class="text-2xl font-bold text-gray-900">{{ uniquePages.length }}</div>
            <div class="text-sm text-gray-500">Pages Analyzed</div>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div class="flex flex-wrap items-end gap-3">
            <!-- Status Filter -->
            <div class="min-w-[140px]">
              <label class="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
              <div class="relative">
                <select
                  v-model="filterStatus"
                  class="w-full pl-3 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Impact Filter -->
            <div class="min-w-[140px]">
              <label class="block text-xs font-medium text-gray-500 mb-1.5">Impact</label>
              <div class="relative">
                <select
                  v-model="filterImpact"
                  class="w-full pl-3 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <option value="all">All Impact</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Page Filter -->
            <div class="min-w-[200px]">
              <label class="block text-xs font-medium text-gray-500 mb-1.5">Page</label>
              <div class="relative">
                <select
                  v-model="filterPage"
                  class="w-full pl-3 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <option value="all">All Pages</option>
                  <option value="general">General / Homepage</option>
                  <option v-for="page in uniquePages" :key="page.url" :value="page.url">
                    {{ page.title || page.path }}
                  </option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Clear Filters Button -->
            <button
              v-if="filterStatus !== 'all' || filterImpact !== 'all' || filterPage !== 'all'"
              @click="filterStatus = 'all'; filterImpact = 'all'; filterPage = 'all'"
              class="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>

            <!-- Expand/Collapse All -->
            <div class="ml-auto flex items-center gap-2">
              <button
                @click="expandAll"
                class="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Expand All
              </button>
              <button
                @click="collapseAll"
                class="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
                Collapse All
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!filteredRecommendations.length" class="bg-white rounded-xl border border-gray-200 text-center py-12">
          <p class="text-gray-500 mb-1">
            {{ filterStatus === 'all' && filterPage === 'all' ? 'No recommendations found' : 'No recommendations match your filters' }}
          </p>
          <p class="text-sm text-gray-400">
            {{ filterStatus === 'all' && filterPage === 'all' ? 'Run a visibility scan to get personalized recommendations' : 'Try adjusting your filters' }}
          </p>
        </div>

        <!-- Grouped Recommendations by Category -->
        <div v-else class="space-y-4">
          <div
            v-for="category in categories"
            :key="category.id"
            class="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <!-- Category Header (Collapsible) -->
            <button
              @click="toggleCategory(category.id)"
              class="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center gap-4">
                <!-- Category Icon -->
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center"
                  :class="category.bgClass"
                >
                  <component :is="category.icon" class="w-5 h-5" :class="category.iconClass" />
                </div>

                <!-- Category Info -->
                <div class="text-left">
                  <h3 class="font-semibold text-gray-900">{{ category.label }}</h3>
                  <p class="text-sm text-gray-500">{{ category.description }}</p>
                </div>
              </div>

              <div class="flex items-center gap-4">
                <!-- Count Badge -->
                <span
                  class="px-3 py-1 rounded-full text-sm font-medium"
                  :class="getCategoryCount(category.id) > 0 ? 'bg-gray-100 text-gray-700' : 'bg-gray-50 text-gray-400'"
                >
                  {{ getCategoryCount(category.id) }} {{ getCategoryCount(category.id) === 1 ? 'recommendation' : 'recommendations' }}
                </span>

                <!-- Chevron -->
                <svg
                  class="w-5 h-5 text-gray-400 transition-transform duration-200"
                  :class="{ 'rotate-180': expandedCategories[category.id] }"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            <!-- Category Content (Recommendations) -->
            <div
              v-show="expandedCategories[category.id]"
              class="border-t border-gray-100"
            >
              <div v-if="getCategoryRecommendations(category.id).length === 0" class="px-6 py-8 text-center text-gray-400">
                No {{ category.label.toLowerCase() }} recommendations match your filters
              </div>
              <div v-else class="divide-y divide-gray-100">
                <div
                  v-for="rec in getCategoryRecommendations(category.id)"
                  :key="rec.id"
                  class="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  @click="$router.push(`/dashboard/recommendations/${rec.id}`)"
                >
                  <div class="flex items-start gap-4">
                    <!-- Priority Badge -->
                    <div
                      class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-white"
                      :class="getPriorityClass(rec.priority)"
                    >
                      P{{ rec.priority }}
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between gap-4">
                        <h4 class="font-medium text-gray-900">{{ rec.title }}</h4>
                        <span
                          class="flex-shrink-0 px-2 py-1 rounded text-xs font-medium"
                          :class="getStatusClass(rec.status)"
                        >
                          {{ formatStatus(rec.status) }}
                        </span>
                      </div>
                      <p class="text-sm text-gray-500 mt-1 line-clamp-2">{{ rec.description }}</p>

                      <div class="flex items-center flex-wrap gap-2 mt-3">
                        <span
                          class="px-2 py-0.5 text-xs font-medium rounded"
                          :class="rec.estimated_impact === 'high' ? 'bg-red-100 text-red-700' : rec.estimated_impact === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'"
                        >
                          {{ rec.estimated_impact }} impact
                        </span>
                        <span class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                          {{ rec.difficulty }}
                        </span>
                        <span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded">
                          {{ rec.estimated_time }}
                        </span>
                        <!-- Page indicator -->
                        <span
                          v-if="rec.page_url || rec.page_title"
                          class="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded flex items-center gap-1"
                          :title="rec.page_url || 'General'"
                        >
                          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          {{ getPageLabel(rec) }}
                        </span>
                      </div>
                    </div>

                    <!-- Arrow -->
                    <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'

definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const loading = ref(true)
const analyzing = ref(false)
const recommendations = ref<any[]>([])
const filterStatus = ref('all')
const filterImpact = ref('all')
const filterPage = ref('all')
const expandedCategories = ref<Record<string, boolean>>({
  schema: false,
  content: false,
  technical: false,
  authority: false
})

// Category definitions with icons and styling
const categories = [
  {
    id: 'schema',
    label: 'Schema & Structured Data',
    description: 'Improve how AI understands your content structure',
    bgClass: 'bg-blue-100',
    iconClass: 'text-blue-600',
    icon: {
      render() {
        return h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
          h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' })
        ])
      }
    }
  },
  {
    id: 'content',
    label: 'Content Optimization',
    description: 'Enhance content for better AI citations',
    bgClass: 'bg-green-100',
    iconClass: 'text-green-600',
    icon: {
      render() {
        return h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
          h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
        ])
      }
    }
  },
  {
    id: 'technical',
    label: 'Technical SEO',
    description: 'Fix technical issues affecting AI crawlers',
    bgClass: 'bg-orange-100',
    iconClass: 'text-orange-600',
    icon: {
      render() {
        return h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
          h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }),
          h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' })
        ])
      }
    }
  },
  {
    id: 'authority',
    label: 'Authority & Backlinks',
    description: 'Build credibility for AI platforms',
    bgClass: 'bg-purple-100',
    iconClass: 'text-purple-600',
    icon: {
      render() {
        return h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
          h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' })
        ])
      }
    }
  }
]

// Extract unique pages from recommendations
const uniquePages = computed(() => {
  const pages = new Map<string, { url: string; title: string; path: string }>()

  for (const rec of recommendations.value) {
    if (rec.page_url) {
      try {
        const url = new URL(rec.page_url)
        pages.set(rec.page_url, {
          url: rec.page_url,
          title: rec.page_title || url.pathname,
          path: url.pathname
        })
      } catch {
        pages.set(rec.page_url, {
          url: rec.page_url,
          title: rec.page_title || rec.page_url,
          path: rec.page_url
        })
      }
    }
  }

  return Array.from(pages.values()).sort((a, b) => a.path.localeCompare(b.path))
})

const filteredRecommendations = computed(() => {
  return recommendations.value.filter(rec => {
    if (filterStatus.value !== 'all' && rec.status !== filterStatus.value) return false
    if (filterImpact.value !== 'all' && rec.estimated_impact !== filterImpact.value) return false
    if (filterPage.value !== 'all') {
      if (filterPage.value === 'general') {
        if (rec.page_url) return false
      } else {
        if (rec.page_url !== filterPage.value) return false
      }
    }
    return true
  })
})

const pendingCount = computed(() => recommendations.value.filter(r => r.status === 'pending').length)
const inProgressCount = computed(() => recommendations.value.filter(r => r.status === 'in_progress').length)
const completedCount = computed(() => recommendations.value.filter(r => r.status === 'completed').length)
const highImpactCount = computed(() => recommendations.value.filter(r => r.estimated_impact === 'high').length)

const getCategoryCount = (categoryId: string) => {
  return filteredRecommendations.value.filter(r => r.category === categoryId).length
}

const getCategoryRecommendations = (categoryId: string) => {
  return filteredRecommendations.value
    .filter(r => r.category === categoryId)
    .sort((a, b) => b.priority - a.priority)
}

const toggleCategory = (categoryId: string) => {
  expandedCategories.value[categoryId] = !expandedCategories.value[categoryId]
}

const expandAll = () => {
  for (const category of categories) {
    expandedCategories.value[category.id] = true
  }
}

const collapseAll = () => {
  for (const category of categories) {
    expandedCategories.value[category.id] = false
  }
}

onMounted(async () => {
  await loadRecommendations()
})

const loadRecommendations = async () => {
  loading.value = true
  try {
    const { data: userData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.value?.id)
      .single()

    if (!userData?.organization_id) return

    const { data } = await supabase
      .from('fix_recommendations')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    recommendations.value = data || []
  } catch (error) {
    console.error('Error loading recommendations:', error)
  } finally {
    loading.value = false
  }
}

const refreshRecommendations = async () => {
  await loadRecommendations()
}

const runWebsiteAnalysis = async () => {
  analyzing.value = true
  try {
    const { data, error } = await supabase.functions.invoke('trigger-website-analysis', {
      body: { includeCompetitorGaps: true, multiPageAnalysis: true }
    })

    if (error) throw error

    alert(`Website analysis started! We'll analyze your site (including multiple pages) and generate fresh recommendations.`)

    setTimeout(async () => {
      await loadRecommendations()
    }, 180000)
  } catch (error: any) {
    console.error('Error running website analysis:', error)
    alert(`Failed to start website analysis: ${error.message || 'Unknown error'}`)
  } finally {
    analyzing.value = false
  }
}

const getPriorityClass = (priority: number) => {
  if (priority >= 5) return 'bg-red-500'
  if (priority >= 4) return 'bg-orange-500'
  if (priority >= 3) return 'bg-yellow-500'
  return 'bg-blue-500'
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-700'
    case 'in_progress': return 'bg-blue-100 text-blue-700'
    case 'dismissed': return 'bg-gray-100 text-gray-600'
    default: return 'bg-yellow-100 text-yellow-700'
  }
}

const formatStatus = (status: string) => {
  return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const getPageLabel = (rec: any) => {
  if (!rec.page_url && rec.page_title) {
    return rec.page_title
  }
  if (rec.page_url) {
    try {
      const url = new URL(rec.page_url)
      return rec.page_title || url.pathname
    } catch {
      return rec.page_title || rec.page_url
    }
  }
  return 'General'
}
</script>
