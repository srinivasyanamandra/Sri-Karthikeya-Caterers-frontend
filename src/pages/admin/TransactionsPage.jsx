/**
 * TransactionsPage — unified cash-flow ledger.
 *
 * Single screen for incoming (payments) AND outgoing (expenses + vendor
 * settlements). Replaces the two-page payments + expenses split and gives
 * the admin one place to see "money in vs money out" with category and
 * direction filters.
 *
 * KPI strip → revenue / spend / net (filterable date window).
 * Filter pills → All / Incoming / Outgoing.
 * Category filter → spend categories (only meaningful for outgoing).
 * "+ Record" modal → incoming or outgoing entry.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AdminPageHero from '../../components/admin/layout/AdminPageHero';
import AdminPortal from '../../components/admin/shared/AdminPortal';
import { useToast } from './useToast';
import { useDebounce, useEscapeKey, useFocusTrap } from './adminHooks';
import { admin as adminApi } from '../../services/api';

const DIRECTION_FILTERS = [
  { id: 'all',      label: 'All' },
  { id: 'incoming', label: 'Incoming' },
  { id: 'outgoing', label: 'Outgoing' },
];

const CATEGORIES = [
  'vendor_payment','raw_ingredients','staff_salary','staff_wages',
  'transport','fuel','utilities','rent','marketing','equipment',
  'maintenance','office','taxes','bank_charges','other',
];

const METHODS = ['cash','upi','bank_transfer','cheque','card','other'];

const fmtMoney = (cents, currency = 'INR') => {
  if (cents == null) return '—';
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
  } catch {
    return `₹${(cents / 100).toLocaleString('en-IN')}`;
  }
};

const fmtDate = (s) =>
  s ? new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function TransactionsPage() {
  const { toast } = useToast();
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [direction, setDirection] = useState('all');
  const [category, setCategory]   = useState('all');
  const [searchRaw, setSearchRaw] = useState('');
  const search = useDebounce(searchRaw, 280);
  const [showCreate, setShowCreate] = useState(false);

  const reload = useCallback(() => {
    setLoading(true);
    return adminApi
      .listTransactions({
        direction: direction !== 'all' ? direction : undefined,
        category:  category  !== 'all' ? category  : undefined,
        q: search || undefined,
        page: 0,
        size: 200,
        sortField: 'paidAt',
        sortDir: 'desc',
      })
      .then((data) => {
        setTxns(Array.isArray(data?.items) ? data.items : []);
        setLoadError('');
      })
      .catch((err) => setLoadError(err?.message || 'Could not load transactions.'))
      .finally(() => setLoading(false));
  }, [direction, category, search]);

  useEffect(() => { reload(); }, [reload]);

  const summary = useMemo(() => {
    const incoming = txns
      .filter((t) => t.direction === 'incoming' && t.status !== 'refunded')
      .reduce((s, t) => s + (t.amountCents || 0), 0);
    const outgoing = txns
      .filter((t) => t.direction === 'outgoing' && t.status !== 'refunded')
      .reduce((s, t) => s + (t.amountCents || 0), 0);
    return { incoming, outgoing, net: incoming - outgoing };
  }, [txns]);

  const refundOne = async (id) => {
    if (!window.confirm('Mark this payment as refunded?')) return;
    try {
      await adminApi.refundTransaction(id);
      toast.success('Refunded.');
      reload();
    } catch (err) { toast.error(err?.message || 'Could not refund.'); }
  };

  return (
    <>
      <AdminPageHero
        eyebrow="Finance"
        icon="fa-arrow-right-arrow-left"
        title="Cash flow"
        subtitle={`${txns.length} transaction${txns.length === 1 ? '' : 's'} loaded`}
        intro="Unified ledger of incoming payments and outgoing expenses — filter, search, and reconcile."
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={reload} disabled={loading}>
              <i className={`fas fa-sync${loading ? ' fa-spin' : ''}`} aria-hidden="true" /> Refresh
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <i className="fas fa-plus" aria-hidden="true" /> Record
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
            <Kpi icon="fa-arrow-down" label="Money in" value={fmtMoney(summary.incoming)} tone="success" />
            <Kpi icon="fa-arrow-up"   label="Money out" value={fmtMoney(summary.outgoing)} tone="warning" />
            <Kpi icon="fa-equals"     label="Net"
                 value={fmtMoney(summary.net)}
                 tone={summary.net < 0 ? 'danger' : 'success'} />
          </div>

          <div className="admin-toolbar" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div className="admin-toolbar-left" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {DIRECTION_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setDirection(f.id)}
                  className="btn btn-ghost"
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                    background: direction === f.id ? 'var(--color-primary)' : undefined,
                    color: direction === f.id ? '#fff' : undefined,
                    borderColor: direction === f.id ? 'var(--color-primary)' : undefined,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
              <select
                className="admin-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: 180 }}
                disabled={direction === 'incoming'}
                title="Category filter applies to outgoing only"
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.replace('_', ' ')}</option>
                ))}
              </select>
              <label className="admin-search" htmlFor="txn-search">
                <i className="fas fa-search" aria-hidden="true" />
                <input id="txn-search" type="search" placeholder="Reference, description, txn ref…"
                  value={searchRaw} onChange={(e) => setSearchRaw(e.target.value)} />
              </label>
            </div>
          </div>

          <div className="admin-table-container">
            <div className="admin-table-header">
              <h3 className="admin-table-title">Ledger</h3>
              <div className="admin-table-actions" style={{ fontSize: 12, color: 'var(--text-light)' }}>
                {txns.length} entr{txns.length === 1 ? 'y' : 'ies'}
              </div>
            </div>

            {loading ? (
              <div className="admin-loading"><div className="admin-spinner" /></div>
            ) : txns.length === 0 ? (
              <div className="admin-empty-state">
                <div className="admin-empty-icon">
                  <i className="fas fa-arrow-right-arrow-left" aria-hidden="true" />
                </div>
                <h3>No transactions yet</h3>
                <p>Record an incoming payment or an outgoing expense to start the ledger.</p>
                <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
                  <i className="fas fa-plus" aria-hidden="true" /> Record
                </button>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>When</th>
                    <th>Direction</th>
                    <th>Counterparty</th>
                    <th>Method</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {txns.map((t) => {
                    const incoming = t.direction === 'incoming';
                    const counterparty = incoming
                      ? (t.clientName || '—')
                      : (t.vendorName || (t.category ? t.category.replace('_', ' ') : '—'));
                    return (
                      <tr key={t.id} style={{ opacity: t.status === 'refunded' ? 0.55 : 1 }}>
                        <td><div className="admin-cell-title" style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>{t.reference}</div></td>
                        <td className="admin-cell-sub">{fmtDate(t.paidAt)}</td>
                        <td>
                          <span className={`status-badge ${incoming ? 'approved' : 'pending'}`}>
                            <i className={`fas fa-arrow-${incoming ? 'down' : 'up'}`} aria-hidden="true" />
                            {' '}{t.direction}
                          </span>
                          {t.status === 'refunded' && (
                            <span className="status-badge declined" style={{ marginLeft: 6 }}>refunded</span>
                          )}
                        </td>
                        <td>
                          <div className="admin-cell-title" style={{ textTransform: 'capitalize' }}>{counterparty}</div>
                          <div className="admin-cell-sub">
                            {t.invoiceReference && <span>inv {t.invoiceReference}</span>}
                            {t.purchaseOrderReference && <span>po {t.purchaseOrderReference}</span>}
                            {t.bookingReference && <span>{t.bookingReference}</span>}
                            {t.description && <span>· {t.description}</span>}
                          </div>
                        </td>
                        <td className="admin-cell-sub" style={{ textTransform: 'capitalize' }}>{(t.method || '').replace('_', ' ')}</td>
                        <td style={{ textAlign: 'right', color: incoming ? 'var(--color-success)' : 'var(--color-accent-dark)', fontWeight: 600 }}>
                          {incoming ? '+' : '−'} {fmtMoney(t.amountCents, t.currency)}
                        </td>
                        <td className="actions">
                          {incoming && t.status !== 'refunded' && (
                            <button type="button" className="btn btn-ghost btn-small"
                              style={{ fontSize: 11 }} onClick={() => refundOne(t.id)}>Refund</button>
                          )}
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
        <RecordModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); toast.success('Recorded.'); reload(); }}
        />
      )}
    </>
  );
}

function Kpi({ icon, label, value, tone }) {
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

function RecordModal({ onClose, onCreated }) {
  const ref = useRef(null);
  useFocusTrap(ref, true);
  useEscapeKey(onClose, true);
  const { toast } = useToast();

  const [direction, setDirection] = useState('outgoing');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 16));
  const [transactionRef, setTransactionRef] = useState('');
  const [category, setCategory] = useState('vendor_payment');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const [vendors, setVendors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [vendorId, setVendorId] = useState('');
  const [bookingId, setBookingId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    Promise.all([
      adminApi.listVendors({ status: 'active', size: 200, sortField: 'name', sortDir: 'asc' })
        .then((d) => Array.isArray(d?.items) ? d.items : [])
        .catch(() => []),
      adminApi.listBookings({ size: 100, sortField: 'eventDate', sortDir: 'desc' })
        .then((d) => Array.isArray(d?.items) ? d.items.filter((b) => b.status !== 'cancelled') : [])
        .catch(() => []),
    ]).then(([vs, bs]) => { setVendors(vs); setBookings(bs); });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const cents = Math.max(0, Math.round(Number(amount) * 100));
    if (cents === 0) { setErr('Enter an amount.'); return; }
    setSubmitting(true);
    setErr('');
    try {
      await adminApi.recordTransaction({
        direction,
        amountCents: cents,
        method,
        paidAt: new Date(paidAt).toISOString(),
        transactionRef: transactionRef.trim() || null,
        category: direction === 'outgoing' ? category : null,
        vendorId:  direction === 'outgoing' ? (vendorId || null) : null,
        bookingId: bookingId || null,
        description: description.trim() || null,
        notes: notes.trim() || null,
      });
      onCreated();
    } catch (error) {
      setErr(error?.message || 'Could not record.');
      toast.error(error?.message || 'Could not record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPortal>
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-content modal-md" ref={ref} role="dialog" aria-modal="true" aria-label="Record transaction">
          <div className="modal-header">
            <h2>Record transaction</h2>
            <button type="button" onClick={onClose} aria-label="Close" disabled={submitting}>
              <i className="fas fa-times" aria-hidden="true" />
            </button>
          </div>
          <form onSubmit={submit} noValidate>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {err && <div className="form-error" role="alert"><i className="fas fa-exclamation-circle" aria-hidden="true" /> {err}</div>}

              <div style={{ display: 'flex', gap: 6 }}>
                {DIRECTION_FILTERS.filter((f) => f.id !== 'all').map((f) => (
                  <button key={f.id} type="button" onClick={() => setDirection(f.id)}
                    className="btn btn-ghost"
                    style={{
                      flex: 1,
                      padding: '8px 14px',
                      fontSize: 13,
                      background: direction === f.id ? 'var(--color-primary)' : undefined,
                      color: direction === f.id ? '#fff' : undefined,
                      borderColor: direction === f.id ? 'var(--color-primary)' : undefined,
                    }}>
                    <i className={`fas fa-arrow-${f.id === 'incoming' ? 'down' : 'up'}`} aria-hidden="true" /> {f.label}
                  </button>
                ))}
              </div>

              <div className="form-row">
                <label className="form-group">
                  Amount <span className="req">*</span>
                  <input type="number" min="0" step="0.01" className="admin-input"
                    value={amount} onChange={(e) => setAmount(e.target.value)} disabled={submitting} />
                </label>
                <label className="form-group">
                  Method
                  <select className="admin-input" value={method} onChange={(e) => setMethod(e.target.value)} disabled={submitting}>
                    {METHODS.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                  </select>
                </label>
              </div>

              <div className="form-row">
                <label className="form-group">
                  Paid at
                  <input type="datetime-local" className="admin-input" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} disabled={submitting} />
                </label>
                <label className="form-group">
                  Transaction ref
                  <input className="admin-input" placeholder="UTR / cheque #" value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} disabled={submitting} />
                </label>
              </div>

              {direction === 'outgoing' && (
                <div className="form-row">
                  <label className="form-group">
                    Category <span className="req">*</span>
                    <select className="admin-input" value={category} onChange={(e) => setCategory(e.target.value)} disabled={submitting}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                    </select>
                  </label>
                  <label className="form-group">
                    Vendor (optional)
                    <select className="admin-input" value={vendorId} onChange={(e) => setVendorId(e.target.value)} disabled={submitting}>
                      <option value="">No vendor</option>
                      {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </label>
                </div>
              )}

              <label className="form-group">
                Booking (optional)
                <select className="admin-input" value={bookingId} onChange={(e) => setBookingId(e.target.value)} disabled={submitting}>
                  <option value="">Not linked to a booking</option>
                  {bookings.map((b) => <option key={b.id} value={b.id}>{b.reference} · {b.eventType}</option>)}
                </select>
              </label>

              <label className="form-group">
                Description
                <input className="admin-input" placeholder="Short summary"
                  value={description} onChange={(e) => setDescription(e.target.value)} disabled={submitting} />
              </label>

              <label className="form-group">
                Notes
                <textarea className="admin-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={submitting} />
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Recording…' : 'Record'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminPortal>
  );
}
