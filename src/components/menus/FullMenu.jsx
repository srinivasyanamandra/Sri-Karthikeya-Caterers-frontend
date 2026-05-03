import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import fullMenu from '../../data/fullMenu';

/**
 * @typedef  {Object}  MenuCategory
 * @property {string}      id      Stable slug, used as React key and DOM id prefix.
 * @property {string}      title   Display title (e.g. "North Indian").
 * @property {string[]}    items   Dish names rendered as-is in the UI.
 */

/**
 * @typedef  {Object}  IndexedCategory
 * @property {string}                                      id
 * @property {string}                                      title
 * @property {Array<{ name: string, normalized: string }>} items
 *
 * Variant of {@link MenuCategory} carried by {@link SEARCH_INDEX}: every item
 * keeps the original `name` for rendering plus a pre-computed `normalized` form
 * used for substring matching during search.
 */

/**
 * Total dish count, computed once at module load.
 * Used only for the header tally ("245 dishes across 10 categories").
 *
 * @type {number}
 */
const TOTAL_DISHES = fullMenu.reduce(
  (sum, category) => sum + category.items.length,
  0
);

/**
 * Collapse a string to a search-friendly canonical form.
 *
 * Pipeline:
 *   1. NFD decomposition splits each accented character into its base letter
 *      plus a combining diacritic mark (e.g. "ā" → "a" + ̄ ).
 *   2. The combining-mark range U+0300..U+036F is stripped.
 *   3. Lowercase.
 *   4. Every non-alphanumeric run is removed (spaces, punctuation, dashes).
 *
 * Effect: "Rasmalai", "Rāsmalai", "Ras-Malai", "  RASMALAI " all collapse to
 * the same key "rasmalai", so the user can type any natural variant.
 *
 * Limitation: this does NOT cover Indic transliteration variance
 * ("biriyani" vs "biryani") — see Risks section.
 *
 * @param   {string} input
 * @returns {string}
 */
const normalize = (input) =>
  input
    .normalize('NFD')                  // split diacritics from base letters
    .replace(/[̀-ͯ]/g, '')   // drop combining marks (U+0300..U+036F)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');       // strip spaces / punctuation / dashes

/**
 * Pre-computed search index — built once at module load (O(N) total),
 * referenced O(1) per render.
 *
 * Without this, every keystroke would lowercase 245 strings on the hot path.
 * With this, every keystroke does one `normalize(query)` and a single pass of
 * `String.prototype.includes` against pre-normalised strings.
 *
 * Memory cost: ~245 short strings (≈ 4 KB). Trivial vs. the perf win.
 *
 * @type {ReadonlyArray<IndexedCategory>}
 */
const SEARCH_INDEX = fullMenu.map((category) => ({
  ...category,
  items: category.items.map((name) => ({ name, normalized: normalize(name) })),
}));

/**
 * FullMenu — interactive browser for the full dish list.
 *
 * Why a single-pane view rather than a long scroll:
 *   The PDF lists 245 dishes across 10 categories. Stacking everything into
 *   one scrollable page meant either endless scrolling or users giving up.
 *   This component shows exactly one category pane at a time, with a sticky
 *   chip navigation for direct access and a search input for the recurring
 *   "do they have X?" question.
 *
 * Composition (top to bottom):
 *   1. Header        — total dish tally + search input
 *   2. Chip nav      — 10 category chips with a sliding gold indicator
 *   3. Content pane  — either the active category, or grouped search results,
 *                      or the empty state. Re-keyed on content identity so
 *                      React unmounts/remounts and the CSS entrance animation
 *                      fires on every navigation.
 *
 * Routing model:
 *   This component owns its own internal state and is unaware of the rest of
 *   the application. The hash href on each chip ("#menu-{id}") is purely an
 *   accessibility / right-click affordance — `onClick` always preventDefaults
 *   and drives state directly.
 *
 * Side effects:
 *   - Imperatively positions the sliding chip indicator via `useLayoutEffect`
 *     and direct style writes (no rerender per scroll/resize tick).
 *   - Calls `scrollIntoView` on the chip nav after a category change so the
 *     user always lands at the top of the new pane.
 *
 * @returns {React.ReactElement}
 */
