import React, { useEffect, useMemo, useRef, useState } from 'react';
import PageHero from '../components/layout/PageHero';
import RatingInput from '../components/feedback/RatingInput';
import RecommendToggle from '../components/feedback/RecommendToggle';
// import PhotoUpload from '../components/feedback/PhotoUpload';
import eventTypes from '../data/eventTypes';
import { validateClientReview } from '../utils/validation';
import { CONTACT } from '../constants/contact';
import { publicApi } from '../services/api';

/**
 * Read the invitation token from the URL.
 *
 * Path-routed URLs put the token in the regular query string
 * (`/feedback?t=abc123`). The legacy hash form (`/#feedback?t=abc123`)
 * is migrated to the path form by App.js's `useLegacyHashRedirect` on
 * first paint; we still fall back to reading the hash defensively in
 * case this component renders before that migration effect fires.
 */
const readTokenFromHash = () => {
  if (typeof window === 'undefined') return '';

  // Preferred: regular query string after path-based routing.
  const fromSearch = new URLSearchParams(window.location.search);
  const direct = fromSearch.get('t') || fromSearch.get('token');
  if (direct) return direct;

  // Defensive: legacy hash-with-query form ("/#feedback?t=abc").
  const hash = window.location.hash || '';
  const q = hash.indexOf('?');
  if (q < 0) return '';
  const fromHash = new URLSearchParams(hash.slice(q + 1));
  return fromHash.get('t') || fromHash.get('token') || '';
};

const INITIAL_STATE = {
  // Section 1: Basic Information
  name: '',
  eventType: '',
  eventDate: '',

  // Section 2: Overall Experience
  overallRating: 0,

  // Section 3: Detailed Ratings
  foodQualityRating: 0,
  tasteRating: 0,
  presentationRating: 0,
  staffBehaviorRating: 0,
  timelinessRating: 0,
  serviceQualityRating: 0,

  // Section 4: Written Feedback
  comments: '',
  suggestions: '',

  // Section 5: Optional
  // photo: null, // Commented out - photo upload disabled
  recommend: '',
};

/**
 * Success message copy based on overall rating.
 * Three tiers: exceptional (5), positive (4), constructive (≤3).
 */
const successCopy = (rating) => {
  if (rating === 5) {
    return {
      title: 'Thank you for the exceptional review.',
      body: 'Five stars means the world to us. We are honored to have been part of your celebration and grateful you took the time to share your experience.',
    };
  }
  if (rating === 4) {
    return {
      title: 'Thank you for the wonderful feedback.',
      body: 'We are delighted you enjoyed the experience. Your insights help us continue delivering memorable events for every client.',
    };
  }
  return {
    title: 'Thank you for your honest feedback.',
    body: 'We take every review seriously. Our team will carefully review your comments and reach out personally to discuss how we can improve.',
  };
};

/**
 * ClientReviewsPage — comprehensive post-event review submission.
 *
 * A premium, multi-section form that collects:
 *   - Basic event details (name, type, date)
 *   - Overall satisfaction rating
 *   - Six detailed ratings (food quality, taste, presentation, staff, timeliness, service)
 *   - Written feedback (comments + suggestions)
 *   - Optional photo upload
 *   - Optional recommendation toggle
 *
 * Design principles:
 *   - Progressive disclosure: sections build naturally from simple to detailed
 *   - Visual hierarchy: numbered sections with serif headings
 *   - Trust signals: warm copy, professional layout, clear value proposition
 *   - Accessibility: semantic HTML, ARIA labels, keyboard navigation
 *   - Mobile-first: touch-friendly controls, responsive layout
 *
 * Lifecycle: idle → submitting → submitted (thank-you state)
 */
