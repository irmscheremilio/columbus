<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="showBanner"
      class="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
    >
      <div class="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        <div class="p-4 md:p-6">
          <div class="flex flex-col md:flex-row md:items-start gap-4">
            <!-- Cookie Icon -->
            <div class="hidden md:flex w-12 h-12 rounded-full bg-brand/10 items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <!-- Content -->
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">We value your privacy</h3>
              <p class="text-gray-600 text-sm leading-relaxed mb-4">
                We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.
                By clicking "Accept All", you consent to our use of cookies.
                <NuxtLink to="/privacy" class="text-brand hover:underline">Learn more</NuxtLink>
              </p>

              <!-- Buttons -->
              <div class="flex flex-col sm:flex-row gap-3">
                <button
                  @click="acceptAll"
                  class="px-5 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors text-sm"
                >
                  Accept All
                </button>
                <button
                  @click="acceptEssential"
                  class="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                >
                  Essential Only
                </button>
                <button
                  @click="showSettings = true"
                  class="px-5 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
                >
                  Manage Preferences
                </button>
              </div>
            </div>

            <!-- Close button (decline) -->
            <button
              @click="declineAll"
              class="absolute top-3 right-3 md:static p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Decline all cookies"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Settings Panel -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="max-h-0 opacity-0"
          enter-to-class="max-h-96 opacity-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="max-h-96 opacity-100"
          leave-to-class="max-h-0 opacity-0"
        >
          <div v-if="showSettings" class="border-t border-gray-200 bg-gray-50 overflow-hidden">
            <div class="p-4 md:p-6 space-y-4">
              <!-- Essential Cookies -->
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-medium text-gray-900">Essential Cookies</h4>
                  <p class="text-sm text-gray-500">Required for the website to function properly</p>
                </div>
                <div class="relative">
                  <input
                    type="checkbox"
                    checked
                    disabled
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-brand rounded-full peer-disabled:opacity-70"></div>
                  <div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-5 translate-x-5"></div>
                </div>
              </div>

              <!-- Analytics Cookies -->
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-medium text-gray-900">Analytics Cookies</h4>
                  <p class="text-sm text-gray-500">Help us understand how visitors use our site</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    v-model="preferences.analytics"
                    type="checkbox"
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-brand after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>

              <!-- Marketing Cookies -->
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-medium text-gray-900">Marketing Cookies</h4>
                  <p class="text-sm text-gray-500">Used to deliver personalized advertisements</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    v-model="preferences.marketing"
                    type="checkbox"
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-brand after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>

              <!-- Save Button -->
              <div class="flex justify-end pt-2">
                <button
                  @click="savePreferences"
                  class="px-5 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors text-sm"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { showBanner, acceptAll, acceptEssential, declineAll } = useCookieConsent()

const showSettings = ref(false)
const preferences = ref({
  analytics: false,
  marketing: false,
})

const savePreferences = () => {
  if (preferences.value.analytics && preferences.value.marketing) {
    acceptAll()
  } else {
    acceptEssential()
  }
  showSettings.value = false
}
</script>
