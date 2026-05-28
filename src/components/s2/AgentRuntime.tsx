import {
  Activity,
  BookOpen,
  Brain,
  Clock,
  Inbox,
  Lightbulb,
  Play,
  Settings,
  UserCheck,
  Zap,
} from "lucide-react";
import { mockCases } from "../../data/cxi-cases";

// ── Agent definitions ─────────────────────────────────────────────────────────

type AgentStatus = "active" | "processing" | "idle" | "standby";

interface MINDRAgent {
  id: string;
  name: string;
  shortName: string;
  role: string;
  description: string;
  icon: React.ElementType;
  status: AgentStatus;
  queue: number;
  processedToday: number;
  lastRun: string;
  accentColor: string;
}

const AGENTS: MINDRAgent[] = [
  {
    id: "trigger",
    name: "Trigger Agent",
    shortName: "Trigger",
    role: "Detection & Grouping",
    description: "Monitors CXI degradation thresholds, groups related events, suppresses duplicates",
    icon: Zap,
    status: "active",
    queue: 2,
    processedToday: 47,
    lastRun: "12s ago",
    accentColor: "#E2007A",
  },
  {
    id: "context",
    name: "Context Collection Agent",
    shortName: "CCA",
    role: "Data Aggregation",
    description: "Collects customer, cell, site and geo context. Retrieves alarms, changes, tickets and known problems",
    icon: Inbox,
    status: "processing",
    queue: 3,
    processedToday: 38,
    lastRun: "44s ago",
    accentColor: "#1A5A8A",
  },
  {
    id: "correlation",
    name: "Correlation & RCA Agent",
    shortName: "CA / RCA",
    role: "Root Cause Analysis",
    description: "Correlates CXI sub-metrics with technical KPIs, compares against known patterns, classifies root cause",
    icon: Brain,
    status: "processing",
    queue: 2,
    processedToday: 34,
    lastRun: "1m ago",
    accentColor: "#6B2FA0",
  },
  {
    id: "recommendation",
    name: "Recommendation Agent",
    shortName: "RA",
    role: "Action Planning",
    description: "Proposes next-best action, selects target team, determines ticket lifecycle and one-click remediation",
    icon: Lightbulb,
    status: "idle",
    queue: 0,
    processedToday: 31,
    lastRun: "2m ago",
    accentColor: "#B45000",
  },
  {
    id: "validation",
    name: "Human Validation Agent",
    shortName: "HVA",
    role: "Reviewer Interface",
    description: "Prepares reviewer-friendly summaries, captures approvals and corrections, ensures traceability",
    icon: UserCheck,
    status: "active",
    queue: 5,
    processedToday: 28,
    lastRun: "4m ago",
    accentColor: "#1A7A4A",
  },
  {
    id: "documentation",
    name: "Documentation Agent",
    shortName: "DRA",
    role: "Audit & Learning",
    description: "Writes results to target systems, updates tickets and changelogs, maintains audit trail, feeds playbook learning",
    icon: BookOpen,
    status: "idle",
    queue: 1,
    processedToday: 23,
    lastRun: "6m ago",
    accentColor: "#1A5A8A",
  },
  {
    id: "execution",
    name: "Execution Agent",
    shortName: "ExA",
    role: "Remediation",
    description: "Executes actions only after human approval — sleeping cell resets and other approved one-click automations",
    icon: Play,
    status: "standby",
    queue: 0,
    processedToday: 4,
    lastRun: "34m ago",
    accentColor: "#E2007A",
  },
];

const AGENT_RESPONSIBILITIES: Record<string, string[]> = {
  trigger:        ["Monitor CXI degradation triggers in real-time", "Group related degradation events", "Suppress low-quality or duplicate triggers"],
  context:        ["Collect customer, cell, site and geo context", "Retrieve relevant alarms, changes, tickets", "Provide normalised context to downstream agents"],
  correlation:    ["Correlate CXI sub-metrics with technical KPIs", "Compare case with known problem patterns", "Generate root-cause hypotheses and classify"],
  recommendation: ["Propose next-best action for each case", "Select target team and ticket type", "Identify one-click remediation applicability"],
  validation:     ["Prepare reviewer-friendly case summaries", "Capture approval, rejection or correction", "Prevent unapproved automated execution"],
  documentation:  ["Write analysis results to target systems", "Update tickets, changelogs, and databases", "Maintain audit trail for every case"],
  execution:      ["Execute actions only after human approval", "Perform sleeping cell resets one-click", "Log all execution outcomes to audit trail"],
};