const FullMenu = () => {
  // ── Local state ────────────────────────────────────────────────────────
  // `activeId` is the currently visible category when not searching.
  // It survives across search mode so clearing the query restores the view.
  const [activeId, setActiveId] = useState(fullMenu[0].id);
  const [query, setQuery] = useState('');

  // ── DOM refs (imperative reads / writes) ───────────────────────────────
  // `linkRefs` is a sparse object keyed by categoryId. Populated by callback
  // refs on each chip. Used to measure the active chip's geometry.
  const linkRefs = useRef({});
  // The sliding gold pill behind the active chip. Style is mutated directly
  // — never tracked through React state, so chip changes don't rerender.
  const indicatorRef = useRef(null);
  // The chip nav itself, used as the `scrollIntoView` target after a swap.
  const navRef = useRef(null);

  // ── Derived values ─────────────────────────────────────────────────────
  // `normalizedQuery` is memoised so a parent rerender (e.g. resize) does not
  // re-run the normalisation pipeline.
  const normalizedQuery = useMemo(() => normalize(query), [query]);
  const isSearching = normalizedQuery.length > 0;

  /**
   * Group of categories that contain at least one match for the current
   * query. Each category keeps its original ordering and the original (non-
   * normalised) item names for display.
   *
   * Recomputes only when the *normalised* query changes — so cosmetic edits
   * to the input ("paneer" → "paneer ") don't trigger a re-filter.
   *
   * @type {MenuCategory[]}
   */
  const searchMatches = useMemo(() => {
    if (!isSearching) return [];
    return SEARCH_INDEX
      .map((category) => ({
        ...category,
        items: category.items
          .filter((entry) => entry.normalized.includes(normalizedQuery))
          .map((entry) => entry.name),
      }))
      .filter((category) => category.items.length > 0);
  }, [normalizedQuery, isSearching]);

  const totalMatches = searchMatches.reduce(
    (sum, category) => sum + category.items.length,
    0
  );

  // Circular previous / next neighbours for the pager — wraps around so
  // Special Arrangements → Breakfast is one click.
  const activeIndex = fullMenu.findIndex((category) => category.id === activeId);
  const activeCategory = fullMenu[activeIndex];
  const prevCategory = fullMenu[(activeIndex - 1 + fullMenu.length) % fullMenu.length];
  const nextCategory = fullMenu[(activeIndex + 1) % fullMenu.length];

  /**
   * Position the sliding chip indicator under the currently active chip.
   *
   * Runs synchronously after layout (via `useLayoutEffect`) so the indicator
   * is in place before the browser paints — avoids a one-frame visual jump.
   * Style is written imperatively so a window resize or active-id change does
   * not re-render any React subtree.
   *
   * Hidden (`opacity: 0`) during search because no chip is logically "active"
   * when search results are showing.
   */
  useLayoutEffect(() => {
    const updateIndicator = () => {
      const indicator = indicatorRef.current;
      const activeNode = linkRefs.current[activeId];
      if (!indicator || !activeNode) return;
      indicator.style.transform = `translateX(${activeNode.offsetLeft}px)`;
      indicator.style.width = `${activeNode.offsetWidth}px`;
      indicator.style.opacity = isSearching ? '0' : '1';
    };
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeId, isSearching]);

  /**
   * Switch to a category, clearing any in-flight search and scrolling the
   * chip nav flush below the sticky site header.
   *
   * The scroll is essential UX: without it, clicking a chip while scrolled
   * mid-pane would land the user inside the new category's item list with no
   * heading visible. CSS `scroll-margin-top` on the nav handles the offset.
   *
   * @param {string} id — target category id (must exist in `fullMenu`)
   */
  const selectCategory = (id) => {
    setQuery('');
    setActiveId(id);
    navRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /**
   * Anchor click handler. Suppresses default navigation (the href is a
   * progressive-enhancement / right-click affordance, not a real route).
   */
  const handleNavClick = (event, id) => {
    event.preventDefault();
    selectCategory(id);
  };

  /**
   * Render a single category section (numeral + title + dish-count + grid).
   *
   * `displayIndex` is the *visual* numeral, not necessarily the category's
   * position in `fullMenu`. In search results we pass the match-list index so
   * users see "01" / "02" for the first two matches even if their underlying
   * categories are #4 and #7 in the source data.
   *
   * `--item-index` is read by CSS to compute the staggered fade-up delay.
   * Capped at 14 so very long sections (38 items) don't drag the entrance
   * past ~430 ms.
   *
   * @param {MenuCategory} category
   * @param {number}       displayIndex — zero-based; rendered as 01..N
   */
  const renderSection = (category, displayIndex) => (
    <section
      key={category.id}
      className="full-menu-section"
      aria-labelledby={`menu-${category.id}-title`}
    >
      <header className="full-menu-section-head">
        <span className="full-menu-section-num" aria-hidden="true">
          {String(displayIndex + 1).padStart(2, '0')}
        </span>
        <h3 id={`menu-${category.id}-title`} className="full-menu-section-title">
          {category.title}
        </h3>
        <span className="full-menu-section-count">
          {category.items.length} {category.items.length === 1 ? 'dish' : 'dishes'}
        </span>
      </header>
      <ul className="full-menu-items">
        {category.items.map((item, itemIndex) => (
          <li
            key={item}
            className="full-menu-item"
            style={{ '--item-index': Math.min(itemIndex, 14) }}
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <div className="full-menu">
      {/* Header — tally + search input */}
      <div className="full-menu-header">
        <p className="full-menu-tally">
          <strong>{TOTAL_DISHES}</strong> dishes across {fullMenu.length} categories
        </p>
        <label className="full-menu-search">
          <i className="fas fa-magnifying-glass full-menu-search-icon" aria-hidden="true"></i>
          <input
            type="search"
            className="full-menu-search-input"
            placeholder="Search dishes — try “paneer”, “biryani”, “kaju”"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search dishes"
          />
          {/* The clear button is conditional — when there's no query, the
              input occupies the full width and nothing extra is rendered. */}
          {query && (
            <button
              type="button"
              className="full-menu-search-clear"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <i className="fas fa-times" aria-hidden="true"></i>
            </button>
          )}
        </label>
      </div>

      {/* Sticky chip nav. The indicator is a sibling of the chips, not a
          child — its position is set imperatively in useLayoutEffect. */}
      <nav ref={navRef} className="full-menu-nav" aria-label="Menu sections">
        <ul className="full-menu-nav-list">
          <span ref={indicatorRef} className="full-menu-nav-indicator" aria-hidden="true" />
          {fullMenu.map((category) => {
            // No chip is "active" while searching — search results span
            // multiple categories, so highlighting one would mislead.
            const isActive = activeId === category.id && !isSearching;
            return (
              <li key={category.id}>
                <a
                  ref={(node) => { linkRefs.current[category.id] = node; }}
                  href={`#menu-${category.id}`}
                  className={`full-menu-nav-link ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={(event) => handleNavClick(event, category.id)}
                >
                  <span className="full-menu-nav-label">{category.title}</span>
                  <span className="full-menu-nav-count" aria-hidden="true">
                    {category.items.length}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Content pane. The `key` on the inner div changes whenever the
          *content identity* changes (active category id, or normalised search
          query). React unmounts/remounts the pane on key change, which is
          what fires the CSS keyframe entrance animation on every navigation. */}
      <div className="full-menu-content">
        {isSearching ? (
          searchMatches.length > 0 ? (
            <div className="full-menu-pane" key={`search-${normalizedQuery}`}>
              <p className="full-menu-results-summary">
                {totalMatches} {totalMatches === 1 ? 'dish' : 'dishes'} matching “{query.trim()}”
              </p>
              <div className="full-menu-results">
                {/* Renumber 01.. per matched category — using the full-menu
                    index would render results as "04" / "07" with no
                    explanation for the gaps. */}
                {searchMatches.map((category, matchIndex) =>
                  renderSection(category, matchIndex)
                )}
              </div>
            </div>
          ) : (
            // Empty state — never a dead-end. The Clear button is the
            // single recovery action.
            <div className="full-menu-pane full-menu-empty" key={`empty-${normalizedQuery}`}>
              <i className="fas fa-utensils full-menu-empty-icon" aria-hidden="true"></i>
              <p>No dishes match “{query.trim()}”.</p>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setQuery('')}
              >
                Clear search
              </button>
            </div>
          )
        ) : (
          // Default: the active category, plus a Previous / Next pager for
          // linear browsing without going back to the chip nav.
          <div className="full-menu-pane" key={activeCategory.id}>
            {renderSection(activeCategory, activeIndex)}

            <div className="full-menu-pager">
              <button
                type="button"
                className="full-menu-pager-btn"
                onClick={() => selectCategory(prevCategory.id)}
                aria-label={`Previous category: ${prevCategory.title}`}
              >
                <i className="fas fa-arrow-left" aria-hidden="true"></i>
                <span className="full-menu-pager-label">Previous</span>
                <span className="full-menu-pager-name">{prevCategory.title}</span>
              </button>
              <button
                type="button"
                className="full-menu-pager-btn full-menu-pager-next"
                onClick={() => selectCategory(nextCategory.id)}
                aria-label={`Next category: ${nextCategory.title}`}
              >
                <span className="full-menu-pager-label">Next</span>
                <span className="full-menu-pager-name">{nextCategory.title}</span>
                <i className="fas fa-arrow-right" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullMenu;
