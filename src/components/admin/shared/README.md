# Admin Shared Components

Standardized, reusable components for the admin interface. These components ensure visual consistency, accessibility, and maintainability across all admin pages.

## Installation

Import components from the shared index:

```jsx
import { AdminButton, AdminBadge, AdminLoadingState, AdminEmptyState } from '../../components/admin/shared';
```

Or import individually:

```jsx
import AdminButton from '../../components/admin/shared/AdminButton';
```

## Components

### AdminButton

Standardized button component with consistent styling and behavior.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'accent' \| 'ghost' \| 'danger'` | `'primary'` | Button style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `icon` | `string` | `null` | FontAwesome icon class (e.g., 'fa-plus') |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Icon position relative to text |
| `loading` | `boolean` | `false` | Show loading spinner |
| `disabled` | `boolean` | `false` | Disable button |
| `fullWidth` | `boolean` | `false` | Make button full width |
| `onClick` | `function` | - | Click handler |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Button type attribute |
| `className` | `string` | `''` | Additional CSS classes |
| `ariaLabel` | `string` | - | Accessible label for screen readers |

#### Examples

```jsx
// Primary button with icon
<AdminButton variant="primary" icon="fa-plus" onClick={handleAdd}>
  Add Client
</AdminButton>

// Loading state
<AdminButton variant="accent" loading={true}>
  Saving...
</AdminButton>

// Danger button (small)
<AdminButton variant="danger" icon="fa-trash" size="sm" onClick={handleDelete}>
  Delete
</AdminButton>

// Ghost button (icon only)
<AdminButton variant="ghost" icon="fa-edit" ariaLabel="Edit item" />

// Full width button
<AdminButton variant="primary" fullWidth onClick={handleSubmit}>
  Submit Form
</AdminButton>
```

---

### AdminBadge

Standardized status badge with predefined variants for consistency.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | See variants below | `null` | Predefined badge variant |
| `color` | `'pending' \| 'active' \| 'approved' \| 'featured' \| 'rejected' \| 'success'` | `null` | Badge color (if variant not set) |
| `label` | `string` | `null` | Badge text (overrides variant label) |
| `icon` | `string` | `null` | FontAwesome icon (overrides variant icon) |
| `showIcon` | `boolean` | `true` | Show/hide icon |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Badge size |
| `className` | `string` | `''` | Additional CSS classes |
| `ariaLabel` | `string` | - | Accessible label for screen readers |

#### Predefined Variants

| Variant | Icon | Color | Label |
|---------|------|-------|-------|
| `pending` | fa-circle | Yellow | Pending |
| `active` | fa-check-circle | Blue | Active |
| `approved` | fa-check | Green | Approved |
| `featured` | fa-star | Purple | Featured |
| `rejected` | fa-times | Red | Rejected |
| `success` | fa-check-circle | Green | Success |
| `contacted` | fa-phone | Blue | Contacted |
| `quoted` | fa-file-alt | Purple | Quoted |
| `confirmed` | fa-check-double | Green | Confirmed |
| `declined` | fa-times-circle | Red | Declined |
| `website` | fa-laptop | Purple | Website |
| `event` | fa-utensils | Green | Event |
| `referral` | fa-user-friends | Blue | Referral |

#### Examples

```jsx
// Using predefined variant
<AdminBadge variant="approved" />
// Output: ✓ Approved (green)

// Custom label with variant styling
<AdminBadge variant="pending" label="Awaiting Review" />
// Output: ● Awaiting Review (yellow)

// Fully custom badge
<AdminBadge color="active" icon="fa-bolt" label="Custom Status" />

// Without icon
<AdminBadge variant="approved" showIcon={false} />

// Small size
<AdminBadge variant="featured" size="sm" />
```

---

### AdminLoadingState

Standardized loading indicators for different contexts.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'spinner' \| 'skeleton' \| 'inline'` | `'spinner'` | Loading indicator type |
| `message` | `string` | `null` | Loading message to display |
| `rows` | `number` | `5` | Number of skeleton rows (skeleton variant only) |
| `className` | `string` | `''` | Additional CSS classes |

#### Examples

```jsx
// Default centered spinner
<AdminLoadingState />

// With custom message
<AdminLoadingState message="Loading clients..." />

// Skeleton loader for tables
<AdminLoadingState variant="skeleton" rows={5} />

// Inline loader (for buttons, small sections)
<AdminLoadingState variant="inline" message="Saving..." />
```

#### When to Use Each Variant

- **spinner**: Full-page or section loading (default)
- **skeleton**: Table/list loading (shows structure while loading)
- **inline**: Button loading states, small inline sections

---

### AdminEmptyState

Standardized empty state component for when there's no data to display.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `string` | `'fa-inbox'` | FontAwesome icon class |
| `title` | `string` | `'No data'` | Main heading text |
| `description` | `string` | `null` | Supporting description text |
| `actionIcon` | `string` | `null` | Action button icon |
| `actionLabel` | `string` | `null` | Action button label |
| `onAction` | `function` | `null` | Action button click handler |
| `actionVariant` | `'primary' \| 'secondary' \| 'accent' \| 'ghost' \| 'danger'` | `'primary'` | Action button variant |
| `variant` | `'default' \| 'search' \| 'error'` | `'default'` | Empty state variant |
| `className` | `string` | `''` | Additional CSS classes |

