import React, { useState } from 'react';

/**
 * Human-readable adjectives shown next to the stars after selection.
 * Keep in sync with the 1..5 numeric scale used by the form data.
 */
const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent',
};

/**
 * RatingInput — accessible 1-5 star rating field.
 *
 * Uses native radio buttons inside <label> elements wrapped in a
 * <fieldset>/<legend>. This pattern gives us:
 *   - Free keyboard nav (Tab to enter, arrows to move, Space to select)
 *   - Native screen-reader announcement of the group via the legend
 *   - Form-data submission semantics (value travels with the form)
 *
 * The radio inputs are visually hidden (opacity 0, but tab-reachable);
 * the gold star icons are the visible UI driven by `n <= display`.
 */
const RatingInput = ({ label, name, value, onChange, required = false, max = 5 }) => {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <fieldset className="rating-input">
      <legend className="rating-input-label">
        {label}
        {required && <span className="rating-required" aria-label="required"> *</span>}
      </legend>

      <div
        className="rating-input-row"
        onMouseLeave={() => setHovered(0)}
      >
        <div className="rating-input-stars">
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
            const isFilled = n <= display;
            return (
              <label
                key={n}
                className={`rating-star ${isFilled ? 'is-filled' : ''}`}
                onMouseEnter={() => setHovered(n)}
                aria-label={`${n} of ${max} — ${RATING_LABELS[n]}`}
              >
                <input
                  type="radio"
                  name={name}
                  value={n}
                  checked={value === n}
                  onChange={() => onChange(name, n)}
                  required={required}
                  className="rating-star-input"
                />
                <i
                  className={`${isFilled ? 'fas' : 'far'} fa-star`}
                  aria-hidden="true"
                />
              </label>
            );
          })}
        </div>

        <span className="rating-input-meta" aria-live="polite">
          {value ? RATING_LABELS[value] : <span className="rating-input-hint">Tap to rate</span>}
        </span>
      </div>
    </fieldset>
  );
};

export default RatingInput;
