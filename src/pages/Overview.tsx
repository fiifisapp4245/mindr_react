import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Network,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  OVERVIEW_KPIS,
  AGENT_FEED,
  DECISION_QUEUE,
  DOMAIN_TILES_DATA,
  TOPOLOGY_CALLOUT,
  APPROVE_CONFIDENCE_THRESHOLD,
  type AgentState,
  type DecisionItem,
} from "../data/overview-data";
import { DOMAINS, canAccessDomain, type DomainId } from "../data/domains";
import { useDomain } from "../contexts/domain";
import { useAuth } from "../contexts/auth";
import { useScenario } from "../contexts/scenario";

// ── Design tokens ─────────────────────────────────────────────────────────────

const STATE_CFG: Record<AgentState, { color: string; bg: string; border?: string }> = {
  Resolved:   { color: "#2DD4BF", bg: "rgba(45,212,191,0.12)" },
  Diagnosing: { color: "#4D9EFF", bg: "rgba(77,158,255,0.12)" },
  Escalated:  { color: "#FFB020", bg: "rgba(255,176,32,0.12)" },
  Monitoring: { color: "var(--color-text-muted)", bg: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" },
};

const STATUS_DOT: Record<"critical" | "warning" | "ok", string> = {
  critical: "#FF3B3B",
  warning:  "#FFB020",
  ok:       "#2DD4BF",
};

// ── Overview ──────────────────────────────────────────────────────────────────

export default function Overview() {
  const navigate = useNavigate();
  const { setDomain }   = useDomain();
  const { role }        = useAuth();
  const { setScenario } = useScenario();

  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [liveKpis, setLiveKpis] = useState(OVERVIEW_KPIS);

  function handleDrillIn(domainId: Exclude<DomainId, "all">) {
    const domain = DOMAINS[domainId];
    setDomain(domainId);
    setScenario(domain.scenarioId);
    navigate(domain.defaultRoute);
  }

  function handleApprove(item: DecisionItem) {
    setApprovedIds((prev) => new Set([...prev, item.id]));
    setLiveKpis((prev) => ({
      ...prev,
      openIncidents: Math.max(0, prev.openIncidents - 1),
      autoResolved: prev.autoResolved + 1,
      autonomyPct: Math.round(((prev.autoResolved + 1) / prev.totalIncidents) * 100),
    }));
  }

  const pendingDecisions = DECISION_QUEUE.filter((d) => !approvedIds.has(d.id));

  return (
    <div className="flex flex-col gap-6 pb-8">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
            Operations overview
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

      {/* ── KPI strip ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Active P1",
            value: String(liveKpis.activeP1),
            sub: "open Priority-1 incidents",
            icon: AlertTriangle,
            color: liveKpis.activeP1 > 0 ? "#FF3B3B" : "#2DD4BF",
            bg:    liveKpis.activeP1 > 0 ? "rgba(255,59,59,0.08)" : "rgba(45,212,191,0.08)",
          },
          {
            label: "Open incidents",
            value: `${liveKpis.openIncidents} / ${liveKpis.totalIncidents}`,
            sub: "open vs total this period",
            icon: Activity,
            color: "#4D9EFF",
            bg:    "rgba(77,158,255,0.08)",
          },
          {
            label: "Auto-resolved by MINDR",
            value: String(liveKpis.autoResolved),
            sub: `${liveKpis.autonomyPct}% autonomy rate`,
            icon: ShieldCheck,
            color: "#2DD4BF",
            bg:    "rgba(45,212,191,0.08)",
          },
          {
            label: "Escalated",
            value: String(liveKpis.escalated),
            sub: "escalated to L2 / L3",
            icon: TrendingUp,
            color: "#FFB020",
            bg:    "rgba(255,176,32,0.08)",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl px-5 py-4 flex items-start gap-4"
              style={{
                backgroundColor: "var(--color-bg-card)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: card.bg }}
              >
                <Icon size={18} style={{ color: card.color }} strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                  {card.label}
                </p>
                <p className="text-2xl font-bold tabular-nums mt-0.5" style={{ color: "var(--color-text-primary)" }}>
                  {card.value}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {card.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main panels ─────────────────────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr minmax(300px, 0.65fr)" }}>

        {/* Agent activity feed */}
        <div
          className="rounded-xl overflow-hidden flex flex-col"
          style={{
            backgroundColor: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            maxHeight: 480,
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5 shrink-0"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "#2DD4BF", animation: "pulse-live 1.6s ease-in-out infinite" }}
              />
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {AGENT_FEED.length} agents working
              </p>
            </div>
            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
              All domains · live
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "var(--color-border)" }}>
            {AGENT_FEED.map((item) => {
              const cfg = STATE_CFG[item.state];
              return (
                <button
                  key={item.id}
                  className="w-full flex items-start gap-3 px-5 py-3.5 text-left hover:bg-white/[0.025] transition-colors"
                  onClick={() => navigate(item.incidentRoute)}
                >
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 whitespace-nowrap"
                    style={{
                      color: cfg.color,
                      backgroundColor: cfg.bg,
                      border: cfg.border ?? "none",
                    }}
                  >
                    {item.state.toUpperCase()}
                  </span>
                  <p className="flex-1 text-[12px] leading-snug" style={{ color: "var(--color-text-primary)" }}>
                    {item.action}
                  </p>
                  <div className="flex flex-col items-end gap-0.5 shrink-0 min-w-[72px]">
                    <span className="text-[10px] font-semibold font-mono" style={{ color: "var(--color-brand)" }}>
                      {item.incidentRef}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                      {item.domainLabel}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                      {item.relativeTime}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Needs your decision */}
        <div
          className="rounded-xl overflow-hidden flex flex-col"
          style={{
            backgroundColor: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            maxHeight: 480,
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5 shrink-0"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} style={{ color: "var(--color-brand)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Needs your decision
              </p>
            </div>
            {pendingDecisions.length > 0 && (
              <span
                className="text-[10px] font-bold px-1.5 py-px rounded-full"
                style={{ backgroundColor: "rgba(226,0,116,0.15)", color: "var(--color-brand)" }}
              >
                {pendingDecisions.length}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {pendingDecisions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)" }}
                >
                  <CheckCircle2 size={22} style={{ color: "#2DD4BF" }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  All caught up
                </p>
                <p className="text-xs text-center px-6" style={{ color: "var(--color-text-muted)" }}>
                  No agent recommendations awaiting approval
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {pendingDecisions.map((item) => {
                  const canInlineApprove =
                    item.confidence >= APPROVE_CONFIDENCE_THRESHOLD && item.isLowRisk;
                  return (
                    <div key={item.id} className="px-5 py-4 flex flex-col gap-3">
                      <div>
                        <p className="text-[13px] font-semibold leading-snug" style={{ color: "var(--color-text-primary)" }}>
                          {item.title}
                        </p>
                        <p className="text-[11px] mt-1" style={{ color: "var(--color-text-muted)" }}>
                          <span className="font-mono font-semibold" style={{ color: "var(--color-brand)" }}>
                            {item.incidentRef}
                          </span>
                          {" · agent recommends · "}
                          <span
                            className="font-semibold"
                            style={{
                              color: item.confidence >= APPROVE_CONFIDENCE_THRESHOLD ? "#2DD4BF" : "#FFB020",
                            }}
                          >
                            {item.confidence}% confidence
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {canInlineApprove && (
                          <button
                            onClick={() => handleApprove(item)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold hover:opacity-85 transition-opacity"
                            style={{
                              backgroundColor: "rgba(45,212,191,0.12)",
                              color: "#2DD4BF",
                              border: "1px solid rgba(45,212,191,0.25)",
                            }}
                          >
                            <CheckCircle2 size={12} />
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => navigate(item.incidentRoute)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold hover:opacity-85 transition-opacity"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.06)",
                            color: "var(--color-text-muted)",
                            border: "1px solid var(--color-border)",
                          }}
                        >
                          Review
                          <ChevronRight size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Domain tiles + topology callout ─────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {DOMAIN_TILES_DATA.map(({ domainId, statusLevel, summary }) => {
          const domain = DOMAINS[domainId];
          const accessible = canAccessDomain(domainId, role);
          return (
            <button
              key={domainId}
              disabled={!accessible}
              onClick={() => accessible && handleDrillIn(domainId)}
              className="rounded-xl px-5 py-4 text-left transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--color-bg-card)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_DOT[statusLevel] }}
                  />
                  <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    {domain.label}
                  </span>
                </div>
                {accessible && (
                  <ChevronRight size={14} style={{ color: "var(--color-text-muted)" }} />
                )}
              </div>
              <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                {summary}
              </p>
              {!accessible && (
                <p className="text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Not assigned
                </p>
              )}
            </button>
          );
        })}

        {/* Topology callout */}
        <button
          onClick={() => navigate(TOPOLOGY_CALLOUT.route)}
          className="rounded-xl px-5 py-4 text-left transition-opacity hover:opacity-85"
          style={{
            backgroundColor: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Network size={14} style={{ color: "var(--color-text-muted)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Topology
              </span>
            </div>
            <ChevronRight size={14} style={{ color: "var(--color-text-muted)" }} />
          </div>
          <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            Worst:{" "}
            <span className="font-mono font-semibold" style={{ color: "#FFB020" }}>
              {TOPOLOGY_CALLOUT.region}
            </span>
            {" "}
            <span className="font-semibold" style={{ color: "#FFB020" }}>
              {TOPOLOGY_CALLOUT.state}
            </span>
          </p>
        </button>
      </div>

      <style>{`
        @keyframes pulse-live {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
