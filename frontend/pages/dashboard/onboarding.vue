<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand/5">
    <!-- Progress Header -->
    <div class="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
      <div class="max-w-3xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <img src="/brand/logo_text.png" alt="Columbus" class="h-7" />
            <span class="text-sm text-gray-400">Setup</span>
          </div>
          <span class="text-sm text-gray-500">Step {{ currentStep }} of {{ totalSteps }}</span>
        </div>
        <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-brand to-yellow-500 rounded-full transition-all duration-500"
            :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
          />
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="pt-28 pb-16 px-4">
      <div class="max-w-2xl mx-auto">
        <!-- Step 1: Upgrade Proposal (only for free plan) -->
        <Transition
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 translate-x-8"
          enter-to-class="opacity-100 translate-x-0"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 translate-x-0"
          leave-to-class="opacity-0 -translate-x-8"
        >
          <div v-if="currentStep === 1 && showUpgradeStep" class="space-y-8">
            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand to-yellow-500 flex items-center justify-center shadow-lg shadow-brand/25">
                <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 class="text-3xl font-bold text-gray-900 mb-3">Unlock the Full Power of Columbus</h1>
              <p class="text-lg text-gray-600">Get more products, unlimited prompts, and advanced features</p>
            </div>

            <!-- Billing Period Toggle -->
            <div class="flex items-center justify-center gap-3">
              <span :class="billingPeriod === 'monthly' ? 'text-gray-900 font-medium' : 'text-gray-500'">Monthly</span>
              <button
                @click="billingPeriod = billingPeriod === 'monthly' ? 'yearly' : 'monthly'"
                class="relative w-14 h-8 rounded-full transition-colors"
                :class="billingPeriod === 'yearly' ? 'bg-brand' : 'bg-gray-300'"
              >
                <span
                  class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform"
                  :class="billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-0'"
                />
              </button>
              <span :class="billingPeriod === 'yearly' ? 'text-gray-900 font-medium' : 'text-gray-500'">
                Yearly <span class="text-brand text-sm font-medium">(Save 17%)</span>
              </span>
            </div>

            <!-- Pricing Cards -->
            <div class="grid md:grid-cols-2 gap-6">
              <div
                v-for="tier in paidTiers"
                :key="tier.id"
                class="p-6 rounded-2xl border-2 transition-all cursor-pointer"
                :class="tier.is_popular
                  ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-brand text-white'
                  : 'bg-white border-gray-200 hover:border-brand/50'"
                @click="selectPlan(tier)"
              >
                <div v-if="tier.is_popular" class="text-xs font-bold text-brand mb-2">MOST POPULAR</div>
                <h3 class="text-xl font-bold mb-1" :class="tier.is_popular ? 'text-white' : 'text-gray-900'">{{ tier.name }}</h3>
                <div class="flex items-baseline gap-1 mb-1">
                  <span class="text-3xl font-bold">{{ formatPrice(billingPeriod === 'yearly' ? tier.yearly_price : tier.monthly_price) }}</span>
                  <span :class="tier.is_popular ? 'text-gray-400' : 'text-gray-500'">/{{ billingPeriod === 'yearly' ? 'year' : 'month' }}</span>
                </div>
                <div v-if="billingPeriod === 'yearly' && tier.yearly_price > 0" class="text-sm mb-3" :class="tier.is_popular ? 'text-gray-400' : 'text-gray-500'">
                  {{ getMonthlyEquivalent(tier.yearly_price) }}/month
                </div>
                <div v-else class="mb-3"></div>
                <ul class="space-y-2 mb-6">
                  <li v-for="feature in tier.highlight_features?.slice(0, 4)" :key="feature" class="flex items-center gap-2 text-sm">
                    <svg class="w-4 h-4 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    <span :class="tier.is_popular ? 'text-gray-300' : 'text-gray-600'">{{ feature }}</span>
                  </li>
                </ul>
                <button
                  class="w-full py-2.5 rounded-xl font-medium transition-all"
                  :class="tier.is_popular
                    ? 'bg-gradient-to-r from-brand to-yellow-500 text-white hover:shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                >
                  Choose {{ tier.name }}
                </button>
              </div>
            </div>

            <div class="text-center">
              <button
                @click="skipUpgrade"
                class="text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Skip for now, continue with Free
              </button>
            </div>
          </div>
        </Transition>

        <!-- Step 2: Company/Organization Setup -->
        <Transition
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 translate-x-8"
          enter-to-class="opacity-100 translate-x-0"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 translate-x-0"
          leave-to-class="opacity-0 -translate-x-8"
        >
          <div v-if="currentStep === (showUpgradeStep ? 2 : 1)" class="space-y-8">
            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand to-yellow-500 flex items-center justify-center shadow-lg shadow-brand/25">
                <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 class="text-3xl font-bold text-gray-900 mb-3">Tell us about your company</h1>
              <p class="text-lg text-gray-600">This helps us personalize your experience</p>
            </div>

            <div class="bg-white rounded-2xl border border-gray-200 p-8">
              <div class="space-y-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                  <input
                    v-model="companyForm.name"
                    type="text"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                    placeholder="Acme Inc."
                  />
                </div>

                <div class="flex gap-3 pt-4">
                  <button
                    v-if="showUpgradeStep"
                    @click="currentStep--"
                    class="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    @click="saveCompany"
                    :disabled="!companyForm.name || savingCompany"
                    class="flex-1 py-3 px-6 rounded-xl font-medium bg-gradient-to-r from-brand to-yellow-500 text-white hover:shadow-lg hover:shadow-brand/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ savingCompany ? 'Saving...' : 'Continue' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Step 3: Product Setup -->
        <Transition
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 translate-x-8"
          enter-to-class="opacity-100 translate-x-0"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 translate-x-0"
          leave-to-class="opacity-0 -translate-x-8"
        >
          <div v-if="currentStep === (showUpgradeStep ? 3 : 2)" class="space-y-8">
            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand to-yellow-500 flex items-center justify-center shadow-lg shadow-brand/25">
                <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h1 class="text-3xl font-bold text-gray-900 mb-3">Add your first product</h1>
              <p class="text-lg text-gray-600">We'll analyze your website to understand your product</p>
            </div>

            <div class="bg-white rounded-2xl border border-gray-200 p-8">
              <div class="space-y-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                  <input
                    v-model="productForm.name"
                    type="text"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                    placeholder="My Awesome Product"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Website URL *</label>
                  <input
                    v-model="productForm.website"
                    type="url"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                    placeholder="https://yourproduct.com"
                  />
                  <p class="text-xs text-gray-400 mt-2">We'll crawl this to understand your product and generate relevant prompts</p>
                </div>

                <div v-if="productError" class="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                  {{ productError }}
                </div>

                <div class="flex gap-3 pt-4">
                  <button
                    @click="currentStep--"
                    class="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    @click="startAnalysis"
                    :disabled="!productForm.name || !productForm.website || analyzingWebsite"
                    class="flex-1 py-3 px-6 rounded-xl font-medium bg-gradient-to-r from-brand to-yellow-500 text-white hover:shadow-lg hover:shadow-brand/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ analyzingWebsite ? 'Starting Analysis...' : 'Analyze & Continue' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Step 4: Website Analysis Progress -->
        <Transition
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 translate-x-8"
          enter-to-class="opacity-100 translate-x-0"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 translate-x-0"
          leave-to-class="opacity-0 -translate-x-8"
        >
          <div v-if="currentStep === (showUpgradeStep ? 4 : 3)" class="space-y-8">
            <div class="text-center">
              <div class="relative w-20 h-20 mx-auto mb-6">
                <div class="absolute inset-0 rounded-full bg-brand/20 animate-ping"></div>
                <div class="relative w-20 h-20 rounded-full bg-gradient-to-br from-brand to-yellow-500 flex items-center justify-center shadow-lg shadow-brand/25">
                  <svg class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                </div>
              </div>
              <h1 class="text-3xl font-bold text-gray-900 mb-3">Analyzing Your Website</h1>
              <p class="text-lg text-gray-600">{{ analysisProgress.message }}</p>
            </div>

            <div class="bg-white rounded-2xl border border-gray-200 p-8">
              <!-- Progress bar -->
              <div class="mb-8">
                <div class="flex justify-between text-sm mb-2">
                  <span class="text-gray-600">Progress</span>
                  <span class="font-medium text-brand">{{ Math.round(analysisProgress.progress_percent) }}%</span>
                </div>
                <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-brand to-yellow-500 rounded-full transition-all duration-500"
                    :style="{ width: `${analysisProgress.progress_percent}%` }"
                  />
                </div>
              </div>

              <!-- Live updates -->
              <div class="space-y-3 max-h-64 overflow-y-auto">
                <div
                  v-for="(update, index) in analysisUpdates"
                  :key="index"
                  class="flex items-start gap-3 p-3 rounded-xl"
                  :class="index === 0 ? 'bg-brand/5 border border-brand/20' : 'bg-gray-50'"
                >
                  <div
                    class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    :class="update.completed ? 'bg-green-500' : (index === 0 ? 'bg-brand' : 'bg-gray-300')"
                  >
                    <svg v-if="update.completed" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <div v-else-if="index === 0" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-900 truncate">{{ update.title }}</p>
                    <p v-if="update.detail" class="text-sm text-gray-500 truncate">{{ update.detail }}</p>
                  </div>
                </div>
              </div>

              <!-- Stats -->
              <div v-if="analysisProgress.pages_discovered > 0" class="mt-6 pt-6 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div class="text-2xl font-bold text-gray-900">{{ analysisProgress.pages_discovered }}</div>
                  <div class="text-sm text-gray-500">Pages Found</div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-gray-900">{{ analysisProgress.pages_analyzed }}</div>
                  <div class="text-sm text-gray-500">Analyzed</div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-gray-900">{{ analysisProgress.prompts_generated }}</div>
                  <div class="text-sm text-gray-500">Prompts</div>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Step 5: Prompt Configuration -->
        <Transition
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 translate-x-8"
          enter-to-class="opacity-100 translate-x-0"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 translate-x-0"
          leave-to-class="opacity-0 -translate-x-8"
        >
          <div v-if="currentStep === (showUpgradeStep ? 5 : 4)" class="space-y-8">
            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand to-yellow-500 flex items-center justify-center shadow-lg shadow-brand/25">
                <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h1 class="text-3xl font-bold text-gray-900 mb-3">Configure Your Prompts</h1>
              <p class="text-lg text-gray-600">Review and customize the prompts we'll use to track your visibility</p>
            </div>

            <div class="bg-white rounded-2xl border border-gray-200 p-8">
              <!-- Language Selection -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Prompt Language</label>
                <div class="relative">
                  <button
                    type="button"
                    @click="showLanguageDropdown = !showLanguageDropdown"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-left flex items-center justify-between transition-all"
                  >
                    <span class="flex items-center gap-2">
                      <span class="text-lg">{{ selectedLanguage?.flag }}</span>
                      <span>{{ selectedLanguage?.name }}</span>
                    </span>
                    <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    v-if="showLanguageDropdown"
                    class="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                  >
                    <input
                      v-model="languageSearch"
                      type="text"
                      class="w-full px-4 py-3 border-b border-gray-100 focus:outline-none"
                      placeholder="Search languages..."
                    />
                    <div
                      v-for="lang in filteredLanguages"
                      :key="lang.code"
                      @click="selectLanguage(lang)"
                      class="px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center gap-2"
                      :class="{ 'bg-brand/5': selectedLanguage?.code === lang.code }"
                    >
                      <span class="text-lg">{{ lang.flag }}</span>
                      <span>{{ lang.name }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Region Selection -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Target Regions</label>
                <p class="text-xs text-gray-400 mb-2">Select regions where prompts should be tested</p>
                <div class="relative">
                  <button
                    type="button"
                    @click="showRegionDropdown = !showRegionDropdown"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-left flex items-center justify-between transition-all"
                  >
                    <span v-if="selectedRegions.length === 0" class="text-gray-400">Select regions...</span>
                    <span v-else class="flex flex-wrap gap-1">
                      <span
                        v-for="code in selectedRegions.slice(0, 5)"
                        :key="code"
                        class="inline-flex items-center gap-1 px-2 py-0.5 bg-brand/10 text-brand rounded-md text-sm"
                      >
                        {{ getRegionFlag(code) }} {{ code.toUpperCase() }}
                      </span>
                      <span v-if="selectedRegions.length > 5" class="text-gray-400 text-sm">
                        +{{ selectedRegions.length - 5 }} more
                      </span>
                    </span>
                    <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    v-if="showRegionDropdown"
                    class="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                  >
                    <div
                      @click="toggleRegion('local')"
                      class="px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
                      :class="{ 'bg-brand/5': selectedRegions.includes('local') }"
                    >
                      <span class="text-lg">🏠</span>
                      <span class="flex-1">Local (Your Location)</span>
                      <svg v-if="selectedRegions.includes('local')" class="w-5 h-5 text-brand" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <div
                      v-for="country in availableCountries"
                      :key="country.code"
                      @click="toggleRegion(country.code)"
                      class="px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center gap-2"
                      :class="{ 'bg-brand/5': selectedRegions.includes(country.code) }"
                    >
                      <span class="text-lg">{{ country.flag_emoji || '🌐' }}</span>
                      <span class="flex-1">{{ country.name }}</span>
                      <svg v-if="selectedRegions.includes(country.code)" class="w-5 h-5 text-brand" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Prompts List -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <label class="block text-sm font-medium text-gray-700">Generated Prompts</label>
                  <button
                    @click="addPrompt"
                    class="text-sm text-brand hover:text-brand/80 font-medium"
                  >
                    + Add Prompt
                  </button>
                </div>
                <div class="space-y-3">
                  <div
                    v-for="(prompt, index) in editablePrompts"
                    :key="index"
                    class="flex items-start gap-3 p-4 bg-gray-50 rounded-xl"
                  >
                    <textarea
                      v-model="prompt.text"
                      rows="2"
                      class="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-sm resize-none"
                    />
                    <button
                      v-if="editablePrompts.length > 1"
                      @click="removePrompt(index)"
                      class="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div class="flex gap-3 pt-6 mt-6 border-t border-gray-100">
                <button
                  @click="currentStep--"
                  class="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  @click="savePrompts"
                  :disabled="editablePrompts.length === 0 || savingPrompts"
                  class="flex-1 py-3 px-6 rounded-xl font-medium bg-gradient-to-r from-brand to-yellow-500 text-white hover:shadow-lg hover:shadow-brand/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ savingPrompts ? 'Saving...' : 'Continue' }}
                </button>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Step 6: Desktop App Download -->
        <Transition
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 translate-x-8"
          enter-to-class="opacity-100 translate-x-0"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 translate-x-0"
          leave-to-class="opacity-0 -translate-x-8"
        >
          <div v-if="currentStep === (showUpgradeStep ? 6 : 5)" class="space-y-8">
            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand to-yellow-500 flex items-center justify-center shadow-lg shadow-brand/25">
                <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 class="text-3xl font-bold text-gray-900 mb-3">Install the Desktop App</h1>
              <p class="text-lg text-gray-600">Required to run visibility scans using your own AI accounts</p>
            </div>

            <div class="bg-white rounded-2xl border border-gray-200 p-8">
              <!-- Why Desktop App -->
              <div class="mb-8">
                <h3 class="font-semibold text-gray-900 mb-4">Why do I need a desktop app?</h3>
                <div class="space-y-4">
                  <div class="flex items-start gap-4">
                    <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h4 class="font-medium text-gray-900">100% ToS Compliant</h4>
                      <p class="text-sm text-gray-600">Uses your own AI accounts through official interfaces. No scraping, no proxies, no violations.</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-4">
                    <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 class="font-medium text-gray-900">Real User Data</h4>
                      <p class="text-sm text-gray-600">See exactly what AI platforms show to real users, not simulated API responses.</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-4">
                    <div class="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <svg class="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 class="font-medium text-gray-900">No Extra Costs</h4>
                      <p class="text-sm text-gray-600">Use your existing AI subscriptions. No expensive proxy infrastructure or API fees.</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Download Button -->
              <div class="text-center p-6 bg-gray-50 rounded-xl mb-6">
                <a
                  :href="desktopAppUrl"
                  class="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-brand to-yellow-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:shadow-brand/30 transition-all"
                >
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download for {{ osName }}
                </a>
                <p class="text-sm text-gray-500 mt-3">Available for Windows, macOS, and Linux</p>
              </div>

              <div class="flex gap-3">
                <button
                  @click="currentStep--"
                  class="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  @click="completeDownloadStep"
                  class="flex-1 py-3 px-6 rounded-xl font-medium bg-gradient-to-r from-brand to-yellow-500 text-white hover:shadow-lg hover:shadow-brand/30 transition-all"
                >
                  {{ appDownloaded ? 'Continue' : 'I\'ll download later, continue' }}
                </button>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Step 7: Completion -->
        <Transition
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 translate-x-8"
          enter-to-class="opacity-100 translate-x-0"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 translate-x-0"
          leave-to-class="opacity-0 -translate-x-8"
        >
          <div v-if="currentStep === (showUpgradeStep ? 7 : 6)" class="space-y-8">
            <div class="text-center">
              <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                <svg class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 class="text-3xl font-bold text-gray-900 mb-3">You're All Set!</h1>
              <p class="text-lg text-gray-600">Your product is ready to be monitored</p>
            </div>

            <div class="bg-white rounded-2xl border border-gray-200 p-8">
              <!-- Product Summary -->
              <div class="text-center mb-8">
                <div class="inline-flex items-center gap-3 px-6 py-4 bg-gray-50 rounded-xl">
                  <div class="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
                    <svg class="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div class="text-left">
                    <h3 class="font-semibold text-gray-900">{{ productForm.name }}</h3>
                    <p class="text-sm text-gray-500">{{ productForm.website }}</p>
                  </div>
                </div>
              </div>

              <!-- Stats -->
              <div class="grid grid-cols-3 gap-4 mb-8">
                <div class="text-center p-4 bg-gray-50 rounded-xl">
                  <div class="text-2xl font-bold text-brand">{{ editablePrompts.length }}</div>
                  <div class="text-sm text-gray-500">Prompts</div>
                </div>
                <div class="text-center p-4 bg-gray-50 rounded-xl">
                  <div class="text-2xl font-bold text-brand">{{ selectedRegions.length }}</div>
                  <div class="text-sm text-gray-500">Regions</div>
                </div>
                <div class="text-center p-4 bg-gray-50 rounded-xl">
                  <div class="text-2xl font-bold text-brand">{{ analysisProgress.pages_analyzed || 1 }}</div>
                  <div class="text-sm text-gray-500">Pages</div>
                </div>
              </div>

              <!-- Next Steps -->
              <div class="p-4 bg-brand/5 border border-brand/20 rounded-xl mb-8">
                <h4 class="font-medium text-gray-900 mb-2">What's next?</h4>
                <ul class="space-y-2 text-sm text-gray-600">
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-brand" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    Open the desktop app and sign in
                  </li>
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-brand" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    Connect your AI accounts (ChatGPT, Claude, etc.)
                  </li>
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-brand" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    Run your first visibility scan
                  </li>
                </ul>
              </div>

              <button
                @click="completeOnboarding"
                :disabled="completingOnboarding"
                class="w-full py-4 px-6 rounded-xl font-medium bg-gradient-to-r from-brand to-yellow-500 text-white hover:shadow-lg hover:shadow-brand/30 transition-all disabled:opacity-50"
              >
                {{ completingOnboarding ? 'Setting up...' : 'Go to Dashboard' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const config = useRuntimeConfig()
const { tiers: subscriptionTiers, fetchTiers, formatPrice, getMonthlyEquivalent } = useSubscriptionTiers()
const { createCheckout } = useEdgeFunctions()

// State
const currentStep = ref(1)
const showUpgradeStep = ref(true) // Will be set based on plan check
const totalSteps = computed(() => showUpgradeStep.value ? 7 : 6)
const billingPeriod = ref<'monthly' | 'yearly'>('monthly')

// Company form
const companyForm = ref({ name: '' })
const savingCompany = ref(false)

// Product form
const productForm = ref({ name: '', website: '' })
const productError = ref('')
const analyzingWebsite = ref(false)
const createdProductId = ref<string | null>(null)
const analysisJobId = ref<string | null>(null)

// Analysis progress
const analysisProgress = ref({
  current_step: 'initializing',
  step_number: 0,
  total_steps: 6,
  progress_percent: 0,
  message: 'Starting analysis...',
  pages_discovered: 0,
  pages_analyzed: 0,
  prompts_generated: 0,
  current_page_url: '',
  current_page_title: ''
})
const analysisUpdates = ref<Array<{ title: string; detail?: string; completed: boolean }>>([])

// Prompts configuration
const editablePrompts = ref<Array<{ text: string }>>([])
const selectedLanguage = ref({ code: 'en', name: 'English', flag: '🇺🇸' })
const showLanguageDropdown = ref(false)
const languageSearch = ref('')
const selectedRegions = ref<string[]>(['local'])
const showRegionDropdown = ref(false)
const availableCountries = ref<Array<{ code: string; name: string; flag_emoji: string | null }>>([])
const savingPrompts = ref(false)

// Desktop app
const desktopAppUrl = config.public.desktopAppDownloadUrl as string
const appDownloaded = ref(false)

// Completion
const completingOnboarding = ref(false)

// Languages supported by OpenAI
const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
]

const filteredLanguages = computed(() => {
  if (!languageSearch.value) return languages
  const search = languageSearch.value.toLowerCase()
  return languages.filter(l => l.name.toLowerCase().includes(search) || l.code.includes(search))
})

const paidTiers = computed(() => subscriptionTiers.value.filter(t => t.id !== 'free'))

const osName = computed(() => {
  if (typeof navigator === 'undefined') return 'Desktop'
  const ua = navigator.userAgent
  if (ua.includes('Windows')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  return 'Desktop'
})

// Initialize
onMounted(async () => {
  await fetchTiers()
  await loadCountries()
  await checkUserPlan()
})

const checkUserPlan = async () => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, active_organization_id')
      .eq('id', user.value?.id)
      .single()

    const orgId = profile?.active_organization_id || profile?.organization_id

    if (orgId) {
      const { data: org } = await supabase
        .from('organizations')
        .select('plan')
        .eq('id', orgId)
        .single()

      // If user already has a paid plan, skip upgrade step
      if (org?.plan && org.plan !== 'free') {
        showUpgradeStep.value = false
      }
    }
  } catch (e) {
    console.error('Error checking plan:', e)
  }
}

const loadCountries = async () => {
  try {
    const { data: proxies } = await supabase
      .from('proxies')
      .select('country_code')
      .eq('is_active', true)

    const countryCodes = [...new Set(proxies?.map(p => p.country_code) || [])]

    if (countryCodes.length > 0) {
      const { data } = await supabase
        .from('proxy_countries')
        .select('code, name, flag_emoji')
        .eq('is_active', true)
        .in('code', countryCodes)
        .order('sort_order', { ascending: true })

      availableCountries.value = data || []
    }
  } catch (e) {
    console.error('Error loading countries:', e)
  }
}

const selectPlan = async (tier: any) => {
  try {
    const result = await createCheckout(tier.id, billingPeriod.value)
    if (result.url) {
      window.location.href = result.url
    }
  } catch (e: any) {
    console.error('Checkout error:', e)
    alert(e.message || 'Failed to start checkout')
  }
}

const skipUpgrade = () => {
  currentStep.value++
}

const saveCompany = async () => {
  if (!companyForm.value.name) return

  savingCompany.value = true
  try {
    // Create organization via edge function (bypasses RLS)
    const { data, error } = await supabase.functions.invoke('create-organization', {
      body: { name: companyForm.value.name }
    })

    if (error) throw error
    if (!data.success) throw new Error(data.error || 'Failed to create organization')

    currentStep.value++
  } catch (e: any) {
    console.error('Error saving company:', e)
    alert(e.message || 'Failed to save company')
  } finally {
    savingCompany.value = false
  }
}

const startAnalysis = async () => {
  if (!productForm.value.name || !productForm.value.website) return

  productError.value = ''
  analyzingWebsite.value = true

  try {
    // Normalize URL
    let websiteUrl = productForm.value.website.trim()
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = 'https://' + websiteUrl
    }

    // Create product via edge function
    const { data: result, error } = await supabase.functions.invoke('create-product', {
      body: {
        name: productForm.value.name,
        domain: websiteUrl,
        runInitialAnalysis: true
      }
    })

    if (error) throw error
    if (!result.success) throw new Error(result.error || 'Failed to create product')

    createdProductId.value = result.product?.id
    analysisJobId.value = result.jobId

    // Move to analysis step
    currentStep.value++

    // Start listening for progress updates
    if (result.jobId) {
      subscribeToProgress(result.jobId)
    }
  } catch (e: any) {
    console.error('Error starting analysis:', e)
    productError.value = e.message || 'Failed to start analysis'
    analyzingWebsite.value = false
  }
}

