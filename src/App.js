/**
 * Application root.
 *
 * Owns four responsibilities and only those four:
 *   1. Splash-on-first-load gating.
 *   2. Global chrome composition (header, footer, scroll progress, FABs).
 *   3. Route declarations via react-router-dom (path-based URLs, no hash).
 *   4. Admin auth gate + global "auth-expired" event listener that bounces
 *      back to the login screen.
 *
 * Routing model:
 *   We use `<BrowserRouter>` (set up in src/index.js). URLs look like
 *   `/contact`, `/menus`, `/admin/dashboard` — no hash. For static-host
 *   deployments (Vercel/Netlify/Render-static), the SPA-fallback config
 *   in `vercel.json` rewrites all 404s to `/index.html`.
 *
 *   The legacy hash form `/#contact?t=abc` is migrated on first load by
 *   `useLegacyHashRedirect` — a one-shot effect that rewrites the URL to
 *   the new path-based form so old emailed links keep working.
 *
 * Code splitting:
 *   Every non-Home page is loaded via React.lazy. Most home-page visitors
 *   never reach the others; chunks are deferred and only fetched on first
 *   navigation, then cached.
 */

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate as useRouterNavigate } from 'react-router-dom';
import './App.css';
import './Pages.css';
import './Admin.css';
import './responsive.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

import EntryAnimation from './EntryAnimation';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ScrollProgress from './components/layout/ScrollProgress';
import RouteLoader from './components/ui/RouteLoader';

import WhatsAppFAB from './components/floating/WhatsAppFAB';
import FloatingCTA from './components/floating/FloatingCTA';
import BackToTop from './components/floating/BackToTop';

import HomePage from './pages/HomePage';
import { ToastProvider } from './pages/admin/useToast';
import AdminLayout from './components/admin/layout/AdminLayout';

/* HomePage is eagerly imported because it is the landing page for every
   first-time visitor. Lazy-loading it would add a chunk-fetch hop in the
   critical render path. */
const AboutPage         = lazy(() => import('./pages/AboutPage'));
const ServicesPage      = lazy(() => import('./pages/ServicesPage'));
const MenusPage         = lazy(() => import('./pages/MenusPage'));
const GalleryPage       = lazy(() => import('./pages/GalleryPage'));
const ReviewsPage       = lazy(() => import('./pages/ReviewsPage'));
const ContactPage       = lazy(() => import('./pages/ContactPage'));
const ClientReviewsPage = lazy(() => import('./pages/ClientReviewsPage'));

/* Admin pages — lazy-loaded like the public ones. */
const AdminLoginPage         = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboardPage     = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminReviewsPage       = lazy(() => import('./pages/admin/ReviewsPage'));
const AdminSendInvitationPage= lazy(() => import('./pages/admin/SendInvitationPage'));
const AdminClientsPage       = lazy(() => import('./pages/admin/ClientsPage'));
const AdminEmailBuilderPage  = lazy(() => import('./pages/admin/EmailBuilderPage'));
const AdminQuotesPage        = lazy(() => import('./pages/admin/QuotesPage'));
const AdminBookingsPage      = lazy(() => import('./pages/admin/BookingsPage'));
const AdminBookingDetailPage = lazy(() => import('./pages/admin/BookingDetailPage'));
const AdminVendorsPage       = lazy(() => import('./pages/admin/VendorsPage'));
const AdminVendorDetailPage  = lazy(() => import('./pages/admin/VendorDetailPage'));
const AdminPurchaseOrdersPage      = lazy(() => import('./pages/admin/PurchaseOrdersPage'));
const AdminPurchaseOrderDetailPage = lazy(() => import('./pages/admin/PurchaseOrderDetailPage'));
const AdminInvoicesPage      = lazy(() => import('./pages/admin/InvoicesPage'));
const AdminInvoiceDetailPage = lazy(() => import('./pages/admin/InvoiceDetailPage'));
const AdminTransactionsPage  = lazy(() => import('./pages/admin/TransactionsPage'));
const AdminSubscribersPage   = lazy(() => import('./pages/admin/SubscribersPage'));
const AdminCampaignsPage     = lazy(() => import('./pages/admin/CampaignsPage'));

