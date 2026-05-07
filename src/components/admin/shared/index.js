/**
 * Admin shared component barrel.
 *
 * Centralised export so admin pages import every standardised primitive
 * from one path. Add new primitives here as they're created — keeping
 * pages from sprouting one-off variants of the same component.
 */

export { default as AdminButton } from './AdminButton';
export { default as AdminBadge, BADGE_VARIANTS } from './AdminBadge';
export { default as AdminLoadingState } from './AdminLoadingState';
export { default as AdminEmptyState } from './AdminEmptyState';
export { default as AdminPortal } from './AdminPortal';
export { default as AdminMetricCard } from './AdminMetricCard';
export { default as AdminConfirmDialog } from './AdminConfirmDialog';
export { default as AdminStatusPill } from './AdminStatusPill';
export { default as AdminScheduleField } from './AdminScheduleField';
