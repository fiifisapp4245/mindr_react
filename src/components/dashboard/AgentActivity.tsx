import { agentLoads } from "../../data/dashboard";
import { AgentRow } from "./AgentRow";

const THRESHOLDS = [
  { label: "Healthy ≤70%",  color: "var(--color-resolved)"  },
  { label: "High 71–90%",   color: "var(--color-warning)"   },
  { label: "Critical >90%", color: "var(--color-critical)"  },
];

export function AgentActivity() {
  return (
    <div
      className="rounded-lg p-5 flex flex-col"
      style={{
        flex: "35 1 0%",
        backgroundColor: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        minHeight: 280,
      }}
    >
      <div className="mb-4">
        <p
          className="text-xs font-medium uppercase tracking-widest"
          style={{ color: "var(--color-text-muted)" }}
        >
          Agent Load
        </p>
        <p
          className="text-xs mt-0.5"
          style={{ color: "var(--color-text-muted)", opacity: 0.6 }}
        >
          % of capacity across active agents
        </p>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {agentLoads.map((a) => (
          <AgentRow key={a.name} name={a.name} load={a.load} />
        ))}
      </div>

      <div
        className="flex items-center gap-3 mt-4 pt-3 flex-wrap"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        {THRESHOLDS.map(({ label, color }) => (
          <span
            key={label}
            className="flex items-center gap-1 text-[9px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
