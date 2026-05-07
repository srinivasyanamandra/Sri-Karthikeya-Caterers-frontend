/**
 * CampaignsPage.jsx — operational view of every email campaign.
 *
 * The piece that was missing: admins could *create* campaigns from the
 * Subscribers wizard but had no way to see what they'd queued, how many
 * recipients had received it, what failed, or to cancel a scheduled run.
 * This page surfaces all of that and is the place admins should land
 * when something looks wrong with delivery.
 *
 * Workflow:
 *   - KPI strip → at-a-glance totals (queued / sending / sent / failed)
 *   - Filter chips → scope by status without fiddling with a select
 *   - Search → name contains
 *   - Table → status pill, recipient counts, send progress, schedule
 *   - Drawer → recipient-level delivery breakdown + cancel/retry actions
 *   - Auto-refresh while any campaign is `queued` or `sending` so progress
 *     ticks visibly without the admin reloading
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AdminPageHero from '../../components/admin/layout/AdminPageHero';
import {
  AdminButton,
  AdminConfirmDialog,
  AdminEmptyState,
  AdminLoadingState,
  AdminMetricCard,
  AdminPortal,
  AdminStatusPill,
} from '../../components/admin/shared';
import {
  useDebounce,
  useEscapeKey,
  useFocusTrap,
  usePagination,
  PaginationBar,
} from './adminHooks';
import { admin as adminApi } from '../../services/api';
import { useToast } from './useToast';
import { formatRelative, formatScheduleForDisplay } from '../../utils/datetime';

const FILTERS = [
  { id: 'all', label: 'All', icon: 'fa-list' },
  { id: 'queued', label: 'Scheduled', icon: 'fa-clock' },
  { id: 'sending', label: 'Sending', icon: 'fa-paper-plane' },
  { id: 'sent', label: 'Sent', icon: 'fa-circle-check' },
  { id: 'failed', label: 'Failed', icon: 'fa-circle-exclamation' },
  { id: 'draft', label: 'Drafts', icon: 'fa-pen-to-square' },
  { id: 'cancelled', label: 'Cancelled', icon: 'fa-ban' },
];

const ACTIVE_STATUSES = new Set(['queued', 'sending']);

/* ─── Page ────────────────────────────────────────────────── */

