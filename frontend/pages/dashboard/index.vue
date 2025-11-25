<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardNav />

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- Page header -->
      <div class="px-4 py-6 sm:px-0">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
            <svg class="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p class="text-gray-500">Welcome back! Here's your AEO visibility overview.</p>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="px-4 py-4 sm:px-0">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Overall Visibility Score -->
          <div class="bg-white rounded-xl p-5 border border-gray-200">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-600">Visibility Score</span>
            </div>
            <div class="text-4xl font-bold text-gray-900 mb-1">
              {{ visibilityScore?.overall || 0 }}
            </div>
            <div class="flex items-center gap-2">
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                :class="visibilityScore?.trend === 'up' ? 'bg-green-100 text-green-700' : visibilityScore?.trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'"
              >
                <svg v-if="visibilityScore?.trend === 'up'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
                <svg v-else-if="visibilityScore?.trend === 'down'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                {{ visibilityScore?.percentChange || 0 }}%
              </span>
              <span class="text-xs text-gray-400">vs last week</span>
            </div>
          </div>

          <!-- ChatGPT Score -->
          <div class="bg-white rounded-xl p-5 border border-gray-200">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <svg class="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
                  </svg>
                </div>
                <span class="text-sm font-medium text-gray-600">ChatGPT</span>
              </div>
            </div>
            <div class="text-4xl font-bold text-gray-900 mb-1">{{ visibilityScore?.byModel?.chatgpt || 0 }}</div>
            <div class="text-sm text-gray-400">visibility score</div>
          </div>

          <!-- Claude Score -->
          <div class="bg-white rounded-xl p-5 border border-gray-200">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <svg class="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.709 15.955l4.72-2.647.08-.08v-.08l-.08-.08H9.35l-.08.08v.08l-2.249 3.363-.159.239h-.08l-2.074-.875zm8.017-.398l-.239.239 1.833 2.487.159.239.159-.08 2.249-1.514.159-.08v-.159l-.159-.159-2.806-1.037-.239-.08-.239.08-.876.044zm-.876-5.173l.318.319 3.124-1.196.318-.08v-.08l-.08-.16-1.354-2.089-.159-.239h-.159l-2.168 1.276-.159.159v.159l.319 1.912zm7.937.239h-.239l-1.514.478-.239.08-.08.239.08.16 1.355 3.124.08.159.159.08h.16l1.752-1.196.239-.08v-.16l-.398-2.487-.08-.239-.239-.08-.478-.08h-.558zm-4.561-3.363l.398-.08.16-.159v-.16l-.876-2.487-.08-.239-.239-.08h-.239l-1.752.558-.239.08-.08.239v.239l.876 1.593.16.239.238.08 1.036.159h.478l.159.08zm2.408 5.093l-.159-.239-.239-.08h-.319l-2.806 1.355-.239.16-.08.238v.319l1.275 3.045.159.239.239.08.239-.08 2.408-2.168.159-.159v-.239l-.637-2.408v-.08l.08.08-.08-.08zm-4.88 1.116l.239-.239-1.275-2.965-.16-.239-.238-.08-.239.08-3.363 1.196-.239.16-.08.238.16.239 2.487 1.912.159.159h.239l2.249-.398.08-.08.08.08-.08-.08zm-3.682-2.408l-.319-.16-.318.08-2.806 1.912-.239.159v.239l.478 2.567.08.239.239.08h.239l2.487-1.355.239-.16.08-.238-.08-.239-1.196-2.726.08.08-.08-.08.08-.16-.08-.16.08-.08h.08l-.08-.08.08.08v.08l-.08-.08.08.08-.08-.08.08.08-.08-.08.08.08-.08-.16zm2.249-4.72l-.319-.319-2.726.16-.239.079-.159.16.08.238.955 2.567.159.239h.239l.239-.08 2.249-2.249.159-.159v-.239l-.637-.398zm2.726 1.355l.319.319 2.487-.558.239-.08.08-.16-.08-.238-1.514-2.249-.16-.239-.238-.08h-.239l-1.673 1.673-.159.159v.16l.08.238.876 1.036-.08-.08.08.08z"/>
                  </svg>
                </div>
                <span class="text-sm font-medium text-gray-600">Claude</span>
              </div>
            </div>
            <div class="text-4xl font-bold text-gray-900 mb-1">{{ visibilityScore?.byModel?.claude || 0 }}</div>
            <div class="text-sm text-gray-400">visibility score</div>
          </div>

          <!-- Gemini Score -->
          <div class="bg-white rounded-xl p-5 border border-gray-200">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <svg class="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 24C5.373 24 0 18.627 0 12S5.373 0 12 0s12 5.373 12 12-5.373 12-12 12zm0-3.6c4.636 0 8.4-3.764 8.4-8.4S16.636 3.6 12 3.6 3.6 7.364 3.6 12s3.764 8.4 8.4 8.4z"/>
                  </svg>
                </div>
                <span class="text-sm font-medium text-gray-600">Gemini</span>
              </div>
            </div>
            <div class="text-4xl font-bold text-gray-900 mb-1">{{ visibilityScore?.byModel?.gemini || 0 }}</div>
            <div class="text-sm text-gray-400">visibility score</div>
          </div>
        </div>
      </div>

      <!-- Granularity Level Performance -->
      <div class="px-4 py-4 sm:px-0">
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h2 class="text-lg font-semibold text-gray-900">Visibility by Prompt Granularity</h2>
            </div>
            <NuxtLink to="/dashboard/prompts" class="text-sm text-brand hover:underline font-medium">
              Manage prompts →
            </NuxtLink>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">Level 1 - Broad</span>
                <span class="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded font-medium">L1</span>
              </div>
              <div class="text-3xl font-bold text-gray-900 mb-1">{{ granularityStats.level1.citationRate }}%</div>
              <div class="flex items-center gap-3 text-xs text-gray-500">
                <span>{{ granularityStats.level1.prompts }} prompts</span>
                <span>{{ granularityStats.level1.citations }} citations</span>
              </div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">Level 2 - Specific</span>
                <span class="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded font-medium">L2</span>
              </div>
              <div class="text-3xl font-bold text-gray-900 mb-1">{{ granularityStats.level2.citationRate }}%</div>
              <div class="flex items-center gap-3 text-xs text-gray-500">
                <span>{{ granularityStats.level2.prompts }} prompts</span>
                <span>{{ granularityStats.level2.citations }} citations</span>
              </div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">Level 3 - Detailed</span>
                <span class="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded font-medium">L3</span>
              </div>
              <div class="text-3xl font-bold text-gray-900 mb-1">{{ granularityStats.level3.citationRate }}%</div>
              <div class="flex items-center gap-3 text-xs text-gray-500">
                <span>{{ granularityStats.level3.prompts }} prompts</span>
                <span>{{ granularityStats.level3.citations }} citations</span>
              </div>
            </div>
          </div>
          <div v-if="!granularityStats.hasData" class="text-center py-4 text-sm text-gray-500 mt-4 bg-gray-50 rounded-lg">
            No scan data yet. Run a visibility scan to see performance by granularity level.
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="px-4 py-4 sm:px-0">
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              @click="runScan"
              class="flex items-center gap-3 p-4 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <div class="text-left">
                <div class="font-medium">Run New Scan</div>
                <div class="text-sm text-white/70">Check visibility</div>
              </div>
            </button>
            <NuxtLink
              to="/dashboard/recommendations"
              class="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <div class="text-left">
                <div class="font-medium text-gray-900">Recommendations</div>
                <div class="text-sm text-gray-500">View all fixes</div>
              </div>
            </NuxtLink>
            <NuxtLink
              to="/dashboard/competitors"
              class="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div class="text-left">
                <div class="font-medium text-gray-900">Competitors</div>
                <div class="text-sm text-gray-500">Track rivals</div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Recent Scans & Top Recommendations Grid -->
      <div class="px-4 py-4 sm:px-0">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Recent Scans -->
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="flex items-center gap-3 mb-5">
              <div class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 class="text-lg font-semibold text-gray-900">Recent Scans</h2>
            </div>
            <div v-if="loading" class="flex items-center justify-center py-12">
              <div class="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
            </div>
            <div v-else-if="!jobs.length" class="text-center py-8">
              <p class="text-gray-500 mb-2">No scans yet</p>
              <button @click="runScan" class="text-brand font-medium hover:underline text-sm">Run your first scan →</button>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="job in jobs"
                :key="job.id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center"
                    :class="job.status === 'completed' ? 'bg-green-100' : job.status === 'processing' ? 'bg-blue-100' : 'bg-gray-100'"
                  >
                    <svg v-if="job.status === 'completed'" class="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <svg v-else-if="job.status === 'processing'" class="w-4 h-4 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <svg v-else class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div class="font-medium text-gray-900 text-sm">{{ formatJobType(job.job_type) }}</div>
                    <div class="text-xs text-gray-500">{{ formatDate(job.created_at) }}</div>
                  </div>
                </div>
                <span
                  class="px-2 py-1 rounded text-xs font-medium"
                  :class="getStatusClass(job.status)"
                >
                  {{ job.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Top Recommendations -->
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="flex items-center justify-between mb-5">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                  <svg class="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h2 class="text-lg font-semibold text-gray-900">Top Recommendations</h2>
              </div>
              <NuxtLink v-if="recommendations.length > 0" to="/dashboard/recommendations" class="text-sm text-brand hover:underline font-medium">
                View all →
              </NuxtLink>
            </div>
            <div v-if="!recommendations.length" class="text-center py-8">
              <p class="text-gray-500 mb-1">No recommendations yet</p>
              <p class="text-sm text-gray-400">Run a visibility scan to get personalized recommendations</p>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="rec in recommendations.slice(0, 3)"
                :key="rec.id"
                class="p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex items-start gap-3">
                  <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center text-xs font-bold">
                    P{{ rec.priority }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-medium text-gray-900 text-sm">{{ rec.title }}</h3>
                    <p class="text-xs text-gray-500 line-clamp-1 mt-0.5">{{ rec.description }}</p>
                    <div class="flex items-center gap-2 mt-2">
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                        {{ rec.category }}
                      </span>
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        :class="rec.estimated_impact === 'high' ? 'bg-brand/10 text-brand' : 'bg-gray-200 text-gray-600'"
                      >
                        {{ rec.estimated_impact }} impact
                      </span>
                    </div>
                  </div>
                  <NuxtLink
                    :to="`/dashboard/recommendations/${rec.id}`"
                    class="flex-shrink-0 w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-brand hover:border-brand transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </NuxtLink>
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
import type { VisibilityScore } from '~/types'

definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const loading = ref(true)
const visibilityScore = ref<VisibilityScore | null>(null)
const jobs = ref<any[]>([])
const recommendations = ref<any[]>([])
const granularityStats = ref({
  hasData: false,
  level1: { prompts: 0, citations: 0, citationRate: 0 },
  level2: { prompts: 0, citations: 0, citationRate: 0 },
  level3: { prompts: 0, citations: 0, citationRate: 0 }
})

onMounted(async () => {
  await loadDashboardData()
})

const loadDashboardData = async () => {
  loading.value = true
  try {
    const { data: userData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.value?.id)
      .single()

    if (!userData?.organization_id) return

    const { data: scores } = await supabase
      .from('visibility_scores')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false })
      .limit(4)

    if (scores && scores.length > 0) {
      const latestScores = scores.slice(0, 4)
      const overall = Math.round(
        latestScores.reduce((sum, s) => sum + s.score, 0) / latestScores.length
      )

      visibilityScore.value = {
        overall,
        byModel: {
          chatgpt: latestScores.find(s => s.ai_model === 'chatgpt')?.score || 0,
          claude: latestScores.find(s => s.ai_model === 'claude')?.score || 0,
          gemini: latestScores.find(s => s.ai_model === 'gemini')?.score || 0,
          perplexity: latestScores.find(s => s.ai_model === 'perplexity')?.score || 0,
        },
        trend: 'stable',
        percentChange: 0,
      }
    }

    const { data: jobsData } = await supabase
      .from('jobs')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false })
      .limit(5)

    jobs.value = jobsData || []

    const { data: recsData } = await supabase
      .from('fix_recommendations')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .limit(3)

    recommendations.value = recsData || []

    await loadGranularityStats(userData.organization_id)
  } catch (error) {
    console.error('Error loading dashboard:', error)
  } finally {
    loading.value = false
  }
}

