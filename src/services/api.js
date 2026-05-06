/**
 * API client for the Sri Karthikeya Caterers backend.
 *
 * - Reads base URL from REACT_APP_API_URL (defaults to the deployed Render
 *   instance at https://skc-backend-5o4z.onrender.com). Override with a
 *   `.env.local` containing REACT_APP_API_URL=http://localhost:8080 to run
 *   the frontend against a local Spring Boot backend.
 * - Attaches Authorization: Bearer <jwt> on admin requests
 * - Normalizes the backend's `{error, message, fields, traceId}` envelope
 *   into a thrown ApiError so callers can render `err.message` / `err.fields`
 * - On 401/403, clears the token and emits a `skc:auth-expired` event so
 *   the navigation layer can redirect to /#admin-login
 */

const API_URL =
  (process.env.REACT_APP_API_URL || 'https://skc-backend-5o4z.onrender.com').replace(/\/+$/, '');

const TOKEN_KEY = 'adminToken';
const TOKEN_EXPIRY_KEY = 'adminTokenExpiry';
const ADMIN_EMAIL_KEY = 'adminEmail';

/* ───────────────────────────── token store ─────────────────────────────── */

export const tokenStore = {
  get: () => {
    try {
      const t = localStorage.getItem(TOKEN_KEY);
      const exp = parseInt(localStorage.getItem(TOKEN_EXPIRY_KEY) || '0', 10);
      if (!t) return null;
      if (exp && exp < Date.now()) {
        tokenStore.clear();
        return null;
      }
      return t;
    } catch {
      return null;
    }
  },
  set: (token, expiresAtIso, email) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      const expMs = expiresAtIso
        ? new Date(expiresAtIso).getTime()
        : Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem(TOKEN_EXPIRY_KEY, String(expMs));
      if (email) localStorage.setItem(ADMIN_EMAIL_KEY, email);
    } catch {
      /* ignore */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      localStorage.removeItem(ADMIN_EMAIL_KEY);
    } catch {
      /* ignore */
    }
  },
  email: () => {
    try {
      return localStorage.getItem(ADMIN_EMAIL_KEY);
    } catch {
      return null;
    }
  },
};

/* ─────────────────────────────── ApiError ──────────────────────────────── */

export class ApiError extends Error {
  constructor({ status, code, message, fields, traceId }) {
    super(message || code || `HTTP ${status}`);
    this.status = status;
    this.code = code;
    this.fields = fields || null;
    this.traceId = traceId || null;
  }
}

/* ──────────────────────────────── core ─────────────────────────────────── */

const buildUrl = (path, params) => {
  const url = new URL(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      if (Array.isArray(v)) v.forEach((vv) => url.searchParams.append(k, vv));
      else url.searchParams.set(k, v);
    });
  }
  return url.toString();
};

async function request(method, path, { params, body, auth = false, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const t = tokenStore.get();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Could not reach the server. Please check your connection.',
    });
  }

  // 204 / 202 with empty body
  if (response.status === 204) return null;

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      if (auth) {
        tokenStore.clear();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('skc:auth-expired'));
        }
      }
    }
    throw new ApiError({
      status: response.status,
      code: payload?.error || `HTTP_${response.status}`,
      message:
        payload?.message ||
        `Request failed with status ${response.status}`,
      fields: payload?.fields,
      traceId: payload?.traceId,
    });
  }

  return payload;
}

const get  = (path, opts) => request('GET', path, opts);
const post = (path, body, opts = {}) => request('POST', path, { ...opts, body });
const put  = (path, body, opts = {}) => request('PUT', path, { ...opts, body });
const del  = (path, opts) => request('DELETE', path, opts);

/* ============================================================ Public API */

export const auth = {
  login: ({ email, password }) =>
    post('/api/admin/auth/login', { email, password }),
};

export const publicApi = {
  submitQuote: (payload) => post('/api/quotes', payload),
  subscribe: (payload) => post('/api/subscribe', payload),
  getReviewInvitation: (token) => get(`/api/public/reviews/${encodeURIComponent(token)}`),
  submitReview: (token, payload) =>
    post(`/api/public/reviews/${encodeURIComponent(token)}`, payload),
  listPublicReviews: ({ page = 0, limit = 24, minRating } = {}) =>
    get('/api/public/reviews/public', { params: { page, limit, minRating } }),
  listFeaturedReviews: ({ limit = 6 } = {}) =>
    get('/api/public/reviews/featured', { params: { limit } }),
};

