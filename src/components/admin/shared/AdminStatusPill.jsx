import React from 'react';

/**
 * AdminStatusPill — campaign / job / queue status indicator.
 *
 * Distinct from AdminBadge (which models *content* statuses like
 * "Featured", "Pending review") because campaign lifecycle has its
 * own vocabulary and motion (pulsing dot for in-flight states).
 *
 * Statuses come straight from the backend `CampaignStatus` enum:
 *   draft | queued | sending | sent | failed | cancelled
 *
 * Falls back to a neutral pill if the status isn't recognised so the
 * UI doesn't crash on unfamiliar future values.
 */
const STATUS_META = {
  draft: { label: 'Draft', icon: 'fa-pen-to-square', tone: 'neutral' },
  queued: { label: 'Scheduled', icon: 'fa-clock', tone: 'info', pulse: true },
  sending: { label: 'Sending', icon: 'fa-paper-plane', tone: 'warning', pulse: true },
  sent: { label: 'Sent', icon: 'fa-circle-check', tone: 'success' },
  failed: { label: 'Failed', icon: 'fa-circle-exclamation', tone: 'danger' },
  cancelled: { label: 'Cancelled', icon: 'fa-ban', tone: 'neutral' },
};

const AdminStatusPill = ({ status, label, size = 'md', className = '' }) => {
  const key = (status || '').toLowerCase();
  const meta = STATUS_META[key] || {
    label: label || status || 'Unknown',
    icon: 'fa-circle',
    tone: 'neutral',
  };

  const classes = [
    'admin-status-pill',
    `admin-status-pill-${meta.tone}`,
    `admin-status-pill-${size}`,
    meta.pulse && 'admin-status-pill-pulse',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} role="status" aria-label={`Status: ${label || meta.label}`}>
      <span className="admin-status-pill-dot" aria-hidden="true">
        <i className={`fas ${meta.icon}`} />
      </span>
      <span className="admin-status-pill-label">{label || meta.label}</span>
    </span>
  );
};

export default AdminStatusPill;
