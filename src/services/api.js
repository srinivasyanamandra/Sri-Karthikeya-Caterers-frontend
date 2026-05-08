/**
 * API client for the Sri Karthikeya Caterers backend.
 *
 * SINGLE SOURCE OF TRUTH FOR API URL:
 * - Reads base URL from REACT_APP_API_URL environment variable
 * - Local development: Uses http://localhost:8080 (from .env)
 * - Production: Uses https://skc-backend-5o4z.onrender.com (from .env.production or Vercel env)
 * - Override locally: Create .env.local with REACT_APP_API_URL=<your-url>
 *
 * - Attaches Authorization: Bearer <jwt> on admin requests
 * - Normalizes the backend's `{error, message, fields, traceId}` envelope
 *   into a thrown ApiError so callers can render `err.message` / `err.fields`
 * - On 401/403, clears the token and emits a `skc:auth-expired` event so
 *   the navigation layer can redirect to /#admin-login
 */

// SINGLE SOURCE OF TRUTH
// Fallback to production URL for Vercel/Netlify deployments where env vars might not be set during build
const API_URL = (
  process.env.REACT_APP_API_URL || 
  'https://skc-backend-5o4z.onrender.com'
).replace(/\/+$/, '');

// Log the API URL in development for debugging
if (process.env.NODE_ENV === 'development') {
  console.log('🔗 API URL:', API_URL);
}

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
  createClient: (payload) =>
    post('/api/admin/clients', payload, { auth: true }),
  updateClient: (id, payload) =>
    put(`/api/admin/clients/${id}`, payload, { auth: true }),
  touchClient: (id) =>
    post(`/api/admin/clients/${id}/touch`, null, { auth: true }),

  /* clients → notes (CRM timeline) */
  addClientNote: (id, payload) =>
    post(`/api/admin/clients/${id}/notes`, payload, { auth: true }),
  updateClientNote: (id, noteId, payload) =>
    put(`/api/admin/clients/${id}/notes/${noteId}`, payload, { auth: true }),
  deleteClientNote: (id, noteId) =>
    del(`/api/admin/clients/${id}/notes/${noteId}`, { auth: true }),

  /* clients → addresses */
  addClientAddress: (id, payload) =>
    post(`/api/admin/clients/${id}/addresses`, payload, { auth: true }),
  updateClientAddress: (id, addressId, payload) =>
    put(`/api/admin/clients/${id}/addresses/${addressId}`, payload, { auth: true }),
  deleteClientAddress: (id, addressId) =>
    del(`/api/admin/clients/${id}/addresses/${addressId}`, { auth: true }),

  /* clients → tags (TEXT[] under the hood — pass plain strings) */
  setClientTags: (id, tags) =>
    put(`/api/admin/clients/${id}/tags`, { tags }, { auth: true }),

  /* tag autocomplete — distinct values across the chosen scope.
     Returns an array of strings; there is no tag registry to create. */
  listTags: (scope = 'client') =>
    get('/api/admin/tags', { auth: true, params: { scope } }),

  /* ---------- vendors ---------- */
  listVendors: (params) =>
    get('/api/admin/vendors', { auth: true, params }),
  getVendor: (id) => get(`/api/admin/vendors/${id}`, { auth: true }),
  createVendor: (payload) =>
    post('/api/admin/vendors', payload, { auth: true }),
  updateVendor: (id, payload) =>
    put(`/api/admin/vendors/${id}`, payload, { auth: true }),
  deleteVendor: (id) =>
    del(`/api/admin/vendors/${id}`, { auth: true }),
  setVendorTags: (id, tags) =>
    put(`/api/admin/vendors/${id}/tags`, { tags }, { auth: true }),

  /* vendors → contacts */
  addVendorContact: (id, payload) =>
    post(`/api/admin/vendors/${id}/contacts`, payload, { auth: true }),
  updateVendorContact: (id, contactId, payload) =>
    put(`/api/admin/vendors/${id}/contacts/${contactId}`, payload, { auth: true }),
  deleteVendorContact: (id, contactId) =>
    del(`/api/admin/vendors/${id}/contacts/${contactId}`, { auth: true }),

  /* vendors → rate cards */
  addVendorRateCard: (id, payload) =>
    post(`/api/admin/vendors/${id}/rate-cards`, payload, { auth: true }),
  updateVendorRateCard: (id, cardId, payload) =>
    put(`/api/admin/vendors/${id}/rate-cards/${cardId}`, payload, { auth: true }),
  deleteVendorRateCard: (id, cardId) =>
    del(`/api/admin/vendors/${id}/rate-cards/${cardId}`, { auth: true }),

  /* ---------- purchase orders ---------- */
  listPurchaseOrders: (params) =>
    get('/api/admin/purchase-orders', { auth: true, params }),
  getPurchaseOrder: (id) =>
    get(`/api/admin/purchase-orders/${id}`, { auth: true }),
  createPurchaseOrder: (payload) =>
    post('/api/admin/purchase-orders', payload, { auth: true }),
  updatePurchaseOrder: (id, payload) =>
    put(`/api/admin/purchase-orders/${id}`, payload, { auth: true }),
  recordPoPayment: (id, paidCents) =>
    post(`/api/admin/purchase-orders/${id}/payment`, { paidCents }, { auth: true }),
  deletePurchaseOrder: (id) =>
    del(`/api/admin/purchase-orders/${id}`, { auth: true }),

  /* ---------- invoices (Phase 3) ---------- */
  listInvoices: (params) =>
    get('/api/admin/invoices', { auth: true, params }),
  getInvoice: (id) => get(`/api/admin/invoices/${id}`, { auth: true }),
  createInvoice: (payload) =>
    post('/api/admin/invoices', payload, { auth: true }),
  updateInvoice: (id, payload) =>
    put(`/api/admin/invoices/${id}`, payload, { auth: true }),
  issueInvoice: (id) =>
    post(`/api/admin/invoices/${id}/issue`, null, { auth: true }),
  voidInvoice: (id) =>
    post(`/api/admin/invoices/${id}/void`, null, { auth: true }),
  deleteInvoice: (id) =>
    del(`/api/admin/invoices/${id}`, { auth: true }),

  /* ---------- transactions / cash flow ledger ---------- */
  listTransactions: (params) =>
    get('/api/admin/transactions', { auth: true, params }),
  getTransaction: (id) => get(`/api/admin/transactions/${id}`, { auth: true }),
  recordTransaction: (payload) =>
    post('/api/admin/transactions', payload, { auth: true }),
  updateTransaction: (id, payload) =>
    put(`/api/admin/transactions/${id}`, payload, { auth: true }),
  refundTransaction: (id, reason) =>
    post(`/api/admin/transactions/${id}/refund`, { reason }, { auth: true }),
  deleteTransaction: (id) =>
    del(`/api/admin/transactions/${id}`, { auth: true }),

  /* ---------- bookings ---------- */
  listBookings: (params) =>
    get('/api/admin/bookings', { auth: true, params }),
  getBooking: (id) => get(`/api/admin/bookings/${id}`, { auth: true }),
  createBooking: (payload) =>
    post('/api/admin/bookings', payload, { auth: true }),
  convertQuoteToBooking: (quoteId, payload = {}) =>
    post(`/api/admin/bookings/from-quote/${quoteId}`, payload, { auth: true }),
  updateBooking: (id, payload) =>
    put(`/api/admin/bookings/${id}`, payload, { auth: true }),
  deleteBooking: (id) =>
    del(`/api/admin/bookings/${id}`, { auth: true }),

  /* bookings → tasks (event checklist) */
  addBookingTask: (id, payload) =>
    post(`/api/admin/bookings/${id}/tasks`, payload, { auth: true }),
  updateBookingTask: (id, taskId, payload) =>
    put(`/api/admin/bookings/${id}/tasks/${taskId}`, payload, { auth: true }),
  deleteBookingTask: (id, taskId) =>
    del(`/api/admin/bookings/${id}/tasks/${taskId}`, { auth: true }),

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