const loadGranularityStats = async (organizationId: string) => {
  try {
    const { data: prompts } = await supabase
      .from('prompts')
      .select('id, granularity_level')
      .eq('organization_id', organizationId)

    if (!prompts || prompts.length === 0) return

    const promptsByLevel = prompts.reduce((acc, p) => {
      const level = p.granularity_level || 1
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const promptIds = prompts.map(p => p.id)
    const { data: results } = await supabase
      .from('prompt_results')
      .select('prompt_id, was_mentioned, prompts!inner(granularity_level)')
      .in('prompt_id', promptIds)

    if (results && results.length > 0) {
      const statsByLevel: Record<number, { total: number; cited: number }> = {
        1: { total: 0, cited: 0 },
        2: { total: 0, cited: 0 },
        3: { total: 0, cited: 0 }
      }

      results.forEach((r: any) => {
        const level = r.prompts?.granularity_level || 1
        if (statsByLevel[level]) {
          statsByLevel[level].total++
          if (r.was_mentioned) statsByLevel[level].cited++
        }
      })

      granularityStats.value = {
        hasData: true,
        level1: {
          prompts: promptsByLevel[1] || 0,
          citations: statsByLevel[1].cited,
          citationRate: statsByLevel[1].total > 0 ? Math.round((statsByLevel[1].cited / statsByLevel[1].total) * 100) : 0
        },
        level2: {
          prompts: promptsByLevel[2] || 0,
          citations: statsByLevel[2].cited,
          citationRate: statsByLevel[2].total > 0 ? Math.round((statsByLevel[2].cited / statsByLevel[2].total) * 100) : 0
        },
        level3: {
          prompts: promptsByLevel[3] || 0,
          citations: statsByLevel[3].cited,
          citationRate: statsByLevel[3].total > 0 ? Math.round((statsByLevel[3].cited / statsByLevel[3].total) * 100) : 0
        }
      }
    } else {
      granularityStats.value = {
        hasData: false,
        level1: { prompts: promptsByLevel[1] || 0, citations: 0, citationRate: 0 },
        level2: { prompts: promptsByLevel[2] || 0, citations: 0, citationRate: 0 },
        level3: { prompts: promptsByLevel[3] || 0, citations: 0, citationRate: 0 }
      }
    }
  } catch (error) {
    console.error('Error loading granularity stats:', error)
  }
}

const runScan = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const { data, error } = await supabase.functions.invoke('trigger-visibility-scan', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })

    if (error) throw error
    alert(`Visibility scan started! Testing ${data.promptCount} prompts across 4 AI engines.`)
    await loadDashboardData()
  } catch (error: any) {
    console.error('Error starting scan:', error)
    alert(`Failed to start scan: ${error.message}`)
  } finally {
    loading.value = false
  }
}

const formatJobType = (type: string) => {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-700'
    case 'processing': return 'bg-blue-100 text-blue-700'
    case 'failed': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}
</script>
