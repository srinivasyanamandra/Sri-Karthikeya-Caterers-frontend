/**
 * PurchaseOrderDetailPage — single PO with full line-item editor.
 *
 * Sections:
 *   ✦ Header — reference + status pill + status changer (DRAFT → ISSUED → … → PAID)
 *   ✦ Vendor + booking summary cards
 *   ✦ Line items — inline editable table; the service recomputes totals
 *     server-side, the UI shows live preview while editing
 *   ✦ Money summary — subtotal / tax / total / paid / outstanding
 *   ✦ Notes — internal + vendor-facing
 *
 * Status transition rules (mirrored from PurchaseOrderService):
 *   - PAID/CANCELLED are terminal (PAID can move only to CANCELLED)
 *   - Any status before PAID can move to CANCELLED
 *   - DRAFT can move to anything
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminPageHero from '../../components/admin/layout/AdminPageHero';
import { useToast } from './useToast';
import { admin as adminApi } from '../../services/api';

const STATUS_OPTIONS = [
  { id: 'draft',     label: 'Draft' },
  { id: 'issued',    label: 'Issued' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'partial',   label: 'Partial' },
  { id: 'received',  label: 'Received' },
  { id: 'paid',      label: 'Paid' },
  { id: 'cancelled', label: 'Cancelled' },
];

const STATUS_BADGE = {
  draft:     'pending',
  issued:    'contacted',
  confirmed: 'booked',
  partial:   'pending',
  received:  'approved',
  paid:      'approved',
  cancelled: 'declined',
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

export default function PurchaseOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const reload = useCallback(() => {
    setLoading(true);
    return adminApi.getPurchaseOrder(id)
      .then((data) => { setPo(data); setLoadError(''); })
      .catch((err) => setLoadError(err?.message || 'Could not load PO.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  const persistPatch = useCallback(async (patch, msg) => {
    try {
      const updated = await adminApi.updatePurchaseOrder(id, patch);
      setPo(updated);
      if (msg) toast.success(msg);
    } catch (err) {
      toast.error(err?.message || 'Update failed.');
    }
  }, [id, toast]);

  if (loading && !po) {
    return (
      <>
        <AdminPageHero
          eyebrow="Purchase order"
          icon="fa-file-invoice-dollar"
          title="Loading…"
          actions={<button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/purchase-orders')}>
            <i className="fas fa-arrow-left" aria-hidden="true" /> Back
          </button>}
        />
        <section className="section"><div className="container"><div className="admin-loading"><div className="admin-spinner" /></div></div></section>
      </>
    );
  }

  if (loadError || !po) {
    return (
      <>
        <AdminPageHero eyebrow="Purchase order" icon="fa-circle-exclamation" title="Could not load PO"
          actions={<button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/purchase-orders')}>
            <i className="fas fa-arrow-left" aria-hidden="true" /> Back
          </button>}
        />
        <section className="section"><div className="container">
          <div className="form-error" role="alert">
            <i className="fas fa-exclamation-circle" aria-hidden="true" /> {loadError || 'Not found.'}
            <button type="button" className="btn-link" style={{ marginLeft: 12 }} onClick={reload}>Retry</button>
          </div>
        </div></section>
      </>
    );
  }

  const outstandingCents = (po.totalCents || 0) - (po.paidCents || 0);

  return (
    <>
      <AdminPageHero
        eyebrow={po.reference}
        icon="fa-file-invoice-dollar"
        title={`${po.vendor.name}`}
        subtitle={
          <>
            <span className={`status-badge ${STATUS_BADGE[po.status] || 'pending'}`} style={{ marginRight: 8 }}>
              {po.status}
            </span>
            {fmtMoney(po.totalCents, po.currency)} total
            {outstandingCents > 0 && ` · ${fmtMoney(outstandingCents, po.currency)} outstanding`}
            {po.booking && ` · booking ${po.booking.reference}`}
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/purchase-orders')}>
              <i className="fas fa-arrow-left" aria-hidden="true" /> All POs
            </button>
            <StatusChanger
              current={po.status}
              onChange={(next) => persistPatch({ status: next }, `Status set to ${next}.`)}
            />
          </>
        }
      />

      <section className="section">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
            <DatesCard po={po} onPatch={persistPatch} />
            <LineItemsCard po={po} onPatch={persistPatch} toast={toast} />
            <NotesCard po={po} onPatch={persistPatch} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
            <VendorSnapshotCard vendor={po.vendor} navigate={navigate} />
            {po.booking && <BookingSnapshotCard booking={po.booking} navigate={navigate} />}
            <FinanceCard po={po} outstandingCents={outstandingCents} onPatch={persistPatch} toast={toast} reload={reload} />
          </div>
        </div>
      </section>
    </>
  );
}

/* ─── Status changer ─────────────────────────────────────── */

