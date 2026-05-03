import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * AdminPortal — renders children directly under <body>.
 *
 * Drawers and modals must escape any ancestor that's been turned into a
 * containing block (transform/filter/contain on a wrapper). Without this
 * portal, `position: fixed` becomes relative to that wrapper instead of
 * the viewport, and the overlay/sidebar/topbar end up clipped or stacked
 * behind the drawer.
 */
const AdminPortal = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(children, document.body);
};

export default AdminPortal;
