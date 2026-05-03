/**
 * Service offerings.
 * `previewDesc` is the short description used on the home page.
 * `fullDesc` + `features` are used on the dedicated /services page.
 */
const services = [
  {
    id: 'wedding',
    title: 'Wedding Catering',
    image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80',
    previewDesc:
      'Crafted celebrations from intimate vows to grand muhurtams — including NRI weddings of every scale.',
    fullDesc:
      'From intimate family weddings to grand celebrations, every detail is treated with care — including high-profile NRI weddings of every scale.',
    features: ['Customised menus', 'Experienced staff', 'Cultural sensitivity', 'Intimate to grand scale'],
  },
  {
    id: 'corporate',
    title: 'Corporate & Institutional',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80',
    previewDesc:
      'Daily meals for FAPCCI and government bodies — reliable, hygienic and consistently on time.',
    fullDesc:
      'Daily catering for corporate offices and institutions, including FAPCCI and government bodies. Consistency, hygiene and timely service at the core.',
    features: ['Daily office meals', 'Institutional catering', 'Reliable service', 'Flexible menus'],
  },
  {
    id: 'private',
    title: 'Private Celebrations',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&q=80',
    previewDesc:
      'Family milestones, anniversaries and ceremonies — handled with discretion and personal care.',
    fullDesc:
      'Family gatherings, milestone celebrations and personal events — approached with the care and professionalism that creates a memorable occasion.',
    features: ['Personalised service', 'Flexible planning', 'Thoughtful presentation', 'Discreet and professional'],
  },
  {
    id: 'religious',
    title: 'Religious & Cultural',
    image: 'https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&w=900&q=80',
    previewDesc:
      'Satvik preparations for temple events and community gatherings, conducted with reverence.',
    fullDesc:
      'Satvik preparations for religious and cultural occasions, with respect for tradition and a quiet attention to dignity, devotion and care.',
    features: ['Traditional recipes', 'Satvik preparations', 'Cultural respect', 'Temple and community events'],
  },
];

export default services;
