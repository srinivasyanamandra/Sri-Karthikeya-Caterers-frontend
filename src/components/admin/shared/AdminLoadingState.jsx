import React from 'react';
import PropTypes from 'prop-types';

/**
 * AdminLoadingState - Standardized loading state component
 * 
 * @component
 * @example
 * // Default spinner
 * <AdminLoadingState />
 * 
 * // With custom message
 * <AdminLoadingState message="Loading clients..." />
 * 
 * // Skeleton loader for tables
 * <AdminLoadingState variant="skeleton" rows={5} />
 * 
 * // Inline loader
 * <AdminLoadingState variant="inline" message="Saving..." />
 */
const AdminLoadingState = ({
  variant = 'spinner',
  message = null,
  rows = 5,
  className = '',
}) => {
  // Skeleton loader for tables/lists
  if (variant === 'skeleton') {
    return (
      <div className={`admin-skeleton ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="admin-skeleton-row">
            <div className="admin-skeleton-cell admin-skeleton-cell-sm"></div>
            <div className="admin-skeleton-cell admin-skeleton-cell-lg"></div>
            <div className="admin-skeleton-cell admin-skeleton-cell-md"></div>
            <div className="admin-skeleton-cell admin-skeleton-cell-sm"></div>
          </div>
        ))}
      </div>
    );
  }

  // Inline loader (for buttons, small sections)
  if (variant === 'inline') {
    return (
      <span className={`admin-loading-inline ${className}`}>
        <i className="fas fa-spinner fa-spin admin-loading-spinner" aria-hidden="true"></i>
        {message && <span className="admin-loading-message">{message}</span>}
      </span>
    );
  }

  // Default centered spinner
  return (
    <div className={`admin-loading ${className}`} role="status" aria-live="polite">
      <div className="admin-spinner" aria-hidden="true"></div>
      {message && <p className="admin-loading-message">{message}</p>}
      <span className="sr-only">{message || 'Loading...'}</span>
    </div>
  );
};

AdminLoadingState.propTypes = {
  /** Loading indicator variant */
  variant: PropTypes.oneOf(['spinner', 'skeleton', 'inline']),
  /** Loading message to display */
  message: PropTypes.string,
  /** Number of skeleton rows (only for skeleton variant) */
  rows: PropTypes.number,
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default AdminLoadingState;
