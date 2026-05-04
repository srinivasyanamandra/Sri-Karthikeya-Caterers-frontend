import React, { useEffect, useState } from 'react';
import PageHero from '../components/layout/PageHero';
import CollectionCard from '../components/menus/CollectionCard';
import MenuBrochure from '../components/menus/MenuBrochure';
import menuCollections from '../data/menuCollections';

/**
 * MenusPage — curated, brochure-style menu experience.
 *
 * Two states:
 *   1. grid  — a luxurious card grid of all collections.
 *   2. brochure — the full multi-page brochure for the chosen collection,
 *                 with a header that lets the user step back to the grid.
 *
 * Selection is held in component state. The URL hash isn't extended with
 * the collection id — that would require parsing the existing #admin-* /
 * #home routing layer. If the user refreshes mid-brochure they land back
 * on the grid, which is the safer default.
 */
const MenusPage = () => {
  const [activeId, setActiveId] = useState(null);
  const active = activeId ? menuCollections.find((c) => c.id === activeId) : null;

  /* When opening a brochure, lock body scroll so the brochure has the
     stage to itself. The brochure has its own internal scroll. */
  useEffect(() => {
    if (!active) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);

  if (active) {
    return <MenuBrochure collection={active} onClose={() => setActiveId(null)} />;
  }

  return (
    <div className="menus-page">
      <PageHero
        eyebrow="Curated menu collections"
        title="Eight collections, one philosophy."
        intro="From an heirloom Telangana table to a Mughlai banquet and a Mediterranean live counter — every collection is built around vegetarian cooking, regional integrity, and the kind of service that lets you forget the kitchen exists."
      />

      <section className="section section-alt">
        <div className="container">
          <div className="collections-grid">
            {menuCollections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onOpen={(c) => setActiveId(c.id)}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default MenusPage;
