<template>
  <div class="min-h-screen bg-gray-950">
    <CookieBanner />
    <div class="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-white mb-4">
          {{ lang === 'de' ? 'Datenschutzerklärung' : 'Privacy Policy' }}
        </h1>
        <p class="text-lg text-gray-400">
          {{ lang === 'de' ? 'Informationen zur Datenverarbeitung gemäß DSGVO' : 'Information on data processing in accordance with GDPR' }}
        </p>
        <p class="text-sm text-gray-500 mt-2">
          {{ lang === 'de' ? 'Stand: 5. Dezember 2025' : 'Last updated: December 5, 2025' }}
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
        <div v-if="lang === 'de'" class="privacy-content">
          <h2>Verantwortlicher</h2>
          <p>
            {{ company.legalName }}<br>
            {{ company.address.street }}<br>
            {{ company.address.zip }} {{ company.address.city }}<br>
            E-Mail: <a :href="`mailto:${company.contact.email}`">{{ company.contact.email }}</a>
          </p>

          <h2>Übersicht der Verarbeitungen</h2>
          <p>Die nachfolgende Übersicht fasst die Arten der verarbeiteten Daten und die Zwecke ihrer Verarbeitung zusammen.</p>

          <h3>Arten der verarbeiteten Daten</h3>
          <ul>
            <li>Bestandsdaten (z.B. Name, Adresse)</li>
            <li>Kontaktdaten (z.B. E-Mail, Telefonnummern)</li>
            <li>Inhaltsdaten (z.B. Eingaben in Formularen)</li>
            <li>Nutzungsdaten (z.B. besuchte Seiten, Zugriffszeit)</li>
            <li>Meta-/Kommunikationsdaten (z.B. IP-Adressen)</li>
            <li>Zahlungsdaten (z.B. Bankverbindungen, Rechnungen)</li>
          </ul>

          <h3>Zwecke der Verarbeitung</h3>
          <ul>
            <li>Erbringung vertraglicher Leistungen</li>
            <li>Kommunikation</li>
            <li>Sicherheitsmaßnahmen</li>
            <li>Reichweitenmessung</li>
            <li>Verwaltung und Beantwortung von Anfragen</li>
          </ul>

          <h2>Rechtsgrundlagen</h2>
          <p>Im Folgenden erhalten Sie eine Übersicht der Rechtsgrundlagen der DSGVO, auf deren Basis wir personenbezogene Daten verarbeiten:</p>
          <ul>
            <li><strong>Einwilligung (Art. 6 Abs. 1 S. 1 lit. a DSGVO)</strong></li>
            <li><strong>Vertragserfüllung (Art. 6 Abs. 1 S. 1 lit. b DSGVO)</strong></li>
            <li><strong>Rechtliche Verpflichtung (Art. 6 Abs. 1 S. 1 lit. c DSGVO)</strong></li>
            <li><strong>Berechtigte Interessen (Art. 6 Abs. 1 S. 1 lit. f DSGVO)</strong></li>
          </ul>

          <h2>Ihre Rechte</h2>
          <p>Ihnen stehen als Betroffene nach der DSGVO verschiedene Rechte zu:</p>
          <ul>
            <li><strong>Widerspruchsrecht:</strong> Sie haben das Recht, jederzeit gegen die Verarbeitung Widerspruch einzulegen.</li>
            <li><strong>Widerrufsrecht:</strong> Sie haben das Recht, erteilte Einwilligungen jederzeit zu widerrufen.</li>
            <li><strong>Auskunftsrecht:</strong> Sie haben das Recht auf Auskunft über die verarbeiteten Daten.</li>
            <li><strong>Berichtigungsrecht:</strong> Sie haben das Recht auf Berichtigung unrichtiger Daten.</li>
            <li><strong>Löschungsrecht:</strong> Sie haben das Recht auf Löschung Ihrer Daten.</li>
            <li><strong>Beschwerderecht:</strong> Sie haben das Recht auf Beschwerde bei einer Aufsichtsbehörde.</li>
          </ul>

          <h2>Cookies</h2>
          <p>
            Wir verwenden Cookies und ähnliche Technologien, um die Funktionalität unserer Plattform zu gewährleisten.
            Notwendige Cookies werden aufgrund berechtigter Interessen gesetzt. Für Analyse-Cookies holen wir Ihre Einwilligung ein.
          </p>

          <h3>Arten von Cookies</h3>
          <ul>
            <li><strong>Notwendige Cookies:</strong> Diese Cookies sind für den Betrieb der Website erforderlich (z.B. Sitzungsverwaltung, Authentifizierung).</li>
            <li><strong>Analyse-Cookies:</strong> Helfen uns zu verstehen, wie Besucher mit unserer Website interagieren.</li>
            <li><strong>Marketing-Cookies:</strong> Werden verwendet, um personalisierte Werbung anzuzeigen.</li>
          </ul>

          <h3>Cookie-Einstellungen verwalten</h3>
          <p>Sie können Ihre Cookie-Einstellungen jederzeit über den folgenden Button anpassen:</p>
          <button
            @click="resetCookieConsent"
            class="mt-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors text-sm font-medium"
          >
            Cookie-Einstellungen verwalten
          </button>

          <h2>Zahlungsverfahren</h2>
          <p>
            Für Zahlungen nutzen wir den Zahlungsdienstleister Stripe. Die Verarbeitung erfolgt gemäß deren Datenschutzrichtlinien.
          </p>
          <ul>
            <li><strong>Stripe, Inc.</strong> - 510 Townsend Street, San Francisco, CA 94103, USA</li>
            <li>Datenschutzerklärung: <a href="https://stripe.com/de/privacy" target="_blank">https://stripe.com/de/privacy</a></li>
          </ul>

          <h2>Hosting</h2>
          <p>Unsere Plattform wird bei folgenden Anbietern gehostet:</p>
          <ul>
            <li><strong>Supabase:</strong> Datenbank und Backend-Infrastruktur (EU-Region)</li>
            <li><strong>Vercel:</strong> Frontend-Hosting</li>
          </ul>

          <h2>Datenschutzbeauftragter</h2>
          <p>
            Zuständige Aufsichtsbehörde:<br>
            {{ company.dataProtectionAuthority.name }}<br>
            {{ company.dataProtectionAuthority.address.street }}<br>
            {{ company.dataProtectionAuthority.address.zip }} {{ company.dataProtectionAuthority.address.city }}
          </p>

          <div class="mt-12 p-6 bg-gray-800 border border-gray-700 rounded-lg">
            <h3 class="text-lg font-semibold text-white mb-2">Kontakt bei Datenschutzfragen</h3>
            <p class="text-gray-300">
              {{ company.legalName }}<br>
              E-Mail: <a :href="`mailto:${company.contact.email}`" class="text-brand hover:underline">{{ company.contact.email }}</a>
            </p>
          </div>
        </div>

        <!-- English Version -->
        <div v-else class="privacy-content">
          <h2>Data Controller</h2>
          <p>
            {{ company.legalName }}<br>
            {{ company.address.street }}<br>
            {{ company.address.zip }} {{ company.address.city }}, Germany<br>
            Email: <a :href="`mailto:${company.contact.email}`">{{ company.contact.email }}</a>
          </p>

          <h2>Overview of Processing</h2>
          <p>The following overview summarizes the types of data processed and the purposes of processing.</p>

          <h3>Types of Data Processed</h3>
          <ul>
            <li>Master data (e.g., name, address)</li>
            <li>Contact data (e.g., email, phone numbers)</li>
            <li>Content data (e.g., form inputs)</li>
            <li>Usage data (e.g., pages visited, access time)</li>
            <li>Meta/communication data (e.g., IP addresses)</li>
            <li>Payment data (e.g., bank details, invoices)</li>
          </ul>

          <h3>Purposes of Processing</h3>
          <ul>
            <li>Provision of contractual services</li>
            <li>Communication</li>
            <li>Security measures</li>
            <li>Reach measurement</li>
            <li>Management and response to inquiries</li>
          </ul>

          <h2>Legal Basis</h2>
          <p>Below is an overview of the GDPR legal bases on which we process personal data:</p>
          <ul>
            <li><strong>Consent (Art. 6(1)(a) GDPR)</strong></li>
            <li><strong>Contract Performance (Art. 6(1)(b) GDPR)</strong></li>
            <li><strong>Legal Obligation (Art. 6(1)(c) GDPR)</strong></li>
            <li><strong>Legitimate Interests (Art. 6(1)(f) GDPR)</strong></li>
          </ul>

          <h2>Your Rights</h2>
          <p>As a data subject under GDPR, you have various rights:</p>
          <ul>
            <li><strong>Right to Object:</strong> You have the right to object to processing at any time.</li>
            <li><strong>Right to Withdraw Consent:</strong> You have the right to withdraw consent at any time.</li>
            <li><strong>Right to Access:</strong> You have the right to information about processed data.</li>
            <li><strong>Right to Rectification:</strong> You have the right to correct inaccurate data.</li>
            <li><strong>Right to Erasure:</strong> You have the right to have your data deleted.</li>
            <li><strong>Right to Complain:</strong> You have the right to lodge a complaint with a supervisory authority.</li>
          </ul>

          <h2>Cookies</h2>
          <p>
            We use cookies and similar technologies to ensure the functionality of our platform.
            Necessary cookies are set based on legitimate interests. For analytics cookies, we obtain your consent.
          </p>

          <h3>Types of Cookies</h3>
          <ul>
            <li><strong>Essential Cookies:</strong> These cookies are required for the website to function properly (e.g., session management, authentication).</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website.</li>
            <li><strong>Marketing Cookies:</strong> Used to display personalized advertisements.</li>
          </ul>

          <h3>Manage Cookie Preferences</h3>
          <p>You can adjust your cookie preferences at any time using the button below:</p>
          <button
            @click="resetCookieConsent"
            class="mt-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors text-sm font-medium"
          >
            Manage Cookie Settings
          </button>

          <h2>Payment Processing</h2>
          <p>
            For payments, we use the payment service provider Stripe. Processing is carried out in accordance with their privacy policy.
          </p>
          <ul>
            <li><strong>Stripe, Inc.</strong> - 510 Townsend Street, San Francisco, CA 94103, USA</li>
            <li>Privacy Policy: <a href="https://stripe.com/privacy" target="_blank">https://stripe.com/privacy</a></li>
          </ul>

          <h2>Hosting</h2>
          <p>Our platform is hosted with the following providers:</p>
          <ul>
            <li><strong>Supabase:</strong> Database and backend infrastructure (EU region)</li>
            <li><strong>Vercel:</strong> Frontend hosting</li>
          </ul>

          <h2>Data Protection Authority</h2>
          <p>
            Responsible supervisory authority:<br>
            {{ company.dataProtectionAuthority.nameEn }}<br>
            {{ company.dataProtectionAuthority.address.street }}<br>
            {{ company.dataProtectionAuthority.address.zip }} {{ company.dataProtectionAuthority.address.city }}, Germany
          </p>

          <div class="mt-12 p-6 bg-gray-800 border border-gray-700 rounded-lg">
            <h3 class="text-lg font-semibold text-white mb-2">Contact for Privacy Questions</h3>
            <p class="text-gray-300">
              {{ company.legalName }}<br>
              Email: <a :href="`mailto:${company.contact.email}`" class="text-brand hover:underline">{{ company.contact.email }}</a>
            </p>
          </div>
        </div>
      </div>

      <!-- Footer Links -->
      <div class="mt-8 text-center">
        <div class="flex justify-center space-x-6 text-sm text-gray-400">
          <NuxtLink to="/impressum" class="hover:text-white underline">
            {{ lang === 'de' ? 'Impressum' : 'Legal Notice' }}
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
const { resetConsent, initConsent } = useCookieConsent()

const resetCookieConsent = () => {
  resetConsent()
}

onMounted(() => {
  initConsent()
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('de')) {
    lang.value = 'de'
  }
})

useHead({
  title: 'Privacy Policy - Columbus',
  meta: [
    { name: 'description', content: 'Privacy Policy for Columbus - AI Engine Optimization platform' },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>

<style scoped>
.privacy-content {
  @apply prose prose-lg max-w-none prose-invert;
}

.privacy-content h2 {
  @apply text-2xl font-bold text-white mt-12 mb-4 pb-2 border-b-2 border-gray-700;
}

.privacy-content h2:first-child {
  @apply mt-0;
}

.privacy-content h3 {
  @apply text-xl font-semibold text-white mt-8 mb-3;
}

.privacy-content p {
  @apply text-gray-300 leading-relaxed mb-4;
}

.privacy-content ul {
  @apply list-disc list-inside space-y-2 text-gray-300 mb-4 ml-4;
}

.privacy-content a {
  @apply text-brand hover:text-brand/80 underline;
}

.privacy-content strong {
  @apply font-semibold text-white;
}
</style>
