import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Eye,
  RefreshCw,
  Shield,
  Zap,
} from "lucide-react";
import {
  AGENT_ROSTER,
  ACTIVITY_FEED,
  FLEET_METRICS,
  LIFECYCLE_STAGES,
  type AgentStatus,
  type FeedState,
  type LifecycleStage,
} from "../data/agent-activity-data";
import { Badge } from "@/components/ui/badge";

// ── Feature flag — set true when stakeholders approve the lifecycle lens ───────
const SHOW_LIFECYCLE_LENS = false;

// ── Design tokens ──────────────────────────────────────────────────────────────

const FEED_STATE_CFG: Record<FeedState, { label: string; color: string; bg: string; border?: string }> = {
  Resolved:   { label: "RESOLVED",   color: "#2DD4BF", bg: "rgba(45,212,191,0.12)"  },
  Diagnosing: { label: "DIAGNOSING", color: "#4D9EFF", bg: "rgba(77,158,255,0.12)"  },
  Escalated:  { label: "ESCALATED",  color: "#FFB020", bg: "rgba(255,176,32,0.12)"  },
  Monitoring: { label: "MONITORING", color: "rgba(255,255,255,0.45)", bg: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" },
};

const STATUS_CFG: Record<AgentStatus, { label: string; color: string; bg: string }> = {
  active:     { label: "Active",     color: "#2DD4BF", bg: "rgba(45,212,191,0.12)"  },
  idle:       { label: "Idle",       color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.05)" },
  escalating: { label: "Escalating", color: "#FFB020", bg: "rgba(255,176,32,0.12)"  },
};

const DOMAIN_COLOR: Record<string, string> = {
  "IP Peering": "var(--color-brand)",
  "CXI":     "#FFB020",
  "Volte":   "#2DD4BF",
};

const STAGE_CFG: Record<LifecycleStage, { icon: React.ElementType; color: string }> = {
  Sense:      { icon: Eye,           color: "#4D9EFF" },
  Understand: { icon: Cpu,           color: "#A78BFA" },
  Decide:     { icon: Bot,           color: "#FFB020" },
  Act:        { icon: Zap,           color: "#2DD4BF" },
  Learn:      { icon: RefreshCw,     color: "var(--color-brand)" },
};

// ── Load bar ──────────────────────────────────────────────────────────────────

function loadColor(load: number, status: AgentStatus): string {
  if (status === "idle") return "rgba(255,255,255,0.18)";
  if (load >= 81) return "#FF3B3B";
  if (load >= 61) return "#FFB020";
  return "#2DD4BF";
}

function LoadBar({ load, status }: { load: number; status: AgentStatus }) {
  const color = loadColor(load, status);
  if (status === "idle") {
    return (
      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>Idle</span>
    );
  }
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${load}%`, backgroundColor: color, transition: "width 0.3s ease" }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold shrink-0" style={{ color }}>{load}%</span>
    </div>
  );
}

// ── Sortable table header cell ─────────────────────────────────────────────────

function SortTh({
  col, label, sortBy, sortDir, onSort,
}: {
  col: "status" | "load";
  label: string;
  sortBy: "status" | "load";
  sortDir: "asc" | "desc";
  onSort: (col: "status" | "load") => void;
}) {
  const active = sortBy === col;
  return (
    <th
      className="text-left px-3 py-2.5 whitespace-nowrap cursor-pointer select-none"
      style={{
        color: active ? "var(--color-text-primary)" : "var(--color-text-muted)",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
      onClick={() => onSort(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        <span style={{ opacity: active ? 1 : 0.35 }}>
          {active && sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </span>
      </span>
    </th>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, icon: Icon, iconColor, iconBg, border,
}: {
  label: string; value: React.ReactNode; sub?: string;
  icon: React.ElementType; iconColor: string; iconBg: string; border?: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="rounded-xl px-4 py-4 flex items-start gap-3"
      style={{
        backgroundColor: "var(--color-bg-card)",
        border: border ?? "1px solid var(--color-border)",
        transform: hov ? "translateY(-2px) scale(1.012)" : "translateY(0) scale(1)",
        boxShadow: hov ? "0 8px 24px rgba(0,0,0,0.35)" : "none",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        cursor: "default",
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={16} style={{ color: iconColor }} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
          {label}
        </p>
        <div className="text-2xl font-bold tabular-nums mt-0.5" style={{ color: "var(--color-text-primary)" }}>
          {value}
        </div>
        {sub && <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type DomainFilter = "all" | "IP Peering" | "CXI" | "Volte";
type StateFilter  = "all" | "active" | "idle" | "escalating" | "resolved" | "diagnosing" | "monitoring";

const DOMAIN_OPTS: { label: string; value: DomainFilter }[] = [
  { label: "All domains", value: "all"      },
  { label: "IP Peering",  value: "IP Peering"  },
  { label: "CXI",         value: "CXI"      },
  { label: "Volte",       value: "Volte"    },
];

const STATE_OPTS: { label: string; value: StateFilter }[] = [
  { label: "All states",  value: "all"        },
  { label: "Active",      value: "active"     },
  { label: "Idle",        value: "idle"       },
  { label: "Escalating",  value: "escalating" },
  { label: "Resolved",    value: "resolved"   },
  { label: "Diagnosing",  value: "diagnosing" },
  { label: "Monitoring",  value: "monitoring" },
];

const STATUS_ORDER: Record<AgentStatus, number> = { escalating: 0, active: 1, idle: 2 };

export default function Agents() {
  const navigate = useNavigate();

  const [domainFilter, setDomainFilter] = useState<DomainFilter>("all");
  const [agentFilter,  setAgentFilter]  = useState<string>("all");
  const [stateFilter,  setStateFilter]  = useState<StateFilter>("all");
  const [stageFilter,  setStageFilter]  = useState<"all" | LifecycleStage>("all");
  const [sortBy,       setSortBy]       = useState<"status" | "load">("status");
  const [sortDir,      setSortDir]      = useState<"asc" | "desc">("asc");

  function handleSort(col: "status" | "load") {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("asc"); }
  }

  function setEscalationsOnly() {
    setStateFilter((prev) => prev === "escalating" ? "all" : "escalating");
  }

  // ── Filtered roster ────────────────────────────────────────────────────────

  const filteredRoster = useMemo(() => {
    let items = AGENT_ROSTER;

    if (domainFilter !== "all")
      items = items.filter((a) => a.domains.includes(domainFilter));

    if (agentFilter !== "all")
      items = items.filter((a) => a.name === agentFilter);

    if (stateFilter === "active")     items = items.filter((a) => a.status === "active");
    if (stateFilter === "idle")       items = items.filter((a) => a.status === "idle");
    if (stateFilter === "escalating") items = items.filter((a) => a.status === "escalating");

    if (stageFilter !== "all")
      items = items.filter((a) => a.lifecycleStage === stageFilter);

    return [...items].sort((a, b) => {
      if (sortBy === "load") return sortDir === "asc" ? a.load - b.load : b.load - a.load;
      const diff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      return sortDir === "asc" ? diff : -diff;
    });
  }, [domainFilter, agentFilter, stateFilter, stageFilter, sortBy, sortDir]);

  // ── Filtered feed ──────────────────────────────────────────────────────────

  const filteredFeed = useMemo(() => {
    let items = ACTIVITY_FEED;

    if (domainFilter !== "all")
      items = items.filter((e) => e.domainLabel === domainFilter);

    if (agentFilter !== "all")
      items = items.filter((e) => e.agentName === agentFilter);

    if (stateFilter === "escalating") items = items.filter((e) => e.state === "Escalated");
    if (stateFilter === "resolved")   items = items.filter((e) => e.state === "Resolved");
    if (stateFilter === "diagnosing") items = items.filter((e) => e.state === "Diagnosing");
    if (stateFilter === "monitoring") items = items.filter((e) => e.state === "Monitoring");

    if (stageFilter !== "all")
      items = items.filter((e) => e.lifecycleStage === stageFilter);

    return items;
  }, [domainFilter, agentFilter, stateFilter, stageFilter]);

  // ── Lifecycle stage counts (from domain+agent+status filtered roster only) ──

  const stageCounts = useMemo(() => {
    const base = AGENT_ROSTER.filter((a) => {
      if (domainFilter !== "all" && !a.domains.includes(domainFilter)) return false;
      if (agentFilter  !== "all" && a.name !== agentFilter)             return false;
      if (stateFilter === "active"     && a.status !== "active")        return false;
      if (stateFilter === "idle"       && a.status !== "idle")          return false;
      if (stateFilter === "escalating" && a.status !== "escalating")    return false;
      return true;
    });
    const counts = { Sense: 0, Understand: 0, Decide: 0, Act: 0, Learn: 0 } as Record<LifecycleStage, number>;
    base.forEach((a) => counts[a.lifecycleStage]++);
    return counts;
  }, [domainFilter, agentFilter, stateFilter]);

  // ── Select style ───────────────────────────────────────────────────────────

  const selectStyle: React.CSSProperties = {
    backgroundColor: "var(--color-bg-elevated)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text-primary)",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 12,
    outline: "none",
    cursor: "pointer",
  };

  return (
    <div className="flex flex-col gap-6 pb-10">

      {/* ── 1. HEADER & FILTERS ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
              Agent activity
            </h1>
            <p className="text-sm mt-0.5 flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
              All domains · live
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#2DD4BF", animation: "pulse-live 1.6s ease-in-out infinite" }}
              />
            </p>
          </div>
          <div className="text-[11px] flex items-center gap-1.5 mt-1" style={{ color: "var(--color-text-muted)" }}>
            <RefreshCw size={11} />
            Updated just now
          </div>
        </div>

        {/* Filter bar */}
        <div
          className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          {/* Domain pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest mr-1" style={{ color: "var(--color-text-muted)" }}>Domain</span>
            {DOMAIN_OPTS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => { setDomainFilter(value); setAgentFilter("all"); }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                style={{
                  backgroundColor: domainFilter === value ? "rgba(255,255,255,0.1)" : "transparent",
                  color: domainFilter === value
                    ? (value === "all" ? "var(--color-text-primary)" : (DOMAIN_COLOR[value] ?? "var(--color-text-primary)"))
                    : "var(--color-text-muted)",
                  border: domainFilter === value ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent",
                }}
              >
                {label === "All domains" ? "All" : label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px shrink-0" style={{ backgroundColor: "var(--color-border)" }} />

          {/* State select */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>State</span>
            <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value as StateFilter)} style={selectStyle}>
              {STATE_OPTS.map(({ label, value }) => (
                <option key={value} value={value} style={{ backgroundColor: "var(--color-bg-elevated)" }}>{label}</option>
              ))}
            </select>
          </div>

          {/* Agent select */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Agent</span>
            <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} style={selectStyle}>
              <option value="all" style={{ backgroundColor: "var(--color-bg-elevated)" }}>All agents</option>
              {AGENT_ROSTER
                .filter((a) => domainFilter === "all" || a.domains.includes(domainFilter))
                .map((a) => (
                  <option key={a.id} value={a.name} style={{ backgroundColor: "var(--color-bg-elevated)" }}>
                    {a.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="h-4 w-px shrink-0" style={{ backgroundColor: "var(--color-border)" }} />

          {/* Stage pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest mr-1" style={{ color: "var(--color-text-muted)" }}>Stage</span>
            <button
              onClick={() => setStageFilter("all")}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
              style={{
                backgroundColor: stageFilter === "all" ? "rgba(255,255,255,0.1)" : "transparent",
                color: stageFilter === "all" ? "var(--color-text-primary)" : "var(--color-text-muted)",
                border: stageFilter === "all" ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent",
              }}
            >
              All
            </button>
            {LIFECYCLE_STAGES.map((stage) => {
              const cfg = STAGE_CFG[stage];
              const active = stageFilter === stage;
              return (
                <button
                  key={stage}
                  onClick={() => setStageFilter(active ? "all" : stage)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                  style={{
                    backgroundColor: active ? `${cfg.color}18` : "transparent",
                    color: active ? cfg.color : "var(--color-text-muted)",
                    border: active ? `1px solid ${cfg.color}35` : "1px solid transparent",
                  }}
                >
                  {stage}
                </button>
              );
            })}
          </div>

          {/* Reset */}
          {(domainFilter !== "all" || agentFilter !== "all" || stateFilter !== "all" || stageFilter !== "all") && (
            <>
              <div className="flex-1" />
              <button
                onClick={() => { setDomainFilter("all"); setAgentFilter("all"); setStateFilter("all"); setStageFilter("all"); }}
                className="text-[11px] font-semibold underline underline-offset-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                Reset all
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── 2. FLEET METRICS ─────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>
          Fleet overview · all domains
        </p>
        <div className="grid grid-cols-6 gap-3">
          <MetricCard
            label="Total agents"
            value={FLEET_METRICS.totalAgents}
            icon={Bot}
            iconColor="var(--color-brand)"
            iconBg="rgba(233,24,124,0.08)"
          />
          <MetricCard
            label="Active now"
            value={FLEET_METRICS.activeNow}
            sub={`of ${FLEET_METRICS.totalAgents} agents`}
            icon={Activity}
            iconColor="#2DD4BF"
            iconBg="rgba(45,212,191,0.08)"
            border="1px solid rgba(45,212,191,0.2)"
          />
          <MetricCard
            label="Idle"
            value={FLEET_METRICS.idle}
            icon={Clock}
            iconColor="rgba(255,255,255,0.4)"
            iconBg="rgba(255,255,255,0.05)"
          />
          <MetricCard
            label="Escalations"
            value={FLEET_METRICS.escalationsAwaitingHuman}
            sub="awaiting human"
            icon={AlertTriangle}
            iconColor="#FFB020"
            iconBg="rgba(255,176,32,0.08)"
            border="1px solid rgba(255,176,32,0.2)"
          />
          <MetricCard
            label="Actions this period"
            value={FLEET_METRICS.actionsTakenThisPeriod}
            icon={Zap}
            iconColor="#4D9EFF"
            iconBg="rgba(77,158,255,0.08)"
          />
          <MetricCard
            label="Autonomy rate"
            value={<span style={{ color: "#2DD4BF" }}>{FLEET_METRICS.autonomyRate}%</span>}
            sub="no human intervention"
            icon={Shield}
            iconColor="#2DD4BF"
            iconBg="rgba(45,212,191,0.08)"
          />
        </div>
      </div>

      {/* ── 3. LIFECYCLE LENS (optional) ─────────────────────────────────── */}
      {SHOW_LIFECYCLE_LENS && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>
            Work in pipeline · click a stage to filter
          </p>
          <div className="grid grid-cols-5 gap-3">
            {LIFECYCLE_STAGES.map((stage, i) => {
              const cfg   = STAGE_CFG[stage];
              const Icon  = cfg.icon;
              const count = stageCounts[stage];
              const active = stageFilter === stage;
              return (
                <button
                  key={stage}
                  onClick={() => setStageFilter(active ? "all" : stage)}
                  className="rounded-xl px-4 py-3 flex items-center gap-3 text-left transition-all"
                  style={{
                    backgroundColor: active ? `${cfg.color}14` : "var(--color-bg-card)",
                    border: active ? `1px solid ${cfg.color}40` : "1px solid var(--color-border)",
                    boxShadow: active ? `0 0 0 1px ${cfg.color}25` : "none",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cfg.color}18` }}
                  >
                    <Icon size={15} style={{ color: cfg.color }} />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                      {i + 1}. {stage}
                    </div>
                    <div className="text-xl font-bold tabular-nums" style={{ color: active ? cfg.color : "var(--color-text-primary)" }}>
                      {count}
                    </div>
                  </div>
                  {i < LIFECYCLE_STAGES.length - 1 && (
                    <span className="ml-auto text-[16px] font-light" style={{ color: "var(--color-text-muted)" }}>→</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. AGENT ROSTER (table) ───────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
            Agent roster
            <span className="ml-2 font-bold" style={{ color: "var(--color-text-primary)" }}>
              {filteredRoster.length}
              {filteredRoster.length !== AGENT_ROSTER.length && ` / ${AGENT_ROSTER.length}`}
            </span>
          </p>
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
            Sort by → Status or Load by clicking column headers
          </p>
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          {filteredRoster.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2">
              <Bot size={28} style={{ color: "var(--color-text-muted)", opacity: 0.4 }} />
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No agents match the current filters</p>
            </div>
          ) : (
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap"
                    style={{ color: "var(--color-text-muted)" }}>
                    Agent
                  </th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap"
                    style={{ color: "var(--color-text-muted)" }}>
                    Role · Stage
                  </th>
                  <SortTh col="status" label="Status"  sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: "var(--color-text-muted)" }}>
                    Current task
                  </th>
                  <SortTh col="load"   label="Load"    sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap"
                    style={{ color: "var(--color-text-muted)" }}>
                    Domains
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRoster.map((agent, idx) => {
                  const statusCfg = STATUS_CFG[agent.status];
                  const stageCfg  = STAGE_CFG[agent.lifecycleStage];
                  const StageIcon = stageCfg.icon;
                  const isLast    = idx === filteredRoster.length - 1;
                  return (
                    <tr
                      key={agent.id}
                      className="hover:bg-white/[0.02] transition-colors"
                      style={{ borderBottom: isLast ? "none" : "1px solid var(--color-border)" }}
                    >
                      {/* Agent name */}
                      <td className="px-4 py-3">
                        <span
                          className="text-[12px] font-bold font-mono"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {agent.name}
                        </span>
                      </td>

                      {/* Role + Stage */}
                      <td className="px-3 py-3">
                        <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{agent.role}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <StageIcon size={10} style={{ color: stageCfg.color }} />
                          <span className="text-[10px] font-semibold" style={{ color: stageCfg.color }}>
                            {agent.lifecycleStage}
                          </span>
                        </div>
                      </td>

                      {/* Status pill */}
                      <td className="px-3 py-3">
                        <Badge
                          className="text-[10px] font-bold whitespace-nowrap"
                          style={{
                            color: statusCfg.color,
                            backgroundColor: statusCfg.bg,
                            border: agent.status === "idle" ? "1px solid rgba(255,255,255,0.1)" : "none",
                          }}
                        >
                          {statusCfg.label}
                        </Badge>
                      </td>

                      {/* Current task */}
                      <td className="px-3 py-3" style={{ maxWidth: 320 }}>
                        <p
                          className="text-[11px] leading-snug line-clamp-2"
                          style={{ color: agent.status === "idle" ? "var(--color-text-muted)" : "var(--color-text-primary)" }}
                        >
                          {agent.currentTask}
                        </p>
                      </td>

                      {/* Load bar */}
                      <td className="px-3 py-3">
                        <LoadBar load={agent.load} status={agent.status} />
                      </td>

                      {/* Domains */}
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {agent.domains.map((d) => (
                            <Badge
                              key={d}
                              className="px-1.5 text-[9px] font-bold"
                              style={{
                                color: DOMAIN_COLOR[d] ?? "var(--color-text-muted)",
                                backgroundColor: `${DOMAIN_COLOR[d] ?? "rgba(255,255,255,0.1)"}15`,
                              }}
                            >
                              {d}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── 5. ACTIVITY FEED ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
              Activity feed
              <span className="ml-2 font-bold" style={{ color: "var(--color-text-primary)" }}>
                {filteredFeed.length}
                {filteredFeed.length !== ACTIVITY_FEED.length && ` / ${ACTIVITY_FEED.length}`}
              </span>
            </p>
            {/* Escalations shortcut */}
            <button
              onClick={setEscalationsOnly}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
              style={{
                backgroundColor: stateFilter === "escalating" ? "rgba(255,176,32,0.14)" : "rgba(255,255,255,0.04)",
                color:           stateFilter === "escalating" ? "#FFB020"               : "var(--color-text-muted)",
                border:          stateFilter === "escalating" ? "1px solid rgba(255,176,32,0.3)" : "1px solid var(--color-border)",
              }}
            >
              <AlertTriangle size={10} />
              Escalations only
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#2DD4BF", animation: "pulse-live 1.6s ease-in-out infinite" }} />
            Live · reverse-chrono
          </div>
        </div>

        <div
          className="rounded-xl overflow-hidden flex flex-col"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          {filteredFeed.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2">
              <Activity size={28} style={{ color: "var(--color-text-muted)", opacity: 0.4 }} />
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No activity matches the current filters</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
              {filteredFeed.map((entry) => {
                const cfg       = FEED_STATE_CFG[entry.state];
                const stageCfg  = STAGE_CFG[entry.lifecycleStage];
                const StageIcon = stageCfg.icon;
                return (
                  <button
                    key={entry.id}
                    className="w-full flex items-start gap-3 px-5 py-3.5 text-left hover:bg-white/[0.025] transition-colors"
                    onClick={() => navigate(entry.incidentRoute)}
                  >
                    {/* State badge */}
                    <Badge
                      className="text-[9px] font-bold shrink-0 mt-0.5 whitespace-nowrap"
                      style={{
                        color:           cfg.color,
                        backgroundColor: cfg.bg,
                        border:          cfg.border ?? "none",
                      }}
                    >
                      {cfg.label}
                    </Badge>

                    {/* Action text */}
                    <p className="flex-1 text-[12px] leading-snug" style={{ color: "var(--color-text-primary)" }}>
                      {entry.action}
                    </p>

                    {/* Metadata */}
                    <div className="shrink-0 flex items-center gap-2 pt-px">
                      {/* Stage */}
                      <div className="flex items-center gap-1">
                        <StageIcon size={9} style={{ color: stageCfg.color }} />
                        <span className="text-[9px] font-semibold" style={{ color: stageCfg.color }}>
                          {entry.lifecycleStage}
                        </span>
                      </div>
                      <span style={{ color: "var(--color-border)" }}>·</span>
                      {/* Agent */}
                      <span className="text-[10px] font-mono font-semibold" style={{ color: "var(--color-text-muted)" }}>
                        {entry.agentName}
                      </span>
                      <span style={{ color: "var(--color-border)" }}>·</span>
                      {/* Domain */}
                      <span
                        className="text-[10px] font-semibold"
                        style={{ color: DOMAIN_COLOR[entry.domainLabel] ?? "var(--color-text-muted)" }}
                      >
                        {entry.domainLabel}
                      </span>
                      <span style={{ color: "var(--color-border)" }}>·</span>
                      {/* Ref */}
                      <span className="text-[10px] font-mono font-semibold" style={{ color: "var(--color-brand)" }}>
                        {entry.incidentRef}
                      </span>
                      <span style={{ color: "var(--color-border)" }}>·</span>
                      {/* Time */}
                      <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                        {entry.relativeTime}
                      </span>
                      {/* Link arrow */}
                      <ArrowUpRight size={11} style={{ color: "var(--color-text-muted)", opacity: 0.5 }} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse-live {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
