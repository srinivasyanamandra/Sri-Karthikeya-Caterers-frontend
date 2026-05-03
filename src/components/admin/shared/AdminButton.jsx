import React from 'react';
import PropTypes from 'prop-types';

/**
 * AdminButton - Standardized button component for admin interface
 * 
 * @component
 * @example
 * // Primary button with icon
 * <AdminButton variant="primary" icon="fa-plus" onClick={handleClick}>
 *   Add Client
 * </AdminButton>
 * 
 * // Loading state
 * <AdminButton variant="accent" loading={true}>
 *   Saving...
 * </AdminButton>
 * 
 * // Danger button
 * <AdminButton variant="danger" icon="fa-trash" size="sm">
 *   Delete
 * </AdminButton>
 */
const AdminButton = ({
  variant = 'primary',
  size = 'md',
  icon = null,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  onClick,
  type = 'button',
  className = '',
  ariaLabel,
  ...props
}) => {
  const classes = [
    'admin-btn',
    `admin-btn-${variant}`,
    `admin-btn-${size}`,
    fullWidth && 'admin-btn-full',
    loading && 'admin-btn-loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={classes}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      {...props}
    >
      {loading && (
        <i className="fas fa-spinner fa-spin admin-btn-spinner" aria-hidden="true"></i>
      )}
      {!loading && icon && iconPosition === 'left' && (
        <i className={`fas ${icon} admin-btn-icon-left`} aria-hidden="true"></i>
      )}
      {children && <span className="admin-btn-text">{children}</span>}
      {!loading && icon && iconPosition === 'right' && (
        <i className={`fas ${icon} admin-btn-icon-right`} aria-hidden="true"></i>
      )}
    </button>
  );
};

AdminButton.propTypes = {
  /** Button style variant */
  variant: PropTypes.oneOf(['primary', 'secondary', 'accent', 'ghost', 'danger']),
  /** Button size */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** FontAwesome icon class (e.g., 'fa-plus') */
  icon: PropTypes.string,
  /** Icon position relative to text */
  iconPosition: PropTypes.oneOf(['left', 'right']),
  /** Show loading spinner */
  loading: PropTypes.bool,
  /** Disable button */
  disabled: PropTypes.bool,
  /** Make button full width */
  fullWidth: PropTypes.bool,
  /** Button content */
  children: PropTypes.node,
  /** Click handler */
  onClick: PropTypes.func,
  /** Button type attribute */
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Accessible label for screen readers */
  ariaLabel: PropTypes.string,
};

export default AdminButton;
