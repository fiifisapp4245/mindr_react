import { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

interface Props {
  label: string;
  options: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  disabled?: boolean;
}

export function FlowMultiSelect({ label, options, selected, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function toggle(option: string) {
    const next = new Set(selected);
    if (next.has(option)) next.delete(option);
    else next.add(option);
    onChange(next);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-40"
        style={{
          backgroundColor: selected.size > 0 ? "rgba(233,24,124,0.10)" : "var(--color-bg-elevated)",
          border: `1px solid ${selected.size > 0 ? "var(--color-brand)" : "var(--color-border)"}`,
          color: selected.size > 0 ? "var(--color-brand)" : "var(--color-text-primary)",
        }}
      >
        <span className="truncate">{label}{selected.size > 0 ? ` (${selected.size})` : ""}</span>
        <ChevronDown size={11} className="shrink-0" />
      </button>

      {open && (
        <div
          className="absolute z-20 mt-1 rounded-lg overflow-hidden"
          style={{ minWidth: 200, maxHeight: 260, backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", boxShadow: "0 12px 32px rgba(0,0,0,0.5)" }}
        >
          <div className="flex items-center justify-between px-2.5 py-1.5" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>{label}</span>
            {selected.size > 0 && (
              <button onClick={() => onChange(new Set())} className="flex items-center gap-0.5 text-[10px] font-semibold hover:opacity-80" style={{ color: "var(--color-text-muted)" }}>
                <X size={9} /> Clear
              </button>
            )}
          </div>
          <div className="overflow-y-auto py-1" style={{ maxHeight: 210 }}>
            {options.map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] cursor-pointer hover:bg-white/5"
                style={{ color: "var(--color-text-primary)" }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(option)}
                  onChange={() => toggle(option)}
                  className="shrink-0"
                />
                <span className="truncate">{option}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
