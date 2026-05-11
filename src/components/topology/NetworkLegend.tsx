const LEGEND_ITEMS: {
  label: string;
  color: string;
  shape: "circle" | "square" | "dot" | "line" | "dashed";
}[] = [
  { label: "Core Network Infrastructure", color: "var(--color-brand)",      shape: "circle"  },
  { label: "Data Center / Cloud Node",    color: "var(--color-mitigating)", shape: "square"  },
  { label: "Status: Healthy",             color: "var(--color-resolved)",   shape: "dot"     },
  { label: "Status: Warning / Latency",   color: "var(--color-warning)",    shape: "dot"     },
  { label: "Status: Critical / Offline",  color: "var(--color-critical)",   shape: "dot"     },
  { label: "Link: Healthy",               color: "rgba(255,255,255,0.22)",  shape: "line"    },
  { label: "Link: Down / Broken",         color: "var(--color-critical)",   shape: "dashed"  },
];

export function NetworkLegend() {
  return (
    <div
      className="rounded-lg p-4 space-y-3"
      style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
    >
      <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
        Network Legend
      </p>

      <div className="space-y-2">
        {LEGEND_ITEMS.map(({ label, color, shape }) => (
          <div key={label} className="flex items-center gap-2.5">
            {shape === "circle" && (
              <span className="shrink-0 rounded-full" style={{ width: 12, height: 12, border: `1.5px solid ${color}` }} />
            )}
            {shape === "square" && (
              <span className="shrink-0 rounded-sm" style={{ width: 12, height: 12, border: `1.5px solid ${color}` }} />
            )}
            {shape === "dot" && (
              <span className="shrink-0 rounded-full" style={{ width: 8, height: 8, backgroundColor: color }} />
            )}
            {shape === "line" && (
              <span className="shrink-0" style={{ width: 20, height: 1.5, backgroundColor: color, display: "inline-block" }} />
            )}
            {shape === "dashed" && (
              <span
                className="shrink-0"
                style={{
                  width: 20,
                  height: 1.5,
                  display: "inline-block",
                  background: `repeating-linear-gradient(90deg, ${color} 0, ${color} 4px, transparent 4px, transparent 8px)`,
                }}
              />
            )}
            <span className="text-[10px] leading-snug" style={{ color: "var(--color-text-muted)" }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
