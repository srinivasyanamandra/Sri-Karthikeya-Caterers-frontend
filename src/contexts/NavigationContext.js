import { useCallback } from 'react';
import { useLocation, useNavigate as useRouterNavigate } from 'react-router-dom';
import { idOf, pathOf } from '../constants/navigation';

/**
 * Backward-compatible navigation hooks built on top of react-router-dom.
 *
 * Historical context: this app shipped originally with hash-based routing
 * driven by a `currentPage` state in App.js + a custom NavigationContext.
 * Migrating to path-based URLs (e.g. `/contact` vs the old `/#contact`)
 * could have required touching all 28 `navigate(...)` call sites. Instead,
 * the public hook surface — `useNavigate`, `useCurrentPage`, `useNavigation`
 * — is preserved verbatim and reimplemented over react-router. Existing
 * callers continue to pass route ids (`navigate('contact')`); new callers
 * may also pass absolute paths (`navigate('/contact')`).
 *
 * @typedef  {Object}  NavigationValue
 * @property {string}                 currentPage  Route id (e.g. 'contact').
 * @property {(id: string) => void}   navigate     Accepts id OR absolute path.
 */

/**
 * Provider is now a passthrough — `<BrowserRouter>` in src/index.js owns the
 * routing context. Kept for compatibility with any consumer that still imports
 * it (and to give a clean migration path back to a custom router if needed).
 */
export const NavigationProvider = ({ children }) => children;

/**
 * Current route id (e.g. 'contact', 'admin-dashboard'). Subscribes to
 * route changes via react-router's location.
 */
export const useCurrentPage = () => {
  const { pathname } = useLocation();
  return idOf(pathname);
};

/**
 * Returns a stable navigate function. Accepts either a legacy route id
 * (`'contact'`) or an absolute path (`'/contact'`) — `pathOf()` handles both.
 *
 * Wrapped in `useCallback` so consumers passing this to memoised children
 * don't trigger needless re-renders.
 */
export const useNavigate = () => {
  const routerNavigate = useRouterNavigate();
  return useCallback(
    (idOrPath) => {
      if (!idOrPath) return;
      routerNavigate(pathOf(idOrPath));
    },
    [routerNavigate]
  );
};

/**
 * Convenience for callers that genuinely need both id and navigate.
 *
 * @returns {NavigationValue}
 */
export const useNavigation = () => ({
  currentPage: useCurrentPage(),
  navigate: useNavigate(),
});
