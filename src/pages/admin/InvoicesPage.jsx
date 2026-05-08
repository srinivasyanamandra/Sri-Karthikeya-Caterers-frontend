/**
 * InvoicesPage — formal billing artefacts.
 *
 * Cross-booking, cross-client list of every invoice with status filter
 * pills, search, KPI strip (drafts / outstanding / overdue / paid), and
 * a "+ New invoice" creator that requires a booking and seeds a default
 * line from the booking package + balance.
 *
 * Click into a row → InvoiceDetailPage where line items, payments and
 * status transitions live.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminPageHero from '../../components/admin/layout/AdminPageHero';
import AdminPortal from '../../components/admin/shared/AdminPortal';
import { useToast } from './useToast';
import { useDebounce, useEscapeKey, useFocusTrap } from './adminHooks';
import { admin as adminApi } from '../../services/api';

const STATUS_FILTERS = [
  { id: 'all',            label: 'All' },
  { id: 'draft',          label: 'Draft' },
  { id: 'issued',         label: 'Issued' },
  { id: 'partially_paid', label: 'Partial' },
  { id: 'paid',           label: 'Paid' },
  { id: 'overdue',        label: 'Overdue' },
  { id: 'void',           label: 'Void' },
];

const STATUS_BADGE = {
  draft:          { label: 'Draft',     cls: 'pending' },
  issued:         { label: 'Issued',    cls: 'contacted' },
  partially_paid: { label: 'Partial',   cls: 'pending' },
  paid:           { label: 'Paid',      cls: 'approved' },
  overdue:        { label: 'Overdue',   cls: 'declined' },
  void:           { label: 'Void',      cls: 'declined' },
};

const fmtMoney = (cents, currency = 'INR') => {
  if (cents == null) return '—';
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
  } catch {
    return `₹${(cents / 100).toLocaleString('en-IN')}`;
  }
};

const fmtDate = (s) =>
  s ? new Date(s).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchRaw, setSearchRaw] = useState('');
  const search = useDebounce(searchRaw, 280);
  const [showCreate, setShowCreate] = useState(false);

  // Honour ?new=1 to auto-open the creator (e.g. from BookingDetail).
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowCreate(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const reload = useCallback(() => {
    setLoading(true);
    return adminApi
      .listInvoices({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        q: search || undefined,
        bookingId: searchParams.get('bookingId') || undefined,
        clientId:  searchParams.get('clientId')  || undefined,
        page: 0,
        size: 200,
        sortField: 'createdAt',
        sortDir: 'desc',
      })
      .then((data) => {
        setInvoices(Array.isArray(data?.items) ? data.items : []);
        setLoadError('');
      })
      .catch((err) => setLoadError(err?.message || 'Could not load invoices.'))
      .finally(() => setLoading(false));
  }, [statusFilter, search, searchParams]);

  useEffect(() => { reload(); }, [reload]);

  const summary = useMemo(() => {
    const drafts = invoices.filter((i) => i.status === 'draft').length;
    const overdue = invoices.filter((i) => i.status === 'overdue').length;
    const outstanding = invoices.reduce((s, i) => s + (i.outstandingCents || 0), 0);
    const paidTotal = invoices.reduce((s, i) => s + (i.paidCents || 0), 0);
    return { drafts, overdue, outstanding, paidTotal };
  }, [invoices]);

  return (
    <>
      <AdminPageHero
        eyebrow="Finance"
        icon="fa-file-invoice"
        title="Invoices"
        subtitle={`${invoices.length} invoice${invoices.length === 1 ? '' : 's'} loaded`}
        intro="Every invoice across every booking — drafts, issued, partially-paid, overdue and paid in one ledger."
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={reload} disabled={loading}>
              <i className={`fas fa-sync${loading ? ' fa-spin' : ''}`} aria-hidden="true" /> Refresh
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <i className="fas fa-plus" aria-hidden="true" /> New invoice
            </button>
          </>
        }
      />

      <section className="section">
        <div className="container">
          {loadError && (
            <div className="form-error" role="alert" style={{ marginBottom: 16 }}>
              <i className="fas fa-exclamation-circle" aria-hidden="true" /> {loadError}
              <button type="button" className="btn-link" style={{ marginLeft: 12 }} onClick={reload}>Retry</button>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}>
            <KpiCard icon="fa-pen-to-square" label="Drafts"      value={summary.drafts} />
            <KpiCard icon="fa-clock"          label="Overdue"     value={summary.overdue} tone="danger" />
            <KpiCard icon="fa-hand-holding-dollar" label="Outstanding" value={fmtMoney(summary.outstanding)} tone="warning" />
            <KpiCard icon="fa-check"          label="Collected"   value={fmtMoney(summary.paidTotal)} tone="success" />
          </div>

          <div className="admin-toolbar" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div className="admin-toolbar-left" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
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
            <label className="admin-search" htmlFor="invoice-search" style={{ marginLeft: 'auto' }}>
              <i className="fas fa-search" aria-hidden="true" />
              <input id="invoice-search" type="search" placeholder="Reference, client, booking…" value={searchRaw} onChange={(e) => setSearchRaw(e.target.value)} />
            </label>
          </div>

          <div className="admin-table-container">
            <div className="admin-table-header">
              <h3 className="admin-table-title">Invoice list</h3>
              <div className="admin-table-actions" style={{ fontSize: 12, color: 'var(--text-light)' }}>
                {invoices.length} result{invoices.length !== 1 ? 's' : ''}
              </div>
            </div>

            {loading ? (
              <div className="admin-loading"><div className="admin-spinner" /></div>
            ) : invoices.length === 0 ? (
              <div className="admin-empty-state">
                <div className="admin-empty-icon">
                  <i className="fas fa-file-invoice" aria-hidden="true" />
                </div>
                <h3>No invoices yet</h3>
                <p>Generate one from a booking to start tracking receivables.</p>
                <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
                  <i className="fas fa-plus" aria-hidden="true" /> New invoice
                </button>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Client</th>
                    <th>Booking</th>
                    <th>Status</th>
                    <th>Issued</th>
                    <th>Due</th>
                    <th style={{ textAlign: 'right' }}>Total / Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((i) => {
                    const cfg = STATUS_BADGE[i.status] || STATUS_BADGE.draft;
                    return (
                      <tr
                        key={i.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/admin/invoices/${i.id}`)}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(`/admin/invoices/${i.id}`)}
                        tabIndex={0}
                        role="row"
                      >
                        <td><div className="admin-cell-title" style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>{i.reference}</div></td>
                        <td>
                          <div className="admin-cell-title">{i.clientName}</div>
                          <div className="admin-cell-sub">{i.clientEmail}</div>
                        </td>
                        <td className="admin-cell-sub">{i.bookingReference}</td>
                        <td><span className={`status-badge ${cfg.cls}`}>{cfg.label}</span></td>
                        <td className="admin-cell-sub">{fmtDate(i.issueDate)}</td>
                        <td className="admin-cell-sub">{fmtDate(i.dueDate)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="admin-cell-strong">{fmtMoney(i.totalCents, i.currency)}</div>
                          <div className="admin-cell-sub">{fmtMoney(i.paidCents, i.currency)} paid</div>
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

      {showCreate && (
        <CreateInvoiceModal
          presetBookingId={searchParams.get('bookingId') || ''}
          onClose={() => setShowCreate(false)}
          onCreated={(inv) => {
            setShowCreate(false);
            toast.success(`${inv.reference} created.`);
            navigate(`/admin/invoices/${inv.id}`);
          }}
        />
      )}
    </>
  );
}

function KpiCard({ icon, label, value, tone }) {
  const color = tone === 'warning' ? 'var(--color-accent-dark)'
              : tone === 'danger'  ? 'var(--color-error, #b91c1c)'
              : tone === 'success' ? 'var(--color-success)'
              : 'var(--color-primary)';
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--color-border-light)',
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <span aria-hidden="true" style={{
        width: 38, height: 38, borderRadius: 10, background: 'rgba(20,58,38,0.06)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color,
      }}><i className={`fas ${icon}`} /></span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-light)', fontWeight: 600 }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--color-primary)', lineHeight: 1.1, marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}

function CreateInvoiceModal({ presetBookingId, onClose, onCreated }) {
  const ref = useRef(null);
  useFocusTrap(ref, true);
  useEscapeKey(onClose, true);
  const { toast } = useToast();

  const [bookings, setBookings] = useState([]);
  const [bookingId, setBookingId] = useState(presetBookingId);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [seedFromBooking, setSeedFromBooking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    adminApi.listBookings({ size: 100, sortField: 'eventDate', sortDir: 'desc' })
      .then((data) => setBookings(Array.isArray(data?.items) ? data.items.filter((b) => b.status !== 'cancelled') : []))
      .catch(() => setBookings([]));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!bookingId) { setErr('Select a booking.'); return; }
    setSubmitting(true);
    setErr('');
    try {
      const created = await adminApi.createInvoice({
        bookingId,
        issueDate,
        dueDate: dueDate || null,
        seedFromBooking,
      });
      onCreated(created);
    } catch (error) {
      setErr(error?.message || 'Could not create invoice.');
      toast.error(error?.message || 'Could not create invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPortal>
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-content modal-md" ref={ref} role="dialog" aria-modal="true" aria-label="New invoice">
          <div className="modal-header">
            <h2>New invoice</h2>
            <button type="button" onClick={onClose} aria-label="Close" disabled={submitting}>
              <i className="fas fa-times" aria-hidden="true" />
            </button>
          </div>
          <form onSubmit={submit} noValidate>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {err && <div className="form-error" role="alert"><i className="fas fa-exclamation-circle" aria-hidden="true" /> {err}</div>}
              <div className="form-group">
                <label>Booking <span className="req">*</span></label>
                <select className="admin-input" value={bookingId} onChange={(e) => setBookingId(e.target.value)} disabled={submitting}>
                  <option value="">Select a booking…</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>{b.reference} · {b.eventType} · {b.eventDate}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Issue date</label>
                  <input type="date" className="admin-input" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} disabled={submitting} />
                </div>
                <div className="form-group">
                  <label>Due date</label>
                  <input type="date" className="admin-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={submitting} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input type="checkbox" checked={seedFromBooking} onChange={(e) => setSeedFromBooking(e.target.checked)} />
                Seed line items from booking package + balance (recommended)
              </label>
              <p className="admin-cell-sub" style={{ marginTop: 0, fontSize: 11 }}>
                You can edit lines, tax, and discount on the next screen.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create as draft'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminPortal>
  );
}
