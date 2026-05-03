# Complete Admin Frontend Architecture

## Overview

A premium, custom-built admin interface for Sri Karthikeya Caterers that feels like a natural extension of the existing website. Every component preserves the brand's elegant, luxurious identity.

---

## Admin Architecture

### 1. **Routing Structure**

```
/admin
├── /login                    # Admin login (phone + OTP)
├── /dashboard                # Main dashboard
├── /reviews
│   ├── /pending             # Pending reviews
│   ├── /approved            # Approved reviews
│   ├── /rejected            # Rejected reviews
│   └── /featured            # Featured reviews
├── /review-invitations
│   ├── /send                # Send new invitation
│   ├── /history             # Invitation history
│   └── /bulk                # Bulk invitations
├── /emails
│   ├── /templates           # Email templates
│   ├── /create              # Create template
│   ├── /edit/:id            # Edit template
│   └── /campaigns           # Email campaigns
├── /clients
│   ├── /list                # All clients
│   ├── /add                 # Add client
│   └── /profile/:id         # Client profile
├── /quotes
│   ├── /pending             # Pending quotes
│   ├── /all                 # All quotes
│   └── /detail/:id          # Quote detail
├── /subscribers
│   ├── /list                # All subscribers
│   └── /campaigns           # Newsletter campaigns
└── /settings
    ├── /profile             # Admin profile
    └── /preferences         # Preferences
```

---

## Component Hierarchy

```
AdminApp
├── AdminLogin
│   ├── PhoneInput
│   ├── OTPVerification
│   └── LoadingState
│
├── AdminLayout
│   ├── AdminSidebar
│   │   ├── SidebarNav
│   │   ├── SidebarFooter
│   │   └── CollapseToggle
│   │
│   ├── AdminTopbar
│   │   ├── SearchBar
│   │   ├── NotificationBell
│   │   └── UserMenu
│   │
│   └── AdminContent
│       └── [Page Components]
│
├── Dashboard
│   ├── StatsGrid
│   │   └── StatCard
│   ├── RecentActivity
│   ├── QuickActions
│   └── AnalyticsCharts
│
├── Reviews
│   ├── ReviewsTable
│   │   ├── ReviewRow
│   │   ├── ReviewFilters
│   │   └── ReviewPagination
│   │
│   ├── ReviewDetailModal
│   │   ├── ReviewHeader
│   │   ├── ReviewRatings
│   │   ├── ReviewContent
│   │   └── ReviewActions
│   │
│   └── ReviewModerationPanel
│       ├── ApproveButton
│       ├── RejectButton
│       └── FeatureToggle
│
├── ReviewInvitations
│   ├── SendInvitationForm
│   │   ├── ClientSelector
│   │   ├── EventDetails
│   │   └── ExpirySettings
│   │
│   ├── InvitationHistory
│   │   ├── InvitationCard
│   │   └── StatusBadge
│   │
│   └── BulkInvitationFlow
│       ├── ClientSelection
│       └── BulkSendConfirm
│
├── EmailBuilder
│   ├── TemplateList
│   │   └── TemplateCard
│   │
│   ├── EmailEditor
│   │   ├── EditorToolbar
│   │   ├── RichTextEditor
│   │   ├── VariableInserter
│   │   └── LivePreview
│   │
│   └── EmailCampaign
│       ├── AudienceSelector
│       ├── ScheduleSettings
│       └── SendConfirmation
│
├── Clients
│   ├── ClientsTable
│   │   ├── ClientRow
│   │   └── ClientFilters
│   │
│   ├── ClientProfile
│   │   ├── ClientInfo
│   │   ├── EventHistory
│   │   ├── ReviewStatus
│   │   └── FollowUpNotes
│   │
│   └── AddClientModal
│       └── ClientForm
│
├── Quotes
│   ├── QuotesTable
│   │   ├── QuoteRow
│   │   └── QuoteFilters
│   │
│   └── QuoteDetail
│       ├── QuoteInfo
│       ├── ClientContact
│       ├── StatusManager
│       └── NotesSection
│
├── Subscribers
│   ├── SubscribersTable
│   │   ├── SubscriberRow
│   │   └── SubscriberFilters
│   │
│   └── NewsletterCampaign
│       ├── SubscriberSelection
│       └── CampaignSettings
│
└── Shared Components
    ├── DataTable
    ├── Modal
    ├── Drawer
    ├── Card
    ├── Badge
    ├── Dropdown
    ├── DatePicker
    ├── SearchInput
    ├── FilterPanel
    ├── Pagination
    ├── EmptyState
    ├── LoadingSpinner
    ├── SkeletonLoader
    └── ConfirmDialog
```

