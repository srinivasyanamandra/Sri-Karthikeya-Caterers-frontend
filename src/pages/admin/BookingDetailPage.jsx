/**
 * BookingDetailPage — premium operational view for a single booking.
 *
 * Owns every mutation for one booking so the audit trail (system_logs +
 * BookingService) stays attached to one screen rather than fanning out
 * across modals on the list page.
 *
 * Sections:
 *   ✦ Header (reference + status pill + status changer)
 *   ✦ Event details (inline-edit grid)
 *   ✦ Client snapshot (name, email, phone — link to client profile)
 *   ✦ Finance summary (total / deposit / paid / balance)
 *   ✦ Checklist (booking_tasks: add, toggle, edit, delete)
 *   ✦ Notes (internal + client-facing textareas)
 *
 * Conventions:
 *   - Money is stored as cents on the wire; the UI converts on edit/display
 *   - Status changes go through the same /update endpoint; the system log
 *     records the from→to transition
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminPageHero from '../../components/admin/layout/AdminPageHero';
import { useToast } from './useToast';
import { admin as adminApi } from '../../services/api';

const STATUS_OPTIONS = [
  { id: 'confirmed',   label: 'Confirmed' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed',   label: 'Completed' },
  { id: 'postponed',   label: 'Postponed' },
  { id: 'cancelled',   label: 'Cancelled' },
];

const STATUS_BADGE_CLS = {
  confirmed: 'booked',
  in_progress: 'contacted',
  completed: 'approved',
  postponed: 'pending',
  cancelled: 'declined',
};

const fmtDate = (s) =>
  s ? new Date(s).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';

const fmtMoney = (cents, currency = 'INR') => {
  if (cents == null) return '—';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toLocaleString('en-IN')}`;
  }
};

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const reload = useCallback(() => {
    setLoading(true);
    return adminApi
      .getBooking(id)
      .then((data) => {
        setBooking(data);
        setLoadError('');
      })
      .catch((err) => setLoadError(err?.message || 'Could not load booking.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  const persistPatch = useCallback(
    async (patch, successMsg) => {
      try {
        const updated = await adminApi.updateBooking(id, patch);
        setBooking(updated);
        if (successMsg) toast.success(successMsg);
      } catch (err) {
        toast.error(err?.message || 'Update failed.');
      }
    },
    [id, toast]
  );

  if (loading && !booking) {
    return (
      <>
        <AdminPageHero
          eyebrow="Booking"
          icon="fa-calendar-check"
          title="Loading…"
          actions={
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/bookings')}>
              <i className="fas fa-arrow-left" aria-hidden="true" /> Back
            </button>
          }
        />
        <section className="section">
          <div className="container">
            <div className="admin-loading"><div className="admin-spinner" /></div>
          </div>
        </section>
      </>
    );
  }

  if (loadError || !booking) {
    return (
      <>
        <AdminPageHero
          eyebrow="Booking"
          icon="fa-circle-exclamation"
          title="Could not load this booking"
          actions={
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/bookings')}>
              <i className="fas fa-arrow-left" aria-hidden="true" /> Back
            </button>
          }
        />
        <section className="section">
          <div className="container">
            <div className="form-error" role="alert">
              <i className="fas fa-exclamation-circle" aria-hidden="true" /> {loadError || 'Not found.'}
              <button type="button" className="btn-link" style={{ marginLeft: 12 }} onClick={reload}>
                Retry
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }

  const balanceCents =
    (booking.totalAmountCents || 0) - (booking.paidAmountCents || 0);

  return (
    <>
      <AdminPageHero
        eyebrow={booking.reference}
        icon="fa-calendar-check"
        title={`${booking.eventType} · ${fmtDate(booking.eventDate)}`}
        subtitle={`${booking.guestCount} guests${booking.venueName ? ` · ${booking.venueName}` : ''}`}
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/bookings')}>
              <i className="fas fa-arrow-left" aria-hidden="true" /> All bookings
            </button>
            <StatusChanger
              current={booking.status}
              onChange={(next) =>
                persistPatch({ status: next }, `Status changed to ${next.replace('_', ' ')}.`)
              }
            />
          </>
        }
      />

      <section className="section">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
            <EventDetailsCard booking={booking} onPatch={persistPatch} />
            <ChecklistCard
              tasks={booking.tasks || []}
              bookingId={booking.id}
              onChanged={reload}
              toast={toast}
            />
            <PurchaseOrdersCard
              bookingId={booking.id}
              pos={booking.purchaseOrders || []}
              navigate={navigate}
            />
            <InvoicesCard
              bookingId={booking.id}
              invoices={booking.finance?.invoices || []}
              currency={booking.currency}
              navigate={navigate}
            />
            <NotesCard booking={booking} onPatch={persistPatch} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
            <ClientSnapshotCard client={booking.client} navigate={navigate} />
            <FinanceCard
              booking={booking}
              balanceCents={balanceCents}
              onPatch={persistPatch}
            />
            <PnlCard
              finance={booking.finance}
              currency={booking.currency}
            />
          </div>
        </div>
      </section>
    </>
  );
}

/* ─────────────────────────────────────────── status changer (inline select) ── */

