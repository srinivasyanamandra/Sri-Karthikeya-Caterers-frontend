import React, { useEffect, useRef, useState } from 'react';
import useScrolled from '../../hooks/useScrolled';
import { useNavigation } from '../../contexts/NavigationContext';
import { PRIMARY_NAV, ROUTES } from '../../constants/navigation';
import { CONTACT } from '../../constants/contact';

const Header = () => {
  const { currentPage, navigate } = useNavigation();
  const scrolled = useScrolled(30);
  const [menuOpen, setMenuOpen] = useState(false);
  const openButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const wasOpenRef = useRef(false);

  /* Lock body scroll while the mobile drawer is open. */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  /* Drawer-only side effects:
     - Escape closes
     - On open, move focus to the close button
     - On close, restore focus to the trigger
     This is the minimum bar for an accessible mobile drawer. A full focus
     trap is intentionally not implemented — the drawer's own controls are
     the only tabbable elements while it's open (page scroll is locked). */
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    closeButtonRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  /* Restore focus to the open-trigger after the drawer closes — but only
     if the drawer had actually been opened (skip on first mount). */
  useEffect(() => {
    if (menuOpen) {
      wasOpenRef.current = true;
      return;
    }
    if (wasOpenRef.current) {
      openButtonRef.current?.focus({ preventScroll: true });
    }
  }, [menuOpen]);

  const go = (id) => {
    navigate(id);
    setMenuOpen(false);
  };

  return (
    <>
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-content">
          <a
            href={`#${ROUTES.HOME}`}
            className="logo"
            onClick={(e) => {
              e.preventDefault();
              go(ROUTES.HOME);
            }}
            aria-label={`${CONTACT.brand} — Home`}
          >
            <img src="/logo.png" alt={CONTACT.brand} className="logo-image" />
          </a>

          <nav className="nav" aria-label="Primary">
            {PRIMARY_NAV.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={isActive ? 'active' : ''}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    go(item.id);
                  }}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="cta-header">
            <a href={`tel:${CONTACT.primaryPhone.tel}`} className="btn btn-secondary">
              <i className="fas fa-phone" aria-hidden="true"></i> Call
            </a>
            <a
              href={`#${ROUTES.CONTACT}`}
              className="btn btn-primary"
              onClick={(e) => {
                e.preventDefault();
                go(ROUTES.CONTACT);
              }}
            >
              <i className="fas fa-calendar-check" aria-hidden="true"></i> Request Quote
            </a>
            <button
              ref={openButtonRef}
              type="button"
              className="menu-toggle"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMenuOpen(true)}
            >
              <i className="fas fa-bars" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-nav"
        className={`mobile-nav ${menuOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        aria-hidden={!menuOpen}
        /* When closed, take the drawer out of the tab sequence entirely.
           aria-hidden alone does not remove focusable descendants from the
           tab order. React 19 forwards `inert` as a boolean HTML attribute. */
        {...(menuOpen ? null : { inert: '' })}
      >
        <div className="mobile-nav-header">
          <a
            href={`#${ROUTES.HOME}`}
            className="logo"
            onClick={(e) => {
              e.preventDefault();
              go(ROUTES.HOME);
            }}
          >
            <img src="/logo.png" alt={CONTACT.brand} className="logo-image" />
          </a>
          <button
            ref={closeButtonRef}
            type="button"
            className="menu-toggle"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        <ul className="mobile-nav-list">
          {PRIMARY_NAV.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={isActive ? 'active' : ''}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    go(item.id);
                  }}
                >
                  {item.label}
                  <i className="fas fa-arrow-right" aria-hidden="true" />
                </a>
              </li>
            );
          })}
        </ul>

        <div className="mobile-nav-cta">
          <a
            href={`#${ROUTES.CONTACT}`}
            className="btn btn-primary btn-lg"
            onClick={(e) => {
              e.preventDefault();
              go(ROUTES.CONTACT);
            }}
          >
            <i className="fas fa-calendar-check" aria-hidden="true"></i> Request a Quote
          </a>
          <a href={`tel:${CONTACT.primaryPhone.tel}`} className="btn btn-ghost btn-lg">
            <i className="fas fa-phone" aria-hidden="true"></i> {CONTACT.primaryPhone.label}
          </a>
        </div>
      </div>
    </>
  );
};

export default Header;
