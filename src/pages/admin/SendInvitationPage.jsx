import React, { useState, useEffect } from 'react';
import AdminPageHero from '../../components/admin/layout/AdminPageHero';

const MOCK_CLIENTS = [
  { id: 1, name: 'Rajesh Kumar', email: 'rajesh@example.com', phone: '+91 98765 43210' },
  { id: 2, name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 98765 43211' },
  { id: 3, name: 'Anand Reddy', email: 'anand@example.com', phone: '+91 98765 43212' },
];

const INITIAL = {
  clientId: '',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  eventType: '',
  eventDate: '',
  expiryDays: 30,
  personalMessage: '',
};

const SendInvitationPage = () => {
  const [formData, setFormData] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [clients, setClients] = useState([]);
  const [showClientSearch, setShowClientSearch] = useState(false);

  useEffect(() => {
    setClients(MOCK_CLIENTS);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleClientSelect = (client) => {
    setFormData((prev) => ({
      ...prev,
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone,
    }));
    setShowClientSearch(false);
  };

  const validate = () => {
    const e = {};
    if (!formData.clientName.trim()) e.clientName = 'Client name is required';
    if (!formData.clientEmail.trim()) e.clientEmail = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail))
      e.clientEmail = 'Invalid email format';
    if (!formData.clientPhone.trim()) e.clientPhone = 'Phone number is required';
    if (!formData.eventType.trim()) e.eventType = 'Event type is required';
    if (!formData.eventDate) e.eventDate = 'Event date is required';
    if (formData.expiryDays < 1 || formData.expiryDays > 90)
      e.expiryDays = 'Expiry must be between 1 and 90 days';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setSuccess(true);
      setTimeout(() => {
        setFormData(INITIAL);
        setSuccess(false);
      }, 2400);
    } catch {
      setErrors({ submit: 'Failed to send invitation. Please try again.' });
    } finally {
      setLoading(false);
    }
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
      <span className="form-error" id={`${name}-error`} role="alert">
        <i className="fas fa-exclamation-circle" aria-hidden="true"></i>
        {errors[name]}
      </span>
    ) : null;

  return (
    <>
      <AdminPageHero
        eyebrow="Review Invitations"
        icon="fa-paper-plane"
        title="Send Review Invitation"
        intro="Invite a recent client to share their experience — every approved review feeds the homepage testimonials."
      />

      <section className="section">
        <div className="container" style={{ maxWidth: 880 }}>
          {success ? (
            <div className="admin-success-state">
              <div className="admin-success-icon">
                <i className="fas fa-check-circle" aria-hidden="true"></i>
              </div>
              <h3>Invitation sent!</h3>
              <p>The review link is on its way to {formData.clientName}.</p>
            </div>
          ) : (
            <div className="admin-surface">
              <form onSubmit={handleSubmit} noValidate>
                {/* Section 1 */}
                <div className="admin-form-section">
                  <h3 className="admin-form-section-title">
                    <span className="admin-form-section-num">1</span>
                    Client information
                  </h3>

                  <div className="mb-4">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowClientSearch((v) => !v)}
                    >
                      <i className="fas fa-search" aria-hidden="true"></i>
                      {showClientSearch ? 'Hide directory' : 'Pick from directory'}
                    </button>
                  </div>

                  {showClientSearch && (
                    <div className="client-picker">
                      <p className="client-picker-title">Select a client</p>
                      <div className="client-picker-list">
                        {clients.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className="client-picker-item"
                            onClick={() => handleClientSelect(c)}
                          >
                            <div className="name">{c.name}</div>
                            <div className="meta">
                              {c.email} · {c.phone}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="clientName">
                        Client name <span className="req">*</span>
                      </label>
                      <input type="text" {...fieldProps('clientName')} />
                      {fieldError('clientName')}
                    </div>
                    <div className="form-group">
                      <label htmlFor="clientEmail">
                        Email address <span className="req">*</span>
                      </label>
                      <input type="email" {...fieldProps('clientEmail')} />
                      {fieldError('clientEmail')}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="clientPhone">
                      Phone number <span className="req">*</span>
                    </label>
                    <input type="tel" {...fieldProps('clientPhone')} />
                    {fieldError('clientPhone')}
                  </div>
                </div>

                {/* Section 2 */}
                <div className="admin-form-section">
                  <h3 className="admin-form-section-title">
                    <span className="admin-form-section-num">2</span>
                    Event details
                  </h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="eventType">
                        Event type <span className="req">*</span>
                      </label>
                      <select {...fieldProps('eventType')}>
                        <option value="">Select event type</option>
                        <option value="Wedding">Wedding</option>
                        <option value="Birthday Party">Birthday Party</option>
                        <option value="Corporate Event">Corporate Event</option>
                        <option value="Anniversary">Anniversary</option>
                        <option value="Festival">Festival</option>
                        <option value="Other">Other</option>
                      </select>
                      {fieldError('eventType')}
                    </div>
                    <div className="form-group">
                      <label htmlFor="eventDate">
                        Event date <span className="req">*</span>
                      </label>
                      <input type="date" {...fieldProps('eventDate')} />
                      {fieldError('eventDate')}
                    </div>
                  </div>
                </div>

                {/* Section 3 */}
                <div className="admin-form-section">
                  <h3 className="admin-form-section-title">
                    <span className="admin-form-section-num">3</span>
                    Invitation settings
                  </h3>
                  <div className="form-group">
                    <label htmlFor="expiryDays">
                      Link expiry (days) <span className="req">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      {...fieldProps('expiryDays')}
                    />
                    {fieldError('expiryDays')}
                    <small style={{ color: 'var(--text-light)', fontSize: 13 }}>
                      The review link will expire after this many days.
                    </small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="personalMessage">Personal message (optional)</label>
                    <textarea
                      {...fieldProps('personalMessage')}
                      rows="4"
                      placeholder="Add a brief, personal note to the invitation email…"
                    ></textarea>
                  </div>
                </div>

                {errors.submit && (
                  <div className="form-error mb-5">
                    <i className="fas fa-exclamation-circle" aria-hidden="true"></i>
                    {errors.submit}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%' }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
                      Sending invitation…
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane" aria-hidden="true"></i>
                      Send review invitation
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default SendInvitationPage;
