# Sri Karthikeya Caterers — Backend System Design (Spring Boot)

> Final, minimal, production-ready design.
> 7 tables. JWT-protected admin. One-time review links. Mixed-audience email campaigns with per-recipient templates.

---

## 1. Architecture Overview

```
┌────────────────────┐     ┌────────────────────┐     ┌───────────────┐
│   React Frontend   │────▶│  Spring Boot API   │────▶│  PostgreSQL    │
│  (this repo)       │     │  (this design)     │     │  (7 tables)    │
└────────────────────┘     └─────────┬──────────┘     └───────────────┘
                                     │
                                     ▼
                              SMTP (Gmail / SES)
```

### Stack
- **Spring Boot 3.2+ (Java 17+)**
- **Spring Security 6 + JWT (HS256)**
- **Spring Data JPA / Hibernate**
- **PostgreSQL 14+**
- **Spring Mail** (Gmail SMTP / SES)
- **Bean Validation** (`jakarta.validation`)
- **Async send** via `@Async` + a single-bounded `ThreadPoolTaskExecutor`

### Auth model
- Single admin, **email + password hardcoded** in `application.yml`.
- Successful login mints a **stateless JWT** signed with HS256.
- Every `/api/admin/**` request requires `Authorization: Bearer <jwt>`.
- Public endpoints (quotes, subscribe, public reviews, review submit) are open.
- No sessions, no cookies, no admin table, no Redis.

---

## 2. Finalised Modules

| # | Module                            | Public? | Endpoints (high level)                                          |
|---|-----------------------------------|---------|-----------------------------------------------------------------|
| 1 | Admin auth (JWT)                  | Public  | `POST /api/admin/auth/login`                                    |
| 2 | Admin dashboard                   | Admin   | `GET  /api/admin/dashboard`                                     |
| 3 | Quote requests                    | Both    | `POST /api/quotes`, `GET/PUT /api/admin/quotes`                 |
| 4 | Reviews — link & submit           | Public  | `GET /api/reviews/{token}`, `POST /api/reviews/{token}`         |
| 5 | Reviews — moderation              | Admin   | invite / approve / reject / feature                             |
| 6 | Reviews — public list             | Public  | `GET /api/reviews/public`, `GET /api/reviews/featured`          |
| 7 | Email Builder (templates)         | Admin   | CRUD templates                                                  |
| 8 | **Recipients (clients + subs)**   | Admin   | unified search across `clients ∪ subscribers`                   |
| 9 | **Email Campaigns**               | Admin   | compose · preview · send · schedule · history                   |
|10 | Subscribe (newsletter)            | Public  | `POST /api/subscribe`                                           |

---

## 3. Database — 7 Tables Total

> Six core tables + one `email_campaigns` table for campaign tracking. No
> separate `email_logs` — per-recipient send results live in `system_logs`.

### 3.1 `clients`
```sql
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  phone       VARCHAR(20)  NOT NULL,
  source      VARCHAR(40)  NOT NULL DEFAULT 'quote_request',
  status      VARCHAR(40)  NOT NULL DEFAULT 'lead',
  notes       TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_clients_email  ON clients(email);
CREATE INDEX idx_clients_status ON clients(status);
```
*`status` ∈ `lead | contacted | quoted | booked | completed | cancelled`*

### 3.2 `quote_requests`
```sql
CREATE TABLE quote_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  event_type   VARCHAR(40)  NOT NULL,
  event_date   DATE         NOT NULL,
  guests       INTEGER      NOT NULL CHECK (guests > 0),
  venue        VARCHAR(200),
  budget       VARCHAR(40),
  message      TEXT,
  status       VARCHAR(40)  NOT NULL DEFAULT 'pending',
  responded_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_quotes_client  ON quote_requests(client_id);
CREATE INDEX idx_quotes_status  ON quote_requests(status);
CREATE INDEX idx_quotes_date    ON quote_requests(event_date);
```
*`status` ∈ `pending | contacted | quoted | booked | declined`*

