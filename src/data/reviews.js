/**
 * Client reviews — used in full on /reviews and as a curated slice
 * (testimonials) on the home page.
 */
const reviews = [
  {
    // name: 'Trivikram Srinivas',
    event: 'Film Industry',
    guests: 'Multiple Events',
    date: '2023-2024',
    // rating: 5,
    // image: 'https://imgs.search.brave.com/jRT1J-3RF0XvkVHaRnX4ZqYRBTLT6c2POXOVnD01Ils/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2Y3Lzc0/L2ZlL2Y3NzRmZWI5/N2IzZDRiNTVmMDU3/ZjFiYmM0ZWRkNDll/LmpwZw',
    review:
      'Exceptional quality and authentic taste. Their attention to detail and commitment to excellence is truly commendable. We have worked with them on multiple occasions.',
    highlights: ['Authentic Taste', 'Professional Service', 'Reliable'],
  },
  {
    // name: 'Brahmanandam',
    event: 'Personal Events',
    guests: 'Various',
    date: '2023',
    // rating: 5,
    // image: 'https://imgs.search.brave.com/ZXxthBWXt68Pk9Gl_O6-gYvEnzbFCs7U5rSFsPTyJWI/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudG9paW1nLmNv/bS90aHVtYi82MzQy/NTg1My5qcGc_aW1n/c2l6ZT0yMzQ1NiZw/aG90b2lkPTYzNDI1/ODUzJndpZHRoPTYw/MCZyZXNpemVtb2Rl/PTQ',
    review:
      "Outstanding service and delicious food. They understand the importance of quality and consistency in every event. That Telugu inti avakaya ruchi — I couldn't forget it for a lifetime. Highly recommended for any occasion.",
    highlights: ['Delicious Food', 'Quality Service', 'Authentic Taste'],
  },
  {
    // name: 'Political Event',
    event: 'Political Event',
    guests: '500+',
    date: '2024',
    // rating: 5,
    // image: 'https://m.media-amazon.com/images/I/41dfJELrpfL._AC_UF1000,1000_QL80_.jpg',
    review:
      'Trusted for high-profile gatherings. Their discretion, quality and ability to handle large-scale events with precision is remarkable. Excellent coordination throughout.',
    highlights: ['Discreet', 'Large Scale', 'Excellent Coordination'],
  },
  {
    // name: 'NRI Wedding Family',
    event: 'NRI Wedding',
    guests: '2000',
    date: '2015',
    // rating: 5,
    // image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=300',
    review:
      'Our grand NRI wedding with 2,000 guests was flawlessly executed. The food was exceptional and the service impeccable — an unforgettable celebration.',
    highlights: ['Grand Scale', 'NRI Wedding', 'Flawless Execution'],
  },
  {
    // name: 'Telangana Government',
    event: 'Government Function',
    guests: '300+',
    date: '2024',
    // rating: 5,
    // image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300',
    review:
      'Engaged Sri Karthikeya for an official function with senior dignitaries. Their attention to dietary protocol, timely service and consistent quality across courses earned them a permanent place on our preferred-vendors list.',
    highlights: ['Official Protocol', 'On-time Service', 'Trusted Vendor'],
  },
];

/** Curated slice shown as testimonials on the home page. */
export const featuredReviews = reviews.slice(0, 3);

export default reviews;
