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
import { useAnimatedCounter } from './adminHooks';

/* ─── Constants ───────────────────────────────────────────── */

const STATUS_META = {
  pending: { icon: 'fa-clock', label: 'Pending', cls: 'pending' },
  success: { icon: 'fa-check', label: 'Done', cls: 'approved' },
  info: { icon: 'fa-info-circle', label: 'Info', cls: 'active' },
};

const TYPE_ICON = {
  review: { icon: 'fa-star', color: 'var(--color-accent-dark)' },
  quote: { icon: 'fa-file-alt', color: 'var(--color-primary)' },
  email: { icon: 'fa-envelope', color: 'var(--color-success)' },
  client: { icon: 'fa-user', color: '#6366f1' },
};

const INITIAL_ACTIVITY = [
  { id: 1, type: 'review', message: 'New review submitted by Rajesh Kumar', time: '2 hours ago', status: 'pending', page: 'admin-reviews', read: false },
  { id: 2, type: 'quote', message: 'Quote request from Priya Sharma — Wedding, 500 guests', time: '5 hours ago', status: 'pending', page: 'admin-quotes', read: false },
  { id: 3, type: 'email', message: 'Monthly newsletter delivered to 1,834 subscribers', time: '1 day ago', status: 'success', page: 'admin-subscribers', read: true },
  { id: 4, type: 'review', message: 'Review approved and featured on the homepage', time: '2 days ago', status: 'success', page: 'admin-reviews', read: true },
  { id: 5, type: 'client', message: 'New client Lakshmi Iyer added to the database', time: '3 days ago', status: 'info', page: 'admin-clients', read: true },
];

/* ─── Sub-components ──────────────────────────────────────── */

/**
 * AnimatedStatCard — counts up from 0 to value on mount
 */
function AnimatedStatCard({ value, label, change, positive, delay = 0 }) {
  const animated = useAnimatedCounter(value, 1100, delay);

  const formatted = useMemo(
    () =>
      animated.toLocaleString('en-IN', {
        maximumFractionDigits: 0,
      }),
    [animated]
  );

  return (
    <div className="admin-stat-card" style={{ animationDelay: `${delay}ms` }}>
      <span className="admin-stat-value" aria-live="polite" aria-label={`${value} ${label}`}>
        {formatted}
      </span>
      <span className="admin-stat-label">{label}</span>
      {change && (
        <span className={`admin-stat-change${positive ? ' positive' : ''}`}>
          {positive && <i className="fas fa-arrow-up" aria-hidden="true" />}
          {change}
        </span>
      )}
    </div>
  );
}

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

/* ─── Main Page ───────────────────────────────────────────── */

const AdminDashboardPage = () => {
  const { navigate } = useNavigation();

  const stats = useMemo(
    () => ({
      totalClients: 247,
      pendingQuotes: 12,
      pendingReviews: 8,
      activeSubscribers: 1834,
    }),
    []
  );

  const [activity, setActivity] = useState(INITIAL_ACTIVITY);

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
      navigate(item.page);
    },
    [navigate, markRead]
  );

  const quickActions = useMemo(
    () => [
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
        onClick: () => navigate('admin-subscribers'),
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
    [navigate]
  );

  /* ── KPI cards config ── */

  const kpiCards = useMemo(
    () => [
      {
        value: stats.totalClients,
        label: 'Total Clients',
        change: '+12 this month',
        positive: true,
        delay: 50,
      },
      {
        value: stats.pendingQuotes,
        label: 'Pending Quotes',
        change: 'Requires attention',
        positive: false,
        delay: 120,
      },
      {
        value: stats.pendingReviews,
        label: 'Pending Reviews',
        change: 'Awaiting moderation',
        positive: false,
        delay: 190,
      },
      {
        value: stats.activeSubscribers,
        label: 'Active Subscribers',
        change: '+48 this week',
        positive: true,
        delay: 260,
      },
    ],
    [stats]
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
          <div className="admin-stats-grid">
            {kpiCards.map((card) => (
              <AnimatedStatCard key={card.label} {...card} />
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

      {/* ── Activity log ── */}
      <section className="section">
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
                  <span
                    style={{
                      marginLeft: 10,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'var(--color-error)',
                      color: 'white',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                    aria-label={`${unreadCount} unread`}
                  >
                    {unreadCount}
                  </span>
                )}
              </h3>
              <div className="admin-table-actions">
                {unreadCount > 0 && (
                  <button type="button" className="btn btn-ghost" onClick={markAllRead}>
                    <i className="fas fa-check-double" aria-hidden="true" /> Mark all read
                  </button>
                )}
                <button type="button" className="btn btn-ghost">
                  <i className="fas fa-download" aria-hidden="true" /> Export
                </button>
              </div>
            </div>

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
                      style={{
                        cursor: 'pointer',
                        background: !item.read
                          ? 'rgba(201,136,47,0.04)'
                          : undefined,
                        borderLeft: !item.read
                          ? '2px solid var(--color-accent)'
                          : '2px solid transparent',
                      }}
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
                          <span
                            style={{
                              fontWeight: !item.read ? 600 : 400,
                              color: !item.read
                                ? 'var(--text-primary)'
                                : undefined,
                            }}
                          >
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
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '6px 14px', fontSize: 12 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivityNav(item);
                          }}
                          aria-label={`Go to ${item.page.replace('admin-', '')}`}
                        >
                          View{' '}
                          <i
                            className="fas fa-arrow-right"
                            aria-hidden="true"
                            style={{ fontSize: 10 }}
                          />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="admin-pagination">
              <div className="admin-pagination-info">
                Showing {activity.length} of 247 activities
              </div>
              <div className="admin-pagination-controls">
                <button type="button" className="admin-pagination-btn" disabled aria-label="Previous page">
                  <i className="fas fa-chevron-left" aria-hidden="true" />
                </button>
                <button type="button" className="admin-pagination-btn active" aria-current="page">
                  1
                </button>
                <button type="button" className="admin-pagination-btn" aria-label="Page 2">2</button>
                <button type="button" className="admin-pagination-btn" aria-label="Page 3">3</button>
                <button type="button" className="admin-pagination-btn" aria-label="Next page">
                  <i className="fas fa-chevron-right" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AdminDashboardPage;