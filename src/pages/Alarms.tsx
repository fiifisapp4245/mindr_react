import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Filter,
  GitMerge,
  GitCompareArrows,
  Layers,
  List,
  PlusCircle,
  Radio,
  RefreshCw,
  Search,
  TrendingUp,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import { useAlarms } from "../contexts/alarms";
import {
  SEV,
  STATUS,
  metricColor,
  CORR_GROUPS,
  REGIONS,
  type AlarmRow,
  type AlarmSeverity,
  type AlarmType,
} from "../data/alarm-store";

// ── Local constants ────────────────────────────────────────────────────────────

type ViewMode = "list" | "grouped";

const TYPE_ICON: Record<AlarmType, React.ElementType> = {
  bgp: Radio,
  utilization: TrendingUp,
  latency: Zap,
  prediction: Bell,
  flap: RefreshCw,
  sla: AlertTriangle,
};

const GRID = "32px minmax(180px,2fr) 80px 88px minmax(140px,1.8fr) 80px minmax(100px,1fr) 120px";

// ── Sub-components ─────────────────────────────────────────────────────────────

function SevBadge({ severity }: { severity: AlarmSeverity }) {
  const s = SEV[severity];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function GroupCard({
  group,
  defaultExpanded = false,
}: {
  group: typeof CORR_GROUPS[0];
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const sev = SEV[group.highestSeverity];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderLeft: `3px solid ${sev.color}`,
      }}
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className="w-5 h-5 rounded flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        >
          {expanded
            ? <ChevronDown size={11} style={{ color: "var(--color-text-muted)" }} />
            : <ChevronRight size={11} style={{ color: "var(--color-text-muted)" }} />
          }
        </div>

        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {group.summary}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Correlation agent · {group.confidence}% confidence
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)" }}
          >
            {group.memberCount} alarms
          </span>
          <SevBadge severity={group.highestSeverity} />
          <span className="text-[10px] font-mono hidden sm:block" style={{ color: "var(--color-text-muted)" }}>
            {group.region}
          </span>
          {group.linkedIncident ? (
            <Link
              to={`/incidents/${group.linkedIncidentId}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[11px] font-semibold hover:opacity-80 transition-opacity"
              style={{ color: "var(--color-brand)" }}
            >
              {group.linkedIncident}
              <ExternalLink size={9} />
            </Link>
          ) : (
            <button
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] font-semibold px-2 py-0.5 rounded hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: "rgba(255,176,32,0.1)",
                color: "#FFB020",
                border: "1px solid rgba(255,176,32,0.2)",
              }}
            >
              Create incident
            </button>
          )}
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: "1px solid var(--color-border)" }}>
          {group.members.map((m, i) => {
            const msev = SEV[m.severity];
            return (
              <div
                key={m.ref}
                className="flex items-center gap-4 pl-12 pr-4 py-2.5"
                style={{
                  borderBottom: i < group.members.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
              >
                <span className="font-mono text-[10px] shrink-0" style={{ color: "var(--color-text-muted)", minWidth: 72 }}>
                  {m.ref}
                </span>
                <span className="text-xs font-medium flex-1 truncate" style={{ color: "var(--color-text-primary)" }}>
                  {m.name}
                </span>
                <span
                  className="text-[11px] tabular-nums font-semibold shrink-0"
                  style={{ color: msev.color, minWidth: 64, textAlign: "right" }}
                >
                  {m.metric}
                </span>
                <span className="text-[10px] truncate shrink-0" style={{ color: "var(--color-text-muted)", minWidth: 160, maxWidth: 200 }}>
                  {m.iface}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Alarms() {
  const navigate = useNavigate();
  const { alarms, acknowledge, snooze } = useAlarms();

  const [activeTab, setActiveTab] = useState<"all" | AlarmSeverity>("all");
  const [view, setView]           = useState<ViewMode>("list");
  const [region, setRegion]       = useState("All regions");
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [selectHint, setSelectHint] = useState("");

  const filtered = alarms.filter((a) => {
    if (activeTab !== "all" && a.severity !== activeTab) return false;
    if (region !== "All regions" && a.region !== region) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.ref.toLowerCase().includes(q) ||
        a.affected.toLowerCase().includes(q) ||
        a.ixp.toLowerCase().includes(q) ||
        a.region.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    all:       alarms.length,
    critical:  alarms.filter((a) => a.severity === "critical").length,
    high:      alarms.filter((a) => a.severity === "high").length,
    predicted: alarms.filter((a) => a.severity === "predicted").length,
  };

  function toggleSelect(id: string) {
    setSelectHint("");
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      if (next.size >= 3) {
        setSelectHint("Max 3 alarms for comparison");
        return;
      }
      next.add(id);
    }
    setSelected(next);
  }

  function handleCompare() {
    navigate(`/alarms/compare?ids=${[...selected].join(",")}`);
  }

  function handleRowClick(alarm: AlarmRow) {
    navigate(`/alarms/${alarm.id}`);
  }

  return (
    <>
      <style>{`
        @keyframes alarm-pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
        .alarm-live-dot { animation: alarm-pulse 1.6s ease-in-out infinite; }
        .alarm-row-actions { opacity: 0; transition: opacity 0.15s; }
        .alarm-row:hover .alarm-row-actions { opacity: 1; }
      `}</style>

      <div
        className="flex flex-col h-full overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-base)", color: "var(--color-text-primary)" }}
      >
        {/* Page header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
        >
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
              Alarms
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              Live feed — IP peering, ranked by severity + SLA risk
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)" }}
          >
            <span className="alarm-live-dot w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#2DD4BF" }} />
            <span className="text-[11px] font-semibold" style={{ color: "#2DD4BF" }}>Live · streaming</span>
            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Updated just now</span>
          </div>
        </div>

        {/* KPI strip */}
        <div
          className="grid grid-cols-3 gap-3 px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          {([
            { key: "critical"  as const, label: "Critical",  sub: "requires immediate action", bg: "rgba(255,59,59,0.06)",  border: "rgba(255,59,59,0.2)",  color: "#FF3B3B" },
            { key: "high"      as const, label: "High",      sub: "monitor closely",            bg: "rgba(255,176,32,0.06)", border: "rgba(255,176,32,0.2)", color: "#FFB020" },
            { key: "predicted" as const, label: "Predicted", sub: "AI-forecast breaches",      bg: "rgba(77,158,255,0.06)", border: "rgba(77,158,255,0.2)", color: "#4D9EFF" },
          ] as const).map((card) => (
            <button
              key={card.key}
              onClick={() => setActiveTab(activeTab === card.key ? "all" : card.key)}
              className="flex items-center gap-4 px-4 py-3 rounded-xl text-left hover:opacity-90 transition-opacity w-full"
              style={{
                backgroundColor: activeTab === card.key ? card.bg : "var(--color-bg-card)",
                border: `1px solid ${activeTab === card.key ? card.border : "var(--color-border)"}`,
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: card.bg, border: `1px solid ${card.border}` }}
              >
                <AlertTriangle size={16} style={{ color: card.color }} strokeWidth={2} />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>
                    {counts[card.key]}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: card.color }}>{card.label}</span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{card.sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Controls row */}
        <div
          className="flex items-center px-6 py-0 shrink-0 gap-3"
          style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
        >
          {/* Tabs */}
          <div className="flex items-center gap-0 flex-1">
            {(["all", "critical", "high", "predicted"] as const).map((tab) => {
              const isActive = activeTab === tab;
              const label = tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1);
              const count = counts[tab];
              const dotColor = tab !== "all" ? SEV[tab].color : undefined;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex items-center gap-1.5 px-4 py-3 text-xs font-semibold transition-colors relative whitespace-nowrap"
                  style={{
                    color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
                    borderBottom: isActive ? "2px solid var(--color-brand)" : "2px solid transparent",
                    marginBottom: -1,
                  }}
                >
                  {dotColor && (
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                  )}
                  {label}
                  <span
                    className="text-[10px] font-bold px-1.5 py-px rounded-full tabular-nums"
                    style={{
                      backgroundColor: isActive ? "rgba(226,0,116,0.12)" : "rgba(255,255,255,0.06)",
                      color: isActive ? "var(--color-brand)" : "var(--color-text-muted)",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View toggle */}
          <div
            className="flex items-center rounded-lg p-0.5 shrink-0"
            style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
          >
            {([
              { key: "list"    as const, Icon: List,   label: "List"    },
              { key: "grouped" as const, Icon: Layers, label: "Grouped" },
            ] as const).map(({ key, Icon, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors"
                style={{
                  backgroundColor: view === key ? "rgba(255,255,255,0.1)" : "transparent",
                  color: view === key ? "var(--color-text-primary)" : "var(--color-text-muted)",
                }}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 py-2 shrink-0">
            <div className="relative">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-text-muted)" }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search alarms…"
                className="pl-7 pr-3 py-1.5 rounded-lg text-xs"
                style={{
                  backgroundColor: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                  width: 164,
                  outline: "none",
                }}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }}>
                  <X size={10} />
                </button>
              )}
            </div>
            <div className="relative">
              <Filter size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-text-muted)" }} />
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="appearance-none pl-7 pr-6 py-1.5 rounded-lg text-xs cursor-pointer"
                style={{
                  backgroundColor: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                }}
              >
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown size={9} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-text-muted)" }} />
            </div>
          </div>
        </div>

        {/* ── Content area ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto relative">

          {/* ── LIST VIEW ─────────────────────────────────────────────── */}
          {view === "list" && (
            <div style={{ backgroundColor: "var(--color-bg-card)" }}>
              {/* Sticky table header */}
              <div
                className="grid items-center px-6 py-2.5 text-[10px] font-semibold uppercase tracking-widest sticky top-0 z-10"
                style={{
                  gridTemplateColumns: GRID,
                  borderBottom: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)",
                  backgroundColor: "var(--color-bg-card)",
                }}
              >
                <span />
                <span>Alarm</span>
                <span>ID</span>
                <span>Severity</span>
                <span>Affected</span>
                <span>Region</span>
                <span>Metric</span>
                <span>Raised / ETA</span>
              </div>

              {/* Empty state */}
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)" }}
                  >
                    <CheckCircle2 size={22} style={{ color: "#2DD4BF" }} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>All clear</p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>No alarms match the current filters</p>
                </div>
              )}

              {/* Rows */}
              {filtered.map((alarm, i) => {
                const sev = SEV[alarm.severity];
                const stat = STATUS[alarm.status];
                const TypeIcon = TYPE_ICON[alarm.type];
                const isSelected = selected.has(alarm.id);
                const isPredicted = alarm.severity === "predicted";

                return (
                  <div
                    key={alarm.id}
                    className="alarm-row grid items-center px-6 py-3.5 hover:bg-white/[0.025] transition-colors cursor-pointer relative"
                    style={{
                      gridTemplateColumns: GRID,
                      borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border)" : "none",
                      backgroundColor: isSelected ? "rgba(226,0,116,0.04)" : "transparent",
                      borderLeft: isPredicted ? "3px solid rgba(77,158,255,0.4)" : "3px solid transparent",
                    }}
                    onClick={() => handleRowClick(alarm)}
                  >
                    {/* Checkbox */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(alarm.id)}
                        className="w-3.5 h-3.5 accent-pink-500"
                      />
                    </div>

                    {/* Alarm name + type icon */}
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <TypeIcon size={12} style={{ color: sev.color }} strokeWidth={2} className="shrink-0" />
                        <p className="text-[13px] font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                          {alarm.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 ml-5">
                        <p className="text-[10px] truncate" style={{ color: "var(--color-text-muted)" }}>
                          {alarm.ixp}
                        </p>
                        <span
                          className="inline-flex items-center px-1.5 py-px rounded text-[9px] font-semibold shrink-0"
                          style={{ backgroundColor: stat.bg, color: stat.color }}
                        >
                          {stat.label}
                        </span>
                      </div>
                    </div>

                    {/* ALM ID */}
                    <span className="font-mono text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                      {alarm.ref}
                    </span>

                    {/* Severity */}
                    <SevBadge severity={alarm.severity} />

                    {/* Affected */}
                    <p className="text-[12px] truncate pr-2" style={{ color: "var(--color-text-muted)" }}>
                      {alarm.affected}
                    </p>

                    {/* Region */}
                    <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                      {alarm.region}
                    </p>

                    {/* Metric */}
                    <div>
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{ color: metricColor(alarm.metricValue, alarm.metricMax) }}
                      >
                        {alarm.metricValue}{alarm.metricUnit}
                      </span>
                      <div className="h-1 rounded-full overflow-hidden mt-1.5" style={{ backgroundColor: "rgba(255,255,255,0.06)", maxWidth: 80 }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min((alarm.metricValue / alarm.metricMax) * 100, 100)}%`,
                            backgroundColor: metricColor(alarm.metricValue, alarm.metricMax),
                          }}
                        />
                      </div>
                    </div>

                    {/* Raised / ETA */}
                    <div>
                      {isPredicted ? (
                        <>
                          <div className="flex items-center gap-1">
                            <Clock size={10} style={{ color: "#4D9EFF" }} />
                            <span className="text-[11px] font-semibold tabular-nums" style={{ color: "#4D9EFF" }}>
                              {alarm.raised}
                            </span>
                          </div>
                          {alarm.sourceLink && (
                            <Link
                              to={alarm.sourceLink.href}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-0.5 text-[10px] mt-0.5 hover:opacity-80 transition-opacity"
                              style={{ color: "rgba(77,158,255,0.75)" }}
                            >
                              {alarm.sourceLink.label}
                              <ExternalLink size={8} />
                            </Link>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                          {alarm.raised}
                        </span>
                      )}
                    </div>

                    {/* Inline hover actions (absolutely positioned) */}
                    <div
                      className="alarm-row-actions absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {alarm.status !== "acknowledged" && (
                        <button
                          onClick={() => acknowledge(alarm.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold"
                          style={{
                            backgroundColor: "rgba(45,212,191,0.12)",
                            color: "#2DD4BF",
                            border: "1px solid rgba(45,212,191,0.25)",
                          }}
                          title="Acknowledge"
                        >
                          <CheckCheck size={10} />
                          Ack
                        </button>
                      )}
                      {alarm.status !== "snoozed" && (
                        <button
                          onClick={() => snooze(alarm.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.07)",
                            color: "var(--color-text-muted)",
                            border: "1px solid var(--color-border)",
                          }}
                          title="Snooze 30m"
                        >
                          <BellOff size={10} />
                          30m
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Footer */}
              <div
                className="flex items-center justify-between px-6 py-3"
                style={{ borderTop: "1px solid var(--color-border)" }}
              >
                <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                  Showing {filtered.length} of {alarms.length} alarms · virtualized scroll enabled
                </p>
                <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  Data refreshes in real time — no manual reload required
                </p>
              </div>
            </div>
          )}

          {/* ── GROUPED VIEW ──────────────────────────────────────────── */}
          {view === "grouped" && (
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>
                  Correlated groups — {CORR_GROUPS.length} clusters identified
                </p>
                <div className="space-y-3">
                  {CORR_GROUPS.map((g, i) => (
                    <GroupCard key={g.id} group={g} defaultExpanded={i === 0} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-3 mt-2" style={{ color: "var(--color-text-muted)" }}>
                  Uncorrelated alarms — {alarms.length} individual signals
                </p>
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
                >
                  {alarms.map((alarm, i) => {
                    const sev = SEV[alarm.severity];
                    const TypeIcon = TYPE_ICON[alarm.type];
                    const isPredicted = alarm.severity === "predicted";

                    return (
                      <div
                        key={alarm.id}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.025] transition-colors cursor-pointer"
                        style={{
                          borderBottom: i < alarms.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                          borderLeft: `3px solid ${isPredicted ? "rgba(77,158,255,0.35)" : sev.color + "35"}`,
                        }}
                        onClick={() => handleRowClick(alarm)}
                      >
                        <TypeIcon size={13} style={{ color: sev.color }} strokeWidth={2} className="shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                            {alarm.name}
                          </p>
                          <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>
                            {alarm.affected} · {alarm.ixp}
                          </p>
                        </div>
                        <span className="font-mono text-[10px] shrink-0" style={{ color: "var(--color-text-muted)" }}>
                          {alarm.ref}
                        </span>
                        <SevBadge severity={alarm.severity} />
                        <span
                          className="text-[11px] font-bold tabular-nums shrink-0"
                          style={{ color: metricColor(alarm.metricValue, alarm.metricMax) }}
                        >
                          {alarm.metricValue}{alarm.metricUnit}
                        </span>
                        <span
                          className="text-[11px] shrink-0"
                          style={{ color: isPredicted ? "#4D9EFF" : "var(--color-text-muted)" }}
                        >
                          {alarm.raised}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Floating compare bar ───────────────────────────────────────────── */}
        {selected.size > 0 && (
          <div
            className="shrink-0 flex items-center gap-4 px-6 py-3"
            style={{
              borderTop: "1px solid rgba(226,0,116,0.2)",
              backgroundColor: "rgba(226,0,116,0.06)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(226,0,116,0.15)", color: "var(--color-brand)" }}
              >
                {selected.size}
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
                alarm{selected.size > 1 ? "s" : ""} selected
              </span>
              {selectHint && (
                <span className="text-[10px]" style={{ color: "#FFB020" }}>{selectHint}</span>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => {
                  const ids = [...selected];
                  alarms.filter(a => ids.includes(a.id)).forEach(a => acknowledge(a.id));
                  setSelected(new Set());
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold hover:opacity-80 transition-opacity"
                style={{ backgroundColor: "rgba(45,212,191,0.1)", color: "#2DD4BF", border: "1px solid rgba(45,212,191,0.2)" }}
              >
                <CheckCheck size={11} />
                Acknowledge all
              </button>
              <button
                onClick={handleCompare}
                disabled={selected.size < 2}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-semibold hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: selected.size >= 2 ? "var(--color-brand)" : "rgba(255,255,255,0.08)",
                  color: selected.size >= 2 ? "#fff" : "var(--color-text-muted)",
                  cursor: selected.size < 2 ? "not-allowed" : "pointer",
                }}
              >
                <GitCompareArrows size={12} />
                Compare {selected.size >= 2 ? `(${selected.size})` : ""}
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="p-1 hover:opacity-60 transition-opacity"
                style={{ color: "var(--color-text-muted)" }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
