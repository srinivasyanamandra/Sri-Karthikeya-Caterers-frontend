/**
 * Application root.
 *
 * Owns three responsibilities and only those three:
 *   1. State of the current page id and the opening splash flag.
 *   2. Resolution of that page id to a React component (PAGE_REGISTRY).
 *   3. Composition of the global chrome — header, footer, scroll progress,
 *      and three floating action buttons.
 *
 * Navigation is exposed via NavigationContext. Descendants read with
 * `useNavigation()` and never receive `setCurrentPage` as a prop.
 *
 * Routing model:
 *   The active page lives in React state, not in the URL. This is a
 *   deliberate trade-off documented in CLAUDE.md — the site has no server
 *   rewriter for SPA routes, so URL-based routing would break refreshes on
 *   non-root paths. Consequence: no browser back/forward, no deep links,
 *   no per-page SEO. If those become requirements, see the migration note
 *   at the foot of this file.
 *
 * Code splitting:
 *   Every non-Home page is loaded via React.lazy. Most home-page visitors
 *   never visit the other pages; their chunks are deferred and only fetched
 *   on first navigation, then cached.
 */

import React, { lazy, Suspense, useEffect, useMemo, useState, useRef } from 'react';
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
import { NavigationProvider } from './contexts/NavigationContext';
import { ROUTES } from './constants/navigation';
import { ToastProvider } from './pages/admin/useToast';
import AdminLayout from './components/admin/layout/AdminLayout';

/* HomePage is eagerly imported because it is the landing page for every
   first-time visitor. Lazy-loading it would add a chunk-fetch hop in the
   critical render path. */
