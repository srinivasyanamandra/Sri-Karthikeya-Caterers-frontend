/**
 * Curated menu collections — replaces the old dish-listing model.
 *
 * Eight luxury menu sets, each presented as a multi-page brochure rather
 * than a flat dish list. Sections inside each page deliberately mix
 * regional Indian (Telangana, Andhra), pan-Indian (Mughlai, North-Indian),
 * global vegetarian (Chinese, Thai, Mongolian, Afghani, Mediterranean),
 * desserts/sweets, beverages and live-counter services so every collection
 * reads as a complete event experience, not a dish catalogue.
 *
 * Shape:
 *   {
 *     id, name, tagline, summary, accent, motif, bestFor[],
 *     pages: [
 *       { id, eyebrow, title, sections: [
 *         { title, items: string[] }
 *       ] }
 *     ]
 *   }
 *
 * IMAGES — pure-vegetarian audit
 *   Every `image` URL below has been drawn from photo IDs that this site
 *   already uses elsewhere (data/gallery.js, the legacy data/menus.js for
 *   the South-Indian / North-Indian / Continental / Oriental / Mediterranean
 *   tiles). Those tiles were vetted for the pure-vegetarian site, so the
 *   photographs are confirmed not to depict meat.
 *
 *   For production, replace these stock photos with your own photography
 *   in /public/menus/<collection-id>.jpg and update each `image` field to
 *   `'/menus/<collection-id>.jpg'`. Stock images, however well-curated,
 *   cannot fully convey the brand.
 */

