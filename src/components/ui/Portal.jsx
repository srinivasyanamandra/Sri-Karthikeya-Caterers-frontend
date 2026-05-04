import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Portal — render children directly under <body>.
 *
 * Why: any ancestor with a non-`none` transform / filter / contain becomes
 * the containing block for `position: fixed` descendants, which clips
 * full-screen overlays (modals, drawers, brochures) inside that ancestor.
 * Public pages animate `<main className="page-shell">` with a translate
 * keyframe + animation-fill-mode: both, so its transform is permanent.
 * Portaling the overlay to <body> sidesteps the trap entirely.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
const Portal = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(children, document.body);
};

export default Portal;
