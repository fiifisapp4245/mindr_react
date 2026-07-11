import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface DetailModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
}

/** Read-only detail overlay — for viewing more info about a row/entity, not a confirm/cancel action. */
export function DetailModal({ title, onClose, children, maxWidth = 512 }: DetailModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.72)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-h-[80vh] rounded-2xl p-6 overflow-y-auto"
        style={{ maxWidth, backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h3>
          <button onClick={onClose} className="hover:opacity-80 transition-opacity p-1 rounded-md hover:bg-white/5" style={{ color: "var(--color-text-muted)" }} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-2">{children}</div>
      </div>
    </div>,
    document.body
  );
}