function StatusChanger({ current, onChange }) {
  return (
    <label className="admin-field" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, margin: 0 }}>
      <span
        className={`status-badge ${STATUS_BADGE_CLS[current] || 'booked'}`}
        style={{ marginRight: 4 }}
      >
        {current.replace('_', ' ')}
      </span>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="admin-input"
        style={{ width: 170 }}
        aria-label="Change booking status"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
    </label>
  );
}

/* ─────────────────────────────────────────── event details (inline edit) ──── */

function EventDetailsCard({ booking, onPatch }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(toEventForm(booking));

  useEffect(() => { setForm(toEventForm(booking)); }, [booking]);

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const patch = {};
    if (form.eventType !== (booking.eventType || '')) patch.eventType = form.eventType;
    if (form.eventDate !== (booking.eventDate || '')) patch.eventDate = form.eventDate;
    if ((form.eventStartTime || '') !== (booking.eventStartTime || '')) patch.eventStartTime = form.eventStartTime || null;
    if ((form.eventEndTime || '')   !== (booking.eventEndTime   || '')) patch.eventEndTime   = form.eventEndTime || null;
    if (Number(form.guestCount) !== booking.guestCount) patch.guestCount = Number(form.guestCount);
    if (form.venueName    !== (booking.venueName    || '')) patch.venueName    = form.venueName;
    if (form.venueAddress !== (booking.venueAddress || '')) patch.venueAddress = form.venueAddress;
    if (form.serviceStyle !== (booking.serviceStyle || '')) patch.serviceStyle = form.serviceStyle;
    if (form.packageName  !== (booking.packageName  || '')) patch.packageName  = form.packageName;

    if (Object.keys(patch).length) await onPatch(patch, 'Event details saved.');
    setEditing(false);
  };

  return (
    <Card
      title="Event details"
      icon="fa-calendar-day"
      action={
        editing ? (
          <button type="button" className="btn btn-ghost btn-small" onClick={() => { setEditing(false); setForm(toEventForm(booking)); }}>
            Cancel
          </button>
        ) : (
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setEditing(true)}>
            <i className="fas fa-pen" aria-hidden="true" /> Edit
          </button>
        )
      }
    >
      {!editing ? (
        <dl
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px 24px',
            margin: 0,
          }}
        >
          <Field label="Event type"   value={booking.eventType} />
          <Field label="Event date"   value={fmtDate(booking.eventDate)} />
          <Field label="Time"         value={booking.eventStartTime ? `${booking.eventStartTime}${booking.eventEndTime ? ' – ' + booking.eventEndTime : ''}` : '—'} />
          <Field label="Guest count"  value={booking.guestCount} />
          <Field label="Venue"        value={booking.venueName || '—'} />
          <Field label="Service style" value={booking.serviceStyle || '—'} />
          <Field label="Package"      value={booking.packageName || '—'} />
          <Field label="Address"      value={booking.venueAddress || '—'} fullWidth />
        </dl>
      ) : (
        <form onSubmit={submit} className="admin-form-grid">
          <FieldInput name="eventType"   label="Event type"  value={form.eventType}   onChange={handle} />
          <FieldInput name="eventDate"   label="Event date"  type="date" value={form.eventDate} onChange={handle} />
          <FieldInput name="eventStartTime" label="Start time" type="time" value={form.eventStartTime} onChange={handle} />
          <FieldInput name="eventEndTime"   label="End time"   type="time" value={form.eventEndTime}   onChange={handle} />
          <FieldInput name="guestCount"  label="Guest count" type="number" min="1" value={form.guestCount} onChange={handle} />
          <FieldInput name="serviceStyle" label="Service style" value={form.serviceStyle} onChange={handle} placeholder="buffet / plated / family-style" />
          <FieldInput name="packageName" label="Package" value={form.packageName} onChange={handle} />
          <FieldInput name="venueName"   label="Venue"   value={form.venueName}   onChange={handle} />
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-group">
              Venue address
              <textarea
                name="venueAddress"
                value={form.venueAddress}
                onChange={handle}
                rows={2}
                className="admin-input"
              />
            </label>
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="submit" className="btn btn-primary">Save changes</button>
          </div>
        </form>
      )}
    </Card>
  );
}

