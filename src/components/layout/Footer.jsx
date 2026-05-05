import React, { useEffect, useRef, useState } from 'react';
import { CONTACT } from '../../constants/contact';
import { FOOTER_EXPLORE } from '../../constants/navigation';
import { buildWhatsAppLink } from '../../constants/whatsapp';
import { useNavigate } from '../../contexts/NavigationContext';
import { validateEmail } from '../../utils/validation';
import { publicApi } from '../../services/api';

const Footer = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'invalid' | 'submitting' | 'subscribed' | 'duplicate' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const resetTimerRef = useRef(null);
  const year = new Date().getFullYear();

  /* Cancel any pending status reset on unmount. */
  useEffect(() => () => {
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
  }, []);

  const handleSubscribe = async (event) => {
    event.preventDefault();
    if (!validateEmail(email)) {
      setStatus('invalid');
      return;
    }
    setStatus('submitting');
    setErrorMessage('');
    try {
      await publicApi.subscribe({ email, name: '' });
      setStatus('subscribed');
      setEmail('');
    } catch (err) {
      // 409 from the backend means the email is already actively subscribed
      if (err?.status === 409 || err?.code === 'CONFLICT') {
        setStatus('duplicate');
        setErrorMessage('This email is already subscribed.');
      } else {
        setStatus('error');
        setErrorMessage(err?.message || 'Could not subscribe. Please try again.');
      }
    }
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(() => {
      setStatus('idle');
      setErrorMessage('');
      resetTimerRef.current = null;
    }, 4500);
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    if (status !== 'idle' && status !== 'submitting') {
      setStatus('idle');
      setErrorMessage('');
    }
  };

  return (
    <footer className="footer">
      <span className="footer-rule" aria-hidden="true" />

      <div className="footer-grid">
        {/* Brand column */}
        <div className="footer-section footer-brand">
          <img src="/logo.png" alt={CONTACT.brand} className="footer-logo" />
          <h3>{CONTACT.brand}</h3>
          <p>
            Pure-vegetarian catering, served with quiet excellence — for weddings,
            institutions and intimate gatherings.
          </p>
          <div className="social-links" aria-label="Social media">
            <a href={CONTACT.social.facebook}  className="social-icon" aria-label="Facebook"><i className="fab fa-facebook-f" aria-hidden="true"></i></a>
            <a href={CONTACT.social.instagram} className="social-icon" aria-label="Instagram"><i className="fab fa-instagram" aria-hidden="true"></i></a>
            <a href={CONTACT.social.youtube}   className="social-icon" aria-label="YouTube"><i className="fab fa-youtube" aria-hidden="true"></i></a>
            <a
              href={buildWhatsAppLink()}
              className="social-icon"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat on WhatsApp"
            ><i className="fab fa-whatsapp" aria-hidden="true"></i></a>
          </div>
        </div>

        {/* Explore */}
        <div className="footer-section">
          <h4>Explore</h4>
          <ul className="footer-links">
            {FOOTER_EXPLORE.map(link => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  onClick={(e) => { e.preventDefault(); navigate(link.id); }}
                >
                  <span>{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-section">
          <h4>Reach us</h4>
          <ul className="footer-contact">
            <li>
              <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
              <span>{CONTACT.city}, {CONTACT.region}</span>
            </li>
            {CONTACT.phones.map((phone) => (
              <li key={phone.tel}>
                <a href={`tel:${phone.tel}`}>
                  <i className="fas fa-phone" aria-hidden="true"></i>
                  <span>{phone.label}</span>
                </a>
              </li>
            ))}
            <li>
              <a href={`mailto:${CONTACT.email}`}>
                <i className="fas fa-envelope" aria-hidden="true"></i>
                <span>{CONTACT.email}</span>
              </a>
            </li>
            <li>
              <i className="fas fa-clock" aria-hidden="true"></i>
              <span>{CONTACT.hours}</span>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="footer-section newsletter">
          <h4>Stay in touch</h4>
          <p className="newsletter-blurb">
            Seasonal menus and festive specials — delivered occasionally, never overwhelmingly.
          </p>
          <form className="newsletter-form" onSubmit={handleSubscribe} aria-label="Newsletter signup" noValidate>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={handleEmailChange}
              aria-label="Email address"
              aria-invalid={status === 'invalid' ? 'true' : 'false'}
              aria-describedby={status === 'invalid' ? 'newsletter-error' : undefined}
            />
            <button
              type="submit"
              aria-label="Subscribe to newsletter"
              disabled={status === 'subscribed' || status === 'submitting'}
            >
              {status === 'subscribed' ? (
                <><i className="fas fa-check" aria-hidden="true"></i> Subscribed</>
              ) : status === 'submitting' ? (
                <><i className="fas fa-circle-notch fa-spin" aria-hidden="true"></i> Subscribing</>
              ) : (
                <>Subscribe <i className="fas fa-arrow-right" aria-hidden="true"></i></>
              )}
            </button>
          </form>
          {status === 'invalid' && (
            <span id="newsletter-error" className="form-error" role="alert">
              Please enter a valid email address.
            </span>
          )}
          {(status === 'duplicate' || status === 'error') && errorMessage && (
            <span className="form-error" role="alert">{errorMessage}</span>
          )}
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {year} {CONTACT.brand}. All rights reserved.</p>
        <div className="footer-bottom-links">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#sitemap">Sitemap</a>
          <a
            href="#admin-login"
            onClick={(e) => { e.preventDefault(); navigate('admin-login'); }}
            className="footer-admin-link"
            aria-label="Admin login"
          >
            <i className="fas fa-lock" aria-hidden="true" /> Staff login
          </a>
        </div>
      </div>
    </footer>
  );
};

/* memo: Footer takes no props and now subscribes only to the dispatch
   context (stable). Without memo, App's re-render on every navigation
   would still reconcile Footer's whole subtree for no reason. */
export default React.memo(Footer);
