/**
 * Single source of truth for brand + contact info.
 * Update these once → propagates everywhere (Header, Footer, Contact page, FABs, SEO).
 *
 * Authoritative source: official Sri Karthikeya Caterers menu (PDF).
 */
export const CONTACT = {
  brand: 'Sri Karthikeya Caterers',
  tagline: 'Authentic Taste · Premium Experience',
  established: 2009,
  proprietor: 'Y. R. S. Gurumurthy',

  city: 'Hyderabad',
  region: 'Telangana',
  country: 'India',
  countryCode: 'IN',
  fullAddress: 'H.No 2-437, Sai Baba Temple Road, PS Rao Nagar, Dammaiguda, Hyderabad — 500083',

  phones: [{ label: '+91 81258 20110', tel: '+918125820110' }],
  /* `primaryPhone` is derived below — never edit phone numbers in two places. */

  email: 'info@srikarthikeyacaterers.in',
  hours: 'Mon–Sun · 9 AM – 9 PM',
  responseTime: 'Reply within 24 hours',

  /* Social presence — Instagram is currently our only active channel.
     Add new platforms here as they go live; both Header and Footer
     iterate over `Object.entries(CONTACT.social)` so additions are
     surfaced automatically without touching layout components. */
  social: {
    instagram: 'https://www.instagram.com/srikarthikeya.caterers?igsh=MnFzdmk0eXN0MnNz',
  },
};

/** First entry of `phones` is canonical for tel: links, WhatsApp, FAB CTAs. */
CONTACT.primaryPhone = CONTACT.phones[0];
