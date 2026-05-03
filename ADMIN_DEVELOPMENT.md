# Admin Development Guide

## Quick Start

### Bypass Authentication (Development Only)

To skip the login flow during development, run this in your browser console:

```javascript
// Set development authentication tokens (valid for 24 hours)
localStorage.setItem('adminToken', 'dev-token-' + Date.now());
localStorage.setItem('adminTokenExpiry', (Date.now() + 86400000).toString());
localStorage.setItem('adminEmail', 'dev@example.com');

// Reload the page
location.reload();
```

Then navigate to any admin page:
- Dashboard: `http://localhost:3000/#admin-dashboard`
- Reviews: `http://localhost:3000/#admin-reviews`
- Clients: `http://localhost:3000/#admin-clients`
- Quotes: `http://localhost:3000/#admin-quotes`
- Subscribers: `http://localhost:3000/#admin-subscribers`
- Email Builder: `http://localhost:3000/#admin-emails`
- Send Invitation: `http://localhost:3000/#admin-send-invitation`

### Using the Login Page

Alternatively, you can use the login page at `http://localhost:3000/#admin-login`:

1. Enter any email and password (minimum 6 characters)
2. Click "Continue"
3. Enter any JWT token in the token field
4. Click "Verify & Login"

The mock authentication will automatically set the tokens and redirect you to the dashboard.

## Admin Pages

### Available Pages

1. **AdminDashboardPage** - Overview with stats and quick actions
2. **ReviewsPage** - Review moderation and management
3. **ClientsPage** - Client database management
4. **QuotesPage** - Quote request management
5. **SubscribersPage** - Newsletter subscriber management
6. **EmailBuilderPage** - Block-based email composer
7. **SendInvitationPage** - Review invitation sender

### Page Features

#### QuotesPage
- View all quote requests from the contact form
- Filter by status (pending, contacted, quoted, booked, declined)
- Search by client name, email, or event type
- Sort by any column
- View detailed quote information in a drawer
- Update quote status
- Stats dashboard showing pending, contacted, quoted, and booked counts

## Toast Notifications

All admin pages have access to toast notifications via the `useToast` hook:

```javascript
import { useToast } from './useToast';

function MyAdminPage() {
  const { toast } = useToast();
  
  // Success notification
  toast.success('Review approved successfully');
  
  // Error notification
  toast.error('Failed to delete client');
  
  // Warning notification
  toast.warning('This action cannot be undone');
  
  // Info notification
  toast.info('3 emails queued for sending');
}
```

## Shared Hooks

All admin pages have access to shared utility hooks in `adminHooks.js`:

- `useEscapeKey(handler)` - Close modals on ESC key
- `useClickOutside(ref, handler)` - Close overlays on outside click
- `useDebounce(value, delay)` - Debounced search value
- `useAnimatedCounter(target)` - Smooth number count-up animation
- `usePagination(items, perPage)` - Pagination with controls
- `useKeyboardShortcut(map)` - Register keyboard shortcuts
- `useFocusTrap(ref, active)` - Trap focus inside modals
- `PaginationBar` - Reusable pagination UI component

## Troubleshooting

### Infinite Loading Animation

If you see an infinite loading animation when accessing admin pages:

1. Clear your localStorage: `localStorage.clear()`
2. Run the development bypass script (see above)
3. Reload the page

### Authentication Redirect Loop

If you're stuck in a redirect loop:

1. Open browser console
2. Check for errors
3. Clear localStorage: `localStorage.clear()`
4. Navigate to login page: `http://localhost:3000/#admin-login`
5. Complete the mock login flow

### Toast Errors

If you see "useToast must be used inside <ToastProvider>" error:

- This should be fixed now - all admin pages are wrapped with ToastProvider
- If the error persists, check that you're importing from `./useToast` correctly

## Production Considerations

⚠️ **Important**: The current authentication is mock/simulated for development only.

Before deploying to production:

1. Replace mock API calls in `AdminLoginPage.jsx` with real backend endpoints
2. Implement proper JWT token generation and verification on the backend
3. Add token refresh logic
4. Implement proper session management
5. Add rate limiting to prevent brute force attacks
6. Use HTTPS only for all admin routes
7. Consider adding 2FA for additional security

## File Structure

```
src/pages/admin/
├── AdminDashboardPage.jsx    # Main dashboard
├── AdminLoginPage.jsx         # Authentication page
├── ReviewsPage.jsx           # Review management
├── ClientsPage.jsx           # Client database
├── SubscribersPage.jsx       # Newsletter subscribers
├── EmailBuilderPage.jsx      # Email composer
├── SendInvitationPage.jsx    # Review invitations
├── adminHooks.js             # Shared utility hooks
└── useToast.js               # Toast notification system
```
