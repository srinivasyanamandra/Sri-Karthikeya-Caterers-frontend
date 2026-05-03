import React from 'react';
import PropTypes from 'prop-types';

/**
 * Badge variant configurations
 * Centralized mapping for consistent status representation across all admin pages
 */
const BADGE_VARIANTS = {
  pending: {
    icon: 'fa-circle',
    color: 'pending',
    label: 'Pending',
  },
  active: {
    icon: 'fa-check-circle',
    color: 'active',
    label: 'Active',
  },
  approved: {
    icon: 'fa-check',
    color: 'approved',
    label: 'Approved',
  },
  featured: {
    icon: 'fa-star',
    color: 'featured',
    label: 'Featured',
  },
  rejected: {
    icon: 'fa-times',
    color: 'rejected',
    label: 'Rejected',
  },
  success: {
    icon: 'fa-check-circle',
    color: 'success',
    label: 'Success',
  },
  contacted: {
    icon: 'fa-phone',
    color: 'active',
    label: 'Contacted',
  },
  quoted: {
    icon: 'fa-file-alt',
    color: 'featured',
    label: 'Quoted',
  },
  confirmed: {
    icon: 'fa-check-double',
    color: 'approved',
    label: 'Confirmed',
  },
  declined: {
    icon: 'fa-times-circle',
    color: 'rejected',
    label: 'Declined',
  },
  // Source badges for subscribers
  website: {
    icon: 'fa-laptop',
    color: 'featured',
    label: 'Website',
  },
  event: {
    icon: 'fa-utensils',
    color: 'approved',
    label: 'Event',
  },
  referral: {
    icon: 'fa-user-friends',
    color: 'active',
    label: 'Referral',
  },
};

/**
 * AdminBadge - Standardized status badge component
 * 
 * @component
 * @example
 * // Using predefined variant
 * <AdminBadge variant="approved" />
 * 
 * // Custom label with variant styling
 * <AdminBadge variant="pending" label="Awaiting Review" />
 * 
 * // Fully custom badge
 * <AdminBadge color="active" icon="fa-bolt" label="Custom Status" />
 * 
 * // Without icon
 * <AdminBadge variant="approved" showIcon={false} />
 */
const AdminBadge = ({
  variant = null,
  color = null,
  label = null,
  icon = null,
  showIcon = true,
  size = 'md',
  className = '',
  ariaLabel,
}) => {
  // Get configuration from variant or use custom values
  const config = variant ? BADGE_VARIANTS[variant] : {};
  
  const finalColor = color || config.color || 'pending';
  const finalLabel = label || config.label || variant || 'Unknown';
  const finalIcon = icon || config.icon;

  const classes = [
    'admin-badge',
    `admin-badge-${finalColor}`,
    `admin-badge-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      role="status"
      aria-label={ariaLabel || `Status: ${finalLabel}`}
    >
      {showIcon && finalIcon && (
        <i className={`fas ${finalIcon} admin-badge-icon`} aria-hidden="true"></i>
      )}
      <span className="admin-badge-label">{finalLabel}</span>
    </span>
  );
};

AdminBadge.propTypes = {
  /** Predefined badge variant (overrides color, icon, label if set) */
  variant: PropTypes.oneOf([
    'pending',
    'active',
    'approved',
    'featured',
    'rejected',
    'success',
    'contacted',
    'quoted',
    'confirmed',
    'declined',
    'website',
    'event',
    'referral',
  ]),
  /** Badge color (used if variant not set) */
  color: PropTypes.oneOf(['pending', 'active', 'approved', 'featured', 'rejected', 'success']),
  /** Badge text (overrides variant label) */
  label: PropTypes.string,
  /** FontAwesome icon class (overrides variant icon) */
  icon: PropTypes.string,
  /** Show/hide icon */
  showIcon: PropTypes.bool,
  /** Badge size */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Accessible label for screen readers */
  ariaLabel: PropTypes.string,
};

export default AdminBadge;

/**
 * Export variant configurations for reference
 */
export { BADGE_VARIANTS };