### 3.3 `reviews` — unified (invitation + submitted)
```sql
CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type            VARCHAR(20) NOT NULL,             -- 'invitation' | 'review'
  event_type      VARCHAR(40) NOT NULL,
  event_date      DATE        NOT NULL,

  -- Invitation columns
  token           VARCHAR(64) UNIQUE,               -- secure random, URL-safe
  expires_at      TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  used_at         TIMESTAMPTZ,                      -- one-time-use guard

  -- Submitted-review columns
  invitation_id          UUID REFERENCES reviews(id),
  reviewer_name          VARCHAR(120),
  overall_rating         SMALLINT CHECK (overall_rating BETWEEN 1 AND 5),
  food_quality_rating    SMALLINT CHECK (food_quality_rating BETWEEN 1 AND 5),
  taste_rating           SMALLINT CHECK (taste_rating BETWEEN 1 AND 5),
  presentation_rating    SMALLINT CHECK (presentation_rating BETWEEN 1 AND 5),
  staff_behavior_rating  SMALLINT CHECK (staff_behavior_rating BETWEEN 1 AND 5),
  timeliness_rating      SMALLINT CHECK (timeliness_rating BETWEEN 1 AND 5),
  service_quality_rating SMALLINT CHECK (service_quality_rating BETWEEN 1 AND 5),
  comments        TEXT,
  suggestions     TEXT,
  recommend       VARCHAR(10),
  status          VARCHAR(20) DEFAULT 'pending',
  is_featured     BOOLEAN DEFAULT FALSE,
  is_public       BOOLEAN DEFAULT FALSE,
  moderated_at    TIMESTAMPTZ,
  submitted_at    TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reviews_token   ON reviews(token)      WHERE type = 'invitation';
CREATE INDEX idx_reviews_expires ON reviews(expires_at) WHERE type = 'invitation' AND used_at IS NULL;
CREATE INDEX idx_reviews_public   ON reviews(is_public, created_at DESC) WHERE type = 'review' AND is_public = TRUE;
CREATE INDEX idx_reviews_featured ON reviews(is_featured)                WHERE type = 'review' AND is_featured = TRUE;
CREATE INDEX idx_reviews_status   ON reviews(status)                     WHERE type = 'review';
```

**One-time-use mechanic**

```
GET  /api/reviews/{token}          → 200 if  token valid, expires_at > now, used_at IS NULL
                                     410 GONE otherwise
POST /api/reviews/{token}          → atomically:
   1. SELECT … FOR UPDATE WHERE token=? AND used_at IS NULL AND expires_at > now()
   2. INSERT new row with type='review', invitation_id = invitation.id
   3. UPDATE invitation SET used_at = now()    ← prevents reuse
   4. COMMIT
```

### 3.4 `subscribers`
```sql
CREATE TABLE subscribers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  name            VARCHAR(120),
  source          VARCHAR(40) NOT NULL DEFAULT 'website',
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  unsubscribed_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscribers_active ON subscribers(is_active) WHERE is_active = TRUE;
```

### 3.5 `email_templates`
```sql
CREATE TABLE email_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(120) UNIQUE NOT NULL,
  type        VARCHAR(40)  NOT NULL,        -- 'review_invitation' | 'campaign' | 'quote_confirmation' | 'custom'
  subject     VARCHAR(200) NOT NULL,
  preheader   VARCHAR(200),
  content     JSONB        NOT NULL,        -- { "html", "text", "blocks", "variables" }
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_templates_type ON email_templates(type) WHERE is_active = TRUE;
```

Variable substitution at send-time: `{{clientName}}`, `{{eventDate}}`, `{{reviewLink}}`, `{{month}}`, …

### 3.6 `email_campaigns` — campaign tracking
```sql
CREATE TABLE email_campaigns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(200) NOT NULL,
  status            VARCHAR(20)  NOT NULL DEFAULT 'draft',
                                  -- 'draft' | 'queued' | 'sending' | 'sent' | 'failed' | 'cancelled'

  -- Resolved recipient list snapshot (frozen at queue time)
  -- Each entry: { kind: 'client'|'subscriber', id, email, name, templateId, variables: {…} }
  recipients        JSONB        NOT NULL DEFAULT '[]'::jsonb,
  total_recipients  INTEGER      NOT NULL DEFAULT 0,
  sent_count        INTEGER      NOT NULL DEFAULT 0,
  failed_count      INTEGER      NOT NULL DEFAULT 0,

  -- Original send config (segments + per-recipient overrides + global vars)
  config            JSONB        NOT NULL DEFAULT '{}'::jsonb,
  global_variables  JSONB        NOT NULL DEFAULT '{}'::jsonb,

  -- Default template (used when a recipient has no per-row templateId)
  default_template_id UUID REFERENCES email_templates(id),

  scheduled_at      TIMESTAMPTZ,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_campaigns_status   ON email_campaigns(status);
CREATE INDEX idx_campaigns_schedule ON email_campaigns(scheduled_at) WHERE status = 'queued';
CREATE INDEX idx_campaigns_created  ON email_campaigns(created_at DESC);
```

> **Why a campaign table at all?** It stores the materialised recipient
> list at the moment of send (so post-hoc audit reflects who actually got
> the email even if a subscriber later unsubscribes), tracks aggregate
> counts cheaply, and gives the UI a single endpoint for "campaign
> history". Per-recipient delivery details still flow into `system_logs`
> with `entity_type='email_campaign'` so individual SMTP retries / bounces
> are auditable.