---

## File Structure

```
src/
├── pages/
│   └── admin/
│       ├── AdminLoginPage.jsx
│       ├── AdminDashboardPage.jsx
│       ├── ReviewsPendingPage.jsx
│       ├── ReviewsApprovedPage.jsx
│       ├── ReviewsRejectedPage.jsx
│       ├── ReviewsFeaturedPage.jsx
│       ├── ReviewInvitationsPage.jsx
│       ├── SendInvitationPage.jsx
│       ├── InvitationHistoryPage.jsx
│       ├── EmailTemplatesPage.jsx
│       ├── EmailEditorPage.jsx
│       ├── EmailCampaignsPage.jsx
│       ├── ClientsPage.jsx
│       ├── ClientProfilePage.jsx
│       ├── QuotesPage.jsx
│       ├── QuoteDetailPage.jsx
│       ├── SubscribersPage.jsx
│       └── SettingsPage.jsx
│
├── components/
│   └── admin/
│       ├── layout/
│       │   ├── AdminLayout.jsx
│       │   ├── AdminSidebar.jsx
│       │   ├── AdminTopbar.jsx
│       │   ├── SidebarNav.jsx
│       │   └── UserMenu.jsx
│       │
│       ├── dashboard/
│       │   ├── StatCard.jsx
│       │   ├── StatsGrid.jsx
│       │   ├── RecentActivity.jsx
│       │   ├── QuickActions.jsx
│       │   └── AnalyticsCard.jsx
│       │
│       ├── reviews/
│       │   ├── ReviewsTable.jsx
│       │   ├── ReviewRow.jsx
│       │   ├── ReviewDetailModal.jsx
│       │   ├── ReviewFilters.jsx
│       │   ├── ReviewRatings.jsx
│       │   ├── ReviewActions.jsx
│       │   └── ReviewStatusBadge.jsx
│       │
│       ├── invitations/
│       │   ├── SendInvitationForm.jsx
│       │   ├── ClientSelector.jsx
│       │   ├── InvitationCard.jsx
│       │   ├── InvitationHistory.jsx
│       │   └── BulkInvitationFlow.jsx
│       │
│       ├── emails/
│       │   ├── TemplateList.jsx
│       │   ├── TemplateCard.jsx
│       │   ├── EmailEditor.jsx
│       │   ├── RichTextEditor.jsx
│       │   ├── EmailPreview.jsx
│       │   ├── VariableInserter.jsx
│       │   ├── AudienceSelector.jsx
│       │   └── CampaignSettings.jsx
│       │
│       ├── clients/
│       │   ├── ClientsTable.jsx
│       │   ├── ClientRow.jsx
│       │   ├── ClientProfile.jsx
│       │   ├── ClientInfo.jsx
│       │   ├── EventHistory.jsx
│       │   ├── AddClientModal.jsx
│       │   └── ClientForm.jsx
│       │
│       ├── quotes/
│       │   ├── QuotesTable.jsx
│       │   ├── QuoteRow.jsx
│       │   ├── QuoteDetail.jsx
│       │   ├── QuoteInfo.jsx
│       │   ├── StatusManager.jsx
│       │   └── NotesSection.jsx
│       │
│       ├── subscribers/
│       │   ├── SubscribersTable.jsx
│       │   ├── SubscriberRow.jsx
│       │   ├── SubscriberFilters.jsx
│       │   └── NewsletterCampaign.jsx
│       │
│       └── shared/
│           ├── DataTable.jsx
│           ├── Modal.jsx
│           ├── Drawer.jsx
│           ├── Card.jsx
│           ├── Badge.jsx
│           ├── Dropdown.jsx
│           ├── DatePicker.jsx
│           ├── SearchInput.jsx
│           ├── FilterPanel.jsx
│           ├── Pagination.jsx
│           ├── EmptyState.jsx
│           ├── LoadingSpinner.jsx
│           ├── SkeletonLoader.jsx
│           └── ConfirmDialog.jsx
│
├── hooks/
│   └── admin/
│       ├── useAdminAuth.js
│       ├── useReviews.js
│       ├── useClients.js
│       ├── useQuotes.js
│       ├── useSubscribers.js
│       ├── useEmailTemplates.js
│       └── useInvitations.js
│
├── contexts/
│   └── admin/
│       ├── AdminAuthContext.js
│       ├── AdminLayoutContext.js
│       └── AdminNotificationContext.js
│
├── utils/
│   └── admin/
│       ├── adminAuth.js
│       ├── adminApi.js
│       ├── formatters.js
│       └── validators.js
│
└── styles/
    └── AdminComplete.css
```

