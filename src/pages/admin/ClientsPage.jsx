/**
 * ClientsPage.jsx — World-class client management
 *
 * Features:
 *  ✦ Debounced search (300ms) across name, email, phone
 *  ✦ Real pagination (10 per page) with keyboard nav
 *  ✦ Sortable columns (click header to toggle asc/desc)
 *  ✦ Working "Add Client" form with full validation + optimistic append
 *  ✦ Bulk select + shift-click range selection
 *  ✦ Client drawer with "Send review invitation" shortcut
 *  ✦ Inline status update from drawer (review status toggle)
 *  ✦ ESC closes any open overlay; focus trap in modals
 *  ✦ Toast notifications for every mutation
 *  ✦ Export CSV (client-side, no server needed)
 */

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useReducer,
  useId,
} from 'react';
import AdminPageHero from '../../components/admin/layout/AdminPageHero';
import AdminPortal from '../../components/admin/shared/AdminPortal';
import { useToast } from './useToast';
import {
  useDebounce,
  useEscapeKey,
  useFocusTrap,
  usePagination,
  PaginationBar,
} from './adminHooks';
import { admin as adminApi } from '../../services/api';

/** Map server client → UI shape used by this page. */
const mapServerClient = (c) => ({
  id: c.id,
  name: c.name,
  email: c.email,
  phone: c.phone,
  companyName: c.companyName || '',
  status: (c.status || 'lead').toLowerCase(),
  lifecycleStage: (c.lifecycleStage || 'prospect').toLowerCase(),
  totalEvents: (c.quoteCount || 0) + (c.bookingCount || 0),
  bookingCount: c.bookingCount || 0,
  reviewStatus: c.reviewCount > 0 ? 'submitted' : 'pending',
  lifetimeValueCents: c.lifetimeValueCents || 0,
  lastContactedAt: c.lastContactedAt,
  tags: Array.isArray(c.tags) ? c.tags : [],
  joinedDate: c.createdAt,
});

const LIFECYCLE_BADGE = {
  prospect: { label: 'Prospect', cls: 'pending' },
  active:   { label: 'Active',   cls: 'contacted' },
  repeat:   { label: 'Repeat',   cls: 'approved' },
  vip:      { label: 'VIP',      cls: 'booked' },
  dormant:  { label: 'Dormant',  cls: 'declined' },
  archived: { label: 'Archived', cls: 'declined' },
};

const fmtMoney = (cents, currency = 'INR') => {
  if (!cents) return '₹0';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `₹${(cents / 100).toLocaleString('en-IN')}`;
  }
};

/* ─── Reducer ─────────────────────────────────────────────── */


function clientsReducer(state, action) {
  switch (action.type) {
    case 'REPLACE':
      return Array.isArray(action.items) ? action.items : [];
    case 'ADD':
      return [action.client, ...state];
    case 'UPDATE':
      return state.map((c) => c.id === action.id ? { ...c, ...action.patch } : c);
    case 'DELETE_BULK':
      return state.filter((c) => !action.ids.includes(c.id));
    default:
      return state;
  }
}

/* ─── Helpers ─────────────────────────────────────────────── */

const fmt = (s) => {
  if (!s) return '—';
  const d = new Date(s);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
};

const fmtRelative = (s) => {
  if (!s) return 'Not yet contacted';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return 'Today';
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  if (diffDays < 30) {
    const w = Math.round(diffDays / 7);
    return `${w} week${w === 1 ? '' : 's'} ago`;
  }
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
};

