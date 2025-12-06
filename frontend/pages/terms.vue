<template>
  <div class="min-h-screen bg-gray-950">
    <CookieBanner />
    <div class="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-white mb-4">
          {{ lang === 'de' ? 'Allgemeine Geschäftsbedingungen (AGB)' : 'Terms of Service' }}
        </h1>
        <p class="text-lg text-gray-400">
          {{ lang === 'de' ? 'Geschäftsbedingungen für die Nutzung von Columbus' : 'Terms and conditions for using Columbus' }}
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
        <div v-if="lang === 'de'" class="terms-content">
          <h2>§ 1 Geltungsbereich und Vertragspartner</h2>

          <h3>1.1 Anbieter</h3>
          <p>
            Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB") gelten für die Nutzung der Software-as-a-Service-Plattform „Columbus" (nachfolgend „Plattform" oder „Dienst"), die von {{ company.legalName }}, {{ company.fullAddress }}, (nachfolgend „Anbieter" oder „wir") betrieben wird.
          </p>

          <h3>1.2 Geltung für Unternehmer</h3>
          <p>
            Diese AGB gelten ausschließlich für Unternehmer im Sinne des § 14 BGB, juristische Personen des öffentlichen Rechts oder öffentlich-rechtliche Sondervermögen (nachfolgend „Kunde" oder „Sie"). Die Plattform richtet sich nicht an Verbraucher im Sinne des § 13 BGB.
          </p>

          <h2>§ 2 Vertragsgegenstand und Leistungsumfang</h2>

          <h3>2.1 Beschreibung des Dienstes</h3>
          <p>
            Columbus ist eine cloudbasierte Softwareplattform für AI Engine Optimization (AEO) und Generative Engine Optimization (GEO). Die Plattform ermöglicht die Analyse und Optimierung der Sichtbarkeit von Marken und Produkten in KI-gestützten Suchmaschinen und Sprachassistenten. Die Plattform umfasst:
          </p>
          <ul>
            <li>Analyse der Markensichtbarkeit in KI-Plattformen (ChatGPT, Claude, Perplexity, Gemini, etc.)</li>
            <li>Tracking von Erwähnungen und Zitationen</li>
            <li>Wettbewerbsanalyse und Benchmarking</li>
            <li>Optimierungsempfehlungen</li>
            <li>Desktop-Anwendung für automatisierte Scans</li>
            <li>Verwaltung von Organisationen, Produkten und Teams</li>
            <li>API-Zugang für Integrationen</li>
          </ul>

          <h3>2.2 Verfügbarkeit</h3>
          <p>
            Wir sind bemüht, eine Verfügbarkeit der Plattform von 99,5% im Jahresmittel zu gewährleisten. Hiervon ausgenommen sind Wartungsarbeiten, höhere Gewalt und Störungen, die außerhalb unseres Einflussbereichs liegen.
          </p>

          <h2>§ 3 Vertragsschluss und Registrierung</h2>

          <h3>3.1 Registrierung</h3>
          <p>
            Die Nutzung der Plattform erfordert eine Registrierung. Mit der Registrierung geben Sie ein verbindliches Angebot zum Abschluss eines Nutzungsvertrags ab. Wir nehmen dieses Angebot durch Freischaltung Ihres Accounts an.
          </p>

          <h3>3.2 Wahrheitsgemäße Angaben</h3>
          <p>
            Sie sind verpflichtet, bei der Registrierung wahrheitsgemäße, vollständige und aktuelle Angaben zu machen.
          </p>

          <h2>§ 4 Preise und Zahlungsbedingungen</h2>

          <h3>4.1 Preise und Zahlungsweise</h3>
          <p>
            Es gelten die zum Zeitpunkt der Bestellung auf der Plattform angezeigten Preise. Alle Preise verstehen sich zzgl. der gesetzlichen Umsatzsteuer. Die Zahlung erfolgt über unseren Zahlungsdienstleister Stripe.
          </p>

          <h3>4.2 Abrechnungsmodell</h3>
          <p>Die Abrechnung erfolgt je nach gewähltem Tarif:</p>
          <ul>
            <li><strong>Free Tier:</strong> Kostenlos mit begrenztem Funktionsumfang</li>
            <li><strong>Bezahltarife:</strong> Monatliche oder jährliche Abrechnung im Voraus</li>
          </ul>

          <h2>§ 5 Vertragslaufzeit und Kündigung</h2>

          <h3>5.1 Laufzeit</h3>
          <p>
            Bei monatlich abgerechneten Tarifen beträgt die Mindestlaufzeit einen Monat. Der Vertrag verlängert sich automatisch um jeweils einen weiteren Monat, sofern nicht mit einer Frist von 7 Tagen zum Ende der Laufzeit gekündigt wird.
          </p>

          <h3>5.2 Kündigungsform</h3>
          <p>
            Die Kündigung muss in Textform (E-Mail an {{ company.contact.support }}) oder über die Plattform-Einstellungen erfolgen.
          </p>

          <h2>§ 6 Pflichten des Kunden</h2>

          <h3>6.1 Rechtmäßige Nutzung</h3>
          <p>Sie verpflichten sich, die Plattform ausschließlich rechtmäßig und im Einklang mit diesen AGB zu nutzen. Insbesondere ist es untersagt:</p>
          <ul>
            <li>Rechte Dritter zu verletzen</li>
            <li>Die Sicherheit und Verfügbarkeit der Plattform zu beeinträchtigen</li>
            <li>Automatisierte Systeme ohne unsere Zustimmung einzusetzen</li>
            <li>Die API-Ratenlimits zu umgehen oder zu missbrauchen</li>
          </ul>

          <h2>§ 7 Datenschutz</h2>
          <p>
            Die Verarbeitung personenbezogener Daten erfolgt gemäß unserer Datenschutzerklärung, die unter <a href="/privacy" class="text-brand hover:underline">/privacy</a> abrufbar ist.
          </p>

          <h2>§ 8 Haftungsbeschränkung</h2>
          <p>
            Wir haften unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit, bei Vorsatz und grober Fahrlässigkeit. Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten ist unsere Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt.
          </p>

          <h2>§ 9 Schlussbestimmungen</h2>

          <h3>9.1 Anwendbares Recht</h3>
          <p>
            Es gilt ausschließlich das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG).
          </p>

          <h3>9.2 Gerichtsstand</h3>
          <p>
            Ausschließlicher Gerichtsstand für alle Streitigkeiten ist Chemnitz, sofern der Kunde Kaufmann ist.
          </p>

          <h3>9.3 Salvatorische Klausel</h3>
          <p>
            Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen davon unberührt.
          </p>

          <div class="mt-12 p-6 bg-gray-800 border border-gray-700 rounded-lg">
            <h3 class="text-lg font-semibold text-white mb-2">Kontakt</h3>
            <p class="text-gray-300">
              Bei Fragen zu diesen Geschäftsbedingungen wenden Sie sich bitte an:<br>
              <strong>{{ company.legalName }}</strong><br>
              {{ company.address.street }}<br>
              {{ company.address.zip }} {{ company.address.city }}<br>
              E-Mail: <a :href="`mailto:${company.contact.support}`" class="text-brand hover:underline">{{ company.contact.support }}</a>
            </p>
          </div>
        </div>

        <!-- English Version -->
        <div v-else class="terms-content">
          <h2>§ 1 Scope and Contracting Parties</h2>

          <h3>1.1 Provider</h3>
          <p>
            These Terms of Service (hereinafter "Terms") apply to the use of the Software-as-a-Service platform "Columbus" (hereinafter "Platform" or "Service") operated by {{ company.legalName }}, {{ company.fullAddress }} (hereinafter "Provider" or "we").
          </p>

          <h3>1.2 B2B Only</h3>
          <p>
            These Terms apply exclusively to businesses. The Platform is not intended for consumers within the meaning of § 13 German Civil Code.
          </p>

          <h2>§ 2 Subject Matter and Scope of Services</h2>

          <h3>2.1 Service Description</h3>
          <p>
            Columbus is a cloud-based software platform for AI Engine Optimization (AEO) and Generative Engine Optimization (GEO). The platform enables analysis and optimization of brand and product visibility in AI-powered search engines and voice assistants. The Platform includes:
          </p>
          <ul>
            <li>Brand visibility analysis across AI platforms (ChatGPT, Claude, Perplexity, Gemini, etc.)</li>
            <li>Mention and citation tracking</li>
            <li>Competitive analysis and benchmarking</li>
            <li>Optimization recommendations</li>
            <li>Desktop application for automated scans</li>
            <li>Management of organizations, products, and teams</li>
            <li>API access for integrations</li>
          </ul>

          <h3>2.2 Availability</h3>
          <p>
            We strive to ensure Platform availability of 99.5% on average per year. This excludes maintenance work, force majeure, and disruptions beyond our control.
          </p>

          <h2>§ 3 Contract Formation and Registration</h2>

          <h3>3.1 Registration</h3>
          <p>
            Use of the Platform requires registration. By registering, you make a binding offer to conclude a usage agreement. We accept this offer by activating your account.
          </p>

          <h3>3.2 Accurate Information</h3>
          <p>
            You are obligated to provide truthful, complete, and current information during registration.
          </p>

          <h2>§ 4 Prices and Payment Terms</h2>

          <h3>4.1 Prices and Payment Methods</h3>
          <p>
            The prices displayed on the Platform at the time of ordering apply. All prices are exclusive of statutory VAT. Payment is made through our payment service provider Stripe.
          </p>

          <h3>4.2 Billing Model</h3>
          <p>Billing occurs according to the selected plan:</p>
          <ul>
            <li><strong>Free Tier:</strong> Free with limited functionality</li>
            <li><strong>Paid Plans:</strong> Monthly or annual billing in advance</li>
          </ul>

          <h2>§ 5 Contract Duration and Termination</h2>

          <h3>5.1 Duration</h3>
          <p>
            For monthly billed plans, the minimum term is one month. The contract automatically renews for one additional month unless terminated with 7 days' notice before the end of the term.
          </p>

          <h3>5.2 Form of Termination</h3>
          <p>
            Termination must be in text form (email to {{ company.contact.support }}) or through Platform settings.
          </p>

          <h2>§ 6 Customer Obligations</h2>

          <h3>6.1 Lawful Use</h3>
          <p>You agree to use the Platform exclusively lawfully and in accordance with these Terms. In particular, it is prohibited to:</p>
          <ul>
            <li>Violate third-party rights</li>
            <li>Impair the security and availability of the Platform</li>
            <li>Deploy automated systems without our consent</li>
            <li>Bypass or abuse API rate limits</li>
          </ul>

          <h2>§ 7 Data Protection</h2>
          <p>
            Processing of personal data occurs according to our Privacy Policy, available at <a href="/privacy" class="text-brand hover:underline">/privacy</a>.
          </p>

          <h2>§ 8 Limitation of Liability</h2>
          <p>
            We are liable without limitation for damages from injury to life, body, or health, and in cases of intent and gross negligence. For slightly negligent breach of essential contractual obligations, our liability is limited to typical, foreseeable damage.
          </p>

          <h2>§ 9 Final Provisions</h2>

          <h3>9.1 Applicable Law</h3>
          <p>
            These Terms are exclusively governed by the laws of the Federal Republic of Germany, excluding the UN Convention on Contracts for the International Sale of Goods (CISG).
          </p>

          <h3>9.2 Jurisdiction</h3>
          <p>
            The exclusive place of jurisdiction for all disputes is Chemnitz, provided the Customer is a merchant.
          </p>

          <h3>9.3 Severability Clause</h3>
          <p>
            If individual provisions of these Terms are invalid, the validity of the remaining provisions remains unaffected.
          </p>

          <div class="mt-12 p-6 bg-gray-800 border border-gray-700 rounded-lg">
            <h3 class="text-lg font-semibold text-white mb-2">Contact</h3>
            <p class="text-gray-300">
              For questions about these Terms of Service, please contact:<br>
              <strong>{{ company.legalName }}</strong><br>
              {{ company.address.street }}<br>
              {{ company.address.zip }} {{ company.address.city }}<br>
              Email: <a :href="`mailto:${company.contact.support}`" class="text-brand hover:underline">{{ company.contact.support }}</a>
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
          <NuxtLink to="/privacy" class="hover:text-white underline">
            {{ lang === 'de' ? 'Datenschutzerklärung' : 'Privacy Policy' }}
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
  title: 'Terms of Service - Columbus',
  meta: [
    { name: 'description', content: 'Terms of Service for Columbus - AI Engine Optimization platform' },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>

<style scoped>
.terms-content {
  @apply prose prose-lg max-w-none prose-invert;
}

.terms-content h2 {
  @apply text-2xl font-bold text-white mt-12 mb-4 pb-2 border-b-2 border-gray-700;
}

.terms-content h3 {
  @apply text-xl font-semibold text-white mt-8 mb-3;
}

.terms-content p {
  @apply text-gray-300 leading-relaxed mb-4;
}

.terms-content ul {
  @apply list-disc list-inside space-y-2 text-gray-300 mb-4 ml-4;
}

.terms-content a {
  @apply text-brand hover:text-brand/80 underline;
}

.terms-content strong {
  @apply font-semibold text-white;
}
</style>