/**
 * Suspense fallback while a lazy chunk is in flight.
 * Intentionally empty — chunks are small and the wait is sub-200ms on a
 * normal connection. A spinner here would flash and feel slower than just
 * letting the next page paint when ready.
 */
const PageFallback = () => <div className="page-fallback" aria-hidden="true" />;

/**
 * Decide whether to show the opening splash for this page load.
 * Skips when prefers-reduced-motion is set or the splash already played
 * in this window instance (i.e. soft refresh, in-tab navigation).
 */
const shouldShowSplash = () => {
  try {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
    if (window.__splashShown) return false;
    return true;
  } catch {
    return true;
  }
};

/**
 * One-shot legacy hash → path migration. Runs only when the URL still
 * carries an old `/#contact?t=abc` form, rewriting it to `/contact?t=abc`
 * via `replaceState` (not `pushState`, so the back button isn't polluted).
 *
 * Mounted once at App root.
 */
const useLegacyHashRedirect = () => {
  const navigate = useRouterNavigate();
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash || '';
    if (!hash.startsWith('#')) return;
    const stripped = hash.slice(1); // e.g. "feedback?t=abc" or "admin-login"
    if (!stripped) return;

    const [idPart, queryPart = ''] = stripped.split('?');
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
    const path = ID_TO_PATH[idPart];
    if (!path) return;

    const search = queryPart ? `?${queryPart}` : '';
    navigate({ pathname: path, search }, { replace: true });
  }, [navigate]);
};

/**
 * Cross-tab + intra-tab "auth-expired" handler. The api client dispatches
 * `skc:auth-expired` on 401/403 from any admin endpoint; this listener
 * bounces the user to the login screen so they don't sit on a stale UI.
 * The matching `storage` listener picks up logouts in other tabs.
 */
const useAuthExpiryHandler = () => {
  const navigate = useRouterNavigate();
  useEffect(() => {
    const onExpired = () => navigate('/admin/login', { replace: true });
    const onStorage = (e) => {
      if (e.key === 'adminToken' && !e.newValue) {
        navigate('/admin/login', { replace: true });
      }
    };
    window.addEventListener('skc:auth-expired', onExpired);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('skc:auth-expired', onExpired);
      window.removeEventListener('storage', onStorage);
    };
  }, [navigate]);
};

/**
 * Admin auth gate. When the user lands on an admin path that isn't the
 * login screen, verify a non-expired token is present in localStorage; if
 * not, redirect to login. Mirrors the original behaviour from the
 * hash-routed version.
 */
const useAdminAuthGate = (pathname) => {
  const navigate = useRouterNavigate();
  useEffect(() => {
    const isAdmin = pathname.startsWith('/admin');
    const isLogin = pathname === '/admin/login';
    if (!isAdmin || isLogin) return;

    const token = localStorage.getItem('adminToken');
    const expiry = localStorage.getItem('adminTokenExpiry');
    const authed = token && expiry && Date.now() < parseInt(expiry, 10);
    if (!authed) navigate('/admin/login', { replace: true });
  }, [pathname, navigate]);
};

/**
 * Snap to top + clear page-shell scroll on each navigation. Instant scroll
 * (not smooth) is intentional — a smooth scroll across an entire
 * page-height feels slow on long content.
 */
const useScrollToTopOnNav = (pathname) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
};

/**
 * Prefetch the most-likely-next pages during browser idle time so the first
 * navigation feels instant. requestIdleCallback fires after the browser has
 * finished critical work; falls back to setTimeout on Safari (no API).
 */
