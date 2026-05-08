/**
 * AdminDashboardPage.jsx — World-class admin dashboard
 *
 * Features:
 *  ✦ Animated count-up for all stat cards (ease-out-quart from 0 → value)
 *  ✦ Live clock in the hero section
 *  ✦ Staggered entrance animations for stat cards + quick actions
 *  ✦ Activity items link to the correct admin page
 *  ✦ Keyboard navigation on activity table rows
 *  ✦ Dynamic greeting (morning/afternoon/evening)
 *  ✦ "Mark all read" for activity log
 *  ✦ Responsive layout matches existing CSS grid classes
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigation } from '../../contexts/NavigationContext';
import AdminPageHero from '../../components/admin/layout/AdminPageHero';
import {
  AdminButton,
  AdminEmptyState,
  AdminLoadingState,
  AdminMetricCard,
  AdminStatusPill,
} from '../../components/admin/shared';
/* useAnimatedCounter is consumed inside AdminMetricCard now — no direct
   imports here after the dashboard switched from AnimatedStatCard. */
import { admin as adminApi } from '../../services/api';
import { formatRelative, formatScheduleForDisplay } from '../../utils/datetime';

/* ─── Constants ───────────────────────────────────────────── */

const STATUS_META = {
  pending: { icon: 'fa-clock', label: 'Pending', cls: 'pending' },
  success: { icon: 'fa-check', label: 'Done', cls: 'approved' },
  info: { icon: 'fa-info-circle', label: 'Info', cls: 'active' },
};

const TYPE_ICON = {
  review:      { icon: 'fa-star', color: 'var(--color-accent-dark)' },
  quote:       { icon: 'fa-file-alt', color: 'var(--color-primary)' },
  email:       { icon: 'fa-envelope', color: 'var(--color-success)' },
  client:      { icon: 'fa-user', color: '#6366f1' },
  booking:     { icon: 'fa-calendar-check', color: 'var(--color-primary)' },
  vendor:      { icon: 'fa-store', color: 'var(--color-accent-dark)' },
  po:          { icon: 'fa-file-invoice-dollar', color: 'var(--color-primary)' },
  invoice:     { icon: 'fa-file-invoice', color: 'var(--color-primary)' },
  transaction: { icon: 'fa-arrow-right-arrow-left', color: 'var(--color-success)' },
};

/* Activity is sourced exclusively from the backend's /api/admin/dashboard
   `recentActivity` array. We deliberately start with an empty list so the
   dashboard never displays fabricated rows during the initial load — the
   skeleton/empty-state handles the "no data yet" case honestly. */
const INITIAL_ACTIVITY = [];

/* ─── Sub-components ──────────────────────────────────────── */

/* The bespoke AnimatedStatCard was retired during the admin UX uplift —
   KPI tiles now use AdminMetricCard from the shared primitives so
   Dashboard / Subscribers / Campaigns share one visual language. */

/**
 * LiveClock — updates every second
 */
function LiveClock() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const formatted = time.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const day = time.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="admin-clock" aria-live="polite" aria-label={`Current time: ${formatted}`}>
      <span className="admin-clock-time">{formatted}</span>
      <span className="admin-clock-day">{day}</span>
    </div>
  );
}

/**
 * DynamicGreeting — morning/afternoon/evening
 */
function DynamicGreeting() {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return <span>{greeting}</span>;
}

/**
 * Map a system_logs row → admin page id for activity-row click-through.
 *
 * Quote-typed log entries also cover booking lifecycle events
 * (booking_created, booking_converted, booking_updated). When the action
 * starts with "booking_" we route to the bookings list instead of quotes
 * so the click lands on the right surface.
 */
const pageForActivity = (row) => {
  const t = row?.type;
  const action = row?.action || '';
  const entityType = row?.entityType;
  if (entityType === 'booking'        || action.startsWith('booking_')) return 'admin-bookings';
  if (entityType === 'vendor'         || action.startsWith('vendor_'))  return 'admin-vendors';
  if (entityType === 'purchase_order' || action.startsWith('po_'))      return 'admin-purchase-orders';
  if (entityType === 'invoice'        || action.startsWith('invoice_')) return 'admin-invoices';
  if (entityType === 'transaction'    ||
      action === 'payment_recorded' || action === 'payment_refunded' ||
      action === 'expense_recorded' || action === 'transaction_updated' ||
      action === 'transaction_deleted') return 'admin-transactions';
  switch (t) {
    case 'review': return 'admin-reviews';
    case 'quote': return 'admin-quotes';
    case 'email':
    case 'campaign': return 'admin-subscribers';
    case 'client': return 'admin-clients';
    case 'auth': return 'admin-dashboard';
    default: return 'admin-dashboard';
  }
};

