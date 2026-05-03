/**
 * adminHooks.js — Shared utility hooks for the admin interface
 * 
 * Exports:
 *   useEscapeKey(handler)         → close modals/drawers on ESC
 *   useClickOutside(ref, handler) → close overlays on outside click
 *   useDebounce(value, delay)     → debounced search value
 *   useAnimatedCounter(target)    → smooth number count-up
 *   usePagination(items, perPage) → pagination slice + controls
 *   useKeyboardShortcut(map)      → register keyboard shortcuts
 *   useFocusTrap(ref, active)     → trap focus inside modals
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/* ─────────────────────────────────────────────
   useEscapeKey — Fire callback when ESC is pressed
   ───────────────────────────────────────────── */
export function useEscapeKey(handler, active = true) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handler();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [handler, active]);
}

/* ─────────────────────────────────────────────
   useClickOutside — Fire callback when clicking outside a ref
   ───────────────────────────────────────────── */
export function useClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return;
    const onPointer = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        handler(e);
      }
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [ref, handler, active]);
}

/* ─────────────────────────────────────────────
   useDebounce — Debounce a rapidly-changing value
   ───────────────────────────────────────────── */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

/* ─────────────────────────────────────────────
   useAnimatedCounter — Animate a number from 0 → target
   ───────────────────────────────────────────── */
export function useAnimatedCounter(target, duration = 1200, delay = 0) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = performance.now() + delay;
    const run = (now) => {
      if (now < start) {
        rafRef.current = requestAnimationFrame(run);
        return;
      }
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out-quart
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(run);
      }
    };
    rafRef.current = requestAnimationFrame(run);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [target, duration, delay]);

  return count;
}

/* ─────────────────────────────────────────────
   usePagination — Paginate an array with controls
   ───────────────────────────────────────────── */
export function usePagination(items, perPage = 10) {
  const [page, setPage] = useState(1);

  // Reset to page 1 when items change (e.g. search/filter)
  useEffect(() => setPage(1), [items.length]);

  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(page, totalPages);

  const slice = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, safePage, perPage]);

  const goTo = useCallback(
    (p) => setPage(Math.max(1, Math.min(p, totalPages))),
    [totalPages]
  );

  return {
    page: safePage,
    totalPages,
    slice,
    goTo,
    prev: () => goTo(safePage - 1),
    next: () => goTo(safePage + 1),
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
    start: (safePage - 1) * perPage + 1,
    end: Math.min(safePage * perPage, items.length),
    total: items.length,
  };
}

/* ─────────────────────────────────────────────
   useKeyboardShortcut — Register multiple shortcuts
   
   map: { 'a': handler, 'shift+r': handler }
   Only fires when no input/textarea is focused.
   ───────────────────────────────────────────── */
export function useKeyboardShortcut(map, active = true) {
  useEffect(() => {
    if (!active) return;

    const onKey = (e) => {
      // Skip when typing in inputs
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.target?.isContentEditable) return;

      const parts = [];
      if (e.metaKey || e.ctrlKey) parts.push('ctrl');
      if (e.shiftKey) parts.push('shift');
      if (e.altKey) parts.push('alt');
      parts.push(e.key.toLowerCase());

      const combo = parts.join('+');
      const handler = map[combo] || map[e.key.toLowerCase()];
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [map, active]);
}

/* ─────────────────────────────────────────────
   useFocusTrap — Trap tab focus inside a container
   ───────────────────────────────────────────── */
export function useFocusTrap(containerRef, active = true) {
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const el = containerRef.current;

    // Focus the first focusable element
    const focusable = el.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (first) first.focus();

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [containerRef, active]);
}

/* ─────────────────────────────────────────────
   useOptimisticList — Optimistic state mutations 
   for lists (update UI immediately, revert on error)
   ───────────────────────────────────────────── */
export function useOptimisticList(initialItems) {
  const [items, setItems] = useState(initialItems);
  const [pending, setPending] = useState(new Set());

  const optimisticUpdate = useCallback(
    async (id, updateFn, apiCall) => {
      // Save snapshot for potential rollback
      const snapshot = items;

      // Apply optimistic update immediately
      setItems((prev) => updateFn(prev));
      setPending((prev) => new Set([...prev, id]));

      try {
        await apiCall();
      } catch (err) {
        // Roll back on failure
        setItems(snapshot);
        throw err;
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [items]
  );

  const replace = useCallback((id, patch) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }, []);

  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const prepend = useCallback((item) => {
    setItems((prev) => [item, ...prev]);
  }, []);

  return { items, setItems, optimisticUpdate, replace, remove, prepend, pending };
}

/* ─────────────────────────────────────────────
   Pagination UI Component (reusable)
   ───────────────────────────────────────────── */
export function PaginationBar({ pagination, label = 'items' }) {
  const { page, totalPages, hasPrev, hasNext, prev, next, goTo, start, end, total } =
    pagination;

  // Build page numbers: [1, ..., prev, current, next, ..., last]
  const pages = useMemo(() => {
    const nums = new Set([1, totalPages, page - 1, page, page + 1].filter(
      (n) => n >= 1 && n <= totalPages
    ));
    return [...nums].sort((a, b) => a - b);
  }, [page, totalPages]);

  if (total === 0) return null;

  return (
    <div className="admin-pagination">
      <div className="admin-pagination-info">
        Showing {start}–{end} of {total} {label}
      </div>
      <div className="admin-pagination-controls">
        <button
          type="button"
          className="admin-pagination-btn"
          onClick={prev}
          disabled={!hasPrev}
          aria-label="Previous page"
        >
          <i className="fas fa-chevron-left" aria-hidden="true" />
        </button>

        {pages.map((p, i) => (
          <span key={p}>
            {i > 0 && pages[i - 1] < p - 1 && (
              <span style={{ padding: '0 4px', color: 'var(--text-light)', fontSize: 13 }}>…</span>
            )}
            <button
              type="button"
              className={`admin-pagination-btn${p === page ? ' active' : ''}`}
              onClick={() => goTo(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          </span>
        ))}

        <button
          type="button"
          className="admin-pagination-btn"
          onClick={next}
          disabled={!hasNext}
          aria-label="Next page"
        >
          <i className="fas fa-chevron-right" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}