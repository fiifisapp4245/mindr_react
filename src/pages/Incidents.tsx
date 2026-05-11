import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, AlignJustify, LayoutGrid, SlidersHorizontal } from "lucide-react";
import { useIncidents } from "../hooks/use-incidents";
import { IncidentListCard } from "../components/incidents/IncidentListCard";
import type { Incident, IncidentStatus, Severity } from "../types/incident";

const STATUS_DOT: Record<IncidentStatus, string> = {
  active:     "var(--color-critical)",
  predicted:  "var(--color-warning)",
  mitigating: "var(--color-mitigating)",
};

const STATUS_LABEL: Record<IncidentStatus, string> = {
  active:     "ACTIVE",
  predicted:  "PREDICTED",
  mitigating: "MITIGATING",
};

const SEV_COLOR: Record<Severity, string> = {
  critical: "var(--color-critical)",
  high:     "var(--color-warning)",
  medium:   "var(--color-mitigating)",
  low:      "var(--color-resolved)",
};

function TableRow({ incident, onClick }: { incident: Incident; onClick: () => void }) {
  return (
    <tr
      onClick={onClick}
      className="cursor-pointer transition-colors hover:bg-white/[0.03]"
      style={{ borderBottom: "1px solid var(--color-border)" }}
    >
      <td className="px-5 py-3.5">
        <span className="text-[11px] font-semibold" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
          {incident.ref}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{incident.title}</p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{incident.region}</p>
      </td>
      <td className="px-5 py-3.5">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_DOT[incident.status] }} />
          <span style={{ color: STATUS_DOT[incident.status] }}>{STATUS_LABEL[incident.status]}</span>
        </span>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-[11px] font-semibold" style={{ color: SEV_COLOR[incident.severity] }}>
          {incident.severity.toUpperCase()}
        </span>
      </td>
      <td className="px-5 py-3.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>{incident.affectedUsers}</td>
      <td className="px-5 py-3.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>{incident.duration}</td>
      <td className="px-5 py-3.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>{incident.age}</td>
    </tr>
  );
}

type ViewMode = "cards" | "table";
type StatusFilter = "all" | "active" | "predicted" | "mitigating";

const FILTER_CFG: { id: StatusFilter; label: string; color: string }[] = [
  { id: "all",        label: "All",        color: "var(--color-text-muted)"   },
  { id: "active",     label: "Critical",   color: "var(--color-critical)"     },
  { id: "predicted",  label: "Predicted",  color: "var(--color-warning)"      },
  { id: "mitigating", label: "Mitigating", color: "var(--color-mitigating)"   },
];

export default function Incidents() {
  const navigate = useNavigate();
  const { incidents } = useIncidents();
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const counts = {
    active:     incidents.filter((i) => i.status === "active").length,
    predicted:  incidents.filter((i) => i.status === "predicted").length,
    mitigating: incidents.filter((i) => i.status === "mitigating").length,
  };

  const filtered = statusFilter === "all" ? incidents : incidents.filter((i) => i.status === statusFilter);

  function openIncident(id: string) {
    navigate(`/incidents/${id}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>Incidents</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Active network events, predictions and mitigations — {incidents.length} total
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center rounded-md overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
            <button
              onClick={() => setViewMode("cards")}
              className="p-2 transition-colors"
              style={{
                backgroundColor: viewMode === "cards" ? "var(--color-bg-elevated)" : "transparent",
                color: viewMode === "cards" ? "var(--color-text-primary)" : "var(--color-text-muted)",
              }}
              title="Card view"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className="p-2 transition-colors"
              style={{
                backgroundColor: viewMode === "table" ? "var(--color-bg-elevated)" : "transparent",
                color: viewMode === "table" ? "var(--color-text-primary)" : "var(--color-text-muted)",
                borderLeft: "1px solid var(--color-border)",
              }}
              title="Table view"
            >
              <AlignJustify size={14} />
            </button>
          </div>
          <button
            className="p-2 rounded-md transition-colors"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {FILTER_CFG.map(({ id, label, color }) => {
          const count = id === "all" ? incidents.length : counts[id as keyof typeof counts];
          const isActive = statusFilter === id;
          return (
            <button
              key={id}
              onClick={() => setStatusFilter(id)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                color: isActive ? (id === "all" ? "var(--color-text-primary)" : color) : "var(--color-text-muted)",
                backgroundColor: isActive ? (id === "all" ? "var(--color-bg-elevated)" : `${color}15`) : "transparent",
                border: isActive ? `1.5px solid ${id === "all" ? "var(--color-border)" : color}` : "1.5px solid var(--color-border)",
              }}
            >
              {id !== "all" && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />}
              {label}
              <span
                className="text-[10px] font-bold px-1.5 py-px rounded-full min-w-[20px] text-center"
                style={{
                  backgroundColor: isActive && id !== "all" ? `${color}25` : "rgba(255,255,255,0.06)",
                  color: isActive && id !== "all" ? color : "var(--color-text-muted)",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {viewMode === "cards" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((inc) => (
            <IncidentListCard key={inc.id} incident={inc} selected={false} onClick={() => openIncident(inc.id)} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 py-16 flex flex-col items-center gap-3">
              <AlertTriangle size={32} style={{ color: "var(--color-text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No incidents match this filter</p>
            </div>
          )}
        </div>
      )}

      {viewMode === "table" && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Ref", "Title / Region", "Status", "Severity", "Affected", "Duration", "Age"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: "var(--color-text-muted)", backgroundColor: "var(--color-bg-elevated)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc) => (
                <TableRow key={inc.id} incident={inc} onClick={() => openIncident(inc.id)} />
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3" style={{ borderTop: "1px solid var(--color-border)" }}>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
              Showing {filtered.length} of {incidents.length} incidents
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