/* ============================================================= Admin API */

export const admin = {
  /* ---------- dashboard ---------- */
  dashboard: () => get('/api/admin/dashboard', { auth: true }),

  /* ---------- quotes ---------- */
  listQuotes: (params) => get('/api/admin/quotes', { auth: true, params }),
  getQuote: (id) => get(`/api/admin/quotes/${id}`, { auth: true }),
  updateQuoteStatus: (id, status, note) =>
    put(`/api/admin/quotes/${id}/status`, { status, note }, { auth: true }),

  /* ---------- reviews ---------- */
  listReviews: (params) => get('/api/admin/reviews', { auth: true, params }),
  listInvitations: (params) =>
    get('/api/admin/reviews/invitations', { auth: true, params }),
  getReview: (id) => get(`/api/admin/reviews/${id}`, { auth: true }),
  inviteReview: (payload) =>
    post('/api/admin/reviews/invite', payload, { auth: true }),
  approveReview: (id) =>
    put(`/api/admin/reviews/${id}/approve`, null, { auth: true }),
  rejectReview: (id, reason) =>
    put(`/api/admin/reviews/${id}/reject`, { reason }, { auth: true }),
  featureReview: (id, featured) =>
    put(`/api/admin/reviews/${id}/feature`, { featured }, { auth: true }),
  deleteReview: (id) => del(`/api/admin/reviews/${id}`, { auth: true }),

  /* ---------- templates ---------- */
  listTemplates: (params) =>
    get('/api/admin/templates', { auth: true, params }),
  getTemplate: (id) => get(`/api/admin/templates/${id}`, { auth: true }),
  createTemplate: (payload) =>
    post('/api/admin/templates', payload, { auth: true }),
  updateTemplate: (id, payload) =>
    put(`/api/admin/templates/${id}`, payload, { auth: true }),
  deleteTemplate: (id) => del(`/api/admin/templates/${id}`, { auth: true }),
  testTemplate: (id, payload) =>
    post(`/api/admin/templates/${id}/test`, payload, { auth: true }),

  /* ---------- clients ---------- */
  listClients: (params) =>
    get('/api/admin/clients', { auth: true, params }),
  getClient: (id) => get(`/api/admin/clients/${id}`, { auth: true }),
  updateClient: (id, payload) =>
    put(`/api/admin/clients/${id}`, payload, { auth: true }),

  /* ---------- subscribers ---------- */
  listSubscribers: (params) =>
    get('/api/admin/subscribers', { auth: true, params }),
  unsubscribe: (id) =>
    put(`/api/admin/subscribers/${id}/unsubscribe`, null, { auth: true }),
  deleteSubscriber: (id) =>
    del(`/api/admin/subscribers/${id}`, { auth: true }),

  /* ---------- recipients ---------- */
  searchRecipients: (params) =>
    get('/api/admin/recipients', { auth: true, params }),
  resolveRecipients: (payload) =>
    post('/api/admin/recipients/resolve', payload, { auth: true }),

  /* ---------- campaigns ---------- */
  listCampaigns: (params) =>
    get('/api/admin/campaigns', { auth: true, params }),
  createCampaign: (payload) =>
    post('/api/admin/campaigns', payload, { auth: true }),
  getCampaign: (id, params) =>
    get(`/api/admin/campaigns/${id}`, { auth: true, params }),
  setCampaignRecipients: (id, payload) =>
    post(`/api/admin/campaigns/${id}/recipients`, payload, { auth: true }),
  setCampaignTemplates: (id, payload) =>
    put(`/api/admin/campaigns/${id}/templates`, payload, { auth: true }),
  previewCampaign: (id, payload) =>
    post(`/api/admin/campaigns/${id}/preview`, payload, { auth: true }),
  sendCampaign: (id, payload) =>
    post(`/api/admin/campaigns/${id}/send`, payload, { auth: true }),
  cancelCampaign: (id) =>
    post(`/api/admin/campaigns/${id}/cancel`, null, { auth: true }),

  /* ---------- emails (one-off) ---------- */
  sendOneEmail: (payload) =>
    post('/api/admin/emails/send-one', payload, { auth: true }),
};

export const apiBaseUrl = API_URL;

const api = { auth, publicApi, admin, tokenStore, ApiError, apiBaseUrl };
export default api;
