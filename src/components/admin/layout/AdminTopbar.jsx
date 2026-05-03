import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigation } from '../../../contexts/NavigationContext';
import { useClickOutside, useEscapeKey } from '../../../pages/admin/adminHooks';

const PAGE_META = {
  'admin-dashboard': { title: 'Dashboard', icon: 'fa-chart-line' },
  'admin-reviews': { title: 'Reviews', icon: 'fa-star' },
  'admin-quotes': { title: 'Quote Requests', icon: 'fa-file-alt' },
  'admin-clients': { title: 'Clients', icon: 'fa-users' },
  'admin-send-invitation': { title: 'Send Invitation', icon: 'fa-paper-plane' },
  'admin-emails': { title: 'Email Builder', icon: 'fa-envelope' },
  'admin-subscribers': { title: 'Subscribers', icon: 'fa-user-friends' },
};

const SAMPLE_NOTIFICATIONS = [
  { id: 1, type: 'review',  message: 'New review submitted by Rajesh Kumar',     time: '2 hours ago', unread: true,  page: 'admin-reviews' },
  { id: 2, type: 'quote',   message: 'Quote request from Priya Sharma',          time: '5 hours ago', unread: true,  page: 'admin-quotes' },
  { id: 3, type: 'email',   message: 'Newsletter delivered to 1,834 subscribers', time: '1 day ago',  unread: false, page: 'admin-subscribers' },
];

const NOTIF_ICON = { review: 'fa-star', quote: 'fa-file-alt', email: 'fa-envelope' };

const getInitials = (email) => {
  if (!email) return 'AD';
  const handle = email.split('@')[0];
  const parts = handle.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return handle.slice(0, 2).toUpperCase();
};

const AdminTopbar = ({ userEmail, onToggleSidebar }) => {
  const { currentPage, navigate } = useNavigation();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);

  const userRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  const closeAll = () => {
    setShowUserMenu(false);
    setShowNotifications(false);
  };

  useClickOutside(userRef, () => setShowUserMenu(false), showUserMenu);
  useClickOutside(notifRef, () => setShowNotifications(false), showNotifications);
  useEscapeKey(closeAll, showUserMenu || showNotifications);

  /* Cmd/Ctrl-K focuses the search box. */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* Close any open dropdown when the route changes. */
  useEffect(() => {
    closeAll();
  }, [currentPage]);

  const meta = PAGE_META[currentPage] || { title: 'Admin', icon: 'fa-th-large' };
  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications]
  );

  const handleLogout = () => {
    try {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminTokenExpiry');
      localStorage.removeItem('adminEmail');
    } catch {
      /* ignore */
    }
    navigate('admin-login');
  };

  const openNotification = (n) => {
    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x))
    );
    setShowNotifications(false);
    if (n.page) navigate(n.page);
  };

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-content">
        <div className="admin-topbar-left">
          <button
            type="button"
            className="admin-topbar-menu-toggle"
            onClick={onToggleSidebar}
            aria-label="Toggle menu"
          >
            <i className="fas fa-bars" aria-hidden="true" />
          </button>

          <div className="admin-topbar-page-title">
            <i className={`fas ${meta.icon}`} aria-hidden="true" />
            <span>{meta.title}</span>
          </div>

          <div className="admin-topbar-search">
            <i className="fas fa-search" aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              placeholder="Search clients, reviews, quotes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Global search"
            />
            <kbd className="admin-topbar-kbd" aria-hidden="true">⌘K</kbd>
          </div>
        </div>

        <div className="admin-topbar-right">
          <div className="admin-topbar-notifications" ref={notifRef}>
            <button
              type="button"
              className="admin-topbar-icon-btn"
              onClick={() => {
                setShowNotifications((v) => !v);
                setShowUserMenu(false);
              }}
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
              aria-haspopup="menu"
              aria-expanded={showNotifications}
            >
              <i className="fas fa-bell" aria-hidden="true" />
              {unreadCount > 0 && <span className="admin-topbar-badge">{unreadCount}</span>}
            </button>

            {showNotifications && (
              <div className="admin-topbar-dropdown" role="menu">
                <div className="admin-topbar-dropdown-header">
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <button type="button" className="btn-link" onClick={markAllRead}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="admin-topbar-dropdown-body">
                  {notifications.length === 0 && (
                    <div className="admin-topbar-dropdown-empty">
                      You're all caught up.
                    </div>
                  )}
                  {notifications.map((n) => (
                    <button
                      type="button"
                      key={n.id}
                      className={`admin-notification-item${n.unread ? ' unread' : ''}`}
                      onClick={() => openNotification(n)}
                    >
                      <span className="admin-notification-icon" aria-hidden="true">
                        <i className={`fas ${NOTIF_ICON[n.type] || 'fa-bell'}`} />
                      </span>
                      <span className="admin-notification-content">
                        <span>{n.message}</span>
                        <span className="admin-notification-time">{n.time}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="admin-topbar-user" ref={userRef}>
            <button
              type="button"
              className="admin-topbar-user-btn"
              onClick={() => {
                setShowUserMenu((v) => !v);
                setShowNotifications(false);
              }}
              aria-haspopup="menu"
              aria-expanded={showUserMenu}
              aria-label="User menu"
            >
              <span className="admin-topbar-user-avatar">{getInitials(userEmail)}</span>
              <span className="admin-topbar-user-info">
                <span className="admin-topbar-user-name">
                  {userEmail || 'Admin'}
                </span>
                <span className="admin-topbar-user-role">Administrator</span>
              </span>
              <i className="fas fa-chevron-down" aria-hidden="true" />
            </button>

            {showUserMenu && (
              <div
                className="admin-topbar-dropdown admin-topbar-dropdown-right"
                role="menu"
              >
                <div className="admin-topbar-dropdown-body">
                  <button
                    type="button"
                    className="admin-dropdown-item"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('admin-dashboard');
                    }}
                  >
                    <i className="fas fa-th-large" aria-hidden="true" /> Dashboard
                  </button>
                  <button
                    type="button"
                    className="admin-dropdown-item"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('home');
                    }}
                  >
                    <i className="fas fa-globe" aria-hidden="true" /> View public site
                  </button>
                  <div className="admin-dropdown-divider" />
                  <button
                    type="button"
                    className="admin-dropdown-item admin-dropdown-item-danger"
                    onClick={handleLogout}
                  >
                    <i className="fas fa-sign-out-alt" aria-hidden="true" /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
