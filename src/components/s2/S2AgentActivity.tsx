import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Brain,
  ChevronDown,
  ChevronRight,
  Inbox,
  Lightbulb,
  Play,
  UserCheck,
  Zap,
} from "lucide-react";

// ── Activity data ─────────────────────────────────────────────────────────────

type ActivityStatus = "done" | "awaiting" | "running";

interface ActivityDetail {
  inputs: { label: string; value: string }[];
  reasoning: string;
  output: string;
  caseId: string;
}

interface ActivityEvent {
  id: string;
  agentName: string;
  agentShort: string;
  agentColor: string;
  agentIcon: React.ElementType;
  caseRef: string;
  confidence?: number;
  summary: string;
  timestamp: string;
  status: ActivityStatus;
  detail: ActivityDetail;
}

const EVENTS: ActivityEvent[] = [
  {
    id: "evt-01",
    agentName: "Trigger Agent",
    agentShort: "TRG",
    agentColor: "#E2007A",
    agentIcon: Zap,
    caseRef: "CXI-2024-0041",
    confidence: 94,
    summary: "CXI drop −2.3 detected on Frankfurt Galluswarte — threshold exceeded, case opened",
    timestamp: "2m ago",
    status: "done",
    detail: {
      caseId: "CXI-2024-0041",
      inputs: [
        { label: "Region",        value: "Frankfurt Rhine-Main" },
        { label: "Site",          value: "Frankfurt Galluswarte" },
        { label: "Cell",          value: "Frankfurt West Tower B" },
        { label: "CXI Drop",      value: "−2.3 pts (4.1 → 1.8)" },
        { label: "Threshold",     value: "≥ −1.5 pts over 15 min" },
        { label: "Affected Users", value: "1,240 subscribers" },
      ],
      reasoning:
        "CXI drop of −2.3 exceeded the critical threshold of −1.5. No duplicate case was found within the 30-minute suppression window. Case was opened and tagged P1.",
      output: "Case CXI-2024-0041 opened (P1). Context collection queued.",
    },
  },
  {
    id: "evt-02",
    agentName: "Context Collection Agent",
    agentShort: "CCA",
    agentColor: "#1A5A8A",
    agentIcon: Inbox,
    caseRef: "CXI-2024-0041",
    confidence: 88,
    summary: "126 alarms, 2 change tickets and 1 known problem retrieved for Frankfurt West Tower B",
    timestamp: "5m ago",
    status: "done",
    detail: {
      caseId: "CXI-2024-0041",
      inputs: [
        { label: "Alarms retrieved",   value: "126 (last 4 h)" },
        { label: "Change tickets",     value: "2 (CHG-44021, CHG-44018)" },
        { label: "Known problems",     value: "1 (KP-8812 — hardware instability)" },
        { label: "Geo context",        value: "Frankfurt Rhine-Main, EU-CENTRAL" },
        { label: "Customer tier",      value: "Mixed (residential + enterprise)" },
      ],
      reasoning:
        "Full context package assembled from OSS, BSS and NOC systems. Known problem KP-8812 flagged as potentially related — passed to Correlation agent for analysis.",
      output: "Context package forwarded to Correlation & RCA Agent.",
    },
  },
  {
    id: "evt-03",
    agentName: "Correlation & RCA Agent",
    agentShort: "CA / RCA",
    agentColor: "#6B2FA0",
    agentIcon: Brain,
    caseRef: "CXI-2024-0041",
    confidence: 91,
    summary: "Root cause classified: hardware fault correlation — baseband unit degradation on Tower B",
    timestamp: "8m ago",
    status: "done",
    detail: {
      caseId: "CXI-2024-0041",
      inputs: [
        { label: "CXI sub-metric",  value: "Voice MOS drop, data throughput −60%" },
        { label: "Alarm pattern",   value: "BBU error burst — 47 alarms in 12 min" },
        { label: "Known problem",   value: "KP-8812 matched (87% similarity)" },
        { label: "Change impact",   value: "CHG-44021 ruled out (different cell)" },
      ],
      reasoning:
        "Correlation between BBU error burst and CXI sub-metric degradation confirmed at 91% confidence. Pattern matches KP-8812 (baseband hardware fault). Change tickets excluded as root cause.",
      output: "Root cause: BBU hardware fault on Frankfurt West Tower B. Recommended action forwarded to Recommendation Agent.",
    },
  },
  {
    id: "evt-04",
    agentName: "Recommendation Agent",
    agentShort: "RA",
    agentColor: "#B45000",
    agentIcon: Lightbulb,
    caseRef: "CXI-2024-0041",
    confidence: 87,
    summary: "One-click remediation available — sleeping cell reset proposed for Frankfurt West Tower B",
    timestamp: "11m ago",
    status: "done",
    detail: {
      caseId: "CXI-2024-0041",
      inputs: [
        { label: "Root cause",       value: "BBU hardware fault (confirmed)" },
        { label: "Playbook match",   value: "PB-0044 — Sleeping Cell Reset" },
        { label: "Target team",      value: "Field Operations — Frankfurt" },
        { label: "SLA remaining",    value: "3h 12m (P1 4h SLA)" },
      ],
      reasoning:
        "Playbook PB-0044 (Sleeping Cell Reset) matched at 87% confidence. One-click automation approved for this fault type. Human approval required before execution.",
      output: "Proposed action: Sleeping Cell reset on Frankfurt West Tower B. Sent to Human Validation Agent.",
    },
  },
  {
    id: "evt-05",
    agentName: "Human Validation Agent",
    agentShort: "HVA",
    agentColor: "#1A7A4A",
    agentIcon: UserCheck,
    caseRef: "CXI-2024-0041",
    confidence: undefined,
    summary: "Case summary prepared and sent to Marcus Webb for approval — sleeping cell reset pending",
    timestamp: "14m ago",
    status: "awaiting",
    detail: {
      caseId: "CXI-2024-0041",
      inputs: [
        { label: "Reviewer",       value: "Marcus Webb (CXI Specialist)" },
        { label: "Proposed action", value: "Sleeping Cell reset — one-click" },
        { label: "Risk level",     value: "Low (reversible, no service impact)" },
        { label: "Approval mode",  value: "One-click via MINDR case view" },
      ],
      reasoning:
        "All required data compiled into reviewer-friendly summary. Approval or rejection will be captured with timestamp for audit trail. Unapproved execution is blocked.",
      output: "Awaiting approval from Marcus Webb. No automated action taken until approved.",
    },
  },
  {
    id: "evt-06",
    agentName: "Documentation Agent",
    agentShort: "DRA",
    agentColor: "#1A5A8A",
    agentIcon: BookOpen,
    caseRef: "CXI-2024-0038",
    confidence: 95,
    summary: "Case CXI-2024-0038 written to INC-88204, changelog and audit trail updated",
    timestamp: "23m ago",
    status: "done",
    detail: {
      caseId: "CXI-2024-0038",
      inputs: [
        { label: "Target ticket",  value: "INC-88204 (ServiceNow)" },
        { label: "Changelog",      value: "NOC Runbook — Hamburg Metropolitan" },
        { label: "Audit record",   value: "AUD-2024-4421 created" },
        { label: "Playbook update", value: "PB-0044 feedback written" },
      ],
      reasoning:
        "Post-resolution documentation written to all required systems. Playbook PB-0044 updated with outcome feedback to improve future recommendation accuracy.",
      output: "INC-88204 closed. Audit trail complete. Playbook learning updated.",
    },
  },
  {
    id: "evt-07",
    agentName: "Execution Agent",
    agentShort: "ExA",
    agentColor: "#E2007A",
    agentIcon: Play,
    caseRef: "CXI-2024-0038",
    confidence: 99,
    summary: "Sleeping cell reset executed on Hamburg Hauptbahnhof — CXI recovery confirmed at +1.9 pts",
    timestamp: "31m ago",
    status: "done",
    detail: {
      caseId: "CXI-2024-0038",
      inputs: [
        { label: "Approved by",     value: "Marcus Webb — 09:51 UTC" },
        { label: "Action",          value: "Sleeping Cell reset via SON interface" },
        { label: "Pre-reset CXI",   value: "1.6 pts" },
        { label: "Post-reset CXI",  value: "3.5 pts (+1.9 pts recovery)" },
        { label: "Duration",        value: "Completed in 43 seconds" },
      ],
      reasoning:
        "Action executed only after explicit human approval was captured. SON interface confirmed the reset. CXI monitoring shows recovery to 3.5 pts, above Degraded threshold.",
      output: "Sleeping cell reset successful. CXI recovered to 3.5 pts. Case resolved.",
    },
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function ConfidenceBadge({ value }: { value: number }) {
  const color = value >= 90 ? "#22c55e" : value >= 80 ? "#f59e0b" : "#ef4444";
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-px rounded-full"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {value}%
    </span>
  );
}

function StatusChip({ status }: { status: ActivityStatus }) {
  if (status === "awaiting") {
    return (
      <span
        className="text-[9px] font-bold px-2 py-px rounded uppercase tracking-wide"
        style={{ backgroundColor: "rgba(180,80,0,0.18)", color: "#B45000", border: "1px solid rgba(180,80,0,0.3)" }}
      >
        • AWAITING
      </span>
    );
  }
  if (status === "running") {
    return (
      <span
        className="flex items-center gap-1 text-[9px] font-bold px-2 py-px rounded uppercase tracking-wide"
        style={{ backgroundColor: "rgba(226,0,122,0.12)", color: "#E2007A" }}
      >
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#E2007A" }} />
        RUNNING
      </span>
    );
  }
  return (
    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
      done
    </span>
  );
}

function DetailPanel({ detail, agentColor }: { detail: ActivityDetail; agentColor: string }) {
  return (
    <div
      className="mx-0 mt-0 rounded-b-xl overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-elevated)", borderTop: "1px solid var(--color-border)" }}
    >
      <div className="grid grid-cols-3 gap-0 divide-x" style={{ borderColor: "var(--color-border)" }}>

        {/* Inputs */}
        <div className="px-5 py-4">
          <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>
            Inputs
          </p>
          <div className="space-y-2">
            {detail.inputs.map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>{label}</p>
                <p className="text-[11px] font-medium mt-px" style={{ color: "var(--color-text-primary)" }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reasoning */}
        <div className="px-5 py-4" style={{ borderLeft: "1px solid var(--color-border)" }}>
          <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>
            Agent Reasoning
          </p>
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            {detail.reasoning}
          </p>
        </div>

        {/* Output + link */}
        <div className="px-5 py-4 flex flex-col gap-3" style={{ borderLeft: "1px solid var(--color-border)" }}>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>
              Output
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              {detail.output}
            </p>
          </div>
          <Link
            to={`/cxi-cases`}
            className="mt-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-opacity hover:opacity-85"
            style={{ backgroundColor: `${agentColor}18`, color: agentColor, border: `1px solid ${agentColor}30` }}
          >
            Open {detail.caseId} →
          </Link>
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ event }: { event: ActivityEvent }) {
  const [open, setOpen] = useState(false);
  const Icon = event.agentIcon;

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ backgroundColor: "var(--color-bg-card)", border: `1px solid ${open ? event.agentColor + "40" : "var(--color-border)"}` }}
    >
      {/* Main row */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        {/* Agent icon */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${event.agentColor}18`, border: `1.5px solid ${event.agentColor}50` }}
        >
          <Icon size={15} style={{ color: event.agentColor }} />
        </div>

        {/* Identity + summary */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {event.agentName}
            </span>
            <span className="text-[10px]" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
              · {event.caseRef}
            </span>
            {event.confidence !== undefined && <ConfidenceBadge value={event.confidence} />}
          </div>
          <p className="text-[11px] leading-snug truncate" style={{ color: "var(--color-text-muted)" }}>
            {event.summary}
          </p>
        </div>

        {/* Right side: time + status + chevron */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{event.timestamp}</span>
          <StatusChip status={event.status} />
          <span style={{ color: "var(--color-text-muted)" }}>
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      {open && <DetailPanel detail={event.detail} agentColor={event.agentColor} />}
    </div>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

type Filter = "all" | "awaiting" | "done";

function FilterBar({ active, onChange }: { active: Filter; onChange: (f: Filter) => void }) {
  const opts: { id: Filter; label: string; count: number }[] = [
    { id: "all",      label: "All",      count: EVENTS.length },
    { id: "awaiting", label: "Awaiting", count: EVENTS.filter((e) => e.status === "awaiting").length },
    { id: "done",     label: "Done",     count: EVENTS.filter((e) => e.status === "done").length },
  ];
  return (
    <div className="flex items-center gap-1">
      {opts.map(({ id, label, count }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            backgroundColor: active === id ? "rgba(255,255,255,0.06)" : "transparent",
            color: active === id ? "var(--color-text-primary)" : "var(--color-text-muted)",
            border: `1px solid ${active === id ? "var(--color-border)" : "transparent"}`,
          }}
        >
          {label}
          <span
            className="text-[9px] font-bold px-1 py-px rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "var(--color-text-muted)" }}
          >
            {count}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function S2AgentActivity() {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = EVENTS.filter((e) => filter === "all" || e.status === filter);
  const awaitingCount = EVENTS.filter((e) => e.status === "awaiting").length;

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        margin: "-1rem -1.5rem",
        width: "calc(100% + 3rem)",
        height: "calc(100% + 2rem)",
        backgroundColor: "var(--color-bg-base)",
        fontFamily: "var(--font-ui)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-8 py-5 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div>
          <h1 className="text-2xl font-bold leading-none" style={{ color: "var(--color-text-primary)" }}>
            Agent activity
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Multi-agent transparency
          </p>
        </div>

        <div className="flex items-center gap-3">
          {awaitingCount > 0 && (
            <span
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: "rgba(180,80,0,0.15)", color: "#B45000", border: "1px solid rgba(180,80,0,0.25)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#B45000" }} />
              {awaitingCount} awaiting approval
            </span>
          )}
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
      </div>

      {/* Filter bar */}
      <div
        className="flex items-center justify-between px-8 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <FilterBar active={filter} onChange={setFilter} />
        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          {visible.length} event{visible.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Activity list */}
      <div className="flex-1 overflow-y-auto px-8 py-5 space-y-3" style={{ scrollbarWidth: "thin" }}>
        {visible.map((event) => (
          <ActivityRow key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
