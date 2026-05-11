import { useParams, Link } from "react-router-dom";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { INCIDENTS } from "../data/incidents";
import { IncidentDetail as IncidentDetailComponent } from "../components/incidents/IncidentDetail";

const STATUS_COLOR = {
  active:     "var(--color-critical)",
  predicted:  "var(--color-warning)",
  mitigating: "var(--color-mitigating)",
} as const;

export default function IncidentDetail() {
  const { id } = useParams() as { id: string };
  const incident = INCIDENTS.find((i) => i.id === id);

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertTriangle size={40} style={{ color: "var(--color-text-muted)" }} />
        <p className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Incident not found
        </p>
        <Link
          to="/incidents"
          className="text-sm font-medium transition-opacity hover:opacity-80"
          style={{ color: "var(--color-brand)" }}
        >
          ← Back to Incidents
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
        <Link
          to="/incidents"
          className="font-medium transition-colors hover:opacity-80 flex items-center gap-1"
          style={{ color: "var(--color-text-muted)" }}
        >
          Incidents
        </Link>
        <ChevronRight size={12} style={{ opacity: 0.5 }} />
        <span
          className="text-[10px] font-semibold px-1.5 py-px rounded uppercase tracking-wide"
          style={{
            color: STATUS_COLOR[incident.status],
            backgroundColor: `${STATUS_COLOR[incident.status]}20`,
          }}
        >
          {incident.ref}
        </span>
        <ChevronRight size={12} style={{ opacity: 0.5 }} />
        <span className="font-medium truncate max-w-xs" style={{ color: "var(--color-text-primary)" }}>
          {incident.title}
        </span>
      </nav>

      <IncidentDetailComponent incident={incident} />
    </div>
  );
}