function StatusChanger({ current, onChange }) {
  return (
    <select className="admin-input" value={current} onChange={(e) => onChange(e.target.value)} aria-label="Change PO status" style={{ width: 160 }}>
      {STATUS_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
    </select>
  );
}

/* ─── Dates ─────────────────────────────────────────────── */

function DatesCard({ po, onPatch }) {
  const [editing, setEditing] = useState(false);
  const [issue, setIssue] = useState(po.issueDate || '');
  const [expected, setExpected] = useState(po.expectedDelivery || '');
  useEffect(() => { setIssue(po.issueDate || ''); setExpected(po.expectedDelivery || ''); }, [po]);

  const submit = async (e) => {
    e.preventDefault();
    await onPatch({ issueDate: issue || null, expectedDelivery: expected || null }, 'Dates saved.');
    setEditing(false);
  };

  return (
    <Card title="Schedule" icon="fa-calendar-day"
      action={editing ? (
        <button type="button" className="btn btn-ghost btn-small" onClick={() => setEditing(false)}>Cancel</button>
      ) : (
        <button type="button" className="btn btn-ghost btn-small" onClick={() => setEditing(true)}>
          <i className="fas fa-pen" aria-hidden="true" /> Edit
        </button>
      )}
    >
      {!editing ? (
        <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, margin: 0 }}>
          <Field label="Issued"   value={fmtDate(po.issueDate)} />
          <Field label="Expected" value={fmtDate(po.expectedDelivery)} />
          <Field label="Received" value={po.receivedAt ? new Date(po.receivedAt).toLocaleString('en-IN') : '—'} />
        </dl>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
          <label className="form-group">Issue date<input type="date" className="admin-input" value={issue} onChange={(e) => setIssue(e.target.value)} /></label>
          <label className="form-group">Expected delivery<input type="date" className="admin-input" value={expected} onChange={(e) => setExpected(e.target.value)} /></label>
          <button type="submit" className="btn btn-primary btn-small">Save</button>
        </form>
      )}
    </Card>
  );
}

/* ─── Line items ───────────────────────────────────────── */

