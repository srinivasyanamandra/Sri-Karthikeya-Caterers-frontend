import React, { useState, useRef, useEffect } from 'react';
import { useNavigation } from '../../contexts/NavigationContext';
import { CONTACT } from '../../constants/contact';
import { auth as authApi, tokenStore } from '../../services/api';

/**
 * AdminLoginPage — JWT-based authentication.
 * Calls POST /api/admin/auth/login (email + password) and stores the JWT
 * locally. On success, redirects to the dashboard.
 */

const INITIAL_STATE = {
  email: '',
  password: '',
  token: '',
};

const AdminLoginPage = () => {
  const { navigate } = useNavigation();
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState('credentials'); // 'credentials' | 'success'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const tokenInputRef = useRef(null);

  useEffect(() => {
    // unused now that token step is collapsed, but keep ref for parity
    if (step === 'token' && tokenInputRef.current) {
      tokenInputRef.current.focus();
    }
  }, [step]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateCredentials = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    return newErrors;
  };

  const validateToken = () => {
    const newErrors = {};
    
    if (!formData.token.trim()) {
      newErrors.token = 'JWT token is required';
    }
    
    return newErrors;
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateCredentials();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstInvalid = document.querySelector('[aria-invalid="true"]');
      if (firstInvalid instanceof HTMLElement) firstInvalid.focus();
      return;
    }

    setLoading(true);
    setErrors({});
    setMessage('');

    try {
      const data = await authApi.login({
        email: formData.email,
        password: formData.password,
      });
      tokenStore.set(data.token, data.expiresAt, data?.user?.email || formData.email);

      setStep('success');
      setMessage('Login successful. Redirecting to dashboard…');
      setTimeout(() => navigate('admin-dashboard'), 600);
    } catch (error) {
      const code = error?.code || '';
      const msg =
        code === 'INVALID_CREDENTIALS' || error?.status === 401
          ? 'Email or password is incorrect.'
          : error?.message || 'Login failed. Please try again.';
      setErrors({ password: msg });
    } finally {
      setLoading(false);
    }
  };

  // Kept as a no-op so any stale refs don't crash. The token-step UI is hidden.
  const handleTokenSubmit = (e) => e.preventDefault();

  const handleBackToCredentials = () => {
    setStep('credentials');
    setFormData(prev => ({ ...prev, token: '' }));
    setErrors({});
    setMessage('');
  };

  const fieldProps = (name) => ({
    id: name,
    name,
    value: formData[name],
    onChange: handleChange,
    'aria-invalid': errors[name] ? 'true' : 'false',
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
    disabled: loading,
  });

  const fieldError = (name) =>
    errors[name] ? (
      <span id={`${name}-error`} className="form-error" role="alert">
        {errors[name]}
      </span>
    ) : null;

  return (
    <div className="admin-login-page">
      {/* Background with same warm tones as public site */}
      <div className="admin-login-bg"></div>

      <div className="admin-login-container">
        {/* Logo */}
        <div className="admin-login-logo">
          <img src="/logo.png" alt={CONTACT.brand} />
        </div>

        {/* Login Card */}
        <div className="admin-login-card">
          <span className="eyebrow">
            <span className="dot"></span>
            Admin Access
          </span>
          <h1 className="admin-login-title">
            {step === 'credentials' && 'Welcome back'}
            {step === 'token' && 'Verify your identity'}
            {step === 'success' && 'Access granted'}
          </h1>
          <p className="admin-login-intro">
            {step === 'credentials' && 'Enter your credentials to access the admin dashboard'}
            {step === 'token' && 'Check your email for the JWT token'}
            {step === 'success' && 'Redirecting you to the dashboard...'}
          </p>

          {/* Success/Info Message */}
          {message && (
            <div className={`form-${step === 'success' ? 'success' : 'info'}`} role="status" aria-live="polite">
              <i className={`fas fa-${step === 'success' ? 'check-circle' : 'info-circle'}`} aria-hidden="true"></i>
              <span>{message}</span>
            </div>
          )}

          {/* Step 1: Email + Password */}
          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input
                  type="email"
                  placeholder="admin@srikarthikeyacaterers.in"
                  required
                  autoComplete="email"
                  {...fieldProps('email')}
                />
                {fieldError('email')}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  {...fieldProps('password')}
                />
                {fieldError('password')}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin" aria-hidden="true"></i> Sending token...
                  </>
                ) : (
                  <>
                    Continue <i className="fas fa-arrow-right" aria-hidden="true"></i>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: JWT Token */}
          {step === 'token' && (
            <form onSubmit={handleTokenSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="token">JWT Token</label>
                <textarea
                  ref={tokenInputRef}
                  rows="4"
                  placeholder="Paste the JWT token from your email"
                  required
                  {...fieldProps('token')}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                />
                {fieldError('token')}
                <small style={{ display: 'block', marginTop: '8px', color: 'var(--color-text-light)', fontSize: '12px' }}>
                  The token was sent to <strong>{formData.email}</strong>
                </small>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleBackToCredentials}
                  disabled={loading}
                  style={{ flex: '0 0 auto' }}
                >
                  <i className="fas fa-arrow-left" aria-hidden="true"></i> Back
                </button>
                <button
                  type="submit"
                  className="btn btn-accent btn-lg"
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin" aria-hidden="true"></i> Verifying...
                    </>
                  ) : (
                    <>
                      Verify & Login <i className="fas fa-check" aria-hidden="true"></i>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="admin-login-success">
              <div className="admin-login-success-icon">
                <i className="fas fa-check-circle" aria-hidden="true"></i>
              </div>
              <p>Preparing your dashboard...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="admin-login-footer">
          <p>
            <i className="fas fa-shield-alt" aria-hidden="true"></i>
            Secure admin access · JWT authentication
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
