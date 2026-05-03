-- ============================================================
-- Sri Karthikeya Caterers Database Schema
-- PostgreSQL 14+
-- Production-Ready DDL (Simplified Spring Boot Approach)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- AUTHENTICATION NOTE:
-- No admin table required. Authentication handled via:
-- - Hardcoded email/password in application.properties
-- - JWT token generated and sent via email
-- - Spring Security with JWT filter for API protection
-- ============================================================

-- ============================================================
-- 1. CLIENT MANAGEMENT
-- ============================================================

-- Clients table (from quote requests + manual entry)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    source VARCHAR(50) DEFAULT 'quote_request', -- 'quote_request', 'manual', 'referral'
    status VARCHAR(50) DEFAULT 'lead', -- 'lead', 'contacted', 'quoted', 'booked', 'completed', 'cancelled'
    is_subscribed BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_clients_email ON clients(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_phone ON clients(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_status ON clients(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_subscribed ON clients(is_subscribed) WHERE deleted_at IS NULL AND is_subscribed = true;
CREATE INDEX idx_clients_created ON clients(created_at DESC) WHERE deleted_at IS NULL;

COMMENT ON TABLE clients IS 'All clients (leads, booked, completed events)';
COMMENT ON COLUMN clients.source IS 'How the client was acquired';
COMMENT ON COLUMN clients.status IS 'Current stage in the sales/service pipeline';
COMMENT ON COLUMN clients.is_subscribed IS 'Opted in for email notifications';

-- ============================================================
-- 2. QUOTE REQUESTS
-- ============================================================

-- Quote requests from contact form
CREATE TABLE quote_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'wedding', 'corporate', 'private', 'religious', 'other'
    event_date DATE NOT NULL,
    guests INTEGER NOT NULL CHECK (guests > 0),
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reviewed', 'quoted', 'accepted', 'declined'
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_quote_requests_client ON quote_requests(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_quote_requests_status ON quote_requests(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_quote_requests_event_date ON quote_requests(event_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_quote_requests_created ON quote_requests(created_at DESC) WHERE deleted_at IS NULL;

COMMENT ON TABLE quote_requests IS 'Quote requests submitted via contact form';
COMMENT ON COLUMN quote_requests.status IS 'Current state of the quote request';

-- ============================================================
-- 3. UNIFIED REVIEW SYSTEM
-- ============================================================

-- Unified reviews table (invitations + submitted reviews)
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Type differentiation
    type VARCHAR(20) NOT NULL, -- 'invitation', 'review'
    
    -- Core fields (used by both types)
    event_type VARCHAR(50) NOT NULL,
    event_date DATE NOT NULL,
    
    -- Invitation-specific fields (used when type = 'invitation')
    token VARCHAR(64) UNIQUE, -- Secure random token for URL
    expires_at TIMESTAMP WITH TIME ZONE, -- Link expiration
    sent_at TIMESTAMP WITH TIME ZONE, -- When invitation was sent
    
    -- Review-specific fields (used when type = 'review')
    name VARCHAR(100), -- Client name from review form
    
    -- Ratings (1-5) - only for type = 'review'
    overall_rating SMALLINT CHECK (overall_rating IS NULL OR overall_rating BETWEEN 1 AND 5),
    food_quality_rating SMALLINT CHECK (food_quality_rating IS NULL OR food_quality_rating BETWEEN 1 AND 5),
    taste_rating SMALLINT CHECK (taste_rating IS NULL OR taste_rating BETWEEN 1 AND 5),
    presentation_rating SMALLINT CHECK (presentation_rating IS NULL OR presentation_rating BETWEEN 1 AND 5),
    staff_behavior_rating SMALLINT CHECK (staff_behavior_rating IS NULL OR staff_behavior_rating BETWEEN 1 AND 5),
    timeliness_rating SMALLINT CHECK (timeliness_rating IS NULL OR timeliness_rating BETWEEN 1 AND 5),
    service_quality_rating SMALLINT CHECK (service_quality_rating IS NULL OR service_quality_rating BETWEEN 1 AND 5),
    
    -- Written feedback - only for type = 'review'
    comments TEXT,
    suggestions TEXT,
    recommend VARCHAR(10), -- 'yes', 'no', null
    
    -- Moderation - only for type = 'review'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    is_featured BOOLEAN DEFAULT false, -- Show on home page
    is_public BOOLEAN DEFAULT false, -- Show on reviews page
    moderation_notes TEXT,
    moderated_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE, -- When review was submitted
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for invitations
CREATE INDEX idx_reviews_type ON reviews(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_token ON reviews(token) WHERE type = 'invitation' AND deleted_at IS NULL;
CREATE INDEX idx_reviews_expires ON reviews(expires_at) WHERE type = 'invitation' AND deleted_at IS NULL;

-- Indexes for submitted reviews
CREATE INDEX idx_reviews_client ON reviews(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_status ON reviews(status) WHERE type = 'review' AND deleted_at IS NULL;
CREATE INDEX idx_reviews_public ON reviews(is_public) WHERE type = 'review' AND is_public = true AND deleted_at IS NULL;
CREATE INDEX idx_reviews_featured ON reviews(is_featured) WHERE type = 'review' AND is_featured = true AND deleted_at IS NULL;
CREATE INDEX idx_reviews_overall_rating ON reviews(overall_rating DESC) WHERE type = 'review' AND deleted_at IS NULL;
CREATE INDEX idx_reviews_submitted ON reviews(submitted_at DESC) WHERE type = 'review' AND deleted_at IS NULL;

COMMENT ON TABLE reviews IS 'Unified table for review invitations and submitted reviews';
COMMENT ON COLUMN reviews.type IS 'Record type: invitation (link sent to client) or review (submitted feedback)';
COMMENT ON COLUMN reviews.token IS 'Secure token for review URL (only for type = invitation)';
COMMENT ON COLUMN reviews.expires_at IS 'Link expiration, typically 30-90 days (only for type = invitation)';
COMMENT ON COLUMN reviews.status IS 'Moderation status (only for type = review)';
COMMENT ON COLUMN reviews.is_featured IS 'Display on home page (only for type = review)';
COMMENT ON COLUMN reviews.is_public IS 'Display on reviews page (only for type = review)';

-- ============================================================
-- 4. CLIENT FOLLOW-UP SYSTEM
-- ============================================================

-- Follow-up tasks for client management
CREATE TABLE follow_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    quote_request_id UUID REFERENCES quote_requests(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'call', 'email', 'whatsapp', 'meeting'
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
    due_date DATE NOT NULL,
    due_time TIME,
    title VARCHAR(200) NOT NULL,
    notes TEXT,
    outcome TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_follow_ups_client ON follow_ups(client_id);
CREATE INDEX idx_follow_ups_status ON follow_ups(status);
CREATE INDEX idx_follow_ups_due_date ON follow_ups(due_date) WHERE status = 'pending';
CREATE INDEX idx_follow_ups_priority ON follow_ups(priority, due_date) WHERE status = 'pending';

COMMENT ON TABLE follow_ups IS 'Follow-up tasks for client management';
COMMENT ON COLUMN follow_ups.type IS 'Type of follow-up action';
COMMENT ON COLUMN follow_ups.priority IS 'Urgency level';
COMMENT ON COLUMN follow_ups.outcome IS 'Result/notes after completing the follow-up';

-- ============================================================
-- 5. NEWSLETTER SUBSCRIBERS
-- ============================================================

-- Newsletter/notification subscribers
CREATE TABLE subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    source VARCHAR(50) DEFAULT 'website', -- 'website', 'quote_request', 'manual'
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(64),
    verified_at TIMESTAMP WITH TIME ZONE,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscribers_email ON subscribers(email);
CREATE INDEX idx_subscribers_active ON subscribers(is_active) WHERE is_active = true;
CREATE INDEX idx_subscribers_verified ON subscribers(is_verified) WHERE is_verified = true;

COMMENT ON TABLE subscribers IS 'Newsletter and notification subscribers';
COMMENT ON COLUMN subscribers.is_verified IS 'Email verified via confirmation link';

-- ============================================================
-- 6. EMAIL TEMPLATES (UNIFIED & SIMPLE)
-- ============================================================

-- Email templates with JSON content structure
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'review_invitation', 'quote_confirmation', 'campaign', 'jwt_token', etc.
    subject VARCHAR(200) NOT NULL,
    
    -- Template content stored as JSON
    content JSONB NOT NULL, -- { "html": "...", "text": "...", "variables": ["clientName", "eventDate"] }
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_templates_type ON email_templates(type) WHERE is_active = true;
CREATE INDEX idx_email_templates_name ON email_templates(name);

COMMENT ON TABLE email_templates IS 'Unified email templates with JSON content';
COMMENT ON COLUMN email_templates.content IS 'JSON: { "html": "...", "text": "...", "variables": [...] }';

-- ============================================================
-- 7. SYSTEM LOGS (UNIFIED)
-- ============================================================

-- Unified logging table for all system activities
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL, -- 'email', 'review', 'quote', 'auth', 'campaign', 'admin_action', etc.
    
    -- Context (flexible based on type)
    entity_type VARCHAR(50), -- 'client', 'review', 'quote_request', 'email_campaign', etc.
    entity_id UUID,
    
    -- Action/Status
    action VARCHAR(100) NOT NULL, -- 'sent', 'delivered', 'failed', 'approved', 'rejected', 'login', etc.
    status VARCHAR(50), -- 'success', 'failed', 'pending', etc.
    
    -- Details stored as JSON (flexible structure)
    details JSONB, -- { "recipient": "...", "subject": "...", "error": "...", etc. }
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_logs_type ON system_logs(type);
CREATE INDEX idx_system_logs_entity ON system_logs(entity_type, entity_id);
CREATE INDEX idx_system_logs_action ON system_logs(action);
CREATE INDEX idx_system_logs_created ON system_logs(created_at DESC);

COMMENT ON TABLE system_logs IS 'Unified logging table for all system activities';
COMMENT ON COLUMN system_logs.type IS 'Log category: email, review, quote, auth, campaign, admin_action, etc.';
COMMENT ON COLUMN system_logs.details IS 'JSON object with type-specific context';

-- ============================================================
-- 8. TRIGGERS FOR UPDATED_AT
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_requests_updated_at BEFORE UPDATE ON quote_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. SEED DATA (Initial Setup)
-- ============================================================

-- Insert default email templates
INSERT INTO email_templates (name, type, subject, content)
VALUES 
(
    'review_invitation',
    'review_invitation',
    'Share your experience with Sri Karthikeya Caterers',
    '{
        "html": "<html><body><h1>Hello {{clientName}},</h1><p>Thank you for choosing us for your {{eventType}} on {{eventDate}}.</p><p>We would love to hear about your experience. Please take a moment to share your feedback:</p><p><a href=\"{{reviewLink}}\" style=\"background-color: #143a26; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;\">Submit Your Review</a></p><p>This link will expire in 30 days.</p><p>Best regards,<br>Sri Karthikeya Caterers Team</p></body></html>",
        "text": "Hello {{clientName}},\n\nThank you for choosing us for your {{eventType}} on {{eventDate}}.\n\nWe would love to hear about your experience. Please visit: {{reviewLink}}\n\nThis link will expire in 30 days.\n\nBest regards,\nSri Karthikeya Caterers Team",
        "variables": ["clientName", "eventType", "eventDate", "reviewLink"]
    }'::jsonb
),
(
    'quote_confirmation',
    'quote_confirmation',
    'Quote request received - Sri Karthikeya Caterers',
    '{
        "html": "<html><body><h1>Hello {{clientName}},</h1><p>We have received your quote request for <strong>{{eventType}}</strong> on <strong>{{eventDate}}</strong> for <strong>{{guests}} guests</strong>.</p><p>Our coordinator will contact you within 24 hours to discuss your requirements and provide a detailed quote.</p><p>If you have any urgent questions, please feel free to contact us at:</p><ul><li>Phone: +91 98765 43210</li><li>Email: info@srikarthikeyacaterers.in</li></ul><p>Thank you for considering Sri Karthikeya Caterers!</p><p>Best regards,<br>Sri Karthikeya Caterers Team</p></body></html>",
        "text": "Hello {{clientName}},\n\nWe have received your quote request for {{eventType}} on {{eventDate}} for {{guests}} guests.\n\nOur coordinator will contact you within 24 hours to discuss your requirements and provide a detailed quote.\n\nIf you have any urgent questions, please contact us:\nPhone: +91 98765 43210\nEmail: info@srikarthikeyacaterers.in\n\nThank you for considering Sri Karthikeya Caterers!\n\nBest regards,\nSri Karthikeya Caterers Team",
        "variables": ["clientName", "eventType", "eventDate", "guests"]
    }'::jsonb
),
(
    'jwt_token',
    'jwt_token',
    'Your Admin Login Token - Sri Karthikeya Caterers',
    '{
        "html": "<html><body><h1>Admin Login Token</h1><p>Your JWT authentication token has been generated successfully.</p><p><strong>Token:</strong></p><pre style=\"background-color: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto;\">{{jwtToken}}</pre><p><strong>Valid for:</strong> 24 hours</p><p><strong>Security Notice:</strong></p><ul><li>Do not share this token with anyone</li><li>This token provides full admin access</li><li>It will expire automatically after 24 hours</li></ul><p>If you did not request this token, please contact support immediately.</p><p>Best regards,<br>Sri Karthikeya Caterers System</p></body></html>",
        "text": "Admin Login Token\n\nYour JWT authentication token has been generated successfully.\n\nToken:\n{{jwtToken}}\n\nValid for: 24 hours\n\nSecurity Notice:\n- Do not share this token with anyone\n- This token provides full admin access\n- It will expire automatically after 24 hours\n\nIf you did not request this token, please contact support immediately.\n\nBest regards,\nSri Karthikeya Caterers System",
        "variables": ["jwtToken"]
    }'::jsonb
),
(
    'monthly_newsletter',
    'campaign',
    'Monthly Newsletter - Sri Karthikeya Caterers',
    '{
        "html": "<html><body><h1>Hello {{subscriberName}},</h1><p>Welcome to our monthly newsletter!</p><p>{{newsletterContent}}</p><p>Thank you for being a valued subscriber.</p><p><a href=\"{{unsubscribeLink}}\" style=\"color: #666; font-size: 12px;\">Unsubscribe</a></p></body></html>",
        "text": "Hello {{subscriberName}},\n\nWelcome to our monthly newsletter!\n\n{{newsletterContent}}\n\nThank you for being a valued subscriber.\n\nUnsubscribe: {{unsubscribeLink}}",
        "variables": ["subscriberName", "newsletterContent", "unsubscribeLink"]
    }'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SUMMARY
-- ============================================================

-- Total Tables: 7
-- 1. clients
-- 2. quote_requests
-- 3. reviews (unified: invitations + submitted reviews)
-- 4. follow_ups
-- 5. subscribers
-- 6. email_templates (unified with JSON content)
-- 7. system_logs (unified logging)

-- Authentication:
-- - Hardcoded credentials in application.properties
-- - JWT token generated and sent via email
-- - Spring Security with JWT filter
-- - No admin table needed

-- Email System:
-- - Single email_templates table with JSON content
-- - Flexible structure for all email types
-- - Variables defined in JSON

-- Logging System:
-- - Single system_logs table
-- - Type-based differentiation
-- - JSON details for flexibility

-- ============================================================
-- END OF SCHEMA
-- ============================================================