### 3.7 `system_logs` — single unified audit
```sql
CREATE TABLE system_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type         VARCHAR(40) NOT NULL,        -- 'auth' | 'email' | 'review' | 'quote' | 'campaign' | 'admin'
  entity_type  VARCHAR(40),                 -- 'client' | 'review' | 'quote_request' | 'subscriber' | 'email_campaign' …
  entity_id    UUID,
  action       VARCHAR(60) NOT NULL,        -- 'login' | 'sent' | 'delivered' | 'failed' | 'approved' …
  status       VARCHAR(20),                 -- 'success' | 'failed' | 'pending'
  details      JSONB,                       -- free-form context (recipient, error, message-id, …)
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_logs_type    ON system_logs(type);
CREATE INDEX idx_logs_entity  ON system_logs(entity_type, entity_id);
CREATE INDEX idx_logs_created ON system_logs(created_at DESC);
```

> **Total: 7 tables.** `clients`, `quote_requests`, `reviews`, `subscribers`, `email_templates`, `email_campaigns`, `system_logs`.

---

## 4. Authentication (Hardcoded Email + JWT)

### 4.1 Configuration
```yaml
admin:
  email:    info@srikarthikeyacaterers.in
  password: ${ADMIN_PASSWORD}        # bcrypt-hashed at startup or compared via BCryptPasswordEncoder
jwt:
  secret:     ${JWT_SECRET}           # ≥ 32 bytes
  expiration: 86400000                # 24 h, ms
```

### 4.2 Login endpoint — `POST /api/admin/auth/login`
**Request**
```json
{ "email": "info@srikarthikeyacaterers.in", "password": "PlainTextPassword" }
```
**Response — 200 OK**
```json
{
  "token":     "eyJhbGciOiJIUzI1NiJ9…",
  "expiresAt": "2026-05-04T18:00:00Z",
  "user":      { "email": "info@srikarthikeyacaterers.in", "role": "ADMIN" }
}
```
**Response — 401 Unauthorized**
```json
{ "error": "INVALID_CREDENTIALS", "message": "Email or password is incorrect." }
```

### 4.3 Spring Security skeleton

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
  @Bean
  SecurityFilterChain http(HttpSecurity http, JwtAuthFilter jwt) throws Exception {
    return http
      .csrf(c -> c.disable())
      .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
      .authorizeHttpRequests(a -> a
        .requestMatchers("/api/admin/auth/login").permitAll()
        .requestMatchers("/api/admin/**").authenticated()
        .anyRequest().permitAll())
      .addFilterBefore(jwt, UsernamePasswordAuthenticationFilter.class)
      .build();
  }
}
```

```java
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
  private final JwtService jwt;
  @Override protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    String h = req.getHeader("Authorization");
    if (h != null && h.startsWith("Bearer ")) {
      try {
        var claims = jwt.parse(h.substring(7));
        var auth = new UsernamePasswordAuthenticationToken(
          claims.getSubject(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(auth);
      } catch (JwtException e) { /* leave unauthenticated */ }
    }
    chain.doFilter(req, res);
  }
}
```

### 4.4 Auth-error envelope (used by all endpoints)
```json
{ "error": "UNAUTHORIZED",     "message": "Missing or invalid token." }
{ "error": "TOKEN_EXPIRED",    "message": "Session expired. Please sign in again." }
{ "error": "VALIDATION_ERROR", "message": "...", "fields": { "email": "must be a valid email" } }
{ "error": "NOT_FOUND",        "message": "Quote 9c14… not found." }
{ "error": "RATE_LIMITED",     "message": "Too many login attempts. Try again in 60 seconds." }
```

---

## 5. Public APIs (no JWT)

### 5.1 Submit quote — `POST /api/quotes`
**Request**
```json
{
  "name":      "Priya Sharma",
  "email":     "priya@example.com",
  "phone":     "+91 98765 43211",
  "eventType": "wedding",
  "eventDate": "2026-09-14",
  "guests":    500,
  "venue":     "Grand Palace, Hyderabad",
  "budget":    "₹5,00,000",
  "message":   "Pure-veg banquet, four live counters."
}
```
**Response — 201**
```json
{
  "id":         "f1a4ba1e-…",
  "status":     "pending",
  "createdAt":  "2026-05-03T10:12:00Z",
  "message":    "Thank you. Our team will reply within 24 hours."
}
```

### 5.2 Subscribe — `POST /api/subscribe`
```json
// Request
{ "email": "priya@example.com", "name": "Priya Sharma" }
// Response — 201
{ "subscribed": true, "email": "priya@example.com" }
// 409 Conflict if email already active.
```

### 5.3 Open review invitation — `GET /api/reviews/{token}`
```json
// 200 OK
{
  "valid":     true,
  "client":    { "name": "Priya Sharma" },
  "eventType": "wedding",
  "eventDate": "2026-09-14",
  "expiresAt": "2026-09-28T23:59:59Z"
}
// 410 Gone
{ "valid": false, "reason": "EXPIRED_OR_USED" }
```

### 5.4 Submit review — `POST /api/reviews/{token}`
```json
// Request
{
  "reviewerName":         "Priya Sharma",
  "overallRating":        5,
  "foodQualityRating":    5,
  "tasteRating":          5,
  "presentationRating":   4,
  "staffBehaviorRating":  5,
  "timelinessRating":     5,
  "serviceQualityRating": 5,
  "comments":             "Genuinely the best veg catering we've used.",
  "suggestions":          "More live mocktail variety.",
  "recommend":            "yes"
}
// Response — 201
{ "id": "1f3c…", "submittedAt": "2026-09-15T19:24:00Z", "moderation": "pending",
  "message": "Thank you. Your review will be published after moderation." }
