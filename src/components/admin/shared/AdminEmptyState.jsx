import React from 'react';
import PropTypes from 'prop-types';
import AdminButton from './AdminButton';

/**
 * AdminEmptyState - Standardized empty state component
 * 
 * Used when:
 * - No data to display
 * - Search returns no results
 * - Filtered view is empty
 * - Initial state before data is added
 * 
 * @component
 * @example
 * // Basic empty state
 * <AdminEmptyState
 *   icon="fa-users"
 *   title="No clients yet"
 *   description="Add your first client to get started."
 * />
 * 
 * // With action button
 * <AdminEmptyState
 *   icon="fa-inbox"
 *   title="No pending reviews"
 *   description="All reviews have been moderated."
 *   actionIcon="fa-plus"
 *   actionLabel="Add Review"
 *   onAction={handleAddReview}
 * />
 * 
 * // Search results empty state
 * <AdminEmptyState
 *   icon="fa-search"
 *   title="No results found"
 *   description="Try adjusting your search criteria."
 *   variant="search"
 * />
 */
const AdminEmptyState = ({
  icon = 'fa-inbox',
  title = 'No data',
  description = null,
  actionIcon = null,
  actionLabel = null,
  onAction = null,
  actionVariant = 'primary',
  variant = 'default',
  className = '',
}) => {
  const classes = [
    'admin-empty-state',
    `admin-empty-state-${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="status" aria-live="polite">
      <div className="admin-empty-icon">
        <i className={`fas ${icon}`} aria-hidden="true"></i>
      </div>
      <h3 className="admin-empty-title">{title}</h3>
      {description && (
        <p className="admin-empty-description">{description}</p>
      )}
      {actionLabel && onAction && (
        <div className="admin-empty-action">
          <AdminButton
            variant={actionVariant}
            icon={actionIcon}
            onClick={onAction}
          >
            {actionLabel}
          </AdminButton>
        </div>
      )}
    </div>
  );
};

AdminEmptyState.propTypes = {
  /** FontAwesome icon class */
  icon: PropTypes.string,
  /** Main heading text */
  title: PropTypes.string.isRequired,
  /** Supporting description text */
  description: PropTypes.string,
  /** Action button icon */
  actionIcon: PropTypes.string,
  /** Action button label */
  actionLabel: PropTypes.string,
  /** Action button click handler */
  onAction: PropTypes.func,
  /** Action button variant */
  actionVariant: PropTypes.oneOf(['primary', 'secondary', 'accent', 'ghost', 'danger']),
  /** Empty state variant (affects styling) */
  variant: PropTypes.oneOf(['default', 'search', 'error']),
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default AdminEmptyState;