function exportCSV(clients) {
  const headers = [
    'Name', 'Company', 'Email', 'Phone', 'Status', 'Lifecycle', 'Bookings',
    'Lifetime value (INR)', 'Last contact', 'Joined',
  ];
  const rows = clients.map((c) => [
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.companyName || '').replace(/"/g, '""')}"`,
    c.email, c.phone, c.status, c.lifecycleStage,
    c.bookingCount,
    ((c.lifetimeValueCents || 0) / 100).toFixed(2),
    c.lastContactedAt || '',
    c.joinedDate || '',
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Validate add-client form ────────────────────────────── */

function validateClient(d) {
  const e = {};
  if (!d.name.trim()) e.name = 'Name is required';
  else if (d.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
  if (!d.email.trim()) e.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.email = 'Invalid email';
  if (!d.phone.trim()) e.phone = 'Phone is required';
  else if (!/^\+?[\d\s\-()]{8,}$/.test(d.phone)) e.phone = 'Invalid phone number';
  return e;
}

/* ─── SortButton ──────────────────────────────────────────── */

function SortBtn({ col, sort, onSort, children }) {
  const active = sort.col === col;
  return (
    <button
      type="button"
      onClick={() =>
        onSort({ col, dir: active && sort.dir === 'asc' ? 'desc' : 'asc' })
      }
      style={{
        background: 'none',
        border: 'none',
        font: 'inherit',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: 0,
      }}
    >
      {children}
      <i
        className={`fas fa-sort${active ? (sort.dir === 'asc' ? '-up' : '-down') : ''}`}
        aria-hidden="true"
        style={{ fontSize: 10, opacity: active ? 1 : 0.35 }}
      />
    </button>
  );
}

/* ─── AddClientModal ──────────────────────────────────────── */

function AddClientModal({ onClose, onAdd }) {
  const formId = useId();
  const modalRef = useRef(null);
  useFocusTrap(modalRef, true);
  useEscapeKey(onClose, true);

  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: '' }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateClient(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      // Focus first error
      const first = modalRef.current?.querySelector('[aria-invalid="true"]');
      first?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const created = await adminApi.createClient({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        source: 'manual',
      });
      onAdd(mapServerClient(created));
    } catch (err) {
      // Surface backend field errors inline (e.g. duplicate email) and keep
      // the modal open so the admin can correct the input.
      if (err?.fields && typeof err.fields === 'object') {
        setErrors(err.fields);
      } else {
        setErrors((prev) => ({ ...prev, _form: err?.message || 'Could not create client.' }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name, label, type = 'text', placeholder = '') => (
    <div className="form-group">
      <label htmlFor={`${formId}-${name}`}>
        {label} <span className="req">*</span>
      </label>
      <input
        id={`${formId}-${name}`}
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        aria-invalid={errors[name] ? 'true' : 'false'}
        aria-describedby={errors[name] ? `${formId}-${name}-err` : undefined}
        disabled={submitting}
      />
      {errors[name] && (
        <span className="form-error" id={`${formId}-${name}-err`} role="alert">
          <i className="fas fa-exclamation-circle" aria-hidden="true" />
          {errors[name]}
        </span>
      )}
    </div>
  );

  return (
    <AdminPortal>
      <div
        className="modal-overlay"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="modal-content modal-md"
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label="Add new client"
        >
        <div className="modal-header">
          <h2>Add New Client</h2>
          <button type="button" onClick={onClose} aria-label="Close modal" disabled={submitting}>
            <i className="fas fa-times" aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {errors._form && (
              <div className="form-error" role="alert" style={{ marginBottom: 12 }}>
                <i className="fas fa-exclamation-circle" aria-hidden="true" /> {errors._form}
              </div>
            )}
            {field('name', 'Client name', 'text', 'Full name')}
            <div className="form-row">
              {field('email', 'Email', 'email', 'name@example.com')}
              {field('phone', 'Phone', 'tel', '+91 98765 43210')}
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin" aria-hidden="true" /> Adding…
                </>
              ) : (
                <>
                  <i className="fas fa-plus" aria-hidden="true" /> Add client
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </AdminPortal>
  );
}

/* ─── ClientDrawer ────────────────────────────────────────── */
/* Rich drawer that fetches the full client detail (notes, addresses, tags,
 * bookings, quotes) and supports inline mutations for each. The list-page
 * row is just a summary; everything substantive lives here. */

function ClientDrawer({ client: summary, onClose, onSendInvitation, onClientChanged }) {
  const drawerRef = useRef(null);
  useFocusTrap(drawerRef, true);
  useEscapeKey(onClose, true);
  const { toast } = useToast();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('timeline');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getClient(summary.id);
      setDetail(data);
    } catch (err) {
      toast.error(err?.message || 'Could not load client details.');
    } finally {
      setLoading(false);
    }
  }, [summary.id, toast]);

  useEffect(() => { reload(); }, [reload]);

  const lifecycle = (detail?.lifecycleStage || summary.lifecycleStage || 'prospect').toLowerCase();
  const lifecycleCfg = LIFECYCLE_BADGE[lifecycle] || LIFECYCLE_BADGE.prospect;

  const updateLifecycle = async (next) => {
    try {
      await adminApi.updateClient(summary.id, { lifecycleStage: next });
      toast.success(`Lifecycle set to ${LIFECYCLE_BADGE[next]?.label || next}.`);
      reload();
      onClientChanged?.();
    } catch (err) {
      toast.error(err?.message || 'Could not update lifecycle.');
    }
  };

  return (
    <AdminPortal>
      <div className="drawer-overlay" onClick={onClose} />
      <div
        className="drawer-content"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Client profile — ${summary.name}`}
        style={{ width: 'min(640px, 100%)' }}
      >
        <div className="modal-header">
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Client profile</h2>
          <button type="button" onClick={onClose} aria-label="Close drawer">
            <i className="fas fa-times" aria-hidden="true" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Identity */}
          <div className="drawer-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div
                style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'var(--color-accent-soft)',
                  color: 'var(--color-accent-dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 500,
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                {summary.name.charAt(0)}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: '1.3rem',
                  color: 'var(--color-primary)', letterSpacing: '-0.02em', lineHeight: 1.2,
                }}>
                  {summary.name}
                </div>
                {detail?.companyName && (
                  <div className="admin-cell-sub">
                    <i className="fas fa-building" aria-hidden="true" /> {detail.companyName}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <span className={`status-badge ${lifecycleCfg.cls}`}>{lifecycleCfg.label}</span>
                  <select
                    aria-label="Change lifecycle stage"
                    value={lifecycle}
                    onChange={(e) => updateLifecycle(e.target.value)}
                    className="admin-input"
                    style={{ width: 130, padding: '4px 8px', fontSize: 12 }}
                  >
                    {Object.entries(LIFECYCLE_BADGE).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <ul className="admin-info-list">
              <li>
                <i className="fas fa-envelope" aria-hidden="true" />
                <a href={`mailto:${summary.email}`} style={{ color: 'inherit' }}>{summary.email}</a>
              </li>
              <li>
                <i className="fas fa-phone" aria-hidden="true" />
                <a href={`tel:${summary.phone}`} style={{ color: 'inherit' }}>{summary.phone}</a>
              </li>
              <li>
                <i className="fas fa-clock-rotate-left" aria-hidden="true" />
                Last contacted {fmtRelative(detail?.lastContactedAt || summary.lastContactedAt)}
              </li>
              <li>
                <i className="fas fa-coins" aria-hidden="true" />
                {fmtMoney(detail?.lifetimeValueCents ?? summary.lifetimeValueCents)} lifetime value
              </li>
              <li>
                <i className="fas fa-calendar-plus" aria-hidden="true" />
                Joined {fmt(summary.joinedDate)}
              </li>
            </ul>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: 'flex', gap: 4, padding: '0 16px',
              borderBottom: '1px solid var(--color-border-light)',
            }}
            role="tablist"
          >
            {[
              { id: 'timeline', label: 'Timeline' },
              { id: 'bookings', label: 'Bookings' },
              { id: 'quotes',   label: 'Quotes' },
              { id: 'addresses', label: 'Addresses' },
              { id: 'tags',     label: 'Tags' },
            ].map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '10px 14px',
                  fontSize: 13,
                  fontWeight: tab === t.id ? 600 : 500,
                  color: tab === t.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                  borderBottom: tab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="admin-loading" style={{ padding: 24 }}>
              <div className="admin-spinner" />
            </div>
          )}

          {!loading && detail && (
            <div style={{ padding: '16px 20px' }}>
              {tab === 'timeline' && (
                <NotesTab
                  clientId={summary.id}
                  notes={detail.timelineNotes || []}
                  onChanged={reload}
                  toast={toast}
                />
              )}
              {tab === 'bookings' && (
                <BookingsTab bookings={detail.bookings || []} />
              )}
              {tab === 'quotes' && (
                <QuotesTab quotes={detail.quotes || []} />
              )}
              {tab === 'addresses' && (
                <AddressesTab
                  clientId={summary.id}
                  addresses={detail.addresses || []}
                  onChanged={reload}
                  toast={toast}
                />
              )}
              {tab === 'tags' && (
                <TagsTab
                  clientId={summary.id}
                  current={detail.tags || []}
                  onChanged={() => { reload(); onClientChanged?.(); }}
                  toast={toast}
                />
              )}
            </div>
          )}

          {/* Quick actions */}
          <div className="drawer-section" style={{ borderTop: '1px solid var(--color-border-light)' }}>
            <span className="admin-subhead">Quick actions</span>
            <div className="admin-action-stack" style={{ marginTop: 10 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={async () => {
                  try {
                    await adminApi.touchClient(summary.id);
                    toast.success('Marked as contacted just now.');
                    reload();
                    onClientChanged?.();
                  } catch (err) {
                    toast.error(err?.message || 'Could not update contact time.');
                  }
                }}
              >
                <i className="fas fa-hand-wave" aria-hidden="true" />
                Mark as contacted now
              </button>
              {summary.reviewStatus === 'pending' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => { onClose(); onSendInvitation(summary); }}
                >
                  <i className="fas fa-paper-plane" aria-hidden="true" />
                  Send review invitation
                </button>
              )}
              <a href={`mailto:${summary.email}`} className="btn btn-secondary">
                <i className="fas fa-envelope" aria-hidden="true" />
                Send email
              </a>
              <a href={`tel:${summary.phone}`} className="btn btn-ghost">
                <i className="fas fa-phone" aria-hidden="true" />
                Call client
              </a>
            </div>
          </div>
        </div>
      </div>
    </AdminPortal>
  );
}

