import React from 'react';
import Reveal from '../ui/Reveal';
import { useNavigate } from '../../contexts/NavigationContext';
import { ROUTES } from '../../constants/navigation';
import menuCollections from '../../data/menuCollections';
import CollectionCard from '../menus/CollectionCard';

/**
 * MenuPreview — continuous right-to-left marquee of all menu collections.
 *
 * The track renders the collection list twice back-to-back. A single CSS
 * animation glides the track from `translateX(0)` to `translateX(-50%)`
 * over the full duration; because the second half is an identical clone
 * of the first, the loop has no visible seam. Pause on hover/focus so
 * users can read a card; click any card to navigate to the menus page.
 *
 * No buttons, no dots, no state — pure CSS keeps motion butter-smooth on
 * GPU and removes the timing pitfalls of a manual carousel.
 *
 * Accessibility:
 *   - The track has `aria-label` describing the marquee.
 *   - Cloned cards are marked `aria-hidden` so screen readers see each
 *     collection exactly once.
 *   - `prefers-reduced-motion` halts the animation.
 */
const MenuPreview = () => {
  const navigate = useNavigate();
  const collections = menuCollections;

  return (
    <section className="section section-alt menu-marquee-section">
      <div className="container">
        <Reveal className="section-header">
          <span className="eyebrow">Menus</span>
          <h2 className="section-title">Curated menu collections.</h2>
          <p>
            Eight luxury menu sets — Heritage, Signature, Royal Feast,
            Wedding Banquet and more — each tailored to your event.
          </p>
        </Reveal>
      </div>

      <div
        className="menu-marquee"
        role="region"
        aria-label="Menu collections — auto-scrolling preview"
      >
        <div className="menu-marquee-track">
          {collections.map((collection) => (
            <div className="menu-marquee-item" key={`a-${collection.id}`}>
              <CollectionCard
                collection={collection}
                onOpen={() => navigate(ROUTES.MENUS)}
              />
            </div>
          ))}
          {collections.map((collection) => (
            <div
              className="menu-marquee-item"
              key={`b-${collection.id}`}
              aria-hidden="true"
            >
              <CollectionCard
                collection={collection}
                onOpen={() => navigate(ROUTES.MENUS)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="container">
        <div className="section-cta-row">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate(ROUTES.MENUS)}
          >
            View all collections{' '}
            <i className="fas fa-arrow-right" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default MenuPreview;
