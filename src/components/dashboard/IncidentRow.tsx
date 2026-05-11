import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, MessageSquare, UserPlus } from "lucide-react";
import { expand, transSmooth } from "../../lib/animations";
import type { DashboardIncident, IncidentSeverity } from "../../types/dashboard";

const SEVERITY_CFG: Record<IncidentSeverity, { color: string; bg: string; dot: string }> = {
  CRITICAL:   { color: "var(--color-critical)",   bg: "rgba(255,59,59,0.12)",   dot: "#FF3B3B" },
  PREDICTED:  { color: "var(--color-warning)",    bg: "rgba(255,176,32,0.12)",  dot: "#FFB020" },
  MITIGATING: { color: "var(--color-mitigating)", bg: "rgba(77,158,255,0.12)",  dot: "#4D9EFF" },
};

export function IncidentRow({
  incident,
  isLast,
}: {
  incident: DashboardIncident;
  isLast: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const sev = SEVERITY_CFG[incident.severity];

  return (
    <div
      className="rounded-lg px-3 py-3.5 transition-colors"
      style={{
        backgroundColor: hovered ? "var(--color-bg-elevated)" : "transparent",
        borderBottom: isLast ? "none" : "1px solid var(--color-border)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-1.5 w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: sev.dot }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              {incident.title}
            </span>
            <span
              className="text-[10px] font-semibold px-1.5 py-px rounded shrink-0"
              style={{ color: sev.color, backgroundColor: sev.bg }}
            >
              {incident.severity}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {incident.description}
          </p>

          <AnimatePresence initial={false}>
            {hovered && (
              <motion.div
                key="tray"
                variants={expand}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                style={{ overflow: "hidden" }}
              >
                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                  <button
                    className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: "rgba(45,212,191,0.1)",
                      color: "var(--color-resolved)",
                      border: "1px solid rgba(45,212,191,0.2)",
                    }}
                  >
                    <CheckCircle2 size={10} />
                    Acknowledge
                  </button>
                  <button
                    className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: "rgba(77,158,255,0.1)",
                      color: "var(--color-mitigating)",
                      border: "1px solid rgba(77,158,255,0.2)",
                    }}
                  >
                    <UserPlus size={10} />
                    Assign Agent
                  </button>
                  <Link
                    to={`/assistant?incident=${incident.id}`}
                    className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: "rgba(233,30,140,0.1)",
                      color: "var(--color-brand)",
                      border: "1px solid rgba(233,30,140,0.2)",
                    }}
                  >
                    <MessageSquare size={10} />
                    Open in Assistant
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence initial={false}>
          {!hovered && (
            <motion.div
              key="meta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: transSmooth }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
              className="flex flex-col items-end shrink-0 gap-0.5 pr-10"
            >
              <span
                className="text-[10px] font-medium"
                style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
              >
                {incident.id}
              </span>
              <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                {incident.age}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
