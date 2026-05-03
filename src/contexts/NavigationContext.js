import { createContext, useContext } from 'react';

/**
 * @typedef  {Object}  NavigationValue
 * @property {string}                 currentPage
 * @property {(id: string) => void}   navigate
 */

/**
 * Navigation is split across two contexts so consumers re-render only when
 * the data they actually use changes:
 *
 *   - StateContext     holds `currentPage`. Changes on every navigation.
 *                      Only Header subscribes (for active-link styling).
 *   - DispatchContext  holds `navigate`. The setter from useState is
 *                      reference-stable across renders, so this context's
 *                      value never changes — its subscribers never re-render
 *                      due to navigation.
 *
 * Concretely: on every page change Header re-renders (correctly, to update
 * its active link), but Footer / FloatingCTA / WhatsAppFAB / BackToTop /
 * every home-section component skip the re-render entirely.
 */
const NavigationStateContext = createContext(null);
const NavigationDispatchContext = createContext(null);

/**
 * Wraps the app root and exposes both contexts. Pass the same shape as before
 * — `{ currentPage, navigate }` — so call sites in App.js need no change.
 */
export const NavigationProvider = ({ value, children }) => (
  <NavigationDispatchContext.Provider value={value.navigate}>
    <NavigationStateContext.Provider value={value.currentPage}>
      {children}
    </NavigationStateContext.Provider>
  </NavigationDispatchContext.Provider>
);

/** Read just the current page id. Subscribes to nav-change re-renders. */
export const useCurrentPage = () => {
  const value = useContext(NavigationStateContext);
  if (value === null) {
    throw new Error('useCurrentPage must be used within a <NavigationProvider>.');
  }
  return value;
};

/** Read just the navigate function. Reference-stable; never re-renders. */
export const useNavigate = () => {
  const value = useContext(NavigationDispatchContext);
  if (value === null) {
    throw new Error('useNavigate must be used within a <NavigationProvider>.');
  }
  return value;
};

/**
 * Convenience for callers that genuinely need both. Re-renders on every
 * navigation (because of `useCurrentPage`), so prefer the specific hooks
 * unless you actually use `currentPage`.
 *
 * @returns {NavigationValue}
 */
export const useNavigation = () => ({
  currentPage: useCurrentPage(),
  navigate: useNavigate(),
});