// ── Pipeline events ───────────────────────────────────────────────────────────

interface PipelineEvent {
  ts: string;
  caseId: string;
  step: string;
  detail: string;
  color: string;
}

const PIPELINE_EVENTS: PipelineEvent[] = [
  { ts: "09:42", caseId: "CXI-2024-0041", step: "Trigger",       detail: "CXI drop −2.3 detected on Cell A7-North, threshold exceeded",  color: "#E2007A" },
  { ts: "09:43", caseId: "CXI-2024-0041", step: "CCA",           detail: "126 alarms, 2 change tickets, 1 known problem retrieved",       color: "#1A5A8A" },
  { ts: "09:44", caseId: "CXI-2024-0041", step: "CA / RCA",      detail: "Root cause classified: Incident (hardware fault correlation)",   color: "#6B2FA0" },
  { ts: "09:44", caseId: "CXI-2024-0041", step: "RA",            detail: "Action: Sleeping Cell reset — one-click available",            color: "#B45000" },
  { ts: "09:45", caseId: "CXI-2024-0041", step: "HVA",           detail: "Case CXI-2024-0041 sent for human approval",                   color: "#1A7A4A" },
  { ts: "09:51", caseId: "CXI-2024-0038", step: "DRA",           detail: "Approved case written to INC-88204, audit trail updated",      color: "#1A5A8A" },
  { ts: "09:52", caseId: "CXI-2024-0038", step: "Execution",     detail: "Sleeping Cell reset executed — confirmed by Execution Agent",  color: "#E2007A" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string; bg: string; pulse: boolean }> = {
  active:     { label: "Active",     color: "#1A7A4A", bg: "rgba(26,122,74,0.15)",   pulse: true  },
  processing: { label: "Processing", color: "#E2007A", bg: "rgba(226,0,122,0.12)",   pulse: true  },
  idle:       { label: "Idle",       color: "#888",    bg: "rgba(136,136,136,0.1)",  pulse: false },
  standby:    { label: "Standby",    color: "#B45000", bg: "rgba(180,80,0,0.12)",    pulse: false },
};

// ── Agent card (S1 look and feel) ─────────────────────────────────────────────

function AgentCard({ agent }: { agent: MINDRAgent }) {
  const st   = STATUS_CONFIG[agent.status];
  const Icon = agent.icon;
  const resp = AGENT_RESPONSIBILITIES[agent.id] ?? [];

  return (
    <div
      className="rounded-xl flex flex-col overflow-hidden transition-all duration-200 hover:shadow-lg"
      style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: `${agent.accentColor}18` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ color: agent.accentColor, backgroundColor: "rgba(0,0,0,0.25)", border: `1px solid ${agent.accentColor}` }}
          >
            {agent.role}
          </span>
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1"
            style={{ color: st.color, backgroundColor: st.bg }}
          >
            {st.pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ backgroundColor: st.color }} />}
            {st.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.color }} />
          <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{agent.lastRun}</span>
        </div>
      </div>

      <div className="px-4 pt-4 pb-4 flex flex-col gap-4 flex-1">
        {/* Identity */}
        <div>
          <h3 className="text-base font-bold leading-tight mb-1" style={{ color: "var(--color-text-primary)" }}>
            {agent.name}
          </h3>
          <p className="text-[11px] leading-snug" style={{ color: "var(--color-text-muted)" }}>
            {agent.description}
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Inbox,    value: String(agent.queue),          label: "QUEUE",   accent: agent.queue > 0 ? agent.accentColor : undefined },
            { icon: Activity, value: String(agent.processedToday), label: "TODAY",   accent: undefined },
            { icon: Clock,    value: agent.lastRun,                label: "LAST RUN", accent: undefined },
          ].map(({ icon: MetricIcon, value, label, accent }) => (
            <div
              key={label}
              className="rounded-lg p-2 flex flex-col items-center gap-1"
              style={{ backgroundColor: "var(--color-bg-elevated)" }}
            >
              <MetricIcon size={11} style={{ color: accent ?? "var(--color-text-muted)" }} />
              <p
                className="text-sm font-bold tabular-nums leading-none"
                style={{ color: accent ?? "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}
              >
                {value}
              </p>
              <p className="text-[8px] uppercase tracking-widest leading-none" style={{ color: "var(--color-text-muted)" }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Responsibilities */}
        <div
          className="rounded-lg px-3 py-2.5"
          style={{ border: "1px dashed rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.02)" }}
        >
          <p className="text-[8px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-text-muted)" }}>
            Responsibilities
          </p>
          <ul className="space-y-1">
            {resp.slice(0, 3).map((r) => (
              <li key={r} className="flex items-start gap-1.5 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: agent.accentColor }} />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <span
          className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
          style={{ color: agent.accentColor, backgroundColor: `${agent.accentColor}15` }}
        >
          {agent.shortName}
        </span>
        <button
          className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg transition-colors hover:bg-white/10"
          style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
        >
          <Settings size={10} />
          Configure
        </button>
      </div>
    </div>
  );
}

// ── Pipeline flow ─────────────────────────────────────────────────────────────

function PipelineFlow() {
  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
    >
      <p className="text-xs font-semibold mb-4" style={{ color: "var(--color-text-secondary)" }}>
        Agent Pipeline Flow
      </p>
      <div className="relative flex items-start w-full">
        {/* connecting line */}
        <div
          className="absolute left-0 right-0"
          style={{ top: 20, height: 1, backgroundColor: "var(--color-border)", zIndex: 0 }}
        />
        {AGENTS.map((agent) => {
          const st   = STATUS_CONFIG[agent.status];
          const Icon = agent.icon;
          return (
            <div key={agent.id} className="flex flex-col items-center gap-1.5 flex-1 relative z-10">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center relative"
                style={{
                  backgroundColor: `${agent.accentColor}18`,
                  border: `2px solid ${agent.accentColor}50`,
                }}
              >
                <Icon size={16} style={{ color: agent.accentColor }} />
                <span
                  className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full"
                  style={{ backgroundColor: st.color, border: "2px solid var(--color-bg-card)" }}
                />
              </div>
              <p className="text-[9px] font-medium text-center leading-tight" style={{ color: "var(--color-text-secondary)" }}>
                {agent.shortName}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Pipeline activity (event log) ─────────────────────────────────────────────

function EventLog({ events }: { events: PipelineEvent[] }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
    >
      <div
        className="px-4 py-3"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-elevated)" }}
      >
        <p className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Pipeline Activity
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          Recent case events across all agents
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {events.map((ev, i) => (
          <div
            key={i}
            className="flex gap-3 px-4 py-3"
            style={{ borderBottom: "1px solid var(--color-border)", borderRight: "1px solid var(--color-border)" }}
          >
            <div className="shrink-0 mt-1">
              <span className="w-2 h-2 rounded-full block" style={{ backgroundColor: ev.color }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span
                  className="text-[9px] font-bold px-1.5 py-px rounded"
                  style={{ backgroundColor: `${ev.color}20`, color: ev.color }}
                >
                  {ev.step}
                </span>
                <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{ev.ts}</span>
                <span className="text-[10px] truncate" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                  {ev.caseId}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {ev.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function S2AgentRuntime() {
  const totalQueue      = AGENTS.reduce((s, a) => s + a.queue, 0);
  const activeCount     = AGENTS.filter((a) => a.status === "active" || a.status === "processing").length;
  const processedToday  = AGENTS.reduce((s, a) => s + a.processedToday, 0);
  const pendingApproval = mockCases.filter((c) => c.status === "pending").length;

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-base)", fontFamily: "var(--font-ui)" }}
    >
      <div className="flex-1 overflow-y-auto px-8 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold leading-none" style={{ color: "var(--color-text-primary)" }}>
              Agent Runtime
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              7 CXI agents — Degradation detection pipeline
            </p>
          </div>
          <span
            className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md"
            style={{
              backgroundColor: "rgba(255,176,32,0.1)",
              border: "1px solid rgba(255,176,32,0.2)",
              color: "var(--color-warning)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--color-warning)" }} />
            Scenario 2
          </span>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Active Agents",    value: `${activeCount} / ${AGENTS.length}` },
            { label: "Total Queue",       value: totalQueue },
            { label: "Processed Today",   value: processedToday },
            { label: "Awaiting Approval", value: pendingApproval },
          ].map((t) => (
            <div
              key={t.label}
              className="rounded-xl p-4 flex flex-col gap-1"
              style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
            >
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
                {t.label}
              </p>
              <p
                className="text-3xl font-bold leading-none mt-1"
                style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}
              >
                {t.value}
              </p>
            </div>
          ))}
        </div>

        {/* Pipeline flow */}
        <div className="mb-6">
          <PipelineFlow />
        </div>

        {/* Agent grid — full width */}
        <div className="grid grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {AGENTS.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>

        {/* Pipeline activity — full width below agents */}
        <EventLog events={PIPELINE_EVENTS} />

      </div>
    </div>
  );
}
