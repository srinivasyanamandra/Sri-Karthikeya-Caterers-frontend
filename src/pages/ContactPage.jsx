import React, { useEffect, useRef, useState } from 'react';
import PageHero from '../components/layout/PageHero';
import { CONTACT } from '../constants/contact';
import eventTypes from '../data/eventTypes';
import { validateForm } from '../utils/validation';
import { publicApi } from '../services/api';

/**
 * @typedef  {Object}  QuoteFormState
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {string} eventDate   ISO yyyy-mm-dd as produced by <input type="date">
 * @property {string} eventType   One of the values in src/data/eventTypes.js
 * @property {string} guests      Numeric string; coerced by validateForm
 * @property {string} message     Free-form, no length cap
 */

/**
 * Empty seed state for the form. Re-used both on mount and on every reset
 * (after a successful submission, after "Send another request").
 *
 * @type {QuoteFormState}
 */
const INITIAL_FORM_STATE = {
  name: '',
  email: '',
  phone: '',
  eventDate: '',
  eventType: '',
  guests: '',
  message: '',
};

/**
 * Auto-reset window after a successful submission, in milliseconds.
 * Long enough to read the success banner and click "Send another request"
 * without feeling rushed; short enough that the form is ready for the next
 * visitor on a shared device.
 */
const SUBMITTED_RESET_MS = 6000;

/**
 * ContactPage — quote-request screen with a hardened form lifecycle.
 *
 * State machine:
 *   idle      → accepting input.
 *   submitted → request acknowledged. Form values are intentionally preserved
 *               so the user can review what they sent. Returns to `idle` on
 *               (a) the auto-reset timer (6s), or (b) "Send another request".
 *
 * Validation pipeline:
 *   `validateForm` (utils/validation.js) is the single source of truth.
 *   HTML5 attributes (required / type=email / type=tel / min) are kept as a
 *   client-side first net but `<form noValidate>` suppresses the browser's
 *   native messages — the inline error UI is more accessible and consistent.
 *
 * Timer hygiene:
 *   The auto-reset is held in a ref so it survives renders without
 *   triggering them, and is cancelled on unmount + re-submit. This guarantees
 *   no setState calls run on an unmounted component.
 *
 * Backend integration (future):
 *   `handleSubmit` is the only call site that needs to change. Replace the
 *   synchronous setSubmitted with the fetch lifecycle (loading state,
 *   server-side validation merge, network error UI). The state-machine
 *   contract — idle/submitted with timer-based reset — stays identical.
 */
