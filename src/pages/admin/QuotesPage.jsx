/**
 * QuotesPage.jsx — Quote request management
 *
 * Features:
 *  ✦ Debounced search across client name, email, event type
 *  ✦ Pagination (10 per page)
 *  ✦ Sortable columns
 *  ✦ Status filtering (pending, contacted, quoted, booked, declined)
 *  ✦ Quote detail drawer
 *  ✦ Status update from drawer
 *  ✦ Toast notifications
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
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

/* ─── Seed data ───────────────────────────────────────────── */

const SEED_QUOTES = [
  { id: 1, clientName: 'Priya Sharma', email: 'priya@example.com', phone: '+91 98765 43211', eventType: 'Wedding', eventDate: '2026-06-15', guestCount: 500, status: 'pending', submittedDate: '2026-04-20', budget: '₹5,00,000', venue: 'Grand Palace, Hyderabad' },
  { id: 2, clientName: 'Rajesh Kumar', email: 'rajesh@example.com', phone: '+91 98765 43210', eventType: 'Corporate Event', eventDate: '2026-05-10', guestCount: 200, status: 'contacted', submittedDate: '2026-04-18', budget: '₹2,00,000', venue: 'Tech Park Convention Center' },
  { id: 3, clientName: 'Anand Reddy', email: 'anand@example.com', phone: '+91 98765 43212', eventType: 'Birthday Party', eventDate: '2026-05-25', guestCount: 100, status: 'quoted', submittedDate: '2026-04-15', budget: '₹75,000', venue: 'Home' },
  { id: 4, clientName: 'Lakshmi Iyer', email: 'lakshmi@example.com', phone: '+91 98765 43213', eventType: 'Anniversary', eventDate: '2026-07-01', guestCount: 150, status: 'booked', submittedDate: '2026-04-10', budget: '₹1,50,000', venue: 'Lakeview Resort' },
  { id: 5, clientName: 'Suresh Menon', email: 'suresh@example.com', phone: '+91 98765 43214', eventType: 'Wedding', eventDate: '2026-08-20', guestCount: 800, status: 'pending', submittedDate: '2026-04-22', budget: '₹8,00,000', venue: 'Royal Gardens' },
  { id: 6, clientName: 'Kavitha Nair', email: 'kavitha@example.com', phone: '+91 98765 43215', eventType: 'Engagement', eventDate: '2026-05-30', guestCount: 250, status: 'contacted', submittedDate: '2026-04-19', budget: '₹2,50,000', venue: 'Beachside Resort' },
  { id: 7, clientName: 'Venkatesh Rao', email: 'venkatesh@example.com', phone: '+91 98765 43216', eventType: 'Corporate Event', eventDate: '2026-06-05', guestCount: 300, status: 'declined', submittedDate: '2026-04-12', budget: '₹3,00,000', venue: 'Business Hotel' },
  { id: 8, clientName: 'Deepa Krishnan', email: 'deepa@example.com', phone: '+91 98765 43217', eventType: 'Housewarming', eventDate: '2026-05-15', guestCount: 80, status: 'pending', submittedDate: '2026-04-21', budget: '₹50,000', venue: 'New Home' },
];

/* ─── Status pipeline config ──────────────────────────────── */

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   cls: 'pending',   icon: 'fa-clock' },
  contacted: { label: 'Contacted', cls: 'contacted', icon: 'fa-phone' },
  quoted:    { label: 'Quoted',    cls: 'quoted',    icon: 'fa-file-invoice-dollar' },
  booked:    { label: 'Booked',    cls: 'booked',    icon: 'fa-check-circle' },
  declined:  { label: 'Declined',  cls: 'declined',  icon: 'fa-ban' },
};

const PIPELINE_ORDER = ['pending', 'contacted', 'quoted', 'booked'];

/* ─── Helpers ─────────────────────────────────────────────── */

const fmt = (s) =>
  new Date(s).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

/* ─── Main Component ──────────────────────────────────────── */

