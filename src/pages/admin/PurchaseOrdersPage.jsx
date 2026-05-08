/**
 * PurchaseOrdersPage — cross-vendor PO list.
 *
 * Operational + financial view: every PO regardless of vendor, with status
 * filtering, finance summary cards (outstanding spend, draft count, paid),
 * and a "+ New PO" button that opens a creator modal pre-filled from
 * `?vendorId=` or `?bookingId=` if either is in the query string (so
 * VendorDetailPage and BookingDetailPage can deep-link the creator with
 * relevant context).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminPageHero from '../../components/admin/layout/AdminPageHero';
import AdminPortal from '../../components/admin/shared/AdminPortal';
import { useToast } from './useToast';
import { useDebounce, useEscapeKey, useFocusTrap } from './adminHooks';
import { admin as adminApi } from '../../services/api';

const STATUS_FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'draft',     label: 'Draft' },
  { id: 'issued',    label: 'Issued' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'partial',   label: 'Partial' },
  { id: 'received',  label: 'Received' },
  { id: 'paid',      label: 'Paid' },
  { id: 'cancelled', label: 'Cancelled' },
];

const STATUS_BADGE = {
  draft:     { label: 'Draft',     cls: 'pending' },
  issued:    { label: 'Issued',    cls: 'contacted' },
  confirmed: { label: 'Confirmed', cls: 'booked' },
  partial:   { label: 'Partial',   cls: 'pending' },
  received:  { label: 'Received',  cls: 'approved' },
  paid:      { label: 'Paid',      cls: 'approved' },
  cancelled: { label: 'Cancelled', cls: 'declined' },
};

const fmtMoney = (cents, currency = 'INR') => {
  if (cents == null) return '—';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency, maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `₹${(cents / 100).toLocaleString('en-IN')}`;
  }
};

const fmtDate = (s) =>
  s ? new Date(s).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchRaw, setSearchRaw] = useState('');
  const search = useDebounce(searchRaw, 280);
  const [showCreate, setShowCreate] = useState(false);

  // Honour deep-link: ?new=1 opens the creator immediately. ?vendorId / ?bookingId
  // are read by the modal to seed its initial vendor / booking selection.
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
      .listPurchaseOrders({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        q: search || undefined,
        vendorId: searchParams.get('vendorId') || undefined,
        bookingId: searchParams.get('bookingId') || undefined,
        page: 0,
        size: 200,
        sortField: 'createdAt',
        sortDir: 'desc',
      })
      .then((data) => {
        setPos(Array.isArray(data?.items) ? data.items : []);
        setLoadError('');
      })
      .catch((err) => setLoadError(err?.message || 'Could not load purchase orders.'))
      .finally(() => setLoading(false));
  }, [statusFilter, search, searchParams]);

  useEffect(() => { reload(); }, [reload]);

  const summary = useMemo(() => {
    const draft = pos.filter((p) => p.status === 'draft').length;
    const inFlight = pos.filter((p) => ['issued', 'confirmed', 'partial'].includes(p.status)).length;
    const totalValue = pos.reduce((s, p) => s + (p.totalCents || 0), 0);
    const outstanding = pos.reduce((s, p) => s + (p.outstandingCents || 0), 0);
    return { draft, inFlight, totalValue, outstanding };
  }, [pos]);

  return (
    <>
      <AdminPageHero
        eyebrow="Supply"
        icon="fa-file-invoice-dollar"
        title="Purchase orders"
        subtitle={`${pos.length} order${pos.length === 1 ? '' : 's'} loaded`}
        intro="Every PO across every vendor — track issued/received/paid status and the outstanding payable in one place."
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={reload} disabled={loading}>
              <i className={`fas fa-sync${loading ? ' fa-spin' : ''}`} aria-hidden="true" /> Refresh
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <i className="fas fa-plus" aria-hidden="true" /> New PO
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
            <SummaryCard icon="fa-pen-to-square" label="Drafts"     value={summary.draft} />
            <SummaryCard icon="fa-paper-plane"   label="In flight"  value={summary.inFlight} tone="primary" />
            <SummaryCard icon="fa-rupee-sign"    label="Total value" value={fmtMoney(summary.totalValue)} />
            <SummaryCard icon="fa-hand-holding-dollar" label="Outstanding" value={fmtMoney(summary.outstanding)} tone="warning" />
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
            <label className="admin-search" htmlFor="po-search" style={{ marginLeft: 'auto' }}>
              <i className="fas fa-search" aria-hidden="true" />
              <input id="po-search" type="search" placeholder="Reference or vendor…" value={searchRaw} onChange={(e) => setSearchRaw(e.target.value)} />
            </label>
          </div>

          <div className="admin-table-container">
            <div className="admin-table-header">
              <h3 className="admin-table-title">PO list</h3>
              <div className="admin-table-actions" style={{ fontSize: 12, color: 'var(--text-light)' }}>
                {pos.length} result{pos.length !== 1 ? 's' : ''}
              </div>
            </div>

            {loading ? (
              <div className="admin-loading"><div className="admin-spinner" /></div>
            ) : pos.length === 0 ? (
              <div className="admin-empty-state">
                <div className="admin-empty-icon">
                  <i className="fas fa-file-invoice-dollar" aria-hidden="true" />
                </div>
                <h3>No purchase orders yet</h3>
                <p>Create one to start tracking spend and deliveries.</p>
                <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
                  <i className="fas fa-plus" aria-hidden="true" /> New PO
                </button>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Vendor</th>
                    <th>Booking</th>
                    <th>Status</th>
                    <th>Issued</th>
                    <th>Expected</th>
                    <th>Lines</th>
                    <th style={{ textAlign: 'right' }}>Total / Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {pos.map((p) => {
                    const cfg = STATUS_BADGE[p.status] || STATUS_BADGE.draft;
                    return (
                      <tr
                        key={p.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/admin/purchase-orders/${p.id}`)}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(`/admin/purchase-orders/${p.id}`)}
                        tabIndex={0}
                        role="row"
                      >
                        <td><div className="admin-cell-title" style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>{p.reference}</div></td>
                        <td>
                          <div className="admin-cell-title">{p.vendorName}</div>
                          <div className="admin-cell-sub" style={{ textTransform: 'capitalize' }}>{(p.vendorCategory || '').replace('_', ' ')}</div>
                        </td>
                        <td className="admin-cell-sub">{p.bookingReference || '—'}</td>
                        <td><span className={`status-badge ${cfg.cls}`}>{cfg.label}</span></td>
                        <td className="admin-cell-sub">{fmtDate(p.issueDate)}</td>
                        <td className="admin-cell-sub">{fmtDate(p.expectedDelivery)}</td>
                        <td><span className="admin-cell-strong">{p.itemCount}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="admin-cell-strong">{fmtMoney(p.totalCents, p.currency)}</div>
                          <div className="admin-cell-sub">{fmtMoney(p.paidCents, p.currency)} paid</div>
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
        <CreatePoModal
          presetVendorId={searchParams.get('vendorId') || ''}
          presetBookingId={searchParams.get('bookingId') || ''}
          onClose={() => setShowCreate(false)}
          onCreated={(po) => {
            setShowCreate(false);
            toast.success(`${po.reference} created.`);
            navigate(`/admin/purchase-orders/${po.id}`);
          }}
        />
      )}
    </>
  );
}

/* ─── Summary card ────────────────────────────────────── */