const subscribeToProgress = (jobId: string) => {
  // Subscribe to realtime updates
  const channel = supabase
    .channel(`analysis-progress-${jobId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'website_analysis_progress',
        filter: `job_id=eq.${jobId}`
      },
      (payload: any) => {
        if (payload.new) {
          updateProgress(payload.new)
        }
      }
    )
    .subscribe()

  // Also poll for progress in case realtime fails
  pollProgress(jobId)
}

const updateProgress = (data: any) => {
  analysisProgress.value = {
    ...analysisProgress.value,
    ...data
  }

  // Add to updates list
  if (data.message && data.message !== analysisUpdates.value[0]?.title) {
    analysisUpdates.value.unshift({
      title: data.message,
      detail: data.current_page_title || data.current_page_url,
      completed: false
    })

    // Mark previous as completed
    if (analysisUpdates.value.length > 1) {
      analysisUpdates.value[1].completed = true
    }

    // Keep only last 10
    if (analysisUpdates.value.length > 10) {
      analysisUpdates.value = analysisUpdates.value.slice(0, 10)
    }
  }

  // Check if completed
  if (data.current_step === 'completed' || data.progress_percent >= 100) {
    loadGeneratedPrompts()
  }
}

const pollProgress = async (jobId: string) => {
  const maxAttempts = 120
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      // Check job status
      const { data: job } = await supabase
        .from('jobs')
        .select('status')
        .eq('id', jobId)
        .single()

      if (job?.status === 'completed') {
        analysisProgress.value.progress_percent = 100
        analysisProgress.value.message = 'Analysis complete!'
        await loadGeneratedPrompts()
        return
      }

      if (job?.status === 'failed') {
        productError.value = 'Analysis failed. Please try again.'
        currentStep.value--
        return
      }

      // Check progress table
      const { data: progress } = await supabase
        .from('website_analysis_progress')
        .select('*')
        .eq('job_id', jobId)
        .single()

      if (progress) {
        updateProgress(progress)
      } else {
        // Simulate progress if no realtime updates
        analysisProgress.value.progress_percent = Math.min(
          95,
          Math.round(analysisProgress.value.progress_percent + Math.random() * 5)
        )
      }
    } catch (e) {
      console.error('Poll error:', e)
    }

    await new Promise(r => setTimeout(r, 2000))
    attempts++
  }

  // Timeout - assume complete and continue
  await loadGeneratedPrompts()
}

const loadGeneratedPrompts = async () => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, active_organization_id')
      .eq('id', user.value?.id)
      .single()

    const orgId = profile?.active_organization_id || profile?.organization_id

    const { data: prompts } = await supabase
      .from('prompts')
      .select('prompt_text')
      .eq('organization_id', orgId)
      .eq('is_custom', false)
      .limit(10)

    if (prompts && prompts.length > 0) {
      editablePrompts.value = prompts.map(p => ({ text: p.prompt_text }))
    } else {
      // Default prompts if none generated
      editablePrompts.value = [
        { text: `What is ${productForm.value.name}?` },
        { text: `Best alternatives to ${productForm.value.name}` },
        { text: `${productForm.value.name} reviews` }
      ]
    }

    // Move to prompt configuration step
    currentStep.value++
  } catch (e) {
    console.error('Error loading prompts:', e)
    currentStep.value++
  }
}

const selectLanguage = (lang: any) => {
  selectedLanguage.value = lang
  showLanguageDropdown.value = false
  languageSearch.value = ''
}

const toggleRegion = (code: string) => {
  const index = selectedRegions.value.indexOf(code)
  if (index === -1) {
    selectedRegions.value.push(code)
  } else {
    selectedRegions.value.splice(index, 1)
  }
}

const getRegionFlag = (code: string) => {
  if (code === 'local') return '🏠'
  const country = availableCountries.value.find(c => c.code === code)
  return country?.flag_emoji || '🌐'
}

const addPrompt = () => {
  editablePrompts.value.push({ text: '' })
}

const removePrompt = (index: number) => {
  if (editablePrompts.value.length > 1) {
    editablePrompts.value.splice(index, 1)
  }
}

const savePrompts = async () => {
  const validPrompts = editablePrompts.value.filter(p => p.text.trim())
  if (validPrompts.length === 0) {
    alert('Please add at least one prompt')
    return
  }

  savingPrompts.value = true
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, active_organization_id')
      .eq('id', user.value?.id)
      .single()

    const orgId = profile?.active_organization_id || profile?.organization_id

    // Delete existing prompts
    await supabase
      .from('prompts')
      .delete()
      .eq('organization_id', orgId)
      .eq('product_id', createdProductId.value)
      .eq('is_custom', false)

    // Insert new prompts
    const promptsToInsert = validPrompts.map((p, i) => ({
      organization_id: orgId,
      product_id: createdProductId.value,
      prompt_text: p.text,
      granularity_level: Math.floor(i / 5) + 1, // Distribute across levels
      target_regions: selectedRegions.value.length > 0 ? selectedRegions.value : null,
      is_custom: false
    }))

    await supabase.from('prompts').insert(promptsToInsert)

    currentStep.value++
  } catch (e: any) {
    console.error('Error saving prompts:', e)
    alert(e.message || 'Failed to save prompts')
  } finally {
    savingPrompts.value = false
  }
}

const completeDownloadStep = () => {
  currentStep.value++
}

const completeOnboarding = async () => {
  completingOnboarding.value = true
  try {
    // Mark onboarding as complete
    await supabase
      .from('profiles')
      .update({ onboarding_complete: true })
      .eq('id', user.value?.id)

    // Redirect to dashboard
    router.push('/dashboard')
  } catch (e: any) {
    console.error('Error completing onboarding:', e)
    alert(e.message || 'Failed to complete setup')
    completingOnboarding.value = false
  }
}

// Close dropdowns when clicking outside
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.relative')) {
    showLanguageDropdown.value = false
    showRegionDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
