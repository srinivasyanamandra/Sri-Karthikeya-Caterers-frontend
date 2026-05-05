/**
 * ReviewsPage.jsx — World-class review moderation
 * 
 * Features:
 *  ✦ Optimistic UI: approve/reject/feature updates instantly, rolls back on error
 *  ✦ Keyboard shortcuts: A=Approve, R=Reject, F=Feature, ESC=Close
 *  ✦ Shortcut legend shown in modal footer
 *  ✦ Animated tab counters when status changes
 *  ✦ Real filter state — actions actually move reviews between tabs
 *  ✦ Batch select (checkbox + shift-click range select)
 *  ✦ Bulk approve/reject for pending reviews
 *  ✦ Toast notifications for every action
 *  ✦ Focus trap + ESC in all modals
 *  ✦ Empty states are contextual and delightful
 */

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
  useRef,
} from 'react';
import AdminPageHero from '../../components/admin/layout/AdminPageHero';
import AdminPortal from '../../components/admin/shared/AdminPortal';
import { useToast } from './useToast';
import {
  useEscapeKey,
  useFocusTrap,
  useKeyboardShortcut,
  usePagination,
  PaginationBar,
} from './adminHooks';
import { admin as adminApi } from '../../services/api';

/** Map a server review row into the UI's review shape. */
const mapServerReview = (r) => {
  const status = (r.status || 'pending').toLowerCase();
  const uiStatus = r.isFeatured ? 'featured' : status; // pending | approved | featured | rejected
  return {
    id: r.id,
    clientName: r.reviewerName || r.clientName || 'Anonymous',
    eventType: r.eventType || '',
    eventDate: r.eventDate || '',
    rating: r.overallRating || 0,
    comment: r.comments || '',
    submittedAt: r.submittedAt || r.createdAt,
    status: uiStatus,
    approvedAt: r.moderatedAt,
    featuredAt: r.isFeatured ? r.moderatedAt : null,
  };
};

/* ─── Initial Data ────────────────────────────────────────── */

const SEED_REVIEWS = [
  {
    id: 1,
    clientName: 'Rajesh Kumar',
    eventType: 'Wedding',
    eventDate: '2026-04-15',
    rating: 5,
    comment:
      'Exceptional service! The food was absolutely delicious and the presentation was stunning. Our guests are still talking about the amazing spread.',
    submittedAt: '2026-04-20T10:30:00',
    status: 'pending',
    approvedAt: null,
    featuredAt: null,
  },
  {
    id: 2,
    clientName: 'Priya Sharma',
    eventType: 'Corporate Event',
    eventDate: '2026-04-10',
    rating: 4,
    comment:
      'Great food quality and professional service. The team was very accommodating to our dietary requirements.',
    submittedAt: '2026-04-18T14:20:00',
    status: 'pending',
    approvedAt: null,
    featuredAt: null,
  },
  {
    id: 3,
    clientName: 'Anand Reddy',
    eventType: 'Birthday Party',
    eventDate: '2026-03-25',
    rating: 5,
    comment:
      'Outstanding catering service! Every dish was perfectly prepared and beautifully presented.',
    submittedAt: '2026-03-28T09:15:00',
    status: 'approved',
    approvedAt: '2026-03-28T11:00:00',
    featuredAt: null,
  },
  {
    id: 4,
    clientName: 'Lakshmi Iyer',
    eventType: 'Wedding',
    eventDate: '2026-03-10',
    rating: 5,
    comment:
      'Sri Karthikeya Caterers made our wedding day truly special. The authentic South Indian cuisine was exceptional!',
    submittedAt: '2026-03-15T16:45:00',
    status: 'featured',
    approvedAt: '2026-03-15T18:00:00',
    featuredAt: '2026-03-16T10:00:00',
  },
  {
    id: 5,
    clientName: 'Suresh Menon',
    eventType: 'Anniversary',
    eventDate: '2026-02-14',
    rating: 3,
    comment:
      'Food was decent but service could have been better. Some items ran out before the event ended.',
    submittedAt: '2026-02-18T09:00:00',
    status: 'rejected',
    approvedAt: null,
    featuredAt: null,
  },
];

