import { useEffect, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Eased count-up animation from `start` to `target`.
 * Re-runs whenever `enabled` flips true (e.g., when an element enters viewport).
 */
export default function useCountUp(target, { duration = 1600, start = 0, enabled = true } = {}) {
  const [value, setValue] = useState(start);

  useEffect(() => {
    if (!enabled) return;
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    let raf = 0;
    const startTime = performance.now();
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const tick = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      setValue(Math.round(start + (target - start) * easeOutCubic(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start, enabled]);

  return value;
}