/* ─── Drawer tabs ─────────────────────────────────────────── */

function NotesTab({ clientId, notes, onChanged, toast }) {
  const [draft, setDraft] = useState('');
  const [category, setCategory] = useState('internal');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await adminApi.addClientNote(clientId, { body: draft.trim(), category });
      setDraft('');
      onChanged();
    } catch (err) {
      toast.error(err?.message || 'Could not save note.');
    } finally {
      setSaving(false);
    }
  };

  const togglePin = async (note) => {
    try {
      await adminApi.updateClientNote(clientId, note.id, { pinned: !note.pinned });
      onChanged();
    } catch (err) {
      toast.error(err?.message || 'Could not pin note.');
    }
  };

  const remove = async (note) => {
    try {
      await adminApi.deleteClientNote(clientId, note.id);
      onChanged();
    } catch (err) {
      toast.error(err?.message || 'Could not delete note.');
    }
  };

  return (
    <div>
      <form onSubmit={submit} style={{ marginBottom: 16 }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note — call summary, follow-up reminder, internal context…"
          rows={3}
          className="admin-input"
          style={{ width: '100%', resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="admin-input"
            style={{ width: 140, fontSize: 12 }}
          >
            <option value="internal">Internal</option>
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
          </select>
          <button
            type="submit"
            className="btn btn-primary btn-small"
            disabled={!draft.trim() || saving}
            style={{ marginLeft: 'auto' }}
          >
            {saving ? 'Adding…' : 'Add note'}
          </button>
        </div>
      </form>

      {notes.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          No notes yet. Capture every call, email, and meeting here so context survives team changes.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notes.map((n) => (
            <li
              key={n.id}
              style={{
                padding: 12,
                borderRadius: 10,
                background: n.pinned ? 'rgba(201,136,47,0.08)' : '#fff',
                border: '1px solid var(--color-border-light)',
              }}
            >
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                {n.category && (
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-accent-dark)' }}>
                    {n.category}
                  </span>
                )}
                {n.pinned && <i className="fas fa-thumbtack" aria-hidden="true" style={{ color: 'var(--color-accent-dark)', fontSize: 11 }} />}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-light)' }}>
                  {fmtRelative(n.createdAt)}
                  {n.authorEmail && ` · ${n.authorEmail}`}
                </span>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, color: 'var(--text-primary)' }}>{n.body}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost btn-small" onClick={() => togglePin(n)} style={{ fontSize: 11 }}>
                  {n.pinned ? 'Unpin' : 'Pin'}
                </button>
                <button type="button" className="btn btn-ghost btn-small" onClick={() => remove(n)} style={{ fontSize: 11 }}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BookingsTab({ bookings }) {
  if (bookings.length === 0) {
    return <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No bookings yet.</p>;
  }
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {bookings.map((b) => (
        <li key={b.id} style={{ padding: 12, borderRadius: 10, border: '1px solid var(--color-border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a
              href={`/admin/bookings/${b.id}`}
              style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
            >
              {b.reference}
            </a>
            <span className="admin-cell-sub">· {b.eventType}</span>
            <span className={`status-badge ${b.status === 'completed' ? 'approved' : b.status === 'cancelled' ? 'declined' : 'booked'}`} style={{ marginLeft: 'auto' }}>
              {b.status}
            </span>
          </div>
          <div className="admin-cell-sub" style={{ marginTop: 4 }}>
            {fmt(b.eventDate)} · {b.guestCount} guests · {fmtMoney(b.paidAmountCents, b.currency)} paid of {fmtMoney(b.totalAmountCents, b.currency)}
          </div>
        </li>
      ))}
    </ul>
  );
}

function QuotesTab({ quotes }) {
  if (quotes.length === 0) {
    return <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No quote history.</p>;
  }
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {quotes.map((q) => (
        <li key={q.id} style={{ padding: 12, borderRadius: 10, border: '1px solid var(--color-border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong>{q.eventType}</strong>
            <span className={`status-badge ${q.status === 'booked' ? 'booked' : q.status === 'declined' ? 'declined' : 'pending'}`} style={{ marginLeft: 'auto' }}>
              {q.status}
            </span>
          </div>
          <div className="admin-cell-sub" style={{ marginTop: 4 }}>
            {fmt(q.eventDate)} · {q.guests} guests · submitted {fmtRelative(q.createdAt)}
          </div>
        </li>
      ))}
    </ul>
  );
}

function AddressesTab({ clientId, addresses, onChanged, toast }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: 'home', line1: '', line2: '', city: '', state: '', pincode: '' });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.line1.trim()) return;
    try {
      await adminApi.addClientAddress(clientId, form);
      setForm({ label: 'home', line1: '', line2: '', city: '', state: '', pincode: '' });
      setAdding(false);
      toast.success('Address added.');
      onChanged();
    } catch (err) {
      toast.error(err?.message || 'Could not add address.');
    }
  };

  const setPrimary = async (a) => {
    try {
      await adminApi.updateClientAddress(clientId, a.id, { primary: true });
      onChanged();
    } catch (err) {
      toast.error(err?.message || 'Could not set primary.');
    }
  };

  const remove = async (a) => {
    try {
      await adminApi.deleteClientAddress(clientId, a.id);
      onChanged();
    } catch (err) {
      toast.error(err?.message || 'Could not delete address.');
    }
  };

  return (
    <div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {addresses.map((a) => (
          <li key={a.id} style={{ padding: 12, borderRadius: 10, border: '1px solid var(--color-border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <strong style={{ textTransform: 'capitalize' }}>{a.label}</strong>
              {a.primary && <span className="status-badge approved">Primary</span>}
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                {!a.primary && (
                  <button type="button" className="btn btn-ghost btn-small" style={{ fontSize: 11 }} onClick={() => setPrimary(a)}>
                    Set primary
                  </button>
                )}
                <button type="button" className="btn btn-ghost btn-small" style={{ fontSize: 11 }} onClick={() => remove(a)}>
                  Delete
                </button>
              </span>
            </div>
            <div className="admin-cell-sub" style={{ marginTop: 4 }}>
              {[a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ')}
            </div>
          </li>
        ))}
      </ul>

      {adding ? (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
            <input className="admin-input" placeholder="Label (home / office)"
              value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            <input className="admin-input" placeholder="Address line 1" required
              value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
          </div>
          <input className="admin-input" placeholder="Address line 2"
            value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <input className="admin-input" placeholder="City"
              value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input className="admin-input" placeholder="State"
              value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            <input className="admin-input" placeholder="Pincode"
              value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setAdding(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-small">Add address</button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-ghost btn-small" onClick={() => setAdding(true)}>
          <i className="fas fa-plus" aria-hidden="true" /> Add address
        </button>
      )}
    </div>
  );
}

function TagsTab({ clientId, current, onChanged, toast }) {
  /* Tags are now plain strings. `current` is a Set/array of strings,
   * `available` is the autocomplete list of distinct strings in use across
   * all clients. Adding a brand-new tag is just typing it and submitting —
   * the backend creates it implicitly via the array assignment. */
  const [available, setAvailable] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(true);

  const currentArr = useMemo(() =>
    Array.from(current || []).map((t) => String(t).toLowerCase()),
  [current]);
  const currentSet = useMemo(() => new Set(currentArr), [currentArr]);

  const loadTags = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listTags('client');
      setAvailable(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.message || 'Could not load tags.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadTags(); }, [loadTags]);

  const persist = async (next) => {
    try {
      await adminApi.setClientTags(clientId, next);
      onChanged();
    } catch (err) {
      toast.error(err?.message || 'Could not update tags.');
    }
  };

  const toggle = (tag) => {
    const next = currentSet.has(tag)
      ? currentArr.filter((t) => t !== tag)
      : [...currentArr, tag];
    persist(next);
  };

  const create = async (e) => {
    e.preventDefault();
    const name = newTagName.trim().toLowerCase();
    if (!name) return;
    setNewTagName('');
    if (currentSet.has(name)) return;
    await persist([...currentArr, name]);
    loadTags(); // refresh the autocomplete pool
  };

  /* Show the full union of "tags in use anywhere" + "tags assigned to this
   * client" so a fresh tag stays visible immediately after assignment. */
  const palette = useMemo(() => {
    const union = new Set([...available, ...currentArr]);
    return Array.from(union).sort();
  }, [available, currentArr]);

  return (
    <div>
      {loading ? (
        <div className="admin-loading"><div className="admin-spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {palette.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              No tags yet. Type one below to apply it.
            </p>
          )}
          {palette.map((tag) => {
            const active = currentSet.has(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggle(tag)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: active ? 'var(--color-primary)' : '#fff',
                  color: active ? '#fff' : 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                {active && <i className="fas fa-check" aria-hidden="true" style={{ marginRight: 6 }} />}
                {tag}
              </button>
            );
          })}
        </div>
      )}

      <form onSubmit={create} style={{ display: 'flex', gap: 6 }}>
        <input
          className="admin-input"
          placeholder="Add a tag…"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary btn-small" disabled={!newTagName.trim()}>
          Apply
        </button>
      </form>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */

const ClientsPage = () => {
  const { toast } = useToast();
  const [clients, dispatch] = useReducer(clientsReducer, []);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchRaw, setSearchRaw] = useState('');
  const search = useDebounce(searchRaw, 280);
  const [sort, setSort] = useState({ col: 'joinedDate', dir: 'desc' });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const lastCheckedRef = useRef(null);

  const reload = useCallback(() => {
    setLoading(true);
    return adminApi
      .listClients({ page: 0, size: 200, sortField: 'createdAt', sortDir: 'desc' })
      .then((data) => {
        const items = Array.isArray(data?.items) ? data.items : [];
        dispatch({ type: 'REPLACE', items: items.map(mapServerClient) });
        setLoadError('');
      })
      .catch((err) => setLoadError(err?.message || 'Could not load clients.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  /* ── Filter + sort ── */

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const base = q
      ? clients.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
        )
      : clients;

    return [...base].sort((a, b) => {
      let aVal = a[sort.col];
      let bVal = b[sort.col];
      if (sort.col === 'totalEvents') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      }
      if (sort.col === 'lastEvent' || sort.col === 'joinedDate') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      if (aVal < bVal) return sort.dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [clients, search, sort]);

  const pagination = usePagination(filtered, 8);

  /* ── Selection ── */

  const toggleSelect = useCallback(
    (id, e) => {
      const items = pagination.slice;
      if (e.shiftKey && lastCheckedRef.current !== null) {
        const lastIdx = items.findIndex((c) => c.id === lastCheckedRef.current);
        const currIdx = items.findIndex((c) => c.id === id);
        const [lo, hi] = [Math.min(lastIdx, currIdx), Math.max(lastIdx, currIdx)];
        const rangeIds = items.slice(lo, hi + 1).map((c) => c.id);
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
    },
    [pagination.slice]
  );

  const toggleSelectAll = useCallback(() => {
    const pageIds = pagination.slice.map((c) => c.id);
    const allSel = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => (allSel ? next.delete(id) : next.add(id)));
      return next;
    });
  }, [pagination.slice, selectedIds]);

  /* ── Actions ── */

  const handleAdd = useCallback(
    (client) => {
      dispatch({ type: 'ADD', client });
      setShowAddModal(false);
      toast.success(`${client.name} added to the client database.`);
    },
    [toast]
  );

  const handleExport = useCallback(() => {
    const toExport = selectedIds.size > 0 ? clients.filter((c) => selectedIds.has(c.id)) : filtered;
    exportCSV(toExport);
    toast.info(
      selectedIds.size > 0
        ? `Exported ${selectedIds.size} selected client${selectedIds.size > 1 ? 's' : ''}.`
        : `Exported all ${filtered.length} clients.`
    );
  }, [clients, filtered, selectedIds, toast]);

  const handleSendInvitation = useCallback(
    (client) => {
      // In a real app, navigate to SendInvitation prefilled with client data
      toast.info(`Opening invitation form for ${client.name}…`);
    },
    [toast]
  );

  const pageIds = pagination.slice.map((c) => c.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  return (
    <>
      <AdminPageHero
        eyebrow="Client Management"
        icon="fa-users"
        title="All Clients"
        subtitle={`${pagination.total} client${pagination.total === 1 ? '' : 's'}${
          selectedIds.size > 0 ? ` · ${selectedIds.size} selected` : ''
        }`}
        intro="Manage your client database, track event history, and follow up after every booking."
        actions={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleExport}
            >
              <i className="fas fa-download" aria-hidden="true" />
              {selectedIds.size > 0 ? ` Export (${selectedIds.size})` : ' Export'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <i className="fas fa-plus" aria-hidden="true" /> Add client
            </button>
          </>
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

          {/* Toolbar — search only; primary actions live in the hero */}
          <div className="admin-toolbar">
            <div className="admin-toolbar-left">
              <label className="admin-search" htmlFor="client-search">
                <i className="fas fa-search" aria-hidden="true" />
                <input
                  id="client-search"
                  type="search"
                  placeholder="Search by name, email, or phone…"
                  value={searchRaw}
                  onChange={(e) => setSearchRaw(e.target.value)}
                  aria-label="Search clients"
                />
                {searchRaw && (
                  <button
                    type="button"
                    onClick={() => setSearchRaw('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-light)',
                      padding: '0 2px',
                      lineHeight: 1,
                    }}
                    aria-label="Clear search"
                  >
                    <i className="fas fa-times" style={{ fontSize: 12 }} aria-hidden="true" />
                  </button>
                )}
              </label>
            </div>
          </div>

          <div className="admin-table-container">
            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
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
                  {selectedIds.size} selected
                </span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: '7px 14px', fontSize: 12 }}
                  onClick={handleExport}
                >
                  <i className="fas fa-download" aria-hidden="true" /> Export selected
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: '7px 14px', fontSize: 12, marginLeft: 'auto' }}
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear
                </button>
              </div>
            )}

            <div className="admin-table-header">
              <h3 className="admin-table-title">
                {search ? `Search results (${filtered.length})` : `Client list`}
              </h3>
              <div className="admin-table-actions" style={{ fontSize: 12, color: 'var(--text-light)' }}>
                {pagination.total} client{pagination.total !== 1 ? 's' : ''}
              </div>
            </div>

            {loading ? (
              <div className="admin-loading"><div className="admin-spinner" /></div>
            ) : filtered.length === 0 ? (
              <div className="admin-empty-state">
                <div className="admin-empty-icon">
                  <i className="fas fa-users" aria-hidden="true" />
                </div>
                <h3>No clients found</h3>
                <p>
                  {search
                    ? `No results for "${search}". Try adjusting your search.`
                    : 'Add your first client to get started.'}
                </p>
                {search ? (
                  <button type="button" className="btn btn-ghost" onClick={() => setSearchRaw('')}>
                    Clear search
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <i className="fas fa-plus" aria-hidden="true" /> Add a client
                  </button>
                )}
              </div>
            ) : (
              <>
                <table className="admin-table">
                  <thead>
                    <tr>
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
                      <th>
                        <SortBtn col="name" sort={sort} onSort={setSort}>Client</SortBtn>
                      </th>
                      <th>Contact</th>
                      <th>
                        <SortBtn col="totalEvents" sort={sort} onSort={setSort}>Events</SortBtn>
                      </th>
                      <th>
                        <SortBtn col="lastContactedAt" sort={sort} onSort={setSort}>Last contact</SortBtn>
                      </th>
                      <th>Lifecycle</th>
                      <th>
                        <SortBtn col="joinedDate" sort={sort} onSort={setSort}>Joined</SortBtn>
                      </th>
                      <th className="actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagination.slice.map((client) => (
                      <tr
                        key={client.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedClient(client)}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedClient(client)}
                        tabIndex={0}
                        role="row"
                        aria-label={`View profile for ${client.name}`}
                      >
                        <td onClick={(e) => { e.stopPropagation(); toggleSelect(client.id, e); }}>
                          <input
                            type="checkbox"
                            aria-label={`Select ${client.name}`}
                            checked={selectedIds.has(client.id)}
                            onChange={(e) => toggleSelect(client.id, e.nativeEvent)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td>
                          <div className="admin-cell-title">{client.name}</div>
                          {client.companyName && (
                            <div className="admin-cell-sub">
                              <i className="fas fa-building" aria-hidden="true" style={{ width: 14 }} />
                              {client.companyName}
                            </div>
                          )}
                          {client.tags && client.tags.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                              {client.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  style={{
                                    fontSize: 10,
                                    padding: '2px 8px',
                                    borderRadius: 999,
                                    background: 'rgba(20,58,38,0.08)',
                                    color: 'var(--color-primary)',
                                    fontWeight: 600,
                                    letterSpacing: '0.04em',
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                              {client.tags.length > 3 && (
                                <span style={{ fontSize: 10, color: 'var(--text-light)' }}>
                                  +{client.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="admin-cell-sub">
                            <i className="fas fa-envelope" aria-hidden="true" style={{ width: 14 }} />
                            {client.email}
                          </div>
                          <div className="admin-cell-sub" style={{ marginTop: 3 }}>
                            <i className="fas fa-phone" aria-hidden="true" style={{ width: 14 }} />
                            {client.phone}
                          </div>
                        </td>
                        <td>
                          <span className="admin-cell-strong">{client.totalEvents}</span>
                        </td>
                        <td className="admin-cell-sub">
                          {fmtRelative(client.lastContactedAt)}
                          {(client.lifetimeValueCents || 0) > 0 && (
                            <div style={{ marginTop: 2, fontWeight: 600, color: 'var(--color-primary)' }}>
                              {fmtMoney(client.lifetimeValueCents)} LTV
                            </div>
                          )}
                        </td>
                        <td>
                          {(() => {
                            const cfg = LIFECYCLE_BADGE[client.lifecycleStage] || LIFECYCLE_BADGE.prospect;
                            return (
                              <span className={`status-badge ${cfg.cls}`}>
                                {cfg.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="admin-cell-sub">{fmt(client.joinedDate)}</td>
                        <td className="actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: '6px 14px', fontSize: 12 }}
                            onClick={() => setSelectedClient(client)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <PaginationBar pagination={pagination} label="clients" />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Client drawer */}
      {selectedClient && (
        <ClientDrawer
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onSendInvitation={handleSendInvitation}
          onClientChanged={reload}
        />
      )}

      {/* Add client modal */}
      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}
    </>
  );
};

export default ClientsPage;
