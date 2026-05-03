import React from 'react';

/**
 * AdminPageHero — compact hero used on every admin page.
 *
 * Props
 *   eyebrow   – kicker label above the title
 *   icon      – FontAwesome icon (e.g. "fa-file-alt") shown in a chip beside the title
 *   title     – page title (required)
 *   subtitle  – short status line under the title (e.g. counts/summary)
 *   intro     – longer descriptive paragraph (alias kept for back-compat)
 *   actions   – right-aligned action buttons (ReactNode)
 *   children  – freeform content inside the hero (live clock, tabs, etc.)
 */
const AdminPageHero = ({
  eyebrow,
  icon,
  title,
  subtitle,
  intro,
  actions,
  children,
}) => (
  <div className="admin-page-hero">
    <div className="container">
      <div className="admin-page-hero-row">
        <div className="admin-page-hero-main">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <div className="admin-page-hero-titlewrap">
            {icon && (
              <span className="admin-page-hero-icon" aria-hidden="true">
                <i className={`fas ${icon}`} />
              </span>
            )}
            <div>
              <h1 className="admin-page-hero-title">{title}</h1>
              {subtitle && <p className="admin-page-hero-subtitle">{subtitle}</p>}
            </div>
          </div>
          {intro && <p className="admin-page-hero-intro">{intro}</p>}
        </div>
        {actions && <div className="admin-page-hero-actions">{actions}</div>}
      </div>
      {children}
    </div>
  </div>
);

export default AdminPageHero;