#### Examples

```jsx
// Basic empty state
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
```

---

## Design Tokens

All components use standardized design tokens defined in `src/styles/admin/_tokens.scss`:

### Spacing Scale
- `$spacing-xs`: 4px
- `$spacing-sm`: 8px
- `$spacing-md`: 12px
- `$spacing-base`: 16px
- `$spacing-lg`: 24px
- `$spacing-xl`: 32px
- `$spacing-2xl`: 48px
- `$spacing-3xl`: 64px

### Typography Scale
- `$font-size-xs`: 12px
- `$font-size-sm`: 13px
- `$font-size-base`: 15px
- `$font-size-md`: 16px
- `$font-size-lg`: 18px
- `$font-size-xl`: 22px
- `$font-size-2xl`: 28px
- `$font-size-3xl`: 36px

### Status Colors
- **Pending**: Yellow (#fef3c7 bg, #92400e text)
- **Active**: Blue (#dbeafe bg, #1e40af text)
- **Approved**: Green (#d1fae5 bg, #065f46 text)
- **Featured**: Purple (#ede9fe bg, #5b21b6 text)
- **Rejected**: Red (#fee2e2 bg, #991b1b text)

---

## Accessibility

All components follow WCAG 2.1 AA standards:

- ✅ Proper ARIA labels and roles
- ✅ Keyboard navigation support
- ✅ Focus indicators
- ✅ Screen reader announcements
- ✅ Color contrast ratios meet AA standards

### Best Practices

```jsx
// ✅ Good: Proper aria-label for icon-only button
<AdminButton variant="ghost" icon="fa-edit" ariaLabel="Edit client" />

// ❌ Bad: No accessible label
<AdminButton variant="ghost" icon="fa-edit" />

// ✅ Good: Status badge with proper role
<AdminBadge variant="approved" />
// Renders with role="status" and aria-label="Status: Approved"

// ✅ Good: Loading state with screen reader text
<AdminLoadingState message="Loading clients..." />
// Includes hidden text for screen readers
```

---

## Migration Guide

### Replacing Old Patterns

#### Buttons

**Before:**
```jsx
<button type="button" className="btn btn-primary" onClick={handleClick}>
  <i className="fas fa-plus" aria-hidden="true"></i> Add Client
</button>
```

**After:**
```jsx
<AdminButton variant="primary" icon="fa-plus" onClick={handleClick}>
  Add Client
</AdminButton>
```

#### Status Badges

**Before:**
```jsx
<span className="status-badge approved">
  <i className="fas fa-check" aria-hidden="true"></i>
  Approved
</span>
```

**After:**
```jsx
<AdminBadge variant="approved" />
```

#### Loading States

**Before:**
```jsx
{loading ? (
  <div className="admin-loading">
    <div className="admin-spinner"></div>
  </div>
) : (
  // content
)}
```

**After:**
```jsx
{loading ? (
  <AdminLoadingState />
) : (
  // content
)}
```

#### Empty States

**Before:**
```jsx
<div className="admin-empty-state">
  <div className="admin-empty-icon">
    <i className="fas fa-users" aria-hidden="true"></i>
  </div>
  <h3>No clients found</h3>
  <p>Add your first client to get started.</p>
  <button type="button" className="btn btn-primary" onClick={handleAdd}>
    <i className="fas fa-plus" aria-hidden="true"></i> Add Client
  </button>
</div>
```

**After:**
```jsx
<AdminEmptyState
  icon="fa-users"
  title="No clients found"
  description="Add your first client to get started."
  actionIcon="fa-plus"
  actionLabel="Add Client"
  onAction={handleAdd}
/>
```

---

## Testing

All components include PropTypes validation and are designed to be easily testable:

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminButton } from '../shared';

test('AdminButton calls onClick when clicked', () => {
  const handleClick = jest.fn();
  render(<AdminButton onClick={handleClick}>Click me</AdminButton>);
  
  fireEvent.click(screen.getByText('Click me'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});

test('AdminButton shows loading state', () => {
  render(<AdminButton loading>Loading</AdminButton>);
  expect(screen.getByRole('button')).toBeDisabled();
  expect(screen.getByText('Loading')).toBeInTheDocument();
});
```

---

## Contributing

When adding new shared components:

1. Create component file in `src/components/admin/shared/`
2. Create corresponding SCSS file in `src/styles/admin/`
3. Export from `src/components/admin/shared/index.js`
4. Import SCSS in `src/styles/admin/index.scss`
5. Add documentation to this README
6. Add PropTypes validation
7. Ensure accessibility compliance
8. Write tests

---

## Support

For questions or issues with these components, please refer to:
- [Admin UI Standardization Plan](../../../ADMIN_UI_STANDARDIZATION_PLAN.md)
- [Main Project README](../../../README.md)
