import React, { useEffect, useState, useCallback } from 'react';
import './RouteLoader.css';

/**
 * RouteLoader — premium page-loading experience during navigation.
 *
 * Features:
 *   - Global loader at app shell level (App.js)
 *   - SVG logo animation with elegant scale/fade effects
 *   - Debounced display (200ms) to avoid flicker on fast transitions
 *   - Reduced motion support via prefers-reduced-motion
 *   - Zero layout shift (fixed overlay)
 *
 * Usage in App.js:
 *   <RouteLoader isLoading={isLoading} />
 *
 * @param {Object} props
 * @param {boolean} props.isLoading - When true, loader appears after debounce delay
 * @param {string} [props.brandName] - Optional brand name for accessibility
 */
const RouteLoader = ({ isLoading, brandName = 'Sri Karthikeya Caterers' }) => {
  const [visible, setVisible] = useState(false);
  const [animationState, setAnimationState] = useState('idle'); // 'idle' | 'entering' | 'active' | 'exiting'

  // Debounce loader appearance to avoid flicker on fast transitions
  useEffect(() => {
    if (isLoading) {
      // Start entering animation
      setAnimationState('entering');
      
      // Show after brief delay for smooth entrance
      const timer = setTimeout(() => {
        setVisible(true);
        setAnimationState('active');
      }, 50);
      
      return () => clearTimeout(timer);
    } else {
      // Start exiting animation
      setAnimationState('exiting');
      
      // Hide after animation completes
      const timer = setTimeout(() => {
        setVisible(false);
        setAnimationState('idle');
      }, 300); // Matches CSS transition duration
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Reduced motion support
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Render loader overlay
  if (!visible) return null;

  return (
    <div 
      className="route-loader"
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
    >
      <div className={`route-loader-content ${animationState} ${prefersReducedMotion ? 'reduced-motion' : ''}`}>
        <div className="route-loader-logo-wrapper">
          <img 
            src="/logo.png"
            alt={brandName}
            className="route-loader-logo"
            aria-hidden="true"
          />
        </div>
        <div className="route-loader-text">
          <span className="route-loader-brand">{brandName}</span>
          <span className="route-loader-status">Loading</span>
        </div>
      </div>
    </div>
  );
};

export default RouteLoader;
