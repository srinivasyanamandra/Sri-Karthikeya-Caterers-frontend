import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CONTACT } from '../../constants/contact';
import { useNavigate } from '../../contexts/NavigationContext';
import { ROUTES } from '../../constants/navigation';
import Portal from '../ui/Portal';

const BODY_OPEN_CLASS = 'has-brochure-open';

/**
 * MenuBrochure — luxury, multi-page brochure-style menu viewer.
 *
 * Structure
 *   [cover]  collection name, motif, tagline, "best for" strip
 *   [pages]  every page in collection.pages — header (brand · collection),
 *            section blocks (title + dish list), footer (page n / N)
 *   [close]  contact card with primary "Plan your event" CTA
 *
 * Navigation
 *   Cover is page 0; brochure pages are 1..N; closing card is N+1.
 *   Prev / next buttons + a dot indicator. ← / → keys also work.
 */
const MenuBrochure = ({ collection, onClose }) => {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(0);
  const containerRef = useRef(null);

  const totalSheets = collection.pages.length + 2; /* cover + closing */

  const goPrev = useCallback(() => setPageIndex((p) => Math.max(0, p - 1)), []);
  const goNext = useCallback(() => setPageIndex((p) => Math.min(totalSheets - 1, p + 1)), [totalSheets]);

  /* Keyboard nav. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, goPrev, goNext]);

  /* Scroll to top of the brochure on every page change. */
  useEffect(() => {
    containerRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' });
  }, [pageIndex]);

  /* While the brochure is open: lock body scroll AND mark <body> so the
     public-site floating CTAs (WhatsApp / Plan-your-event / Back-to-top)
     are hidden via CSS. Cleaning up on unmount restores everything. */
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add(BODY_OPEN_CLASS);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove(BODY_OPEN_CLASS);
    };
  }, []);

  /* Render — one of three sheet types based on pageIndex. */
  const isCover = pageIndex === 0;
  const isClosing = pageIndex === totalSheets - 1;
  const interiorPage = !isCover && !isClosing
    ? collection.pages[pageIndex - 1]
    : null;

  return (
    <Portal>
    <div
      className="menu-brochure"
      style={{ '--collection-accent': collection.accent }}
      role="dialog"
      aria-modal="true"
      aria-label={`${collection.name} menu brochure`}
    >
      <div className="menu-brochure-toolbar">
        <button
          type="button"
          className="brochure-tool-btn"
          onClick={onClose}
          aria-label="Close brochure and return to collections"
        >
          <i className="fas fa-arrow-left" aria-hidden="true" /> All collections
        </button>
        <span className="brochure-tool-title">{collection.name}</span>
        <span className="brochure-tool-meta">
          {pageIndex + 1} / {totalSheets}
        </span>
      </div>

      <div className="menu-brochure-stage" ref={containerRef}>
        <article className="brochure-sheet" key={pageIndex}>
          {isCover && <BrochureCover collection={collection} />}
          {interiorPage && (
            <BrochureInterior
              page={interiorPage}
              collection={collection}
              pageNumber={pageIndex}
              totalPages={collection.pages.length}
            />
          )}
          {isClosing && <BrochureClosing collection={collection} navigate={navigate} />}
        </article>
      </div>

      <div className="menu-brochure-pager" role="navigation" aria-label="Brochure pages">
        <button
          type="button"
          className="brochure-pager-btn"
          onClick={goPrev}
          disabled={pageIndex === 0}
          aria-label="Previous page"
        >
          <i className="fas fa-chevron-left" aria-hidden="true" />
        </button>

        <ol className="brochure-pager-dots" aria-label="Jump to page">
          {Array.from({ length: totalSheets }).map((_, i) => (
            <li key={i}>
              <button
                type="button"
                aria-label={`Page ${i + 1}`}
                aria-current={i === pageIndex ? 'page' : undefined}
                className={`brochure-pager-dot${i === pageIndex ? ' active' : ''}`}
                onClick={() => setPageIndex(i)}
              />
            </li>
          ))}
        </ol>

        <button
          type="button"
          className="brochure-pager-btn"
          onClick={goNext}
          disabled={pageIndex === totalSheets - 1}
          aria-label="Next page"
        >
          <i className="fas fa-chevron-right" aria-hidden="true" />
        </button>
      </div>
    </div>
    </Portal>
  );
};

/* ─────────────────────────  Cover  ───────────────────────── */

