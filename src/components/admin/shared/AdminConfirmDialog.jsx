import React, { useEffect, useRef } from 'react';
import AdminPortal from './AdminPortal';
import AdminButton from './AdminButton';
import { useEscapeKey, useFocusTrap } from '../../../pages/admin/adminHooks';

/**
 * AdminConfirmDialog — replaces `window.confirm()` with a branded,
 * accessible, focus-trapped dialog. Supports a danger tone for
 * destructive actions and an optional async confirm handler.
 *
 * Usage:
 *   <AdminConfirmDialog
 *     open={showDelete}
 *     title="Delete subscriber?"
 *     description="This permanently removes alex@example.com."
 *     confirmLabel="Delete"
 *     tone="danger"
 *     loading={deleting}
 *     onConfirm={handleDelete}
 *     onCancel={() => setShowDelete(false)}
 *   />
 */
const AdminConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  loading = false,
  icon,
  onConfirm,
  onCancel,
}) => {
  const surfaceRef = useRef(null);
  useEscapeKey(() => !loading && onCancel?.(), open);
  useFocusTrap(surfaceRef, open);

  /* Lock body scroll while open. */
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const variant = tone === 'danger' ? 'danger' : 'primary';
  const inferredIcon =
    icon || (tone === 'danger' ? 'fa-triangle-exclamation' : 'fa-circle-question');

  return (
    <AdminPortal>
      <div
        className="admin-confirm-overlay"
        role="presentation"
        onClick={() => !loading && onCancel?.()}
      >
        <div
          ref={surfaceRef}
          className={`admin-confirm-surface admin-confirm-surface-${tone}`}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="admin-confirm-title"
          aria-describedby={description ? 'admin-confirm-desc' : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="admin-confirm-icon" aria-hidden="true">
            <i className={`fas ${inferredIcon}`} />
          </div>
          <h2 id="admin-confirm-title" className="admin-confirm-title">
            {title}
          </h2>
          {description && (
            <p id="admin-confirm-desc" className="admin-confirm-desc">
              {description}
            </p>
          )}
          <div className="admin-confirm-actions">
            <AdminButton
              variant="ghost"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelLabel}
            </AdminButton>
            <AdminButton
              variant={variant}
              loading={loading}
              onClick={onConfirm}
            >
              {confirmLabel}
            </AdminButton>
          </div>
        </div>
      </div>
    </AdminPortal>
  );
};

export default AdminConfirmDialog;
