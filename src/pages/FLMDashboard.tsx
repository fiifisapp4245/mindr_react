import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  BarChart2,
  Calendar,
  Clock,
  Cpu,
  GitBranch,
  Timer,
  Zap,
} from "lucide-react";
import { kpiCard, kpiValue } from "../lib/animations";

// ── Mock data ─────────────────────────────────────────────────────────────────

const NEEDS_ATTENTION = [
  {
    inc:      "INC-2853",
    label:    "AS3320 peer at DE-CIX Frankfurt",
    linked:   "Linked ALM - 0041",
    ticket:   "INC - 8422",
    sla:      "SLA 19m",
    severity: "Critical",
  },
  {
    inc:      "INC-2847",
    label:    "Peering link EU-CORE-01 → AS5413",
    linked:   "Linked ALM - 0039",
    ticket:   "INC - 8423",
    sla:      "SLA 22m",
    severity: "Critical",
  },
  {
    inc:      null,
    label:    "Packet Loss Threshold Exceeded",
    linked:   "Peering path to AS1299",
    ticket:   null,
    sla:      "5m ago",
    severity: "Critical",
  },
  {
    inc:      "INC-2847",
    label:    "Peering link EU-CORE-01 → AS5413",
    linked:   "Linked ALM - 0039",
    ticket:   "INC - 8423",
    sla:      "SLA 22m",
    severity: "Critical",
  },
];

const PREDICTED_BREACHES = [
  { eta: "15m", label: "SLA breach predicted 95%", node: "EU-CENTRAL-B4 → ALM-0044" },
  { eta: "22m", label: "Transit saturation risk",  node: "EU-CORE-01"               },
  { eta: "38m", label: "AS3215 SLA breach risk",   node: "EU-WEST-01 → ALM-0077"   },
];

const UPCOMING_EVENTS = [
  { days: "3 days", label: "Nova Strike - S3 Launch", detail: "96% overload predicted · AMX-IX → EU-CORE-01" },
  { days: "3 days", label: "SVOD finale drop",         detail: "78% elevated predicted · LINX → EU-WEST-01"  },
];

type RegionStatus = "critical" | "warning" | "healthy";

const REGION_HEALTH: { region: string; status: string; state: RegionStatus }[] = [
  { region: "EU-CORE-01", status: "1 active incident",    state: "critical" },
  { region: "EU-WEST-01", status: "1 alarm active",       state: "warning"  },
  { region: "EU-CENTRAL", status: "Saturation predicted", state: "warning"  },
  { region: "EU-SOUTH",   status: "Route flap detected",  state: "warning"  },
  { region: "EU-CORE-02", status: "Live event on forecast", state: "healthy" },
];

type AgentStatus = "done" | "pending";

const AGENT_ACTIVITY = [
  {
    icon:       Cpu,
    agent:      "Diagnosis agent",
    target:     "INC-2847",
    confidence: 91,
    age:        "2m ago",
    status:     "done" as AgentStatus,
    desc:       "Root cause identified — AS3320 prefix withdrawal",
  },
  {
    icon:       BarChart2,
    agent:      "Forecast agent",
    target:     "EVT-0101",
    confidence: 88,
    age:        "5m ago",
    status:     "done" as AgentStatus,
    desc:       "Flagged upcoming overload on AMS-IX path",
  },
  {
    icon:       Zap,
    agent:      "Remediation agent",
    target:     "INC-2853",
    confidence: null,
    age:        "1m ago",
    status:     "pending" as AgentStatus,
    desc:       "Proposed policy-based reroute",
  },
  {
    icon:       GitBranch,
    agent:      "Correlation agent",
    target:     "INC-2847",
    confidence: null,
    age:        "3m ago",
    status:     "done" as AgentStatus,
    desc:       "Grouped 3 alarms under one root cause",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const REGION_STATE_COLOR: Record<RegionStatus, string> = {
  critical: "var(--color-critical)",
  warning:  "#FFB020",
  healthy:  "var(--color-resolved)",
};

const REGION_STATE_BG: Record<RegionStatus, string> = {
  critical: "rgba(255,59,59,0.12)",
  warning:  "rgba(255,176,32,0.12)",
  healthy:  "rgba(77,200,130,0.12)",
};

const REGION_STATE_LABEL: Record<RegionStatus, string> = {
  critical: "Critical",
  warning:  "Warning",
  healthy:  "Healthy",
};

function StatusBadge({ state }: { state: RegionStatus }) {
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
      style={{ color: REGION_STATE_COLOR[state], backgroundColor: REGION_STATE_BG[state] }}
    >
      {REGION_STATE_LABEL[state]}
    </span>
  );
}

function SeverityBadge() {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold"
      style={{ backgroundColor: "rgba(255,59,59,0.12)", color: "var(--color-critical)" }}
    >
      Critical
    </span>
  );
}

// ── KPI cards data ─────────────────────────────────────────────────────────────

