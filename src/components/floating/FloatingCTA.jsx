import React from 'react';
import { useNavigate } from '../../contexts/NavigationContext';
import { ROUTES } from '../../constants/navigation';
import useScrolled from '../../hooks/useScrolled';

/**
 * Saffron pill that opens the contact page. Stacks above the WhatsApp FAB.
 *
 * Hidden while the hero is in view so the headline + the two primary
 * buttons are the only thing competing for attention. It fades in once
 * the user scrolls roughly past the first viewport.
 */
const FloatingCTA = () => {
  const navigate = useNavigate();
  const visible = useScrolled(560);

  return (
    <button
      type="button"
      className={`floating-cta${visible ? ' is-visible' : ''}`}
      onClick={() => navigate(ROUTES.CONTACT)}
      aria-label="Plan your event"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <i className="fas fa-calendar-check" aria-hidden="true"></i> Plan your event
    </button>
  );
};

export default React.memo(FloatingCTA);
