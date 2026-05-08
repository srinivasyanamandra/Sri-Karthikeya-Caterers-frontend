/**
 * VendorsPage — directory of every supplier.
 *
 * Hub for the supply side of the business: filterable list with category
 * pills, search across name + contact, KPI strip showing active vendors
 * by category, and an "Add vendor" modal that creates a real Vendor row
 * via /api/admin/vendors. Row click opens VendorDetailPage where contacts,
 * rate cards, and PO history live.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPageHero from '../../components/admin/layout/AdminPageHero';
import AdminPortal from '../../components/admin/shared/AdminPortal';
import { useToast } from './useToast';
import { useDebounce, useEscapeKey, useFocusTrap } from './adminHooks';
import { admin as adminApi } from '../../services/api';

/* Curated vendor categories — must mirror the Vendor.VendorCategory enum
 * on the backend. The frontend doesn't fetch these from the server; if a
 * new category is added on the server it should be added here too. */
const CATEGORIES = [
  { id: 'all',             label: 'All' },
  { id: 'decor',           label: 'Decor' },
  { id: 'florist',         label: 'Florist' },
  { id: 'lighting',        label: 'Lighting' },
  { id: 'equipment',       label: 'Equipment' },
  { id: 'transport',       label: 'Transport' },
  { id: 'staffing',        label: 'Staffing' },
  { id: 'raw_ingredients', label: 'Raw ingredients' },
  { id: 'beverages',       label: 'Beverages' },
  { id: 'entertainment',   label: 'Entertainment' },
  { id: 'venue',           label: 'Venue' },
  { id: 'photography',     label: 'Photography' },
  { id: 'miscellaneous',   label: 'Miscellaneous' },
];

const STATUS_BADGE = {
  active:   { label: 'Active',   cls: 'approved' },
  inactive: { label: 'Inactive', cls: 'pending' },
  blocked:  { label: 'Blocked',  cls: 'declined' },
};

