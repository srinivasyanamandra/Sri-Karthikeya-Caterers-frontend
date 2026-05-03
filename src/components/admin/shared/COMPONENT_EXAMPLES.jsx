/**
 * Component Examples & Visual Guide
 * 
 * This file demonstrates all available components and their variants.
 * Use this as a reference when building admin pages.
 * 
 * To view: Import this component in a test page or route
 */

import React, { useState } from 'react';
import {
  AdminButton,
  AdminBadge,
  AdminLoadingState,
  AdminEmptyState,
} from './index';

const ComponentExamples = () => {
  const [loading, setLoading] = useState(false);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Admin Component Library</h1>

      {/* ========== BUTTONS ========== */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>AdminButton</h2>

        {/* Variants */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Variants</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <AdminButton variant="primary" icon="fa-check">
              Primary
            </AdminButton>
            <AdminButton variant="secondary" icon="fa-edit">
              Secondary
            </AdminButton>
            <AdminButton variant="accent" icon="fa-star">
              Accent
            </AdminButton>
            <AdminButton variant="ghost" icon="fa-eye">
              Ghost
            </AdminButton>
            <AdminButton variant="danger" icon="fa-trash">
              Danger
            </AdminButton>
          </div>
        </div>

        {/* Sizes */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Sizes</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <AdminButton variant="primary" size="sm" icon="fa-plus">
              Small
            </AdminButton>
            <AdminButton variant="primary" size="md" icon="fa-plus">
              Medium (Default)
            </AdminButton>
            <AdminButton variant="primary" size="lg" icon="fa-plus">
              Large
            </AdminButton>
          </div>
        </div>

        {/* Icon Positions */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Icon Positions</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <AdminButton variant="primary" icon="fa-arrow-left" iconPosition="left">
              Icon Left
            </AdminButton>
            <AdminButton variant="primary" icon="fa-arrow-right" iconPosition="right">
              Icon Right
            </AdminButton>
            <AdminButton variant="ghost" icon="fa-edit" ariaLabel="Edit item" />
          </div>
        </div>

        {/* States */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>States</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <AdminButton variant="primary" icon="fa-save" onClick={handleLoadingDemo}>
              Normal
            </AdminButton>
            <AdminButton variant="primary" icon="fa-save" loading={loading}>
              {loading ? 'Saving...' : 'Click to Load'}
            </AdminButton>
            <AdminButton variant="primary" icon="fa-save" disabled>
              Disabled
            </AdminButton>
          </div>
        </div>

        {/* Full Width */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Full Width</h3>
          <AdminButton variant="primary" icon="fa-check" fullWidth>
            Full Width Button
          </AdminButton>
        </div>

        {/* Code Example */}
        <details style={{ marginTop: '1rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Show Code</summary>
          <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '6px', overflow: 'auto' }}>
{`<AdminButton 
  variant="primary"     // primary | secondary | accent | ghost | danger
  size="md"             // sm | md | lg
  icon="fa-plus"        // FontAwesome icon class
  iconPosition="left"   // left | right
  loading={false}       // Show loading spinner
  disabled={false}      // Disable button
  fullWidth={false}     // Make button full width
  onClick={handleClick}
>
  Button Text
</AdminButton>`}
          </pre>
        </details>
      </section>

      {/* ========== BADGES ========== */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>AdminBadge</h2>

        {/* Status Variants */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Status Variants</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <AdminBadge variant="pending" />
            <AdminBadge variant="active" />
            <AdminBadge variant="approved" />
            <AdminBadge variant="featured" />
            <AdminBadge variant="rejected" />
            <AdminBadge variant="success" />
          </div>
        </div>

        {/* Quote Variants */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Quote Status Variants</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <AdminBadge variant="contacted" />
            <AdminBadge variant="quoted" />
            <AdminBadge variant="confirmed" />
            <AdminBadge variant="declined" />
          </div>
        </div>

        {/* Source Variants */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Source Variants</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <AdminBadge variant="website" />
            <AdminBadge variant="event" />
            <AdminBadge variant="referral" />
          </div>
        </div>

        {/* Sizes */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Sizes</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <AdminBadge variant="approved" size="sm" />
            <AdminBadge variant="approved" size="md" />
            <AdminBadge variant="approved" size="lg" />
          </div>
        </div>

        {/* Custom */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Custom Badge</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <AdminBadge color="active" icon="fa-bolt" label="Custom Status" />
            <AdminBadge variant="approved" label="Custom Label" />
            <AdminBadge variant="featured" showIcon={false} label="No Icon" />
          </div>
        </div>

        {/* Code Example */}
        <details style={{ marginTop: '1rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Show Code</summary>
          <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '6px', overflow: 'auto' }}>
{`// Using predefined variant
<AdminBadge variant="approved" />

// Custom label with variant styling
<AdminBadge variant="pending" label="Awaiting Review" />

// Fully custom badge
<AdminBadge color="active" icon="fa-bolt" label="Custom Status" />

// Without icon
<AdminBadge variant="approved" showIcon={false} />

// Different sizes
<AdminBadge variant="featured" size="sm" />
<AdminBadge variant="featured" size="md" />
<AdminBadge variant="featured" size="lg" />`}
          </pre>
        </details>
      </section>

      {/* ========== LOADING STATES ========== */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>AdminLoadingState</h2>

        {/* Spinner */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Spinner (Default)</h3>
          <div style={{ border: '1px solid #e5e5e5', borderRadius: '6px', padding: '1rem' }}>
            <AdminLoadingState message="Loading data..." />
          </div>
        </div>

        {/* Skeleton */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Skeleton Loader</h3>
          <div style={{ border: '1px solid #e5e5e5', borderRadius: '6px' }}>
            <AdminLoadingState variant="skeleton" rows={5} />
          </div>
        </div>

        {/* Inline */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Inline Loader</h3>
          <div style={{ border: '1px solid #e5e5e5', borderRadius: '6px', padding: '1rem' }}>
            <AdminLoadingState variant="inline" message="Saving changes..." />
          </div>
        </div>

        {/* Code Example */}
        <details style={{ marginTop: '1rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Show Code</summary>
          <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '6px', overflow: 'auto' }}>
{`// Default centered spinner
<AdminLoadingState />

// With custom message
<AdminLoadingState message="Loading clients..." />

// Skeleton loader for tables
<AdminLoadingState variant="skeleton" rows={5} />

// Inline loader (for buttons, small sections)
<AdminLoadingState variant="inline" message="Saving..." />

// Usage in conditional rendering
{loading ? (
  <AdminLoadingState message="Loading..." />
) : (
  <YourContent />
)}`}
          </pre>
        </details>
      </section>

      {/* ========== EMPTY STATES ========== */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>AdminEmptyState</h2>

        {/* Default */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Default Empty State</h3>
          <div style={{ border: '1px solid #e5e5e5', borderRadius: '6px' }}>
            <AdminEmptyState
              icon="fa-inbox"
              title="No data yet"
              description="Add your first item to get started."
              actionIcon="fa-plus"
              actionLabel="Add Item"
              onAction={() => alert('Action clicked!')}
            />
          </div>
        </div>

        {/* Search Variant */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Search Results Empty</h3>
          <div style={{ border: '1px solid #e5e5e5', borderRadius: '6px' }}>
            <AdminEmptyState
              icon="fa-search"
              title="No results found"
              description="Try adjusting your search criteria."
              variant="search"
            />
          </div>
        </div>

        {/* Error Variant */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Error State</h3>
          <div style={{ border: '1px solid #e5e5e5', borderRadius: '6px' }}>
            <AdminEmptyState
              icon="fa-exclamation-triangle"
              title="Failed to load data"
              description="Please try again or contact support."
              variant="error"
              actionIcon="fa-redo"
              actionLabel="Retry"
              onAction={() => alert('Retry clicked!')}
            />
          </div>
        </div>

        {/* Without Action */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Without Action Button</h3>
          <div style={{ border: '1px solid #e5e5e5', borderRadius: '6px' }}>
            <AdminEmptyState
              icon="fa-check-circle"
              title="All caught up!"
              description="You've reviewed all pending items."
            />
          </div>
        </div>

        {/* Code Example */}
        <details style={{ marginTop: '1rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Show Code</summary>
          <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '6px', overflow: 'auto' }}>
{`// Basic empty state
<AdminEmptyState
  icon="fa-users"
  title="No clients yet"
  description="Add your first client to get started."
/>

// With action button
<AdminEmptyState
  icon="fa-inbox"
  title="No pending reviews"
  description="All reviews have been moderated."
  actionIcon="fa-plus"
  actionLabel="Add Review"
  onAction={handleAddReview}
/>

// Search results empty state
<AdminEmptyState
  icon="fa-search"
  title="No results found"
  description="Try adjusting your search criteria."
  variant="search"
/>

// Error state
<AdminEmptyState
  icon="fa-exclamation-triangle"
  title="Failed to load data"
  description="Please try again or contact support."
  variant="error"
  actionLabel="Retry"
  onAction={handleRetry}
/>

// Usage in conditional rendering
{data.length === 0 ? (
  <AdminEmptyState
    icon="fa-inbox"
    title="No data"
    actionLabel="Add Item"
    onAction={handleAdd}
  />
) : (
  <YourDataDisplay data={data} />
)}`}
          </pre>
        </details>
      </section>

      {/* ========== COMBINED EXAMPLE ========== */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Real-World Example</h2>
        <p style={{ marginBottom: '1rem', color: '#666' }}>
          Here's how these components work together in a typical admin page:
        </p>

        <div style={{ border: '1px solid #e5e5e5', borderRadius: '6px', padding: '1.5rem' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <AdminButton variant="ghost" icon="fa-filter" size="sm">
                Filter
              </AdminButton>
              <AdminButton variant="ghost" icon="fa-download" size="sm">
                Export
              </AdminButton>
            </div>
            <AdminButton variant="primary" icon="fa-plus">
              Add Client
            </AdminButton>
          </div>

          {/* Mock Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e5e5' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                <td style={{ padding: '0.75rem' }}>Rajesh Kumar</td>
                <td style={{ padding: '0.75rem' }}>
                  <AdminBadge variant="approved" />
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <AdminButton variant="ghost" size="sm">View</AdminButton>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                <td style={{ padding: '0.75rem' }}>Priya Sharma</td>
                <td style={{ padding: '0.75rem' }}>
                  <AdminBadge variant="pending" />
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <AdminButton variant="ghost" size="sm">View</AdminButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Code Example */}
        <details style={{ marginTop: '1rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Show Code</summary>
          <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '6px', overflow: 'auto' }}>
{`import {
  AdminButton,
  AdminBadge,
  AdminLoadingState,
  AdminEmptyState,
} from '../../components/admin/shared';

const MyAdminPage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  return (
    <div>
      {/* Toolbar */}
      <div className="admin-toolbar">
        <AdminButton variant="ghost" icon="fa-filter">
          Filter
        </AdminButton>
        <AdminButton variant="primary" icon="fa-plus">
          Add Client
        </AdminButton>
      </div>

      {/* Content */}
      {loading ? (
        <AdminLoadingState message="Loading clients..." />
      ) : data.length === 0 ? (
        <AdminEmptyState
          icon="fa-users"
          title="No clients yet"
          actionLabel="Add Client"
          onAction={handleAdd}
        />
      ) : (
        <table>
          {data.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td><AdminBadge variant={item.status} /></td>
              <td>
                <AdminButton variant="ghost" size="sm">
                  View
                </AdminButton>
              </td>
            </tr>
          ))}
        </table>
      )}
    </div>
  );
};`}
          </pre>
        </details>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: '4rem', padding: '2rem', background: '#f5f5f5', borderRadius: '6px' }}>
        <h3 style={{ marginBottom: '1rem' }}>Documentation</h3>
        <p style={{ marginBottom: '0.5rem' }}>
          📚 <strong>Component README:</strong> <code>src/components/admin/shared/README.md</code>
        </p>
        <p style={{ marginBottom: '0.5rem' }}>
          📖 <strong>Implementation Guide:</strong> <code>IMPLEMENTATION_GUIDE.md</code>
        </p>
        <p style={{ marginBottom: '0.5rem' }}>
          🔄 <strong>Refactoring Comparison:</strong> <code>REFACTORING_COMPARISON.md</code>
        </p>
        <p>
          📋 <strong>Full Plan:</strong> <code>ADMIN_UI_STANDARDIZATION_PLAN.md</code>
        </p>
      </footer>
    </div>
  );
};

export default ComponentExamples;
