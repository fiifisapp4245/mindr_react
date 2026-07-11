import { AlertTriangle, Clock, Flag, Globe, Settings, Target, TrendingDown, TrendingUp, Zap } from "lucide-react";
import type { Agent, TagColor } from "../../types/agent";
import { Badge } from "@/components/ui/badge";

// ── Enrichment metadata ───────────────────────────────────────────────────────

const AGENT_META: Record<string, {
  description: string;
  recentTrigger: { label: string; detail: string; time: string };
  delta: { tasks: string; confidence: string; latency: string; load: number; tasksUp: boolean; latencyUp: boolean };
  zones: string[];
  criticalCount: number;
  highCount: number;
}> = {
  "anomaly-detector": {
    description: "Real-time network anomaly classification across all active flows",
    recentTrigger: { label: "Traffic Surge Detected", detail: "EU-CORE-01 · +142% threshold exceeded", time: "2m ago" },
    delta: { tasks: "+12%", confidence: "-0.3%", latency: "+4ms", load: 82, tasksUp: true, latencyUp: true },
    zones: ["EU-WEST", "US-EAST"],
    criticalCount: 1, highCount: 3,
  },
  "root-cause-analyzer": {
    description: "Deep causal inference across cross-domain network events",
    recentTrigger: { label: "Root Cause Localized", detail: "GW-10.0.42.1 · DDoS amplification signature", time: "5m ago" },
    delta: { tasks: "+3%", confidence: "+1.2%", latency: "-18ms", load: 45, tasksUp: true, latencyUp: false },
    zones: ["EU-WEST"],
    criticalCount: 0, highCount: 1,
  },
  "auto-resolver": {
    description: "Automated remediation and patch deployment on approval",
    recentTrigger: { label: "Awaiting Dispatch", detail: "No active assignments in queue", time: "—" },
    delta: { tasks: "—", confidence: "—", latency: "—", load: 0, tasksUp: false, latencyUp: false },
    zones: ["ALL REGIONS"],
    criticalCount: 0, highCount: 0,
  },
  "predictive-engine": {
    description: "ML-driven SLA breach and congestion forecasting",
    recentTrigger: { label: "SLA Breach Predicted", detail: "EU-CENTRAL-B4 · 95% breach in 15m", time: "8m ago" },
    delta: { tasks: "+7%", confidence: "-1.5%", latency: "+22ms", load: 89, tasksUp: true, latencyUp: true },
    zones: ["EU-CENTRAL", "EU-WEST"],
    criticalCount: 0, highCount: 2,
  },
  "orchestrator": {
    description: "Central coordination and multi-agent task allocation",
    recentTrigger: { label: "Load Rebalanced", detail: "VERIFY-GAMMA → RELAY-OMEGA (30% offload)", time: "1m ago" },
    delta: { tasks: "+18%", confidence: "+0.1%", latency: "-2ms", load: 67, tasksUp: true, latencyUp: false },
    zones: ["GLOBAL"],
    criticalCount: 0, highCount: 0,
  },
  "safety-guardian": {
    description: "Governance, ethics checks and policy enforcement layer",
    recentTrigger: { label: "Action Approved", detail: "Rate limit deployment · INC-8422 validated", time: "3m ago" },
    delta: { tasks: "+5%", confidence: "0%", latency: "0ms", load: 55, tasksUp: true, latencyUp: false },
    zones: ["GLOBAL"],
    criticalCount: 0, highCount: 0,
  },
};

// ── Layer accent colours ──────────────────────────────────────────────────────

const LAYER_COLOR: Record<string, string> = {
  "Surveillance Layer":  "var(--color-mitigating)",
  "Diagnostic Layer":    "var(--color-warning)",
  "Execution Layer":     "var(--color-neutral)",
  "Forecasting Layer":   "var(--color-brand)",
  "Management Layer":    "var(--color-resolved)",
  "Ethics & Governance": "var(--color-brand)",
};

