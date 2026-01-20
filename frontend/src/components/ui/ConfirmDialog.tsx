import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import "./confirmDialog.css";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText,
  cancelText,
  confirmDanger,
  loading,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmDanger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    // Small “real app” things:
    // - ESC closes the dialog
    // - clicking the overlay closes it
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    // We portal to <body> so it always sits on top (even if you open it from inside another modal).
    <div className="confirm-overlay" role="presentation" onMouseDown={onCancel}>
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="confirm-header">
          <div className="confirm-title">{title}</div>
          <button className="confirm-close" type="button" onClick={onCancel} aria-label="Close">
            ×
          </button>
        </div>

        <div className="confirm-body">
          {description ? <div className="confirm-description">{description}</div> : null}
          {children}
        </div>

        <div className="confirm-footer">
          <button className="confirm-button secondary" type="button" onClick={onCancel} disabled={!!loading}>
            {cancelText ?? "Cancel"}
          </button>
          <button
            className={`confirm-button ${confirmDanger ? "danger" : "primary"}`}
            type="button"
            onClick={onConfirm}
            disabled={!!loading}
          >
            {/* One button for confirm. When loading, we lock everything so no double-clicks. */}
            {loading ? "Processing..." : confirmText ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}


