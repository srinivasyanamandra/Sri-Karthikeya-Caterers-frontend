import { useEffect } from 'react';

/**
 * Updates the `--scroll` CSS custom property on <html> based on scroll position.
 * Throttled with requestAnimationFrame for smoothness.
 */
export default function useScrollProgress(propertyName = '--scroll') {
  useEffect(() => {
    let raf = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      document.documentElement.style.setProperty(propertyName, `${pct}%`);
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [propertyName]);
}