function toEventForm(b) {
  return {
    eventType: b.eventType || '',
    eventDate: b.eventDate || '',
    eventStartTime: b.eventStartTime || '',
    eventEndTime: b.eventEndTime || '',
    guestCount: b.guestCount || 0,
    venueName: b.venueName || '',
    venueAddress: b.venueAddress || '',
    serviceStyle: b.serviceStyle || '',
    packageName: b.packageName || '',
  };
}

/* ─────────────────────────────────────────── checklist ───────────────────── */

function ChecklistCard({ tasks, bookingId, onChanged, toast }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: '', dueAt: '', assignee: '' });

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    try {
      await adminApi.addBookingTask(bookingId, {
        title: draft.title.trim(),
        dueAt: draft.dueAt ? new Date(draft.dueAt).toISOString() : null,
        assignee: draft.assignee.trim() || null,
      });
      setDraft({ title: '', dueAt: '', assignee: '' });
      setAdding(false);
      toast.success('Task added.');
      onChanged();
    } catch (err) {
      toast.error(err?.message || 'Could not add task.');
    }
  };

  const toggle = async (t) => {
    const nextStatus = t.status === 'done' ? 'todo' : 'done';
    try {
      await adminApi.updateBookingTask(bookingId, t.id, { status: nextStatus });
      onChanged();
    } catch (err) {
      toast.error(err?.message || 'Could not update task.');
    }
  };

  const remove = async (t) => {
    try {
      await adminApi.deleteBookingTask(bookingId, t.id);
      toast.success('Task removed.');
      onChanged();
    } catch (err) {
      toast.error(err?.message || 'Could not delete task.');
    }
  };

  const open = tasks.filter((t) => t.status !== 'done').length;

  return (
    <Card
      title={`Event checklist · ${open} open / ${tasks.length} total`}
      icon="fa-list-check"
      action={
        adding ? null : (
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setAdding(true)}>
            <i className="fas fa-plus" aria-hidden="true" /> Add task
          </button>
        )
      }
    >
      {adding && (
        <form
          onSubmit={submit}
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr auto',
            gap: 8,
            marginBottom: 12,
            alignItems: 'end',
          }}
        >
          <FieldInput
            name="title"
            label="Task"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            autoFocus
          />
          <FieldInput
            name="dueAt"
            label="Due"
            type="datetime-local"
            value={draft.dueAt}
            onChange={(e) => setDraft({ ...draft, dueAt: e.target.value })}
          />
          <FieldInput
            name="assignee"
            label="Assignee"
            value={draft.assignee}
            onChange={(e) => setDraft({ ...draft, assignee: e.target.value })}
            placeholder="Name"
          />
          <div style={{ display: 'flex', gap: 6, paddingBottom: 6 }}>
            <button type="submit" className="btn btn-primary btn-small">Add</button>
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => { setAdding(false); setDraft({ title: '', dueAt: '', assignee: '' }); }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {tasks.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          No checklist items yet. Add tasks like "confirm venue access", "lock final headcount", or "brief staff team".
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.map((t) => {
            const done = t.status === 'done';
            return (
              <li
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: done ? 'rgba(20,58,38,0.04)' : '#fff',
                  border: '1px solid var(--color-border-light)',
                  opacity: done ? 0.7 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => toggle(t)}
                  aria-label={`Mark task ${done ? 'incomplete' : 'done'}`}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ textDecoration: done ? 'line-through' : 'none', fontWeight: 500 }}>
                    {t.title}
                  </div>
                  <div className="admin-cell-sub" style={{ display: 'flex', gap: 12 }}>
                    {t.dueAt && (<span><i className="fas fa-clock" aria-hidden="true" /> {new Date(t.dueAt).toLocaleString('en-IN')}</span>)}
                    {t.assignee && (<span><i className="fas fa-user" aria-hidden="true" /> {t.assignee}</span>)}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  onClick={() => remove(t)}
                  aria-label={`Delete task ${t.title}`}
                  title="Delete"
                  style={{ padding: '4px 10px' }}
                >
                  <i className="fas fa-times" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/* ─────────────────────────────────────────── purchase orders ─────────────── */

function PurchaseOrdersCard({ bookingId, pos, navigate }) {
  const PO_STATUS_CLS = {
    draft: 'pending', issued: 'contacted', confirmed: 'booked',
    partial: 'pending', received: 'approved', paid: 'approved', cancelled: 'declined',
  };

  const fmtMoneyShort = (cents, currency = 'INR') => {
    if (cents == null) return '—';
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
    } catch {
      return `₹${(cents / 100).toLocaleString('en-IN')}`;
    }
  };

  const totalLines = pos.length;
  const totalCommitted = pos.reduce((s, p) => s + (p.totalCents || 0), 0);
  const totalPaid      = pos.reduce((s, p) => s + (p.paidCents || 0), 0);

  return (
    <Card
      title={`Purchase orders · ${totalLines}`}
      icon="fa-file-invoice-dollar"
      action={
        <button
          type="button"
          className="btn btn-ghost btn-small"
          onClick={() => navigate(`/admin/purchase-orders?bookingId=${bookingId}&new=1`)}
          title="Create a PO pre-linked to this booking"
        >
          <i className="fas fa-plus" aria-hidden="true" /> New PO
        </button>
      }
    >
      {pos.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          No POs raised for this event yet. Click "New PO" to source from a vendor.
        </p>
      ) : (
        <>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pos.map((p) => (
              <li
                key={p.id}
                style={{ padding: 12, borderRadius: 10, border: '1px solid var(--color-border-light)', cursor: 'pointer' }}
                onClick={() => navigate(`/admin/purchase-orders/${p.id}`)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(`/admin/purchase-orders/${p.id}`)}
                tabIndex={0}
                role="button"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontFamily: 'var(--font-body)' }}>{p.reference}</strong>
                  <span className={`status-badge ${PO_STATUS_CLS[p.status] || 'pending'}`}>{p.status}</span>
                  <span className="admin-cell-sub">· {p.vendorName} ({(p.vendorCategory || '').replace('_', ' ')})</span>
                  <span style={{ marginLeft: 'auto', fontWeight: 600 }}>
                    {fmtMoneyShort(p.totalCents, p.currency)}
                  </span>
                </div>
                <div className="admin-cell-sub" style={{ marginTop: 4, display: 'flex', gap: 12 }}>
                  {p.expectedDelivery && <span>Due {new Date(p.expectedDelivery).toLocaleDateString('en-IN')}</span>}
                  <span>Paid {fmtMoneyShort(p.paidCents, p.currency)}</span>
                </div>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-light)', paddingTop: 10 }}>
            <span className="admin-cell-sub">Vendor commitment</span>
            <strong>
              {fmtMoneyShort(totalCommitted)} ({fmtMoneyShort(totalPaid)} paid)
            </strong>
          </div>
        </>
      )}
    </Card>
  );
}