const CampaignsPage = () => {
  const { toast } = useToast();
  const [filter, setFilter] = useState('all');
  const [searchRaw, setSearchRaw] = useState('');
  const search = useDebounce(searchRaw, 300);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [drawer, setDrawer] = useState(null); // open campaign id
  const [confirm, setConfirm] = useState(null); // { id, action }
  const [actionLoading, setActionLoading] = useState(false);

  /* Reload — handles initial load, manual refresh, and the polling loop. */
  const reload = useCallback(
    ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      return adminApi
        .listCampaigns({
          status: filter === 'all' ? undefined : filter,
          q: search || undefined,
          page: 0,
          size: 100,
          sortField: 'createdAt',
          sortDir: 'desc',
        })
        .then((data) => {
          const items = Array.isArray(data?.items) ? data.items : [];
          setCampaigns(items);
          setLoadError('');
        })
        .catch((err) => {
          if (!silent) setLoadError(err?.message || 'Could not load campaigns.');
        })
        .finally(() => {
          if (!silent) setLoading(false);
        });
    },
    [filter, search]
  );

  useEffect(() => {
    reload();
  }, [reload]);

  /* Auto-poll while any campaign is queued/sending. Stops when nothing is
     in flight to avoid hammering the API. */
  const hasInFlight = useMemo(
    () => campaigns.some((c) => ACTIVE_STATUSES.has((c.status || '').toLowerCase())),
    [campaigns]
  );

  useEffect(() => {
    if (!hasInFlight) return undefined;
    const id = setInterval(() => reload({ silent: true }), 15_000);
    return () => clearInterval(id);
  }, [hasInFlight, reload]);

  /* ── KPIs from current page (good enough for an at-a-glance strip) ── */

  const kpis = useMemo(() => {
    const init = { queued: 0, sending: 0, sent: 0, failed: 0, totalSent: 0 };
    return campaigns.reduce((acc, c) => {
      const s = (c.status || '').toLowerCase();
      if (s in acc) acc[s] += 1;
      acc.totalSent += c.sentCount || 0;
      return acc;
    }, init);
  }, [campaigns]);

  const pagination = usePagination(campaigns, 15);

  const handleCancel = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      await adminApi.cancelCampaign(confirm.id);
      toast.success('Campaign cancelled.');
      setConfirm(null);
      await reload();
    } catch (err) {
      toast.error(err?.message || 'Could not cancel campaign.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetry = async (id) => {
    try {
      await adminApi.sendCampaign(id, { scheduleAt: null });
      toast.success('Campaign re-queued.');
      reload();
    } catch (err) {
      toast.error(err?.message || 'Could not re-queue campaign.');
    }
  };

  return (
    <>
      <AdminPageHero
        eyebrow="Marketing"
        icon="fa-bullhorn"
        title="Campaigns"
        subtitle={`${campaigns.length.toLocaleString('en-IN')} campaign${
          campaigns.length === 1 ? '' : 's'
        } · ${kpis.queued} scheduled · ${kpis.sending} sending`}
        intro="Track every email campaign — what's queued, what's sending, what landed, and what failed. Cancel scheduled runs or retry failed ones from here."
        actions={
          <AdminButton
            variant="ghost"
            icon="fa-rotate"
            onClick={() => reload()}
            loading={loading}
          >
            Refresh
          </AdminButton>
        }
      />

      <section className="section">
        <div className="container">
          <div className="admin-metric-grid">
            <AdminMetricCard
              label="Scheduled"
              value={kpis.queued}
              tone="info"
              icon="fa-clock"
              hint="Awaiting dispatch"
              loading={loading}
              delay={0}
            />
            <AdminMetricCard
              label="Sending"
              value={kpis.sending}
              tone="warning"
              icon="fa-paper-plane"
              hint="In flight now"
              loading={loading}
              delay={80}
            />
            <AdminMetricCard
              label="Delivered"
              value={kpis.totalSent}
              tone="success"
              icon="fa-circle-check"
              hint="Across all visible campaigns"
              loading={loading}
              delay={160}
            />
            <AdminMetricCard
              label="Failed"
              value={kpis.failed}
              tone={kpis.failed > 0 ? 'danger' : 'neutral'}
              icon="fa-circle-exclamation"
              hint={kpis.failed > 0 ? 'Needs review' : 'All clean'}
              loading={loading}
              delay={240}
            />
          </div>

          {loadError && (
            <div className="form-error" role="alert" style={{ marginBottom: 16 }}>
              <i className="fas fa-exclamation-circle" aria-hidden="true" /> {loadError}
              <button type="button" className="btn-link" style={{ marginLeft: 12 }} onClick={() => reload()}>
                Retry
              </button>
            </div>
          )}

          <div className="admin-toolbar">
            <div className="admin-toolbar-left">
              <label className="admin-search">
                <i className="fas fa-search" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search campaigns by name…"
                  value={searchRaw}
                  onChange={(e) => setSearchRaw(e.target.value)}
                  aria-label="Search campaigns"
                />
              </label>
              <div className="admin-filter-chips" role="tablist" aria-label="Filter by status">
                {FILTERS.map((f) => (
                  <button
                    type="button"
                    key={f.id}
                    role="tab"
                    aria-selected={filter === f.id}
                    className={`admin-chip${filter === f.id ? ' is-active' : ''}`}
                    onClick={() => setFilter(f.id)}
                  >
                    <i className={`fas ${f.icon}`} aria-hidden="true" /> {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="admin-table-container">
            {loading ? (
              <AdminLoadingState variant="skeleton" rows={6} />
            ) : campaigns.length === 0 ? (
              <AdminEmptyState
                icon="fa-bullhorn"
                title={search || filter !== 'all' ? 'No matching campaigns' : 'No campaigns yet'}
                description={
                  search || filter !== 'all'
                    ? 'Try clearing filters or adjusting the search term.'
                    : 'Launch your first campaign from the Subscribers page.'
                }
              />
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Status</th>
                    <th>Recipients</th>
                    <th>Progress</th>
                    <th>Schedule</th>
                    <th className="actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.slice.map((c) => {
                    const status = (c.status || '').toLowerCase();
                    const total = c.totalRecipients || 0;
                    const sent = c.sentCount || 0;
                    const failed = c.failedCount || 0;
                    const pct = total === 0 ? 0 : Math.min(100, Math.round((sent / total) * 100));
                    const scheduleIso = c.scheduledAt;
                    return (
                      <tr key={c.id} onClick={() => setDrawer(c.id)} style={{ cursor: 'pointer' }}>
                        <td>
                          <div className="admin-cell-title">{c.name}</div>
                          <div className="admin-cell-sub">
                            Created {formatScheduleForDisplay(c.createdAt, { withTimezone: false })}
                          </div>
                        </td>
                        <td>
                          <AdminStatusPill status={status} />
                        </td>
                        <td>
                          <strong>{total.toLocaleString('en-IN')}</strong>
                          <div className="admin-cell-sub">
                            {sent.toLocaleString('en-IN')} sent
                            {failed > 0 ? ` · ${failed} failed` : ''}
                          </div>
                        </td>
                        <td style={{ minWidth: 160 }}>
                          <div className="admin-progress" aria-label={`${pct}% sent`}>
                            <div
                              className={`admin-progress-bar admin-progress-bar-${
                                failed > 0 ? 'mixed' : 'success'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="admin-cell-sub">{pct}%</span>
                        </td>
                        <td>
                          {status === 'queued' && scheduleIso ? (
                            <>
                              <div className="admin-cell-strong">
                                {formatScheduleForDisplay(scheduleIso)}
                              </div>
                              <div className="admin-cell-sub">{formatRelative(scheduleIso)}</div>
                            </>
                          ) : status === 'sent' && c.completedAt ? (
                            <>
                              <div className="admin-cell-strong">Sent</div>
                              <div className="admin-cell-sub">
                                {formatScheduleForDisplay(c.completedAt, { withTimezone: false })}
                              </div>
                            </>
                          ) : status === 'sending' && c.startedAt ? (
                            <>
                              <div className="admin-cell-strong">Started</div>
                              <div className="admin-cell-sub">
                                {formatRelative(c.startedAt)}
                              </div>
                            </>
                          ) : (
                            <span className="admin-cell-sub">—</span>
                          )}
                        </td>
                        <td className="actions" onClick={(e) => e.stopPropagation()}>
                          {(status === 'queued' || status === 'sending') && (
                            <AdminButton
                              variant="ghost"
                              size="sm"
                              icon="fa-ban"
                              onClick={() => setConfirm({ id: c.id, action: 'cancel', name: c.name })}
                            >
                              Cancel
                            </AdminButton>
                          )}
                          {status === 'failed' && (
                            <AdminButton
                              variant="secondary"
                              size="sm"
                              icon="fa-rotate"
                              onClick={() => handleRetry(c.id)}
                            >
                              Retry
                            </AdminButton>
                          )}
                          <AdminButton
                            variant="ghost"
                            size="sm"
                            icon="fa-arrow-right"
                            iconPosition="right"
                            onClick={() => setDrawer(c.id)}
                          >
                            View
                          </AdminButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {!loading && campaigns.length > 0 && (
              <PaginationBar pagination={pagination} label="campaigns" />
            )}
          </div>
        </div>
      </section>

      <AdminConfirmDialog
        open={!!confirm}
        title="Cancel this campaign?"
        description={
          confirm
            ? `"${confirm.name}" will stop dispatching. Already-sent emails cannot be recalled.`
            : ''
        }
        confirmLabel="Cancel campaign"
        cancelLabel="Keep it"
        tone="danger"
        loading={actionLoading}
        onConfirm={handleCancel}
        onCancel={() => !actionLoading && setConfirm(null)}
      />

      {drawer && (
        <CampaignDrawer
          campaignId={drawer}
          onClose={() => setDrawer(null)}
          onChanged={() => reload()}
        />
      )}
    </>
  );
};

/* ─── Drawer — campaign detail + recipient delivery breakdown ─────── */

const CampaignDrawer = ({ campaignId, onClose, onChanged }) => {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recipientPage, setRecipientPage] = useState(0);
  const surfaceRef = useRef(null);
  useEscapeKey(onClose);
  useFocusTrap(surfaceRef);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminApi
      .getCampaign(campaignId, { recipientPage, recipientSize: 25 })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err?.message || 'Could not load campaign.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [campaignId, recipientPage, toast]);

  /* Lock body scroll while the drawer is open. */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const status = ((data?.status) || '').toLowerCase();
  const recipients = data?.recipients?.items || [];
  const recipientTotal = data?.recipients?.total || 0;

  return (
    <AdminPortal>
      <div className="admin-drawer-overlay" onClick={onClose}>
        <aside
          ref={surfaceRef}
          className="admin-drawer admin-drawer-wide"
          role="dialog"
          aria-modal="true"
          aria-label="Campaign details"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="admin-drawer-header">
            <div>
              <h2 className="admin-drawer-title">{data?.name || 'Campaign'}</h2>
              {data && (
                <div className="admin-drawer-meta">
                  <AdminStatusPill status={status} />
                  {data.scheduledAt && (
                    <span className="admin-cell-sub">
                      <i className="fas fa-clock" aria-hidden="true" />{' '}
                      {formatScheduleForDisplay(data.scheduledAt)}
                    </span>
                  )}
                </div>
              )}
            </div>
            <AdminButton variant="ghost" icon="fa-times" onClick={onClose} ariaLabel="Close" />
          </header>

          <div className="admin-drawer-body">
            {loading ? (
              <AdminLoadingState />
            ) : !data ? (
              <AdminEmptyState
                icon="fa-circle-exclamation"
                title="Could not load campaign"
                description="Try closing and reopening this drawer."
              />
            ) : (
              <>
                <div className="admin-metric-row">
                  <div className="admin-metric-mini">
                    <span className="label">Recipients</span>
                    <span className="value">{(data.totalRecipients || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="admin-metric-mini">
                    <span className="label">Sent</span>
                    <span className="value">{(data.sentCount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="admin-metric-mini">
                    <span className="label">Failed</span>
                    <span className="value">{(data.failedCount || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <h3 className="admin-drawer-section-title">Recipient delivery</h3>
                {recipients.length === 0 ? (
                  <AdminEmptyState
                    icon="fa-user-friends"
                    title="No recipients on this page"
                    description="Try a different page."
                  />
                ) : (
                  <table className="admin-table admin-table-compact">
                    <thead>
                      <tr>
                        <th>Recipient</th>
                        <th>Status</th>
                        <th>Sent</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipients.map((r, i) => (
                        <tr key={`${r.kind}:${r.id}:${i}`}>
                          <td>
                            <div className="admin-cell-title">{r.name || r.email}</div>
                            <div className="admin-cell-sub">{r.email}</div>
                          </td>
                          <td>
                            <AdminStatusPill
                              status={
                                r.deliveryStatus === 'sent'
                                  ? 'sent'
                                  : r.deliveryStatus === 'failed'
                                  ? 'failed'
                                  : r.deliveryStatus === 'skipped'
                                  ? 'cancelled'
                                  : 'queued'
                              }
                              label={r.deliveryStatus || 'pending'}
                              size="sm"
                            />
                          </td>
                          <td className="admin-cell-sub">
                            {r.sentAt ? formatScheduleForDisplay(r.sentAt, { withTimezone: false }) : '—'}
                          </td>
                          <td className="admin-cell-sub">
                            {r.error || r.skipReason || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {recipientTotal > 25 && (
                  <div className="admin-pagination">
                    <div className="admin-pagination-info">
                      Showing recipients {recipientPage * 25 + 1}–
                      {Math.min((recipientPage + 1) * 25, recipientTotal)} of {recipientTotal}
                    </div>
                    <div className="admin-pagination-controls">
                      <button
                        type="button"
                        className="admin-pagination-btn"
                        disabled={recipientPage === 0}
                        onClick={() => setRecipientPage((p) => Math.max(0, p - 1))}
                      >
                        <i className="fas fa-chevron-left" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="admin-pagination-btn"
                        disabled={(recipientPage + 1) * 25 >= recipientTotal}
                        onClick={() => setRecipientPage((p) => p + 1)}
                      >
                        <i className="fas fa-chevron-right" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {data && (status === 'queued' || status === 'sending') && (
            <footer className="admin-drawer-footer">
              <AdminButton
                variant="danger"
                icon="fa-ban"
                onClick={async () => {
                  try {
                    await adminApi.cancelCampaign(campaignId);
                    toast.success('Campaign cancelled.');
                    onChanged?.();
                    onClose();
                  } catch (err) {
                    toast.error(err?.message || 'Could not cancel.');
                  }
                }}
              >
                Cancel campaign
              </AdminButton>
            </footer>
          )}
          {data && status === 'failed' && (
            <footer className="admin-drawer-footer">
              <AdminButton
                variant="primary"
                icon="fa-rotate"
                onClick={async () => {
                  try {
                    await adminApi.sendCampaign(campaignId, { scheduleAt: null });
                    toast.success('Campaign re-queued.');
                    onChanged?.();
                    onClose();
                  } catch (err) {
                    toast.error(err?.message || 'Could not re-queue.');
                  }
                }}
              >
                Retry failed sends
              </AdminButton>
            </footer>
          )}
        </aside>
      </div>
    </AdminPortal>
  );
};

export default CampaignsPage;