function SummaryCard({ icon, label, value, tone }) {
  const color = tone === 'warning' ? 'var(--color-accent-dark)'
              : tone === 'primary' ? 'var(--color-primary)'
              : 'var(--text-secondary)';
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
        width: 38, height: 38, borderRadius: 10,
        background: 'rgba(20,58,38,0.06)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}><i className={`fas ${icon}`} /></span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-light)', fontWeight: 600 }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--color-primary)', lineHeight: 1.1, marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}

/* ─── Create-PO modal ───────────────────────────────────── */

function CreatePoModal({ presetVendorId, presetBookingId, onClose, onCreated }) {
  const ref = useRef(null);
  useFocusTrap(ref, true);
  useEscapeKey(onClose, true);
  const { toast } = useToast();

  const [vendors, setVendors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [vendorId, setVendorId] = useState(presetVendorId);
  const [bookingId, setBookingId] = useState(presetBookingId);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [lines, setLines] = useState([{ description: '', quantity: '1', unit: 'each', unitPrice: '0' }]);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  // Pull active vendors and recent in-flight bookings in parallel so the
  // dropdowns are populated by the time the modal animates in.
  useEffect(() => {
    Promise.all([
      adminApi.listVendors({ status: 'active', size: 200, sortField: 'name', sortDir: 'asc' })
        .then((data) => Array.isArray(data?.items) ? data.items : [])
        .catch(() => []),
      // Surface confirmed + in-progress bookings (the ones admins are
      // actually buying for). Cancelled / completed are filtered out so
      // the dropdown stays short.
      adminApi.listBookings({ size: 100, sortField: 'eventDate', sortDir: 'desc' })
        .then((data) => Array.isArray(data?.items) ? data.items : [])
        .catch(() => []),
    ]).then(([vs, bs]) => {
      setVendors(vs);
      setBookings(bs.filter((b) => b.status !== 'cancelled' && b.status !== 'completed'));
    });
  }, []);

  const totalCents = useMemo(() =>
    lines.reduce((s, l) => {
      const q = Number(l.quantity) || 0;
      const p = Math.round((Number(l.unitPrice) || 0) * 100);
      return s + Math.round(q * p);
    }, 0)
  , [lines]);

  const update = (i, patch) => {
    setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  };
  const addLine = () => setLines((prev) => [...prev, { description: '', quantity: '1', unit: 'each', unitPrice: '0' }]);
  const removeLine = (i) => setLines((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    if (!vendorId) { setErr('Select a vendor.'); return; }
    const filteredLines = lines.filter((l) => l.description.trim());
    if (filteredLines.length === 0) { setErr('Add at least one line item.'); return; }
    setSubmitting(true);
    setErr('');
    try {
      const created = await adminApi.createPurchaseOrder({
        vendorId,
        bookingId: bookingId || null,
        issueDate,
        expectedDelivery: expectedDelivery || null,
        items: filteredLines.map((l, i) => ({
          description: l.description.trim(),
          quantity: l.quantity.toString(),
          unit: l.unit || 'each',
          unitPriceCents: Math.max(0, Math.round((Number(l.unitPrice) || 0) * 100)),
          position: i,
        })),
      });
      onCreated(created);
    } catch (error) {
      setErr(error?.message || 'Could not create PO.');
      toast.error(error?.message || 'Could not create PO.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPortal>
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-content modal-lg" ref={ref} role="dialog" aria-modal="true" aria-label="Create PO">
          <div className="modal-header">
            <h2>New purchase order</h2>
            <button type="button" onClick={onClose} aria-label="Close" disabled={submitting}>
              <i className="fas fa-times" aria-hidden="true" />
            </button>
          </div>
          <form onSubmit={submit} noValidate>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {err && <div className="form-error" role="alert"><i className="fas fa-exclamation-circle" aria-hidden="true" /> {err}</div>}

              <div className="form-row">
                <div className="form-group">
                  <label>Vendor <span className="req">*</span></label>
                  <select className="admin-input" value={vendorId} onChange={(e) => setVendorId(e.target.value)} disabled={submitting}>
                    <option value="">Select a vendor…</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} · {v.category}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Booking (optional)</label>
                  <select
                    className="admin-input"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    disabled={submitting}
                  >
                    <option value="">Not linked to a booking</option>
                    {/* If the modal was deep-linked with a bookingId we
                        don't have in the list (e.g. cancelled/completed),
                        keep it as a synthetic option so the user sees what
                        they're about to attach to. */}
                    {presetBookingId && !bookings.some((b) => b.id === presetBookingId) && (
                      <option value={presetBookingId}>Booking {presetBookingId.slice(0, 8)}…</option>
                    )}
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.reference} · {b.eventType} · {b.eventDate}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Issue date</label>
                  <input type="date" className="admin-input" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} disabled={submitting} />
                </div>
                <div className="form-group">
                  <label>Expected delivery</label>
                  <input type="date" className="admin-input" value={expectedDelivery} onChange={(e) => setExpectedDelivery(e.target.value)} disabled={submitting} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong>Line items</strong>
                  <button type="button" className="btn btn-ghost btn-small" onClick={addLine}>
                    <i className="fas fa-plus" aria-hidden="true" /> Add line
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {lines.map((l, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr auto', gap: 8 }}>
                      <input className="admin-input" placeholder="Description" value={l.description} onChange={(e) => update(i, { description: e.target.value })} />
                      <input className="admin-input" type="number" min="0" step="0.001" placeholder="Qty" value={l.quantity} onChange={(e) => update(i, { quantity: e.target.value })} />
                      <input className="admin-input" placeholder="Unit" value={l.unit} onChange={(e) => update(i, { unit: e.target.value })} />
                      <input className="admin-input" type="number" min="0" step="0.01" placeholder="Unit price" value={l.unitPrice} onChange={(e) => update(i, { unitPrice: e.target.value })} />
                      <button type="button" className="btn btn-ghost btn-small" onClick={() => removeLine(i)} aria-label="Remove line">
                        <i className="fas fa-times" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, textAlign: 'right', fontSize: 14 }}>
                  Subtotal: <strong>{fmtMoney(totalCents)}</strong>
                </div>
              </div>
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