const useIdlePrefetch = () => {
  useEffect(() => {
    const prefetch = () => {
      import('./pages/MenusPage');
      import('./pages/ContactPage');
    };
    const ric = window.requestIdleCallback;
    const id = ric
      ? ric(prefetch, { timeout: 4000 })
      : window.setTimeout(prefetch, 2500);
    return () => {
      if (ric && window.cancelIdleCallback) window.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, []);
};

/**
 * Small abstraction so each Suspense + PageFallback boundary stays uniform.
 */
const Lazy = ({ children }) => (
  <Suspense fallback={<PageFallback />}>{children}</Suspense>
);

function App() {
  const { pathname } = useLocation();
  const [showAnimation, setShowAnimation] = useState(shouldShowSplash);

  useLegacyHashRedirect();
  useAuthExpiryHandler();
  useAdminAuthGate(pathname);
  useScrollToTopOnNav(pathname);
  useIdlePrefetch();

  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminShellRoute = isAdminRoute && pathname !== '/admin/login';

  const handleSplashComplete = () => {
    try { window.__splashShown = true; } catch { /* ignore */ }
    setShowAnimation(false);
  };

  /* Public routes share the page-shell <main key={pathname}> entrance
     animation. Admin routes that live inside AdminLayout share its sidebar
     and topbar across navigations, so we don't remount that shell on every
     route change — only its inner content remounts via the inner key. */
  const publicRoutes = (
    <main className="page-shell" key={pathname}>
      <Lazy>
        <Routes>
          <Route path="/"         element={<HomePage />} />
          <Route path="/about"    element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/menus"    element={<MenusPage />} />
          <Route path="/gallery"  element={<GalleryPage />} />
          <Route path="/reviews"  element={<ReviewsPage />} />
          <Route path="/contact"  element={<ContactPage />} />
          <Route path="/feedback" element={<ClientReviewsPage />} />
          {/* Admin login is full-bleed, no sidebar — rendered without
              AdminLayout but still inside ToastProvider. */}
          <Route
            path="/admin/login"
            element={
              <ToastProvider>
                <AdminLoginPage />
              </ToastProvider>
            }
          />
          {/* Anything we don't recognise on the public surface falls back
              to the home page. Acceptable for a small marketing site;
              swap for a real <NotFound /> component when needed. */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Lazy>
    </main>
  );

  const adminRoutes = (
    <ToastProvider>
      <AdminLayout>
        <Lazy>
          <Routes>
            <Route path="/admin/dashboard"        element={<AdminDashboardPage />} />
            <Route path="/admin/reviews"          element={<AdminReviewsPage />} />
            <Route path="/admin/send-invitation"  element={<AdminSendInvitationPage />} />
            <Route path="/admin/clients"          element={<AdminClientsPage />} />
            <Route path="/admin/emails"           element={<AdminEmailBuilderPage />} />
            <Route path="/admin/quotes"           element={<AdminQuotesPage />} />
            <Route path="/admin/bookings"         element={<AdminBookingsPage />} />
            <Route path="/admin/bookings/:id"     element={<AdminBookingDetailPage />} />
            <Route path="/admin/vendors"          element={<AdminVendorsPage />} />
            <Route path="/admin/vendors/:id"      element={<AdminVendorDetailPage />} />
            <Route path="/admin/purchase-orders"  element={<AdminPurchaseOrdersPage />} />
            <Route path="/admin/purchase-orders/:id" element={<AdminPurchaseOrderDetailPage />} />
            <Route path="/admin/invoices"         element={<AdminInvoicesPage />} />
            <Route path="/admin/invoices/:id"     element={<AdminInvoiceDetailPage />} />
            <Route path="/admin/transactions"     element={<AdminTransactionsPage />} />
            <Route path="/admin/subscribers"      element={<AdminSubscribersPage />} />
            <Route path="/admin/campaigns"        element={<AdminCampaignsPage />} />
            {/* Unknown /admin/* paths fall back to the dashboard. */}
            <Route path="/admin/*" element={<AdminDashboardPage />} />
          </Routes>
        </Lazy>
      </AdminLayout>
    </ToastProvider>
  );

  return (
    <div className="App">
      {showAnimation && <EntryAnimation onComplete={handleSplashComplete} />}

      {!isAdminRoute && (
        <>
          <ScrollProgress />
          <Header />
        </>
      )}

      <RouteLoader isLoading={false} />

      {isAdminShellRoute ? adminRoutes : publicRoutes}

      {!isAdminRoute && (
        <>
          <Footer />
          <FloatingCTA />
          <WhatsAppFAB />
          <BackToTop />
        </>
      )}
    </div>
  );
}

export default App;