function LineItemsCard({ po, onPatch, toast }) {
  /* Editor state mirrors the canonical line set, but the price column is
   * carried as a rupee string (`unitPriceRupees`) instead of integer cents
   * so admins type "25" or "1499.50" rather than the raw paise value. The
   * conversion happens once at save-time so we can show a live line total
   * without rounding drift while the user is mid-edit. */
  const toEditor = useCallback((items) =>
    (items || []).map((l) => ({
      ...l,
      unitPriceRupees: ((Number(l.unitPriceCents) || 0) / 100).toFixed(2),
    })), []);

  const [lines, setLines] = useState(() => toEditor(po.items || []));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLines(toEditor(po.items || []));
    setDirty(false);
  }, [po.items, toEditor]);

  const update = (i, patch) => {
    setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l));
    setDirty(true);
  };
  const addLine = () => {
    setLines((prev) => [...prev, {
      id: undefined,
      description: '',
      quantity: 1,
      unit: 'each',
      unitPriceCents: 0,
      unitPriceRupees: '0.00',
      lineTotalCents: 0,
      position: prev.length,
    }]);
    setDirty(true);
  };
  const removeLine = (i) => {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
    setDirty(true);
  };

  const previewTotal = useMemo(() => {
    return lines.reduce((s, l) => {
      const q = Number(l.quantity) || 0;
      const cents = Math.round((Number(l.unitPriceRupees) || 0) * 100);
      return s + Math.round(q * cents);
    }, 0);
  }, [lines]);

  const save = async () => {
    setSaving(true);
    try {
      await onPatch({
        items: lines
          .filter((l) => (l.description || '').trim())
          .map((l, i) => ({
            id: l.id,
            description: l.description.trim(),
            quantity: l.quantity != null ? l.quantity.toString() : '0',
            unit: l.unit || 'each',
            unitPriceCents: Math.max(0, Math.round((Number(l.unitPriceRupees) || 0) * 100)),
            position: i,
          })),
      }, 'Line items saved.');
    } catch (err) {
      toast.error(err?.message || 'Could not save lines.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title={`Line items · ${lines.length}`}
      icon="fa-list"
      action={
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="btn btn-ghost btn-small" onClick={addLine}>
            <i className="fas fa-plus" aria-hidden="true" /> Add line
          </button>
          {dirty && (
            <button type="button" className="btn btn-primary btn-small" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          )}
        </div>
      }
    >
      {lines.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No line items yet. Click "Add line" to build the PO.</p>
      ) : (
        <table className="admin-table" style={{ marginTop: 0 }}>
          <thead>
            <tr>
              <th>Description</th>
              <th style={{ width: 110 }}>Qty</th>
              <th style={{ width: 100 }}>Unit</th>
              <th style={{ width: 130 }}>Unit price</th>
              <th style={{ width: 130, textAlign: 'right' }}>Line total</th>
              <th style={{ width: 40 }} />
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => {
              const cents = Math.round((Number(l.unitPriceRupees) || 0) * 100);
              const lineTotal = Math.round((Number(l.quantity) || 0) * cents);
              return (
                <tr key={l.id || `new-${i}`}>
                  <td>
                    <input className="admin-input" value={l.description || ''} onChange={(e) => update(i, { description: e.target.value })} />
                  </td>
                  <td>
                    <input className="admin-input" type="number" min="0" step="0.001" value={l.quantity ?? ''} onChange={(e) => update(i, { quantity: e.target.value })} />
                  </td>
                  <td>
                    <input className="admin-input" value={l.unit || 'each'} onChange={(e) => update(i, { unit: e.target.value })} />
                  </td>
                  <td>
                    <input
                      className="admin-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.unitPriceRupees ?? '0.00'}
                      onChange={(e) => update(i, { unitPriceRupees: e.target.value })}
                      title={`Price in ${po.currency || 'INR'} (e.g. 25 or 1499.50)`}
                    />
                  </td>
                  <td style={{ textAlign: 'right' }} className="admin-cell-strong">{fmtMoney(lineTotal, po.currency)}</td>
                  <td>
                    <button type="button" className="btn btn-ghost btn-small" onClick={() => removeLine(i)} aria-label="Remove">
                      <i className="fas fa-times" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>Subtotal preview</td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmtMoney(previewTotal, po.currency)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      )}
      {dirty && (
        <p style={{ marginTop: 12, color: 'var(--color-accent-dark)', fontSize: 13 }}>
          <i className="fas fa-pen" aria-hidden="true" /> Unsaved changes — click "Save changes" to commit.
        </p>
      )}
    </Card>
  );
}

/* ─── Notes ─────────────────────────────────────────── */

function NotesCard({ po, onPatch }) {
  const [internal, setInternal] = useState(po.internalNotes || '');
  const [vendor, setVendor] = useState(po.vendorNotes || '');
  useEffect(() => {
    setInternal(po.internalNotes || '');
    setVendor(po.vendorNotes || '');
  }, [po.internalNotes, po.vendorNotes]);

  const dirty = internal !== (po.internalNotes || '') || vendor !== (po.vendorNotes || '');

  return (
    <Card title="Notes" icon="fa-note-sticky"
      action={dirty && (
        <button type="button" className="btn btn-primary btn-small" onClick={() => onPatch({ internalNotes: internal, vendorNotes: vendor }, 'Notes saved.')}>
          Save
        </button>
      )}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <label className="form-group">
          Internal <span className="admin-cell-sub">(team-only)</span>
          <textarea className="admin-input" rows={4} value={internal} onChange={(e) => setInternal(e.target.value)} />
        </label>
        <label className="form-group">
          Vendor-facing
          <textarea className="admin-input" rows={4} value={vendor} onChange={(e) => setVendor(e.target.value)} />
        </label>
      </div>
    </Card>
  );
}

/* ─── Vendor snapshot ─────────────────────────────── */

function VendorSnapshotCard({ vendor, navigate }) {
  return (
    <Card title="Vendor" icon="fa-store"
      action={
        <button type="button" className="btn btn-ghost btn-small" onClick={() => navigate(`/admin/vendors/${vendor.id}`)}>
          Open <i className="fas fa-arrow-right" aria-hidden="true" />
        </button>
      }
    >
      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-primary)' }}>{vendor.name}</div>
      <div className="admin-cell-sub" style={{ textTransform: 'capitalize' }}>{(vendor.category || '').replace('_', ' ')} · {vendor.paymentTerms.replace('_', ' ')}</div>
      <ul className="admin-info-list" style={{ marginTop: 8 }}>
        {vendor.primaryContactName  && <li><i className="fas fa-user"     aria-hidden="true" /> {vendor.primaryContactName}</li>}
        {vendor.primaryContactPhone && <li><i className="fas fa-phone"    aria-hidden="true" /> <a href={`tel:${vendor.primaryContactPhone}`} style={{ color: 'inherit' }}>{vendor.primaryContactPhone}</a></li>}
        {vendor.primaryContactEmail && <li><i className="fas fa-envelope" aria-hidden="true" /> <a href={`mailto:${vendor.primaryContactEmail}`} style={{ color: 'inherit' }}>{vendor.primaryContactEmail}</a></li>}
      </ul>
    </Card>
  );
}

/* ─── Booking snapshot ─────────────────────────────── */

function BookingSnapshotCard({ booking, navigate }) {
  return (
    <Card title="Linked booking" icon="fa-calendar-check"
      action={
        <button type="button" className="btn btn-ghost btn-small" onClick={() => navigate(`/admin/bookings/${booking.id}`)}>
          Open <i className="fas fa-arrow-right" aria-hidden="true" />
        </button>
      }
    >
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>{booking.reference}</div>
      <div className="admin-cell-sub">{booking.eventType} · {fmtDate(booking.eventDate)}</div>
    </Card>
  );
}

/* ─── Finance ─────────────────────────────── */

function FinanceCard({ po, outstandingCents, onPatch, toast, reload }) {
  const [editingTax, setEditingTax] = useState(false);
  const [taxRupees, setTaxRupees] = useState(((po.taxCents || 0) / 100).toFixed(2));
  const [paymentRupees, setPaymentRupees] = useState('');

  useEffect(() => { setTaxRupees(((po.taxCents || 0) / 100).toFixed(2)); }, [po.taxCents]);

  const saveTax = async () => {
    const cents = Math.max(0, Math.round(Number(taxRupees) * 100));
    if (cents === po.taxCents) { setEditingTax(false); return; }
    await onPatch({ taxCents: cents }, 'Tax updated.');
    setEditingTax(false);
  };

  const recordPayment = async () => {
    const cents = Math.max(0, Math.round(Number(paymentRupees) * 100));
    if (cents === 0) return;
    try {
      await adminApi.recordPoPayment(po.id, cents);
      toast.success('Payment recorded.');
      setPaymentRupees('');
      reload();
    } catch (err) {
      toast.error(err?.message || 'Could not record payment.');
    }
  };

  return (
    <Card title="Finance" icon="fa-coins">
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Row label="Subtotal"  value={fmtMoney(po.subtotalCents, po.currency)} />
        <Row
          label={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Tax
              {!editingTax && (
                <button type="button" className="btn btn-ghost btn-small" style={{ padding: '0 6px', fontSize: 11 }} onClick={() => setEditingTax(true)}>edit</button>
              )}
            </span>
          }
          value={
            editingTax ? (
              <span style={{ display: 'inline-flex', gap: 4 }}>
                <input className="admin-input" type="number" min="0" step="0.01" value={taxRupees} onChange={(e) => setTaxRupees(e.target.value)} style={{ width: 90 }} />
                <button type="button" className="btn btn-primary btn-small" onClick={saveTax}>OK</button>
              </span>
            ) : fmtMoney(po.taxCents, po.currency)
          }
        />
        <Row label="Total" value={fmtMoney(po.totalCents, po.currency)} accent />
        <Row label="Paid"  value={fmtMoney(po.paidCents,  po.currency)} accent />
        <Row label="Outstanding" value={fmtMoney(outstandingCents, po.currency)} accent tone={outstandingCents > 0 ? 'warning' : 'success'} />
      </ul>

      {outstandingCents > 0 && po.status !== 'cancelled' && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--color-border-light)' }}>
          <div className="admin-cell-sub" style={{ marginBottom: 6 }}>Record payment</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              className="admin-input"
              type="number"
              min="0"
              step="0.01"
              placeholder={(((po.paidCents || 0) + outstandingCents) / 100).toFixed(2)}
              value={paymentRupees}
              onChange={(e) => setPaymentRupees(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={recordPayment}
              disabled={!paymentRupees || Number(paymentRupees) <= 0}
            >
              Record
            </button>
          </div>
          <p className="admin-cell-sub" style={{ marginTop: 6, fontSize: 11 }}>
            Sets total paid to this amount. Updating to the full total auto-marks the PO as paid.
          </p>
        </div>
      )}
    </Card>
  );
}

function Row({ label, value, accent, tone }) {
  const color = tone === 'warning' ? 'var(--color-accent-dark)'
              : tone === 'success' ? 'var(--color-success)'
              : 'var(--color-primary)';
  return (
    <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: accent ? 600 : 500, color: accent ? color : 'var(--text-primary)' }}>{value}</span>
    </li>
  );
}

/* ─── Primitives ─────────────────────────────── */

function Card({ title, icon, action, children }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--color-border-light)',
      borderRadius: 14,
      padding: '20px 22px',
      boxShadow: '0 1px 0 rgba(20,58,38,0.02)',
    }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{
          margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.05rem',
          color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: 10,
        }}>
          <i className={`fas ${icon}`} aria-hidden="true" style={{ color: 'var(--color-accent-dark)' }} />
          {title}
        </h2>
        {action}
      </header>
      {children}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <dt style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-light)', fontWeight: 600 }}>{label}</dt>
      <dd style={{ margin: '4px 0 0', color: 'var(--text-primary)' }}>{value ?? '—'}</dd>
    </div>
  );
}
