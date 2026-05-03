import React from 'react';
import { CONTACT } from '../../constants/contact';

/**
 * PageHero — shared dark hero banner used by every inner page.
 * Strict prop interface: eyebrow + title + intro.
 */
const PageHero = ({ eyebrow, title, intro }) => (
  <section className="page-hero">
    <div className="container">
      <span className="hero-eyebrow">
        <span className="dot" />
        {eyebrow}
      </span>
      <h1 className="page-hero-title">{title}</h1>
      {intro && <p className="page-hero-intro">{intro}</p>}
    </div>
    <div className="hero-meta" aria-hidden="true">
      <span>{CONTACT.brand}</span>
      <span className="dot-sep" />
      <span>{CONTACT.city}, {CONTACT.countryCode}</span>
    </div>
  </section>
);

export default PageHero;