// 410 Gone if token already used or expired.
```

### 5.5 Public reviews — `GET /api/reviews/public?limit=24&page=0&minRating=4`
```json
{
  "page": 0, "size": 24, "total": 87,
  "items": [
    {
      "id":            "1f3c…",
      "reviewerName":  "Priya Sharma",
      "eventType":     "wedding",
      "eventDate":     "2026-09-14",
      "overallRating": 5,
      "comments":      "Genuinely the best veg catering we've used.",
      "isFeatured":    true,
      "submittedAt":   "2026-09-15T19:24:00Z"
    }
  ]
}
```

### 5.6 Featured reviews — `GET /api/reviews/featured?limit=6`
Same shape as 5.5; returns rows with `is_featured = TRUE`.

---

## 6. Admin APIs (JWT required)

All endpoints below require `Authorization: Bearer <jwt>`.

### 6.1 Dashboard — `GET /api/admin/dashboard`
```json
{
  "totals": {
    "clients": 247, "quotesPending": 12, "quotesBooked": 9,
    "reviewsPending": 8, "reviewsApproved": 64, "subscribersActive": 1834,
    "campaignsThisMonth": 3
  },
  "trends": {
    "newClientsThisMonth": 12, "newQuotesThisMonth": 24,
    "campaignsSentThisMonth": 3, "emailsDeliveredThisMonth": 4842
  },
  "recentActivity": [
    { "id": "log_…", "type": "campaign", "action": "sent",
      "message": "Campaign 'May 2026 Newsletter' sent to 1,834 recipients",
      "at": "2026-05-02T16:48:00Z" }
  ]
}
```

### 6.2 Quote management
| Method | Path                            | Purpose                       |
|--------|---------------------------------|-------------------------------|
| GET    | `/api/admin/quotes`             | List, with filters & paging   |
| GET    | `/api/admin/quotes/{id}`        | Detail (incl. client + log)   |
| PUT    | `/api/admin/quotes/{id}/status` | Update status                 |

### 6.3 Reviews — moderation
| Method | Path                                       | Purpose                |
|--------|--------------------------------------------|------------------------|
| GET    | `/api/admin/reviews`                       | All submitted reviews  |
| GET    | `/api/admin/reviews/invitations`           | All invitations        |
| GET    | `/api/admin/reviews/{id}`                  | One row                |
| POST   | `/api/admin/reviews/invite`                | Generate invitation    |
| PUT    | `/api/admin/reviews/{id}/approve`          | Approve                |
| PUT    | `/api/admin/reviews/{id}/reject`           | Reject                 |
| PUT    | `/api/admin/reviews/{id}/feature`          | Toggle featured        |
| DELETE | `/api/admin/reviews/{id}`                  | Soft-delete            |

`POST /api/admin/reviews/invite` body & response are unchanged from prior version.

### 6.4 Email Builder (templates)
| Method | Path                              | Purpose            |
|--------|-----------------------------------|--------------------|
| GET    | `/api/admin/templates`            | List templates     |
| GET    | `/api/admin/templates/{id}`       | One template       |
| POST   | `/api/admin/templates`            | Create             |
| PUT    | `/api/admin/templates/{id}`       | Update             |
| DELETE | `/api/admin/templates/{id}`       | Delete             |
| POST   | `/api/admin/templates/{id}/test`  | Send a test email  |

### 6.5 Clients
| Method | Path                              | Purpose                          |
|--------|-----------------------------------|----------------------------------|
| GET    | `/api/admin/clients`              | List + filters + paging          |
| GET    | `/api/admin/clients/{id}`         | Detail incl. quotes & reviews    |
| PUT    | `/api/admin/clients/{id}`         | Update                           |

### 6.6 Subscribers
| Method | Path                                   | Purpose                  |
|--------|----------------------------------------|--------------------------|
| GET    | `/api/admin/subscribers`               | List with paging/search  |
| DELETE | `/api/admin/subscribers/{id}`          | Hard-delete              |
| PUT    | `/api/admin/subscribers/{id}/unsubscribe` | Mark inactive         |

`GET /api/admin/subscribers?q=priya&active=true&page=0&size=50`
```json
{
  "page": 0, "size": 50, "total": 1834,
  "items": [
    { "id": "sub_…", "email": "priya@example.com", "name": "Priya Sharma",
      "source": "website", "isActive": true,
      "createdAt": "2026-04-22T08:00:00Z" }
  ]
}
```

---

## 6.7 ★ Recipients — unified search across Clients ∪ Subscribers

Powers the campaign-builder's "pick recipients" step. Returns both
audiences in a single, paged response so the UI shows a unified table
with a `kind` column.

### `GET /api/admin/recipients`

**Query params**
| Param            | Default | Notes                                                                          |
|------------------|---------|--------------------------------------------------------------------------------|
| `q`              | —       | Free-text match against name + email                                           |
| `kind`           | `all`   | `all` \| `clients` \| `subscribers`                                            |
| `clientStatus`   | —       | filter clients by `lead | contacted | quoted | booked | completed | cancelled` |
| `subscribed`     | —       | filter subscribers by `is_active`                                              |
| `minRating`      | —       | only clients who have ≥ N-star approved review                                 |
| `eventType`      | —       | only clients with quotes/reviews of this type                                  |
| `since`          | —       | ISO date — created on/after                                                    |
| `until`          | —       | ISO date — created on/before                                                   |
| `page`, `size`   | 0, 50   | pagination                                                                     |
| `sort`           | `createdAt,desc` | sortable on `name`, `email`, `createdAt`                              |

**Response — 200**
```json
{
  "page": 0, "size": 50, "total": 2081,
  "kindCounts": { "clients": 247, "subscribers": 1834 },
  "items": [
    {
      "kind":     "client",
      "id":       "cli_9f2…",
      "name":     "Priya Sharma",
      "email":    "priya@example.com",
      "phone":    "+91 98765 43211",
      "tags":     ["wedding", "booked"],
      "lastEventDate": "2026-04-22",
      "createdAt": "2026-03-12T10:00:00Z"
    },
    {
      "kind":     "subscriber",
      "id":       "sub_7a3…",
      "name":     "Anand Reddy",
      "email":    "anand@example.com",
      "phone":    null,
      "tags":     ["website", "active"],
      "createdAt": "2026-04-22T08:00:00Z"
    }
  ]
}
```

> The frontend's "Add recipients" modal uses two tabs (Clients /
> Subscribers) backed by the same endpoint with `?kind=…` plus a third
> "Selected" panel held client-side as `[{ kind, id, email, … }]`.

### `POST /api/admin/recipients/resolve`
Takes a mix of explicit IDs and / or filter segments and returns the
**materialised recipient list** the campaign would actually send to
(deduped by email, unsubscribed rows removed, name fallbacks applied).
Used by the UI to show "1,832 recipients ready" before sending.

**Request**
```json
{
  "include": [
    { "kind": "client",     "id": "cli_9f2…" },
    { "kind": "subscriber", "id": "sub_7a3…" }
  ],
  "segments": [
    { "kind": "subscribers", "filter": { "active": true } },
    { "kind": "clients",     "filter": { "status": "booked", "since": "2026-01-01" } }
  ],
  "exclude": [
    { "kind": "subscriber", "id": "sub_unsubscribed_…" }
  ]
}
```

**Response — 200**
```json
{
  "totalUnique":   1832,
  "byKind":        { "clients": 18, "subscribers": 1814 },
  "deduplicated":  6,                        // emails present in both lists
  "skippedInactive": 0,
  "preview":       [                          // first 10 only
    { "kind": "client",     "id": "cli_9f2…", "email": "priya@example.com",  "name": "Priya Sharma" },
    { "kind": "subscriber", "id": "sub_7a3…", "email": "anand@example.com",  "name": "Anand Reddy"  }
  ]
}
```

---

## 6.8 ★ Email Campaigns — compose · preview · send · history

A campaign is a saved object with a recipient list, a default template,
and optional **per-recipient template overrides**. The wizard maps 1:1
to the endpoints below.

### Wizard flow (frontend → backend)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Step 1 — COMPOSE   POST /api/admin/campaigns          → draft id   │
│  Step 2 — PICK      POST /api/admin/campaigns/{id}/recipients       │
│                     (include / segments / exclude)                  │
│                     PUT  /api/admin/campaigns/{id}/templates        │
│                     (default + per-recipient overrides)             │
│  Step 3 — REVIEW    GET  /api/admin/campaigns/{id}                  │
│                     POST /api/admin/campaigns/{id}/preview          │
│  Step 4 — SEND      POST /api/admin/campaigns/{id}/send             │
│                     (or schedule body for later)                    │
│  Step 5 — HISTORY   GET  /api/admin/campaigns                       │
│                     GET  /api/admin/campaigns/{id}                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.8.1 Create draft — `POST /api/admin/campaigns`
```json
// Request
{
  "name":              "May 2026 — Newsletter + Booked-client follow-up",
  "defaultTemplateId": "tpl_newsletter_may",
  "globalVariables":   { "month": "May 2026" }
}
// Response — 201
{
  "id":                "cmp_8e4…",
  "name":              "May 2026 — Newsletter + Booked-client follow-up",
  "status":            "draft",
  "defaultTemplateId": "tpl_newsletter_may",
  "totalRecipients":   0,
  "createdAt":         "2026-05-03T10:00:00Z"
}
```

### 6.8.2 Add / replace recipients — `POST /api/admin/campaigns/{id}/recipients`

Accepts the same shape as `POST /api/admin/recipients/resolve` plus a
`mode`. Server stores the **materialised** list (snapshot) on the
campaign row.

**Request**
```json
{
  "mode": "replace",            // 'append' | 'replace'
  "include": [
    { "kind": "client",     "id": "cli_9f2…" }
  ],
  "segments": [
    { "kind": "subscribers", "filter": { "active": true } },
    { "kind": "clients",     "filter": { "status": "booked", "since": "2026-01-01" } }
  ],
  "exclude": [
    { "kind": "subscriber", "id": "sub_unsubscribed_…" }
  ]
}
```

**Response — 200**
```json
{
  "campaignId":      "cmp_8e4…",
  "totalRecipients": 1832,
  "byKind":          { "clients": 18, "subscribers": 1814 },
  "deduplicated":    6,
  "preview":         [ /* first 10 — same shape as resolve.preview */ ]
}
```

### 6.8.3 Assign templates — `PUT /api/admin/campaigns/{id}/templates`

Three assignment modes; one body covers all three.

**Mode A — same template for everyone (simplest)**
```json
{ "defaultTemplateId": "tpl_newsletter_may" }
```

**Mode B — different template per audience kind**
```json
{
  "defaultTemplateId":   "tpl_newsletter_may",        // fallback
  "byKindTemplate": {
    "client":     "tpl_client_followup",
    "subscriber": "tpl_newsletter_may"
  }
}
```

**Mode C — per-recipient override**
```json
{
  "defaultTemplateId": "tpl_newsletter_may",
  "perRecipient": [
    { "kind": "client", "id": "cli_9f2…", "templateId": "tpl_vip_thankyou" },
    { "kind": "client", "id": "cli_aa1…", "templateId": "tpl_vip_thankyou",
      "variables": { "freebie": "complimentary mocktail counter" } }
  ]
}
```

Resolution order at send time, per recipient:
1. `perRecipient[].templateId` (if matched)
2. `byKindTemplate[recipient.kind]`
3. `defaultTemplateId`

`409 Conflict` if any referenced template is missing or `is_active = FALSE`.

**Response — 200**
```json
{
  "campaignId":         "cmp_8e4…",
  "defaultTemplateId":  "tpl_newsletter_may",
  "byKindTemplate":     { "client": "tpl_client_followup", "subscriber": "tpl_newsletter_may" },
  "overrideCount":      2,
  "templatesValidated": true
}
```

### 6.8.4 Preview a render — `POST /api/admin/campaigns/{id}/preview`

Renders the chosen template + variables for either a specific recipient
or a sample of N recipients. Used by the wizard's "Preview" pane.

**Request — single recipient**
```json
{ "recipient": { "kind": "client", "id": "cli_9f2…" } }
```

**Request — sample (random N)**
```json
{ "sample": 3 }
```

**Response — 200**
```json
{
  "renders": [
    {
      "recipient": { "kind": "client", "id": "cli_9f2…", "email": "priya@example.com", "name": "Priya Sharma" },
      "template":  { "id": "tpl_client_followup", "name": "Client follow-up · May 2026" },
      "subject":   "Thank you for choosing us, Priya",
      "preheader": "We'd love to host your next event.",
      "html":      "<h1>Thank you, Priya</h1>…",
      "text":      "Thank you, Priya. …",
      "variablesResolved": {
        "clientName":  "Priya Sharma",
        "month":       "May 2026",
        "reviewLink":  "https://srikarthikeyacaterers.in/#feedback?t=…"
      }
    }
  ]
}
```

### 6.8.5 Send / schedule — `POST /api/admin/campaigns/{id}/send`

Validates the campaign (recipients > 0, every resolved template exists,
default template present) and either dispatches **immediately** or
queues for `scheduleAt`.

**Request**
```json
{
  "scheduleAt": null,                // null = send now; ISO-8601 = schedule
  "throttle":   { "perMinute": 120 } // optional, default from config
}
```

**Response — 202 Accepted**
```json
{
  "campaignId":      "cmp_8e4…",
  "status":          "queued",
  "totalRecipients": 1832,
  "scheduledFor":    "2026-05-03T10:35:00Z"
}
```

**Server actions (async)**
1. Set campaign `status='sending'`, `started_at=now()`.
2. For each recipient:
   - Pick template per resolution order (§6.8.3).
   - Merge `globalVariables ⊕ recipient.variables ⊕ { name, email, reviewLink, … }`.
   - Render `subject`, `html`, `text`.
   - Send via SMTP. Increment `sent_count` or `failed_count`.
   - Insert `system_logs` row with `type='email'`, `entity_type='email_campaign'`, `entity_id=campaignId`, `details={ recipientEmail, templateId, smtpId, error? }`.
3. On completion: set `status='sent' | 'failed'`, `completed_at=now()`.

### 6.8.6 List campaigns — `GET /api/admin/campaigns?status=&q=&page=&size=`
```json
{
  "page": 0, "size": 25, "total": 18,
  "items": [
    {
      "id": "cmp_8e4…",
      "name": "May 2026 — Newsletter + Booked-client follow-up",
      "status": "sent",
      "totalRecipients": 1832,
      "sentCount": 1828,
      "failedCount": 4,
      "scheduledAt": null,
      "startedAt":   "2026-05-03T10:35:01Z",
      "completedAt": "2026-05-03T10:42:18Z",
      "createdAt":   "2026-05-03T10:00:00Z"
    }
  ]
}
```

### 6.8.7 Campaign detail — `GET /api/admin/campaigns/{id}`
Returns the full campaign incl. resolved recipients (paged inside the
detail), per-recipient delivery status (joined from `system_logs`), and
the original config payload.

```json
{
  "id":               "cmp_8e4…",
  "name":             "May 2026 — Newsletter + Booked-client follow-up",
  "status":           "sent",
  "defaultTemplateId":"tpl_newsletter_may",
  "byKindTemplate":   { "client": "tpl_client_followup", "subscriber": "tpl_newsletter_may" },
  "globalVariables":  { "month": "May 2026" },
  "totalRecipients":  1832,
  "sentCount":        1828,
  "failedCount":      4,
  "startedAt":        "2026-05-03T10:35:01Z",
  "completedAt":      "2026-05-03T10:42:18Z",
  "recipients": {
    "page": 0, "size": 50, "total": 1832,
    "items": [
      { "kind":"client",     "id":"cli_9f2…", "email":"priya@example.com",
        "templateId":"tpl_client_followup", "deliveryStatus":"delivered",
        "deliveredAt":"2026-05-03T10:36:14Z" },
      { "kind":"subscriber", "id":"sub_7a3…", "email":"anand@example.com",
        "templateId":"tpl_newsletter_may",   "deliveryStatus":"failed",
        "error":"550 mailbox not found" }
    ]
  }
}
```

### 6.8.8 Cancel a queued campaign — `POST /api/admin/campaigns/{id}/cancel`
Cancels a `queued` or `sending` campaign. In-flight emails finish; any
not yet attempted are skipped. Returns updated counts.

### 6.8.9 Send a single transactional email — `POST /api/admin/emails/send-one`
Convenience endpoint for the "send one email to one person" use case
that doesn't warrant a campaign record.

**Request**
```json
{
  "to":         { "kind": "client", "id": "cli_9f2…" },
  "templateId": "tpl_quote_followup",
  "variables":  { "quoteId": "f1a4…" }
}
```

**Response — 202**
```json
{ "ok": true, "templateId": "tpl_quote_followup", "messageId": "<smtp@…>" }
```

Logged in `system_logs` with `type='email'`, `entity_type='client'`.

---

## 7. Cross-Cutting Concerns

### 7.1 Validation
```java
public record CampaignRecipientsDto(
  String mode,                                          // 'append' | 'replace'
  List<RecipientRef> include,
  List<RecipientSegment> segments,
  List<RecipientRef> exclude
) {
  public record RecipientRef(@NotNull RecipientKind kind, @NotBlank String id) {}
  public record RecipientSegment(
    @NotNull RecipientKind kind,
    Map<String, Object> filter
  ) {}
  public enum RecipientKind { CLIENT, SUBSCRIBER, CLIENTS, SUBSCRIBERS }
}

