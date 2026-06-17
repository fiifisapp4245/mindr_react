import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ConfirmModalProps {
  title: string;
  body: string;
  confirmLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onClose: () => void;
  /** Optional extra content between body and footer (e.g. reason textarea) */
  children?: React.ReactNode;
}

export function ConfirmModal({
  title,
  body,
  confirmLabel = "Confirm",
  confirmColor = "var(--color-brand)",
  onConfirm,
  onClose,
  children,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Esc to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Auto-focus confirm button
  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.72)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{
          backgroundColor: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3
            id="confirm-modal-title"
            className="text-base font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="hover:opacity-80 transition-opacity p-1 rounded-md hover:bg-white/5"
            style={{ color: "var(--color-text-muted)" }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--color-text-muted)" }}>
          {body}
        </p>

        {/* Optional extra content (e.g. textarea for escalation reason) */}
        {children && <div className="mb-4">{children}</div>}

        {/* Footer */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-white/5"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: confirmColor,
              color: "#fff",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