const menuCollections = [
  /* ───────────────────────── HERITAGE ───────────────────────── */
  {
    id: 'heritage',
    name: 'Heritage',
    tagline: 'A grandmother’s kitchen, set for a thousand guests.',
    summary:
      'Slow-cooked Telangana and Andhra classics — hand-ground spices, ' +
      'tempered curries, and the unhurried tastes of a family table.',
    accent: '#a86a1c',
    motif: 'fa-leaf',
    image:
      'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80',
    bestFor: ['Family functions', 'Cultural gatherings', 'Pure-veg traditions'],
    pages: [
      {
        id: 'heritage-welcome',
        eyebrow: 'Page I',
        title: 'Welcome & Tiffin',
        sections: [
          {
            title: 'Traditional welcome',
            items: [
              'Panakam — jaggery, cardamom, dried ginger',
              'Buttermilk with curry leaf & ginger',
              'Tender coconut water',
              'Filter coffee · Masala chai',
              'Saffron-pista milk',
              'Lemongrass-tulsi infusion',
              'Aam panna (seasonal)',
              'Sol kadhi shooter',
              'Ginger-honey kashayam',
              'Rose milk',
            ],
          },
          {
            title: 'Tiffin from the Deccan',
            items: [
              'Idly with allam pachadi',
              'Mini idli sambar',
              'Plain dosa with three chutneys',
              'Pesarattu with upma',
              'Mysore bonda',
              'Set dosa with kurma',
              'Punugulu',
              'Rava dosa',
              'Onion uttapam',
              'Aloo paratha with butter',
              'Methi paratha',
              'Sabudana khichdi',
            ],
          },
        ],
      },
      {
        id: 'heritage-mains',
        eyebrow: 'Page II',
        title: 'From the Hearth',
        sections: [
          {
            title: 'Telangana & Andhra mains',
            items: [
              'Gutti vankaya (stuffed brinjal curry)',
              'Vankaya allam pachimirchi',
              'Bendakaya pulusu',
              'Sorakaya pulusu',
              'Beerakaya senagapappu',
              'Kanda batchali',
              'Aratikaya curry',
              'Dondakaya vepudu',
              'Pappu charu',
              'Tomato pappu',
              'Palakura pappu',
              'Mukkala pulusu',
              'Pepper rasam',
              'Tomato rasam',
              'Pacchi pulusu',
              'Nethi avakaya pickle',
              'Gongura mamidi pachadi',
              'Tomato-allam pachadi',
            ],
          },
          {
            title: 'Rice & breads',
            items: [
              'Bagara rice',
              'Pulihora · Mango pulihora',
              'Curd rice with pomegranate',
              'Coconut rice',
              'Jeera rice',
              'Vangi bath',
              'Bisebelli bath',
              'Phulka',
              'Jowar roti',
              'Ragi sangati',
            ],
          },
        ],
      },
      {
        id: 'heritage-sweets',
        eyebrow: 'Page III',
        title: 'Heirloom Sweets',
        sections: [
          {
            title: 'From the steel container',
            items: [
              'Bobbatlu (puran poli)',
              'Poornam burelu',
              'Ariselu',
              'Sunnundalu',
              'Pootharekulu',
              'Madatha kaja',
              'Kakinada kaja',
              'Kova kajjikayalu',
              'Rava laddu',
              'Coconut laddu',
              'Boondi laddu',
              'Besan chekki',
            ],
          },
          {
            title: 'Hot off the ladle',
            items: [
              'Carrot halwa with ghee-roasted cashew',
              'Saniya kesari',
              'Ravva kesari',
              'Fruit kesari',
              'Semiya payasam',
              'Paramannam (rice payasam)',
              'Chakra pongal',
              'Kasi halwa',
              'Sooji halwa',
              'Atta halwa',
              'Moong dal halwa',
            ],
          },
        ],
      },
    ],
  },

  /* ───────────────────────── SIGNATURE ─────────────────────── */
  {
    id: 'signature',
    name: 'Signature',
    tagline: 'The chef’s thoughtful set — quietly impressive.',
    summary:
      'Our most-loved house plates: tandoor classics, paneer favourites, ' +
      'silk-finish dals and a small, considered Indo-Chinese counter.',
    accent: '#c9882f',
    motif: 'fa-star',
    image:
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80',
    bestFor: ['Reception dinners', 'Milestone parties', 'Premium hospitality'],
    pages: [
      {
        id: 'signature-starters',
        eyebrow: 'Page I',
        title: 'Welcome & Starters',
        sections: [
          {
            title: 'Welcome drinks',
            items: [
              'Watermelon-mint cooler',
              'Cucumber-lime spritzer',
              'Pineapple-basil mocktail',
              'Virgin mojito',
              'Saffron sherbet',
              'Masala chai · Filter coffee',
              'Green tea selection',
            ],
          },
          {
            title: 'From the tandoor',
            items: [
              'Paneer tikka with mint chutney',
              'Hariyali paneer',
              'Achari paneer',
              'Tandoori broccoli',
              'Tandoori mushroom kebab',
              'Soya malai chaap',
              'Bharwan tandoori aloo',
              'Tandoori pineapple',
              'Veg seekh kebab',
              'Hara bhara kebab',
            ],
          },
          {
            title: 'Indo-Chinese',
            items: [
              'Crispy gobi Manchurian',
              'Veg Manchurian dry',
              'Paneer 65',
              'Honey chilli potato',
              'Veg spring roll · Gold coin',
              'Salt & pepper babycorn',
              'Crispy corn',
              'Chilli mushroom',
              'Schezwan paneer',
              'Veg lollipop',
            ],
          },
        ],
      },
      {
        id: 'signature-mains',
        eyebrow: 'Page II',
        title: 'Mains',
        sections: [
          {
            title: 'Curries — North Indian',
            items: [
              'Paneer butter masala',
              'Shahi paneer',
              'Kadai paneer',
              'Palak paneer',
              'Malai kofta',
              'Dal makhani — slow-cooked overnight',
              'Yellow dal tadka',
              'Mirchi ka salan',
              'Kadai vegetable',
              'Veg jalfrezi',
              'Bhindi masala',
              'Aloo gobi',
              'Chana masala',
              'Veg korma',
            ],
          },
          {
            title: 'Rice, biryani & breads',
            items: [
              'Hyderabadi veg dum biryani',
              'Mushroom biryani',
              'Saffron pulav',
              'Peas pulav',
              'Jeera rice',
              'Butter naan · Tandoori roti',
              'Lachha paratha',
              'Garlic naan',
              'Pudina paratha',
              'Phulka',
            ],
          },
        ],
      },
      {
        id: 'signature-finish',
        eyebrow: 'Page III',
        title: 'Sweet Finish',
        sections: [
          {
            title: 'Plated desserts',
            items: [
              'Gulab jamun, warm',
              'Rasmalai with pistachio',
              'Double ka meetha',
              'Phirni in earthen kullad',
              'Kaju katli',
              'Pista burfi',
              'Chum chum',
              'Rasgulla',
              'Angoor jamun',
              'Motichoor laddu',
            ],
          },
          {
            title: 'Live ice-cream cart',
            items: [
              'Malai kulfi · Pista kulfi',
              'Saffron ice-cream',
              'Mango kulfi',
              'Falooda station',
              'Rabri kulfi',
              'Rose-petal ice-cream',
              'Sitaphal ice-cream',
              'Chocolate fudge',
            ],
          },
          {
            title: 'Paan & mukhwas',
            items: [
              'Meetha paan',
              'Saada paan',
              'Chocolate paan',
              'Mukhwas tray',
              'Saunf-misri thali',
            ],
          },
        ],
      },
    ],
  },

  /* ───────────────────────── ROYAL FEAST ───────────────────── */
  {
    id: 'royal-feast',
    name: 'Royal Feast',
    tagline: 'A Mughlai-Awadhi vegetarian table, full of ceremony.',
    summary:
      'Slow-dum biryanis, saffron-finished kormas, Awadhi kebabs and ' +
      'classical milk-and-rose desserts — designed for grand evenings.',
    accent: '#7c2d12',
    motif: 'fa-crown',
    /* Royal feast spread — premium vegetarian banquet */
    image:
      'https://content.jdmagicbox.com/v2/comp/asansol/k9/9999px341.x341.251129071358.y6k9/catalogue/royal-feast-sarakdihi-asansol-pure-veg-restaurants-pxnydlwoy3.jpg',
    bestFor: ['Grand receptions', 'Sangeet dinners', 'Anniversary feasts'],
    pages: [
      {
        id: 'royal-welcome',
        eyebrow: 'Page I',
        title: 'Welcome Court',
        sections: [
          {
            title: 'Sherbet & nimbu pani bar',
            items: [
              'Rose sherbet',
              'Khus sherbet',
              'Aam panna',
              'Saffron-cardamom milk',
              'Thandai with dry fruit',
              'Jal jeera shooter',
              'Kokum sherbet',
              'Chaas with bhuna jeera',
              'Tender coconut',
              'Masala lemonade',
              'Mocktail bar — virgin mojito, peach iced tea, fruit punch',
            ],
          },
          {
            title: 'Chaat counter',
            items: [
              'Pani puri with five jal varieties',
              'Dahi puri',
              'Sev puri',
              'Aloo tikki chaat',
              'Bhel puri',
              'Raj kachori',
              'Dahi bhalla papdi',
              'Ragda pattice',
              'Samosa chaat',
              'Palak patta chaat',
              'Dabeli',
              'Pav bhaji',
            ],
          },
        ],
      },
      {
        id: 'royal-kebabs',
        eyebrow: 'Page II',
        title: 'Awadhi Kebab Counter',
        sections: [
          {
            title: 'Live tandoor — plated to order',
            items: [
              'Galouti-style soya kebab',
              'Dahi ke kebab',
              'Hariyali paneer tikka',
              'Achari paneer',
              'Mushroom shami',
              'Tandoori bharwan aloo',
              'Stuffed mushroom kebab',
              'Subz seekh kebab',
              'Paneer reshmi tikka',
              'Tandoori malai broccoli',
              'Bharwan mirch',
              'Soya chaap kebab',
            ],
          },
          {
            title: 'Tawa & griddle',
            items: [
              'Kathi roll station — paneer, mushroom, mixed-veg',
              'Sheermal · Ulte tawa ka paratha',
              'Khameeri roti',
              'Tawa pulao',
              'Gilafi seekh',
              'Galauti paratha',
            ],
          },
          {
            title: 'Soups',
            items: [
              'Saffron almond shorba',
              'Subz shorba',
              'Tomato dhaniya shorba',
              'Yakhni-style veg broth',
            ],
          },
        ],
      },
      {
        id: 'royal-dum',
        eyebrow: 'Page III',
        title: 'The Dum Course',
        sections: [
          {
            title: 'Slow-cooked mains',
            items: [
              'Hyderabadi veg dum biryani — sealed with atta',
              'Lucknowi vegetable biryani',
              'Subz nawabi korma',
              'Paneer pasanda',
              'Paneer lababdar',
              'Phool makhana matar',
              'Dal Bukhara',
              'Dum aloo Banarasi',
              'Subz tehri',
              'Awadhi vegetable curry',
              'Methi malai mutter',
              'Nargisi kofta',
            ],
          },
          {
            title: 'On the side',
            items: [
              'Burrani raita',
              'Boondi raita',
              'Mirchi ka salan',
              'Lachha onion',
              'Pickle platter',
              'Papad assortment',
              'Fresh kachumber',
              'Mint-coriander chutney',
            ],
          },
        ],
      },
      {
        id: 'royal-finale',
        eyebrow: 'Page IV',
        title: 'Royal Finale',
        sections: [
          {
            title: 'Milk, rose & saffron',
            items: [
              'Shahi tukda',
              'Rabri with rose petals',
              'Kesar phirni',
              'Angoor rasmalai',
              'Qurbani ka meetha',
              'Malpua with rabri',
              'Anjeer halwa',
              'Kulfi falooda',
              'Gajar ka halwa with rabri',
              'Badam halwa',
              'Pista roll',
              'Kaju roll',
            ],
          },
          {
            title: 'Paan counter',
            items: [
              'Meetha paan',
              'Saada paan',
              'Chocolate paan',
              'Silver-leaf paan',
              'Fire paan (theatrical)',
              'Mukhwas selection',
              'Kesar saunf',
            ],
          },
        ],
      },
    ],
  },

  /* ───────────────────────── CELEBRATION ───────────────────── */
  {
    id: 'celebration',
    name: 'Celebration',
    tagline: 'Light, lively, made for a room that wants to be loud.',
    summary:
      'A high-energy global counter — Thai, Mongolian, Indo-Chinese and ' +
      'Italian, each prepared live for guests as they arrive.',
    accent: '#15803d',
    motif: 'fa-champagne-glasses',
    image:
      'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=900&q=80',
    bestFor: ['Birthdays', 'Engagements', 'Cocktail evenings'],
    pages: [
      {
        id: 'celebration-counters',
        eyebrow: 'Page I',
        title: 'Live Counters',
        sections: [
          {
            title: 'Thai live wok',
            items: [
              'Pad Thai with crushed peanut',
              'Thai green curry with jasmine rice',
              'Thai red curry with vegetables',
              'Stir-fried morning glory',
              'Tom kha soup (coconut-galangal)',
              'Tom yum soup',
              'Thai basil tofu',
              'Mango sticky rice',
              'Thai papaya salad',
              'Crispy water-chestnut spring roll',
            ],
          },
          {
            title: 'Mongolian grill',
            items: [
              'Build-your-bowl — noodles, vegetables, sauces',
              'Hoisin tofu',
              'Schezwan paneer',
              'Burnt-garlic broccoli',
              'Black pepper mushroom',
              'Kung Pao vegetables',
              'Honey-sesame potato',
              'Five-spice tofu',
              'Sweet & sour vegetables',
            ],
          },
          {
            title: 'Indo-Chinese',
            items: [
              'Hakka noodles',
              'Schezwan fried rice',
              'Triple schezwan rice',
              'Manchow soup',
              'Sweet corn soup',
              'Hot & sour soup',
              'Chilli paneer dry',
              'Veg Manchuria gravy',
            ],
          },
        ],
      },
      {
        id: 'celebration-italian',
        eyebrow: 'Page II',
        title: 'Italian & Mediterranean',
        sections: [
          {
            title: 'Live pasta bar',
            items: [
              'Penne arrabiata',
              'Fettuccine alfredo',
              'Aglio e olio with chilli flake',
              'Pesto rigatoni',
              'Spaghetti pomodoro',
              'Mac & cheese (truffle option)',
              'Mushroom-cream tortellini',
              'Sun-dried tomato penne',
            ],
          },
          {
            title: 'Wood-fired pizza',
            items: [
              'Margherita pizzette',
              'Funghi e tartufo',
              'Pesto & feta',
              'Quattro formaggi',
              'Ortolana (garden vegetable)',
              'Capricciosa (veg)',
            ],
          },
          {
            title: 'Mezze',
            items: [
              'Hummus · Muhammara · Tzatziki',
              'Baba ghanoush',
              'Falafel with tahini',
              'Pita & lavash',
              'Greek salad with feta',
              'Tabbouleh',
              'Stuffed grape leaves',
              'Spanakopita',
              'Olive tapenade',
            ],
          },
        ],
      },
      {
        id: 'celebration-sweets',
        eyebrow: 'Page III',
        title: 'Dessert Bar',
        sections: [
          {
            title: 'European sweets',
            items: [
              'Tiramisu shots',
              'Lemon tart',
              'Dark-chocolate ganache cups',
              'Berry pavlova',
              'Crème brûlée',
              'Profiteroles',
              'Panna cotta with fruit coulis',
              'Cheesecake bites — strawberry, blueberry',
              'Macarons (assorted)',
              'Chocolate fondant',
            ],
          },
          {
            title: 'Indian sweets, plated small',
            items: [
              'Mini rasmalai',
              'Gulab jamun cheesecake',
              'Kulfi pop station',
              'Mini gulab jamun',
              'Phirni shooter',
              'Paan ice-cream',
              'Mawa cake bite',
            ],
          },
          {
            title: 'Live counter',
            items: [
              'Crepe station — Nutella, fruit, ice-cream',
              'Live waffle bar',
              'Kulfi & falooda counter',
              'Chocolate fountain with skewers',
            ],
          },
        ],
      },
    ],
  },

  /* ───────────────────────── BRUNCH ─────────────────────────── */
  {
    id: 'brunch',
    name: 'Brunch',
    tagline: 'A late-morning table for slow conversations.',
    summary:
      'A gentle spread of fresh juice, breakfast classics, light mains and ' +
      'pastries — ideal for sangeet mornings, baby showers and family brunches.',
    accent: '#0e7490',
    motif: 'fa-mug-saucer',
    /* Continental veg spread — from legacy menus.js (Continental Delights),
       previously vetted as pure-vegetarian for this same site. */
    image:
      'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=900&q=80',
    bestFor: ['Baby showers', 'Sangeet brunches', 'Day-after celebrations'],
    pages: [
      {
        id: 'brunch-juice',
        eyebrow: 'Page I',
        title: 'Juice & Coffee Bar',
        sections: [
          {
            title: 'Fresh-pressed juice',
            items: [
              'Watermelon · Pineapple · Orange',
              'Beetroot-carrot-ginger',
              'Cold-pressed green',
              'Cucumber-mint cooler',
              'Apple-celery-spinach',
              'Tender coconut',
              'Pomegranate',
              'Sweet lime nimbu pani',
              'Aam panna (seasonal)',
              'Mosambi-mint',
            ],
          },
          {
            title: 'Coffee & tea',
            items: [
              'Filter coffee',
              'Cappuccino · Latte · Americano',
              'Flat white · Mocha',
              'Masala chai · Cardamom chai',
              'Single-origin loose-leaf tea',
              'Green tea · Lemongrass',
              'Hot chocolate',
              'Iced coffee · Cold brew',
              'Chai latte',
            ],
          },
          {
            title: 'Smoothie bar',
            items: [
              'Mango-banana',
              'Mixed berry',
              'Avocado-spinach',
              'Peanut-butter banana',
              'Strawberry yoghurt',
              'Tropical sunshine',
            ],
          },
        ],
      },
      {
        id: 'brunch-breakfast',
        eyebrow: 'Page II',
        title: 'Breakfast Buffet',
        sections: [
          {
            title: 'South Indian',
            items: [
              'Rava dosa',
              'Onion uttapam',
              'Pongal with cashew',
              'Idli with three chutneys',
              'Mini medu vada',
              'Pesarattu',
              'Set dosa',
              'Upma',
              'Filter coffee',
            ],
          },
          {
            title: 'Continental',
            items: [
              'French toast with cinnamon-maple',
              'Buttermilk pancakes',
              'Vegetable shakshuka',
              'Avocado toast on sourdough',
              'Croissant · Pain au chocolat · Danish',
              'Belgian waffles',
              'Bagel with cream cheese',
              'Eggs Benedict (vegetarian)',
              'Granola parfait',
              'Muesli with fresh fruit',
            ],
          },
          {
            title: 'North Indian breakfast',
            items: [
              'Aloo paratha with butter',
              'Methi paratha',
              'Chole bhature',
              'Poori bhaji',
              'Stuffed kulcha',
              'Sabudana khichdi',
            ],
          },
        ],
      },
      {
        id: 'brunch-light',
        eyebrow: 'Page III',
        title: 'Light Mains & Sweets',
        sections: [
          {
            title: 'Light mains',
            items: [
              'Mushroom risotto',
              'Chilli-cheese toast',
              'Veg quiche',
              'Quinoa salad with pomegranate',
              'Caesar salad with crouton',
              'Pasta primavera',
              'Veg lasagna',
              'Mushroom crepe',
              'Pesto pasta salad',
            ],
          },
          {
            title: 'Sweet things',
            items: [
              'Mango cheesecake',
              'Coconut laddu',
              'Banana bread',
              'Fresh fruit platter',
              'Lemon drizzle cake',
              'Chocolate brownie',
              'Cinnamon rolls',
              'Mini cupcakes',
              'Trifle in glass',
              'Kheer shooter',
            ],
          },
        ],
      },
    ],
  },

  /* ───────────────────────── WEDDING BANQUET ───────────────── */
  {
    id: 'wedding-banquet',
    name: 'Wedding Banquet',
    tagline: 'A full-day spread, choreographed end to end.',
    summary:
      'Our most extensive collection — eight live counters, a sweet pavilion ' +
      'and curated regional menus for every function across the wedding.',
    accent: '#9d174d',
    motif: 'fa-ring',
    /* Indian thali platter — from gallery.js, vetted veg. */
    image:
      'data:image/jpeg;base64,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',
    bestFor: ['Weddings', 'Receptions', 'Multi-event functions'],
    pages: [
      {
        id: 'wedding-welcome',
        eyebrow: 'Page I',
        title: 'Welcome Pavilion',
        sections: [
          {
            title: 'Welcome drinks',
            items: [
              'Rose · Khus · Kesar sherbet',
              'Aam panna · Jal jeera',
              'Saffron-pista milk',
              'Thandai',
              'Tender coconut',
              'Masala chaas · Sweet lassi',
              'Mocktail bar — five recipes',
              'Live mocktail counter with mixologist',
              'Filter coffee · Masala chai',
            ],
          },
          {
            title: 'Chaat & papdi pavilion',
            items: [
              'Pani puri with five jal varieties',
              'Aloo tikki chaat',
              'Sev puri · Bhel puri',
              'Raj kachori',
              'Dahi bhalla papdi',
              'Samosa chaat',
              'Pav bhaji counter',
              'Vada pav',
              'Dabeli',
              'Ragda pattice',
              'Palak patta chaat',
              'Khasta kachori',
            ],
          },
          {
            title: 'Salads & soups',
            items: [
              'Sprout chaat salad',
              'Greek salad',
              'Russian salad',
              'Caesar salad',
              'Tomato dhaniya shorba',
              'Sweet corn soup',
              'Saffron almond shorba',
            ],
          },
        ],
      },
      {
        id: 'wedding-counters',
        eyebrow: 'Page II',
        title: 'Live Counters',
        sections: [
          {
            title: 'South Indian counter',
            items: [
              'Live dosa station — masala, paper, ghee, onion',
              'Mini idli with sambar shots',
              'Pesarattu live',
              'Filter coffee',
              'Punugulu',
              'Mysore bonda',
            ],
          },
          {
            title: 'Tandoor counter',
            items: [
              'Paneer tikka · Hariyali paneer',
              'Mushroom kebab',
              'Tandoori broccoli',
              'Soya malai chaap',
              'Bharwan aloo',
              'Live naan & roti',
              'Sheermal · Lachha paratha',
            ],
          },
          {
            title: 'Pasta & pizza',
            items: [
              'Build-your-pasta — penne, fettuccine, spaghetti',
              'Wood-fired pizzette',
              'Bruschetta selection',
              'Garlic bread',
              'Mac & cheese',
            ],
          },
          {
            title: 'Pan-Asian counter',
            items: [
              'Hakka noodles · Schezwan rice',
              'Thai green curry',
              'Pad Thai',
              'Manchow soup',
              'Crispy corn · Salt-pepper babycorn',
            ],
          },
        ],
      },
      {
        id: 'wedding-mains',
        eyebrow: 'Page III',
        title: 'Banquet Mains',
        sections: [
          {
            title: 'North Indian',
            items: [
              'Paneer butter masala',
              'Shahi paneer',
              'Kadai paneer',
              'Dal makhani',
              'Subz nawabi korma',
              'Phool makhana matar',
              'Malai kofta',
              'Veg jalfrezi',
              'Bhindi masala',
              'Chole masala',
            ],
          },
          {
            title: 'Telangana & Andhra',
            items: [
              'Gutti vankaya',
              'Bendakaya pulusu',
              'Pappu charu',
              'Mirchi ka salan',
              'Vankaya allam pachimirchi',
              'Aratikaya curry',
              'Tomato pappu',
              'Pepper rasam',
              'Pulihora',
            ],
          },
          {
            title: 'Rice & breads',
            items: [
              'Hyderabadi dum biryani',
              'Bagara rice',
              'Veg pulav',
              'Jeera rice',
              'Curd rice',
              'Butter naan',
              'Lachha paratha',
              'Phulka',
              'Jowar roti',
              'Tandoori roti',
            ],
          },
        ],
      },
      {
        id: 'wedding-sweets',
        eyebrow: 'Page IV',
        title: 'Sweet Pavilion',
        sections: [
          {
            title: 'Heirloom sweets',
            items: [
              'Bobbatlu',
              'Pootharekulu',
              'Madatha kaja',
              'Ariselu',
              'Kova kajjikayalu',
              'Sunnundalu',
              'Boondi laddu',
              'Mysurpak',
              'Kaju katli',
              'Pista burfi',
            ],
          },
          {
            title: 'Plated finishers',
            items: [
              'Shahi tukda',
              'Angoor rasmalai',
              'Carrot halwa with kulfi',
              'Gulab jamun cheesecake',
              'Phirni in kullad',
              'Double ka meetha',
              'Rabri-jalebi',
              'Kulfi falooda',
              'Mango cheesecake (seasonal)',
            ],
          },
          {
            title: 'Live counters & paan',
            items: [
              'Live jalebi with rabri',
              'Hot gulab jamun station',
              'Live waffle / pancake station',
              'Chocolate fountain',
              'Meetha paan · Chocolate paan',
              'Silver-leaf paan',
              'Mukhwas selection',
            ],
          },
        ],
      },
    ],
  },

  /* ───────────────────────── CORPORATE SELECT ───────────────── */
  {
    id: 'corporate-select',
    name: 'Corporate Select',
    tagline: 'Composed, considered, on time — every guest served the same.',
    summary:
      'A tightly-edited menu built for offsites, conferences and seminars — ' +
      'predictable timing, plated portions and a clean, professional buffet flow.',
    accent: '#1e3a8a',
    motif: 'fa-briefcase',
    /* Mediterranean veg mezze — from legacy menus.js (Mediterranean Magic),
       vetted as pure-veg on this same site. */
    image:
      'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=900&q=80',
    bestFor: ['Conferences', 'Offsite lunches', 'Seminars'],
    pages: [
      {
        id: 'corporate-am',
        eyebrow: 'Page I',
        title: 'Morning Tea',
        sections: [
          {
            title: 'Beverages',
            items: [
              'Filter coffee',
              'Cappuccino · Latte · Americano',
              'Masala chai · Cardamom chai',
              'Green tea · Lemon tea · Chamomile',
              'Fresh fruit juice',
              'Sparkling water · Still water',
              'Iced tea',
            ],
          },
          {
            title: 'Light bites',
            items: [
              'Mini idli with sambar shots',
              'Vegetable cutlet',
              'Croissant & danish',
              'Cookies & biscotti',
              'Mini sandwich platter',
              'Fruit cup',
              'Granola yoghurt parfait',
              'Mini muffin assortment',
              'Mini quiche',
            ],
          },
        ],
      },
      {
        id: 'corporate-lunch',
        eyebrow: 'Page II',
        title: 'Working Lunch',
        sections: [
          {
            title: 'Salad & soup',
            items: [
              'Caesar salad with crouton',
              'Greek salad',
              'Pasta salad with sundried tomato',
              'Quinoa salad',
              'Sweet corn soup',
              'Tomato basil shooter',
              'Minestrone',
              'Mushroom cappuccino soup',
            ],
          },
          {
            title: 'Indian buffet',
            items: [
              'Paneer butter masala',
              'Dal tadka',
              'Mixed vegetable curry',
              'Aloo gobi',
              'Bhindi masala',
              'Jeera rice · Veg pulav',
              'Hyderabadi veg biryani',
              'Roti · Naan · Lachha paratha',
              'Boondi raita · Kachumber',
              'Pickle & papad',
            ],
          },
          {
            title: 'Continental & dessert',
            items: [
              'Penne arrabiata',
              'Mushroom risotto',
              'Vegetable lasagna',
              'Garlic bread',
              'Gulab jamun',
              'Fresh fruit platter',
              'Mini brownies',
              'Tiramisu cup',
            ],
          },
        ],
      },
      {
        id: 'corporate-pm',
        eyebrow: 'Page III',
        title: 'High Tea',
        sections: [
          {
            title: 'Savouries',
            items: [
              'Veg sandwich (three varieties)',
              'Samosa · Kachori',
              'Vada pav · Pav bhaji',
              'Hara bhara kebab',
              'Mini puff pastry',
              'Spinach quiche',
              'Aloo tikki',
              'Dahi puri',
              'Sev puri',
            ],
          },
          {
            title: 'Sweets',
            items: [
              'Mini gulab jamun',
              'Coconut laddu',
              'Eclair · Cupcake',
              'Mini cheesecake',
              'Macarons',
              'Chocolate truffle',
              'Pista burfi',
              'Mini brownie',
            ],
          },
        ],
      },
    ],
  },

  /* ───────────────────────── FESTIVE SPREAD ──────────────────── */
  {
    id: 'festive-spread',
    name: 'Festive Spread',
    tagline: 'A pan-Indian table for Diwali, Sankranti and the days that matter.',
    summary:
      'Sattvic-friendly festive cooking — Mughlai, Afghani, Telangana and ' +
      'classical Indian sweets, designed for Diwali nights and pooja gatherings.',
    accent: '#b45309',
    motif: 'fa-fire',
    /* Indian sweets / desserts — from gallery.js, vetted veg. */
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQyLayZr5SLciTvFwmB8ZCmjgvQhGZrDrF9MQ&s',
    bestFor: ['Diwali · Sankranti', 'Pooja gatherings', 'Festive evenings'],
    pages: [
      {
        id: 'festive-welcome',
        eyebrow: 'Page I',
        title: 'Festive Welcome',
        sections: [
          {
            title: 'Welcome drinks',
            items: [
              'Saffron-pista milk',
              'Thandai shooter',
              'Panakam',
              'Buttermilk with curry leaf',
              'Rose sherbet',
              'Aam panna (seasonal)',
              'Tender coconut',
              'Masala chai · Filter coffee',
              'Kashmiri kahwa',
            ],
          },
          {
            title: 'Festive starters',
            items: [
              'Hariyali paneer tikka',
              'Afghani malai paneer',
              'Mushroom shami',
              'Aloo tuk',
              'Khasta kachori',
              'Dahi ke kebab',
              'Soya chaap',
              'Veg seekh',
              'Tandoori broccoli',
              'Bharwan mirch',
              'Cocktail samosa',
              'Crispy corn chaat',
            ],
          },
        ],
      },
      {
        id: 'festive-mains',
        eyebrow: 'Page II',
        title: 'Festive Mains',
        sections: [
          {
            title: 'Mughlai & Afghani',
            items: [
              'Subz nawabi korma',
              'Afghani paneer (cashew-cream)',
              'Mughlai kofta',
              'Phool makhana matar',
              'Paneer pasanda',
              'Methi malai mutter',
              'Dum aloo Banarasi',
              'Nargisi kofta',
            ],
          },
          {
            title: 'Regional pure-veg',
            items: [
              'Gutti vankaya',
              'Bendakaya pulusu',
              'Mirchi ka salan',
              'Pappu charu',
              'Aratikaya curry',
              'Vankaya allam pachimirchi',
              'Tomato pappu',
              'Bagara baingan',
            ],
          },
          {
            title: 'Rice & breads',
            items: [
              'Hyderabadi veg dum biryani',
              'Bagara rice',
              'Pulihora',
              'Veg pulav',
              'Sheermal',
              'Lachha paratha',
              'Phulka',
              'Tandoori roti',
              'Butter naan',
            ],
          },
        ],
      },
      {
        id: 'festive-sweets',
        eyebrow: 'Page III',
        title: 'Sweet Pavilion',
        sections: [
          {
            title: 'Festive classics',
            items: [
              'Motichoor laddu',
              'Boondi laddu',
              'Kaju katli',
              'Pista burfi',
              'Anjeer burfi',
              'Sooji halwa',
              'Carrot halwa with rabri',
              'Moong dal halwa',
              'Besan laddu',
              'Coconut laddu',
              'Gulab jamun',
              'Rasmalai',
            ],
          },
          {
            title: 'Live jalebi & faluda',
            items: [
              'Hot jalebi with rabri',
              'Imarti',
              'Faluda with rose & saffron',
              'Kulfi station',
              'Live malpua with rabri',
              'Pootharekulu live',
              'Live ghee bobbatlu',
            ],
          },
          {
            title: 'Paan & mukhwas',
            items: [
              'Meetha paan',
              'Silver-leaf paan',
              'Chocolate paan',
              'Mukhwas tray',
              'Saunf-misri thali',
              'Roasted chana-jaggery',
            ],
          },
        ],
      },
    ],
  },
];

export default menuCollections;

/**
 * Featured collections for the home preview (first 3 by default).
 */
export const FEATURED_COLLECTIONS = ['signature', 'wedding-banquet', 'celebration'];

/**
 * Total dish count across all collections — handy for hero strap-lines.
 */
export const TOTAL_COLLECTION_DISHES = menuCollections.reduce(
  (total, col) =>
    total +
    col.pages.reduce(
      (pageTotal, page) =>
        pageTotal + page.sections.reduce((secTotal, sec) => secTotal + sec.items.length, 0),
      0
    ),
  0
);
