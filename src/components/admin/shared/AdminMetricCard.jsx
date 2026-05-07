import React from 'react';
import { useAnimatedCounter } from '../../../pages/admin/adminHooks';

/**
 * AdminMetricCard — single KPI tile for dashboards and page summaries.
 *
 * Distinguishes itself from the legacy `.admin-stat-card` markup by:
 *   - tone-aware accent strip (`primary` | `accent` | `success` | `warning` | `danger`)
 *   - supports loading skeleton while data is in flight (no animated zero flash)
 *   - delta with arrow + neutral fallback so missing trends don't lie
 *   - icon chip is optional and renders inert when omitted
 *   - clickable: when `onClick` is set, becomes a button-row navigable tile
 *
 * Counts up only when `loading=false` and `value` is a finite number.
 */
const AdminMetricCard = ({
  label,
  value,
  delta,
  deltaTone = 'neutral',
  hint,
  icon,
  tone = 'primary',
  loading = false,
  delay = 0,
  onClick,
  ariaLabel,
}) => {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : null;
  const animated = useAnimatedCounter(numeric ?? 0, 1100, delay);
  const display = (() => {
    if (loading) return '—';
    if (numeric === null) return value ?? '—';
    return animated.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  })();

  const Tag = onClick ? 'button' : 'div';
  const tagProps = onClick
    ? { type: 'button', onClick, 'aria-label': ariaLabel || label }
    : {};

  return (
    <Tag
      className={`admin-metric admin-metric-${tone}${onClick ? ' admin-metric-interactive' : ''}${
        loading ? ' is-loading' : ''
      }`}
      style={{ animationDelay: `${delay}ms` }}
      {...tagProps}
    >
      <div className="admin-metric-head">
        <span className="admin-metric-label">{label}</span>
        {icon && (
          <span className="admin-metric-icon" aria-hidden="true">
            <i className={`fas ${icon}`} />
          </span>
        )}
      </div>
      <div className="admin-metric-value" aria-live="polite">
        {display}
      </div>
      <div className="admin-metric-foot">
        {delta && (
          <span className={`admin-metric-delta admin-metric-delta-${deltaTone}`}>
            {deltaTone === 'positive' && (
              <i className="fas fa-arrow-up" aria-hidden="true" />
            )}
            {deltaTone === 'negative' && (
              <i className="fas fa-arrow-down" aria-hidden="true" />
            )}
            {delta}
          </span>
        )}
        {hint && <span className="admin-metric-hint">{hint}</span>}
      </div>
    </Tag>
  );
};

export default AdminMetricCard;