/* ─────────────────────────────────────────── invoices ───────────────────── */

function InvoicesCard({ bookingId, invoices, currency, navigate }) {
  const INVOICE_STATUS_CLS = {
    draft: 'pending', issued: 'contacted', partially_paid: 'pending',
    paid: 'approved', overdue: 'declined', void: 'declined',
  };

  return (
    <Card
      title={`Invoices · ${invoices.length}`}
      icon="fa-file-invoice"
      action={
        <button
          type="button"
          className="btn btn-ghost btn-small"
          onClick={() => navigate(`/admin/invoices?bookingId=${bookingId}&new=1`)}
          title="Generate an invoice for this booking"
        >
          <i className="fas fa-plus" aria-hidden="true" /> Generate invoice
        </button>
      }
    >
      {invoices.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          No invoices yet. Click "Generate invoice" to bill the client.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {invoices.map((i) => (
            <li
              key={i.id}
              style={{ padding: 12, borderRadius: 10, border: '1px solid var(--color-border-light)', cursor: 'pointer' }}
              onClick={() => navigate(`/admin/invoices/${i.id}`)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(`/admin/invoices/${i.id}`)}
              tabIndex={0}
              role="button"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ fontFamily: 'var(--font-body)' }}>{i.reference}</strong>
                <span className={`status-badge ${INVOICE_STATUS_CLS[i.status] || 'pending'}`}>
                  {i.status.replace('_', ' ')}
                </span>
                <span style={{ marginLeft: 'auto', fontWeight: 600 }}>
                  {fmtMoney(i.totalCents, i.currency || currency)}
                </span>
              </div>
              <div className="admin-cell-sub" style={{ marginTop: 4, display: 'flex', gap: 12 }}>
                {i.issueDate && <span>Issued {fmtDate(i.issueDate)}</span>}
                {i.dueDate   && <span>Due {fmtDate(i.dueDate)}</span>}
                <span>Paid {fmtMoney(i.paidCents, i.currency || currency)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ─────────────────────────────────────────── P&L ────────────────────────── */

function PnlCard({ finance, currency }) {
  if (!finance) return null;
  const margin = finance.grossMarginCents ?? 0;
  return (
    <Card title="P&amp;L snapshot" icon="fa-chart-line">
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <MoneyRow label="Booking total"         value={fmtMoney(finance.bookingTotalCents,        currency)} />
        <MoneyRow label="Invoiced"              value={fmtMoney(finance.invoicedCents,            currency)} />
        <MoneyRow label="Outstanding (invoices)" value={fmtMoney(finance.invoiceOutstandingCents, currency)}
                  tone={(finance.invoiceOutstandingCents || 0) > 0 ? 'warning' : 'success'} />
        <MoneyRow label="Collected (paid)"      value={fmtMoney(finance.paidCents,                currency)} accent tone="success" />
        {(finance.advanceUnallocatedCents || 0) > 0 && (
          <MoneyRow label="Advance unallocated" value={fmtMoney(finance.advanceUnallocatedCents,  currency)} />
        )}
      </ul>

      <hr style={{ border: 'none', borderTop: '1px dashed var(--color-border-light)', margin: '14px 0' }} />

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <MoneyRow label="Vendor committed"   value={fmtMoney(finance.vendorCommittedCents, currency)} />
        <MoneyRow label="Vendor paid"        value={fmtMoney(finance.vendorPaidCents,      currency)} />
        <MoneyRow label="Direct expenses"    value={fmtMoney(finance.directExpenseCents,   currency)} />
        <MoneyRow label="Total cost"         value={fmtMoney(finance.totalCostCents,       currency)} accent />
      </ul>

      <hr style={{ border: 'none', borderTop: '1px dashed var(--color-border-light)', margin: '14px 0' }} />

      <MoneyRow label="Gross margin" value={fmtMoney(margin, currency)} accent
                tone={margin >= 0 ? 'success' : 'warning'} />
      <p className="admin-cell-sub" style={{ marginTop: 8, fontSize: 11 }}>
        Gross margin = collected − (vendor paid + direct expenses).
      </p>
    </Card>
  );
}

/* ─────────────────────────────────────────── notes ───────────────────────── */

function NotesCard({ booking, onPatch }) {
  const [internal, setInternal] = useState(booking.internalNotes || '');
  const [client, setClient] = useState(booking.clientNotes || '');
  useEffect(() => {
    setInternal(booking.internalNotes || '');
    setClient(booking.clientNotes || '');
  }, [booking.internalNotes, booking.clientNotes]);

  const dirty =
    internal !== (booking.internalNotes || '') ||
    client   !== (booking.clientNotes   || '');

  return (
    <Card
      title="Notes"
      icon="fa-note-sticky"
      action={
        dirty && (
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={() => onPatch({ internalNotes: internal, clientNotes: client }, 'Notes saved.')}
          >
            Save
          </button>
        )
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <label className="form-group">
          Internal notes <span className="admin-cell-sub">(team-only)</span>
          <textarea
            value={internal}
            onChange={(e) => setInternal(e.target.value)}
            rows={5}
            className="admin-input"
            placeholder="Operations notes — vendor coordinates, special requests, allergens, escalations…"
          />
        </label>
        <label className="form-group">
          Client-facing notes
          <textarea
            value={client}
            onChange={(e) => setClient(e.target.value)}
            rows={5}
            className="admin-input"
            placeholder="Anything the client should see in confirmations, invoices, or follow-up emails."
          />
        </label>
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────── client snapshot ─────────────── */

function ClientSnapshotCard({ client, navigate }) {
  if (!client) return null;
  return (
    <Card title="Client" icon="fa-user">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-primary)' }}>
          {client.name}
        </div>
        <ul className="admin-info-list" style={{ marginTop: 0 }}>
          <li><i className="fas fa-envelope" aria-hidden="true" /> <a href={`mailto:${client.email}`} style={{ color: 'inherit' }}>{client.email}</a></li>
          <li><i className="fas fa-phone" aria-hidden="true" /> <a href={`tel:${client.phone}`} style={{ color: 'inherit' }}>{client.phone}</a></li>
          {client.lifecycleStage && (
            <li>
              <i className="fas fa-seedling" aria-hidden="true" />
              <span style={{ textTransform: 'capitalize' }}>{client.lifecycleStage}</span> client
            </li>
          )}
        </ul>
        <button
          type="button"
          className="btn btn-ghost btn-small"
          onClick={() => navigate('/admin/clients')}
          style={{ alignSelf: 'flex-start' }}
        >
          <i className="fas fa-external-link-alt" aria-hidden="true" /> Open client list
        </button>
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────── finance ─────────────────────── */

function FinanceCard({ booking, balanceCents, onPatch }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(toMoneyForm(booking));
  useEffect(() => setForm(toMoneyForm(booking)), [booking]);

  const submit = async (e) => {
    e.preventDefault();
    const patch = {};
    const totalC   = Math.max(0, Math.round(Number(form.total)   * 100));
    const depositC = Math.max(0, Math.round(Number(form.deposit) * 100));
    const paidC    = Math.max(0, Math.round(Number(form.paid)    * 100));
    if (totalC   !== (booking.totalAmountCents   || 0)) patch.totalAmountCents   = totalC;
    if (depositC !== (booking.depositAmountCents || 0)) patch.depositAmountCents = depositC;
    if (paidC    !== (booking.paidAmountCents    || 0)) patch.paidAmountCents    = paidC;
    if (form.currency && form.currency !== booking.currency) patch.currency = form.currency;
    if (Object.keys(patch).length) await onPatch(patch, 'Finance updated.');
    setEditing(false);
  };

  return (
    <Card
      title="Finance"
      icon="fa-coins"
      action={
        editing ? (
          <button type="button" className="btn btn-ghost btn-small" onClick={() => { setEditing(false); setForm(toMoneyForm(booking)); }}>
            Cancel
          </button>
        ) : (
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setEditing(true)}>
            <i className="fas fa-pen" aria-hidden="true" /> Edit
          </button>
        )
      }
    >
      {!editing ? (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <MoneyRow label="Total"       value={fmtMoney(booking.totalAmountCents,   booking.currency)} />
          <MoneyRow label="Deposit"     value={fmtMoney(booking.depositAmountCents, booking.currency)} />
          <MoneyRow label="Paid"        value={fmtMoney(booking.paidAmountCents,    booking.currency)} accent />
          <MoneyRow
            label="Balance"
            value={fmtMoney(balanceCents, booking.currency)}
            accent
            tone={balanceCents > 0 ? 'warning' : 'success'}
          />
        </ul>
      ) : (
        <form onSubmit={submit} className="admin-form-grid">
          <FieldInput name="total"    label="Total"    type="number" min="0" step="0.01" value={form.total}    onChange={(e) => setForm({ ...form, total: e.target.value })} />
          <FieldInput name="deposit"  label="Deposit"  type="number" min="0" step="0.01" value={form.deposit}  onChange={(e) => setForm({ ...form, deposit: e.target.value })} />
          <FieldInput name="paid"     label="Paid"     type="number" min="0" step="0.01" value={form.paid}     onChange={(e) => setForm({ ...form, paid: e.target.value })} />
          <FieldInput name="currency" label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase().slice(0, 3) })} />
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary btn-small">Save</button>
          </div>
        </form>
      )}
    </Card>
  );
}

function toMoneyForm(b) {
  return {
    total:    ((b.totalAmountCents   || 0) / 100).toFixed(2),
    deposit:  ((b.depositAmountCents || 0) / 100).toFixed(2),
    paid:     ((b.paidAmountCents    || 0) / 100).toFixed(2),
    currency: b.currency || 'INR',
  };
}

function MoneyRow({ label, value, accent, tone }) {
  const color = tone === 'warning' ? 'var(--color-accent-dark)'
              : tone === 'success' ? 'var(--color-success)'
              : 'var(--color-primary)';
  return (
    <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: accent ? 600 : 500, color: accent ? color : 'var(--text-primary)' }}>
        {value}
      </span>
    </li>
  );
}

/* ─────────────────────────────────────────── primitives ──────────────────── */

function Card({ title, icon, action, children }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--color-border-light)',
        borderRadius: 14,
        padding: '20px 22px',
        boxShadow: '0 1px 0 rgba(20,58,38,0.02)',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: '1.05rem',
          color: 'var(--color-primary)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
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

function Field({ label, value, fullWidth }) {
  return (
    <div style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
      <dt style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-light)', fontWeight: 600 }}>
        {label}
      </dt>
      <dd style={{ margin: '4px 0 0', color: 'var(--text-primary)' }}>{value ?? '—'}</dd>
    </div>
  );
}

function FieldInput({ label, name, value, onChange, type = 'text', autoFocus, placeholder, min, step }) {
  return (
    <label className="form-group" style={{ minWidth: 0 }}>
      {label}
      <input
        className="admin-input"
        name={name}
        type={type}
        value={value ?? ''}
        onChange={onChange}
        autoFocus={autoFocus}
        placeholder={placeholder}
        min={min}
        step={step}
      />
    </label>
  );
}
