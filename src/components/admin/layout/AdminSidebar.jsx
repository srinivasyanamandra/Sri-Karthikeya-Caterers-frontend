import React from 'react';
import { useNavigation } from '../../../contexts/NavigationContext';
import { CONTACT } from '../../../constants/contact';
import { ROUTES } from '../../../constants/navigation';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ id: 'admin-dashboard', label: 'Dashboard', icon: 'fa-chart-line' }],
  },
  {
    label: 'Operations',
    items: [
      { id: 'admin-quotes', label: 'Quote Requests', icon: 'fa-file-alt' },
      { id: 'admin-clients', label: 'Clients', icon: 'fa-users' },
      { id: 'admin-reviews', label: 'Reviews', icon: 'fa-star' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { id: 'admin-send-invitation', label: 'Send Invitation', icon: 'fa-paper-plane' },
      { id: 'admin-emails', label: 'Email Builder', icon: 'fa-envelope' },
      { id: 'admin-subscribers', label: 'Subscribers', icon: 'fa-user-friends' },
    ],
  },
];

const AdminSidebar = ({ currentPage, collapsed, mobileOpen, onToggle, onCloseMobile }) => {
  const { navigate } = useNavigation();

  const go = (id) => {
    navigate(id);
    if (window.innerWidth < 1024) onCloseMobile?.();
  };

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

  return (
    <aside
      className={`admin-sidebar${collapsed ? ' collapsed' : ''}${
        mobileOpen ? ' mobile-open' : ''
      }`}
      aria-label="Admin navigation"
    >
      <div className="admin-sidebar-header">
        <a
          href="#admin-dashboard"
          className="admin-sidebar-logo"
          onClick={(e) => {
            e.preventDefault();
            go('admin-dashboard');
          }}
          aria-label={`${CONTACT.brand} admin dashboard`}
        >
          <img src="/logo.png" alt="" />
          {!collapsed && <span className="admin-sidebar-logo-text">Admin</span>}
        </a>

        <button
          type="button"
          className="admin-sidebar-toggle"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <i
            className={`fas fa-${collapsed ? 'angle-right' : 'angle-left'}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <nav className="admin-sidebar-nav">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className="admin-nav-group">
            {!collapsed && (
              <span
                className="admin-nav-group-label"
                style={{ animationDelay: `${gi * 80}ms` }}
              >
                {group.label}
              </span>
            )}
            <ul className="admin-nav-list">
              {group.items.map((item, i) => {
                const active = currentPage === item.id;
                return (
                  <li
                    key={item.id}
                    className="admin-nav-item"
                    style={{ animationDelay: `${gi * 80 + i * 50 + 50}ms` }}
                  >
                    <a
                      href={`#${item.id}`}
                      className={`admin-nav-link${active ? ' active' : ''}`}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? 'page' : undefined}
                      onClick={(e) => {
                        e.preventDefault();
                        go(item.id);
                      }}
                    >
                      <span className="admin-nav-icon" aria-hidden="true">
                        <i className={`fas ${item.icon}`} />
                      </span>
                      {!collapsed && <span className="admin-nav-label">{item.label}</span>}
                      {item.badge && !collapsed && (
                        <span className="admin-nav-badge">{item.badge}</span>
                      )}
                      {item.badge && collapsed && (
                        <span className="admin-nav-badge admin-nav-badge-dot" aria-hidden="true" />
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <a
          href={`#${ROUTES.HOME}`}
          className="admin-sidebar-footer-link"
          title={collapsed ? 'View public site' : undefined}
          onClick={(e) => {
            e.preventDefault();
            navigate(ROUTES.HOME);
          }}
        >
          <i className="fas fa-globe" aria-hidden="true" />
          {!collapsed && <span>View public site</span>}
        </a>
        <button
          type="button"
          className="admin-sidebar-footer-link admin-sidebar-footer-logout"
          onClick={handleLogout}
          title={collapsed ? 'Sign out' : undefined}
        >
          <i className="fas fa-sign-out-alt" aria-hidden="true" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
