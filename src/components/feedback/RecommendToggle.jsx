import React from 'react';

/**
 * RecommendToggle — large two-option pill ("Yes, definitely" / "Not yet").
 *
 * A radiogroup is the right semantic; we visually present it as two
 * touch-friendly cards so it never feels like a hidden "OK / Cancel" prompt.
 * Each option is its own <label> wrapping a hidden radio input — keyboard
 * navigation, screen readers and form semantics all come for free.
 */
const OPTIONS = [
  { value: 'yes', icon: 'fa-thumbs-up',   label: 'Yes, definitely' },
  { value: 'no',  icon: 'fa-thumbs-down', label: 'Not yet' },
];

const RecommendToggle = ({ name, value, onChange, required = false }) => (
  <fieldset className="recommend-toggle">
    <legend className="recommend-toggle-legend">
      Would you recommend us to family and friends?
      {required && <span className="rating-required" aria-label="required"> *</span>}
    </legend>

    <div className="recommend-toggle-options">
      {OPTIONS.map((option) => {
        const isActive = value === option.value;
        return (
          <label
            key={option.value}
            className={`recommend-option ${isActive ? 'is-active' : ''}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isActive}
              onChange={() => onChange(name, option.value)}
              required={required}
              className="recommend-option-input"
            />
            <i className={`fas ${option.icon}`} aria-hidden="true" />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  </fieldset>
);

export default RecommendToggle;
