/**
 * BookingsPage — manage confirmed events.
 *
 * A booking is what a quote becomes once it's accepted. This page is the
 * operational hub: filterable list with status pills, a quick at-a-glance
 * pipeline summary, and row-level navigation into the detail view where
 * checklist + finance + ops live.
 *
 * Read paths:
 *   GET /api/admin/bookings?status=&q=&fromDate=&toDate=&page=&size=
 *
 * Write paths used here:
 *   none — all mutations live on BookingDetailPage. Listing is read-only;
 *   we navigate into a detail screen for any state change so the audit trail
 *   stays attached to a single context.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPageHero from '../../components/admin/layout/AdminPageHero';
import { useDebounce } from './adminHooks';
import { admin as adminApi } from '../../services/api';

const STATUS_CONFIG = {
  confirmed:   { label: 'Confirmed',   cls: 'booked',     icon: 'fa-check-circle' },
  in_progress: { label: 'In progress', cls: 'contacted',  icon: 'fa-spinner' },
  completed:   { label: 'Completed',   cls: 'approved',   icon: 'fa-flag-checkered' },
  cancelled:   { label: 'Cancelled',   cls: 'declined',   icon: 'fa-ban' },
  postponed:   { label: 'Postponed',   cls: 'pending',    icon: 'fa-pause-circle' },
};

const STATUS_FILTERS = [
  { id: 'all',         label: 'All' },
  { id: 'confirmed',   label: 'Confirmed' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed',   label: 'Completed' },
  { id: 'cancelled',   label: 'Cancelled' },
  { id: 'postponed',   label: 'Postponed' },
];

const fmtDate = (s) =>
  s ? new Date(s).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';

const fmtMoney = (cents, currency = 'INR') => {
  if (cents == null) return '—';
  const value = cents / 100;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString('en-IN')}`;
  }
};

export default function BookingsPage() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchRaw, setSearchRaw] = useState('');
  const search = useDebounce(searchRaw, 280);

  const reload = useCallback(() => {
    setLoading(true);
    return adminApi
      .listBookings({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        q: search || undefined,
        page: 0,
        size: 200,
        sortField: 'eventDate',
        sortDir: 'asc',
      })
      .then((data) => {
        setBookings(Array.isArray(data?.items) ? data.items : []);
        setLoadError('');
      })
      .catch((err) => setLoadError(err?.message || 'Could not load bookings.'))
      .finally(() => setLoading(false));
  }, [statusFilter, search]);

  useEffect(() => { reload(); }, [reload]);

  /* ── pipeline summary ── */
  const counts = useMemo(() => {
    const byStatus = bookings.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});
    const totalPaidCents = bookings.reduce((s, b) => s + (b.paidAmountCents || 0), 0);
    const upcomingThisMonth = bookings.filter((b) => {
      if (!b.eventDate) return false;
      const d = new Date(b.eventDate);
      const now = new Date();
      return d.getFullYear() === now.getFullYear()
        && d.getMonth() === now.getMonth()
        && d >= now
        && b.status !== 'cancelled';
    }).length;
    return { byStatus, totalPaidCents, upcomingThisMonth };
  }, [bookings]);

  const goToDetail = useCallback(
    (id) => navigate(`/admin/bookings/${id}`),
    [navigate]
  );

  return (
    <>
      <AdminPageHero
        eyebrow="Operations"
        icon="fa-calendar-check"
        title="Bookings"
        subtitle={`${bookings.length} booking${bookings.length === 1 ? '' : 's'}`}
        intro="Confirmed events from quote acceptance through delivery — track checklist progress, finance, and the day-of plan."
        actions={
          <button
            type="button"
            className="btn btn-ghost"
            onClick={reload}
            disabled={loading}
          >
            <i className={`fas fa-sync${loading ? ' fa-spin' : ''}`} aria-hidden="true" />
            {' '}Refresh
          </button>
        }
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

          {/* Quick pipeline summary */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <SummaryCard
              icon="fa-calendar-check"
              label="Confirmed"
              value={counts.byStatus.confirmed || 0}
              tone="primary"
            />
            <SummaryCard
              icon="fa-spinner"
              label="In progress"
              value={counts.byStatus.in_progress || 0}
              tone="accent"
            />
            <SummaryCard
              icon="fa-flag-checkered"
              label="Completed"
              value={counts.byStatus.completed || 0}
              tone="success"
            />
            <SummaryCard
              icon="fa-rupee-sign"
              label="Paid (loaded set)"
              value={fmtMoney(counts.totalPaidCents)}
              tone="muted"
            />
            <SummaryCard
              icon="fa-calendar-day"
              label="This month"
              value={counts.upcomingThisMonth}
              tone="muted"
            />
          </div>

          {/* Toolbar: status pills + search */}
          <div className="admin-toolbar" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div
              className="admin-toolbar-left"
              style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
              role="tablist"
              aria-label="Filter by status"
            >
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className="btn btn-ghost"
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                    background: statusFilter === f.id ? 'var(--color-primary)' : undefined,
                    color: statusFilter === f.id ? '#fff' : undefined,
                    borderColor: statusFilter === f.id ? 'var(--color-primary)' : undefined,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <label className="admin-search" htmlFor="booking-search" style={{ marginLeft: 'auto' }}>
              <i className="fas fa-search" aria-hidden="true" />
              <input
                id="booking-search"
                type="search"
                placeholder="Search reference, client, event…"
                value={searchRaw}
                onChange={(e) => setSearchRaw(e.target.value)}
                aria-label="Search bookings"
              />
            </label>
          </div>

          <div className="admin-table-container">
            <div className="admin-table-header">
              <h3 className="admin-table-title">Booking list</h3>
              <div className="admin-table-actions" style={{ fontSize: 12, color: 'var(--text-light)' }}>
                {bookings.length} result{bookings.length !== 1 ? 's' : ''}
              </div>
            </div>

            {loading ? (
              <div className="admin-loading"><div className="admin-spinner" /></div>
            ) : bookings.length === 0 ? (
              <div className="admin-empty-state">
                <div className="admin-empty-icon">
                  <i className="fas fa-calendar-check" aria-hidden="true" />
                </div>
                <h3>No bookings yet</h3>
                <p>
                  Bookings appear here once you convert a quote. Open a quote in the
                  Quote Requests page and click "Convert to booking" to get started.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate('/admin/quotes')}
                >
                  <i className="fas fa-file-alt" aria-hidden="true" /> Go to quotes
                </button>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Client</th>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Guests</th>
                    <th>Package</th>
                    <th>Status</th>
                    <th>Tasks</th>
                    <th style={{ textAlign: 'right' }}>Total / Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.confirmed;
                    return (
                      <tr
                        key={b.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => goToDetail(b.id)}
                        onKeyDown={(e) =>
                          (e.key === 'Enter' || e.key === ' ') && goToDetail(b.id)
                        }
                        tabIndex={0}
                        role="row"
                        aria-label={`Open booking ${b.reference}`}
                      >
                        <td>
                          <div
                            className="admin-cell-title"
                            style={{ fontFamily: 'var(--font-body)', fontSize: 13, letterSpacing: '0.02em' }}
                          >
                            {b.reference}
                          </div>
                        </td>
                        <td>
                          <div className="admin-cell-title">{b.clientName}</div>
                          <div className="admin-cell-sub">{b.clientEmail}</div>
                        </td>
                        <td>{b.eventType}</td>
                        <td className="admin-cell-sub">{fmtDate(b.eventDate)}</td>
                        <td><span className="admin-cell-strong">{b.guestCount}</span></td>
                        <td className="admin-cell-sub">{b.packageName || '—'}</td>
                        <td>
                          <span className={`status-badge ${cfg.cls}`}>
                            <i className={`fas ${cfg.icon}`} aria-hidden="true" /> {cfg.label}
                          </span>
                        </td>
                        <td>
                          {b.openTaskCount > 0 ? (
                            <span
                              className="status-badge pending"
                              title={`${b.openTaskCount} task${b.openTaskCount === 1 ? '' : 's'} open`}
                            >
                              <i className="fas fa-list-check" aria-hidden="true" />
                              {b.openTaskCount} open
                            </span>
                          ) : (
                            <span className="admin-cell-sub">All clear</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="admin-cell-strong">
                            {fmtMoney(b.totalAmountCents, b.currency)}
                          </div>
                          <div className="admin-cell-sub">
                            {fmtMoney(b.paidAmountCents, b.currency)} paid
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

    </>
  );
}

/* ── small private cards (kept here so the page is self-contained) ── */

function SummaryCard({ icon, label, value, tone = 'muted' }) {
  const toneColor = {
    primary: 'var(--color-primary)',
    accent:  'var(--color-accent-dark)',
    success: 'var(--color-success)',
    muted:   'var(--text-secondary)',
  }[tone] || 'var(--text-secondary)';

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--color-border-light)',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: 'rgba(20,58,38,0.06)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: toneColor,
        }}
      >
        <i className={`fas ${icon}`} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-light)',
            fontWeight: 600,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            color: 'var(--color-primary)',
            lineHeight: 1.1,
            marginTop: 2,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
