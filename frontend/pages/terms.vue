<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <nav class="bg-white shadow-sm">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <NuxtLink to="/" class="text-xl font-bold brand-text">Columbus</NuxtLink>
      </div>
    </nav>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
      <p class="text-gray-600 mb-8">Last updated: {{ new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}</p>

      <div class="prose prose-gray max-w-none">
        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
          <p class="text-gray-600 mb-4">
            By accessing or using Columbus ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
          <p class="text-gray-600 mb-4">
            Columbus is an AI-powered visibility optimization platform that helps businesses improve their presence in AI-generated responses across platforms like ChatGPT, Claude, Perplexity, and Gemini. Our services include:
          </p>
          <ul class="list-disc list-inside text-gray-600 mb-4 space-y-2">
            <li>Website analysis and AEO (Answer Engine Optimization) assessment</li>
            <li>AI visibility scanning across multiple platforms</li>
            <li>Competitor analysis and gap identification</li>
            <li>Actionable recommendations for improving AI visibility</li>
            <li>Performance tracking and reporting</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">3. Account Registration</h2>
          <p class="text-gray-600 mb-4">To use our Service, you must:</p>
          <ul class="list-disc list-inside text-gray-600 mb-4 space-y-2">
            <li>Provide accurate and complete registration information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Promptly update any changes to your information</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Be at least 18 years old or have legal authority to enter into this agreement</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">4. Subscription and Payment</h2>

          <h3 class="text-xl font-medium text-gray-800 mb-3">4.1 Plans and Pricing</h3>
          <p class="text-gray-600 mb-4">
            We offer Free and Pro subscription plans. Plan features and pricing are subject to change. Current pricing is available on our website.
          </p>

          <h3 class="text-xl font-medium text-gray-800 mb-3">4.2 Billing</h3>
          <p class="text-gray-600 mb-4">
            Pro subscriptions are billed monthly or annually in advance. All payments are processed securely through Stripe. You authorize us to charge your payment method for all subscription fees.
          </p>

          <h3 class="text-xl font-medium text-gray-800 mb-3">4.3 Cancellation and Refunds</h3>
          <p class="text-gray-600 mb-4">
            You may cancel your subscription at any time through your account settings or the Stripe billing portal. Cancellation takes effect at the end of your current billing period. We do not provide refunds for partial billing periods.
          </p>

          <h3 class="text-xl font-medium text-gray-800 mb-3">4.4 Free Trial</h3>
          <p class="text-gray-600 mb-4">
            If we offer a free trial, you will not be charged until the trial period ends. Cancel before the trial ends to avoid charges.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">5. Acceptable Use</h2>
          <p class="text-gray-600 mb-4">You agree not to:</p>
          <ul class="list-disc list-inside text-gray-600 mb-4 space-y-2">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Use automated systems to excessively load our infrastructure</li>
            <li>Resell or redistribute the Service without authorization</li>
            <li>Upload malicious code or attempt to exploit vulnerabilities</li>
            <li>Violate the intellectual property rights of others</li>
            <li>Use the Service to analyze competitors' websites without authorization</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>

          <h3 class="text-xl font-medium text-gray-800 mb-3">6.1 Our Property</h3>
          <p class="text-gray-600 mb-4">
            The Service, including its original content, features, and functionality, is owned by Columbus and protected by intellectual property laws. This includes our proprietary algorithms, analysis methods, and recommendations.
          </p>

          <h3 class="text-xl font-medium text-gray-800 mb-3">6.2 Your Content</h3>
          <p class="text-gray-600 mb-4">
            You retain ownership of any content you provide (e.g., website URLs, business descriptions, custom prompts). By using our Service, you grant us a license to use this content to provide and improve our services.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">7. Third-Party Services</h2>
          <p class="text-gray-600 mb-4">
            Our Service integrates with third-party AI platforms (OpenAI, Anthropic, Google, Perplexity) to perform visibility scans. Your use of these services is also subject to their respective terms. We are not responsible for the content, accuracy, or availability of third-party AI responses.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">8. Disclaimer of Warranties</h2>
          <p class="text-gray-600 mb-4">
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p class="text-gray-600 mb-4">We do not guarantee:</p>
          <ul class="list-disc list-inside text-gray-600 mb-4 space-y-2">
            <li>That the Service will be uninterrupted or error-free</li>
            <li>The accuracy of AI visibility scores or recommendations</li>
            <li>That implementing our recommendations will improve your AI visibility</li>
            <li>Specific results from using the Service</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
          <p class="text-gray-600 mb-4">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, COLUMBUS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
          </p>
          <p class="text-gray-600 mb-4">
            Our total liability shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">10. Indemnification</h2>
          <p class="text-gray-600 mb-4">
            You agree to indemnify and hold harmless Columbus and its affiliates from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
          <p class="text-gray-600 mb-4">
            We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
          </p>
          <p class="text-gray-600 mb-4">
            Upon termination, your right to use the Service will cease immediately. We may delete your data in accordance with our Privacy Policy.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
          <p class="text-gray-600 mb-4">
            We reserve the right to modify these Terms at any time. We will provide notice of significant changes via email or through the Service. Your continued use after changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
          <p class="text-gray-600 mb-4">
            These Terms shall be governed by the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">14. Dispute Resolution</h2>
          <p class="text-gray-600 mb-4">
            Any disputes arising from these Terms will be resolved through binding arbitration in accordance with the American Arbitration Association rules, except that either party may seek injunctive relief in court.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">15. Contact</h2>
          <p class="text-gray-600 mb-4">
            If you have any questions about these Terms, please contact us at:
          </p>
          <p class="text-gray-600">
            <strong>Email:</strong> legal@columbus-aeo.com
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
