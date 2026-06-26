import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  AlertTriangle,
  AlignJustify,
  LayoutGrid,
  SlidersHorizontal,
  CheckSquare,
  Square,
  GitCompare,
} from "lucide-react";
import { useAuth } from "../contexts/auth";
import { useIncidents } from "../hooks/use-incidents";
import { useFLMIncidents } from "../contexts/flm-incidents";
import { IncidentListCard } from "../components/incidents/IncidentListCard";
import type { Incident, IncidentStatus, Severity } from "../types/incident";
import type { FLMIncident, FLMStatus } from "../data/flm-incident-store";

// ─── Admin view ───────────────────────────────────────────────────────────────

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
        <span
          className="text-[11px] font-semibold"
          style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
        >
          {incident.ref}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {incident.title}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {incident.region}
        </p>
      </td>
      <td className="px-5 py-3.5">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: STATUS_DOT[incident.status] }}
          />
          <span style={{ color: STATUS_DOT[incident.status] }}>
            {STATUS_LABEL[incident.status]}
          </span>
        </span>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-[11px] font-semibold" style={{ color: SEV_COLOR[incident.severity] }}>
          {incident.severity.toUpperCase()}
        </span>
      </td>
      <td className="px-5 py-3.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
        {incident.affectedUsers}
      </td>
      <td className="px-5 py-3.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
        {incident.duration}
      </td>
      <td className="px-5 py-3.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
        {incident.age}
      </td>
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

function AdminView() {
  const navigate = useNavigate();
  const { incidents } = useIncidents();
  const [viewMode, setViewMode]         = useState<ViewMode>("cards");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const counts = {
    active:     incidents.filter((i) => i.status === "active").length,
    predicted:  incidents.filter((i) => i.status === "predicted").length,
    mitigating: incidents.filter((i) => i.status === "mitigating").length,
  };

  const filtered =
    statusFilter === "all" ? incidents : incidents.filter((i) => i.status === statusFilter);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Incidents
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Active network events, predictions and mitigations — {incidents.length} total
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div
            className="flex items-center rounded-md overflow-hidden"
            style={{ border: "1px solid var(--color-border)" }}
          >
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
              {id !== "all" && (
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              )}
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
            <IncidentListCard
              key={inc.id}
              incident={inc}
              selected={false}
              onClick={() => navigate(`/incidents/${inc.id}`)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 py-16 flex flex-col items-center gap-3">
              <AlertTriangle size={32} style={{ color: "var(--color-text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                No incidents match this filter
              </p>
            </div>
          )}
        </div>
      )}

      {viewMode === "table" && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
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
                <TableRow key={inc.id} incident={inc} onClick={() => navigate(`/incidents/${inc.id}`)} />
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

// ─── FLM view — full-width list with multi-select + tabs ──────────────────────

const STATUS_CFG: Record<FLMStatus, { color: string; bg: string }> = {
  Open:       { color: "var(--color-critical)",   bg: "rgba(255,59,59,0.12)"   },
  "In Progress": { color: "var(--color-warning)", bg: "rgba(255,176,32,0.12)" },
  Resolved:   { color: "var(--color-resolved)",   bg: "rgba(45,212,191,0.12)"  },
  Escalated:  { color: "var(--color-mitigating)", bg: "rgba(77,158,255,0.12)"  },
  Closed:     { color: "var(--color-text-muted)", bg: "rgba(255,255,255,0.06)" },
};

const SEV_CFG: Record<string, { color: string; bg: string }> = {
  Critical: { color: "var(--color-critical)", bg: "rgba(255,59,59,0.12)" },
  High:     { color: "var(--color-warning)",  bg: "rgba(255,176,32,0.12)" },
};

function SLABar({ percent }: { percent: number }) {
  const color =
    percent >= 80 ? "var(--color-warning)"
    : percent >= 50 ? "#f97316"
    : "var(--color-critical)";
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-semibold shrink-0" style={{ color }}>
        {percent > 0 ? `${percent}%` : "—"}
      </span>
    </div>
  );
}

type FLMTab = "open" | "resolved";