/* ─── Reducer ─────────────────────────────────────────────── */

function reviewsReducer(state, action) {
  const now = new Date().toISOString();

  switch (action.type) {
    case 'REPLACE':
      return Array.isArray(action.items) ? action.items : [];
    case 'APPROVE':
      return state.map((r) =>
        r.id === action.id ? { ...r, status: 'approved', approvedAt: now } : r
      );
    case 'REJECT':
      return state.map((r) =>
        r.id === action.id ? { ...r, status: 'rejected', approvedAt: null, featuredAt: null } : r
      );
    case 'FEATURE':
      return state.map((r) =>
        r.id === action.id
          ? { ...r, status: 'featured', approvedAt: r.approvedAt || now, featuredAt: now }
          : r
      );
    case 'UNFEATURE':
      return state.map((r) =>
        r.id === action.id ? { ...r, status: 'approved', featuredAt: null } : r
      );
    case 'BULK_APPROVE':
      return state.map((r) =>
        action.ids.includes(r.id) ? { ...r, status: 'approved', approvedAt: now } : r
      );
    case 'BULK_REJECT':
      return state.map((r) =>
        action.ids.includes(r.id) ? { ...r, status: 'rejected' } : r
      );
    case 'ROLLBACK':
      return action.snapshot;
    default:
      return state;
  }
}

/* ─── Tabs config ─────────────────────────────────────────── */

const TABS = [
  { id: 'pending', label: 'Pending', icon: 'fa-clock', emptyMsg: 'Inbox zero — every review moderated. Nice work.' },
  { id: 'approved', label: 'Approved', icon: 'fa-check', emptyMsg: 'No approved reviews yet.' },
  { id: 'featured', label: 'Featured', icon: 'fa-star', emptyMsg: 'No featured reviews yet — approve some first.' },
  { id: 'rejected', label: 'Rejected', icon: 'fa-ban', emptyMsg: 'No rejected reviews.' },
];

/* ─── Helpers ─────────────────────────────────────────────── */

const fmt = (s) =>
  new Date(s).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

const fmtDt = (s) =>
  new Date(s).toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

/* ─── Sub-components ──────────────────────────────────────── */

function Stars({ rating, size = 14 }) {
  return (
    <div className="admin-rating" aria-label={`${rating} out of 5 stars`} style={{ gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <i
          key={s}
          className="fas fa-star"
          aria-hidden="true"
          style={{
            fontSize: size,
            color: s <= rating ? 'var(--color-accent)' : 'var(--color-border-strong)',
            transition: 'color 200ms',
          }}
        />
      ))}
    </div>
  );
}

