import React, { useEffect, useRef, useState } from 'react';
import PageHero from '../components/layout/PageHero';
import { CONTACT } from '../constants/contact';
import { buildWhatsAppLink } from '../constants/whatsapp';
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
 * @property {string} message     Free-form, capped server-side
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

/* Auto-reset window after a successful submission. Long enough to read the
   acknowledgement at a calm pace; short enough that the next visitor on a
   shared device sees a fresh form. */
const SUBMITTED_RESET_MS = 9000;

/* Render free-tier instances sleep after 15 min idle and take 30–60s to
   wake. We surface a quiet "warming up" hint past this threshold so the
   user doesn't think the form is broken. */
const COLD_START_HINT_MS = 15000;

/* Server-side cap is enforced as well, but reflecting it client-side gives
   immediate visual feedback and prevents wasteful long submissions. */
const MESSAGE_MAX_LENGTH = 2000;

const ContactPage = () => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showColdStartHint, setShowColdStartHint] = useState(false);

  const resetTimerRef = useRef(null);
  const coldStartTimerRef = useRef(null);

  useEffect(
    () => () => {
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
      if (coldStartTimerRef.current) window.clearTimeout(coldStartTimerRef.current);
    },
    []
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const { [name]: _ignored, ...rest } = prev;
        return rest;
      });
    }
  };

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
    setShowColdStartHint(false);

    if (coldStartTimerRef.current) window.clearTimeout(coldStartTimerRef.current);
    coldStartTimerRef.current = window.setTimeout(() => {
      setShowColdStartHint(true);
    }, COLD_START_HINT_MS);

    try {
      await publicApi.submitQuote({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        eventType: formData.eventType,
        eventDate: formData.eventDate,
        guests: parseInt(formData.guests, 10) || 0,
        venue: '',
        budget: '',
        message: formData.message.trim(),
      });

      setSubmitted(true);

      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = window.setTimeout(() => {
        setSubmitted(false);
        setFormData(INITIAL_FORM_STATE);
        resetTimerRef.current = null;
      }, SUBMITTED_RESET_MS);
    } catch (error) {
      if (error?.fields && typeof error.fields === 'object') {
        setErrors(error.fields);
      }
      setSubmitError(
        error?.message || 'We could not submit your request. Please try again.'
      );
    } finally {
      setSubmitting(false);
      if (coldStartTimerRef.current) {
        window.clearTimeout(coldStartTimerRef.current);
        coldStartTimerRef.current = null;
      }
      setShowColdStartHint(false);
    }
  };

  const sendAnother = () => {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    setSubmitted(false);
    setFormData(INITIAL_FORM_STATE);
  };

  const fieldProps = (name) => ({
    id: name,
    name,
    value: formData[name],
    onChange: handleChange,
    'aria-invalid': errors[name] ? 'true' : 'false',
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  });

  const fieldError = (name) =>
    errors[name] ? (
      <span id={`${name}-error`} className="form-error" role="alert">
        {errors[name]}
      </span>
    ) : null;

  const messageRemaining = MESSAGE_MAX_LENGTH - formData.message.length;

  return (
    <div className="contact-page">
      <PageHero
        eyebrow="Begin the conversation"
        title="A coordinator who answers, every time."
        intro="Tell us about the occasion you have in mind. Our team will reply personally within twenty-four hours with a tailored menu and a transparent quote."
      />

      <section className="section section-alt">
        <div className="container">
          <div className="contact-grid">
            {/* ─── Left: contact channels ───────────────────────────── */}
            <aside className="contact-info-section">
              <span className="eyebrow">Reach us directly</span>
              <h2 className="section-title">Three quiet ways to begin.</h2>
              <p className="contact-intro">
                Every event we cater starts with a real conversation. Choose
                whichever channel suits you — we read and answer every one.
              </p>

              <div className="contact-info-card">
                <span className="info-icon" aria-hidden="true">
                  <i className="fas fa-map-marker-alt"></i>
                </span>
                <div className="contact-info-body">
                  <span className="contact-info-label">Find us</span>
                  <h3>{CONTACT.city}, {CONTACT.region}</h3>
                  <p>{CONTACT.fullAddress}</p>
                </div>
              </div>

              <div className="contact-info-card">
                <span className="info-icon" aria-hidden="true">
                  <i className="fas fa-phone"></i>
                </span>
                <div className="contact-info-body">
                  <span className="contact-info-label">Speak with us</span>
                  {CONTACT.phones.map((p) => (
                    <h3 key={p.tel}>
                      <a href={`tel:${p.tel}`}>{p.label}</a>
                    </h3>
                  ))}
                  <p>{CONTACT.hours}</p>
                </div>
              </div>

              <div className="contact-info-card">
                <span className="info-icon" aria-hidden="true">
                  <i className="fas fa-envelope"></i>
                </span>
                <div className="contact-info-body">
                  <span className="contact-info-label">Write to us</span>
                  <h3>
                    <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
                  </h3>
                  <p>{CONTACT.responseTime}</p>
                </div>
              </div>

              {/* Quiet WhatsApp affordance — many guests prefer to start with a
                  short message rather than a phone call. */}
              <a
                href={buildWhatsAppLink('Hello, I would like to discuss an event.')}
                className="contact-whatsapp-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-whatsapp" aria-hidden="true"></i>
                <span>Or send us a quick message on WhatsApp</span>
                <i className="fas fa-arrow-right contact-whatsapp-arrow" aria-hidden="true"></i>
              </a>
            </aside>

            {/* ─── Right: the enquiry form ──────────────────────────── */}
            <div className="form-container contact-form-card">
              <span className="eyebrow">Tailored proposal</span>
              <h2 className="section-title">Tell us about your event.</h2>
              <p className="contact-form-intro">
                A few details are all we need to begin. Your information is
                shared with our coordinator alone and is never used for
                marketing.
              </p>

              {submitted && (
                <div className="form-success" role="status" aria-live="polite">
                  <i className="fas fa-check-circle" aria-hidden="true"></i>
                  <span>
                    Thank you — your enquiry has been received. Our coordinator
                    will reach out within 24 hours.
                  </span>
                  <button type="button" className="btn-link" onClick={sendAnother}>
                    Send another enquiry
                  </button>
                </div>
              )}

              {submitError && !submitted && (
                <div
                  className="form-error form-error-banner"
                  role="alert"
                  aria-live="assertive"
                >
                  <i className="fas fa-exclamation-circle" aria-hidden="true"></i>
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      autoComplete="name"
                      required
                      {...fieldProps('name')}
                    />
                    {fieldError('name')}
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      spellCheck="false"
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
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+91 XXXXX XXXXX"
                      required
                      {...fieldProps('phone')}
                    />
                    {fieldError('phone')}
                  </div>
                  <div className="form-group">
                    <label htmlFor="eventDate">Event date</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      {...fieldProps('eventDate')}
                    />
                    {fieldError('eventDate')}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="eventType">Event type</label>
                    <select required {...fieldProps('eventType')}>
                      <option value="">Select an occasion</option>
                      {eventTypes.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {fieldError('eventType')}
                  </div>
                  <div className="form-group">
                    <label htmlFor="guests">Approximate guests</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      placeholder="e.g. 150"
                      required
                      {...fieldProps('guests')}
                    />
                    {fieldError('guests')}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="message">
                    Anything else we should know
                    <span className="form-label-hint">Optional</span>
                  </label>
                  <textarea
                    rows="4"
                    placeholder="Dietary preferences, venue specifics, theme, timing — whatever feels relevant."
                    maxLength={MESSAGE_MAX_LENGTH}
                    {...fieldProps('message')}
                  />
                  <div className="form-helper-row">
                    {fieldError('message')}
                    <span
                      className={
                        'form-counter' +
                        (messageRemaining < 100 ? ' form-counter-low' : '')
                      }
                    >
                      {messageRemaining} characters remaining
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-accent btn-lg contact-submit-btn"
                  disabled={submitted || submitting}
                >
                  {submitted ? (
                    <>
                      <i className="fas fa-check" aria-hidden="true"></i>
                      Enquiry received
                    </>
                  ) : submitting ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin" aria-hidden="true"></i>
                      Sending your enquiry…
                    </>
                  ) : (
                    <>
                      Request your tailored proposal
                      <i className="fas fa-arrow-right" aria-hidden="true"></i>
                    </>
                  )}
                </button>

                {showColdStartHint && submitting && (
                  <p className="contact-cold-start-hint" aria-live="polite">
                    <i className="fas fa-circle-notch fa-spin" aria-hidden="true"></i>
                    Just a moment — our server is waking up. This usually takes a few seconds.
                  </p>
                )}

                <p className="contact-form-footnote">
                  By sending this enquiry, you agree to be contacted by our
                  coordinator regarding your event. We respect your privacy and
                  never share your details.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