public record CampaignTemplatesDto(
  @NotNull UUID defaultTemplateId,
  Map<String, UUID> byKindTemplate,                     // 'client' | 'subscriber'
  List<PerRecipientTemplate> perRecipient
) {
  public record PerRecipientTemplate(
    @NotNull RecipientKind kind,
    @NotBlank String id,
    @NotNull UUID templateId,
    Map<String, Object> variables
  ) {}
}
```

### 7.2 Rate-limiting (Bucket4j)
| Endpoint                                  | Quota                     |
|-------------------------------------------|---------------------------|
| `POST /api/admin/auth/login`              | 5 req / 5 min / IP        |
| `POST /api/quotes`                        | 10 req / hour / IP        |
| `POST /api/subscribe`                     | 5 req / hour / IP         |
| `POST /api/reviews/{token}`               | 3 req / hour / IP         |
| `POST /api/admin/campaigns/{id}/send`     | 10 sends / hour / admin   |
| `POST /api/admin/emails/send-one`         | 60 / hour / admin         |

### 7.3 Pagination contract
Every list endpoint accepts `page`, `size`, optional `sort=field,asc|desc` and returns:
```json
{ "page": 0, "size": 50, "total": 1832, "items": [ … ] }
```

### 7.4 Error envelope
```json
{
  "error":   "VALIDATION_ERROR",
  "message": "Field is invalid",
  "fields":  { "email": "must be a valid email" },
  "traceId": "8b9d…"
}
```
Error codes: `UNAUTHORIZED`, `TOKEN_EXPIRED`, `FORBIDDEN`, `NOT_FOUND`,
`VALIDATION_ERROR`, `RATE_LIMITED`, `CONFLICT`, `INTERNAL_ERROR`.

### 7.5 Logging
Every admin mutation, every email send, every review submit writes a
row to `system_logs` with `entity_type`, `entity_id`, `action`, `status`,
`details`. The dashboard's recent-activity feed reads from this table.

### 7.6 Async sending
A single `ThreadPoolTaskExecutor` (`core=2, max=8, queue=200`) runs
campaign batches off the request thread. Throttled by
`campaign.throttle.per-minute` (default 120). Each batch updates
`email_campaigns.sent_count / failed_count` atomically.

---

## 8. Configuration Reference

### 8.1 `application.yml`
```yaml
spring:
  application: { name: sri-karthikeya-caterers-backend }
  datasource:
    url:      jdbc:postgresql://localhost:5432/sri_karthikeya_caterers
    username: postgres
    password: ${DB_PASSWORD}
  jpa:
    hibernate.ddl-auto: validate
    properties.hibernate.jdbc.time_zone: UTC
  mail:
    host: smtp.gmail.com
    port: 587
    username: info@srikarthikeyacaterers.in
    password: ${SMTP_APP_PASSWORD}
    properties.mail.smtp:
      auth: true
      starttls.enable: true