/* ─── Main Page ───────────────────────────────────────────── */

const AdminDashboardPage = () => {
  const { navigate } = useNavigation();

  const [stats, setStats] = useState({
    totalClients: 0,
    pendingQuotes: 0,
    pendingReviews: 0,
    activeSubscribers: 0,
    bookingsConfirmed: 0,
    bookingsInProgress: 0,
    bookingsUpcomingThisMonth: 0,
    vendorsActive: 0,
    posDraft: 0,
    posIssued: 0,
    posOutstandingCents: 0,
    invoicesOutstandingCents: 0,
    revenueThisMonthCents: 0,
    expensesThisMonthCents: 0,
    netCashFlowThisMonthCents: 0,
  });
  const [trends, setTrends] = useState({
    newClientsThisMonth: 0,
    newQuotesThisMonth: 0,
    campaignsSentThisMonth: 0,
    emailsDeliveredThisMonth: 0,
    bookingsUpcoming: 0,
  });
  const [activity, setActivity] = useState(INITIAL_ACTIVITY);
  const [scheduledCampaigns, setScheduledCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      adminApi.dashboard(),
      /* Surface up to 5 in-flight campaigns (queued or sending). The
         dashboard "Upcoming dispatch" widget uses this so admins see at a
         glance what's about to fire — and can click straight through to
         cancel if something looks wrong. */
      adminApi
        .listCampaigns({
          status: 'queued',
          page: 0,
          size: 5,
          sortField: 'scheduledAt',
          sortDir: 'asc',
        })
        .catch(() => ({ items: [] })),
      adminApi
        .listCampaigns({
          status: 'sending',
          page: 0,
          size: 5,
          sortField: 'startedAt',
          sortDir: 'desc',
        })
        .catch(() => ({ items: [] })),
    ])
      .then(([data, queued, sending]) => {
        if (cancelled) return;
        const t = data?.totals || {};
        setStats({
          totalClients: t.clients ?? 0,
          pendingQuotes: t.quotesPending ?? 0,
          pendingReviews: t.reviewsPending ?? 0,
          activeSubscribers: t.subscribersActive ?? 0,
          bookingsConfirmed: t.bookingsConfirmed ?? 0,
          bookingsInProgress: t.bookingsInProgress ?? 0,
          bookingsUpcomingThisMonth: t.bookingsUpcomingThisMonth ?? 0,
          vendorsActive: t.vendorsActive ?? 0,
          posDraft: t.posDraft ?? 0,
          posIssued: t.posIssued ?? 0,
          posOutstandingCents: t.posOutstandingCents ?? 0,
          invoicesOutstandingCents: t.invoicesOutstandingCents ?? 0,
          revenueThisMonthCents: t.revenueThisMonthCents ?? 0,
          expensesThisMonthCents: t.expensesThisMonthCents ?? 0,
          netCashFlowThisMonthCents: t.netCashFlowThisMonthCents ?? 0,
        });
        setTrends(data?.trends || {});

        const queuedItems = Array.isArray(queued?.items) ? queued.items : [];
        const sendingItems = Array.isArray(sending?.items) ? sending.items : [];
        setScheduledCampaigns([...sendingItems, ...queuedItems].slice(0, 5));

        const apiActivity = Array.isArray(data?.recentActivity) ? data.recentActivity : [];
        if (apiActivity.length > 0) {
          setActivity(
            apiActivity.map((row, i) => {
              const action = row.action || '';
              const entity = row.entityType;
              const synthesizedType =
                (entity === 'booking'        || action.startsWith('booking_')) ? 'booking'
              : (entity === 'vendor'         || action.startsWith('vendor_'))  ? 'vendor'
              : (entity === 'purchase_order' || action.startsWith('po_'))      ? 'po'
              : (entity === 'invoice'        || action.startsWith('invoice_')) ? 'invoice'
              : (entity === 'transaction' ||
                 action === 'payment_recorded' || action === 'payment_refunded' ||
                 action === 'expense_recorded' || action === 'transaction_updated' ||
                 action === 'transaction_deleted')                              ? 'transaction'
              : (row.type || 'info');
              return {
                id: row.id || `act-${i}`,
                type: synthesizedType,
                message: row.message || `${row.type} · ${row.action}`,
                time: row.at ? new Date(row.at).toLocaleString('en-IN') : '',
                status: row.status || 'info',
                page: pageForActivity(row),
                entityId: row.entityId || null,
                read: false,
              };
            })
          );
        }
        setLoadError('');
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err?.message || 'Could not load dashboard data.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const unreadCount = useMemo(
    () => activity.filter((a) => !a.read).length,
    [activity]
  );

  const markAllRead = useCallback(() => {
    setActivity((prev) => prev.map((a) => ({ ...a, read: true })));
  }, []);

  const markRead = useCallback((id) => {
    setActivity((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
  }, []);

  const handleActivityNav = useCallback(
    (item) => {
      markRead(item.id);
      // Deep-link booking activity rows to the specific booking detail.
      if (item.type === 'booking' && item.entityId) {
        navigate(`/admin/bookings/${item.entityId}`);
        return;
      }
      navigate(item.page);
    },
    [navigate, markRead]
  );

  const quickActions = useMemo(
    () => [
      {
        icon: 'fa-calendar-check',
        title: 'Open Bookings',
        description: 'See every confirmed event, the day-of checklist, and finance progress.',
        action: 'View bookings',
        badge: stats.bookingsUpcomingThisMonth
          ? `${stats.bookingsUpcomingThisMonth} this month`
          : null,
        onClick: () => navigate('admin-bookings'),
      },
      {
        icon: 'fa-file-invoice-dollar',
        title: 'Purchase Orders',
        description: 'Track vendor commitments, deliveries, and outstanding payables.',
        action: 'Open PO ledger',
        badge: stats.posOutstandingCents > 0
          ? `${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.posOutstandingCents / 100)} outstanding`
          : null,
        onClick: () => navigate('admin-purchase-orders'),
      },
      {
        icon: 'fa-store',
        title: 'Vendor Directory',
        description: 'Find decorators, florists, equipment, and staffing partners with their rate cards.',
        action: 'Open vendors',
        badge: stats.vendorsActive ? `${stats.vendorsActive} active` : null,
        onClick: () => navigate('admin-vendors'),
      },
      {
        icon: 'fa-paper-plane',
        title: 'Send Review Invitation',
        description: 'Email a personalised review link to a client after their event.',
        action: 'Create invitation',
        badge: null,
        onClick: () => navigate('admin-send-invitation'),
      },
      {
        icon: 'fa-bullhorn',
        title: 'Run Email Campaign',
        description: 'Compose a branded email and send to selected clients or subscribers.',
        action: 'New campaign',
        badge: null,
        onClick: () => navigate('admin-campaigns'),
      },
      {
        icon: 'fa-user-plus',
        title: 'Add a Client',
        description: 'Add a client manually to the database for outreach and event tracking.',
        action: 'Add client',
        badge: null,
        onClick: () => navigate('admin-clients'),
      },
    ],
    [navigate, stats.bookingsUpcomingThisMonth, stats.posOutstandingCents, stats.vendorsActive]
  );

  /* ── KPI cards config ── */

  const kpiCards = useMemo(
    () => [
      {
        value: stats.totalClients,
        label: 'Total Clients',
        icon: 'fa-users',
        tone: 'primary',
        change: trends.newClientsThisMonth ? `+${trends.newClientsThisMonth} this month` : null,
        positive: (trends.newClientsThisMonth || 0) > 0,
        delay: 50,
      },
      {
        value: stats.bookingsConfirmed + stats.bookingsInProgress,
        label: 'Active Bookings',
        icon: 'fa-calendar-check',
        tone: 'primary',
        change: stats.bookingsUpcomingThisMonth
          ? `${stats.bookingsUpcomingThisMonth} upcoming this month`
          : 'Nothing on the calendar',
        positive: stats.bookingsUpcomingThisMonth > 0,
        delay: 90,
      },
      {
        value: stats.posDraft + stats.posIssued,
        label: 'Open POs',
        icon: 'fa-file-invoice-dollar',
        tone: stats.posOutstandingCents > 0 ? 'warning' : 'primary',
        change: stats.posOutstandingCents > 0
          ? `${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.posOutstandingCents / 100)} outstanding`
          : 'No outstanding payables',
        positive: stats.posOutstandingCents === 0,
        delay: 100,
      },
      {
        value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
          .format((stats.revenueThisMonthCents || 0) / 100),
        label: 'Revenue (mtd)',
        icon: 'fa-arrow-down',
        tone: 'success',
        change: stats.netCashFlowThisMonthCents >= 0
          ? `Net +${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.netCashFlowThisMonthCents / 100)}`
          : `Net ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.netCashFlowThisMonthCents / 100)}`,
        positive: stats.netCashFlowThisMonthCents >= 0,
        delay: 105,
      },
      {
        value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
          .format((stats.invoicesOutstandingCents || 0) / 100),
        label: 'Receivables',
        icon: 'fa-file-invoice',
        tone: stats.invoicesOutstandingCents > 0 ? 'warning' : 'success',
        change: stats.invoicesOutstandingCents > 0 ? 'Awaiting payment' : 'All clear',
        positive: stats.invoicesOutstandingCents === 0,
        delay: 110,
      },
      {
        value: stats.pendingQuotes,
        label: 'Pending Quotes',
        icon: 'fa-file-alt',
        tone: stats.pendingQuotes > 0 ? 'warning' : 'success',
        change: stats.pendingQuotes > 0 ? 'Requires attention' : 'All caught up',
        positive: false,
        delay: 120,
      },
      {
        value: stats.pendingReviews,
        label: 'Pending Reviews',
        icon: 'fa-star',
        tone: stats.pendingReviews > 0 ? 'warning' : 'success',
        change: stats.pendingReviews > 0 ? 'Awaiting moderation' : 'All caught up',
        positive: false,
        delay: 190,
      },
      {
        value: stats.activeSubscribers,
        label: 'Active Subscribers',
        icon: 'fa-user-friends',
        tone: 'info',
        change: trends.emailsDeliveredThisMonth
          ? `${trends.emailsDeliveredThisMonth} emails sent (mtd)`
          : null,
        positive: true,
        delay: 260,
      },
    ],
    [stats, trends]
  );

  return (
    <>
      <AdminPageHero
        eyebrow="Admin Dashboard"
        icon="fa-th-large"
        title={<DynamicGreeting />}
        intro="Manage every part of the catering operation — clients, reviews, quotes, and email — from a single place."
        actions={<LiveClock />}
      />

      {/* ── Stats ── */}
      <section className="section">
        <div className="container">
          {loadError && (
            <div className="form-error" role="alert" style={{ marginBottom: 16 }}>
              <i className="fas fa-exclamation-circle" aria-hidden="true" /> {loadError}
            </div>
          )}
          {loading && !loadError && (
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>
              <i className="fas fa-circle-notch fa-spin" aria-hidden="true" /> Loading live stats…
            </p>
          )}
          <div className="admin-metric-grid">
            {kpiCards.map((card) => (
              <AdminMetricCard
                key={card.label}
                label={card.label}
                value={card.value}
                tone={card.tone || 'primary'}
                icon={card.icon}
                delta={card.change}
                deltaTone={card.positive ? 'positive' : 'neutral'}
                delay={card.delay}
                loading={loading}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Shortcuts ── */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Quick actions</span>
            <h2 className="section-title">Common tasks</h2>
          </div>
          <div className="admin-quick-actions">
            {quickActions.map((action, i) => (
              <div
                key={action.title}
                className="admin-action-card"
                style={{ animationDelay: `${100 + i * 80}ms` }}
              >
                <span className="admin-action-icon" aria-hidden="true">
                  <i className={`fas ${action.icon}`} />
                </span>
                <h3>{action.title}</h3>
                <p>{action.description}</p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={action.onClick}
                >
                  {action.action}{' '}
                  <i className="fas fa-arrow-right" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Upcoming dispatch ── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Email queue</span>
            <h2 className="section-title">Upcoming dispatch</h2>
          </div>

          <div className="admin-table-container">
            <div className="admin-table-header">
              <h3 className="admin-table-title">
                Scheduled & in-flight campaigns
              </h3>
              <div className="admin-table-actions">
                <AdminButton
                  variant="ghost"
                  icon="fa-arrow-right"
                  iconPosition="right"
                  onClick={() => navigate('admin-campaigns')}
                >
                  All campaigns
                </AdminButton>
              </div>
            </div>

            {loading ? (
              <AdminLoadingState variant="skeleton" rows={3} />
            ) : scheduledCampaigns.length === 0 ? (
              <AdminEmptyState
                icon="fa-clock"
                title="No campaigns in the queue"
                description="Scheduled and in-flight campaigns appear here. Launch a new one from the Campaigns page."
                actionIcon="fa-bullhorn"
                actionLabel="New campaign"
                onAction={() => navigate('admin-campaigns')}
              />
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Status</th>
                    <th>Recipients</th>
                    <th>When</th>
                    <th className="actions">Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledCampaigns.map((c) => {
                    const status = (c.status || '').toLowerCase();
                    const total = c.totalRecipients || 0;
                    const sent = c.sentCount || 0;
                    return (
                      <tr
                        key={c.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate('admin-campaigns')}
                      >
                        <td>
                          <div className="admin-cell-title">{c.name}</div>
                          <div className="admin-cell-sub">
                            {sent.toLocaleString('en-IN')} of {total.toLocaleString('en-IN')} sent
                          </div>
                        </td>
                        <td>
                          <AdminStatusPill status={status} />
                        </td>
                        <td>
                          <strong>{total.toLocaleString('en-IN')}</strong>
                        </td>
                        <td>
                          {status === 'queued' && c.scheduledAt ? (
                            <>
                              <div className="admin-cell-strong">
                                {formatScheduleForDisplay(c.scheduledAt)}
                              </div>
                              <div className="admin-cell-sub">
                                {formatRelative(c.scheduledAt)}
                              </div>
                            </>
                          ) : status === 'sending' && c.startedAt ? (
                            <>
                              <div className="admin-cell-strong">Sending now</div>
                              <div className="admin-cell-sub">
                                started {formatRelative(c.startedAt)}
                              </div>
                            </>
                          ) : (
                            <span className="admin-cell-sub">—</span>
                          )}
                        </td>
                        <td className="actions">
                          <AdminButton
                            variant="ghost"
                            size="sm"
                            icon="fa-arrow-right"
                            iconPosition="right"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('admin-campaigns');
                            }}
                          >
                            Open
                          </AdminButton>
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

      {/* ── Activity log ── */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Activity log</span>
            <h2 className="section-title">Recent activity</h2>
          </div>

          <div className="admin-table-container">
            <div className="admin-table-header">
              <h3 className="admin-table-title">
                Latest updates
                {unreadCount > 0 && (
                  <span className="admin-unread-pip" aria-label={`${unreadCount} unread`}>
                    {unreadCount}
                  </span>
                )}
              </h3>
              <div className="admin-table-actions">
                {unreadCount > 0 && (
                  <AdminButton
                    variant="ghost"
                    icon="fa-check-double"
                    onClick={markAllRead}
                  >
                    Mark all read
                  </AdminButton>
                )}
              </div>
            </div>

            {loading && activity.length === 0 ? (
              <AdminLoadingState variant="skeleton" rows={4} />
            ) : activity.length === 0 ? (
              <AdminEmptyState
                icon="fa-clock-rotate-left"
                title="No recent activity"
                description="Reviews, quotes, campaigns, and other admin events will surface here as they happen."
              />
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th className="actions">Go to</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((item) => {
                    const typeMeta = TYPE_ICON[item.type] || TYPE_ICON.review;
                    const statusMeta = STATUS_META[item.status] || STATUS_META.pending;
                    return (
                      <tr
                        key={item.id}
                        className={item.read ? '' : 'admin-row-unread'}
                        onClick={() => handleActivityNav(item)}
                        onKeyDown={(e) =>
                          (e.key === 'Enter' || e.key === ' ') &&
                          handleActivityNav(item)
                        }
                        tabIndex={0}
                        role="row"
                        aria-label={`${item.message} — ${item.time}`}
                      >
                        <td>
                          <div className="flex-row" style={{ gap: 14 }}>
                            <span
                              className="admin-notification-icon"
                              style={{ color: typeMeta.color }}
                              aria-hidden="true"
                            >
                              <i className={`fas ${typeMeta.icon}`} />
                            </span>
                            <span style={{ fontWeight: item.read ? 400 : 600 }}>
                              {item.message}
                            </span>
                          </div>
                        </td>
                        <td className="admin-cell-sub">{item.time}</td>
                        <td>
                          <span className={`status-badge ${statusMeta.cls}`}>
                            <i className={`fas ${statusMeta.icon}`} aria-hidden="true" />
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="actions">
                          <AdminButton
                            variant="ghost"
                            size="sm"
                            icon="fa-arrow-right"
                            iconPosition="right"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActivityNav(item);
                            }}
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
            {/* The previous "Showing 5 of 247" pagination was hard-coded
                and the buttons were no-ops. Drop it entirely until the
                backend exposes a real activity endpoint with paging. */}
          </div>
        </div>
      </section>
    </>
  );
};

export default AdminDashboardPage;