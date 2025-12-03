<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
    <div class="p-4 lg:p-6">
      <!-- Coming Soon Card -->
      <div class="max-w-2xl mx-auto mt-20">
        <div class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 overflow-hidden">
          <div class="p-8 text-center">
            <!-- Icon -->
            <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center">
              <svg class="w-10 h-10 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
              </svg>
            </div>

            <!-- Title -->
            <h1 class="text-2xl font-bold text-gray-900 mb-2">Visibility Gaps</h1>
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-medium mb-4">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Coming Soon
            </div>

            <!-- Description -->
            <p class="text-gray-600 mb-6 max-w-md mx-auto">
              Automatically detect competitive opportunities when your brand is missing from AI responses where competitors appear.
            </p>

            <!-- Features Preview -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-lg mx-auto mb-8">
              <div class="flex items-start gap-3 p-3 bg-gray-50/80 rounded-xl">
                <div class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-900">Gap Detection</div>
                  <div class="text-xs text-gray-500">Find where competitors appear but you don't</div>
                </div>
              </div>
              <div class="flex items-start gap-3 p-3 bg-gray-50/80 rounded-xl">
                <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-900">Priority Scoring</div>
                  <div class="text-xs text-gray-500">Focus on high-impact opportunities first</div>
                </div>
              </div>
              <div class="flex items-start gap-3 p-3 bg-gray-50/80 rounded-xl">
                <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-900">AI Suggestions</div>
                  <div class="text-xs text-gray-500">Get actionable recommendations</div>
                </div>
              </div>
              <div class="flex items-start gap-3 p-3 bg-gray-50/80 rounded-xl">
                <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-900">Track Progress</div>
                  <div class="text-xs text-gray-500">Mark gaps as resolved and track wins</div>
                </div>
              </div>
            </div>

            <!-- Back Link -->
            <NuxtLink
              to="/dashboard"
              class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand transition-colors"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})
</script>