const LAYER_BG: Record<string, string> = {
  "Surveillance Layer":  "rgba(77,158,255,0.1)",
  "Diagnostic Layer":    "rgba(255,176,32,0.1)",
  "Execution Layer":     "rgba(107,114,128,0.1)",
  "Forecasting Layer":   "rgba(233,30,140,0.1)",
  "Management Layer":    "rgba(45,212,191,0.1)",
  "Ethics & Governance": "rgba(233,30,140,0.1)",
};

const TAG_STYLE: Record<TagColor, { color: string; bg: string }> = {
  brand: { color: "var(--color-brand)",      bg: "rgba(233,30,140,0.1)"  },
  info:  { color: "var(--color-mitigating)", bg: "rgba(77,158,255,0.1)"  },
  muted: { color: "var(--color-neutral)",    bg: "rgba(107,114,128,0.1)" },
};

// ── AgentCard ─────────────────────────────────────────────────────────────────

export function AgentCard({ agent }: { agent: Agent }) {
  const isActive   = agent.status === "active";
  const tagStyle   = TAG_STYLE[agent.tag.color];
  const TagIcon    = agent.tag.icon;
  const meta       = AGENT_META[agent.id] ?? AGENT_META["auto-resolver"];
  const layerColor = LAYER_COLOR[agent.layer] ?? "var(--color-text-muted)";
  const layerBg    = LAYER_BG[agent.layer]    ?? "rgba(107,114,128,0.08)";

  const badgeColor = isActive ? "var(--color-resolved)" : "var(--color-warning)";
  const badgeBg    = isActive ? "rgba(45,212,191,0.12)" : "rgba(255,176,32,0.12)";

  return (
    <div
      className="rounded-xl flex flex-col overflow-hidden transition-all duration-200 hover:shadow-lg"
      style={{
        backgroundColor: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      {/* ── Card header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: layerBg }}
      >
        {/* Layer badge + status */}
        <div className="flex items-center gap-2">
          <Badge
            className="text-[9px] font-bold uppercase tracking-widest"
            style={{ color: layerColor, backgroundColor: "rgba(0,0,0,0.25)", border: `1px solid ${layerColor}` }}
          >
            {agent.layer}
          </Badge>
          <Badge
            className="px-1.5 text-[9px] font-semibold"
            style={{ color: badgeColor, backgroundColor: badgeBg }}
          >
            {isActive ? "ACTIVE" : "IDLE"}
          </Badge>
        </div>

        {/* Last active */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isActive ? "var(--color-resolved)" : "var(--color-neutral)" }} />
          <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
            {meta.recentTrigger.time !== "—" ? meta.recentTrigger.time : "Standby"}
          </span>
        </div>
      </div>

      <div className="px-4 pt-4 pb-4 flex flex-col gap-4 flex-1">
        {/* ── Agent identity ── */}
        <div>
          <h3 className="text-base font-bold leading-tight mb-1" style={{ color: "var(--color-text-primary)" }}>
            {agent.name}
          </h3>
          <p className="text-[11px] leading-snug" style={{ color: "var(--color-text-muted)" }}>
            {meta.description}
          </p>
        </div>

        {/* ── Metrics row ── */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Clock,         value: agent.latency,    label: "LATENCY"    },
            { icon: Zap,           value: agent.tasks !== null ? `${agent.tasks}` : "—", label: "TASKS" },
            { icon: Target,        value: agent.confidence, label: "CONFIDENCE" },
            { icon: AlertTriangle, value: `${meta.criticalCount}`, label: "CRITICAL", accent: meta.criticalCount > 0 ? "var(--color-critical)" : undefined },
          ].map(({ icon: Icon, value, label, accent }) => (
            <div
              key={label}
              className="rounded-lg p-2 flex flex-col items-center gap-1"
              style={{ backgroundColor: "var(--color-bg-elevated)" }}
            >
              <Icon size={11} style={{ color: accent ?? "var(--color-text-muted)" }} />
              <p
                className="text-sm font-bold tabular-nums leading-none"
                style={{ color: accent ?? (isActive ? "var(--color-text-primary)" : "var(--color-text-muted)") }}
              >
                {value}
              </p>
              <p className="text-[8px] uppercase tracking-widest leading-none" style={{ color: "var(--color-text-muted)" }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Last trigger box ── */}
        <div
          className="rounded-lg px-3 py-2.5"
          style={{
            border: "1px dashed rgba(255,255,255,0.12)",
            backgroundColor: "rgba(255,255,255,0.02)",
          }}
        >
          <p
            className="text-[8px] font-bold uppercase tracking-widest mb-1.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            Last Trigger
          </p>
          <p className="text-xs font-semibold" style={{ color: isActive ? layerColor : "var(--color-text-muted)" }}>
            {meta.recentTrigger.label}
          </p>
          <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "var(--color-text-muted)" }}>
            {meta.recentTrigger.detail}
          </p>
        </div>

        {/* ── Performance delta box ── */}
        {isActive && (
          <div
            className="rounded-lg px-3 py-2.5"
            style={{
              border: "1px dashed rgba(255,255,255,0.1)",
              backgroundColor: "rgba(255,255,255,0.02)",
            }}
          >
            <p
              className="text-[8px] font-bold uppercase tracking-widest mb-2"
              style={{ color: "var(--color-text-muted)" }}
            >
              Performance Delta
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1 text-[10px]">
                {meta.delta.tasksUp
                  ? <TrendingUp size={10} style={{ color: "var(--color-resolved)" }} />
                  : <TrendingDown size={10} style={{ color: "var(--color-warning)" }} />}
                <span style={{ color: "var(--color-text-muted)" }}>Tasks</span>
                <strong style={{ color: meta.delta.tasksUp ? "var(--color-resolved)" : "var(--color-warning)" }}>
                  {meta.delta.tasks}
                </strong>
              </span>
              <span className="flex items-center gap-1 text-[10px]">
                <span style={{ color: "var(--color-text-muted)" }}>Conf</span>
                <strong style={{ color: "var(--color-text-primary)" }}>{meta.delta.confidence}</strong>
              </span>
              <span className="flex items-center gap-1 text-[10px]">
                {meta.delta.latencyUp
                  ? <TrendingUp size={10} style={{ color: "var(--color-warning)" }} />
                  : <TrendingDown size={10} style={{ color: "var(--color-resolved)" }} />}
                <span style={{ color: "var(--color-text-muted)" }}>Latency</span>
                <strong style={{ color: meta.delta.latencyUp ? "var(--color-warning)" : "var(--color-resolved)" }}>
                  {meta.delta.latency}
                </strong>
              </span>
              <span className="flex items-center gap-1 text-[10px]">
                <span style={{ color: "var(--color-text-muted)" }}>Load</span>
                <strong style={{ color: meta.delta.load > 85 ? "var(--color-critical)" : meta.delta.load > 70 ? "var(--color-warning)" : "var(--color-resolved)" }}>
                  {meta.delta.load}%
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Card footer ── */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        {/* Zones */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Globe size={10} style={{ color: "var(--color-text-muted)" }} />
          {meta.zones.map((z) => (
            <Badge
              key={z}
              className="px-1.5 py-px text-[9px] font-medium"
              style={{ backgroundColor: "var(--color-bg-elevated)", color: "var(--color-text-muted)" }}
            >
              {z}
            </Badge>
          ))}
        </div>

        {/* Tag + Configure */}
        <div className="flex items-center gap-2">
          <Badge
            className="gap-1 px-1.5 py-px text-[9px] font-medium"
            style={{ color: tagStyle.color, backgroundColor: tagStyle.bg }}
          >
            <TagIcon size={8} />
            {agent.tag.label}
          </Badge>
          <button
            className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg transition-colors hover:bg-white/10"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          >
            <Settings size={10} />
            Configure
          </button>
        </div>
      </div>
    </div>
  );
}