function ReviewModal({ review, activeTab, onClose, onApprove, onReject, onFeature, onUnfeature }) {
  const modalRef = useRef(null);
  useFocusTrap(modalRef, true);
  useEscapeKey(onClose, true);

  const shortcutHint = (key, label, color) => (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        color: 'var(--text-light)',
        fontWeight: 500,
      }}
    >
      <kbd
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 4,
          padding: '1px 6px',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 11,
          color: color || 'var(--text-secondary)',
        }}
      >
        {key}
      </kbd>
      {label}
    </span>
  );

  return (
    <AdminPortal>
      <div
        className="modal-overlay"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        role="dialog"
        aria-modal="true"
        aria-label={`Review by ${review.clientName}`}
      >
        <div className="modal-content modal-lg" ref={modalRef}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ margin: 0 }}>Review</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Stars rating={review.rating} />
              <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
                {review.eventType} · {fmt(review.eventDate)}
              </span>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close modal">
            <i className="fas fa-times" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Client */}
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.35rem',
              fontWeight: 450,
              color: 'var(--color-primary)',
              letterSpacing: '-0.02em',
              marginBottom: 20,
            }}
          >
            {review.clientName}
          </div>

          {/* Review text */}
          <div className="mb-5">
            <span className="admin-subhead">Review</span>
            <blockquote
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
                fontWeight: 350,
                lineHeight: 1.75,
                color: 'var(--text-primary)',
                margin: 0,
                borderLeft: '3px solid var(--color-accent)',
                paddingLeft: 18,
                fontStyle: 'normal',
              }}
            >
              "{review.comment}"
            </blockquote>
          </div>

          {/* Timeline */}
          <div className="modal-summary">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
              <div>
                <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-light)', fontWeight: 600 }}>Submitted</span>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{fmtDt(review.submittedAt)}</div>
              </div>
              {review.approvedAt && (
                <div>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-light)', fontWeight: 600 }}>Approved</span>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{fmtDt(review.approvedAt)}</div>
                </div>
              )}
              {review.featuredAt && (
                <div>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-light)', fontWeight: 600 }}>Featured</span>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-accent-dark)' }}>{fmtDt(review.featuredAt)}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with keyboard hints */}
        <div className="modal-footer" style={{ flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
            {activeTab === 'pending' && (
              <>
                <button type="button" className="btn btn-ghost" onClick={onReject}>
                  <i className="fas fa-ban" aria-hidden="true" /> Reject
                </button>
                <button type="button" className="btn btn-primary" onClick={onApprove}>
                  <i className="fas fa-check" aria-hidden="true" /> Approve
                </button>
              </>
            )}
            {activeTab === 'approved' && (
              <>
                <button type="button" className="btn btn-ghost" onClick={onReject}>
                  <i className="fas fa-ban" aria-hidden="true" /> Reject
                </button>
                <button type="button" className="btn btn-primary" onClick={onFeature}>
                  <i className="fas fa-star" aria-hidden="true" /> Feature on homepage
                </button>
              </>
            )}
            {activeTab === 'featured' && (
              <>
                <button type="button" className="btn btn-ghost" onClick={onUnfeature}>
                  <i className="fas fa-star-half-alt" aria-hidden="true" /> Unfeature
                </button>
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  Close
                </button>
              </>
            )}
            {activeTab === 'rejected' && (
              <>
                <button type="button" className="btn btn-ghost" onClick={onApprove}>
                  <i className="fas fa-undo" aria-hidden="true" /> Re-approve
                </button>
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  Close
                </button>
              </>
            )}
          </div>

          {/* Keyboard shortcuts hint */}
          {(activeTab === 'pending' || activeTab === 'approved') && (
            <div
              style={{
                display: 'flex',
                gap: 16,
                justifyContent: 'flex-end',
                width: '100%',
                paddingTop: 6,
                borderTop: '1px solid var(--color-border-light)',
              }}
            >
              {activeTab === 'pending' && shortcutHint('A', 'Approve', 'var(--color-success)')}
              {activeTab === 'pending' && shortcutHint('R', 'Reject', 'var(--color-error)')}
              {activeTab === 'approved' && shortcutHint('F', 'Feature', 'var(--color-accent-dark)')}
              {shortcutHint('Esc', 'Close')}
            </div>
          )}
        </div>
        </div>
      </div>
    </AdminPortal>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */

const ReviewsPage = () => {
  const { toast } = useToast();
  const [reviews, dispatch] = useReducer(reviewsReducer, []);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedReview, setSelectedReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const lastCheckedRef = useRef(null);

  // Initial load + reload helper
  const reload = useCallback(() => {
    setLoading(true);
    return adminApi
      .listReviews({ page: 0, size: 200, sortField: 'createdAt', sortDir: 'desc' })
      .then((data) => {
        const items = Array.isArray(data?.items) ? data.items : [];
        dispatch({ type: 'REPLACE', items: items.map(mapServerReview) });
        setLoadError('');
      })
      .catch((err) => setLoadError(err?.message || 'Could not load reviews.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Clear selection when tab changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab]);

  // Derive current tab's reviews
  const tabReviews = useMemo(
    () => reviews.filter((r) => r.status === activeTab),
    [reviews, activeTab]
  );

  // Tab counts
  const counts = useMemo(
    () => TABS.reduce((acc, t) => ({ ...acc, [t.id]: reviews.filter((r) => r.status === t.id).length }), {}),
    [reviews]
  );

  const pagination = usePagination(tabReviews, 8);

  /* ── Action helpers ── */

  /** Optimistically apply `action`, call `apiCall`, rollback on failure. */
  const withOptimism = useCallback(
    async (snapshot, action, apiCall, successMsg, errorMsg) => {
      dispatch(action);
      try {
        await apiCall();
        toast.success(successMsg);
      } catch (err) {
        dispatch({ type: 'REPLACE', items: snapshot });
        toast.error(err?.message || errorMsg);
      }
    },
    [toast]
  );

  const handleApprove = useCallback(
    async (review) => {
      const snap = reviews;
      setSelectedReview(null);
      await withOptimism(
        snap,
        { type: 'APPROVE', id: review.id },
        () => adminApi.approveReview(review.id),
        `"${review.clientName}'s" review approved.`,
        'Could not approve review — please try again.'
      );
      if (activeTab === 'pending') setActiveTab('approved');
    },
    [reviews, activeTab, withOptimism]
  );

  const handleReject = useCallback(
    async (review) => {
      const snap = reviews;
      setSelectedReview(null);
      await withOptimism(
        snap,
        { type: 'REJECT', id: review.id },
        () => adminApi.rejectReview(review.id),
        `Review by ${review.clientName} rejected.`,
        'Could not reject review — please try again.'
      );
    },
    [reviews, withOptimism]
  );

  const handleFeature = useCallback(
    async (review) => {
      const snap = reviews;
      setSelectedReview(null);
      await withOptimism(
        snap,
        { type: 'FEATURE', id: review.id },
        () => adminApi.featureReview(review.id, true),
        `🌟 ${review.clientName}'s review is now featured!`,
        'Could not feature review — please try again.'
      );
      setActiveTab('featured');
    },
    [reviews, withOptimism]
  );

  const handleUnfeature = useCallback(
    async (review) => {
      const snap = reviews;
      setSelectedReview(null);
      await withOptimism(
        snap,
        { type: 'UNFEATURE', id: review.id },
        () => adminApi.featureReview(review.id, false),
        `Review moved back to approved.`,
        'Could not unfeature review.'
      );
      setActiveTab('approved');
    },
    [reviews, withOptimism]
  );

  // unused but exposed for future delete-from-detail UI
  // eslint-disable-next-line no-unused-vars
  const handleDelete = useCallback(
    async (review) => {
      const snap = reviews;
      setSelectedReview(null);
      try {
        await adminApi.deleteReview(review.id);
        await reload();
        toast.success('Review deleted.');
      } catch (err) {
        dispatch({ type: 'REPLACE', items: snap });
        toast.error(err?.message || 'Could not delete review.');
      }
    },
    [reviews, reload, toast]
  );

  /* ── Keyboard shortcuts (when modal is open) ── */

  useKeyboardShortcut(
    useMemo(() => ({
      a: () => selectedReview && activeTab === 'pending' && handleApprove(selectedReview),
      r: () => selectedReview && (activeTab === 'pending' || activeTab === 'approved') && handleReject(selectedReview),
      f: () => selectedReview && activeTab === 'approved' && handleFeature(selectedReview),
    }), [selectedReview, activeTab, handleApprove, handleReject, handleFeature]),
    !!selectedReview
  );

  /* ── Bulk selection ── */

  const toggleSelect = useCallback((id, e) => {
    const reviews_ = pagination.slice;
    if (e.shiftKey && lastCheckedRef.current !== null) {
      const lastIdx = reviews_.findIndex((r) => r.id === lastCheckedRef.current);
      const currIdx = reviews_.findIndex((r) => r.id === id);
      const [lo, hi] = [Math.min(lastIdx, currIdx), Math.max(lastIdx, currIdx)];
      const rangeIds = reviews_.slice(lo, hi + 1).map((r) => r.id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        rangeIds.forEach((rid) => next.add(rid));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    }
    lastCheckedRef.current = id;
  }, [pagination.slice]);

  const toggleSelectAll = useCallback(() => {
    const pageIds = pagination.slice.map((r) => r.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  }, [pagination.slice, selectedIds]);

  const handleBulkApprove = useCallback(async () => {
    const snap = reviews;
    const ids = [...selectedIds];
    setSelectedIds(new Set());
    await withOptimism(
      snap,
      { type: 'BULK_APPROVE', ids },
      () => Promise.all(ids.map((id) => adminApi.approveReview(id))),
      `${ids.length} review${ids.length > 1 ? 's' : ''} approved.`,
      'Bulk approve failed — please try again.'
    );
    setActiveTab('approved');
  }, [reviews, selectedIds, withOptimism]);

  const handleBulkReject = useCallback(async () => {
    const snap = reviews;
    const ids = [...selectedIds];
    setSelectedIds(new Set());
    await withOptimism(
      snap,
      { type: 'BULK_REJECT', ids },
      () => Promise.all(ids.map((id) => adminApi.rejectReview(id))),
      `${ids.length} review${ids.length > 1 ? 's' : ''} rejected.`,
      'Bulk reject failed — please try again.'
    );
  }, [reviews, selectedIds, withOptimism]);

  /* ── Render ── */

  const pageIds = pagination.slice.map((r) => r.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));
  const selectionCount = selectedIds.size;

  return (
    <>
      <AdminPageHero
        eyebrow="Review Management"
        icon="fa-star"
        title="Client Reviews"
        subtitle={
          counts.pending > 0
            ? `${counts.pending} pending · ${counts.approved} approved · ${counts.featured} featured`
            : `${counts.approved} approved · ${counts.featured} featured · inbox clear`
        }
        intro="Moderate, approve, and feature client reviews — only the most authentic stories reach the public site."
      />

      <section className="section">
        <div className="container">

          {loadError && (
            <div className="form-error" role="alert" style={{ marginBottom: 16 }}>
              <i className="fas fa-exclamation-circle" aria-hidden="true" /> {loadError}
              <button type="button" className="btn-link" style={{ marginLeft: 12 }} onClick={reload}>
                Retry
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="admin-tabs" role="tablist" aria-label="Review status">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`admin-tab${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <i className={`fas ${tab.icon}`} aria-hidden="true" style={{ fontSize: 12, opacity: 0.7 }} />
                {tab.label}
                <span
                  className="admin-tab-count"
                  style={{
                    background: counts[tab.id] > 0 && tab.id === 'pending'
                      ? 'rgba(179,38,30,0.12)'
                      : undefined,
                    color: counts[tab.id] > 0 && tab.id === 'pending'
                      ? 'var(--color-error)'
                      : undefined,
                    transition: 'background 400ms, color 400ms',
                  }}
                >
                  {counts[tab.id]}
                </span>
              </button>
            ))}
          </div>

          <div className="admin-table-container">
            {/* Bulk action bar (appears when items selected) */}
            {selectionCount > 0 && activeTab === 'pending' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 24px',
                  background: 'rgba(20,58,38,0.04)',
                  borderBottom: '1px solid var(--color-border-light)',
                  animation: 'revealItem 220ms var(--ease-out-expo)',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>
                  {selectionCount} selected
                </span>
                <button type="button" className="btn btn-primary" style={{ padding: '7px 16px', fontSize: 12 }} onClick={handleBulkApprove}>
                  <i className="fas fa-check" aria-hidden="true" /> Approve all
                </button>
                <button type="button" className="btn btn-ghost" style={{ padding: '7px 16px', fontSize: 12 }} onClick={handleBulkReject}>
                  <i className="fas fa-ban" aria-hidden="true" /> Reject all
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: '7px 16px', fontSize: 12, marginLeft: 'auto' }}
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear selection
                </button>
              </div>
            )}

            <div className="admin-table-header">
              <h3 className="admin-table-title">
                {TABS.find((t) => t.id === activeTab)?.label} reviews
              </h3>
              <div className="admin-table-actions">
                <button type="button" className="btn btn-ghost">
                  <i className="fas fa-download" aria-hidden="true" /> Export
                </button>
              </div>
            </div>

            {loading ? (
              <div className="admin-loading">
                <div className="admin-spinner" />
              </div>
            ) : tabReviews.length === 0 ? (
              <div className="admin-empty-state">
                <div className="admin-empty-icon">
                  <i className={`fas ${TABS.find((t) => t.id === activeTab)?.icon || 'fa-star'}`} aria-hidden="true" />
                </div>
                <h3>No {activeTab} reviews</h3>
                <p>{TABS.find((t) => t.id === activeTab)?.emptyMsg}</p>
                {activeTab !== 'pending' && (
                  <button type="button" className="btn btn-ghost" onClick={() => setActiveTab('pending')}>
                    ← View pending reviews
                  </button>
                )}
              </div>
            ) : (
              <>
                <table className="admin-table" role="grid">
                  <thead>
                    <tr>
                      {activeTab === 'pending' && (
                        <th style={{ width: 48 }}>
                          <input
                            type="checkbox"
                            aria-label="Select all on this page"
                            checked={allPageSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = somePageSelected && !allPageSelected;
                            }}
                            onChange={toggleSelectAll}
                          />
                        </th>
                      )}
                      <th>Client</th>
                      <th>Event</th>
                      <th>Rating</th>
                      <th>Submitted</th>
                      <th className="actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagination.slice.map((review) => (
                      <tr
                        key={review.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedReview(review)}
                        onKeyDown={(e) =>
                          (e.key === 'Enter' || e.key === ' ') && setSelectedReview(review)
                        }
                        tabIndex={0}
                        role="row"
                        aria-label={`Review by ${review.clientName}`}
                      >
                        {activeTab === 'pending' && (
                          <td
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelect(review.id, e);
                            }}
                          >
                            <input
                              type="checkbox"
                              aria-label={`Select review by ${review.clientName}`}
                              checked={selectedIds.has(review.id)}
                              onChange={(e) => toggleSelect(review.id, e.nativeEvent)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                        )}
                        <td>
                          <div className="admin-cell-title">{review.clientName}</div>
                          <div
                            className="admin-cell-sub"
                            style={{
                              maxWidth: 260,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block',
                            }}
                          >
                            {review.comment.slice(0, 72)}…
                          </div>
                        </td>
                        <td>
                          <div className="admin-cell-title">{review.eventType}</div>
                          <div className="admin-cell-sub">{fmt(review.eventDate)}</div>
                        </td>
                        <td>
                          <Stars rating={review.rating} />
                        </td>
                        <td className="admin-cell-sub">{fmtDt(review.submittedAt)}</td>
                        <td
                          className="actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {activeTab === 'pending' && (
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="btn btn-ghost"
                                style={{ padding: '6px 12px', fontSize: 12 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReject(review);
                                }}
                                aria-label="Reject"
                                title="Reject (R)"
                              >
                                <i className="fas fa-ban" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ padding: '6px 12px', fontSize: 12 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(review);
                                }}
                                aria-label="Approve"
                                title="Approve (A)"
                              >
                                <i className="fas fa-check" aria-hidden="true" />
                              </button>
                            </div>
                          )}
                          {activeTab === 'approved' && (
                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{ padding: '6px 14px', fontSize: 12 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFeature(review);
                              }}
                              title="Feature on homepage (F)"
                            >
                              <i className="fas fa-star" aria-hidden="true" /> Feature
                            </button>
                          )}
                          {(activeTab === 'featured' || activeTab === 'rejected') && (
                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{ padding: '6px 14px', fontSize: 12 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReview(review);
                              }}
                            >
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <PaginationBar pagination={pagination} label="reviews" />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Detail Modal */}
      {selectedReview && (
        <ReviewModal
          review={selectedReview}
          activeTab={activeTab}
          onClose={() => setSelectedReview(null)}
          onApprove={() => handleApprove(selectedReview)}
          onReject={() => handleReject(selectedReview)}
          onFeature={() => handleFeature(selectedReview)}
          onUnfeature={() => handleUnfeature(selectedReview)}
        />
      )}
    </>
  );
};

export default ReviewsPage;