const ClientReviewsPage = () => {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'submitted'
  const [submitError, setSubmitError] = useState('');

  /* Token-driven invitation state.
   * Read from the live hash after mount so App.js hash-sync has already run.
   * Using useRef for the token itself (it never changes after mount). */
  const [token, setToken] = useState('');
  const [invitationStatus, setInvitationStatus] = useState('loading');
  // 'loading' | 'valid' | 'invalid' | 'no-token'

  const submitTimerRef = useRef(null);

  /* Cancel in-flight submit on unmount */
  useEffect(
    () => () => {
      if (submitTimerRef.current) window.clearTimeout(submitTimerRef.current);
    },
    []
  );

  /* Read the token from the hash after mount (hash-sync in App.js may not
   * have run yet during the initial render, so we defer to useEffect). */
  useEffect(() => {
    const t = readTokenFromHash();
    setToken(t);
    setInvitationStatus(t ? 'loading' : 'no-token');
  }, []);

  /* Validate the invitation token once the token is known. */
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    publicApi
      .getReviewInvitation(token)
      .then((data) => {
        if (cancelled) return;
        setInvitationStatus('valid');
        setFormData((prev) => ({
          ...prev,
          name: data?.client?.name || prev.name,
          eventType: data?.eventType || prev.eventType,
          eventDate: data?.eventDate || prev.eventDate,
        }));
      })
      .catch(() => {
        if (cancelled) return;
        setInvitationStatus('invalid');
      });
    return () => { cancelled = true; };
  }, [token]);

  const updateField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts correcting it
    if (errors[name]) {
      setErrors((prev) => {
        const { [name]: _ignored, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleTextChange = (event) => updateField(event.target.name, event.target.value);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status === 'submitting') return;

    if (!token || invitationStatus !== 'valid') {
      setSubmitError(
        'A valid invitation link is required to submit a review. Please use the link sent to your email.'
      );
      return;
    }

    const validationErrors = validateClientReview(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstInvalid = document.querySelector('[aria-invalid="true"]');
      if (firstInvalid instanceof HTMLElement) firstInvalid.focus();
      return;
    }

    setErrors({});
    setSubmitError('');
    setStatus('submitting');

    try {
      await publicApi.submitReview(token, {
        reviewerName: formData.name,
        overallRating: formData.overallRating,
        foodQualityRating: formData.foodQualityRating,
        tasteRating: formData.tasteRating,
        presentationRating: formData.presentationRating,
        staffBehaviorRating: formData.staffBehaviorRating,
        timelinessRating: formData.timelinessRating,
        serviceQualityRating: formData.serviceQualityRating,
        comments: formData.comments,
        suggestions: formData.suggestions,
        recommend: formData.recommend,
      });
      setStatus('submitted');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err?.fields) setErrors(err.fields);
      if (err?.status === 410) {
        setSubmitError(
          'This review link has already been used or has expired. Please contact us if you need a new invitation.'
        );
        setInvitationStatus('invalid');
      } else {
        setSubmitError(err?.message || 'Could not submit your review. Please try again.');
      }
      setStatus('idle');
    }
  };

  const submitAnother = () => {
    setFormData(INITIAL_STATE);
    setErrors({});
    setStatus('idle');
  };

  const fieldProps = (name, type = 'text') => ({
    id: name,
    name,
    type,
    value: formData[name],
    onChange: handleTextChange,
    'aria-invalid': errors[name] ? 'true' : 'false',
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  });

  const fieldError = (name) =>
    errors[name] ? (
      <span id={`${name}-error`} className="form-error" role="alert">
        {errors[name]}
      </span>
    ) : null;

  const successMessage = useMemo(
    () => successCopy(formData.overallRating),
    [formData.overallRating]
  );

  // ── Token-loading / token-invalid states ──────────────────────────────
  if (invitationStatus === 'loading') {
    return (
      <div className="client-reviews-page">
        <PageHero
          eyebrow="Verifying invitation"
          title="One moment…"
          intro="Checking your review link."
        />
        <section className="section section-alt">
          <div className="container" style={{ textAlign: 'center', padding: '3rem 0' }}>
            <i className="fas fa-circle-notch fa-spin" aria-hidden="true"></i>
          </div>
        </section>
      </div>
    );
  }

  if (invitationStatus === 'invalid') {
    return (
      <div className="client-reviews-page">
        <PageHero
          eyebrow="Link not available"
          title="This review link is no longer valid."
          intro="Review links are single-use and expire 14 days after they're sent."
        />
        <section className="section section-alt">
          <div className="container">
            <div className="feedback-thanks">
              <div className="feedback-thanks-mark" aria-hidden="true">⚠</div>
              <h2 className="feedback-thanks-title">We couldn't open this invitation.</h2>
              <p className="feedback-thanks-body">
                Either the link has already been used or it's expired. We'd still love to hear
                from you — please email us and we'll send a fresh invitation.
              </p>
              <p className="feedback-thanks-meta">
                Reach us at{' '}
                <a href={`tel:${CONTACT.primaryPhone.tel}`}>{CONTACT.primaryPhone.label}</a> or{' '}
                <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (invitationStatus === 'no-token') {
    return (
      <div className="client-reviews-page">
        <PageHero
          eyebrow="Invitation required"
          title="This page needs a private link."
          intro="If you've recently catered with us, check your inbox for a personal review invitation."
        />
        <section className="section section-alt">
          <div className="container">
            <div className="feedback-thanks">
              <div className="feedback-thanks-mark" aria-hidden="true">◆</div>
              <h2 className="feedback-thanks-title">Looking for your review link?</h2>
              <p className="feedback-thanks-body">
                We email a single-use review link a few days after each event. If you haven't
                received yours, please reach out and we'll resend it right away.
              </p>
              <p className="feedback-thanks-meta">
                Email{' '}
                <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> or call{' '}
                <a href={`tel:${CONTACT.primaryPhone.tel}`}>{CONTACT.primaryPhone.label}</a>.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ── Submitted state ───────────────────────────────────────────────────
  if (status === 'submitted') {
    const firstName = formData.name.trim().split(' ')[0] || 'friend';
    return (
      <div className="client-reviews-page">
        <PageHero
          eyebrow="Review submitted"
          title={`Thank you, ${firstName}.`}
          intro="Your detailed feedback helps us deliver exceptional experiences for every client."
        />
        <section className="section section-alt">
          <div className="container">
            <div className="feedback-thanks">
              <div className="feedback-thanks-mark" aria-hidden="true">
                ◆
              </div>
              <h2 className="feedback-thanks-title">{successMessage.title}</h2>
              <p className="feedback-thanks-body">{successMessage.body}</p>
              <p className="feedback-thanks-meta">
                Questions or concerns? Reach us at{' '}
                <a href={`tel:${CONTACT.primaryPhone.tel}`}>{CONTACT.primaryPhone.label}</a> or{' '}
                <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
              </p>
              <button type="button" className="btn btn-secondary" onClick={submitAnother}>
                Submit another review
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ── Idle / submitting state ───────────────────────────────────────────
  const isSubmitting = status === 'submitting';

  return (
    <div className="client-reviews-page">
      <PageHero
        eyebrow="Client reviews"
        title="Share your experience"
        intro="Your detailed feedback helps us understand what we did well and where we can improve. Every review shapes how we serve future events."
      />

      <section className="section section-alt">
        <div className="container">
          {/* Trust-building intro */}
          <div className="client-reviews-intro">
            <div className="client-reviews-intro-icon" aria-hidden="true">
              <i className="fas fa-star" />
            </div>
            <h2 className="client-reviews-intro-title">Your voice matters</h2>
            <p className="client-reviews-intro-body">
              We read every review personally. Your honest feedback — the highlights and the areas
              for improvement — helps us deliver exceptional catering experiences for every
              celebration.
            </p>
          </div>

          {submitError && (
            <div className="form-error" role="alert" style={{ marginBottom: '1rem' }}>
              <i className="fas fa-exclamation-circle" aria-hidden="true" /> {submitError}
            </div>
          )}

          {/* Main review form */}
          <form className="client-reviews-form" onSubmit={handleSubmit} noValidate>
            {/* ═══ Section 1: Basic Information ═══ */}
            <div className="feedback-section">
              <div className="feedback-section-head">
                <span className="feedback-section-num">01</span>
                <h3 className="feedback-section-title">Basic information</h3>
                <p className="feedback-section-hint">
                  Tell us about your event so we can connect your feedback to the right team.
                </p>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Your name *</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    required
                    {...fieldProps('name')}
                  />
                  {fieldError('name')}
                </div>

                <div className="form-group">
                  <label htmlFor="eventType">Event type *</label>
                  <select required {...fieldProps('eventType')}>
                    <option value="">Select event type</option>
                    {eventTypes.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {fieldError('eventType')}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="eventDate">Event date *</label>
                <input type="date" required {...fieldProps('eventDate', 'date')} />
                {fieldError('eventDate')}
                <span className="form-hint">When did we cater your event?</span>
              </div>
            </div>

            {/* ═══ Section 2: Overall Experience ═══ */}
            <div className="feedback-section">
              <div className="feedback-section-head">
                <span className="feedback-section-num">02</span>
                <h3 className="feedback-section-title">Overall experience</h3>
                <p className="feedback-section-hint">
                  How would you rate your overall experience with Sri Karthikeya Caterers?
                </p>
              </div>

              <RatingInput
                name="overallRating"
                label="Overall satisfaction"
                value={formData.overallRating}
                onChange={updateField}
                required
              />
              {fieldError('overallRating')}
            </div>

            {/* ═══ Section 3: Detailed Ratings ═══ */}
            <div className="feedback-section">
              <div className="feedback-section-head">
                <span className="feedback-section-num">03</span>
                <h3 className="feedback-section-title">Detailed ratings</h3>
                <p className="feedback-section-hint">
                  Help us understand the specific aspects of your experience.
                </p>
              </div>

              <div className="feedback-ratings">
                <RatingInput
                  name="foodQualityRating"
                  label="Food quality"
                  value={formData.foodQualityRating}
                  onChange={updateField}
                  required
                />
                {fieldError('foodQualityRating')}

                <RatingInput
                  name="tasteRating"
                  label="Taste & flavor"
                  value={formData.tasteRating}
                  onChange={updateField}
                  required
                />
                {fieldError('tasteRating')}

                <RatingInput
                  name="presentationRating"
                  label="Presentation & plating"
                  value={formData.presentationRating}
                  onChange={updateField}
                  required
                />
                {fieldError('presentationRating')}

                <RatingInput
                  name="staffBehaviorRating"
                  label="Staff behavior & professionalism"
                  value={formData.staffBehaviorRating}
                  onChange={updateField}
                  required
                />
                {fieldError('staffBehaviorRating')}

                <RatingInput
                  name="timelinessRating"
                  label="Timeliness & punctuality"
                  value={formData.timelinessRating}
                  onChange={updateField}
                  required
                />
                {fieldError('timelinessRating')}

                <RatingInput
                  name="serviceQualityRating"
                  label="Service quality"
                  value={formData.serviceQualityRating}
                  onChange={updateField}
                  required
                />
                {fieldError('serviceQualityRating')}
              </div>
            </div>

            {/* ═══ Section 4: Written Feedback ═══ */}
            <div className="feedback-section">
              <div className="feedback-section-head">
                <span className="feedback-section-num">04</span>
                <h3 className="feedback-section-title">Your feedback</h3>
                <p className="feedback-section-hint">
                  Share the details — what stood out, what you loved, and what we can do better.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="comments">What did you enjoy most? *</label>
                <textarea
                  rows="5"
                  placeholder="Tell us about the dishes you loved, moments that stood out, or anything that exceeded your expectations…"
                  required
                  {...fieldProps('comments')}
                />
                {fieldError('comments')}
              </div>

              <div className="form-group">
                <label htmlFor="suggestions">How can we improve?</label>
                <textarea
                  rows="4"
                  placeholder="Your honest suggestions help us serve better. What could we have done differently?"
                  {...fieldProps('suggestions')}
                />
                {fieldError('suggestions')}
                <span className="form-hint">
                  Optional, but deeply valued. We read every suggestion.
                </span>
              </div>
            </div>

            {/* ═══ Section 5: Optional Extras ═══ */}
            <div className="feedback-section">
              <div className="feedback-section-head">
                <span className="feedback-section-num">05</span>
                <h3 className="feedback-section-title">Optional extras</h3>
                <p className="feedback-section-hint">
                  Let us know if you'd recommend us to others.
                </p>
              </div>

              {/* Photo upload commented out */}
              {/* <PhotoUpload
                name="photo"
                value={formData.photo}
                onChange={updateField}
              /> */}

              <RecommendToggle name="recommend" value={formData.recommend} onChange={updateField} />
            </div>

            {/* ═══ Submit ═══ */}
            <div className="feedback-submit-row">
              <button
                type="submit"
                className="btn btn-accent btn-lg feedback-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin" aria-hidden="true" /> Submitting
                    review…
                  </>
                ) : (
                  <>
                    Submit review <i className="fas fa-arrow-right" aria-hidden="true" />
                  </>
                )}
              </button>
              <p className="feedback-submit-meta">
                Your review is read personally by our coordinator. We respond to every concern
                within 24 hours.
              </p>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default ClientReviewsPage;
