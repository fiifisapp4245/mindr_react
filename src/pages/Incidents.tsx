import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  AlignJustify,
  LayoutGrid,
  SlidersHorizontal,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { useAuth } from "../contexts/auth";
import { useIncidents } from "../hooks/use-incidents";
import { IncidentListCard } from "../components/incidents/IncidentListCard";
import type { Incident, IncidentStatus, Severity } from "../types/incident";

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
  const [viewMode, setViewMode]       = useState<ViewMode>("cards");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const counts = {
    active:     incidents.filter((i) => i.status === "active").length,
    predicted:  incidents.filter((i) => i.status === "predicted").length,
    mitigating: incidents.filter((i) => i.status === "mitigating").length,
  };

  const filtered =
    statusFilter === "all" ? incidents : incidents.filter((i) => i.status === statusFilter);

  function openIncident(id: string) {
    navigate(`/incidents/${id}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
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
                backgroundColor:
                  viewMode === "cards" ? "var(--color-bg-elevated)" : "transparent",
                color:
                  viewMode === "cards"
                    ? "var(--color-text-primary)"
                    : "var(--color-text-muted)",
              }}
              title="Card view"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className="p-2 transition-colors"
              style={{
                backgroundColor:
                  viewMode === "table" ? "var(--color-bg-elevated)" : "transparent",
                color:
                  viewMode === "table"
                    ? "var(--color-text-primary)"
                    : "var(--color-text-muted)",
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
                color: isActive
                  ? id === "all"
                    ? "var(--color-text-primary)"
                    : color
                  : "var(--color-text-muted)",
                backgroundColor: isActive
                  ? id === "all"
                    ? "var(--color-bg-elevated)"
                    : `${color}15`
                  : "transparent",
                border: isActive
                  ? `1.5px solid ${id === "all" ? "var(--color-border)" : color}`
                  : "1.5px solid var(--color-border)",
              }}
            >
              {id !== "all" && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
              )}
              {label}
              <span
                className="text-[10px] font-bold px-1.5 py-px rounded-full min-w-[20px] text-center"
                style={{
                  backgroundColor:
                    isActive && id !== "all" ? `${color}25` : "rgba(255,255,255,0.06)",
                  color:
                    isActive && id !== "all" ? color : "var(--color-text-muted)",
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
              onClick={() => openIncident(inc.id)}
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
          style={{
            backgroundColor: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Ref", "Title / Region", "Status", "Severity", "Affected", "Duration", "Age"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-[9px] font-bold uppercase tracking-widest"
                      style={{
                        color: "var(--color-text-muted)",
                        backgroundColor: "var(--color-bg-elevated)",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc) => (
                <TableRow
                  key={inc.id}
                  incident={inc}
                  onClick={() => openIncident(inc.id)}
                />
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3" style={{ borderTop: "1px solid var(--color-border)" }}>
            <p
              className="text-[10px] uppercase tracking-widest"
              style={{ color: "var(--color-text-muted)" }}
            >
              Showing {filtered.length} of {incidents.length} incidents
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FLM view ─────────────────────────────────────────────────────────────────

interface FLMIncident {
  id: string;
  ref: string;
  title: string;
  severity: "Critical" | "High";
  status: "Open" | "In Progress";
  slaRemaining: string;
  slaPercent: number;
  region: string;
  openedAt: string;
  alarmRef: string;
  scope: {
    peeringLink: string;
    bgpSession: string;
    asNumber: string;
    regionDetail: string;
    upstreamDevice: string;
    downstreamDevice: string;
  };
  timeline: { time: string; utilization: number }[];
  linkUtilization: number;
  evidence: string[];
  rootCause: {
    summary: string;
    category: string;
    confidence: number;
    recommendedAction: string;
    matchedPlaybook: string;
    steps: string[];
  };
}

const FLM_INCIDENTS: FLMIncident[] = [
  {
    id: "inc-2847",
    ref: "INC-2847",
    title: "Peering link EU-CORE-01 → AS5413",
    severity: "Critical",
    status: "Open",
    slaRemaining: "22m remaining",
    slaPercent: 82,
    region: "EU-CORE-01",
    openedAt: "14:32 UTC",
    alarmRef: "ALM-0038",
    scope: {
      peeringLink: "Peering link EU-CORE-01 → AS5413",
      bgpSession: "BGP-v4 / DE-CIX Frankfurt / Port ge-0/2/1",
      asNumber: "AS5413",
      regionDetail: "EU-CORE-01",
      upstreamDevice: "core-rtr-fra-01.dt.net",
      downstreamDevice: "peer-gw-fra-14.dt.net",
    },
    timeline: [
      { time: "00:00", utilization: 75 },
      { time: "01:00", utilization: 78 },
      { time: "02:00", utilization: 82 },
      { time: "03:00", utilization: 88 },
      { time: "04:00", utilization: 95 },
      { time: "05:00", utilization: 93 },
      { time: "06:00", utilization: 91 },
      { time: "07:00", utilization: 89 },
      { time: "08:00", utilization: 87 },
      { time: "09:00", utilization: 86 },
      { time: "10:00", utilization: 85 },
      { time: "11:00", utilization: 84 },
      { time: "12:00", utilization: 83 },
      { time: "13:00", utilization: 84 },
      { time: "14:00", utilization: 85 },
      { time: "15:00", utilization: 97 },
    ],
    linkUtilization: 97.3,
    evidence: [
      "BGP withdrawal event: AS3320 withdrew prefix 195.34.0.0/16 at 14:28 UTC",
      "Traffic increased 38Gbps on EU-CORE-01 ge-0/2/1 within 4m of withdrawal",
      "Change ticket CHG-9912: Planned maintenance AS3320 14:00–16:00 UTC",
      "No hardware errors on affected interface",
    ],
    rootCause: {
      summary:
        "Congestion from traffic shift after AS3320 route withdrawal. EU-CORE-01 absorbing redistributed flows from withdrawn prefix 195.34.0.0/16.",
      category: "Traffic Redistribution / Congestion",
      confidence: 91,
      recommendedAction:
        "Shift traffic off congested link using policy-based routing. Re-advertise withdrawn prefix via backup path.",
      matchedPlaybook: "Congested Peering Link Reroute",
      steps: [
        "Confirm utilization threshold breached: show interfaces <if-name> detail",
        "Identify top talkers contributing to congestion using flow telemetry",
        "Check available capacity on parallel or backup peering paths",
        "Apply policy-based routing to shift heaviest prefix groups to alternate path",
        "Verify traffic rebalanced: utilization target <80% on primary link",
        "Monitor for 5 minutes to confirm stability after shift",
        "Update traffic engineering policy if reroute is to be permanent",
        "Document traffic engineering change in change management system",
      ],
    },
  },
  {
    id: "inc-2853",
    ref: "INC-2853",
    title: "AS3320 peer at DE-CIX Frankfurt",
    severity: "Critical",
    status: "Open",
    slaRemaining: "19m remaining",
    slaPercent: 75,
    region: "EU-CORE-01",
    openedAt: "14:28 UTC",
    alarmRef: "ALM-0035",
    scope: {
      peeringLink: "Peering link EU-CORE-01 → AS3320",
      bgpSession: "BGP-v4 / DE-CIX Frankfurt / Port ge-0/1/4",
      asNumber: "AS3320",
      regionDetail: "EU-CORE-01",
      upstreamDevice: "core-rtr-fra-01.dt.net",
      downstreamDevice: "peer-gw-fra-01.dt.net",
    },
    timeline: [
      { time: "00:00", utilization: 60 },
      { time: "01:00", utilization: 62 },
      { time: "02:00", utilization: 65 },
      { time: "03:00", utilization: 70 },
      { time: "04:00", utilization: 78 },
      { time: "05:00", utilization: 80 },
      { time: "06:00", utilization: 78 },
      { time: "07:00", utilization: 75 },
      { time: "08:00", utilization: 72 },
      { time: "09:00", utilization: 71 },
      { time: "10:00", utilization: 70 },
      { time: "11:00", utilization: 69 },
      { time: "12:00", utilization: 71 },
      { time: "13:00", utilization: 73 },
      { time: "14:00", utilization: 76 },
      { time: "15:00", utilization: 85 },
    ],
    linkUtilization: 85.0,
    evidence: [
      "BGP session flap detected on AS3320 peering at 14:22 UTC",
      "Route table instability: 412 prefixes withdrawn and re-announced",
      "Change ticket CHG-9912: Planned maintenance AS3320 14:00–16:00 UTC",
      "No hardware errors on core-rtr-fra-01.dt.net",
    ],
    rootCause: {
      summary:
        "BGP session instability on AS3320 peer during planned maintenance window. Route oscillations causing traffic load imbalance across remaining peers.",
      category: "BGP Session Instability",
      confidence: 87,
      recommendedAction:
        "Apply BGP graceful-restart and route dampening to stabilize route table. Monitor session flap rate.",
      matchedPlaybook: "BGP Session Recovery",
      steps: [
        "Verify BGP session state: show bgp neighbor <peer-ip>",
        "Check error counters and hold-timer expiry logs",
        "Apply route dampening policy to affected peer",
        "Enable BGP graceful-restart if not already configured",
        "Monitor prefix count stability for 5 minutes",
        "Coordinate with AS3320 NOC on maintenance window timeline",
        "Document session event in change management system",
      ],
    },
  },
];

function FLMSLABar({ percent }: { percent: number }) {
  const color =
    percent >= 80
      ? "var(--color-warning)"
      : percent >= 60
      ? "#f97316"
      : "var(--color-critical)";
  return (
    <div
      className="h-1.5 rounded-full overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
    >
      <div
        className="h-full rounded-full"
        style={{ width: `${percent}%`, backgroundColor: color }}
      />
    </div>
  );
}

function FLMIncidentCard({
  inc,
  selected,
  onSelect,
}: {
  inc: FLMIncident;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left px-3 py-3 transition-colors hover:bg-white/[0.03]"
      style={{
        borderBottom: "1px solid var(--color-border)",
        borderLeft: selected ? "2px solid var(--color-brand)" : "2px solid transparent",
        backgroundColor: selected ? "rgba(233,30,140,0.06)" : "transparent",
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-bold"
            style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
          >
            {inc.ref}
          </span>
          <span
            className="text-[9px] font-semibold px-1.5 py-px rounded"
            style={{ backgroundColor: "rgba(255,59,59,0.15)", color: "var(--color-critical)" }}
          >
            {inc.severity}
          </span>
        </div>
      </div>
      <p
        className="text-xs font-semibold mb-2 leading-snug pr-1"
        style={{ color: "var(--color-text-primary)" }}
      >
        {inc.title}
      </p>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          SLA: {inc.slaRemaining}
        </span>
        <span
          className="text-[10px] font-semibold"
          style={{
            color:
              inc.slaPercent >= 80 ? "var(--color-warning)" : "var(--color-critical)",
          }}
        >
          {inc.slaPercent}%
        </span>
      </div>
      <FLMSLABar percent={inc.slaPercent} />
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          {inc.region}
        </span>
        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          {inc.status}
        </span>
      </div>
    </button>
  );
}

function FLMChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg text-xs"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      }}
    >
      <p style={{ color: "var(--color-text-muted)" }}>{label}</p>
      <p className="font-semibold mt-0.5" style={{ color: "var(--color-critical)" }}>
        {payload[0].value}%
      </p>
    </div>
  );
}

function FLMView() {
  const [selectedId, setSelectedId]   = useState(FLM_INCIDENTS[0].id);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab]     = useState<"evidence" | "activity">("evidence");

  useEffect(() => {
    setCheckedSteps(new Set());
    setActiveTab("evidence");
  }, [selectedId]);

  const inc = FLM_INCIDENTS.find((i) => i.id === selectedId) ?? FLM_INCIDENTS[0];

  function toggleStep(i: number) {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div
      className="flex overflow-hidden"
      style={{ margin: "-1rem -1.5rem", height: "calc(100vh - 56px)" }}
    >
      {/* Left: incident list */}
      <div
        className="w-56 shrink-0 flex flex-col"
        style={{
          borderRight: "1px solid var(--color-border)",
          backgroundColor: "var(--color-bg-card)",
        }}
      >
        <div
          className="px-4 py-3 shrink-0"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Incidents
          </h2>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {FLM_INCIDENTS.length} open · owned by M. Weber
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {FLM_INCIDENTS.map((i) => (
            <FLMIncidentCard
              key={i.id}
              inc={i}
              selected={selectedId === i.id}
              onSelect={() => setSelectedId(i.id)}
            />
          ))}
        </div>
      </div>

      {/* Center: incident detail */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: "var(--color-bg-base)" }}
      >
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-bold px-2 py-1 rounded"
                style={{
                  backgroundColor: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {inc.ref}
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-1 rounded"
                style={{ backgroundColor: "rgba(255,59,59,0.15)", color: "var(--color-critical)" }}
              >
                {inc.severity}
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-1 rounded"
                style={{
                  backgroundColor: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)",
                }}
              >
                {inc.status}
              </span>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Opened {inc.openedAt}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
              >
                Ref: {inc.alarmRef}
              </p>
            </div>
          </div>

          <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
            {inc.title}
          </h1>

          {/* SLA bar */}
          <div className="flex items-center gap-3">
            <span className="text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>
              SLA: {inc.slaRemaining}
            </span>
            <div
              className="flex-1 h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${inc.slaPercent}%`,
                  backgroundColor:
                    inc.slaPercent >= 80 ? "var(--color-warning)" : "var(--color-critical)",
                }}
              />
            </div>
            <span
              className="text-xs font-semibold shrink-0"
              style={{
                color:
                  inc.slaPercent >= 80 ? "var(--color-warning)" : "var(--color-critical)",
              }}
            >
              {inc.slaPercent}%
            </span>
          </div>

          {/* Affected scope */}
          <div
            className="rounded-lg p-4"
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: "var(--color-text-muted)" }}
            >
              Affected scope
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                { label: "Peering Link",      value: inc.scope.peeringLink      },
                { label: "Region",            value: inc.scope.regionDetail     },
                { label: "BGP Session",       value: inc.scope.bgpSession       },
                { label: "AS Number",         value: inc.scope.asNumber         },
                { label: "Upstream Device",   value: inc.scope.upstreamDevice   },
                { label: "Downstream Device", value: inc.scope.downstreamDevice },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                    {label}
                  </p>
                  <p
                    className="text-xs font-medium mt-0.5 break-all"
                    style={{
                      color: "var(--color-text-primary)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Metric timeline */}
          <div
            className="rounded-lg p-4"
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Metric timeline
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold" style={{ color: "var(--color-critical)" }}>
                    {inc.linkUtilization}%
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    Link Utilization
                  </span>
                </div>
                <div
                  className="flex items-center gap-3 text-[10px]"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block w-6 h-0.5 rounded"
                      style={{ backgroundColor: "var(--color-critical)" }}
                    />
                    Current
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block w-6 h-0.5 border-t border-dashed"
                      style={{ borderColor: "rgba(255,255,255,0.3)" }}
                    />
                    Target
                  </span>
                </div>
              </div>
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={inc.timeline}
                  margin={{ top: 4, right: 8, left: -12, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                    tickLine={false}
                    axisLine={false}
                    interval={2}
                  />
                  <YAxis
                    domain={[60, 100]}
                    tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<FLMChartTooltip />} />
                  <ReferenceLine
                    y={87}
                    stroke="rgba(255,255,255,0.25)"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                  <Line
                    type="monotone"
                    dataKey="utilization"
                    stroke="var(--color-critical)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "var(--color-critical)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Evidence / Activity tabs */}
          <div
            className="rounded-lg overflow-hidden"
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex" style={{ borderBottom: "1px solid var(--color-border)" }}>
              {(["evidence", "activity"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-4 py-3 text-xs font-semibold capitalize transition-colors"
                  style={{
                    color:
                      activeTab === tab
                        ? "var(--color-text-primary)"
                        : "var(--color-text-muted)",
                    borderBottom:
                      activeTab === tab
                        ? "2px solid var(--color-brand)"
                        : "2px solid transparent",
                  }}
                >
                  {tab === "evidence" ? "🔗 Evidence" : "↻ Activity"}
                </button>
              ))}
            </div>
            <div className="p-4 space-y-2.5">
              {activeTab === "evidence" ? (
                inc.evidence.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span
                      className="shrink-0 text-xs mt-px"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      →
                    </span>
                    <p
                      className="text-xs leading-snug"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {item}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs py-2" style={{ color: "var(--color-text-muted)" }}>
                  No activity entries recorded yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right: root cause */}
      <div
        className="w-72 shrink-0 flex flex-col"
        style={{
          borderLeft: "1px solid var(--color-border)",
          backgroundColor: "var(--color-bg-card)",
        }}
      >
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Root cause */}
          <div>
            <p className="text-sm font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>
              Root Cause
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
              {inc.rootCause.summary}
            </p>
            <span
              className="inline-block mt-2.5 text-[10px] font-semibold px-2 py-1 rounded"
              style={{ backgroundColor: "rgba(255,176,32,0.12)", color: "var(--color-warning)" }}
            >
              {inc.rootCause.category}
            </span>
          </div>

          {/* Confidence */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-[10px] font-medium uppercase tracking-widest"
                style={{ color: "var(--color-text-muted)" }}
              >
                Confidence
              </span>
              <span className="text-xs font-bold" style={{ color: "var(--color-resolved)" }}>
                {inc.rootCause.confidence}%
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${inc.rootCause.confidence}%`,
                  backgroundColor: "var(--color-resolved)",
                }}
              />
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: "var(--color-border)" }} />

          {/* Recommended action */}
          <div>
            <p
              className="text-[10px] font-medium uppercase tracking-widest mb-1.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              Recommended action
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
              {inc.rootCause.recommendedAction}
            </p>
            <button
              className="mt-2 text-xs font-medium text-left transition-opacity hover:opacity-80"
              style={{ color: "var(--color-brand)" }}
            >
              Matched playbook: {inc.rootCause.matchedPlaybook}
            </button>
          </div>

          <div style={{ height: 1, backgroundColor: "var(--color-border)" }} />

          {/* Playbook checklist */}
          <div>
            <p
              className="text-xs font-semibold mb-3"
              style={{ color: "var(--color-text-primary)" }}
            >
              Playbook — {inc.rootCause.matchedPlaybook}
            </p>
            <div className="space-y-2.5">
              {inc.rootCause.steps.map((step, i) => (
                <label key={i} className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkedSteps.has(i)}
                    onChange={() => toggleStep(i)}
                    className="mt-px shrink-0"
                    style={{ accentColor: "var(--color-brand)" }}
                  />
                  <span
                    className="text-[11px] leading-snug"
                    style={{
                      color: checkedSteps.has(i)
                        ? "var(--color-text-muted)"
                        : "var(--color-text-primary)",
                      textDecoration: checkedSteps.has(i) ? "line-through" : "none",
                    }}
                  >
                    {step}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Action decision point */}
        <div
          className="p-4 shrink-0 space-y-2"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--color-text-muted)" }}
          >
            Action human decision point
          </p>
          <button
            className="w-full py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
          >
            Resolve
          </button>
          <button
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors hover:bg-white/5"
            style={{
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          >
            Escalate to L2
          </button>
          <button
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors hover:bg-white/5"
            style={{
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Route entry point — picks view by role ───────────────────────────────────
export default function Incidents() {
  const { role } = useAuth();
  return role === "flm" ? <FLMView /> : <AdminView />;
}
