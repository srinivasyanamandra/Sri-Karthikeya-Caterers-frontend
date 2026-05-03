import React from 'react';
import { buildWhatsAppLink } from '../../constants/whatsapp';

/**
 * Floating WhatsApp button.
 * Uses the wa.me universal link → opens app on mobile, desktop app or
 * web.whatsapp.com elsewhere. Entrance animation is one-shot (see App.css);
 * no perpetual pulse — motion is reserved for entry and hover.
 */
const WhatsAppFAB = ({ message }) => (
  <a
    className="whatsapp-fab"
    href={buildWhatsAppLink(message)}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Chat with us on WhatsApp"
  >
    <i className="fab fa-whatsapp" aria-hidden="true"></i>
    <span className="whatsapp-fab-tooltip" aria-hidden="true">Chat with us</span>
  </a>
);

export default React.memo(WhatsAppFAB);