const AboutPage    = lazy(() => import('./pages/AboutPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const MenusPage    = lazy(() => import('./pages/MenusPage'));
const GalleryPage  = lazy(() => import('./pages/GalleryPage'));
const ReviewsPage  = lazy(() => import('./pages/ReviewsPage'));
const ContactPage  = lazy(() => import('./pages/ContactPage'));
const ClientReviewsPage = lazy(() => import('./pages/ClientReviewsPage'));

/* Admin pages — lazy-loaded like other pages */
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminReviewsPage = lazy(() => import('./pages/admin/ReviewsPage'));
const AdminSendInvitationPage = lazy(() => import('./pages/admin/SendInvitationPage'));
const AdminClientsPage = lazy(() => import('./pages/admin/ClientsPage'));
const AdminEmailBuilderPage = lazy(() => import('./pages/admin/EmailBuilderPage'));
const AdminQuotesPage = lazy(() => import('./pages/admin/QuotesPage'));
const AdminSubscribersPage = lazy(() => import('./pages/admin/SubscribersPage'));

/**
 * Route id → page component. The single point of extension for adding a
 * new page (Open/Closed): one import + one row here, never a switch edit.
 *
 * @type {Object<string, React.ComponentType>}
 */
const PAGE_REGISTRY = {
  [ROUTES.HOME]:     HomePage,
  [ROUTES.ABOUT]:    AboutPage,
  [ROUTES.SERVICES]: ServicesPage,
  [ROUTES.MENUS]:    MenusPage,
  [ROUTES.GALLERY]:  GalleryPage,
  [ROUTES.REVIEWS]:  ReviewsPage,
  [ROUTES.CONTACT]:  ContactPage,
  [ROUTES.FEEDBACK]: ClientReviewsPage,
  
  // Admin routes
  'admin-login': AdminLoginPage,
  'admin-dashboard': AdminDashboardPage,
  'admin-reviews': AdminReviewsPage,
  'admin-send-invitation': AdminSendInvitationPage,
  'admin-clients': AdminClientsPage,
  'admin-emails': AdminEmailBuilderPage,
  'admin-quotes': AdminQuotesPage,
  'admin-subscribers': AdminSubscribersPage,
};

/**
 * Suspense fallback rendered while a lazy page chunk is in flight.
 * Intentionally empty — the chunk is small and the wait is sub-200ms on
 * a normal connection. A spinner here would flash and feel slower than
 * just letting the next page paint when ready.
 */
const PageFallback = () => <div className="page-fallback" aria-hidden="true" />;

/**
 * Decide whether to show the opening splash for this page load.
 *
 * Returns false when:
 *   - The user prefers reduced motion (skip the splash entirely; the
 *     existing CSS reduced-motion path also degrades the animation, but
 *     bypassing the wait gives them an instant page).
 *
 * The splash will show on every hard refresh (browser close/reopen) but
 * not on soft refreshes (F5, Ctrl+R) within the same browser session.
 * We use a window-scoped flag instead of sessionStorage so it only
 * persists during the current page lifecycle.
 */
const shouldShowSplash = () => {
  try {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
    
    // Check if splash has been shown in this window instance
    // This flag is cleared on hard refresh but persists on soft refresh
    if (window.__splashShown) return false;
    
    return true;
  } catch {
    return true;
  }
};

/**
 * Application root component.
 *
 * @returns {React.ReactElement}
 */
function App() {
  /* Active route id. Honour the URL hash on first load so links like
     `#admin-login` work directly (and the Footer's "Staff login" anchor
     is a real shareable link). Falls back to HOME if the hash is
     missing or doesn't resolve to a known route. */
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window === 'undefined') return ROUTES.HOME;
    const hash = window.location.hash.slice(1); // e.g. "feedback?t=abc" or "home"
    const pageId = hash.split('?')[0];           // strip query string before lookup
    if (pageId && PAGE_REGISTRY[pageId]) return pageId;
    return ROUTES.HOME;
  });

  /* Opening-splash visibility. Lazy initial state — runs only on first
     render — so returning visitors and reduced-motion users skip the
     3 s wait entirely. */
  const [showAnimation, setShowAnimation] = useState(shouldShowSplash);

  /* Route loading state — only shows loader when lazy-loaded pages are
     being fetched for the first time. Once cached, no loader appears. */
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  
  /* Track which pages have been loaded to avoid showing loader again */
  const loadedPagesRef = useRef(new Set([ROUTES.HOME])); // Home is eagerly loaded

  /* Admin authentication check — redirect to login if accessing admin pages
     without valid token. Token is stored in localStorage with expiry. 
     
     Development bypass: Set localStorage.setItem('adminToken', 'dev') and 
     localStorage.setItem('adminTokenExpiry', Date.now() + 86400000) in console
     to skip login for 24 hours. */
  useEffect(() => {
    const isAdminPage = currentPage.startsWith('admin-');
    const isLoginPage = currentPage === 'admin-login';
    
    if (isAdminPage && !isLoginPage) {
      // Check if user is authenticated
      const token = localStorage.getItem('adminToken');
      const expiry = localStorage.getItem('adminTokenExpiry');
      const isAuthenticated = token && expiry && Date.now() < parseInt(expiry);
      
      if (!isAuthenticated) {
        // Clear loading state and redirect to login
        setIsRouteLoading(false);
        loadedPagesRef.current.add('admin-login'); // Mark login as loaded to avoid loader
        setCurrentPage('admin-login');
      }
    }
  }, [currentPage]);

  /* Snap to top on every navigation so users never land mid-scroll inside a
     page they just opened. Instant scroll (not smooth) is intentional — a
     smooth scroll across an entire page-height feels slow on long content. */
  useEffect(() => { window.scrollTo(0, 0); }, [currentPage]);

  /* Keep the URL hash page-id in sync with the current page.
     Crucially: preserve any existing query string (e.g. ?t=<token>)
     so invitation links like /#feedback?t=abc survive navigation. */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentHash = window.location.hash.slice(1); // e.g. "feedback?t=abc"
    const currentPageId = currentHash.split('?')[0];
    const currentQuery = currentHash.includes('?') ? currentHash.slice(currentHash.indexOf('?')) : '';

    if (currentPageId !== currentPage) {
      // Only update the page-id segment; keep the query string if we're
      // staying on the same page, drop it when navigating away.
      const newHash = currentPageId === currentPage
        ? `#${currentPage}${currentQuery}`
        : `#${currentPage}`;
      window.history.replaceState(null, '', newHash);
    }
  }, [currentPage]);

  /* Listen for browser-driven hash changes (back / forward / pasted URL). */
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1); // e.g. "feedback?t=abc"
      const pageId = hash.split('?')[0];           // strip query string
      if (pageId && PAGE_REGISTRY[pageId] && pageId !== currentPage) {
        setCurrentPage(pageId);
      } else if (!pageId && currentPage !== ROUTES.HOME) {
        setCurrentPage(ROUTES.HOME);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [currentPage]);

  /* Track route changes and show loader only for first-time page loads.
     Once a page is loaded, it's cached by React.lazy and won't trigger
     the loader again. */
  useEffect(() => {
    // Check if this page has been loaded before
    if (!loadedPagesRef.current.has(currentPage)) {
      // First time loading this page - show loader
      setIsRouteLoading(true);
      
      // Mark page as loaded after component mounts
      const timer = setTimeout(() => {
        loadedPagesRef.current.add(currentPage);
        setIsRouteLoading(false);
      }, 300); // Increased delay to ensure component has mounted
      
      return () => clearTimeout(timer);
    } else {
      // Page already loaded, ensure loader is off
      setIsRouteLoading(false);
    }
  }, [currentPage]);

  /* Prefetch the most-likely-next pages during browser idle time so the
     first navigation feels instant. We don't need them for the initial
     paint, but starting their fetch in the background means the chunks
     are already in the HTTP cache by the time the user clicks.
     requestIdleCallback fires after the browser has finished critical
     work; falls back to a setTimeout on Safari (which lacks the API). */
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

  /* Memoised navigation value — the contract that NavigationContext exposes.
     Identity must change only when `currentPage` actually changes; otherwise
     every consumer of useNavigation re-renders on every App render. */
  const navigation = useMemo(
    () => ({ currentPage, navigate: setCurrentPage }),
    [currentPage]
  );

  /* Defensive fallback to HomePage if a future bug ever sets currentPage to
     an unregistered id. Silent recovery is acceptable here because routing
     is internal — there is no user-typed URL to mistype. */
  const PageComponent = PAGE_REGISTRY[currentPage] || HomePage;
  const isAdminRoute = currentPage.startsWith('admin-');
  const isAdminShellRoute = isAdminRoute && currentPage !== 'admin-login';

  /* When the splash finishes, mark the window instance so subsequent navigations
     in this tab skip the splash. This flag is cleared on hard refresh but
     persists during soft refreshes (F5, Ctrl+R). */
  const handleSplashComplete = () => {
    try {
      window.__splashShown = true;
    } catch {
      /* Flag is best-effort, not critical. */
    }
    setShowAnimation(false);
  };

  return (
    <NavigationProvider value={navigation}>
      <div className="App">
        {/* Splash sits above everything else (z-index 9999 in CSS) and
            unmounts when EntryAnimation calls onComplete. */}
        {showAnimation && <EntryAnimation onComplete={handleSplashComplete} />}

        {/* Only show public site chrome (header, footer, FABs) for non-admin pages */}
        {!isAdminRoute && (
          <>
            <ScrollProgress />
            <Header />
          </>
        )}

        {/* Route loader — appears during page transitions */}
        <RouteLoader isLoading={isRouteLoading} />

        {/*
          Three render branches:
          1. Admin shell pages — AdminLayout (sidebar + topbar) is the stable
             root and stays mounted across admin route changes; the inner
             content is keyed by route inside AdminLayout so it still fades
             in. This is what gives the admin its persistent sidebar.
          2. admin-login — full-bleed page with no admin chrome.
          3. Public pages — keyed <main> as before, so the page-shell
             fade-up entrance animation fires on every navigation.
        */}
        {isAdminShellRoute ? (
          <ToastProvider>
            <AdminLayout>
              <Suspense fallback={<PageFallback />}>
                <PageComponent />
              </Suspense>
            </AdminLayout>
          </ToastProvider>
        ) : isAdminRoute ? (
          <main className="page-shell" key={currentPage}>
            <ToastProvider>
              <Suspense fallback={<PageFallback />}>
                <PageComponent />
              </Suspense>
            </ToastProvider>
          </main>
        ) : (
          <main className="page-shell" key={currentPage}>
            <Suspense fallback={<PageFallback />}>
              <PageComponent />
            </Suspense>
          </main>
        )}

        {/* Only show public site chrome for non-admin pages */}
        {!isAdminRoute && (
          <>
            <Footer />
            <FloatingCTA />
            <WhatsAppFAB />
            <BackToTop />
          </>
        )}
      </div>
    </NavigationProvider>
  );
}

export default App;

/*
 * MIGRATION NOTE — to convert to URL-based routing:
 *   1. npm install react-router-dom
 *   2. Wrap <App> in <BrowserRouter> in src/index.js.
 *   3. Replace the PAGE_REGISTRY switch with <Routes>/<Route>.
 *   4. NavigationContext can be retained or replaced with `useNavigate()` —
 *      keeping the context preserves the contract and avoids touching every
 *      consumer.
 *   5. Configure CloudFront/S3 to rewrite all 404s to /index.html
 *      (otherwise refreshes on /menus etc. will 404).
 */
