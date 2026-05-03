import React, { useEffect, useState } from 'react';
import useScrolled from '../../hooks/useScrolled';
import { useNavigation } from '../../contexts/NavigationContext';
import { PRIMARY_NAV, ROUTES } from '../../constants/navigation';
import { CONTACT } from '../../constants/contact';

const Header = () => {
  const { currentPage, navigate } = useNavigation();
  const scrolled = useScrolled(30);
  const [menuOpen, setMenuOpen] = useState(false);

  /* Lock body scroll while mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
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
            onClick={(e) => { e.preventDefault(); go(ROUTES.HOME); }}
            aria-label={`${CONTACT.brand} — Home`}
          >
            <img src="/logo.png" alt={CONTACT.brand} className="logo-image" />
          </a>

          <nav className="nav" aria-label="Primary">
            {PRIMARY_NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={currentPage === item.id ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); go(item.id); }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="cta-header">
            <a href={`tel:${CONTACT.primaryPhone.tel}`} className="btn btn-secondary">
              <i className="fas fa-phone" aria-hidden="true"></i> Call
            </a>
            <a
              href={`#${ROUTES.CONTACT}`}
              className="btn btn-primary"
              onClick={(e) => { e.preventDefault(); go(ROUTES.CONTACT); }}
            >
              <i className="fas fa-calendar-check" aria-hidden="true"></i> Request Quote
            </a>
            <button
              type="button"
              className="menu-toggle"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <i className="fas fa-bars" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-nav ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        <div className="mobile-nav-header">
          <a
            href={`#${ROUTES.HOME}`}
            className="logo"
            onClick={(e) => { e.preventDefault(); go(ROUTES.HOME); }}
          >
            <img src="/logo.png" alt={CONTACT.brand} className="logo-image" />
          </a>
          <button
            type="button"
            className="menu-toggle"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        <ul className="mobile-nav-list">
          {PRIMARY_NAV.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={currentPage === item.id ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); go(item.id); }}
              >
                {item.label}
                <i className="fas fa-arrow-right" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>

        <div className="mobile-nav-cta">
          <a
            href={`#${ROUTES.CONTACT}`}
            className="btn btn-primary btn-lg"
            onClick={(e) => { e.preventDefault(); go(ROUTES.CONTACT); }}
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