const ContactPage = () => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  /** Map of fieldName → error message. Empty object means "no errors". */
  const [errors, setErrors] = useState({});

  /** Finite-state flag: false = idle, true = submitted/awaiting reset. */
  const [submitted, setSubmitted] = useState(false);

  /** True while a submission is in flight. */
  const [submitting, setSubmitting] = useState(false);

  /** Server-side error to display above the form (network, 5xx, etc.). */
  const [submitError, setSubmitError] = useState('');

  /**
   * Pending auto-reset timer id. Held in a ref so updates don't trigger
   * re-renders, and so cleanup can cancel a timer scheduled in a stale
   * closure. `null` when no timer is in flight.
   *
   * @type {React.MutableRefObject<number | null>}
   */
  const resetTimerRef = useRef(null);

  /* On unmount, cancel any pending auto-reset. Without this, navigating
     away during the submitted window would call setState on an unmounted
     component and trigger a React dev warning. */
  useEffect(
    () => () => {
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    },
    []
  );

  /**
   * Update a single field and clear its inline error if one was showing.
   *
   * Clearing the error on edit is fail-fast UX: the moment the user starts
   * correcting a flagged field, the red ring disappears and they get
   * immediate visual confirmation that they're addressing the problem.
   * Re-validation runs on the next submit, not on every keystroke.
   */
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        // Drop the named key while preserving the rest. The underscore-
        // prefixed `_ignored` is the destructured-and-discarded value.
        const { [name]: _ignored, ...rest } = prev;
        return rest;
      });
    }
  };

  /**
   * Form submit handler.
   *
   * Branch A (validation failed): publish errors, focus the first invalid
   * field, abort. State remains `idle`.
   *
   * Branch B (validation passed): clear errors, transition to `submitted`,
   * schedule (or refresh) the 6 s auto-reset timer. Form values are
   * preserved — the user can read the success banner without their input
   * vanishing under them.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstInvalid = document.querySelector('[aria-invalid="true"]');
      if (firstInvalid instanceof HTMLElement) firstInvalid.focus();
      return;
    }

    setErrors({});
    setSubmitError('');
    setSubmitting(true);

    try {
      await publicApi.submitQuote({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        eventType: formData.eventType,
        eventDate: formData.eventDate,
        guests: parseInt(formData.guests, 10) || 0,
        venue: '',
        budget: '',
        message: formData.message,
      });

      setSubmitted(true);

      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = window.setTimeout(() => {
        setSubmitted(false);
        setFormData(INITIAL_FORM_STATE);
        resetTimerRef.current = null;
      }, SUBMITTED_RESET_MS);
    } catch (error) {
      // server-side field validation is mapped back into the inline error UI
      if (error?.fields && typeof error.fields === 'object') {
        setErrors(error.fields);
      }
      setSubmitError(
        error?.message || 'We could not submit your request. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * "Send another request" — manual reset triggered from the success
   * banner. Cancels the auto-reset timer to avoid a double-fire and
   * returns to `idle` immediately.
   */
  const sendAnother = () => {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    setSubmitted(false);
    setFormData(INITIAL_FORM_STATE);
  };

  /**
   * Build the controlled-input prop bag for a given field. Centralising
   * this keeps the JSX below readable and ensures every field has the
   * same a11y wiring (aria-invalid, aria-describedby) without copy-paste.
   *
   * @param   {keyof QuoteFormState} name
   * @returns {Object} Props to spread onto <input>/<select>/<textarea>.
   */
  const fieldProps = (name) => ({
    id: name,
    name,
    value: formData[name],
    onChange: handleChange,
    'aria-invalid': errors[name] ? 'true' : 'false',
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  });

  /**
   * Render the inline error message for a field, if any.
   * `role="alert"` makes screen readers announce it the moment it appears.
   *
   * @param {keyof QuoteFormState} name
   */
  const fieldError = (name) =>
    errors[name] ? (
      <span id={`${name}-error`} className="form-error" role="alert">
        {errors[name]}
      </span>
    ) : null;

  return (
    <div className="contact-page">
      <PageHero
        eyebrow="Get in touch"
        title="Plan your event with us"
        intro="Share your event details and our coordinator will respond within 24 hours with a tailored menu and quote."
      />

      <section className="section section-alt">
        <div className="container">
          <div className="contact-grid">
            {/* Left column — contact info. Pure presentation, all values
                pulled from the CONTACT single-source-of-truth. */}
            <aside className="contact-info-section">
              <span className="eyebrow">Reach us</span>
              <h2 className="section-title">A team that answers.</h2>
              <p className="contact-intro">
                Call, email, or send us a note through the form — every event is coordinated
                personally.
              </p>

              <div className="contact-info-card">
                <span className="info-icon">
                  <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
                </span>
                <div>
                  <h3>Visit us</h3>
                  <p>{CONTACT.fullAddress}</p>
                </div>
              </div>
              <div className="contact-info-card">
                <span className="info-icon">
                  <i className="fas fa-phone" aria-hidden="true"></i>
                </span>
                <div>
                  <h3>Call us</h3>
                  <p>
                    {/* Phones are rendered from the array even though there
                        is currently only one entry — keeps the iteration
                        safe to extend without touching this JSX. */}
                    {CONTACT.phones.map((p, i) => (
                      <React.Fragment key={p.tel}>
                        {p.label}
                        {i < CONTACT.phones.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                    <br />
                    {CONTACT.hours}
                  </p>
                </div>
              </div>
              <div className="contact-info-card">
                <span className="info-icon">
                  <i className="fas fa-envelope" aria-hidden="true"></i>
                </span>
                <div>
                  <h3>Email us</h3>
                  <p>
                    {CONTACT.email}
                    <br />
                    {CONTACT.responseTime}
                  </p>
                </div>
              </div>
            </aside>

            {/* Right column — the quote-request form. */}
            <div className="form-container">
              <span className="eyebrow">Request a quote</span>
              <h2 className="section-title">Tell us about your event</h2>

              {/* Success banner — only renders in `submitted` state.
                  `role="status"` + `aria-live="polite"` causes screen
                  readers to announce the message without interrupting. */}
              {submitted && (
                <div className="form-success" role="status" aria-live="polite">
                  <i className="fas fa-check-circle" aria-hidden="true"></i>
                  <span>Request received — our coordinator will be in touch within 24 hours.</span>
                  <button type="button" className="btn-link" onClick={sendAnother}>
                    Send another request
                  </button>
                </div>
              )}

              {/* Server-side error (network, 5xx, etc.) lives above the form. */}
              {submitError && !submitted && (
                <div className="form-error" role="alert" style={{ marginBottom: 16 }}>
                  <i className="fas fa-exclamation-circle" aria-hidden="true"></i>
                  <span>{submitError}</span>
                </div>
              )}

              {/* `noValidate` disables the browser's native validation UI.
                  validateForm() owns validation; the inline error spans
                  + aria-invalid wiring own the visual feedback. */}
              <form onSubmit={handleSubmit} noValidate>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full name</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      required
                      {...fieldProps('name')}
                    />
                    {fieldError('name')}
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      required
                      {...fieldProps('email')}
                    />
                    {fieldError('email')}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone</label>
                    <input
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      required
                      {...fieldProps('phone')}
                    />
                    {fieldError('phone')}
                  </div>
                  <div className="form-group">
                    <label htmlFor="eventDate">Event date</label>
                    <input type="date" required {...fieldProps('eventDate')} />
                    {fieldError('eventDate')}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="eventType">Event type</label>
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
                  <div className="form-group">
                    <label htmlFor="guests">Guests</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 100"
                      required
                      {...fieldProps('guests')}
                    />
                    {fieldError('guests')}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Additional details</label>
                  <textarea
                    rows="4"
                    placeholder="Tell us about your event..."
                    {...fieldProps('message')}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-accent btn-lg"
                  style={{ width: '100%' }}
                  disabled={submitted || submitting}
                >
                  {submitted ? (
                    <>
                      <i className="fas fa-check" aria-hidden="true"></i> Request received
                    </>
                  ) : submitting ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin" aria-hidden="true"></i> Sending…
                    </>
                  ) : (
                    <>
                      Submit request <i className="fas fa-arrow-right" aria-hidden="true"></i>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
