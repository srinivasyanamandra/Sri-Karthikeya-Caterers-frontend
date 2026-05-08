/**
 * VendorDetailPage — supplier profile.
 *
 * Single-source-of-truth for everything we know about a vendor:
 *
 *   ✦ Overview      — name / category / status / commercial terms inline-edit
 *   ✦ Contacts      — multi-contact roster (primary auto-pinning)
 *   ✦ Rate cards    — known unit prices used to autocomplete PO lines
 *   ✦ Purchase orders — full PO history with click-through to detail
 *   ✦ Tags          — vendor-scoped tag chips
 *
 * Design rule: every mutation routes through this page so audit logs hang
 * off one screen rather than fanning out across the app.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminPageHero from '../../components/admin/layout/AdminPageHero';
import { useToast } from './useToast';
import { admin as adminApi } from '../../services/api';

const STATUS_BADGE = {
  active:   { label: 'Active',   cls: 'approved' },
  inactive: { label: 'Inactive', cls: 'pending' },
  blocked:  { label: 'Blocked',  cls: 'declined' },
};

const PO_STATUS = {
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
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `₹${(cents / 100).toLocaleString('en-IN')}`;
  }
};

const fmtDate = (s) =>
  s ? new Date(s).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export default function VendorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const reload = useCallback(() => {
    setLoading(true);
    return adminApi.getVendor(id)
      .then((data) => { setVendor(data); setLoadError(''); })
      .catch((err) => setLoadError(err?.message || 'Could not load vendor.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  const persistPatch = useCallback(async (patch, msg) => {
    try {
      const updated = await adminApi.updateVendor(id, patch);
      setVendor(updated);
      if (msg) toast.success(msg);
    } catch (err) {
      toast.error(err?.message || 'Update failed.');
    }
  }, [id, toast]);

  if (loading && !vendor) {
    return (
      <>
        <AdminPageHero
          eyebrow="Vendor"
          icon="fa-store"
          title="Loading…"
          actions={<button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/vendors')}><i className="fas fa-arrow-left" aria-hidden="true" /> Back</button>}
        />
        <section className="section"><div className="container"><div className="admin-loading"><div className="admin-spinner" /></div></div></section>
      </>
    );
  }

  if (loadError || !vendor) {
    return (
      <>
        <AdminPageHero
          eyebrow="Vendor"
          icon="fa-circle-exclamation"
          title="Could not load vendor"
          actions={<button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/vendors')}><i className="fas fa-arrow-left" aria-hidden="true" /> Back</button>}
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

  const cfg = STATUS_BADGE[vendor.status] || STATUS_BADGE.active;

  return (
    <>
      <AdminPageHero
        eyebrow={vendor.category.replace('_', ' ').toUpperCase()}
        icon="fa-store"
        title={vendor.name}
        subtitle={
          <>
            <span className={`status-badge ${cfg.cls}`} style={{ marginRight: 8 }}>{cfg.label}</span>
            {fmtMoney(vendor.totalSpendCents, vendor.currency)} lifetime spend
            {(vendor.outstandingCents || 0) > 0 && ` · ${fmtMoney(vendor.outstandingCents, vendor.currency)} outstanding`}
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/vendors')}>
              <i className="fas fa-arrow-left" aria-hidden="true" /> All vendors
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate(`/admin/purchase-orders?vendorId=${vendor.id}&new=1`)}
              title="Create a new purchase order pre-filled with this vendor"
            >
              <i className="fas fa-plus" aria-hidden="true" /> New PO
            </button>
          </>
        }
      />

      <section className="section">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
            <OverviewCard vendor={vendor} onPatch={persistPatch} />
            <ContactsCard
              vendorId={id}
              contacts={vendor.contacts || []}
              onChanged={reload}
              toast={toast}
            />
            <RateCardsCard
              vendorId={id}
              rateCards={vendor.rateCards || []}
              currency={vendor.currency}
              onChanged={reload}
              toast={toast}
            />
            <PurchaseOrdersListCard
              pos={vendor.recentPurchaseOrders || []}
              navigate={navigate}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
            <AddressCard vendor={vendor} onPatch={persistPatch} />
            <ComplianceCard vendor={vendor} onPatch={persistPatch} />
            <TagsCard vendorId={id} current={vendor.tags || []} onChanged={reload} toast={toast} />
            <DangerCard
              vendor={vendor}
              navigate={navigate}
              onChanged={reload}
              toast={toast}
            />
          </div>
        </div>
      </section>
    </>
  );
}

/* ─── Overview ───────────────────────────────────────────── */

