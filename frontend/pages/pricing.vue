<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <NuxtLink to="/">
            <img src="/brand/logo_text.png" alt="Columbus" class="h-8" />
          </NuxtLink>
          <div class="flex items-center gap-4">
            <NuxtLink v-if="!user" to="/auth/login" class="text-gray-600 hover:text-gray-900 transition-colors">
              Sign In
            </NuxtLink>
            <NuxtLink v-if="!user" to="/auth/signup" class="btn-primary">
              Start Free
            </NuxtLink>
            <NuxtLink v-else to="/dashboard" class="btn-primary">
              Go to Dashboard
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="py-16 bg-gradient-to-b from-white to-gray-50">
      <div class="container mx-auto px-4 text-center">
        <span class="inline-block px-4 py-1 bg-brand/10 text-brand rounded-full text-sm font-medium mb-4">Pricing</span>
        <h1 class="text-4xl md:text-5xl font-bold mb-4">
          Simple, Transparent <span class="brand-text">Pricing</span>
        </h1>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Start free and upgrade as your needs grow. No hidden fees, cancel anytime.
        </p>

        <!-- Billing Toggle -->
        <div class="flex items-center justify-center gap-4">
          <span :class="billingPeriod === 'monthly' ? 'text-gray-900 font-medium' : 'text-gray-500'">Monthly</span>
          <button
            @click="billingPeriod = billingPeriod === 'monthly' ? 'yearly' : 'monthly'"
            class="relative w-14 h-7 rounded-full transition-colors"
            :class="billingPeriod === 'yearly' ? 'bg-brand' : 'bg-gray-300'"
          >
            <span
              class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform"
              :class="billingPeriod === 'yearly' ? 'translate-x-7' : 'translate-x-0'"
            />
          </button>
          <span :class="billingPeriod === 'yearly' ? 'text-gray-900 font-medium' : 'text-gray-500'">
            Yearly
            <span class="ml-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Save ~17%</span>
          </span>
        </div>
      </div>
    </section>

    <!-- Pricing Cards -->
    <section class="py-16 -mt-8">
      <div class="container mx-auto px-4">
        <div v-if="loading" class="text-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto"></div>
          <p class="mt-4 text-gray-500">Loading plans...</p>
        </div>

        <div v-else class="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 items-start">
          <template v-for="tier in tiers" :key="tier.id">
            <!-- Popular/Featured tier (dark card) -->
            <div
              v-if="tier.is_popular"
              class="relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-2xl md:scale-105 md:-my-4"
            >
              <div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand to-yellow-400 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                MOST POPULAR
              </div>
              <div class="flex items-center gap-3 mb-6">
                <div class="w-12 h-12 rounded-xl bg-brand/20 flex items-center justify-center">
                  <svg class="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="getIconSvg(tier.icon)"></svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold">{{ tier.name }}</h3>
                  <p class="text-sm text-gray-400">{{ tier.tagline }}</p>
                </div>
              </div>
              <div class="mb-6">
                <span class="text-5xl font-bold">{{ formatPrice(billingPeriod === 'yearly' ? tier.yearly_price : tier.monthly_price) }}</span>
                <span class="text-gray-400 ml-1">/{{ billingPeriod === 'yearly' ? 'year' : 'month' }}</span>
                <div v-if="billingPeriod === 'yearly' && tier.yearly_price > 0" class="text-sm text-gray-400 mt-1">
                  {{ getMonthlyEquivalent(tier.yearly_price) }}/month billed annually
                </div>
              </div>
              <p class="text-gray-400 text-sm mb-8">{{ tier.description }}</p>

              <ul class="space-y-4 mb-8">
                <li v-for="feature in tier.highlight_features" :key="feature" class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-brand flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-gray-200">{{ feature }}</span>
                </li>
              </ul>

              <NuxtLink
                v-if="!user"
                :to="`/auth/signup?plan=${tier.id}&billing=${billingPeriod}`"
                class="w-full flex items-center justify-center py-3 px-6 rounded-xl font-medium bg-gradient-to-r from-brand to-yellow-500 text-white hover:shadow-lg hover:shadow-brand/30 transition-all"
              >
                Get Started
              </NuxtLink>
              <div v-else-if="currentPlan === tier.id" class="w-full py-3 px-6 rounded-xl font-medium bg-brand/20 text-brand text-center">
                Current Plan
              </div>
              <button
                v-else
                @click="handleUpgrade(tier.id)"
                :disabled="upgrading"
                class="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium bg-gradient-to-r from-brand to-yellow-500 text-white hover:shadow-lg hover:shadow-brand/30 transition-all disabled:opacity-50"
              >
                <span v-if="upgrading">Processing...</span>
                <span v-else>{{ currentPlan !== 'free' ? 'Manage Plan' : `Upgrade to ${tier.name}` }}</span>
              </button>
            </div>

            <!-- Regular tier (light card) -->
            <div
              v-else
              class="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div class="flex items-center gap-3 mb-6">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center" :class="tier.id === 'free' ? 'bg-gray-100' : 'bg-brand/10'">
                  <svg class="w-6 h-6" :class="tier.id === 'free' ? 'text-gray-600' : 'text-brand'" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="getIconSvg(tier.icon)"></svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-gray-900">{{ tier.name }}</h3>
                  <p class="text-sm text-gray-500">{{ tier.tagline }}</p>
                </div>
              </div>
              <div class="mb-6">
                <span class="text-5xl font-bold text-gray-900">{{ formatPrice(billingPeriod === 'yearly' ? tier.yearly_price : tier.monthly_price) }}</span>
                <span class="text-gray-500 ml-1">/{{ tier.monthly_price === 0 ? 'month' : (billingPeriod === 'yearly' ? 'year' : 'month') }}</span>
                <div v-if="billingPeriod === 'yearly' && tier.yearly_price > 0" class="text-sm text-gray-500 mt-1">
                  {{ getMonthlyEquivalent(tier.yearly_price) }}/month billed annually
                </div>
              </div>
              <p class="text-gray-600 text-sm mb-8">{{ tier.description }}</p>

              <ul class="space-y-4 mb-8">
                <li v-for="feature in tier.highlight_features" :key="feature" class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-brand flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-gray-700">{{ feature }}</span>
                </li>
              </ul>

              <template v-if="tier.id === 'free'">
                <NuxtLink
                  v-if="!user"
                  to="/auth/signup"
                  class="w-full flex items-center justify-center py-3 px-6 rounded-xl font-medium border-2 border-gray-200 text-gray-700 hover:border-brand hover:text-brand transition-all"
                >
                  Get Started Free
                </NuxtLink>
                <div v-else-if="currentPlan === 'free'" class="w-full py-3 px-6 rounded-xl font-medium bg-gray-100 text-gray-500 text-center">
                  Current Plan
                </div>
                <button
                  v-else
                  disabled
                  class="w-full py-3 px-6 rounded-xl font-medium border-2 border-gray-200 text-gray-400 cursor-not-allowed"
                >
                  Downgrade Not Available
                </button>
              </template>
              <template v-else>
                <NuxtLink
                  v-if="!user"
                  :to="`/auth/signup?plan=${tier.id}&billing=${billingPeriod}`"
                  class="w-full flex items-center justify-center py-3 px-6 rounded-xl font-medium border-2 border-gray-200 text-gray-700 hover:border-brand hover:text-brand transition-all"
                >
                  Get Started
                </NuxtLink>
                <div v-else-if="currentPlan === tier.id" class="w-full py-3 px-6 rounded-xl font-medium bg-gray-100 text-gray-500 text-center">
                  Current Plan
                </div>
                <button
                  v-else
                  @click="handleUpgrade(tier.id)"
                  :disabled="upgrading"
                  class="w-full flex items-center justify-center py-3 px-6 rounded-xl font-medium border-2 border-gray-200 text-gray-700 hover:border-brand hover:text-brand transition-all disabled:opacity-50"
                >
                  <span v-if="upgrading">Processing...</span>
                  <span v-else>{{ currentPlan !== 'free' ? 'Manage Plan' : `Upgrade to ${tier.name}` }}</span>
                </button>
              </template>
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- Feature Comparison -->
    <section class="py-16 bg-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold mb-4">Compare Plans</h2>
          <p class="text-gray-600">See what's included in each plan</p>
        </div>

        <div class="max-w-4xl mx-auto overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="py-4 px-4 text-left font-medium text-gray-500">Feature</th>
                <th v-for="tier in tiers" :key="tier.id" class="py-4 px-4 text-center font-medium" :class="tier.is_popular ? 'text-brand' : 'text-gray-900'">
                  {{ tier.name }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-gray-100">
                <td class="py-4 px-4 text-gray-700">Products</td>
                <td v-for="tier in tiers" :key="tier.id" class="py-4 px-4 text-center" :class="tier.is_popular ? 'font-medium text-gray-900' : 'text-gray-600'">
                  {{ formatLimit(tier.product_limit) }}
                </td>
              </tr>
              <tr class="border-b border-gray-100">
                <td class="py-4 px-4 text-gray-700">Prompts per product</td>
                <td v-for="tier in tiers" :key="tier.id" class="py-4 px-4 text-center" :class="tier.is_popular ? 'font-medium text-gray-900' : 'text-gray-600'">
                  {{ formatLimit(tier.prompts_per_month) }}
                </td>
              </tr>
              <tr class="border-b border-gray-100">
                <td class="py-4 px-4 text-gray-700">Competitor tracking</td>
                <td v-for="tier in tiers" :key="tier.id" class="py-4 px-4 text-center" :class="tier.is_popular ? 'font-medium text-gray-900' : 'text-gray-600'">
                  {{ formatLimit(tier.competitors_limit) }}
                </td>
              </tr>
              <tr class="border-b border-gray-100">
                <td class="py-4 px-4 text-gray-700">Visibility scans</td>
                <td v-for="tier in tiers" :key="tier.id" class="py-4 px-4 text-center" :class="tier.is_popular ? 'font-medium text-gray-900' : 'text-gray-600'">
                  {{ formatLimit(tier.scans_per_month) }}
                </td>
              </tr>
              <tr class="border-b border-gray-100">
                <td class="py-4 px-4 text-gray-700">Website analyses</td>
                <td v-for="tier in tiers" :key="tier.id" class="py-4 px-4 text-center" :class="tier.is_popular ? 'font-medium text-gray-900' : 'text-gray-600'">
                  {{ formatLimit(tier.website_analyses_limit) }}
                </td>
              </tr>
              <tr>
                <td class="py-4 px-4 text-gray-700">Support</td>
                <td class="py-4 px-4 text-center text-gray-600">Community</td>
                <td class="py-4 px-4 text-center font-medium text-gray-900">Email</td>
                <td class="py-4 px-4 text-center font-medium text-gray-900">Priority</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-16 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          <p class="text-gray-600">Everything you need to know about our pricing</p>
        </div>

        <div class="max-w-3xl mx-auto space-y-4">
          <div class="bg-white rounded-xl p-6 border border-gray-200">
            <h3 class="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h3>
            <p class="text-gray-600">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges.</p>
          </div>
          <div class="bg-white rounded-xl p-6 border border-gray-200">
            <h3 class="font-semibold text-gray-900 mb-2">What happens when I hit my limit on the free plan?</h3>
            <p class="text-gray-600">You'll see a prompt to upgrade. Your existing data is always safe, and you can upgrade instantly to continue using the platform.</p>
          </div>
          <div class="bg-white rounded-xl p-6 border border-gray-200">
            <h3 class="font-semibold text-gray-900 mb-2">Do you offer annual billing?</h3>
            <p class="text-gray-600">Yes! Annual billing saves you ~17% (pay for 10 months, get 12). Just toggle to "Yearly" at the top of this page to see annual pricing.</p>
          </div>
          <div class="bg-white rounded-xl p-6 border border-gray-200">
            <h3 class="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
            <p class="text-gray-600">We accept all major credit cards through our secure payment provider Stripe. Enterprise customers can also pay by invoice.</p>
          </div>
          <div class="bg-white rounded-xl p-6 border border-gray-200">
            <h3 class="font-semibold text-gray-900 mb-2">Is there a money-back guarantee?</h3>
            <p class="text-gray-600">Yes! If you're not satisfied within the first 14 days, contact us for a full refund. No questions asked.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-16 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to improve your AI visibility?
        </h2>
        <p class="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Start free today and see how Columbus can help you get discovered by AI.
        </p>
        <NuxtLink
          v-if="!user"
          to="/auth/signup"
          class="inline-flex items-center gap-2 bg-gradient-to-r from-brand to-yellow-500 text-white px-8 py-4 rounded-xl font-medium shadow-xl hover:shadow-brand/30 hover:scale-105 transition-all"
        >
          Get Started Free
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </NuxtLink>
        <NuxtLink
          v-else
          to="/dashboard"
          class="inline-flex items-center gap-2 bg-gradient-to-r from-brand to-yellow-500 text-white px-8 py-4 rounded-xl font-medium shadow-xl hover:shadow-brand/30 hover:scale-105 transition-all"
        >
          Go to Dashboard
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </NuxtLink>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-400 py-8">
      <div class="container mx-auto px-4">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <img src="/brand/logo_text_bright.png" alt="Columbus" class="h-8" />
          <div class="flex items-center gap-6 text-sm">
            <NuxtLink to="/privacy" class="hover:text-white transition-colors">Privacy</NuxtLink>
            <NuxtLink to="/terms" class="hover:text-white transition-colors">Terms</NuxtLink>
            <NuxtLink to="/impressum" class="hover:text-white transition-colors">Impressum</NuxtLink>
            <span>&copy; {{ new Date().getFullYear() }} Columbus</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { createCheckout, createPortal } = useEdgeFunctions()
const { tiers, loading, fetchTiers, formatPrice, getMonthlyEquivalent, formatLimit, getIconSvg } = useSubscriptionTiers()

const upgrading = ref(false)
const currentPlan = ref<string>('free')
const billingPeriod = ref<'monthly' | 'yearly'>('monthly')

// Load subscription tiers and current plan
onMounted(async () => {
  await fetchTiers()

  if (user.value) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, active_organization_id')
      .eq('id', user.value.id)
      .single()

    const orgId = profile?.active_organization_id || profile?.organization_id

    if (orgId) {
      const { data: org } = await supabase
        .from('organizations')
        .select('plan')
        .eq('id', orgId)
        .single()

      currentPlan.value = org?.plan || 'free'
    }
  }
})

const handleUpgrade = async (planId: string) => {
  if (!user.value) {
    navigateTo(`/auth/signup?plan=${planId}&billing=${billingPeriod.value}`)
    return
  }

  upgrading.value = true

  try {
    // If already on a paid plan, open billing portal
    if (currentPlan.value !== 'free') {
      const result = await createPortal()
      if (result.url) {
        window.location.href = result.url
      }
    } else {
      // Create checkout session for new subscription
      const result = await createCheckout(planId, billingPeriod.value)
      if (result.url) {
        window.location.href = result.url
      }
    }
  } catch (e: any) {
    console.error('Upgrade error:', e)
    alert(e.message || 'Failed to process upgrade. Please try again.')
  } finally {
    upgrading.value = false
  }
}

// SEO setup with OG and Twitter tags
const { setupSeo } = usePageSeo({
  title: 'Pricing - Columbus | Free AI Engine Optimization Platform',
  description: 'Simple, transparent pricing for Columbus. Start free forever and upgrade as your needs grow. No hidden fees, cancel anytime.',
  canonicalPath: '/pricing',
})
setupSeo()

// Software schema for pricing page
const { injectSchema } = useSoftwareSchema()
injectSchema()
</script>