function FLMView() {
  const navigate = useNavigate();
  const { incidents } = useFLMIncidents();
  const [tab, setTab] = useState<FLMTab>("open");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectHint, setSelectHint] = useState(false);

  const openIncidents = incidents.filter(
    (i) => i.status === "Open" || i.status === "In Progress" || i.status === "Escalated"
  );
  const resolvedIncidents = incidents.filter(
    (i) => i.status === "Resolved" || i.status === "Closed"
  );
  const displayed = tab === "open" ? openIncidents : resolvedIncidents;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      if (prev.has(id)) {
        const next = new Set(prev);
        next.delete(id);
        return next;
      }
      if (prev.size >= 3) {
        setSelectHint(true);
        setTimeout(() => setSelectHint(false), 2000);
        return prev;
      }
      return new Set([...prev, id]);
    });
  }

  function handleCompare() {
    const ids = [...selectedIds].join(",");
    navigate(`/incidents/compare?ids=${ids}`);
  }

  const canCompare = selectedIds.size >= 2 && selectedIds.size <= 3;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Incidents
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          IP Peering incident log — open and resolved cases tracked by severity and SLA
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1" style={{ borderBottom: "1px solid var(--color-border)" }}>
        {(["open", "resolved"] as FLMTab[]).map((t) => {
          const count = t === "open" ? openIncidents.length : resolvedIncidents.length;
          const isActive = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2.5 text-xs font-semibold capitalize transition-colors flex items-center gap-1.5"
              style={{
                color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
                borderBottom: isActive ? "2px solid var(--color-brand)" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {t === "open" ? "Open / Active" : "Resolved"}
              <span
                className="text-[10px] font-bold px-1.5 py-px rounded-full"
                style={{
                  backgroundColor: isActive ? "rgba(226,0,116,0.15)" : "rgba(255,255,255,0.06)",
                  color: isActive ? "var(--color-brand)" : "var(--color-text-muted)",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
      >
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--color-bg-elevated)", borderBottom: "1px solid var(--color-border)" }}>
              {tab === "open" && (
                <th className="w-10 px-4 py-3">
                  <span className="sr-only">Select</span>
                </th>
              )}
              {["Incident", "Region", "SLA", "Status", "Affected Peer / Link"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((inc, i) => {
              const isSelected = selectedIds.has(inc.id);
              const isLast = i === displayed.length - 1;
              const statusCfg = STATUS_CFG[inc.status];
              const sevCfg = SEV_CFG[inc.severity] ?? SEV_CFG["High"];
              return (
                <tr
                  key={inc.id}
                  className="transition-colors hover:bg-white/[0.025]"
                  style={{
                    borderBottom: isLast ? "none" : "1px solid var(--color-border)",
                    backgroundColor: isSelected ? "rgba(226,0,116,0.04)" : "transparent",
                  }}
                >
                  {tab === "open" && (
                    <td
                      className="w-10 px-4 py-3.5"
                      onClick={(e) => { e.stopPropagation(); toggleSelect(inc.id); }}
                    >
                      <button
                        aria-label={isSelected ? `Deselect ${inc.ref}` : `Select ${inc.ref}`}
                        className="flex items-center justify-center transition-colors"
                        style={{ color: isSelected ? "var(--color-brand)" : "var(--color-text-muted)" }}
                      >
                        {isSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                      </button>
                    </td>
                  )}
                  <td
                    className="px-4 py-3.5 cursor-pointer"
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[11px] font-bold"
                        style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
                      >
                        {inc.ref}
                      </span>
                      <span
                        className="text-[9px] font-semibold px-1.5 py-px rounded"
                        style={{ color: sevCfg.color, backgroundColor: sevCfg.bg }}
                      >
                        {inc.severity.toUpperCase()}
                      </span>
                    </div>
                    <p
                      className="text-xs font-medium mt-0.5 leading-snug"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {inc.title}
                    </p>
                  </td>
                  <td
                    className="px-4 py-3.5 cursor-pointer"
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                  >
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {inc.region}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3.5 cursor-pointer"
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                  >
                    {inc.status === "Resolved" || inc.status === "Closed" ? (
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>—</span>
                    ) : (
                      <div>
                        <span className="text-xs block mb-1" style={{ color: "var(--color-text-muted)" }}>
                          {inc.slaRemaining} remaining
                        </span>
                        <SLABar percent={inc.slaPercent} />
                      </div>
                    )}
                  </td>
                  <td
                    className="px-4 py-3.5 cursor-pointer"
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                  >
                    <span
                      className="text-[10px] font-semibold px-1.5 py-px rounded"
                      style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
                    >
                      {inc.status.toUpperCase()}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3.5 cursor-pointer"
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                  >
                    <span className="text-xs" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                      {inc.affectedPeer}
                    </span>
                  </td>
                </tr>
              );
            })}
            {displayed.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    {tab === "open" ? "No open incidents" : "No resolved incidents"}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--color-border)" }}>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
            Showing {displayed.length} incidents
          </p>
          {selectHint && (
            <p className="text-[10px] font-medium" style={{ color: "var(--color-warning)" }}>
              Compare up to 3 incidents at a time
            </p>
          )}
        </div>
      </div>

      {/* Sticky action bar */}
      {selectedIds.size > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3 rounded-xl"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {selectedIds.size} selected
          </span>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs font-medium transition-opacity hover:opacity-80"
            style={{ color: "var(--color-text-muted)" }}
          >
            Clear
          </button>
          <button
            onClick={canCompare ? handleCompare : undefined}
            disabled={!canCompare}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
            style={{
              backgroundColor: canCompare ? "var(--color-brand)" : "rgba(255,255,255,0.08)",
              color: canCompare ? "#fff" : "var(--color-text-muted)",
              cursor: canCompare ? "pointer" : "not-allowed",
              opacity: canCompare ? 1 : 0.6,
            }}
          >
            <GitCompare size={14} />
            Compare ({selectedIds.size})
          </button>
          {selectedIds.size === 1 && (
            <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
              Select 1 more to compare
            </span>
          )}
        </div>
      )}

      {/* Spacer so FAB doesn't overlap last row when bar is visible */}
      {selectedIds.size > 0 && <div style={{ height: 64 }} />}
    </div>
  );
}

// ─── Route entry — picks view by role ────────────────────────────────────────

export default function Incidents() {
  const { role } = useAuth();
  return role === "flm" ? <FLMView /> : <AdminView />;
}
