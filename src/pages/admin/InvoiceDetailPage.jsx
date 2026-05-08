/**
 * InvoiceDetailPage — full invoice view with line-item editor and
 * payment recorder.
 *
 * Sections:
 *   ✦ Header        — reference, status pill, status changer (issue / void)
 *   ✦ Bill-to       — client + booking snapshot
 *   ✦ Line items    — inline editable; service recomputes totals on save
 *   ✦ Money summary — subtotal / tax / discount / total / paid / outstanding
 *   ✦ Payments      — list of incoming transactions tagged to this invoice
 *                     + "Record payment" form
 *   ✦ Notes / Terms — editable text blocks
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminPageHero from '../../components/admin/layout/AdminPageHero';
import { useToast } from './useToast';
import { admin as adminApi } from '../../services/api';

const STATUS_BADGE = {
  draft:          'pending',
  issued:         'contacted',
  partially_paid: 'pending',
  paid:           'approved',
  overdue:        'declined',
  void:           'declined',
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

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const reload = useCallback(() => {
    setLoading(true);
    return adminApi.getInvoice(id)
      .then((data) => { setInvoice(data); setLoadError(''); })
      .catch((err) => setLoadError(err?.message || 'Could not load invoice.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  const persistPatch = useCallback(async (patch, msg) => {
    try {
      const updated = await adminApi.updateInvoice(id, patch);
      setInvoice(updated);
      if (msg) toast.success(msg);
    } catch (err) {
      toast.error(err?.message || 'Update failed.');
    }
  }, [id, toast]);

  if (loading && !invoice) {
    return (
      <>
        <AdminPageHero
          eyebrow="Invoice"
          icon="fa-file-invoice"
          title="Loading…"
          actions={<button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/invoices')}>
            <i className="fas fa-arrow-left" aria-hidden="true" /> Back
          </button>}
        />
        <section className="section"><div className="container"><div className="admin-loading"><div className="admin-spinner" /></div></div></section>
      </>
    );
  }

  if (loadError || !invoice) {
    return (
      <>
        <AdminPageHero eyebrow="Invoice" icon="fa-circle-exclamation" title="Could not load invoice"
          actions={<button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/invoices')}>
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

  const outstandingCents = (invoice.totalCents || 0) - (invoice.paidCents || 0);

  const issue = async () => {
    try {
      const updated = await adminApi.issueInvoice(id);
      setInvoice(updated);
      toast.success('Invoice issued.');
    } catch (err) { toast.error(err?.message || 'Could not issue invoice.'); }
  };

  const voidIt = async () => {
    if (!window.confirm('Void this invoice? This cannot be undone.')) return;
    try {
      const updated = await adminApi.voidInvoice(id);
      setInvoice(updated);
      toast.success('Invoice voided.');
    } catch (err) { toast.error(err?.message || 'Could not void invoice.'); }
  };

  return (
    <>
      <AdminPageHero
        eyebrow={invoice.reference}
        icon="fa-file-invoice"
        title={invoice.client.name}
        subtitle={
          <>
            <span className={`status-badge ${STATUS_BADGE[invoice.status] || 'pending'}`} style={{ marginRight: 8 }}>
              {invoice.status.replace('_', ' ')}
            </span>
            {fmtMoney(invoice.totalCents, invoice.currency)} total
            {outstandingCents > 0 && ` · ${fmtMoney(outstandingCents, invoice.currency)} outstanding`}
            {' · booking '}{invoice.booking.reference}
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/invoices')}>
              <i className="fas fa-arrow-left" aria-hidden="true" /> All invoices
            </button>
            {invoice.status === 'draft' && (
              <button type="button" className="btn btn-primary" onClick={issue}>
                <i className="fas fa-paper-plane" aria-hidden="true" /> Mark issued
              </button>
            )}
            {invoice.status !== 'void' && invoice.status !== 'paid' && (
              <button type="button" className="btn btn-ghost" onClick={voidIt}>
                <i className="fas fa-ban" aria-hidden="true" /> Void
              </button>
            )}
          </>
        }
      />

      <section className="section">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
            <DatesCard inv={invoice} onPatch={persistPatch} />
            <LineItemsCard inv={invoice} onPatch={persistPatch} toast={toast} />
            <NotesCard inv={invoice} onPatch={persistPatch} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
            <BillToCard invoice={invoice} navigate={navigate} />
            <FinanceCard inv={invoice} outstandingCents={outstandingCents} onPatch={persistPatch} />
            <PaymentsCard inv={invoice} reload={reload} toast={toast} />
          </div>
        </div>
      </section>
    </>
  );
}

/* ─── Dates ─────────────────────────────────────────────── */

