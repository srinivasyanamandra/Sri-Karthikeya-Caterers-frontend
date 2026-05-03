import React from 'react';

/**
 * CollectionCard — luxury preview card for one menu collection.
 *
 * The optional cover image sits in the top-right of the card and is
 * masked with a down-and-left gradient so it fades softly into the
 * card body without competing with the typography.
 */
const CollectionCard = ({ collection, onOpen }) => {
  const totalSections = collection.pages.reduce(
    (sum, p) => sum + p.sections.length,
    0
  );

  return (
    <button
      type="button"
      className="collection-card"
      onClick={() => onOpen(collection)}
      aria-label={`Open the ${collection.name} menu collection`}
      style={{ '--collection-accent': collection.accent }}
    >
      {collection.image && (
        <span
          className="collection-card-image"
          aria-hidden="true"
          style={{ backgroundImage: `url(${collection.image})` }}
        />
      )}

      <span className="collection-card-eyebrow">
        Menu collection
      </span>

      <span className="collection-card-motif" aria-hidden="true">
        <i className={`fas ${collection.motif}`} />
      </span>

      <h3 className="collection-card-name">{collection.name}</h3>
      <p className="collection-card-tagline">{collection.tagline}</p>
      <p className="collection-card-summary">{collection.summary}</p>

      <ul className="collection-card-tags" aria-label="Best for">
        {collection.bestFor.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>

      <span className="collection-card-foot">
        <span className="collection-card-meta">
          {collection.pages.length} pages · {totalSections} sections
        </span>
        <span className="collection-card-cta">
          Open menu <i className="fas fa-arrow-right" aria-hidden="true" />
        </span>
      </span>
    </button>
  );
};

export default CollectionCard;
