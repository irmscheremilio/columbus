export const useCompanyInfo = () => {
  return {
    // Basic info
    name: 'Columbus',
    legalName: 'Emilio Irmscher',
    businessType: 'Einzelunternehmen',
    registrationDate: '1. September 2025',
    operationsStartDate: '1. September 2025',

    // Address
    address: {
      street: 'Max-Saupe-Straße 41',
      zip: '09131',
      city: 'Chemnitz',
      country: 'Deutschland',
    },
    fullAddress: computed(() => 'Max-Saupe-Straße 41, 09131 Chemnitz, Deutschland'),
    addressLines: computed(() => [
      'Emilio Irmscher',
      'Max-Saupe-Straße 41',
      '09131 Chemnitz',
      'Deutschland',
    ]),

    // Contact
    contact: {
      email: 'contact@columbus-aeo.com',
      support: 'support@columbus-aeo.com',
      phone: '+49 176 82083013',
    },

    // Tax
    tax: {
      number: '215/210/01865',
      vatId: '', // Applied for
      taxOffice: 'Finanzamt Chemnitz-Süd',
      taxOfficeAddress: {
        street: 'Reichsstraße 23',
        zip: '09112',
        city: 'Chemnitz',
      },
    },
    formattedTaxNumber: computed(() => '215/210/01865'),
    hasVatId: computed(() => false),
    vatIdDisplay: computed(() => 'Wird beantragt und hier ergänzt'),

    // Tax Office
    taxOffice: {
      name: 'Finanzamt Chemnitz-Süd',
      address: {
        street: 'Reichsstraße 23',
        zip: '09112',
        city: 'Chemnitz',
      },
      fullAddress: computed(() => 'Reichsstraße 23, 09112 Chemnitz'),
    },

    // Chamber of Commerce
    chamber: {
      name: 'IHK Chemnitz',
      address: {
        street: 'Straße der Nationen 25',
        zip: '09111',
        city: 'Chemnitz',
      },
      fullAddress: computed(() => 'Straße der Nationen 25, 09111 Chemnitz'),
    },

    // Domains
    domains: {
      platform: 'app.columbus-aeo.com',
      marketing: 'columbus-aeo.com',
    },
    platformUrl: computed(() => 'https://app.columbus-aeo.com'),
    marketingUrl: computed(() => 'https://columbus-aeo.com'),
    impressumUrl: computed(() => 'https://columbus-aeo.com/impressum'),
    privacyUrl: computed(() => 'https://columbus-aeo.com/privacy'),
    termsUrl: computed(() => 'https://columbus-aeo.com/terms'),

    // EU Dispute Resolution
    euDisputeResolution: 'https://ec.europa.eu/consumers/odr',

    // Supervisory Authority (for GDPR)
    dataProtectionAuthority: {
      name: 'Sächsischer Datenschutzbeauftragter',
      nameEn: 'State Data Protection Commissioner of Saxony',
      address: {
        street: 'Bernhard-von-Lindenau-Platz 1',
        zip: '01067',
        city: 'Dresden',
        country: 'Deutschland',
      },
      contact: {
        email: 'saechsdsb@slt.sachsen.de',
        phone: '+49 351 85471-101',
      },
      fullAddress: computed(() => 'Bernhard-von-Lindenau-Platz 1, 01067 Dresden, Deutschland'),
    },
  };
};
