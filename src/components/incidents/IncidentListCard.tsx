import { motion } from "framer-motion";
import type { Incident, IncidentStatus, Severity } from "../../types/incident";

const STATUS_CFG: Record<IncidentStatus, { label: string; color: string; bg: string }> = {
  active:     { label: "ACTIVE",     color: "var(--color-critical)",   bg: "rgba(255,59,59,0.12)"  },
  predicted:  { label: "PREDICTED",  color: "var(--color-warning)",    bg: "rgba(255,176,32,0.12)" },
  mitigating: { label: "MITIGATING", color: "var(--color-mitigating)", bg: "rgba(77,158,255,0.12)" },
};

const SEVERITY_CFG: Record<Severity, { label: string; color: string }> = {
  critical: { label: "CRITICAL",  color: "var(--color-critical)"   },
  high:     { label: "HIGH RISK", color: "var(--color-warning)"    },
  medium:   { label: "MEDIUM",    color: "var(--color-mitigating)" },
  low:      { label: "LOW",       color: "var(--color-resolved)"   },
};

export function IncidentListCard({
  incident,
  selected,
  onClick,
}: {
  incident: Incident;
  selected: boolean;
  onClick: () => void;
}) {
  const st  = STATUS_CFG[incident.status];
  const sev = SEVERITY_CFG[incident.severity];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{
        scale: 1.015,
        borderColor: selected ? "var(--color-brand)" : "rgba(233,30,140,0.35)",
        backgroundColor: selected ? "rgba(233,30,140,0.07)" : "rgba(233,30,140,0.03)",
        boxShadow: "0 4px 20px rgba(233,30,140,0.12)",
      }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className="w-full text-left rounded-xl p-4 cursor-pointer"
      style={{
        backgroundColor: selected ? "rgba(233,30,140,0.05)" : "var(--color-bg-card)",
        border: selected ? "1.5px solid var(--color-brand)" : "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {/* Pulsing status dot */}
          <span
            className={incident.status === "active" ? "animate-pulse-dot" : ""}
            style={{
              display: "inline-block",
              width: 6, height: 6,
              borderRadius: "50%",
              backgroundColor: st.color,
              flexShrink: 0,
            }}
          />
          <span
            className="text-[10px] font-medium"
            style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
          >
            {incident.ref}
          </span>
        </div>
        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          {incident.age}
        </span>
      </div>

      <p className="text-sm font-semibold mb-2.5 leading-snug" style={{ color: "var(--color-text-primary)" }}>
        {incident.title}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] font-semibold px-1.5 py-px rounded"
            style={{ color: st.color, backgroundColor: st.bg }}
          >
            {st.label}
          </span>
          <span
            className="text-[10px] font-semibold px-1.5 py-px rounded"
            style={{ color: sev.color, backgroundColor: "transparent", border: `1px solid ${sev.color}` }}
          >
            {sev.label}
          </span>
        </div>
        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          {incident.region.split(" ")[0]}
        </span>
      </div>
    </motion.button>
  );
}
