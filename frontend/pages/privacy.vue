<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <nav class="bg-white shadow-sm">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <NuxtLink to="/" class="text-xl font-bold brand-text">Columbus</NuxtLink>
      </div>
    </nav>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
      <p class="text-gray-600 mb-8">Last updated: {{ new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}</p>

      <div class="prose prose-gray max-w-none">
        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
          <p class="text-gray-600 mb-4">
            Columbus ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI visibility optimization platform.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>

          <h3 class="text-xl font-medium text-gray-800 mb-3">2.1 Information You Provide</h3>
          <ul class="list-disc list-inside text-gray-600 mb-4 space-y-2">
            <li><strong>Account Information:</strong> Email address, company name, website URL</li>
            <li><strong>Profile Information:</strong> Business description, industry category</li>
            <li><strong>Payment Information:</strong> Billing details (processed securely through Stripe)</li>
            <li><strong>Content:</strong> Custom prompts and search queries you create</li>
          </ul>

          <h3 class="text-xl font-medium text-gray-800 mb-3">2.2 Information Collected Automatically</h3>
          <ul class="list-disc list-inside text-gray-600 mb-4 space-y-2">
            <li><strong>Usage Data:</strong> How you interact with our platform</li>
            <li><strong>Device Information:</strong> Browser type, operating system, device type</li>
            <li><strong>Log Data:</strong> IP address, access times, pages viewed</li>
            <li><strong>Scan Results:</strong> AI visibility scores and citation data</li>
          </ul>

          <h3 class="text-xl font-medium text-gray-800 mb-3">2.3 Website Analysis Data</h3>
          <p class="text-gray-600 mb-4">
            When you provide your website URL, we crawl and analyze publicly available information including:
          </p>
          <ul class="list-disc list-inside text-gray-600 mb-4 space-y-2">
            <li>Page content and structure</li>
            <li>Technical SEO elements</li>
            <li>Schema markup</li>
            <li>Meta information</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
          <ul class="list-disc list-inside text-gray-600 mb-4 space-y-2">
            <li>To provide and maintain our services</li>
            <li>To analyze your website and generate AI visibility recommendations</li>
            <li>To create and manage your account</li>
            <li>To process payments and manage subscriptions</li>
            <li>To send you important updates and notifications</li>
            <li>To improve our platform and develop new features</li>
            <li>To respond to your inquiries and provide customer support</li>
            <li>To detect and prevent fraud or abuse</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">4. Data Sharing and Disclosure</h2>
          <p class="text-gray-600 mb-4">We do not sell your personal information. We may share your data with:</p>
          <ul class="list-disc list-inside text-gray-600 mb-4 space-y-2">
            <li><strong>Service Providers:</strong> Third-party services that help us operate (Stripe for payments, Supabase for database, OpenAI/Anthropic for AI analysis)</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
          <p class="text-gray-600 mb-4">
            We implement appropriate technical and organizational measures to protect your data, including:
          </p>
          <ul class="list-disc list-inside text-gray-600 mb-4 space-y-2">
            <li>Encryption of data in transit (TLS) and at rest</li>
            <li>Secure authentication and access controls</li>
            <li>Regular security assessments</li>
            <li>Row-level security for multi-tenant data isolation</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
          <p class="text-gray-600 mb-4">
            We retain your data for as long as your account is active or as needed to provide services. You can request deletion of your data at any time by contacting us or using the account deletion feature.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
          <p class="text-gray-600 mb-4">Depending on your location, you may have the following rights:</p>
          <ul class="list-disc list-inside text-gray-600 mb-4 space-y-2">
            <li>Access and download your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to or restrict processing</li>
            <li>Data portability</li>
            <li>Withdraw consent</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">8. Cookies</h2>
          <p class="text-gray-600 mb-4">
            We use essential cookies to maintain your session and provide our services. We do not use tracking cookies for advertising purposes.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
          <p class="text-gray-600 mb-4">
            Our services are not directed to individuals under 18. We do not knowingly collect personal information from children.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
          <p class="text-gray-600 mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
          <p class="text-gray-600 mb-4">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p class="text-gray-600">
            <strong>Email:</strong> privacy@columbus-aeo.com
          </p>
        </section>
      </div>

      <div class="mt-12 pt-8 border-t">
        <NuxtLink to="/" class="text-brand hover:opacity-80">
          &larr; Back to Home
        </NuxtLink>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})
</script>
