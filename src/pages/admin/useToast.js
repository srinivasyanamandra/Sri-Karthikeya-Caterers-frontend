/**
 * useToast — Lightweight toast notification system
 * 
 * Usage:
 *   const { toast } = useToast();
 *   toast.success('Review approved');
 *   toast.error('Something went wrong');
 *   toast.info('3 emails queued');
 *   toast.warning('Action cannot be undone');
 * 
 * Wrap your admin app with <ToastProvider> and place <ToastContainer /> 
 * at the root of your admin layout.
 */

import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  useEffect,
  useRef,
} from 'react';

/* ─── Types ──────────────────────────────────────────────── */

const TOAST_TYPES = /** @type {const} */ ({
  success: {
    icon: 'fa-check-circle',
    color: 'var(--color-success)',
    bg: 'rgba(46,125,50,0.10)',
    border: 'rgba(46,125,50,0.25)',
  },
  error: {
    icon: 'fa-exclamation-circle',
    color: 'var(--color-error)',
    bg: 'rgba(179,38,30,0.10)',
    border: 'rgba(179,38,30,0.25)',
  },
  warning: {
    icon: 'fa-exclamation-triangle',
    color: 'var(--color-warning, #b45309)',
    bg: 'rgba(217,119,6,0.10)',
    border: 'rgba(217,119,6,0.25)',
  },
  info: {
    icon: 'fa-info-circle',
    color: 'var(--color-info, #1d4ed8)',
    bg: 'rgba(29,78,216,0.08)',
    border: 'rgba(29,78,216,0.20)',
  },
});

const DEFAULT_DURATION = 4000;

/* ─── Reducer ─────────────────────────────────────────────── */

function toastReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [action.toast, ...state].slice(0, 5); // max 5 toasts
    case 'REMOVE':
      return state.filter((t) => t.id !== action.id);
    case 'DISMISS':
      return state.map((t) =>
        t.id === action.id ? { ...t, exiting: true } : t
      );
    default:
      return state;
  }
}

/* ─── Context ─────────────────────────────────────────────── */

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);
  const counterRef = useRef(0);

  const dismiss = useCallback((id) => {
    dispatch({ type: 'DISMISS', id });
    // Remove from DOM after exit animation
    setTimeout(() => dispatch({ type: 'REMOVE', id }), 380);
  }, []);

  const addToast = useCallback(
    (message, type = 'info', options = {}) => {
      const id = ++counterRef.current;
      const duration = options.duration ?? DEFAULT_DURATION;

      dispatch({
        type: 'ADD',
        toast: { id, message, type, duration, exiting: false, ...options },
      });

      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }

      return id;
    },
    [dismiss]
  );

  const toast = {
    success: (msg, opts) => addToast(msg, 'success', opts),
    error: (msg, opts) => addToast(msg, 'error', { duration: 6000, ...opts }),
    warning: (msg, opts) => addToast(msg, 'warning', opts),
    info: (msg, opts) => addToast(msg, 'info', opts),
    dismiss,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return { toast: ctx };
}

/* ─── Individual Toast ────────────────────────────────────── */

function Toast({ toast: t, onDismiss }) {
  const meta = TOAST_TYPES[t.type] || TOAST_TYPES.info;
  const progressRef = useRef(null);

  // Animate the progress bar
  useEffect(() => {
    if (!progressRef.current || t.duration <= 0) return;
    const el = progressRef.current;
    el.style.transition = 'none';
    el.style.width = '100%';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = `width ${t.duration}ms linear`;
        el.style.width = '0%';
      });
    });
  }, [t.duration]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        borderRadius: 'var(--radius-sm)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
        position: 'relative',
        overflow: 'hidden',
        minWidth: 280,
        maxWidth: 400,
        transform: t.exiting ? 'translateX(calc(100% + 24px))' : 'translateX(0)',
        opacity: t.exiting ? 0 : 1,
        transition: 'transform 360ms cubic-bezier(0.4,0,0.2,1), opacity 360ms ease',
        animation: t.exiting ? 'none' : 'toastIn 380ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Icon */}
      <i
        className={`fas ${meta.icon}`}
        style={{ color: meta.color, fontSize: 16, flexShrink: 0, marginTop: 1 }}
        aria-hidden="true"
      />

      {/* Message */}
      <div style={{ flex: 1, fontSize: 14, lineHeight: 1.55, color: 'var(--text-primary)', fontWeight: 500 }}>
        {t.message}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(t.id)}
        aria-label="Dismiss notification"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-light)',
          fontSize: 12,
          padding: '2px 4px',
          borderRadius: 4,
          flexShrink: 0,
          lineHeight: 1,
          transition: 'color 200ms',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-light)')}
      >
        <i className="fas fa-times" aria-hidden="true" />
      </button>

      {/* Progress bar */}
      {t.duration > 0 && (
        <div
          ref={progressRef}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: 2,
            background: meta.color,
            opacity: 0.5,
            width: '100%',
          }}
        />
      )}
    </div>
  );
}

/* ─── Container ───────────────────────────────────────────── */

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(calc(100% + 24px)); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div
        aria-label="Notifications"
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <Toast toast={t} onDismiss={onDismiss} />
          </div>
        ))}
      </div>
    </>
  );
}