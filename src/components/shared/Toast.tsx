import { createPortal } from "react-dom";
import { CheckCircle2, X } from "lucide-react";

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  return createPortal(
    <div
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
      style={{
        position: "fixed",
        bottom: 80,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9998,
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
        color: "var(--color-text-primary)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
      role="status"
    >
      <CheckCircle2 size={13} style={{ color: "#2DD4BF" }} />
      {message}
      <button
        onClick={onDismiss}
        style={{ color: "var(--color-text-muted)", marginLeft: 4 }}
        aria-label="Dismiss notification"
      >
        <X size={11} />
      </button>
    </div>,
    document.body
  );
}

// Auto-dismiss timeout shared by every Toast usage, so pages don't each pick
// their own duration.
export const TOAST_DURATION_MS = 3500;