---

## Design Principles

### 1. **Brand Authenticity**
- Uses exact same colors from `tokens.css`
- Same typography (Fraunces + Inter)
- Same spacing (8pt grid)
- Same radii, shadows, motion
- Same button styles
- Same form patterns

### 2. **Premium Feel**
- Elegant card designs
- Smooth animations
- Thoughtful micro-interactions
- Beautiful empty states
- Premium loading states
- Luxurious color palette

### 3. **Responsive Design**
- Desktop-first admin experience
- Tablet-optimized layouts
- Mobile-friendly navigation
- Collapsible sidebar
- Touch-friendly controls

### 4. **Accessibility**
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus management
- Screen reader support

---

## Key Features

### 1. **Admin Login**
- Phone number input
- OTP verification
- Smooth step transitions
- Loading states
- Error handling
- Remember device option

### 2. **Dashboard**
- Real-time stats
- Recent activity feed
- Quick action cards
- Analytics visualizations
- Top reviews showcase
- Pending items alerts

### 3. **Review Management**
- Tabbed interface (Pending/Approved/Rejected/Featured)
- Detailed review modal
- Inline moderation actions
- Bulk selection
- Search and filters
- Rating visualizations

### 4. **Review Invitations**
- Client selection
- Event details form
- Expiry settings
- Invitation history
- Status tracking
- Bulk sending

### 5. **Email Builder**
- Template library
- Rich text editor
- Variable insertion
- Live preview
- Drag-and-drop sections
- Responsive email preview

### 6. **Client Management**
- Comprehensive client table
- Client profile drawer
- Event history
- Review status
- Follow-up notes
- Quick actions

### 7. **Quote Management**
- Quote requests table
- Detailed quote view
- Status workflow
- Client contact info
- Notes and follow-ups
- Priority indicators

### 8. **Subscriber Management**
- Subscriber list
- Email status
- Subscription source
- Bulk actions
- Newsletter targeting
- Export functionality

---

## Responsive Breakpoints

```css
/* Desktop */
@media (min-width: 1024px) {
  - Full sidebar visible
  - Multi-column layouts
  - Expanded tables
  - Side-by-side panels
}

/* Tablet */
@media (min-width: 640px) and (max-width: 1023px) {
  - Collapsible sidebar
  - 2-column grids
  - Horizontal scroll tables
  - Stacked panels
}

/* Mobile */
@media (max-width: 639px) {
  - Bottom navigation
  - Single column
  - Card-based tables
  - Full-screen modals
}
```

---

## State Management

### Authentication State
```javascript
{
  isAuthenticated: boolean,
  user: { phone, name, role },
  token: string,
  expiresAt: timestamp
}
```

### Layout State
```javascript
{
  sidebarCollapsed: boolean,
  sidebarMobile: boolean,
  notifications: array,
  theme: 'light' | 'dark'
}
```

### Data State
```javascript
{
  reviews: { pending, approved, rejected, featured },
  clients: array,
  quotes: array,
  subscribers: array,
  invitations: array,
  templates: array
}
```

---

## Animation Strategy

### Page Transitions
```css
/* Fade + lift on route change */
animation: pageEnter 460ms var(--ease-out-expo);
```

### Card Hover
```css
/* Lift + shadow on hover */
transform: translateY(-3px);
box-shadow: 0 18px 40px -8px rgba(20, 58, 38, 0.14);
```

### Modal Enter
```css
/* Scale + fade */
animation: modalEnter 320ms var(--ease-out-expo);
```

### Drawer Slide
```css
/* Slide from right */
transform: translateX(100%);
transition: transform 420ms var(--ease-out-expo);
```

---

## Next Steps

1. Implement AdminLogin with phone + OTP
2. Build AdminLayout with sidebar + topbar
3. Create Dashboard with stats and activity
4. Build Reviews management system
5. Create Review Invitations flow
6. Build Email Builder
7. Create Client Management
8. Build Quote Management
9. Create Subscriber Management
10. Add Settings and Profile

All components will use the existing design system and feel like a natural extension of the website.
