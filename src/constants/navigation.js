/** Routes/pages — used by Header nav, Footer links, mobile menu. */
export const ROUTES = {
  HOME: 'home',
  ABOUT: 'about',
  SERVICES: 'services',
  MENUS: 'menus',
  GALLERY: 'gallery',
  REVIEWS: 'reviews',
  CONTACT: 'contact',
  FEEDBACK: 'feedback', // Comprehensive review submission
};

/** Primary navigation order for header/mobile menu. */
export const PRIMARY_NAV = [
  { id: ROUTES.HOME, label: 'Home' },
  { id: ROUTES.ABOUT, label: 'About' },
  { id: ROUTES.SERVICES, label: 'Services' },
  { id: ROUTES.MENUS, label: 'Menus' },
  { id: ROUTES.GALLERY, label: 'Gallery' },
  { id: ROUTES.REVIEWS, label: 'Reviews' },
  { id: ROUTES.CONTACT, label: 'Contact' },
];

/** Footer "Explore" links — subset of primary nav. */
export const FOOTER_EXPLORE = [
  { id: ROUTES.ABOUT, label: 'About us' },
  { id: ROUTES.SERVICES, label: 'Services' },
  { id: ROUTES.MENUS, label: 'Menus' },
  { id: ROUTES.GALLERY, label: 'Gallery' },
  { id: ROUTES.REVIEWS, label: 'Reviews' },
  { id: ROUTES.CONTACT, label: 'Contact' },
  { id: ROUTES.FEEDBACK, label: 'Share feedback' },
];
