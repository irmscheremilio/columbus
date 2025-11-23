<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <header class="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600">
      <nav class="container mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <div class="text-2xl font-bold text-white">Columbus</div>
          <div class="flex items-center gap-4">
            <NuxtLink to="/auth/login" class="text-white hover:text-primary-100">
              Sign In
            </NuxtLink>
            <NuxtLink to="/auth/signup" class="btn btn-primary bg-white text-primary-700 hover:bg-gray-100">
              Start Free Audit
            </NuxtLink>
          </div>
        </div>
      </nav>

      <div class="container mx-auto px-4 py-20 text-center">
        <h1 class="text-5xl md:text-6xl font-bold text-white mb-6">
          Get Found by AI.<br />
          <span class="text-primary-200">Not Just Google.</span>
        </h1>
        <p class="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
          The first AEO platform that doesn't just show problems—it tells you exactly how to fix them.
          Optimize your visibility in ChatGPT, Claude, Gemini, and Perplexity.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            @click="showWaitlistModal = true"
            class="btn btn-primary bg-white text-primary-700 hover:bg-gray-100 px-8 py-4 text-lg"
          >
            Get Free AEO Audit
          </button>
          <a
            href="#how-it-works"
            class="btn btn-outline border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
          >
            See How It Works
          </a>
        </div>

        <div class="flex items-center justify-center gap-8 text-primary-100">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>No credit card required</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>5-minute setup</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Social Proof -->
    <section class="py-12 bg-gray-100">
      <div class="container mx-auto px-4">
        <p class="text-center text-gray-600 mb-8">Trusted by innovative companies</p>
        <div class="flex flex-wrap justify-center items-center gap-12 opacity-60">
          <!-- Placeholder for company logos -->
          <div class="text-2xl font-bold text-gray-400">Company 1</div>
          <div class="text-2xl font-bold text-gray-400">Company 2</div>
          <div class="text-2xl font-bold text-gray-400">Company 3</div>
          <div class="text-2xl font-bold text-gray-400">Company 4</div>
        </div>
      </div>
    </section>

    <!-- Problem/Solution -->
    <section class="py-20 bg-white">
      <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-3xl font-bold text-center mb-12">
            SEO Is Dead. Long Live AEO.
          </h2>

          <div class="grid md:grid-cols-2 gap-8 mb-12">
            <div class="card border-red-200 bg-red-50">
              <h3 class="text-xl font-bold text-red-900 mb-4">The Problem</h3>
              <ul class="space-y-3 text-red-800">
                <li class="flex items-start gap-2">
                  <span class="text-red-500 font-bold">✗</span>
                  <span>60% of searches now happen in AI chatbots</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-red-500 font-bold">✗</span>
                  <span>Your competitors are being recommended, you're not</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-red-500 font-bold">✗</span>
                  <span>Other tools just show problems, not solutions</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-red-500 font-bold">✗</span>
                  <span>You need a developer to implement fixes</span>
                </li>
              </ul>
            </div>

            <div class="card border-green-200 bg-green-50">
              <h3 class="text-xl font-bold text-green-900 mb-4">The Solution</h3>
              <ul class="space-y-3 text-green-800">
                <li class="flex items-start gap-2">
                  <span class="text-green-500 font-bold">✓</span>
                  <span>Track your visibility across all major AI engines</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-green-500 font-bold">✓</span>
                  <span>See exactly where competitors beat you and why</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-green-500 font-bold">✓</span>
                  <span>Get step-by-step implementation guides</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-green-500 font-bold">✓</span>
                  <span>Copy-paste code snippets for your platform</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section id="how-it-works" class="py-20 bg-gray-50">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-16">How It Works</h2>

        <div class="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold text-primary-600">1</span>
            </div>
            <h3 class="text-xl font-bold mb-3">Scan Your Visibility</h3>
            <p class="text-gray-600">
              We test 50+ prompts across ChatGPT, Claude, Gemini, and Perplexity to see if your brand appears.
            </p>
          </div>

          <div class="text-center">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold text-primary-600">2</span>
            </div>
            <h3 class="text-xl font-bold mb-3">Find Your Gaps</h3>
            <p class="text-gray-600">
              Discover where competitors appear but you don't. Understand why with automated gap analysis.
            </p>
          </div>

          <div class="text-center">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold text-primary-600">3</span>
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
    <section class="py-20 bg-white">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-16">Everything You Need to Win in AI</h2>

        <div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <div class="card">
            <h3 class="text-xl font-bold mb-3">Multi-Engine Monitoring</h3>
            <p class="text-gray-600">
              Track your visibility across ChatGPT, Claude, Gemini, and Perplexity. Weekly automated scans keep you updated.
            </p>
          </div>

          <div class="card">
            <h3 class="text-xl font-bold mb-3">Competitive Intelligence</h3>
            <p class="text-gray-600">
              See how you stack up against competitors. Identify gaps and opportunities before they do.
            </p>
          </div>

          <div class="card">
            <h3 class="text-xl font-bold mb-3">Platform-Specific Guides</h3>
            <p class="text-gray-600">
              WordPress, Shopify, Webflow, or custom? Get tailored implementation guides for your exact setup.
            </p>
          </div>

          <div class="card">
            <h3 class="text-xl font-bold mb-3">Schema Markup Generator</h3>
            <p class="text-gray-600">
              Auto-generate structured data that AI engines love. Copy-paste code snippets included.
            </p>
          </div>

          <div class="card">
            <h3 class="text-xl font-bold mb-3">ROI Calculator</h3>
            <p class="text-gray-600">
              Justify your investment with estimated traffic increases and visibility improvements.
            </p>
          </div>

          <div class="card">
            <h3 class="text-xl font-bold mb-3">Weekly Reports</h3>
            <p class="text-gray-600">
              Automated reports show your progress. Perfect for sharing with stakeholders.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section class="py-20 bg-gray-50">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
        <p class="text-center text-gray-600 mb-16">Start free, upgrade when you're ready</p>

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
              class="btn btn-outline w-full"
            >
              Start Free Audit
            </button>
          </div>

          <!-- Pro Plan -->
          <div class="card border-2 border-primary-600 relative">
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-bold">
              Most Popular
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
              class="btn btn-primary w-full"
            >
              Get Started
            </button>
          </div>

          <!-- Agency Plan -->
          <div class="card border-2">
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
              class="btn btn-outline w-full"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-20 bg-gradient-to-br from-primary-600 to-secondary-600 text-white">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-4xl font-bold mb-6">
          Ready to Dominate AI Search?
        </h2>
        <p class="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
          Get your free AEO audit today. See exactly where you rank in AI engines and get your first 3 fix recommendations.
        </p>
        <button
          @click="showWaitlistModal = true"
          class="btn btn-primary bg-white text-primary-700 hover:bg-gray-100 px-8 py-4 text-lg"
        >
          Start Your Free Audit
        </button>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-400 py-12">
      <div class="container mx-auto px-4">
        <div class="grid md:grid-cols-4 gap-8">
          <div>
            <div class="text-white font-bold text-xl mb-4">Columbus</div>
            <p class="text-sm">
              The first AEO platform that actually fixes your visibility in AI engines.
            </p>
          </div>
          <div>
            <h4 class="text-white font-bold mb-4">Product</h4>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="hover:text-white">Features</a></li>
              <li><a href="#" class="hover:text-white">Pricing</a></li>
              <li><a href="#" class="hover:text-white">Case Studies</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-white font-bold mb-4">Resources</h4>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="hover:text-white">Blog</a></li>
              <li><a href="#" class="hover:text-white">Documentation</a></li>
              <li><a href="#" class="hover:text-white">AEO Guide</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-white font-bold mb-4">Company</h4>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="hover:text-white">About</a></li>
              <li><a href="#" class="hover:text-white">Privacy</a></li>
              <li><a href="#" class="hover:text-white">Terms</a></li>
            </ul>
          </div>
        </div>
        <div class="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
          &copy; 2024 Columbus. All rights reserved.
        </div>
      </div>
    </footer>

    <!-- Waitlist Modal -->
    <div
      v-if="showWaitlistModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="showWaitlistModal = false"
    >
      <div class="bg-white rounded-lg p-8 max-w-md w-full">
        <h3 class="text-2xl font-bold mb-4">Get Your Free AEO Audit</h3>
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
              class="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary flex-1"
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
