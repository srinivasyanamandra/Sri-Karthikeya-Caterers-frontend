import React from 'react';
import Reveal from '../ui/Reveal';
import { useNavigate } from '../../contexts/NavigationContext';
import { ROUTES } from '../../constants/navigation';
import { CONTACT } from '../../constants/contact';

const PlanYourEventCTA = () => {
  const navigate = useNavigate();
  return (
    <section className="cta-section">
      <div className="container">
        <Reveal className="cta-inner">
          <span className="eyebrow">Plan your event</span>
          <h2 className="cta-title">Share a few details. We'll take it from there.</h2>
          <p>
            Send us your event details and our coordinator will respond within
            24 hours with a tailored menu and quote.
          </p>
          <div className="cta-row">
            <button
              type="button"
              className="btn btn-accent btn-lg"
              onClick={() => navigate(ROUTES.CONTACT)}
            >
              Request a quote
            </button>
            <a
              href={`tel:${CONTACT.primaryPhone.tel}`}
              className="btn btn-ghost-light btn-lg"
            >
              <i className="fas fa-phone" aria-hidden="true"></i> {CONTACT.primaryPhone.label}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default PlanYourEventCTA;
