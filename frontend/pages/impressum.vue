<template>
  <div class="min-h-screen bg-gray-950">
    <CookieBanner />
    <div class="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-white mb-4">
          {{ lang === 'de' ? 'Impressum' : 'Legal Notice' }}
        </h1>
        <p class="text-lg text-gray-400">
          {{ lang === 'de' ? 'Angaben gemäß § 5 TMG' : 'Information according to § 5 TMG (German Telemedia Act)' }}
        </p>
      </div>

      <!-- Language Toggle -->
      <div class="flex justify-center mb-8">
        <div class="inline-flex rounded-lg border border-gray-700 bg-gray-900 p-1">
          <button
            @click="lang = 'de'"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              lang === 'de'
                ? 'bg-brand text-white'
                : 'text-gray-400 hover:text-white'
            ]"
          >
            Deutsch
          </button>
          <button
            @click="lang = 'en'"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              lang === 'en'
                ? 'bg-brand text-white'
                : 'text-gray-400 hover:text-white'
            ]"
          >
            English
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="bg-gray-900 rounded-lg shadow-sm border border-gray-700 p-8">
        <!-- German Version -->
        <div v-if="lang === 'de'" class="prose prose-lg max-w-none prose-invert">
          <h2 class="text-2xl font-bold text-white mb-6">Angaben gemäß § 5 TMG</h2>

          <div class="mb-8">
            <h3 class="text-xl font-semibold text-white mb-3">Diensteanbieter</h3>
            <p class="text-gray-300 leading-relaxed">
              {{ company.legalName }}<br>
              {{ company.address.street }}<br>
              {{ company.address.zip }} {{ company.address.city }}<br>
              {{ company.address.country }}
            </p>
          </div>

          <div class="mb-8">
            <h3 class="text-xl font-semibold text-white mb-3">Kontakt</h3>
            <p class="text-gray-300 leading-relaxed">
              <strong>Telefon:</strong> {{ company.contact.phone }}<br>
              <strong>E-Mail:</strong> <a :href="`mailto:${company.contact.email}`" class="text-brand hover:text-brand/80">{{ company.contact.email }}</a><br>
              <strong>Support:</strong> <a :href="`mailto:${company.contact.support}`" class="text-brand hover:text-brand/80">{{ company.contact.support }}</a>
            </p>
          </div>

          <div class="mb-8">
            <h3 class="text-xl font-semibold text-white mb-3">Umsatzsteuer-ID</h3>
            <p class="text-gray-300 leading-relaxed">
              <strong>Steuernummer:</strong> {{ company.tax.number }}<br>
              <strong>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:</strong><br>
              <span class="text-orange-500 font-medium">
                {{ company.vatIdDisplay }}
              </span>
            </p>
          </div>

          <div class="mb-8">
            <h3 class="text-xl font-semibold text-white mb-3">Zuständiges Finanzamt</h3>
            <p class="text-gray-300 leading-relaxed">
              {{ company.taxOffice.name }}<br>
              {{ company.taxOffice.address.street }}<br>
              {{ company.taxOffice.address.zip }} {{ company.taxOffice.address.city }}
            </p>
          </div>

          <div class="mb-8">
            <h3 class="text-xl font-semibold text-white mb-3">Zuständige Aufsichtsbehörde</h3>
            <p class="text-gray-300 leading-relaxed">
              {{ company.chamber.name }}<br>
              {{ company.chamber.address.street }}<br>
              {{ company.chamber.address.zip }} {{ company.chamber.address.city }}<br>
              {{ company.address.country }}
            </p>
          </div>

          <div class="mb-8">
            <h3 class="text-xl font-semibold text-white mb-3">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h3>
            <p class="text-gray-300 leading-relaxed">
              {{ company.legalName }}<br>
              {{ company.address.street }}<br>
              {{ company.address.zip }} {{ company.address.city }}
            </p>
          </div>

          <div class="mb-8">
            <h3 class="text-xl font-semibold text-white mb-3">EU-Streitschlichtung</h3>
            <p class="text-gray-300 leading-relaxed mb-4">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
            </p>
            <p class="mb-4">
              <a
                :href="company.euDisputeResolution"
                target="_blank"
                rel="noopener noreferrer"
                class="text-brand hover:text-brand/80 underline"
              >
                {{ company.euDisputeResolution }}
              </a>
            </p>
            <p class="text-gray-300 leading-relaxed">
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>
          </div>

          <div class="mb-8">
            <h3 class="text-xl font-semibold text-white mb-3">Verbraucherstreitbeilegung/Universalschlichtungsstelle</h3>
            <p class="text-gray-300 leading-relaxed">
              <strong>Hinweis gemäß § 36 VSBG:</strong><br>
              Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </div>

          <div class="bg-brand/10 border-l-4 border-brand p-6 rounded-r-lg">
            <h3 class="text-lg font-semibold text-brand mb-2">Unternehmensform</h3>
            <p class="text-brand/80">
              {{ company.businessType }} (nicht eingetragener Kaufmann)<br>
              Gewerbeanmeldung: {{ company.registrationDate }}<br>
              Geschäftsbetrieb aufgenommen: {{ company.operationsStartDate }}
            </p>
          </div>
        </div>

        <!-- English Version -->
        <div v-else class="prose prose-lg max-w-none prose-invert">
          <h2 class="text-2xl font-bold text-white mb-6">Legal Notice</h2>

          <div class="mb-8">
            <h3 class="text-xl font-semibold text-white mb-3">Service Provider</h3>
            <p class="text-gray-300 leading-relaxed">
              {{ company.legalName }}<br>
              {{ company.address.street }}<br>
              {{ company.address.zip }} {{ company.address.city }}<br>
              Germany
            </p>
          </div>

          <div class="mb-8">
            <h3 class="text-xl font-semibold text-white mb-3">Contact</h3>
            <p class="text-gray-300 leading-relaxed">
              <strong>Phone:</strong> {{ company.contact.phone }}<br>
              <strong>Email:</strong> <a :href="`mailto:${company.contact.email}`" class="text-brand hover:text-brand/80">{{ company.contact.email }}</a><br>
              <strong>Support:</strong> <a :href="`mailto:${company.contact.support}`" class="text-brand hover:text-brand/80">{{ company.contact.support }}</a>
            </p>
          </div>

          <div class="mb-8">
            <h3 class="text-xl font-semibold text-white mb-3">Tax Information</h3>
            <p class="text-gray-300 leading-relaxed">
              <strong>Tax Number:</strong> {{ company.tax.number }}<br>
              <strong>VAT Identification Number (pursuant to § 27a UStG):</strong><br>
              <span class="text-orange-500 font-medium">
                Applied for, will be added here upon receipt
              </span>
            </p>
          </div>

          <div class="mb-8">
            <h3 class="text-xl font-semibold text-white mb-3">Responsible Tax Office</h3>
            <p class="text-gray-300 leading-relaxed">
              {{ company.taxOffice.name }}<br>
              {{ company.taxOffice.address.street }}<br>
              {{ company.taxOffice.address.zip }} {{ company.taxOffice.address.city }}<br>
              Germany
            </p>
          </div>

          <div class="mb-8">
            <h3 class="text-xl font-semibold text-white mb-3">Supervisory Authority</h3>
            <p class="text-gray-300 leading-relaxed">
              {{ company.chamber.name }} (Chamber of Industry and Commerce)<br>
              {{ company.chamber.address.street }}<br>
              {{ company.chamber.address.zip }} {{ company.chamber.address.city }}<br>
              Germany
            </p>
          </div>

          <div class="mb-8">
            <h3 class="text-xl font-semibold text-white mb-3">Responsible for Content (pursuant to § 55 para. 2 RStV)</h3>
            <p class="text-gray-300 leading-relaxed">
              {{ company.legalName }}<br>
              {{ company.address.street }}<br>
              {{ company.address.zip }} {{ company.address.city }}<br>
              Germany
            </p>
          </div>

          <div class="mb-8">
            <h3 class="text-xl font-semibold text-white mb-3">EU Dispute Resolution</h3>
            <p class="text-gray-300 leading-relaxed mb-4">
              The European Commission provides a platform for online dispute resolution (ODR):
            </p>
            <p class="mb-4">
              <a
                :href="company.euDisputeResolution"
                target="_blank"
                rel="noopener noreferrer"
                class="text-brand hover:text-brand/80 underline"
              >
                {{ company.euDisputeResolution }}
              </a>
            </p>
            <p class="text-gray-300 leading-relaxed">
              Our email address can be found above in the legal notice.
            </p>
          </div>

          <div class="mb-8">
            <h3 class="text-xl font-semibold text-white mb-3">Consumer Dispute Resolution</h3>
            <p class="text-gray-300 leading-relaxed">
              <strong>Note pursuant to § 36 VSBG:</strong><br>
              We are neither willing nor obliged to participate in dispute resolution proceedings before a consumer arbitration board.
            </p>
          </div>

          <div class="bg-brand/10 border-l-4 border-brand p-6 rounded-r-lg">
            <h3 class="text-lg font-semibold text-brand mb-2">Business Entity</h3>
            <p class="text-brand/80">
              Sole Proprietorship ({{ company.businessType }}, unregistered merchant)<br>
              Business Registration: {{ company.registrationDate }}<br>
              Business Operations Commenced: {{ company.operationsStartDate }}
            </p>
          </div>
        </div>
      </div>

      <!-- Footer Links -->
      <div class="mt-8 text-center">
        <div class="flex justify-center space-x-6 text-sm text-gray-400">
          <NuxtLink to="/privacy" class="hover:text-white underline">
            {{ lang === 'de' ? 'Datenschutzerklärung' : 'Privacy Policy' }}
          </NuxtLink>
          <NuxtLink to="/terms" class="hover:text-white underline">
            {{ lang === 'de' ? 'AGB' : 'Terms of Service' }}
          </NuxtLink>
          <NuxtLink to="/" class="hover:text-white underline">
            {{ lang === 'de' ? 'Zurück zur Startseite' : 'Back to Home' }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

const company = useCompanyInfo()
const lang = ref<'de' | 'en'>('en')
const { initConsent } = useCookieConsent()

onMounted(() => {
  initConsent()
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('de')) {
    lang.value = 'de'
  }
})

useHead({
  title: 'Impressum - Columbus',
  meta: [
    { name: 'description', content: 'Legal notice and imprint for Columbus - AI Engine Optimization platform' },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>
