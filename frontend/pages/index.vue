<template>
  <div class="min-h-screen bg-background">
    <!-- Hero Section -->
    <header class="bg-background border-b border-border">
      <nav class="container mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <img src="/brand/logo_text.png" alt="Columbus" class="h-10" />
          <div class="flex items-center gap-4">
            <NuxtLink to="/auth/login" class="text-gray-700 hover:text-brand transition-colors">
              Sign In
            </NuxtLink>
            <NuxtLink to="/auth/signup" class="btn-primary">
              Start Free Audit
            </NuxtLink>
          </div>
        </div>
      </nav>

      <div class="container mx-auto px-4 py-20 text-center">
        <h1 class="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
          Get <span class="brand-text">Discovered</span> by AI
        </h1>
        <p class="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          The first AEO platform that doesn't just show problems—it tells you exactly how to fix them.
          Optimize your visibility in ChatGPT, Claude, Gemini, and Perplexity.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            @click="showWaitlistModal = true"
            class="btn-primary px-8 py-4 text-lg"
          >
            Get Free AEO Audit
          </button>
          <a
            href="#how-it-works"
            class="btn-outline px-8 py-4 text-lg"
          >
            See How It Works
          </a>
        </div>

        <div class="flex items-center justify-center gap-8 text-gray-500 text-sm">
          <div class="flex items-center gap-2">
            <span class="text-brand">✓</span>
            <span>No credit card required</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-brand">✓</span>
            <span>5-minute setup</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Social Proof -->
    <section class="py-12 bg-background">
      <div class="container mx-auto px-4">
        <p class="text-center text-gray-500 mb-8 text-sm">Join 500+ marketers optimizing for AI search</p>
      </div>
    </section>

    <!-- Problem/Solution -->
    <section class="py-20 bg-background">
      <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-4xl font-bold text-center mb-4">
            The <span class="brand-text">Problem</span>
          </h2>
          <p class="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Your competitors are getting recommended by AI. You're not.
          </p>

          <div class="grid md:grid-cols-3 gap-6">
            <div class="card-highlight">
              <!-- Layered icon container -->
              <div class="w-[70px] h-[70px] rounded-[20px] p-2 mb-4 flex items-center justify-center" style="background: linear-gradient(rgba(242, 153, 1, 0.1) 0%, rgba(242, 153, 1, 0.2) 100%); box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);">
                <div class="w-[54px] h-[54px] rounded-[15px] bg-white flex items-center justify-center shadow-sm">
                  <svg class="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </div>
              </div>
              <h3 class="text-xl font-bold mb-3">Invisible to AI</h3>
              <p class="text-gray-600">
                Your brand doesn't appear in ChatGPT, Claude, or Perplexity responses—even when you should.
              </p>
            </div>

            <div class="card-highlight">
              <div class="w-[70px] h-[70px] rounded-[20px] p-2 mb-4 flex items-center justify-center" style="background: linear-gradient(rgba(242, 153, 1, 0.1) 0%, rgba(242, 153, 1, 0.2) 100%); box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);">
                <div class="w-[54px] h-[54px] rounded-[15px] bg-white flex items-center justify-center shadow-sm">
                  <svg class="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 class="text-xl font-bold mb-3">No Clear Solution</h3>
              <p class="text-gray-600">
                Other tools show problems but don't tell you how to fix them. You need actionable steps.
              </p>
            </div>

            <div class="card-highlight">
              <div class="w-[70px] h-[70px] rounded-[20px] p-2 mb-4 flex items-center justify-center" style="background: linear-gradient(rgba(242, 153, 1, 0.1) 0%, rgba(242, 153, 1, 0.2) 100%); box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);">
                <div class="w-[54px] h-[54px] rounded-[15px] bg-white flex items-center justify-center shadow-sm">
                  <svg class="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 class="text-xl font-bold mb-3">Expensive Tools</h3>
              <p class="text-gray-600">
                Enterprise AEO tools cost $500+/month. Cheap tools are useless. There's no middle ground.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section id="how-it-works" class="py-20 bg-background">
      <div class="container mx-auto px-4">
        <h2 class="text-4xl font-bold text-center mb-4">
          How <span class="brand-text">Columbus</span> Works
        </h2>
        <p class="text-xl text-gray-600 text-center mb-16 max-w-2xl mx-auto">
          Monitor + Optimize + Implement = Real Results
        </p>

        <div class="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          <div class="card-highlight text-center">
            <div class="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold text-brand">1</span>
            </div>
            <h3 class="text-xl font-bold mb-3">Scan Your Visibility</h3>
            <p class="text-gray-600">
              We test 50+ prompts across ChatGPT, Claude, Gemini, and Perplexity to see if your brand appears.
            </p>
          </div>

          <div class="card-highlight text-center">
            <div class="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold text-brand">2</span>
            </div>
            <h3 class="text-xl font-bold mb-3">Find Your Gaps</h3>
            <p class="text-gray-600">
              Discover where competitors appear but you don't. Understand why with automated gap analysis.
            </p>
          </div>

          <div class="card-highlight text-center">
            <div class="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold text-brand">3</span>
            </div>
            <h3 class="text-xl font-bold mb-3">Implement Fixes</h3>
            <p class="text-gray-600">
              Get platform-specific guides with code snippets. No guessing, no technical knowledge required.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-20 bg-background">
      <div class="container mx-auto px-4">
        <h2 class="text-4xl font-bold text-center mb-16">
          Everything You Need to <span class="brand-text">Win</span> in AI
        </h2>

        <div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <div class="card-highlight">
            <h3 class="text-xl font-bold mb-3">Multi-Engine Monitoring</h3>
            <p class="text-gray-600">
              Track your visibility across ChatGPT, Claude, Gemini, and Perplexity. Weekly automated scans keep you updated.
            </p>
          </div>

          <div class="card-highlight">
            <h3 class="text-xl font-bold mb-3">Competitive Intelligence</h3>
            <p class="text-gray-600">
              See how you stack up against competitors. Identify gaps and opportunities before they do.
            </p>
          </div>

          <div class="card-highlight">
            <h3 class="text-xl font-bold mb-3">Platform-Specific Guides</h3>
            <p class="text-gray-600">
              WordPress, Shopify, Webflow, or custom? Get tailored implementation guides for your exact setup.
            </p>
          </div>

          <div class="card-highlight">
            <h3 class="text-xl font-bold mb-3">Schema Markup Generator</h3>
            <p class="text-gray-600">
              Auto-generate structured data that AI engines love. Copy-paste code snippets included.
            </p>
          </div>

          <div class="card-highlight">
            <h3 class="text-xl font-bold mb-3">ROI Calculator</h3>
            <p class="text-gray-600">
              Justify your investment with estimated traffic increases and visibility improvements.
            </p>
          </div>

          <div class="card-highlight">
            <h3 class="text-xl font-bold mb-3">Weekly Reports</h3>
            <p class="text-gray-600">
              Automated reports show your progress. Perfect for sharing with stakeholders.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section class="py-20 bg-background">
      <div class="container mx-auto px-4">
        <h2 class="text-4xl font-bold text-center mb-4">
          Simple <span class="brand-text">Pricing</span>
        </h2>
        <p class="text-center text-gray-600 mb-16 text-xl">Start free, upgrade when you're ready</p>

        <div class="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <!-- Free Plan -->
          <div class="card border-2">
            <h3 class="text-2xl font-bold mb-2">Free</h3>
            <div class="mb-6">
              <span class="text-4xl font-bold">$0</span>
            </div>
            <ul class="space-y-3 mb-8">
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>One-time AEO audit</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>Top 3 fix recommendations</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>Basic reporting</span>
              </li>
            </ul>
            <button
              @click="showWaitlistModal = true"
              class="btn-outline w-full"
            >
              Start Free Audit
            </button>
          </div>

          <!-- Pro Plan -->
          <div class="card-highlight ring-2 ring-brand relative">
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-white px-4 py-1 rounded-full text-sm font-bold">
              MOST POPULAR
            </div>
            <h3 class="text-2xl font-bold mb-2">Pro</h3>
            <div class="mb-6">
              <span class="text-4xl font-bold">$79</span>
              <span class="text-gray-600">/month</span>
            </div>
            <ul class="space-y-3 mb-8">
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>Weekly automated monitoring</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>All 4 AI engines</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>Unlimited fix recommendations</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>Track up to 10 competitors</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>Implementation guides</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>Email support</span>
              </li>
            </ul>
            <button
              @click="showWaitlistModal = true"
              class="btn-primary w-full"
            >
              Get Started
            </button>
          </div>

          <!-- Agency Plan -->
          <div class="card">
            <h3 class="text-2xl font-bold mb-2">Agency</h3>
            <div class="mb-6">
              <span class="text-4xl font-bold">$199</span>
              <span class="text-gray-600">/month</span>
            </div>
            <ul class="space-y-3 mb-8">
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>Everything in Pro</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>Manage 5 client accounts</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>White-label reports</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>Priority support</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>API access</span>
              </li>
            </ul>
            <button
              @click="showWaitlistModal = true"
              class="btn-outline w-full"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-20 bg-background border-y border-border">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-4xl font-bold mb-6">
          Ready to <span class="brand-text">Dominate</span> AI Search?
        </h2>
        <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Get your free AEO audit today. See exactly where you rank in AI engines and get your first 3 fix recommendations.
        </p>
        <button
          @click="showWaitlistModal = true"
          class="btn-primary px-8 py-4 text-lg"
        >
          Start Your Free Audit
        </button>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-background text-gray-600 py-12 border-t border-border">
      <div class="container mx-auto px-4">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <div class="flex items-center gap-3">
            <img src="/brand/logo_notext.png" alt="Columbus" class="h-8" />
            <span class="text-gray-600">&copy; 2024 Columbus. All rights reserved.</span>
          </div>
          <div class="flex gap-6 text-sm">
            <a href="#" class="hover:text-brand transition-colors">Privacy</a>
            <a href="#" class="hover:text-brand transition-colors">Terms</a>
            <a href="#" class="hover:text-brand transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>

    <!-- Waitlist Modal -->
    <div
      v-if="showWaitlistModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="showWaitlistModal = false"
    >
      <div class="bg-background-highlight rounded-lg p-8 max-w-md w-full border border-border">
        <h3 class="text-2xl font-bold mb-4">
          Get Your Free <span class="brand-text">AEO Audit</span>
        </h3>
        <p class="text-gray-600 mb-6">
          Enter your details and we'll send you a comprehensive AEO audit within 24 hours.
        </p>
        <form @submit.prevent="submitWaitlist" class="space-y-4">
          <div>
            <label class="label">Email</label>
            <input
              v-model="waitlistForm.email"
              type="email"
              required
              class="input"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label class="label">Company Name (Optional)</label>
            <input
              v-model="waitlistForm.companyName"
              type="text"
              class="input"
              placeholder="Your Company"
            />
          </div>
          <div>
            <label class="label">Website (Optional)</label>
            <input
              v-model="waitlistForm.website"
              type="url"
              class="input"
              placeholder="https://yourwebsite.com"
            />
          </div>
          <div class="flex gap-3">
            <button
              type="button"
              @click="showWaitlistModal = false"
              class="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn-primary flex-1"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Submitting...' : 'Get Free Audit' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const showWaitlistModal = ref(false)
const isSubmitting = ref(false)
const waitlistForm = ref({
  email: '',
  companyName: '',
  website: ''
})

const submitWaitlist = async () => {
  isSubmitting.value = true
  const supabase = useSupabaseClient()

  try {
    // Call edge function to handle waitlist + email
    const { data, error } = await supabase.functions.invoke('waitlist', {
      body: {
        email: waitlistForm.value.email,
        companyName: waitlistForm.value.companyName,
        website: waitlistForm.value.website,
      }
    })

    if (error) throw error

    alert('Thank you! Check your email for your free AEO audit.')
    showWaitlistModal.value = false
    waitlistForm.value = { email: '', companyName: '', website: '' }
  } catch (error) {
    console.error('Waitlist error:', error)
    alert('Something went wrong. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

useHead({
  title: 'Columbus - AI Engine Optimization Platform | Get Found by ChatGPT, Claude & More',
  meta: [
    {
      name: 'description',
      content: 'Optimize your visibility in AI chatbots like ChatGPT, Claude, Gemini, and Perplexity. Get actionable fix recommendations with platform-specific implementation guides.'
    }
  ]
})
</script>
