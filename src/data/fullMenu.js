/**
 * Full menu — categorised dish & service list.
 *
 * Items follow the order printed in the official Sri Karthikeya Caterers menu (PDF),
 * extended with dishes commonly requested by Indian and Indo-Chinese vegetarian
 * catering clients. The PDF list is preserved verbatim at the start of each
 * category; additions are appended at the end.
 *
 * Rendered by components/menus/FullMenu.jsx.
 */
const fullMenu = [
  {
    id: 'breakfast',
    title: 'Breakfast',
    items: [
      'Idly', 'Vada', 'Dosa', 'Poori',
      'Rice Pongal', 'Ravva Pongal',
      'Pesarattu & Upma', 'Veg Upma',
      'Tomato Bath', 'Coffee', 'Tea', 'Milk',
      // extended
      'Mysore Bonda', 'Set Dosa', 'Rava Dosa', 'Onion Uttapam',
      'Sabudana Khichdi', 'Aloo Paratha', 'Methi Paratha', 'Lassi',
    ],
  },
  {
    id: 'rice-items',
    title: 'Rice Items',
    items: [
      'Plain Rice', 'Pulihora', 'Mango Pulihora', 'Bisebelli Bath',
      'Coconut Rice', 'Dumka Biryani', 'Veg Biryani', 'Veg Fried Rice',
      'Veg Pulav', 'Kaju Pulav', 'Vangi Bath', 'Bagara Rice',
      'Capsicum Rice', 'Curd Rice', 'Tomato Rice', 'Kurrapaka Rice',
      'Pudina Rice', 'Zeera Rice', 'Aloo Bath',
      // extended
      'Lemon Rice', 'Hyderabadi Veg Biryani', 'Mushroom Biryani',
      'Peas Pulav', 'Ghee Rice', 'Curry Leaf Rice', 'Methi Rice',
    ],
  },
  {
    id: 'south-indian',
    title: 'South Indian',
    items: [
      'Dal', 'Mixed Dal', 'Veg Mixed Curry', 'Avial',
      'Cabbage Coconut Curry', 'Beans Coconut Curry',
      'Dondakaya Curry', 'Bendakaya Curry', 'Aratikaya Curry',
      'Gutti Vankaya', 'Vankaya Karam Curry', 'Vankaya Allam Pachimirchi',
      'Alu Upma Curry', 'Panasapottu Curry', 'Kanda Batchali',
      // extended
      'Sambar', 'Tomato Rasam', 'Pepper Rasam', 'Pappu Charu',
      'Bendakaya Pulusu', 'Sorakaya Pulusu', 'Beerakaya Curry',
      'Cauliflower Curry', 'Cabbage Poriyal', 'Beans Poriyal', 'Drumstick Curry',
    ],
  },
  {
    id: 'north-indian',
    title: 'North Indian',
    items: [
      'Paneer Butter Masala', 'Palak Paneer', 'Shahi Paneer', 'Mutter Paneer',
      'Bagara Baingan', 'Bagara Tomato',
      'Malai Kofta', 'Paneer Kofta', 'Veg Kofta',
      'Dum Aloo', 'Aloo Kurma', 'Aloo Mutter', 'Aloo Gobi', 'Aloo Tomato',
      'Mixed Vegetable', 'Kadai Vegetable',
      'Chole', 'Phool Makhani', 'Dal Makhani', 'Babycorn',
      'Mirchi Ka Salan', 'Tawa Sabji',
      'Malai Methi', 'Mutter Methi Chaman',
      'Veg Chat Pat', 'Mushroom Masala',
      // extended
      'Butter Naan', 'Garlic Naan', 'Tandoori Roti', 'Lachha Paratha',
      'Rajma', 'Kadhi Pakoda', 'Chana Masala', 'Veg Korma',
      'Veg Jalfrezi', 'Paneer Bhurji', 'Stuffed Capsicum', 'Bhindi Masala',
    ],
  },
  {
    id: 'fry-items',
    title: 'Fry Items',
    items: [
      'Aloo Fry', 'Dondakaya Fry', 'Bendakaya Fry', 'Aratikaya Fry',
      'Chama Fry', 'Kakarakaya Fry', 'Kanda Fry',
      // extended
      'Beerakaya Fry', 'Sorakaya Fry', 'Cabbage Fry', 'Cauliflower Fry', 'Drumstick Fry',
    ],
  },
  {
    id: 'hots-snacks',
    title: 'Hots & Snacks',
    items: [
      'Mirchi Bajji', 'Cut Mirchi', 'Aloo Bajji', 'Aratikaya Bajji',
      'Pan Bajji', 'Tomato Bajji', 'Onion Bajji',
      'Kara Boondi', 'Mixer',
      'Dahi Vada', 'Masala Vada', 'Thotakoora Vada', 'Amma Vada',
      // extended
      'Samosa', 'Kachori', 'Aloo Tikki',
      'Pani Puri', 'Bhel Puri', 'Sev Puri', 'Dahi Puri',
      'Pav Bhaji', 'Vada Pav', 'Punugulu', 'Veg Cutlet',
    ],
  },
  {
    id: 'indo-chinese',
    title: 'Indo-Chinese',
    items: [
      'Veg Manchuria', 'Gobi Manchuria',
      'Aloo 65', 'Gobi 65', 'Paneer Tikka',
      'Veg Spring Roll', 'Gold Coin', 'Paneer Lollypop',
      'Chilli Baby Corn', 'Baby Corn Manchuria',
      // extended
      'Hakka Noodles', 'Schezwan Noodles', 'Schezwan Fried Rice',
      'Chilli Paneer', 'Honey Chilli Potato', 'Chilli Mushroom',
      'Chilli Garlic Noodles', 'Crispy Veg',
      'Mushroom Manchuria', 'Cauliflower Manchuria', 'Crispy Corn',
      'Sweet Corn Soup', 'Hot & Sour Soup', 'Manchow Soup',
      'Salt & Pepper Babycorn',
    ],
  },
  {
    id: 'sweets',
    title: 'Sweets',
    items: [
      'Jangri', 'Jelabi', 'Gulab Jamun', 'Kala Jamun',
      'Badusha', 'Kaja', 'Mysurpak', 'Laddu',
      'Besan Chekki', 'Poornam Burelu', 'Bobbatlu',
      'Ravva Kesari', 'Saniya Kesari', 'Fruit Kesari',
      'Chakra Pongal', 'Semiya Payasam',
      'Madatha Kaja', 'Kakinada Kaja', 'Kova Kajjikayalu',
      'Carrot Halwa', 'Kaddu Halwa', 'Kasi Halwa',
      // extended
      'Motichoor Laddu', 'Rava Laddu', 'Coconut Laddu',
      'Pootharekulu', 'Ariselu', 'Sunnundalu',
      'Pista Burfi', 'Coconut Burfi',
      'Atta Halwa', 'Sooji Halwa', 'Moong Dal Halwa',
    ],
  },
  {
    id: 'special-sweets',
    title: 'Special Sweets',
    items: [
      'Rasmalai', 'Rasgulla',
      'Double Ka Meetha', 'Qurbani Ka Meetha',
      'Gajar Ka Halwa', 'Kaddu Kheer', 'Basundi', 'Kaju Burfi',
      'Chum Chum', 'Pista Roll', 'Kaju Roll', 'Tawa Sweet',
      'Angoor Rasmalai', 'Angoor Jamun', 'Angoor Rasgulla', 'Sweet Mala',
      // extended
      'Falooda', 'Malai Kulfi', 'Pista Kulfi', 'Phirni', 'Rabri', 'Malpua',
    ],
  },
  {
    id: 'special-arrangements',
    title: 'Special Arrangements',
    items: [
      'Chat Counter', 'Chinese Counter', 'Kababs Counter',
      'Fruit Chat', 'Pan Counter', 'Mocktails Counter',
      'Pot Curds', 'Ice Creams', 'Water Bottles', 'Silver Plates',
      'Ladies Serving Staff', 'Models', 'Landscaping',
      'Italian / Mexican / Continental',
      // extended
      'Live Dosa Counter', 'Live Tandoor Counter', 'Pasta Counter',
      'Buffet Setup', 'Floral Arrangements',
    ],
  },
];

export default fullMenu;