function DatesCard({ inv, onPatch }) {
  const [editing, setEditing] = useState(false);
  const [issue, setIssue] = useState(inv.issueDate || '');
  const [due, setDue] = useState(inv.dueDate || '');
  useEffect(() => { setIssue(inv.issueDate || ''); setDue(inv.dueDate || ''); }, [inv]);

  const submit = async (e) => {
    e.preventDefault();
    await onPatch({ issueDate: issue || null, dueDate: due || null }, 'Dates saved.');
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
          <Field label="Issued" value={fmtDate(inv.issueDate)} />
          <Field label="Due"    value={fmtDate(inv.dueDate)} />
          <Field label="Sent"   value={inv.sentAt ? new Date(inv.sentAt).toLocaleString('en-IN') : '—'} />
        </dl>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
          <label className="form-group">Issue date<input type="date" className="admin-input" value={issue} onChange={(e) => setIssue(e.target.value)} /></label>
          <label className="form-group">Due date<input type="date" className="admin-input" value={due} onChange={(e) => setDue(e.target.value)} /></label>
          <button type="submit" className="btn btn-primary btn-small">Save</button>
        </form>
      )}
    </Card>
  );
}

/* ─── Line items ───────────────────────────────────────── */

function LineItemsCard({ inv, onPatch, toast }) {
  /* Editor carries unitPrice as rupees for friendly entry, converts to
   * cents at save-time. The service recomputes line totals. */
  const toEditor = useCallback((items) =>
    (items || []).map((l) => ({
      ...l,
      unitPriceRupees: ((Number(l.unitPriceCents) || 0) / 100).toFixed(2),
    })), []);

  const [lines, setLines] = useState(() => toEditor(inv.items || []));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLines(toEditor(inv.items || []));
    setDirty(false);
  }, [inv.items, toEditor]);

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

  const previewSubtotal = useMemo(() => {
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

  const editable = inv.status === 'draft';

  return (
    <Card
      title={`Line items · ${lines.length}`}
      icon="fa-list"
      action={
        editable ? (
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
        ) : null
      }
    >
      {lines.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          {editable ? 'No line items. Click "Add line" to build the invoice.' : 'No line items.'}
        </p>
      ) : (
        <table className="admin-table" style={{ marginTop: 0 }}>
          <thead>
            <tr>
              <th>Description</th>
              <th style={{ width: 110 }}>Qty</th>
              <th style={{ width: 100 }}>Unit</th>
              <th style={{ width: 130 }}>Unit price</th>
              <th style={{ width: 130, textAlign: 'right' }}>Line total</th>
              {editable && <th style={{ width: 40 }} />}
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => {
              const cents = Math.round((Number(l.unitPriceRupees) || 0) * 100);
              const lineTotal = Math.round((Number(l.quantity) || 0) * cents);
              return (
                <tr key={l.id || `new-${i}`}>
                  <td>
                    {editable
                      ? <input className="admin-input" value={l.description || ''} onChange={(e) => update(i, { description: e.target.value })} />
                      : <span>{l.description}</span>}
                  </td>
                  <td>
                    {editable
                      ? <input className="admin-input" type="number" min="0" step="0.001" value={l.quantity ?? ''} onChange={(e) => update(i, { quantity: e.target.value })} />
                      : <span>{l.quantity}</span>}
                  </td>
                  <td>
                    {editable
                      ? <input className="admin-input" value={l.unit || 'each'} onChange={(e) => update(i, { unit: e.target.value })} />
                      : <span>{l.unit}</span>}
                  </td>
                  <td>
                    {editable
                      ? <input className="admin-input" type="number" min="0" step="0.01" value={l.unitPriceRupees ?? '0.00'} onChange={(e) => update(i, { unitPriceRupees: e.target.value })} />
                      : <span>{fmtMoney(l.unitPriceCents, inv.currency)}</span>}
                  </td>
                  <td style={{ textAlign: 'right' }} className="admin-cell-strong">{fmtMoney(lineTotal, inv.currency)}</td>
                  {editable && (
                    <td>
                      <button type="button" className="btn btn-ghost btn-small" onClick={() => removeLine(i)} aria-label="Remove">
                        <i className="fas fa-times" aria-hidden="true" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          {editable && dirty && (
            <tfoot>
              <tr>
                <td colSpan={4} style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>Subtotal preview</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmtMoney(previewSubtotal, inv.currency)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      )}
      {editable && dirty && (
        <p style={{ marginTop: 12, color: 'var(--color-accent-dark)', fontSize: 13 }}>
          <i className="fas fa-pen" aria-hidden="true" /> Unsaved changes — click "Save changes" to commit.
        </p>
      )}
      {!editable && (
        <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
          <i className="fas fa-lock" aria-hidden="true" /> Line items are locked once the invoice is issued.
        </p>
      )}
    </Card>
  );
}

/* ─── Notes / Terms ─────────────────────────────────────── */

function NotesCard({ inv, onPatch }) {
  const [terms, setTerms] = useState(inv.terms || '');
  const [notes, setNotes] = useState(inv.notes || '');
  useEffect(() => { setTerms(inv.terms || ''); setNotes(inv.notes || ''); }, [inv.terms, inv.notes]);

  const dirty = terms !== (inv.terms || '') || notes !== (inv.notes || '');

  return (
    <Card title="Terms & notes" icon="fa-note-sticky"
      action={dirty && (
        <button type="button" className="btn btn-primary btn-small"
          onClick={() => onPatch({ terms, notes }, 'Saved.')}>Save</button>
      )}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <label className="form-group">
          Terms <span className="admin-cell-sub">(payment terms, contract notes)</span>
          <textarea className="admin-input" rows={4} value={terms} onChange={(e) => setTerms(e.target.value)} />
        </label>
        <label className="form-group">
          Internal notes
          <textarea className="admin-input" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>
    </Card>
  );
}

/* ─── Bill to ───────────────────────────────────────────── */

function BillToCard({ invoice, navigate }) {
  const c = invoice.client;
  const b = invoice.booking;
  return (
    <Card title="Bill to" icon="fa-user">
      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-primary)' }}>{c.name}</div>
      {c.companyName && <div className="admin-cell-sub">{c.companyName}</div>}
      <ul className="admin-info-list" style={{ marginTop: 8 }}>
        {c.email && <li><i className="fas fa-envelope" aria-hidden="true" /> {c.email}</li>}
        {c.phone && <li><i className="fas fa-phone"    aria-hidden="true" /> {c.phone}</li>}
      </ul>
      <button type="button" className="btn btn-ghost btn-small" style={{ marginTop: 8 }}
        onClick={() => navigate(`/admin/bookings/${b.id}`)}>
        Open booking {b.reference} <i className="fas fa-arrow-right" aria-hidden="true" />
      </button>
    </Card>
  );
}

/* ─── Finance summary ───────────────────────────────────── */

function FinanceCard({ inv, outstandingCents, onPatch }) {
  const [editing, setEditing] = useState(false);
  const [taxR, setTaxR]           = useState(((inv.taxCents      || 0) / 100).toFixed(2));
  const [discountR, setDiscountR] = useState(((inv.discountCents || 0) / 100).toFixed(2));

  useEffect(() => {
    setTaxR(((inv.taxCents || 0) / 100).toFixed(2));
    setDiscountR(((inv.discountCents || 0) / 100).toFixed(2));
  }, [inv.taxCents, inv.discountCents]);

  const submit = async (e) => {
    e.preventDefault();
    await onPatch({
      taxCents:      Math.max(0, Math.round(Number(taxR) * 100)),
      discountCents: Math.max(0, Math.round(Number(discountR) * 100)),
    }, 'Tax & discount saved.');
    setEditing(false);
  };

  return (
    <Card title="Finance" icon="fa-coins"
      action={
        inv.status === 'draft' && (
          editing ? (
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setEditing(false)}>Cancel</button>
          ) : (
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setEditing(true)}>
              <i className="fas fa-pen" aria-hidden="true" /> Edit
            </button>
          )
        )
      }
    >
      {editing ? (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="form-row">
            <label className="form-group">Tax<input type="number" min="0" step="0.01" className="admin-input" value={taxR} onChange={(e) => setTaxR(e.target.value)} /></label>
            <label className="form-group">Discount<input type="number" min="0" step="0.01" className="admin-input" value={discountR} onChange={(e) => setDiscountR(e.target.value)} /></label>
          </div>
          <button type="submit" className="btn btn-primary btn-small" style={{ alignSelf: 'flex-end' }}>Save</button>
        </form>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Row label="Subtotal" value={fmtMoney(inv.subtotalCents, inv.currency)} />
          <Row label="Tax"      value={fmtMoney(inv.taxCents,      inv.currency)} />
          <Row label="Discount" value={fmtMoney(inv.discountCents, inv.currency)} />
          <Row label="Total"    value={fmtMoney(inv.totalCents,    inv.currency)} accent />
          <Row label="Paid"     value={fmtMoney(inv.paidCents,     inv.currency)} accent tone="success" />
          <Row label="Outstanding"
               value={fmtMoney(outstandingCents, inv.currency)}
               accent
               tone={outstandingCents > 0 ? 'warning' : 'success'} />
        </ul>
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

/* ─── Payments ──────────────────────────────────────────── */

function PaymentsCard({ inv, reload, toast }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('upi');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 16));
  const [transactionRef, setTransactionRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const outstanding = (inv.totalCents || 0) - (inv.paidCents || 0);

  const record = async (e) => {
    e.preventDefault();
    const cents = Math.max(0, Math.round(Number(amount) * 100));
    if (cents === 0) return;
    setSubmitting(true);
    try {
      await adminApi.recordTransaction({
        direction: 'incoming',
        amountCents: cents,
        method,
        paidAt: new Date(paidAt).toISOString(),
        transactionRef: transactionRef.trim() || null,
        invoiceId: inv.id,
        bookingId: inv.booking.id,
        clientId:  inv.client.id,
      });
      toast.success('Payment recorded.');
      setAmount('');
      setTransactionRef('');
      setOpen(false);
      reload();
    } catch (err) {
      toast.error(err?.message || 'Could not record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const refundOne = async (p) => {
    if (!window.confirm(`Refund ${p.reference}?`)) return;
    try {
      await adminApi.refundTransaction(p.id, 'Refund issued from invoice screen');
      toast.success('Payment refunded.');
      reload();
    } catch (err) {
      toast.error(err?.message || 'Could not refund.');
    }
  };

  return (
    <Card title={`Payments · ${inv.payments?.length || 0}`} icon="fa-receipt"
      action={
        outstanding > 0 && inv.status !== 'void' && !open && (
          <button type="button" className="btn btn-primary btn-small" onClick={() => setOpen(true)}>
            <i className="fas fa-plus" aria-hidden="true" /> Record payment
          </button>
        )
      }
    >
      {open && (
        <form onSubmit={record} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          <div className="form-row">
            <label className="form-group">
              Amount
              <input type="number" min="0" step="0.01" className="admin-input"
                placeholder={(outstanding / 100).toFixed(2)} value={amount}
                onChange={(e) => setAmount(e.target.value)} />
            </label>
            <label className="form-group">
              Method
              <select className="admin-input" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="cheque">Cheque</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>
          <div className="form-row">
            <label className="form-group">
              Paid at
              <input type="datetime-local" className="admin-input" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
            </label>
            <label className="form-group">
              Transaction ref
              <input className="admin-input" placeholder="UTR / cheque #"
                value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setOpen(false)} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-small" disabled={submitting || !amount}>
              {submitting ? 'Recording…' : 'Record payment'}
            </button>
          </div>
        </form>
      )}

      {(!inv.payments || inv.payments.length === 0) ? (
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          No payments yet.
          {outstanding > 0 && inv.status !== 'void' && ' Use the button above to record one when the client pays.'}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {inv.payments.map((p) => (
            <li key={p.id} style={{
              padding: 10, borderRadius: 10, border: '1px solid var(--color-border-light)',
              opacity: p.status === 'refunded' ? 0.6 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>{p.reference}</strong>
                <span className={`status-badge ${p.status === 'refunded' ? 'declined' : 'approved'}`}>{p.status}</span>
                <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{fmtMoney(p.amountCents, p.currency)}</span>
              </div>
              <div className="admin-cell-sub" style={{ marginTop: 4, display: 'flex', gap: 12 }}>
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p.method.replace('_', ' ')}</span>
                {p.paidAt && <span>{new Date(p.paidAt).toLocaleString('en-IN')}</span>}
                {p.transactionRef && <span>· {p.transactionRef}</span>}
              </div>
              {p.status !== 'refunded' && (
                <button type="button" className="btn btn-ghost btn-small" style={{ marginTop: 6, fontSize: 11 }} onClick={() => refundOne(p)}>
                  Refund
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ─── Primitives ───────────────────────────────────────── */

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