function OverviewCard({ vendor, onPatch }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(toForm(vendor));
  useEffect(() => setForm(toForm(vendor)), [vendor]);

  const submit = async (e) => {
    e.preventDefault();
    const patch = {};
    if (form.name !== vendor.name) patch.name = form.name;
    if (form.category !== vendor.category) patch.category = form.category;
    if (form.status !== vendor.status) patch.status = form.status;
    if (form.paymentTerms !== vendor.paymentTerms) patch.paymentTerms = form.paymentTerms;
    if ((form.preferredPayment || '') !== (vendor.preferredPayment || '')) patch.preferredPayment = form.preferredPayment;
    if (form.currency !== vendor.currency) patch.currency = form.currency;
    if ((form.notes || '') !== (vendor.notes || '')) patch.notes = form.notes;
    if (Object.keys(patch).length) await onPatch(patch, 'Vendor updated.');
    setEditing(false);
  };

  return (
    <Card title="Overview" icon="fa-circle-info" action={
      editing ? (
        <button type="button" className="btn btn-ghost btn-small" onClick={() => { setEditing(false); setForm(toForm(vendor)); }}>Cancel</button>
      ) : (
        <button type="button" className="btn btn-ghost btn-small" onClick={() => setEditing(true)}>
          <i className="fas fa-pen" aria-hidden="true" /> Edit
        </button>
      )
    }>
      {!editing ? (
        <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px 24px', margin: 0 }}>
          <Field label="Category"        value={vendor.category.replace('_', ' ')} />
          <Field label="Status"          value={vendor.status} />
          <Field label="Payment terms"   value={vendor.paymentTerms.replace('_', ' ')} />
          <Field label="Preferred mode"  value={vendor.preferredPayment || '—'} />
          <Field label="Currency"        value={vendor.currency} />
          <Field label="Lifetime spend"  value={fmtMoney(vendor.totalSpendCents, vendor.currency)} />
          <Field label="Outstanding"     value={fmtMoney(vendor.outstandingCents, vendor.currency)} />
          <Field label="Last ordered"    value={fmtDate(vendor.lastOrderedAt)} />
          <Field label="Notes"           value={vendor.notes || '—'} fullWidth />
        </dl>
      ) : (
        <form onSubmit={submit} className="admin-form-grid">
          <FieldInput name="name" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="form-group">
            <label>Category</label>
            <select className="admin-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {['decor','florist','lighting','equipment','transport','staffing','raw_ingredients','beverages','entertainment','venue','photography','miscellaneous']
                .map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select className="admin-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div className="form-group">
            <label>Payment terms</label>
            <select className="admin-input" value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}>
              {['advance','on_delivery','net_7','net_15','net_30','net_45','net_60'].map((t) =>
                <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <FieldInput name="preferredPayment" label="Preferred payment" value={form.preferredPayment} onChange={(e) => setForm({ ...form, preferredPayment: e.target.value })} placeholder="bank transfer / UPI / cheque" />
          <FieldInput name="currency" label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase().slice(0, 3) })} />
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-group">
              Notes
              <textarea className="admin-input" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      )}
    </Card>
  );
}

const toForm = (v) => ({
  name: v.name || '',
  category: v.category || 'decor',
  status: v.status || 'active',
  paymentTerms: v.paymentTerms || 'net_30',
  preferredPayment: v.preferredPayment || '',
  currency: v.currency || 'INR',
  notes: v.notes || '',
});

