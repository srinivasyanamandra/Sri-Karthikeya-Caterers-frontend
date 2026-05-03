import React from 'react';
import Reveal from '../ui/Reveal';
import { useNavigate } from '../../contexts/NavigationContext';
import { ROUTES } from '../../constants/navigation';
import { CONTACT } from '../../constants/contact';

/**
 * Hero — full-bleed home page hero.
 *
 * The hero image is rendered as a real <img> inside a <picture>, not a CSS
 * background. That gives us:
 *   - `fetchpriority="high"` so the browser prioritises it as the LCP
 *     candidate (CSS background-images can't carry priority hints).
 *   - `srcset` / `<source>` for serving smaller / WebP variants when those
 *     files exist alongside best.png. Browsers that don't support WebP fall
 *     back to the PNG; browsers without source matches use the <img> src.
 *   - Native lazy/eager control via `loading="eager"`.
 *
 * The image is positioned absolutely behind .hero-content via CSS
 * (.hero-bg) so the layered gradients in `::before` / `::after` keep
 * working unchanged.
 */
const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden="true">
        <picture>
        {/* WebP source — falls through silently if the file doesn't exist
            yet. Generate with:
              cwebp -q 82 public/best.png -o public/best.webp
            For multi-density support add `srcSet="…800.webp 800w, …1600.webp 1600w" sizes="100vw"`. */}
        <source srcSet="/best.webp" type="image/webp" />
        <img
          src="/best.png"
          alt=""
          fetchpriority="high"
          loading="eager"
          decoding="async"
        />
        </picture>
      </div>

      {/* Circular brand badge — desktop only via CSS (.hero-mark-wrap).
          The outer div owns absolute positioning; Reveal wraps the inner
          image so its translateY(0) entry animation never collides with
          our translateY(-50%) vertical centring. */}
      <div className="hero-mark-wrap">
        <Reveal delay={2}>
          <img
            src="/logo.png"
            alt={CONTACT.brand}
            className="hero-mark"
            loading="lazy"
            decoding="async"
          />
        </Reveal>
      </div>

      <div className="hero-content">
        <Reveal>
          <span className="hero-eyebrow">
            <span className="dot" />
            Authentic taste · Premium experience · Since 2009
          </span>
        </Reveal>
        <Reveal delay={1}>
          <h1 className="hero-title">
            Premium Indian vegetarian catering, crafted with elegance and care.
          </h1>
        </Reveal>
        <Reveal delay={2}>
          <p className="hero-sub">
            Whether it’s a close-knit gathering or a grand celebration, we craft
            every experience with authentic flavors, warm hospitality, and
            attention to every detail.
          </p>
        </Reveal>
        <Reveal delay={3}>
          <div className="hero-cta">
            <button
              type="button"
              className="btn btn-accent btn-lg btn-shine"
              onClick={() => navigate(ROUTES.CONTACT)}
            >
              Plan your event <i className="fas fa-arrow-right" aria-hidden="true"></i>
            </button>
            <button
              type="button"
              className="btn btn-ghost-light btn-lg"
              onClick={() => navigate(ROUTES.MENUS)}
            >
              Explore menus
            </button>
          </div>
        </Reveal>
        <Reveal delay={4}>
          <p className="hero-trust">
            <span>Weddings</span>
            <span className="hero-trust-bullet" aria-hidden="true">•</span>
            <span>Corporate Events</span>
            <span className="hero-trust-bullet" aria-hidden="true">•</span>
            <span>Private Celebrations</span>
            <span className="hero-trust-bullet" aria-hidden="true">•</span>
            <span>Cultural Gatherings</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
};

export default Hero;
