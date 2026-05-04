/**
 * Cuisine teasers — visual cards used by both the home preview (slice 0,3)
 * and the Menus page "Featured cuisines" view.
 *
 * For the canonical, exhaustive dish list, see src/data/fullMenu.js.
 */
const menus = [
  {
    id: 'south-indian',
    title: 'South Indian Special',
    image:
      'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80',
    category: 'indian',
    desc: 'The cuisines of Andhra and Telangana — slow-cooked, regional, hand-ground spices.',
    tags: ['Masala Dosa', 'Idli', 'Vada', 'Sambar', 'Chutney'],
  },
  {
    id: 'north-indian',
    title: 'North Indian Banquet',
    image:
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80',
    category: 'indian',
    desc: 'Tandoor classics, slow-simmered dals, rich vegetable preparations.',
    tags: ['Paneer Tikka', 'Dal Makhani', 'Biryani', 'Naan', 'Raita'],
  },
  {
    id: 'continental',
    title: 'Continental Delights',
    image:
      'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=900&q=80',
    category: 'continental',
    desc: 'European comfort, reimagined for vegetarian palates.',
    tags: ['Pasta Alfredo', 'Caesar Salad', 'Minestrone', 'Garlic Bread'],
  },
  {
    id: 'oriental',
    title: 'Oriental Fusion',
    image:
      'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=900&q=80',
    category: 'oriental',
    desc: 'Pan-Asian flavours with a satvik sensibility.',
    tags: ['Hakka Noodles', 'Fried Rice', 'Dumplings', 'Spring Rolls'],
  },
  {
    id: 'mediterranean',
    title: 'Mediterranean Magic',
    image:
      'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=900&q=80',
    category: 'mediterranean',
    desc: 'Sun-soaked olive-oil cooking with mezze, grains and fresh herbs.',
    tags: ['Hummus', 'Falafel', 'Pita Bread', 'Greek Salad'],
  },
  {
    id: 'vegan',
    title: 'Vegan Delights',
    image:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
    category: 'vegan',
    desc: 'Plant-forward cooking — wholesome, flavourful, no compromises.',
    tags: ['Plant-based', 'Dairy-free', 'Organic', 'Wholesome'],
  },
];

export const MENU_FILTERS = [
  { name: 'all', label: 'All' },
  { name: 'indian', label: 'Indian' },
  { name: 'continental', label: 'Continental' },
  { name: 'oriental', label: 'Oriental' },
  { name: 'mediterranean', label: 'Mediterranean' },
  { name: 'vegan', label: 'Vegan' },
];

export default menus;