/* ─── Contacts ───────────────────────────────────────────── */

function ContactsCard({ vendorId, contacts, onChanged, toast }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', phone: '', email: '', primary: false });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      await adminApi.addVendorContact(vendorId, {
        name: form.name.trim(),
        role: form.role.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        primary: form.primary,
      });
      setForm({ name: '', role: '', phone: '', email: '', primary: false });
      setAdding(false);
      toast.success('Contact added.');
      onChanged();
    } catch (err) {
      toast.error(err?.message || 'Could not add contact.');
    }
  };

  const setPrimary = async (c) => {
    try {
      await adminApi.updateVendorContact(vendorId, c.id, { primary: true });
      onChanged();
    } catch (err) {
      toast.error(err?.message || 'Could not pin primary.');
    }
  };

  const remove = async (c) => {
    try {
      await adminApi.deleteVendorContact(vendorId, c.id);
      onChanged();
    } catch (err) {
      toast.error(err?.message || 'Could not delete contact.');
    }
  };

  return (
    <Card title={`Contacts · ${contacts.length}`} icon="fa-address-book"
      action={!adding && (
        <button type="button" className="btn btn-ghost btn-small" onClick={() => setAdding(true)}>
          <i className="fas fa-plus" aria-hidden="true" /> Add contact
        </button>
      )}
    >
      {adding && (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
            <input className="admin-input" placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="admin-input" placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input className="admin-input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input type="email" className="admin-input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <input type="checkbox" checked={form.primary} onChange={(e) => setForm({ ...form, primary: e.target.checked })} />
            Make this the primary contact
          </label>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setAdding(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-small">Add contact</button>
          </div>
        </form>
      )}

      {contacts.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No additional contacts.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {contacts.map((c) => (
            <li key={c.id} style={{ padding: 12, borderRadius: 10, border: '1px solid var(--color-border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong>{c.name}</strong>
                {c.primary && <span className="status-badge approved">Primary</span>}
                {c.role && <span className="admin-cell-sub">· {c.role}</span>}
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                  {!c.primary && (
                    <button type="button" className="btn btn-ghost btn-small" style={{ fontSize: 11 }} onClick={() => setPrimary(c)}>
                      Set primary
                    </button>
                  )}
                  <button type="button" className="btn btn-ghost btn-small" style={{ fontSize: 11 }} onClick={() => remove(c)}>Delete</button>
                </span>
              </div>
              <div className="admin-cell-sub" style={{ marginTop: 4, display: 'flex', gap: 12 }}>
                {c.phone && <span><i className="fas fa-phone" aria-hidden="true" /> {c.phone}</span>}
                {c.email && <span><i className="fas fa-envelope" aria-hidden="true" /> {c.email}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ─── Rate cards ─────────────────────────────────────────── */

function RateCardsCard({ vendorId, rateCards, currency, onChanged, toast }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ itemName: '', unit: 'each', unitPrice: '0' });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.itemName.trim()) return;
    const cents = Math.max(0, Math.round(Number(form.unitPrice) * 100));
    try {
      await adminApi.addVendorRateCard(vendorId, {
        itemName: form.itemName.trim(),
        unit: form.unit.trim() || 'each',
        unitPriceCents: cents,
        currency,
      });
      setForm({ itemName: '', unit: 'each', unitPrice: '0' });
      setAdding(false);
      toast.success('Rate added.');
      onChanged();
    } catch (err) {
      toast.error(err?.message || 'Could not add rate.');
    }
  };

  const toggleActive = async (r) => {
    try {
      await adminApi.updateVendorRateCard(vendorId, r.id, { active: !r.active });
      onChanged();
    } catch (err) {
      toast.error(err?.message || 'Could not toggle rate.');
    }
  };

  const remove = async (r) => {
    try {
      await adminApi.deleteVendorRateCard(vendorId, r.id);
      onChanged();
    } catch (err) {
      toast.error(err?.message || 'Could not delete rate.');
    }
  };

  return (
    <Card title={`Rate cards · ${rateCards.length}`} icon="fa-tags"
      action={!adding && (
        <button type="button" className="btn btn-ghost btn-small" onClick={() => setAdding(true)}>
          <i className="fas fa-plus" aria-hidden="true" /> Add rate
        </button>
      )}
    >
      {adding && (
        <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 14, alignItems: 'end' }}>
          <input className="admin-input" placeholder="Item name" required value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} />
          <input className="admin-input" placeholder="Unit (kg / each / hour)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          <input className="admin-input" type="number" min="0" step="0.01" placeholder="Unit price" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setAdding(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-small">Add</button>
          </div>
        </form>
      )}

      {rateCards.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No rate cards yet. Add known prices so PO line entry stays fast and consistent.</p>
      ) : (
        <table className="admin-table" style={{ marginTop: 0 }}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Unit</th>
              <th style={{ textAlign: 'right' }}>Price</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rateCards.map((r) => (
              <tr key={r.id}>
                <td><div className="admin-cell-title" style={{ fontSize: 13 }}>{r.itemName}</div></td>
                <td className="admin-cell-sub">{r.unit}</td>
                <td style={{ textAlign: 'right' }} className="admin-cell-strong">
                  {fmtMoney(r.unitPriceCents, r.currency || currency)}
                </td>
                <td>
                  <span className={`status-badge ${r.active ? 'approved' : 'pending'}`}>
                    {r.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="actions">
                  <button type="button" className="btn btn-ghost btn-small" style={{ fontSize: 11 }} onClick={() => toggleActive(r)}>
                    {r.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button type="button" className="btn btn-ghost btn-small" style={{ fontSize: 11 }} onClick={() => remove(r)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

/* ─── PO history ─────────────────────────────────────────── */

function PurchaseOrdersListCard({ pos, navigate }) {
  return (
    <Card
      title={`Purchase orders · ${pos.length}`}
      icon="fa-file-invoice-dollar"
      action={
        <button
          type="button"
          className="btn btn-ghost btn-small"
          onClick={() => navigate('/admin/purchase-orders')}
        >
          All POs <i className="fas fa-arrow-right" aria-hidden="true" />
        </button>
      }
    >
      {pos.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No POs raised against this vendor yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pos.map((p) => {
            const cfg = PO_STATUS[p.status] || PO_STATUS.draft;
            return (
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
                  <span className={`status-badge ${cfg.cls}`}>{cfg.label}</span>
                  {p.bookingReference && (
                    <span className="admin-cell-sub">· booking {p.bookingReference}</span>
                  )}
                  <span style={{ marginLeft: 'auto', fontWeight: 600 }}>
                    {fmtMoney(p.totalCents, p.currency)}
                  </span>
                </div>
                <div className="admin-cell-sub" style={{ marginTop: 4, display: 'flex', gap: 12 }}>
                  {p.issueDate && <span>Issued {fmtDate(p.issueDate)}</span>}
                  {p.expectedDelivery && <span>Due {fmtDate(p.expectedDelivery)}</span>}
                  <span>Paid {fmtMoney(p.paidCents, p.currency)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/* ─── Address ─────────────────────────────────────────── */

function AddressCard({ vendor, onPatch }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    addressLine1: vendor.addressLine1 || '',
    addressLine2: vendor.addressLine2 || '',
    city: vendor.city || '',
    state: vendor.state || '',
    pincode: vendor.pincode || '',
  });
  useEffect(() => setForm({
    addressLine1: vendor.addressLine1 || '',
    addressLine2: vendor.addressLine2 || '',
    city: vendor.city || '',
    state: vendor.state || '',
    pincode: vendor.pincode || '',
  }), [vendor]);

  const submit = async (e) => {
    e.preventDefault();
    await onPatch(form, 'Address saved.');
    setEditing(false);
  };

  return (
    <Card title="Address" icon="fa-location-dot" action={
      editing ? (
        <button type="button" className="btn btn-ghost btn-small" onClick={() => setEditing(false)}>Cancel</button>
      ) : (
        <button type="button" className="btn btn-ghost btn-small" onClick={() => setEditing(true)}>
          <i className="fas fa-pen" aria-hidden="true" /> Edit
        </button>
      )
    }>
      {!editing ? (
        <p style={{ margin: 0, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
          {[vendor.addressLine1, vendor.addressLine2, vendor.city, vendor.state, vendor.pincode]
            .filter(Boolean).join('\n') || '—'}
        </p>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input className="admin-input" placeholder="Address line 1" value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} />
          <input className="admin-input" placeholder="Address line 2" value={form.addressLine2} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <input className="admin-input" placeholder="City"    value={form.city}    onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input className="admin-input" placeholder="State"   value={form.state}   onChange={(e) => setForm({ ...form, state: e.target.value })} />
            <input className="admin-input" placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary btn-small" style={{ alignSelf: 'flex-end' }}>Save</button>
        </form>
      )}
    </Card>
  );
}

/* ─── Compliance ───────────────────────────────────────── */

function ComplianceCard({ vendor, onPatch }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    gstNumber: vendor.gstNumber || '',
    panNumber: vendor.panNumber || '',
    website: vendor.website || '',
  });

  const submit = async (e) => {
    e.preventDefault();
    await onPatch(form, 'Compliance details saved.');
    setEditing(false);
  };

  return (
    <Card title="Compliance" icon="fa-shield-halved" action={
      editing ? (
        <button type="button" className="btn btn-ghost btn-small" onClick={() => setEditing(false)}>Cancel</button>
      ) : (
        <button type="button" className="btn btn-ghost btn-small" onClick={() => setEditing(true)}>
          <i className="fas fa-pen" aria-hidden="true" /> Edit
        </button>
      )
    }>
      {!editing ? (
        <ul className="admin-info-list" style={{ marginTop: 0 }}>
          <li><i className="fas fa-receipt" aria-hidden="true" /> GST: {vendor.gstNumber || '—'}</li>
          <li><i className="fas fa-id-card" aria-hidden="true" /> PAN: {vendor.panNumber || '—'}</li>
          <li>
            <i className="fas fa-globe" aria-hidden="true" />{' '}
            {vendor.website ? <a href={vendor.website} target="_blank" rel="noreferrer">{vendor.website}</a> : '—'}
          </li>
        </ul>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input className="admin-input" placeholder="GST number" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
          <input className="admin-input" placeholder="PAN number" value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value })} />
          <input className="admin-input" placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <button type="submit" className="btn btn-primary btn-small" style={{ alignSelf: 'flex-end' }}>Save</button>
        </form>
      )}
    </Card>
  );
}

/* ─── Tags ─────────────────────────────────────────────── */

function TagsCard({ vendorId, current, onChanged, toast }) {
  /* Tags are now plain strings on the vendor row. There's no registry to
   * maintain — assignments populate the universe of tags directly. */
  const [available, setAvailable] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  const currentArr = useMemo(() =>
    Array.from(current || []).map((t) => String(t).toLowerCase()),
  [current]);
  const currentSet = useMemo(() => new Set(currentArr), [currentArr]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listTags('vendor');
      setAvailable(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.message || 'Could not load tags.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const persist = async (next) => {
    try {
      await adminApi.setVendorTags(vendorId, next);
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
    const name = newName.trim().toLowerCase();
    if (!name) return;
    setNewName('');
    if (currentSet.has(name)) return;
    await persist([...currentArr, name]);
    load();
  };

  const palette = useMemo(() => {
    const union = new Set([...available, ...currentArr]);
    return Array.from(union).sort();
  }, [available, currentArr]);

  return (
    <Card title="Tags" icon="fa-tags">
      {loading ? (
        <div className="admin-loading"><div className="admin-spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {palette.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              No vendor tags yet. Type one below to apply.
            </p>
          )}
          {palette.map((tag) => {
            const active = currentSet.has(tag);
            return (
              <button key={tag} type="button" onClick={() => toggle(tag)} style={{
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: active ? 'var(--color-primary)' : '#fff',
                color: active ? '#fff' : 'var(--text-primary)',
                cursor: 'pointer',
              }}>
                {active && <i className="fas fa-check" aria-hidden="true" style={{ marginRight: 6 }} />}
                {tag}
              </button>
            );
          })}
        </div>
      )}
      <form onSubmit={create} style={{ display: 'flex', gap: 6 }}>
        <input className="admin-input" placeholder="Add a tag…" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ flex: 1 }} />
        <button type="submit" className="btn btn-primary btn-small" disabled={!newName.trim()}>Apply</button>
      </form>
    </Card>
  );
}

/* ─── Danger / archive ────────────────────────────────── */

function DangerCard({ vendor, navigate, onChanged, toast }) {
  const [confirming, setConfirming] = useState(false);

  const archive = async (status) => {
    try {
      await adminApi.updateVendor(vendor.id, { status });
      toast.success(`Vendor set to ${status}.`);
      onChanged();
    } catch (err) {
      toast.error(err?.message || 'Could not update status.');
    }
  };

  const remove = async () => {
    try {
      await adminApi.deleteVendor(vendor.id);
      toast.success('Vendor deleted.');
      navigate('/admin/vendors');
    } catch (err) {
      toast.error(err?.message || 'Could not delete vendor.');
      setConfirming(false);
    }
  };

  return (
    <Card title="Lifecycle" icon="fa-triangle-exclamation">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {vendor.status !== 'inactive' && (
          <button type="button" className="btn btn-ghost btn-small" onClick={() => archive('inactive')}>
            <i className="fas fa-pause" aria-hidden="true" /> Mark inactive
          </button>
        )}
        {vendor.status !== 'blocked' && (
          <button type="button" className="btn btn-ghost btn-small" onClick={() => archive('blocked')}>
            <i className="fas fa-ban" aria-hidden="true" /> Block vendor
          </button>
        )}
        {vendor.status !== 'active' && (
          <button type="button" className="btn btn-ghost btn-small" onClick={() => archive('active')}>
            <i className="fas fa-check" aria-hidden="true" /> Reinstate
          </button>
        )}
        {!confirming ? (
          <button type="button" className="btn btn-ghost btn-small" style={{ color: 'var(--color-error, #b91c1c)' }} onClick={() => setConfirming(true)}>
            <i className="fas fa-trash" aria-hidden="true" /> Delete vendor
          </button>
        ) : (
          <div style={{ padding: 10, borderRadius: 8, background: 'rgba(185, 28, 28, 0.06)' }}>
            <p style={{ margin: '0 0 8px', fontSize: 13 }}>
              Vendors with PO history can't be deleted — set them to inactive instead. Continue?
            </p>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost btn-small" onClick={() => setConfirming(false)}>Cancel</button>
              <button type="button" className="btn btn-primary btn-small" onClick={remove}>Delete</button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ─── Primitives ──────────────────────────────────────── */

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
      <dd style={{ margin: '4px 0 0', color: 'var(--text-primary)', textTransform: label === 'Category' || label === 'Status' || label === 'Payment terms' ? 'capitalize' : 'none' }}>
        {value ?? '—'}
      </dd>
    </div>
  );
}

function FieldInput({ label, name, value, onChange, type = 'text', placeholder }) {
  return (
    <label className="form-group" style={{ minWidth: 0 }}>
      {label}
      <input className="admin-input" name={name} type={type} value={value ?? ''} onChange={onChange} placeholder={placeholder} />
    </label>
  );
}
