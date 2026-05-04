import React, { useState } from 'react';

/**
 * ImageWithFallback — wraps <img> with onError graceful degradation.
 *
 * On load failure, the image is replaced by a styled placeholder block
 * (CSS class .image-fallback) so the layout doesn't break and the page
 * still feels intentional. Use everywhere we render external/CDN URLs
 * (gallery, team, testimonials, menu cards).
 *
 * Props match the native <img> contract; pass anything you would pass
 * to <img>. Two extras:
 *   - fallbackLabel: optional short text shown inside the placeholder.
 *   - className:     forwarded to both states.
 *
 * @param {object} props
 * @param {string} [props.src]
 * @param {string} props.alt - Required; used as alt text and as aria-label on the fallback.
 * @param {string} [props.className]
 * @param {string} [props.fallbackLabel] - Optional caption inside the placeholder.
 */
const ImageWithFallback = ({
  src,
  alt,
  className = '',
  fallbackLabel,
  ...rest
}) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <span
        className={`image-fallback ${className}`.trim()}
        role="img"
        aria-label={alt}
        {...rest}
      >
        <i className="fas fa-image" aria-hidden="true" />
        {fallbackLabel && <span className="image-fallback-label">{fallbackLabel}</span>}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
};

export default ImageWithFallback;
