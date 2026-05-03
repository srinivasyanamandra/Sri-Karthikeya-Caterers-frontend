import React from 'react';
import useScrolled from '../../hooks/useScrolled';

/** Small circular button bottom-left; appears once the page has scrolled. */
const BackToTop = ({ threshold = 600 }) => {
  const visible = useScrolled(threshold);
  return (
    <button
      type="button"
      className={`back-to-top ${visible ? 'visible' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
    >
      <i className="fas fa-arrow-up" aria-hidden="true"></i>
    </button>
  );
};

export default React.memo(BackToTop);
