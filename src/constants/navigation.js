/**
 * Routes / pages — used by Header nav, Footer links, mobile menu, and the
 * router. Each ROUTE value is a stable *id* (kept for backward-compatibility
 * with existing call sites — `navigate('contact')`, `currentPage === 'contact'`,
 * `PAGE_META['admin-dashboard']`, etc.). The translation between ids and the
 * actual URL paths is handled by `pathOf()` and `idOf()` below.
 *
 * To add a new page: add an entry to ROUTES, ID_TO_PATH, and PRIMARY_NAV
 * (or the appropriate nav list). Wire the route in src/App.js.
 */
export const ROUTES = {
  HOME: 'home',
  ABOUT: 'about',
  SERVICES: 'services',
  MENUS: 'menus',
  GALLERY: 'gallery',
  REVIEWS: 'reviews',
  CONTACT: 'contact',
  FEEDBACK: 'feedback', // Comprehensive review submission
  ADMIN_LOGIN: 'admin-login',
  ADMIN_DASHBOARD: 'admin-dashboard',
  ADMIN_REVIEWS: 'admin-reviews',
  ADMIN_SEND_INVITATION: 'admin-send-invitation',
  ADMIN_CLIENTS: 'admin-clients',
  ADMIN_EMAILS: 'admin-emails',
  ADMIN_QUOTES: 'admin-quotes',
  ADMIN_BOOKINGS: 'admin-bookings',
  ADMIN_VENDORS: 'admin-vendors',
  ADMIN_PURCHASE_ORDERS: 'admin-purchase-orders',
  ADMIN_INVOICES: 'admin-invoices',
  ADMIN_TRANSACTIONS: 'admin-transactions',
  ADMIN_SUBSCRIBERS: 'admin-subscribers',
  ADMIN_CAMPAIGNS: 'admin-campaigns',
};

/**
 * Canonical id → path map. Single source of truth for the URL shape of
 * every page. Public pages live at the root, admin pages live under
 * `/admin/*` so reverse proxies and CDNs can apply a single auth rule
 * to the whole admin surface.
 */
const ID_TO_PATH = {
  home: '/',
  about: '/about',
  services: '/services',
  menus: '/menus',
  gallery: '/gallery',
  reviews: '/reviews',
  contact: '/contact',
  feedback: '/feedback',
  'admin-login': '/admin/login',
  'admin-dashboard': '/admin/dashboard',
  'admin-reviews': '/admin/reviews',
  'admin-send-invitation': '/admin/send-invitation',
  'admin-clients': '/admin/clients',
  'admin-emails': '/admin/emails',
  'admin-quotes': '/admin/quotes',
  'admin-bookings': '/admin/bookings',
  'admin-vendors': '/admin/vendors',
  'admin-purchase-orders': '/admin/purchase-orders',
  'admin-invoices': '/admin/invoices',
  'admin-transactions': '/admin/transactions',
  'admin-subscribers': '/admin/subscribers',
  'admin-campaigns': '/admin/campaigns',
};

const PATH_TO_ID = Object.entries(ID_TO_PATH).reduce((acc, [id, path]) => {
  acc[path] = id;
  return acc;
}, {});

/**
 * Resolve a route id or absolute path to a canonical pathname. Accepts
 * either form so legacy callers (`navigate('contact')`) and new callers
 * (`<Link to="/contact">`) both work without churn.
 *
 * @param   {string | undefined | null} idOrPath
 * @returns {string} A leading-slash path. Defaults to "/".
 */
export const pathOf = (idOrPath) => {
  if (!idOrPath) return '/';
  if (idOrPath.startsWith('/')) return idOrPath;
  return ID_TO_PATH[idOrPath] || '/';
};

/**
 * Reverse lookup: pathname → route id. Returns `home` for `/` or any
 * unknown path so callers using `currentPage === 'home'` for active-link
 * styling continue to behave correctly.
 *
 * @param   {string} pathname
 * @returns {string} Route id (e.g. "contact").
 */
export const idOf = (pathname) => {
  if (!pathname || pathname === '/') return ROUTES.HOME;
  const trimmed = pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;
  return PATH_TO_ID[trimmed] || ROUTES.HOME;
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