const BrochureCover = ({ collection }) => (
  <div className="brochure-cover">
    <div className="brochure-cover-frame">
      <header className="brochure-brandbar">
        <img src="/logo.png" alt="" className="brochure-brand-mark" />
        <div>
          <span className="brochure-brand-name">{CONTACT.brand}</span>
          <span className="brochure-brand-tag">Pure-vegetarian · Hyderabad · Since 2009</span>
        </div>
      </header>

      <div className="brochure-cover-body">
        <span className="brochure-cover-eyebrow">Menu collection</span>
        <span className="brochure-cover-motif" aria-hidden="true">
          <i className={`fas ${collection.motif}`} />
        </span>
        <h1 className="brochure-cover-name">{collection.name}</h1>
        <p className="brochure-cover-tagline">{collection.tagline}</p>
        <span className="brochure-rule" aria-hidden="true" />
        <p className="brochure-cover-summary">{collection.summary}</p>

        <div className="brochure-cover-bestfor">
          <span className="brochure-cover-bestfor-label">Curated for</span>
          <ul>
            {collection.bestFor.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      </div>

      <footer className="brochure-cover-foot">
        <span>Volume {collection.pages.length}</span>
        <span aria-hidden="true">◆</span>
        <span>Composed by the {CONTACT.brand} kitchens</span>
      </footer>
    </div>
  </div>
);

/* ───────────────────────  Interior  ─────────────────────── */

const BrochureInterior = ({ page, collection, pageNumber, totalPages }) => (
  <div className="brochure-interior">
    <header className="brochure-interior-head">
      <div className="brochure-brandline">
        <img src="/logo.png" alt="" />
        <span>{CONTACT.brand}</span>
      </div>
      <span className="brochure-interior-collection">{collection.name}</span>
    </header>

    <div className="brochure-interior-body">
      <span className="brochure-interior-eyebrow">{page.eyebrow}</span>
      <h2 className="brochure-interior-title">{page.title}</h2>
      <span className="brochure-rule" aria-hidden="true" />

      <div className="brochure-sections">
        {page.sections.map((section) => (
          <section className="brochure-section" key={section.title}>
            <h3 className="brochure-section-title">
              <span className="brochure-section-bullet" aria-hidden="true" />
              {section.title}
            </h3>
            <ul className="brochure-section-list">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>

    <footer className="brochure-interior-foot">
      <span>{collection.name}</span>
      <span className="brochure-interior-foot-num">
        — {pageNumber} / {totalPages} —
      </span>
      <span>{CONTACT.brand}</span>
    </footer>
  </div>
);

/* ───────────────────────  Closing  ──────────────────────── */

const BrochureClosing = ({ collection, navigate }) => (
  <div className="brochure-closing">
    <div className="brochure-closing-frame">
      <header className="brochure-brandbar">
        <img src="/logo.png" alt="" className="brochure-brand-mark" />
        <div>
          <span className="brochure-brand-name">{CONTACT.brand}</span>
          <span className="brochure-brand-tag">Pure-vegetarian · Hyderabad · Since 2009</span>
        </div>
      </header>

      <div className="brochure-closing-body">
        <span className="brochure-closing-eyebrow">Plan with us</span>
        <h2 className="brochure-closing-title">
          A {collection.name.toLowerCase()} table, set just for you.
        </h2>
        <p className="brochure-closing-blurb">
          Every menu is finalised in conversation — guest count, dietary
          preferences, regional accents, service style. Speak with our team to
          tailor the {collection.name} collection to your event.
        </p>

        <div className="brochure-closing-grid">
          <div>
            <span className="brochure-closing-label">Speak to us</span>
            <a className="brochure-closing-value" href={CONTACT.primaryPhone?.tel}>
              {CONTACT.primaryPhone?.label}
            </a>
          </div>
          <div>
            <span className="brochure-closing-label">Write to us</span>
            <a className="brochure-closing-value" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
          </div>
          <div>
            <span className="brochure-closing-label">Visit</span>
            <span className="brochure-closing-value">
              {CONTACT.fullAddress || `${CONTACT.city}, ${CONTACT.region}`}
            </span>
          </div>
        </div>

        <div className="brochure-closing-cta">
          <button
            type="button"
            className="btn btn-accent btn-lg btn-shine"
            onClick={() => navigate(ROUTES.CONTACT)}
          >
            Plan your event <i className="fas fa-arrow-right" aria-hidden="true" />
          </button>
        </div>
      </div>

      <footer className="brochure-cover-foot">
        <span>{CONTACT.brand}</span>
        <span aria-hidden="true">◆</span>
        <span>End of {collection.name} brochure</span>
      </footer>
    </div>
  </div>
);

export default MenuBrochure;