server:
  port: 8080
  forward-headers-strategy: framework

admin:
  email:    info@srikarthikeyacaterers.in
  password: ${ADMIN_PASSWORD}

jwt:
  secret:     ${JWT_SECRET}
  expiration: 86400000

review:
  link.default-expires-days: 14
  base-url: https://srikarthikeyacaterers.in

campaign:
  throttle.per-minute: 120
  default-batch-size:  50

cors:
  allowed-origins:
    - https://srikarthikeyacaterers.in
    - http://localhost:3000
```

### 8.2 `pom.xml` (key deps only)
```xml
<dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId>      </dependency>
<dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-data-jpa</artifactId> </dependency>
<dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-security</artifactId> </dependency>
<dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-validation</artifactId></dependency>
<dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-mail</artifactId>     </dependency>
<dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-thymeleaf</artifactId></dependency>
<dependency> <groupId>org.postgresql</groupId>            <artifactId>postgresql</artifactId> <scope>runtime</scope> </dependency>
<dependency> <groupId>io.jsonwebtoken</groupId>           <artifactId>jjwt-api</artifactId>     <version>0.12.3</version> </dependency>
<dependency> <groupId>io.jsonwebtoken</groupId>           <artifactId>jjwt-impl</artifactId>    <version>0.12.3</version> <scope>runtime</scope> </dependency>
<dependency> <groupId>io.jsonwebtoken</groupId>           <artifactId>jjwt-jackson</artifactId> <version>0.12.3</version> <scope>runtime</scope> </dependency>
<dependency> <groupId>com.bucket4j</groupId>              <artifactId>bucket4j-core</artifactId><version>8.10.1</version> </dependency>
<dependency> <groupId>org.projectlombok</groupId>         <artifactId>lombok</artifactId>       <optional>true</optional>  </dependency>
```

---

## 9. Summary

| Area              | Decision                                                                                 |
|-------------------|------------------------------------------------------------------------------------------|
| **Tables**        | 7 — `clients`, `quote_requests`, `reviews`, `subscribers`, `email_templates`, `email_campaigns`, `system_logs` |
| **Auth**          | Hardcoded admin email/password → JWT (HS256, 24 h, stateless)                            |
| **Admin APIs**    | All under `/api/admin/**`, JWT-protected via `JwtAuthFilter`                             |
| **Public APIs**   | quotes, subscribe, reviews/{token}, reviews/public, reviews/featured                     |
| **Review links**  | secure 32-byte token, `expires_at`, `used_at` for one-time use                           |
| **Email builder** | one `email_templates` table, JSON content, `{{var}}` substitution                        |
| **Recipients**    | unified search across clients ∪ subscribers, `kind` field on every row                   |
| **Campaigns**     | five-step wizard — draft → recipients → templates → preview → send                       |
| **Templates / recipient** | three modes — global default, per-kind default, per-recipient override           |
| **Logging**       | one `system_logs` table; per-recipient delivery results live there                       |
| **Dashboard**     | totals + trends + recent activity (now incl. campaign counters)                          |

**Seven tables. Stateless JWT. One-time review tokens. Mixed-audience email
campaigns with per-recipient template assignment, materialised recipient
snapshots, and full delivery history. Every endpoint above maps 1:1 to a
screen the React admin already renders.**