export default function QuotesPage() {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState(SEED_QUOTES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState('submittedDate');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedQuote, setSelectedQuote] = useState(null);

  const drawerRef = useRef(null);

  const debouncedSearch = useDebounce(search, 300);

  // Close drawer on ESC
  useEscapeKey(() => setSelectedQuote(null), !!selectedQuote);
  useFocusTrap(drawerRef, !!selectedQuote);

  // Filter and sort
  const filtered = useMemo(() => {
    let result = quotes;

    // Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (qt) =>
          qt.clientName.toLowerCase().includes(q) ||
          qt.email.toLowerCase().includes(q) ||
          qt.eventType.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((qt) => qt.status === statusFilter);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (sortKey === 'guestCount') {
        aVal = parseInt(aVal) || 0;
        bVal = parseInt(bVal) || 0;
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [quotes, debouncedSearch, statusFilter, sortKey, sortDir]);

  const pagination = usePagination(filtered, 10);

  // Toggle sort
  const handleSort = useCallback((key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }, [sortKey]);

  // Update status
  const handleStatusUpdate = useCallback((id, newStatus) => {
    setQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
    );
    toast.success(`Quote status updated to ${STATUS_CONFIG[newStatus].label}`);
  }, [toast]);

  // Stats
  const stats = useMemo(() => {
    const pending = quotes.filter((q) => q.status === 'pending').length;
    const contacted = quotes.filter((q) => q.status === 'contacted').length;
    const quoted = quotes.filter((q) => q.status === 'quoted').length;
    const booked = quotes.filter((q) => q.status === 'booked').length;
    return { pending, contacted, quoted, booked, total: quotes.length };
  }, [quotes]);

  return (
    <>
      <AdminPageHero
        eyebrow="Quote Requests"
        icon="fa-file-alt"
        title="Quote Requests"
        subtitle={`${stats.total} total quotes · ${stats.pending} pending · ${stats.booked} booked`}
      />

      <section className="section">
        <div className="container">
          {/* Status pipeline (replaces redundant 4-card grid) */}
          <div className="quote-pipeline" role="tablist" aria-label="Filter by status">
            {PIPELINE_ORDER.map((key) => {
              const cfg = STATUS_CONFIG[key];
              const value = stats[key] ?? 0;
              const isActive = statusFilter === key;
              return (
                <button
                  type="button"
                  key={key}
                  role="tab"
                  aria-selected={isActive}
                  className={`quote-pipeline-step${isActive ? ' active' : ''}${
                    value === 0 ? ' done' : ''
                  }`}
                  onClick={() => setStatusFilter(isActive ? 'all' : key)}
                  title={`Show ${cfg.label.toLowerCase()} quotes`}
                >
                  <span className="quote-pipeline-label">
                    <i className={`fas ${cfg.icon}`} aria-hidden="true" /> {cfg.label}
                  </span>
                  <span className="quote-pipeline-value">{value}</span>
                </button>
              );
            })}
          </div>

          {/* Toolbar — search + status select */}
          <div className="admin-table-controls">
            <div className="admin-search-box">
              <i className="fas fa-search" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search by client, email, or event type…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search quotes"
              />
            </div>
            <div className="admin-filter-group">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="admin-select"
                aria-label="Status filter"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="quoted">Quoted</option>
                <option value="booked">Booked</option>
                <option value="declined">Declined</option>
              </select>
              {(statusFilter !== 'all' || search) && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setStatusFilter('all');
                    setSearch('');
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

        {/* Table */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('clientName')} style={{ cursor: 'pointer' }}>
                  Client {sortKey === 'clientName' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('eventType')} style={{ cursor: 'pointer' }}>
                  Event Type {sortKey === 'eventType' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('eventDate')} style={{ cursor: 'pointer' }}>
                  Event Date {sortKey === 'eventDate' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('guestCount')} style={{ cursor: 'pointer' }}>
                  Guests {sortKey === 'guestCount' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                  Status {sortKey === 'status' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('submittedDate')} style={{ cursor: 'pointer' }}>
                  Submitted {sortKey === 'submittedDate' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagination.slice.map((quote) => (
                <tr
                  key={quote.id}
                  onClick={() => setSelectedQuote(quote)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedQuote(quote);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open ${quote.clientName}'s quote`}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div className="admin-cell-title">{quote.clientName}</div>
                    <div className="admin-cell-subtitle">{quote.email}</div>
                  </td>
                  <td>{quote.eventType}</td>
                  <td>{fmt(quote.eventDate)}</td>
                  <td>{quote.guestCount}</td>
                  <td>
                    <span className={`status-badge ${STATUS_CONFIG[quote.status].cls}`}>
                      <i
                        className={`fas ${STATUS_CONFIG[quote.status].icon}`}
                        aria-hidden="true"
                      />
                      {STATUS_CONFIG[quote.status].label}
                    </span>
                  </td>
                  <td>{fmt(quote.submittedDate)}</td>
                  <td className="actions">
                    <button
                      type="button"
                      className="admin-btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQuote(quote);
                      }}
                      aria-label={`View details for ${quote.clientName}`}
                      title="View details"
                    >
                      <i className="fas fa-arrow-right" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="admin-empty-state">
              <i className="fas fa-inbox" aria-hidden="true" />
              <h3>No quotes match your filters</h3>
              <p>Try a different status or clear your search.</p>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setStatusFilter('all');
                  setSearch('');
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

          {/* Pagination */}
          <PaginationBar pagination={pagination} label="quotes" />
        </div>
      </section>

      {/* Quote Detail Drawer */}
      {selectedQuote && (
        <AdminPortal>
          <div className="admin-drawer-overlay" onClick={() => setSelectedQuote(null)} />
          <div ref={drawerRef} className="admin-drawer" role="dialog" aria-modal="true">
            <div className="admin-drawer-header">
              <h2>Quote Details</h2>
              <button
                className="admin-btn-icon"
                onClick={() => setSelectedQuote(null)}
                aria-label="Close"
              >
                <i className="fas fa-times" />
              </button>
            </div>

            <div className="admin-drawer-body">
              <div className="admin-detail-section">
                <h3>Client Information</h3>
                <div className="admin-detail-grid">
                  <div>
                    <label>Name</label>
                    <p>{selectedQuote.clientName}</p>
                  </div>
                  <div>
                    <label>Email</label>
                    <p>{selectedQuote.email}</p>
                  </div>
                  <div>
                    <label>Phone</label>
                    <p>{selectedQuote.phone}</p>
                  </div>
                </div>
              </div>

              <div className="admin-detail-section">
                <h3>Event Details</h3>
                <div className="admin-detail-grid">
                  <div>
                    <label>Event Type</label>
                    <p>{selectedQuote.eventType}</p>
                  </div>
                  <div>
                    <label>Event Date</label>
                    <p>{fmt(selectedQuote.eventDate)}</p>
                  </div>
                  <div>
                    <label>Guest Count</label>
                    <p>{selectedQuote.guestCount}</p>
                  </div>
                  <div>
                    <label>Budget</label>
                    <p>{selectedQuote.budget}</p>
                  </div>
                  <div>
                    <label>Venue</label>
                    <p>{selectedQuote.venue}</p>
                  </div>
                  <div>
                    <label>Submitted</label>
                    <p>{fmt(selectedQuote.submittedDate)}</p>
                  </div>
                </div>
              </div>

              <div className="admin-detail-section">
                <h3>Update status</h3>
                <div className="drawer-status-row">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                      type="button"
                      key={key}
                      className={selectedQuote.status === key ? 'active' : ''}
                      onClick={() => {
                        handleStatusUpdate(selectedQuote.id, key);
                        setSelectedQuote((prev) => (prev ? { ...prev, status: key } : prev));
                      }}
                    >
                      <i className={`fas ${cfg.icon}`} aria-hidden="true" /> {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="admin-drawer-footer">
              <a
                className="btn btn-ghost"
                href={`mailto:${selectedQuote.email}?subject=${encodeURIComponent(
                  `Re: your ${selectedQuote.eventType} enquiry`
                )}`}
              >
                <i className="fas fa-envelope" aria-hidden="true" /> Email
              </a>
              <a
                className="btn btn-secondary"
                href={`tel:${selectedQuote.phone.replace(/[^+\d]/g, '')}`}
              >
                <i className="fas fa-phone" aria-hidden="true" /> Call
              </a>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  handleStatusUpdate(selectedQuote.id, 'quoted');
                  setSelectedQuote(null);
                }}
              >
                <i className="fas fa-paper-plane" aria-hidden="true" /> Send quote
              </button>
            </div>
          </div>
        </AdminPortal>
      )}
    </>
  );
}
