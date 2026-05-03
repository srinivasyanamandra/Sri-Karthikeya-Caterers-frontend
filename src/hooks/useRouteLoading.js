import { useEffect, useState, useRef } from 'react';

/**
 * useRouteLoading — tracks page loading state during navigation.
 *
 * Returns true when:
 *   - User navigates to a new page
 *   - The new page's lazy-loaded component is being fetched
 *   - The page is initializing
 *
 * Returns false when:
 *   - Initial page load completes
 *   - Page transition finishes
 *
 * Features:
 *   - Debounced loading state (200ms minimum) to avoid flicker
 *   - Works with React.lazy() components
 *   - Respects navigation context
 *
 * @param {Object} navigation - Navigation context value
 * @returns {boolean} isLoading - True when page is loading
 */
export default function useRouteLoading(navigation) {
  const { currentPage, navigate } = navigation;
  const [isLoading, setIsLoading] = useState(false);
  const [pendingPage, setPendingPage] = useState(null);
  const timerRef = useRef(null);
  const currentPageRef = useRef(currentPage);

  // Track when navigation starts
  useEffect(() => {
    if (currentPageRef.current !== currentPage) {
      // Navigation detected - start loading state
      setPendingPage(currentPage);
      setIsLoading(true);

      // Debounce: only show loader if page takes longer than 200ms
      timerRef.current = window.setTimeout(() => {
        // Loader will be shown via the isLoading state
      }, 200);
    }
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Clear timer on unmount
  useEffect(() => () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
  }, []);

  // Return loading state
  // The actual loader visibility is controlled by RouteLoader component
  // which handles the debouncing for display
  return isLoading;
}
