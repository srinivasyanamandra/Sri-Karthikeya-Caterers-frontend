# Database Summary - Sri Karthikeya Caterers

## Final Database Structure

**Total Tables: 7**

This is the complete, production-ready database schema for the Sri Karthikeya Caterers backend system.

---

## Table Overview

| # | Table Name | Purpose | Records |
|---|------------|---------|---------|
| 1 | `clients` | Client management (leads, bookings, completed events) | ~1000s |
| 2 | `quote_requests` | Quote submissions from website contact form | ~100s |
| 3 | `reviews` | **Unified:** Review invitations + submitted reviews | ~100s |
| 4 | `follow_ups` | Client follow-up tasks and reminders | ~100s |
| 5 | `subscribers` | Newsletter/notification subscribers | ~1000s |
| 6 | `email_templates` | **Unified:** Email templates with JSON content | ~10-20 |
| 7 | `system_logs` | **Unified:** All system activity logs | ~10000s |

---

## 1. Clients

**Purpose:** Central client database for all customer interactions

```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    source VARCHAR(50) DEFAULT 'quote_request',
    status VARCHAR(50) DEFAULT 'lead',
    is_subscribed BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

**Key Fields:**
- `source`: How client was acquired (`quote_request`, `manual`, `referral`)
- `status`: Pipeline stage (`lead`, `contacted`, `quoted`, `booked`, `completed`, `cancelled`)
- `is_subscribed`: Opted in for email notifications

**Indexes:**
- Email, phone, status, subscription status, created date

---

## 2. Quote Requests

**Purpose:** Track quote submissions from website

```sql
CREATE TABLE quote_requests (
    id UUID PRIMARY KEY,
    client_id UUID REFERENCES clients(id),
    event_type VARCHAR(50) NOT NULL,
    event_date DATE NOT NULL,
    guests INTEGER NOT NULL,
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

**Key Fields:**
- `event_type`: `wedding`, `corporate`, `private`, `religious`, `other`
- `status`: `pending`, `reviewed`, `quoted`, `accepted`, `declined`
- `guests`: Number of attendees

**Indexes:**
- Client ID, status, event date, created date

---

## 3. Reviews (Unified)

**Purpose:** Both review invitations AND submitted reviews in one table

```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY,
    client_id UUID REFERENCES clients(id),
    
    -- Type differentiation
    type VARCHAR(20) NOT NULL, -- 'invitation' or 'review'
    
    -- Core fields (both types)
    event_type VARCHAR(50) NOT NULL,
    event_date DATE NOT NULL,
    
    -- Invitation fields (type = 'invitation')
    token VARCHAR(64) UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Review fields (type = 'review')
    name VARCHAR(100),
    overall_rating SMALLINT,
    food_quality_rating SMALLINT,
    taste_rating SMALLINT,
    presentation_rating SMALLINT,
    staff_behavior_rating SMALLINT,
    timeliness_rating SMALLINT,
    service_quality_rating SMALLINT,
    comments TEXT,
    suggestions TEXT,
    recommend VARCHAR(10),
    
    -- Moderation (type = 'review')
    status VARCHAR(20) DEFAULT 'pending',
    is_featured BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    moderation_notes TEXT,
    moderated_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

**How It Works:**
- **Type = 'invitation'**: Review link sent to client
  - Uses: `token`, `expires_at`, `sent_at`
  - Review fields remain NULL
- **Type = 'review'**: Submitted client feedback
  - Uses: `name`, ratings, `comments`, `status`, `is_featured`, `is_public`
  - Invitation fields remain NULL

**Indexes:**
- Type, token (for invitations), status, public, featured, rating (for reviews)

**See:** `UNIFIED_REVIEW_SYSTEM.md` for detailed documentation

---

## 4. Follow-ups

**Purpose:** Client follow-up tasks and reminders

```sql
CREATE TABLE follow_ups (
    id UUID PRIMARY KEY,
    client_id UUID REFERENCES clients(id),
    quote_request_id UUID REFERENCES quote_requests(id),
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending',
    due_date DATE NOT NULL,
    due_time TIME,
    title VARCHAR(200) NOT NULL,
    notes TEXT,
    outcome TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
);
```

**Key Fields:**
- `type`: `call`, `email`, `whatsapp`, `meeting`
- `priority`: `low`, `medium`, `high`, `urgent`
- `status`: `pending`, `completed`, `cancelled`

**Indexes:**
- Client ID, status, due date, priority

---

## 5. Subscribers

**Purpose:** Newsletter and notification subscribers

```sql
CREATE TABLE subscribers (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    source VARCHAR(50) DEFAULT 'website',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(64),
    verified_at TIMESTAMP WITH TIME ZONE,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
);
```

**Key Fields:**
- `source`: `website`, `quote_request`, `manual`
- `is_active`: Currently subscribed
- `is_verified`: Email confirmed

**Indexes:**
- Email, active status, verified status

---

## 6. Email Templates (Unified)

**Purpose:** Reusable email templates with JSON content

```sql
CREATE TABLE email_templates (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    content JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

**Key Fields:**
- `type`: `review_invitation`, `quote_confirmation`, `campaign`, `jwt_token`, etc.
- `content`: JSON structure with `html`, `text`, and `variables` array

**Content Structure:**
```json
{
  "html": "<html>...</html>",
  "text": "Plain text version...",
  "variables": ["clientName", "eventDate", "reviewLink"]
}
```

**Default Templates:**
1. `review_invitation` - Send review links
2. `quote_confirmation` - Confirm quote requests
3. `jwt_token` - Send JWT tokens via email
4. `monthly_newsletter` - Campaign emails

**Indexes:**
- Type, name

---

## 7. System Logs (Unified)

**Purpose:** All system activity logging in one table

```sql
CREATE TABLE system_logs (
    id UUID PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    action VARCHAR(100) NOT NULL,
    status VARCHAR(50),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE
);
```

**Key Fields:**
- `type`: Log category (`email`, `review`, `quote`, `auth`, `campaign`, `admin_action`)
- `entity_type`: Related entity (`client`, `review`, `quote_request`, etc.)
- `action`: What happened (`sent`, `delivered`, `failed`, `approved`, `rejected`, `login`)
- `status`: Result (`success`, `failed`, `pending`)
- `details`: JSON with type-specific context

**Example Log Entries:**

**Email Log:**
```json
{
  "type": "email",
  "action": "sent",
  "status": "success",
  "details": {
    "recipient": "client@example.com",
    "subject": "Quote Confirmation",
    "template": "quote_confirmation"
  }
}
```

**Review Moderation Log:**
```json
{
  "type": "review",
  "action": "approved",
  "status": "success",
  "details": {
    "review_rating": 5,
    "is_featured": true,
    "moderation_notes": "Excellent feedback"
  }
}
```

**Auth Log:**
```json
{
  "type": "auth",
  "action": "login",
  "status": "success",
  "details": {
    "email": "admin@example.com",
    "method": "jwt"
  },
  "ip_address": "192.168.1.1"
}
```

**Indexes:**
- Type, entity (type + ID), action, created date

---

## Relationships

```
clients (1) ──→ (N) quote_requests
clients (1) ──→ (N) reviews
clients (1) ──→ (N) follow_ups

quote_requests (1) ──→ (N) follow_ups
```

---

## Authentication

**No admin table required!**

Authentication is handled via:
- Hardcoded email/password in `application.properties`
- JWT token generated and sent via email
- Spring Security with JWT filter for API protection

---

## Key Design Principles

### ✅ Unified Tables
- **Reviews**: Invitations + submitted reviews (type field)
- **Email Templates**: All templates with JSON content
- **System Logs**: All logging with type field

### ✅ Soft Deletes
All tables use `deleted_at` for soft deletion (except logs and subscribers)

### ✅ Audit Fields
- `created_at`: Record creation timestamp
- `updated_at`: Last modification timestamp (auto-updated via trigger)
- `deleted_at`: Soft delete timestamp

### ✅ UUID Primary Keys
All tables use UUID for primary keys (better for distributed systems)

### ✅ Flexible JSON Fields
- `email_templates.content`: Template structure
- `system_logs.details`: Type-specific context

### ✅ Proper Indexing
All tables have appropriate indexes for common queries

---

## Database Size Estimates

| Table | Estimated Records | Growth Rate |
|-------|------------------|-------------|
| clients | 1,000 - 5,000 | ~50/month |
| quote_requests | 500 - 2,000 | ~20/month |
| reviews | 200 - 1,000 | ~10/month |
| follow_ups | 500 - 2,000 | ~30/month |
| subscribers | 1,000 - 10,000 | ~100/month |
| email_templates | 10 - 20 | ~1/month |
| system_logs | 10,000 - 100,000 | ~500/day |

**Total Database Size (1 year):** ~500 MB - 2 GB

---

## Backup Strategy

### Daily Backups
- Full PostgreSQL dump
- Retention: 7 days

### Weekly Backups
- Full database backup
- Retention: 4 weeks

### Monthly Backups
- Full database backup
- Retention: 12 months

### Critical Tables (Real-time backup)
- `clients`
- `reviews` (type = 'review')
- `quote_requests`

---

## Performance Considerations

### Indexes
All tables have appropriate indexes for:
- Primary lookups (ID, email, token)
- Status filtering
- Date range queries
- Soft delete filtering

### Partitioning (Future)
If `system_logs` grows beyond 1M records:
- Partition by `created_at` (monthly)
- Archive old partitions

### Query Optimization
- Use `WHERE deleted_at IS NULL` in all queries
- Use partial indexes for status-based queries
- Use JSONB indexes for frequent JSON queries

---

## Migration Path

### From Old Schema (8+ tables)
1. Create new unified tables
2. Migrate data from old tables
3. Update application code
4. Drop old tables
5. Rename new tables

**See:** `UNIFIED_REVIEW_SYSTEM.md` for migration SQL

---

## Summary

This database schema is:

✅ **Simple** - Only 7 tables  
✅ **Flexible** - JSON fields for extensibility  
✅ **Maintainable** - Unified approach reduces complexity  
✅ **Scalable** - Proper indexing and soft deletes  
✅ **Production-ready** - Complete with audit trails and logging  

**Total Simplification:**
- ❌ No admin table (hardcoded auth)
- ❌ No separate review_invitations table (unified)
- ❌ No separate email_campaigns table (logged in system_logs)
- ❌ No separate email_logs table (logged in system_logs)

**Result:** Clean, minimal, and easy to maintain! 🎉