const fmtMoney = (cents, currency = 'INR') => {
  if (!cents) return '—';
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

const labelForCategory = (id) =>
  CATEGORIES.find((c) => c.id === id)?.label || id;

export default function VendorsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [category, setCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchRaw, setSearchRaw] = useState('');
  const search = useDebounce(searchRaw, 280);
  const [showAdd, setShowAdd] = useState(false);

  const reload = useCallback(() => {
    setLoading(true);
    return adminApi
      .listVendors({
        category: category !== 'all' ? category : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        q: search || undefined,
        page: 0,
        size: 200,
        sortField: 'createdAt',
        sortDir: 'desc',
      })
      .then((data) => {
        setVendors(Array.isArray(data?.items) ? data.items : []);
        setLoadError('');
      })
      .catch((err) => setLoadError(err?.message || 'Could not load vendors.'))
      .finally(() => setLoading(false));
  }, [category, statusFilter, search]);

  useEffect(() => { reload(); }, [reload]);

  const stats = useMemo(() => {
    const totalActive = vendors.filter((v) => v.status === 'active').length;
    const blocked = vendors.filter((v) => v.status === 'blocked').length;
    const totalSpend = vendors.reduce((s, v) => s + (v.totalSpendCents || 0), 0);
    const outstanding = vendors.reduce((s, v) => s + (v.outstandingCents || 0), 0);
    return { totalActive, blocked, totalSpend, outstanding };
  }, [vendors]);

  const handleAdded = useCallback((vendor) => {
    setShowAdd(false);
    toast.success(`${vendor.name} added.`);
    if (vendor?.id) navigate(`/admin/vendors/${vendor.id}`);
  }, [navigate, toast]);

  return (
    <>
      <AdminPageHero
        eyebrow="Supply"
        icon="fa-store"
        title="Vendors"
        subtitle={`${vendors.length} vendor${vendors.length === 1 ? '' : 's'} loaded`}
        intro="Suppliers across decor, florals, equipment, transport, staffing and raw materials. Track contacts, rate cards, and every purchase order in one place."
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={reload} disabled={loading}>
              <i className={`fas fa-sync${loading ? ' fa-spin' : ''}`} aria-hidden="true" /> Refresh
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <i className="fas fa-plus" aria-hidden="true" /> Add vendor
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
            <SummaryCard icon="fa-store"      label="Active vendors" value={stats.totalActive} />
            <SummaryCard icon="fa-ban"        label="Blocked"        value={stats.blocked} tone="danger" />
            <SummaryCard icon="fa-rupee-sign" label="Total spend"     value={fmtMoney(stats.totalSpend)} />
            <SummaryCard icon="fa-hand-holding-dollar" label="Outstanding" value={fmtMoney(stats.outstanding)} tone="warning" />
          </div>

          {/* Toolbar — category pills + status select + search */}
          <div className="admin-toolbar" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div className="admin-toolbar-left" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className="btn btn-ghost"
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                    background: category === c.id ? 'var(--color-primary)' : undefined,
                    color: category === c.id ? '#fff' : undefined,
                    borderColor: category === c.id ? 'var(--color-primary)' : undefined,
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
              <select
                className="admin-input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                style={{ width: 130 }}
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
              <label className="admin-search" htmlFor="vendor-search">
                <i className="fas fa-search" aria-hidden="true" />
                <input
                  id="vendor-search"
                  type="search"
                  placeholder="Name, contact, email…"
                  value={searchRaw}
                  onChange={(e) => setSearchRaw(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="admin-table-container">
            <div className="admin-table-header">
              <h3 className="admin-table-title">Vendor list</h3>
              <div className="admin-table-actions" style={{ fontSize: 12, color: 'var(--text-light)' }}>
                {vendors.length} result{vendors.length !== 1 ? 's' : ''}
              </div>
            </div>

            {loading ? (
              <div className="admin-loading"><div className="admin-spinner" /></div>
            ) : vendors.length === 0 ? (
              <div className="admin-empty-state">
                <div className="admin-empty-icon">
                  <i className="fas fa-store" aria-hidden="true" />
                </div>
                <h3>No vendors yet</h3>
                <p>Add a vendor to start tracking contacts, rate cards, and purchase orders.</p>
                <button type="button" className="btn btn-primary" onClick={() => setShowAdd(true)}>
                  <i className="fas fa-plus" aria-hidden="true" /> Add a vendor
                </button>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Category</th>
                    <th>Primary contact</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Spend</th>
                    <th style={{ textAlign: 'right' }}>Outstanding</th>
                    <th style={{ textAlign: 'right' }}>POs</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((v) => {
                    const cfg = STATUS_BADGE[v.status] || STATUS_BADGE.active;
                    return (
                      <tr
                        key={v.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/admin/vendors/${v.id}`)}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(`/admin/vendors/${v.id}`)}
                        tabIndex={0}
                        role="row"
                      >
                        <td>
                          <div className="admin-cell-title">{v.name}</div>
                          {v.tags && v.tags.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                              {v.tags.slice(0, 3).map((tag) => (
                                <span key={tag} style={{
                                  fontSize: 10,
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  background: 'rgba(20,58,38,0.08)',
                                  color: 'var(--color-primary)',
                                  fontWeight: 600,
                                }}>{tag}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{
                            fontSize: 11,
                            padding: '4px 10px',
                            borderRadius: 999,
                            background: 'rgba(201,136,47,0.12)',
                            color: 'var(--color-accent-dark)',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                          }}>{labelForCategory(v.category)}</span>
                        </td>
                        <td>
                          <div className="admin-cell-title" style={{ fontSize: 13 }}>
                            {v.primaryContactName || '—'}
                          </div>
                          {v.primaryContactPhone && (
                            <div className="admin-cell-sub">{v.primaryContactPhone}</div>
                          )}
                        </td>
                        <td className="admin-cell-sub">
                          {[v.city, v.state].filter(Boolean).join(', ') || '—'}
                        </td>
                        <td><span className={`status-badge ${cfg.cls}`}>{cfg.label}</span></td>
                        <td style={{ textAlign: 'right' }} className="admin-cell-strong">
                          {fmtMoney(v.totalSpendCents, v.currency)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {(v.outstandingCents || 0) > 0 ? (
                            <span style={{ color: 'var(--color-accent-dark)', fontWeight: 600 }}>
                              {fmtMoney(v.outstandingCents, v.currency)}
                            </span>
                          ) : (
                            <span className="admin-cell-sub">Cleared</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }} className="admin-cell-strong">{v.poCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {showAdd && (
        <AddVendorModal
          onClose={() => setShowAdd(false)}
          onAdded={handleAdded}
        />
      )}
    </>
  );
}

/* ─── SummaryCard ──────────────────────────────────────────── */

function SummaryCard({ icon, label, value, tone }) {
  const color = tone === 'warning' ? 'var(--color-accent-dark)'
              : tone === 'danger'  ? 'var(--color-error, #b91c1c)'
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
        width: 38, height: 38, borderRadius: 10,
        background: 'rgba(20,58,38,0.06)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        <i className={`fas ${icon}`} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--text-light)', fontWeight: 600,
        }}>{label}</div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.4rem',
          color: 'var(--color-primary)',
          lineHeight: 1.1,
          marginTop: 2,
        }}>{value}</div>
      </div>
    </div>
  );
}

/* ─── AddVendorModal ──────────────────────────────────────── */

function AddVendorModal({ onClose, onAdded }) {
  const ref = React.useRef(null);
  useFocusTrap(ref, true);
  useEscapeKey(onClose, true);

  const [form, setForm] = useState({
    name: '',
    category: 'decor',
    primaryContactName: '',
    primaryContactPhone: '',
    primaryContactEmail: '',
    paymentTerms: 'net_30',
    city: '',
    state: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Vendor name is required';
    if (!form.category) errs.category = 'Category is required';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      const created = await adminApi.createVendor({
        name: form.name.trim(),
        category: form.category,
        primaryContactName: form.primaryContactName.trim() || null,
        primaryContactPhone: form.primaryContactPhone.trim() || null,
        primaryContactEmail: form.primaryContactEmail.trim() || null,
        paymentTerms: form.paymentTerms,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
      });
      onAdded(created);
    } catch (err) {
      if (err?.fields && typeof err.fields === 'object') {
        setErrors(err.fields);
      } else {
        setErrors({ _form: err?.message || 'Could not create vendor.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPortal>
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-content modal-md" ref={ref} role="dialog" aria-modal="true" aria-label="Add vendor">
          <div className="modal-header">
            <h2>Add vendor</h2>
            <button type="button" onClick={onClose} aria-label="Close" disabled={submitting}>
              <i className="fas fa-times" aria-hidden="true" />
            </button>
          </div>
          <form onSubmit={submit} noValidate>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {errors._form && (
                <div className="form-error" role="alert">
                  <i className="fas fa-exclamation-circle" aria-hidden="true" /> {errors._form}
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label>Vendor name <span className="req">*</span></label>
                  <input name="name" value={form.name} onChange={handle} disabled={submitting} className="admin-input" />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label>Category <span className="req">*</span></label>
                  <select name="category" value={form.category} onChange={handle} disabled={submitting} className="admin-input">
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Primary contact</label>
                  <input name="primaryContactName" value={form.primaryContactName} onChange={handle} disabled={submitting} className="admin-input" />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input name="primaryContactPhone" value={form.primaryContactPhone} onChange={handle} disabled={submitting} className="admin-input" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="primaryContactEmail" value={form.primaryContactEmail} onChange={handle} disabled={submitting} className="admin-input" />
                </div>
                <div className="form-group">
                  <label>Payment terms</label>
                  <select name="paymentTerms" value={form.paymentTerms} onChange={handle} disabled={submitting} className="admin-input">
                    <option value="advance">Advance</option>
                    <option value="on_delivery">On delivery</option>
                    <option value="net_7">Net 7</option>
                    <option value="net_15">Net 15</option>
                    <option value="net_30">Net 30</option>
                    <option value="net_45">Net 45</option>
                    <option value="net_60">Net 60</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input name="city" value={form.city} onChange={handle} disabled={submitting} className="admin-input" />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input name="state" value={form.state} onChange={handle} disabled={submitting} className="admin-input" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Adding…' : 'Add vendor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminPortal>
  );
}
