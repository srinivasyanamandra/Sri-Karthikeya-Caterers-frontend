import React, { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '../../../contexts/NavigationContext';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

const COLLAPSE_KEY = 'admin:sidebar-collapsed';
const DESKTOP_BP = 1024;

const readCollapsed = () => {
  try {
    if (typeof window === 'undefined') return false;
    if (window.innerWidth < DESKTOP_BP) return true;
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * AdminLayout — persistent admin shell.
 *
 * Mounted ONCE for the admin section in App.js (outside the per-route key
 * boundary), so the sidebar and topbar stay mounted across admin navigation.
 * The page content is keyed on the current admin route so it still fades in
 * on each navigation.
 */
const AdminLayout = ({ children }) => {
  const { currentPage } = useNavigation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readCollapsed);
  const [sidebarMobile, setSidebarMobile] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    try {
      const email = localStorage.getItem('adminEmail');
      if (email) setUserEmail(email);
    } catch {
      /* ignore */
    }
  }, []);

  /* Auto-collapse on small screens; restore preference on desktop. */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < DESKTOP_BP) {
        setSidebarCollapsed(true);
      } else {
        try {
          setSidebarCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
        } catch {
          setSidebarCollapsed(false);
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* Close mobile drawer + scroll body to top whenever the route changes. */
  useEffect(() => {
    setSidebarMobile(false);
  }, [currentPage]);

  /* Lock body scroll when the mobile drawer is open. */
  useEffect(() => {
    if (!sidebarMobile) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarMobile]);

  const toggleSidebar = useCallback(() => {
    if (window.innerWidth < DESKTOP_BP) {
      setSidebarMobile((v) => !v);
      return;
    }
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const closeMobile = useCallback(() => setSidebarMobile(false), []);

  return (
    <div
      className={`admin-layout${sidebarCollapsed ? ' sidebar-collapsed' : ''}${
        sidebarMobile ? ' mobile-open' : ''
      }`}
    >
      <AdminSidebar
        currentPage={currentPage}
        collapsed={sidebarCollapsed}
        mobileOpen={sidebarMobile}
        onToggle={toggleSidebar}
        onCloseMobile={closeMobile}
      />

      <div className="admin-main">
        <AdminTopbar
          userEmail={userEmail}
          onToggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/*
          The `key={currentPage}` is load-bearing — it remounts the inner
          content subtree on every admin route change so the fade-in
          animation runs again, while the sidebar/topbar stay mounted.
        */}
        <main className="admin-content" key={currentPage}>
          {children}
        </main>
      </div>

      {sidebarMobile && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          aria-label="Close menu"
          onClick={closeMobile}
        />
      )}
    </div>
  );
};

export default AdminLayout;