const KPI_CARDS = [
  {
    icon:     Bell,
    label:    "Active Alarms",
    value:    "6",
    sub:      "1 critical",
    subColor: "var(--color-critical)",
  },
  {
    icon:     AlertTriangle,
    label:    "Incidents",
    value:    "2",
    sub:      "2 open critical",
    subColor: "var(--color-critical)",
  },
  {
    icon:     Clock,
    label:    "SLA At Risk",
    value:    "2",
    sub:      "< 30 min remaining",
    subColor: "var(--color-text-muted)",
  },
  {
    icon:     Timer,
    label:    "Avg Resolution Time",
    value:    "14m",
    sub:      "vs 18m shift avg",
    subColor: "var(--color-text-muted)",
  },
  {
    icon:     Calendar,
    label:    "Upcoming events",
    value:    "3",
    sub:      "1 overload predicted",
    subColor: "#FFB020",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function FLMDashboard() {
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            IP Peering — Shift B — M. Weber — 09:24 UTC
          </p>
        </div>
        <Link
          to="/alarms"
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
        >
          View all alarms
        </Link>
      </div>

      {/* KPI Strip — 5 cards with Framer Motion hover */}
      <div className="grid grid-cols-5 gap-4">
        {KPI_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial="rest"
              whileHover="hover"
              variants={kpiCard}
              className="rounded-lg p-5 flex flex-col gap-2"
              style={{
                backgroundColor: "var(--color-bg-card)",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center gap-2">
                <Icon size={14} style={{ color: "var(--color-text-muted)" }} />
                <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                  {card.label}
                </p>
              </div>
              <motion.p
                variants={kpiValue}
                className="text-3xl font-bold tabular-nums"
              >
                {card.value}
              </motion.p>
              <p className="text-xs font-medium" style={{ color: card.subColor }}>
                {card.sub}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Top panels — Needs attention (3/5 width) + Looking ahead (2/5 width) */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "3fr 2fr" }}>

        {/* Needs attention now */}
        <div
          className="rounded-lg"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Needs attention now
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Ranked by severity + SLA risk
            </p>
          </div>

          {NEEDS_ATTENTION.map((inc, i) => (
            <Link
              key={i}
              to="/incidents"
              className="flex items-start justify-between px-5 py-3.5 hover:bg-white/5 transition-colors"
              style={{ borderBottom: i < NEEDS_ATTENTION.length - 1 ? "1px solid var(--color-border)" : undefined }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {inc.inc ? `${inc.inc} ${inc.label}` : inc.label}
                  </p>
                  <SeverityBadge />
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {inc.linked}
                </p>
              </div>
              <div className="text-right shrink-0 ml-8">
                {inc.ticket && (
                  <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                    {inc.ticket}
                  </p>
                )}
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {inc.sla}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Looking ahead */}
        <div
          className="rounded-lg"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Looking ahead
            </p>
          </div>

          {/* Predicted Breaches */}
          <div className="px-5 pt-3 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
              Predicted Breaches · Mins
            </p>
          </div>
          {PREDICTED_BREACHES.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 px-5 py-2.5"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold tabular-nums"
                style={{ backgroundColor: "rgba(255,176,32,0.14)", color: "#FFB020" }}
              >
                {item.eta}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-snug" style={{ color: "var(--color-text-primary)" }}>
                  {item.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {item.node}
                </p>
              </div>
            </div>
          ))}

          {/* Upcoming Events */}
          <div className="px-5 pt-3 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
              Upcoming events · Days
            </p>
          </div>
          {UPCOMING_EVENTS.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 px-5 py-2.5"
              style={{ borderBottom: i < UPCOMING_EVENTS.length - 1 ? "1px solid var(--color-border)" : undefined }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-center leading-tight"
                style={{ backgroundColor: "rgba(77,158,255,0.14)", color: "var(--color-mitigating)" }}
              >
                {item.days}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-snug" style={{ color: "var(--color-text-primary)" }}>
                  {item.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom panels — Region / Network Health + Agent activity */}
      <div className="grid grid-cols-2 gap-4">

        {/* Region / Network Health */}
        <div
          className="rounded-lg"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Region / Network Health
            </p>
          </div>
          {REGION_HEALTH.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: i < REGION_HEALTH.length - 1 ? "1px solid var(--color-border)" : undefined }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {item.region}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {item.status}
                </p>
              </div>
              <StatusBadge state={item.state} />
            </div>
          ))}
        </div>

        {/* Agent activity */}
        <div
          className="rounded-lg"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Agent activity
            </p>
          </div>
          {AGENT_ACTIVITY.map((a, i) => {
            const Icon = a.icon;
            const isDone    = a.status === "done";
            const isPending = a.status === "pending";
            return (
              <div
                key={i}
                className="flex items-start gap-3 px-5 py-3.5"
                style={{ borderBottom: i < AGENT_ACTIVITY.length - 1 ? "1px solid var(--color-border)" : undefined }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: "var(--color-bg-elevated)" }}
                >
                  <Icon size={13} style={{ color: "var(--color-text-secondary)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                      {a.agent}
                      <span style={{ color: "var(--color-text-muted)" }}> → </span>
                      <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{a.target}</span>
                    </p>
                    {a.confidence !== null && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-px rounded"
                        style={{ backgroundColor: "rgba(77,200,130,0.12)", color: "var(--color-resolved)" }}
                      >
                        {a.confidence}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {a.desc}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                    {a.age}
                  </p>
                  <p
                    className="text-[10px] font-semibold mt-0.5"
                    style={{
                      color: isDone ? "var(--color-resolved)" : isPending ? "#FFB020" : "var(--color-text-muted)",
                    }}
                  >
                    {a.status}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
