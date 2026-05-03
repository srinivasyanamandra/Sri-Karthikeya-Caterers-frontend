/** Gallery images — full set used by /gallery page; first 3 used in home preview. */
const gallery = [
  { id: 1, url: 'https://images.unsplash.com/photo-1745573673583-a51f665ae48e?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8d2VkZGluZyUyMHN0YWdlfGVufDB8fDB8fHww', title: 'Wedding setup',     category: 'Wedding'     },
  { id: 2, url: 'https://5.imimg.com/data5/SELLER/Default/2022/8/TQ/ZM/VZ/143446849/catering-buffet-display-buffet-table-and-counter-catering-supplies-food-display-table-500x500.jpg', title: 'Buffet display',    category: 'Setup'       },
  { id: 3, url: 'https://3.imimg.com/data3/UF/KI/MY-8826241/indian-catring.jpg', title: 'Indian thali',      category: 'Cuisine'     },
  { id: 4, url: 'https://image.wedmegood.com/resized/720X/uploads/member/24878917/1733910169_IMG20241122192252.jpg?crop=10,496,1845,1038', title: 'Chaat stall',       category: 'Live Counter' },
  { id: 5, url: 'https://b.zmtcdn.com/data/pictures/chains/0/19731410/fb5219c727f0d86a0932b36904049782.jpg', title: 'Festive thali',     category: 'Cuisine'     },
  { id: 6, url: 'https://image.wedmegood.com/resized/720X/uploads/member/4310937/1720693186_image9179.jpg?crop=185,9,1117,629', title: 'Desserts',          category: 'Cuisine'     },
  { id: 7, url: 'https://tiimg.tistatic.com/fp/1/519/welcome-drinks-catering-service-283.jpg', title: 'Welcome drinks',    category: 'Beverages'   },
  { id: 8, url: 'https://www.spoonboon.com/assets/img/birthday-party-catering.jpg', title: 'Private party',     category: 'Celebration' },
];

export const galleryPreview = gallery.slice(0, 3).map((img, idx) =>
  /* The home preview uses simpler titles */
  ({
    ...img,
    title:
      ['Wedding Setup', 'Live Counters', 'Indian Thali'][idx] || img.title,
    category:
      ['Mandap & Buffet', 'Service', 'Cuisine'][idx] || img.category,
  })
);

export default gallery;
