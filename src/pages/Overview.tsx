import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  Layers,
  Minus,
  Network,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingDown,
  Users,
  Zap,
} from "lucide-react";
import {
  OVERVIEW_KPIS,
  AGENT_FEED,
  DECISION_QUEUE,
  DOMAIN_TILES_DATA,
  TOPOLOGY_CALLOUT,
  HEALTH_TREND,
  HEALTH_STATS,
  MINDR_PERFORMANCE,
  INCIDENT_DONUT,
  APPROVE_CONFIDENCE_THRESHOLD,
  type AgentState,
  type DecisionItem,
  type TimeWindow,
  type DonutSegment,
} from "../data/overview-data";
import { DOMAINS, canAccessDomain, type DomainId } from "../data/domains";
import { useDomain } from "../contexts/domain";
import { useAuth } from "../contexts/auth";
import { useScenario } from "../contexts/scenario";
import { InfoTooltip } from "../components/flm/InfoTooltip";
import { Badge } from "../components/ui/badge";

// ── Design tokens ──────────────────────────────────────────────────────────────

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

// ── KPI card with hover micro-interaction ──────────────────────────────────────

interface TooltipDef {
  description: string;
  source: string;
  thresholdLabel: string;
}

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  border?: string;
  tooltip?: TooltipDef;
  children?: React.ReactNode;
}

function KpiCard({ label, value, sub, icon: Icon, iconColor, iconBg, border, tooltip, children }: KpiCardProps) {
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
        boxShadow: hov ? "0 8px 28px rgba(0,0,0,0.35)" : "none",
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
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
            {label}
          </p>
          {tooltip && <InfoTooltip {...tooltip} />}
        </div>
        <div className="text-2xl font-bold tabular-nums mt-0.5" style={{ color: "var(--color-text-primary)" }}>
          {value}
        </div>
        {sub && (
          <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{sub}</p>
        )}
        {children}
      </div>
    </div>
  );
}

// ── Smooth Catmull-Rom path ────────────────────────────────────────────────────

function catmullRom(points: [number, number][]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = i > 1 ? points[i - 2] : points[0];
    const p1 = points[i - 1];
    const p2 = points[i];
    const p3 = i < points.length - 1 ? points[i + 1] : p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

// ── Health trend chart (with crosshair tooltip) ───────────────────────────────

function HealthTrendChart({ window: tw }: { window: TimeWindow }) {
  const data = HEALTH_TREND[tw];
  const [tip, setTip] = useState<{ sx: number; sy: number; idx: number } | null>(null);

  const W = 500, H = 130, TOP = 10, BOT = 10;
  const CH = H - TOP - BOT;
  const YMIN = 60, YRANGE = 40;

  function toX(i: number) { return (i / (data.length - 1)) * W; }
  function toY(v: number) { return TOP + (1 - (v - YMIN) / YRANGE) * CH; }

  const tPts = data.map((d, i): [number, number] => [toX(i), toY(d.throughput)]);
  const sPts = data.map((d, i): [number, number] => [toX(i), toY(d.availability)]);

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const idx = Math.min(data.length - 1, Math.max(0, Math.round(relX * (data.length - 1))));
    setTip({ sx: e.clientX - rect.left, sy: e.clientY - rect.top, idx });
  }

  const tgtT = toY(85);
  // NOTE: availability target is 90%. Real-world network availability is typically 99.9%+.
  // Confirm with team whether this represents true availability % or a relative health index.
  const tgtS = toY(90);
  const last = data[data.length - 1];
  const tipData = tip ? data[tip.idx] : null;

  return (
    <div className="relative select-none">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: 150, display: "block", cursor: "crosshair" }}
        onMouseMove={onMove}
        onMouseLeave={() => setTip(null)}
      >
        <defs>
          <linearGradient id="tpFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E9187C" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#E9187C" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[70, 80, 90, 100].map((v) => (
          <line key={v} x1="0" y1={toY(v).toFixed(1)} x2={W} y2={toY(v).toFixed(1)}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}

        {/* Target reference lines */}
        <line x1="0" y1={tgtT.toFixed(1)} x2={W} y2={tgtT.toFixed(1)}
          stroke="rgba(233,24,124,0.28)" strokeWidth="1" strokeDasharray="5 4" />
        <line x1="0" y1={tgtS.toFixed(1)} x2={W} y2={tgtS.toFixed(1)}
          stroke="rgba(45,212,191,0.28)" strokeWidth="1" strokeDasharray="5 4" />

        {/* Area fill */}
        <path d={catmullRom(tPts) + ` L ${W} ${H} L 0 ${H} Z`} fill="url(#tpFill)" />

        {/* Lines */}
        <path d={catmullRom(tPts)} fill="none" stroke="#E9187C" strokeWidth="2" />
        <path d={catmullRom(sPts)} fill="none" stroke="#2DD4BF" strokeWidth="2" />

        {/* End dots */}
        <circle cx={toX(data.length - 1).toFixed(1)} cy={toY(last.throughput).toFixed(1)} r="4" fill="#E9187C" />
        <circle cx={toX(data.length - 1).toFixed(1)} cy={toY(last.availability).toFixed(1)}  r="4" fill="#2DD4BF" />

        {/* Hover crosshair */}
        {tip && (
          <>
            <line x1={toX(tip.idx).toFixed(1)} y1={TOP} x2={toX(tip.idx).toFixed(1)} y2={H - BOT}
              stroke="rgba(255,255,255,0.22)" strokeWidth="1" strokeDasharray="3 2" />
            <circle cx={toX(tip.idx).toFixed(1)} cy={toY(data[tip.idx].throughput).toFixed(1)} r="4" fill="#E9187C" />
            <circle cx={toX(tip.idx).toFixed(1)} cy={toY(data[tip.idx].availability).toFixed(1)}  r="4" fill="#2DD4BF" />
          </>
        )}
      </svg>

      {/* HTML tooltip bubble */}
      {tip && tipData && (
        <div
          className="absolute pointer-events-none z-20 rounded-lg px-3 py-2 text-[11px]"
          style={{
            left: tip.sx,
            top: Math.max(4, tip.sy - 68),
            transform: "translateX(-50%)",
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
          }}
        >
          <p className="font-semibold mb-0.5" style={{ color: "#E9187C" }}>
            Throughput &nbsp;<span className="font-bold">{tipData.throughput}%</span>
          </p>
          <p className="font-semibold" style={{ color: "#2DD4BF" }}>
            Availability &nbsp;<span className="font-bold">{tipData.availability}%</span>
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-5 mt-3">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 inline-block rounded" style={{ backgroundColor: "#E9187C" }} />
          <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Throughput</span>
          <span className="text-[9px] ml-1" style={{ color: "rgba(255,255,255,0.2)" }}>target 85%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 inline-block rounded" style={{ backgroundColor: "#2DD4BF" }} />
          <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Availability</span>
          <span className="text-[9px] ml-1" style={{ color: "rgba(255,255,255,0.2)" }}>target 90%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="20" height="6" viewBox="0 0 20 6">
            <line x1="0" y1="3" x2="20" y2="3" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>Target</span>
        </div>
      </div>
    </div>
  );
}

// ── Donut chart (incident status breakdown) ───────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx: number, cy: number, outerR: number, innerR: number, startDeg: number, endDeg: number): string {
  const GAP = 1.8;
  const s = startDeg + GAP / 2, e = endDeg - GAP / 2;
  const o1 = polarToCartesian(cx, cy, outerR, s);
  const o2 = polarToCartesian(cx, cy, outerR, e);
  const i1 = polarToCartesian(cx, cy, innerR, e);
  const i2 = polarToCartesian(cx, cy, innerR, s);
  const large = e - s > 180 ? 1 : 0;
  return [
    `M ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${o2.x.toFixed(2)} ${o2.y.toFixed(2)}`,
    `L ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${i2.x.toFixed(2)} ${i2.y.toFixed(2)} Z`,
  ].join(" ");
}

function DonutChart({ data }: { data: DonutSegment[] }) {
  const [hov, setHov] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const CX = 80, CY = 80, OR = 64, IR = 42;

  let cum = 0;
  const segs = data.map((d) => {
    const start = cum;
    const sweep = (d.value / total) * 360;
    cum += sweep;
    return { ...d, path: slicePath(CX, CY, OR, IR, start, cum) };
  });

  const active = hov !== null ? segs[hov] : null;

  return (
    <div className="flex flex-col h-full">
      {/* Title */}
      <div className="px-5 py-3.5 shrink-0" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Incident breakdown</p>
        <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>Current period snapshot</p>
      </div>

      {/* SVG donut */}
      <div className="flex items-center justify-center pt-4 pb-2">
        <svg viewBox="0 0 160 160" style={{ width: 160, height: 160 }}>
          {segs.map((seg, i) => (
            <path
              key={i}
              d={seg.path}
              fill={seg.color}
              opacity={hov === null ? 0.88 : hov === i ? 1 : 0.2}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
              style={{ cursor: "pointer", transition: "opacity 0.15s ease" }}
            />
          ))}

          {/* Center content */}
          <text x={CX} y={CY - 8} textAnchor="middle" fill="white"
            style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace" }}>
            {active ? active.value : total}
          </text>
          <text x={CX} y={CY + 8} textAnchor="middle"
            fill={active ? active.color : "rgba(255,255,255,0.4)"}
            style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" }}>
            {active ? active.label : "TOTAL"}
          </text>
          {active && (
            <text x={CX} y={CY + 20} textAnchor="middle" fill="rgba(255,255,255,0.45)"
              style={{ fontSize: 9 }}>
              {Math.round((active.value / total) * 100)}%
            </text>
          )}
        </svg>
      </div>

      {/* Tooltip description */}
      <div className="mx-5 mb-3 px-3 py-2 rounded-lg text-[10px] text-center"
        style={{
          minHeight: 32,
          backgroundColor: active ? `${active.color}12` : "rgba(255,255,255,0.03)",
          border: `1px solid ${active ? active.color + "28" : "var(--color-border)"}`,
          color: active ? active.color : "var(--color-text-muted)",
          transition: "all 0.15s",
        }}>
        {active ? active.description : "Hover a segment for details"}
      </div>

      {/* Legend */}
      <div className="px-5 pb-4 grid grid-cols-2 gap-x-3 gap-y-2">
        {segs.map((seg, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5"
            onMouseEnter={() => setHov(i)}
            onMouseLeave={() => setHov(null)}
            style={{ cursor: "pointer", opacity: hov === null || hov === i ? 1 : 0.35, transition: "opacity 0.15s" }}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-[10px] flex-1" style={{ color: "var(--color-text-muted)", fontWeight: hov === i ? 600 : 400 }}>
              {seg.label}
            </span>
            <span className="text-[10px] font-mono font-bold" style={{ color: seg.color }}>
              {seg.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Overview ───────────────────────────────────────────────────────────────────

export default function Overview() {
  const navigate        = useNavigate();
  const { setDomain }   = useDomain();
  const { role }        = useAuth();
  const { setScenario } = useScenario();

  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [liveKpis,    setLiveKpis]    = useState(OVERVIEW_KPIS);
  const [trendWindow, setTrendWindow] = useState<TimeWindow>("1H");

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
      autoResolved:  prev.autoResolved + 1,
      autonomyPct:   Math.round(((prev.autoResolved + 1) / prev.totalIncidents) * 100),
    }));
  }

  const pendingDecisions = DECISION_QUEUE.filter((d) => !approvedIds.has(d.id));

  // Derive MTTR improvement % from source values so headline and absolutes stay in sync.
  const mttrCur  = liveKpis.mttrCurrentMinutes;
  const mttrBase = liveKpis.mttrBaselineMinutes;
  const mttrPct  = (mttrCur != null && mttrBase != null && mttrBase > 0)
    ? Math.round((mttrBase - mttrCur) / mttrBase * 100)
    : null;

  return (
    <div className="flex flex-col gap-6 pb-10">

      {/* ── 1. HEADER ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
            Network &amp; MINDR Dashboard
          </h1>
          <p className="text-sm mt-0.5 flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
            All domains · live
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#2DD4BF", animation: "pulse-live 1.6s ease-in-out infinite" }} />
          </p>
        </div>
        <div className="text-[11px] flex items-center gap-1.5 mt-1" style={{ color: "var(--color-text-muted)" }}>
          <RefreshCw size={11} />
          Updated just now
        </div>
      </div>

      {/* ── 2. INCIDENT KPIs (5 cards) ─────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>
          Incident overview
        </p>
        <div className="grid grid-cols-5 gap-3">
          {/* Total P1 activity — headline is always the chip sum */}
          {(() => {
            const p1Total = liveKpis.severityCritical + liveKpis.severityPredicted + liveKpis.severityMitigating;
            return (
              <KpiCard
                label="Total P1 activity"
                value={p1Total}
                sub="P1 incidents across all domains"
                icon={AlertTriangle}
                iconColor={p1Total > 0 ? "#FF3B3B" : "#2DD4BF"}
                iconBg={p1Total > 0 ? "rgba(255,59,59,0.1)" : "rgba(45,212,191,0.08)"}
                border={p1Total > 0 ? "1px solid rgba(255,59,59,0.3)" : undefined}
                tooltip={{
                  description: "Total Priority-1 incidents across all domains, broken down by state: critical (active breach), predicted (early-risk detection), and mitigating (remediation in progress). Headline always equals the chip sum.",
                  source: "Cross-domain incident store",
                  thresholdLabel: "Target: 0 critical at end of shift",
                }}
              >
                <div className="flex flex-wrap items-center gap-1 mt-1.5">
                  <Badge className="text-[9px] font-bold" style={{ backgroundColor: "rgba(255,59,59,0.18)", color: "#FF3B3B" }}>
                    {liveKpis.severityCritical} critical
                  </Badge>
                  <Badge className="text-[9px]" style={{ backgroundColor: "rgba(255,176,32,0.12)", color: "#FFB020" }}>
                    {liveKpis.severityPredicted} predicted
                  </Badge>
                  <Badge className="text-[9px]" style={{ backgroundColor: "rgba(45,212,191,0.10)", color: "#2DD4BF" }}>
                    {liveKpis.severityMitigating} mitigating
                  </Badge>
                </div>
              </KpiCard>
            );
          })()}

          {/* Open incidents */}
          <KpiCard
            label="Open incidents"
            value={
              <span>
                {liveKpis.openIncidents}
                <span className="text-base font-normal" style={{ color: "var(--color-text-muted)" }}> / {liveKpis.totalIncidents}</span>
              </span>
            }
            sub="open vs total this period"
            icon={Activity}
            iconColor="#4D9EFF"
            iconBg="rgba(77,158,255,0.08)"
            tooltip={{
              description: "Active and escalated incidents still open right now, shown against the total logged this period. Total equals the sum of all incident breakdown segments.",
              source: "Cross-domain incident store",
              thresholdLabel: "Target: open ratio < 20% of total",
            }}
          />

          {/* Resolved */}
          <KpiCard
            label="Resolved"
            value={liveKpis.autoResolved}
            icon={ShieldCheck}
            iconColor="#2DD4BF"
            iconBg="rgba(45,212,191,0.08)"
            tooltip={{
              description: "Incidents closed by MINDR agents with zero human intervention. Approving a decision in the queue increments this counter and the autonomy rate.",
              source: "MINDR agent event log",
              thresholdLabel: "Target: autonomy rate ≥ 70%",
            }}
          >
            <p className="text-[10px] mt-0.5 font-semibold" style={{ color: "#2DD4BF" }}>
              {liveKpis.autonomyPct}% autonomy rate
            </p>
            <p className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>
              agent-resolved, no human action
            </p>
          </KpiCard>

          {/* Escalated */}
          <KpiCard
            label="Escalated"
            value={liveKpis.escalated}
            sub="escalated to L2 / L3"
            icon={TrendingDown}
            iconColor="#FFB020"
            iconBg="rgba(255,176,32,0.08)"
            tooltip={{
              description: "Incidents that exceeded autonomous resolution capability and were handed to L2 or L3 engineers for manual investigation. Matches the Escalated segment in the incident breakdown donut.",
              source: "Escalation event log",
              thresholdLabel: "Target: ≤ 5% of total incidents",
            }}
          />

          {/* MTTR — absolute time is the headline; % is supporting context (derived, not stored) */}
          <KpiCard
            label="MTTR"
            value={
              <span>
                {mttrCur ?? "??"}
                <span className="text-lg font-normal" style={{ color: "var(--color-text-muted)" }}> min</span>
              </span>
            }
            icon={Timer}
            iconColor="#2DD4BF"
            iconBg="rgba(45,212,191,0.08)"
            border="1px solid rgba(45,212,191,0.2)"
            tooltip={{
              description: "Mean Time To Resolve — current average time from incident open to close. % improvement is relative to the 90-day pre-MINDR baseline. Lower is better.",
              source: "Incident open/close timestamps",
              thresholdLabel: "Target: ≥ 30% faster than baseline",
            }}
          >
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: "#2DD4BF" }}>
              ↓ {mttrPct != null ? `${mttrPct}%` : "—"} faster
            </p>
            <p className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
              was {mttrBase ?? "??"} min · pre-MINDR baseline
            </p>
          </KpiCard>
        </div>
      </div>

      {/* ── 3. NETWORK HEALTH (3 metric cards) ─────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>
          Network health
        </p>
        <div className="grid grid-cols-3 gap-3">
          {/* System health */}
          <KpiCard
            label="System health"
            value={<span>{HEALTH_STATS.systemHealth}<span className="text-lg font-normal">%</span></span>}
            icon={Activity}
            iconColor="#4D9EFF"
            iconBg="rgba(77,158,255,0.08)"
            tooltip={{
              description: "Composite network health score aggregated across all nodes, links, and domains. Weighted average of throughput utilisation, packet-loss rate, and BGP/signalling stability.",
              source: "Cross-domain telemetry aggregate",
              thresholdLabel: "Target: ≥ 90% — amber below 85%",
            }}
          >
            <p className="text-[10px] mt-0.5 font-semibold" style={{ color: "#2DD4BF" }}>
              {HEALTH_STATS.systemHealthDelta} · {HEALTH_STATS.systemHealthWindow}
            </p>
          </KpiCard>

          {/* Affected users */}
          <KpiCard
            label="Affected users"
            value={HEALTH_STATS.affectedUsers}
            icon={Users}
            iconColor="#FFB020"
            iconBg="rgba(255,176,32,0.08)"
            tooltip={{
              description: "Unique subscriber sessions currently experiencing degraded service across all domains. The delta shows improvement vs. the same window one hour ago — down is good.",
              source: "Subscriber impact model",
              thresholdLabel: "Target: < 5K affected subscribers",
            }}
          >
            <p className="text-[10px] mt-0.5 font-semibold flex items-center gap-1" style={{ color: "#2DD4BF" }}>
              <ArrowDown size={10} />
              {HEALTH_STATS.affectedUsersDelta} · {HEALTH_STATS.affectedUsersWindow}
            </p>
          </KpiCard>

          {/* AI confidence */}
          <KpiCard
            label="AI confidence"
            value={<span>{HEALTH_STATS.aiConfidence}<span className="text-lg font-normal">%</span></span>}
            icon={Cpu}
            iconColor="#2DD4BF"
            iconBg="rgba(45,212,191,0.08)"
            tooltip={{
              description: "Average RCA (root-cause analysis) confidence score across all active MINDR agents this period. Low confidence triggers a human review request before autonomous action.",
              source: "MINDR agent telemetry",
              thresholdLabel: "Target: ≥ 85% — review gate below 70%",
            }}
          >
            <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
              {HEALTH_STATS.aiConfidenceTrend === "up"     && <ArrowUp   size={10} style={{ color: "#2DD4BF" }} />}
              {HEALTH_STATS.aiConfidenceTrend === "down"   && <ArrowDown size={10} style={{ color: "#FF3B3B" }} />}
              {HEALTH_STATS.aiConfidenceTrend === "stable" && <Minus     size={10} />}
              {HEALTH_STATS.aiConfidenceTrend === "stable" ? "Stable" : HEALTH_STATS.aiConfidenceTrend === "up" ? "Improving" : "Declining"}
            </p>
          </KpiCard>
        </div>
      </div>

      {/* ── 4. MINDR PERFORMANCE (4 cards) ─────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>
          MINDR performance
        </p>
        <div className="grid grid-cols-4 gap-3">
          <KpiCard
            label="Cases managed"
            value={MINDR_PERFORMANCE.casesManaged}
            sub="all MINDR-assisted cases, incl. predicted"
            icon={Layers}
            iconColor="var(--color-brand)"
            iconBg="rgba(233,24,124,0.08)"
            tooltip={{
              description: "All incidents MINDR was involved in this period — including 3 predicted pipeline cases not yet counted as active incidents in the breakdown donut (50 active + 3 predicted pipeline = 53).",
              source: "MINDR case log",
              thresholdLabel: "Includes 3 predicted cases not yet active",
            }}
          />
          <KpiCard
            label="Autonomously resolved"
            value={MINDR_PERFORMANCE.autonomouslyResolved}
            icon={Zap}
            iconColor="#2DD4BF"
            iconBg="rgba(45,212,191,0.08)"
            border="1px solid rgba(45,212,191,0.2)"
            tooltip={{
              description: "Cases closed end-to-end by MINDR with zero human action required — no engineer review, approval, or manual step. This is the primary measure of AI autonomy.",
              source: "MINDR agent event log",
              thresholdLabel: "Target: ≥ 70% autonomy rate",
            }}
          >
            <p className="text-[10px] mt-0.5 font-semibold" style={{ color: "#2DD4BF" }}>
              {MINDR_PERFORMANCE.autonomyPct}% — zero human action
            </p>
          </KpiCard>
          <KpiCard
            label="Escalated to MINDR"
            value={MINDR_PERFORMANCE.escalatedToMindr}
            sub="handed up from L1 / field teams"
            icon={ArrowUpRight}
            iconColor="#FFB020"
            iconBg="rgba(255,176,32,0.08)"
            tooltip={{
              description: "Cases that L1 engineers or automated field systems could not resolve and handed to MINDR for AI-assisted diagnosis and remediation.",
              source: "L1 escalation event log",
              thresholdLabel: "Target: < 10 escalations per period",
            }}
          />
          <KpiCard
            label="Engineer hours recovered"
            value={<span>{MINDR_PERFORMANCE.hoursRecovered}<span className="text-lg font-normal">h</span></span>}
            sub="vs manual-only operation"
            icon={Clock}
            iconColor="var(--color-brand)"
            iconBg="rgba(233,24,124,0.08)"
            tooltip={{
              description: "Estimated engineer hours freed from manual triage, diagnosis, and remediation tasks this period — calculated by comparing MINDR-assisted MTTR against the pre-MINDR manual baseline.",
              source: "MINDR time-savings model",
              thresholdLabel: "Target: ≥ 40h recovered per period",
            }}
          />
        </div>
      </div>

      {/* ── 5. TREND CHART + DONUT ──────────────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)" }}>

        {/* Trend chart */}
        <div
          className="rounded-xl overflow-hidden flex flex-col"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5 shrink-0"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Network Health Trend
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                Cross-domain throughput &amp; availability — hover to inspect
              </p>
            </div>
            <div
              className="flex items-center gap-px rounded-lg p-px"
              style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
            >
              {(["1H", "6H", "24H", "7D"] as TimeWindow[]).map((w) => (
                <button
                  key={w}
                  onClick={() => setTrendWindow(w)}
                  className="px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors"
                  style={{
                    backgroundColor: trendWindow === w ? "rgba(255,255,255,0.10)" : "transparent",
                    color: trendWindow === w ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  }}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
          <div className="px-5 py-4 flex-1">
            <HealthTrendChart window={trendWindow} />
          </div>
        </div>

        {/* Donut chart */}
        <div
          className="rounded-xl overflow-hidden flex flex-col"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <DonutChart data={INCIDENT_DONUT} />
        </div>

      </div>

      {/* ── 6. NEEDS YOUR DECISION ──────────────────────────────────────── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "var(--color-bg-card)",
          border: pendingDecisions.length > 0 ? "1px solid rgba(233,24,124,0.25)" : "1px solid var(--color-border)",
        }}
      >
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="flex items-center gap-2">
            <Sparkles size={15} style={{ color: "var(--color-brand)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Needs your decision</p>
          </div>
          {pendingDecisions.length > 0 && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(226,0,116,0.15)", color: "var(--color-brand)" }}
            >
              {pendingDecisions.length} pending
            </span>
          )}
        </div>

        {pendingDecisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)" }}
            >
              <CheckCircle2 size={20} style={{ color: "#2DD4BF" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>All caught up</p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>No agent recommendations awaiting approval</p>
          </div>
        ) : (
          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${Math.min(pendingDecisions.length, 3)}, 1fr)` }}
          >
            {pendingDecisions.map((item, idx) => {
              const canInline = item.confidence >= APPROVE_CONFIDENCE_THRESHOLD && item.isLowRisk;
              const isLast = idx === pendingDecisions.length - 1;
              return (
                <div
                  key={item.id}
                  className="px-5 py-4 flex flex-col gap-3"
                  style={{ borderRight: !isLast ? "1px solid var(--color-border)" : "none" }}
                >
                  <span
                    className="self-start text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)" }}
                  >
                    {item.domainLabel}
                  </span>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold leading-snug" style={{ color: "var(--color-text-primary)" }}>
                      {item.title}
                    </p>
                    <p className="text-[11px] mt-1.5" style={{ color: "var(--color-text-muted)" }}>
                      <span className="font-mono font-semibold" style={{ color: "var(--color-brand)" }}>{item.incidentRef}</span>
                      {" · agent recommends · "}
                      <span className="font-semibold" style={{ color: item.confidence >= APPROVE_CONFIDENCE_THRESHOLD ? "#2DD4BF" : "#FFB020" }}>
                        {item.confidence}% confidence
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canInline && (
                      <button
                        onClick={() => handleApprove(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold hover:opacity-85 transition-opacity"
                        style={{ backgroundColor: "rgba(45,212,191,0.12)", color: "#2DD4BF", border: "1px solid rgba(45,212,191,0.25)" }}
                      >
                        <CheckCircle2 size={11} />
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => navigate(item.incidentRoute)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold hover:opacity-85 transition-opacity"
                      style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
                    >
                      Review <ChevronRight size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 7. DOMAINS & TOPOLOGY ───────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>
          Domains
        </p>
        <div className="grid grid-cols-4 gap-4">
          {DOMAIN_TILES_DATA.map(({ domainId, statusLevel, summary }) => {
            const domain = DOMAINS[domainId];
            const accessible = canAccessDomain(domainId, role);
            const [tilHov, setTilHov] = useState(false);
            return (
              <button
                key={domainId}
                disabled={!accessible}
                onClick={() => accessible && handleDrillIn(domainId)}
                onMouseEnter={() => setTilHov(true)}
                onMouseLeave={() => setTilHov(false)}
                className="rounded-xl px-5 py-4 text-left disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: "var(--color-bg-card)",
                  border: `1px solid ${tilHov && accessible ? domain.color + "55" : "var(--color-border)"}`,
                  transform: tilHov && accessible ? "translateY(-2px)" : "none",
                  boxShadow: tilHov && accessible ? `0 6px 20px rgba(0,0,0,0.3)` : "none",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_DOT[statusLevel] }} />
                    <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{domain.label}</span>
                  </div>
                  {accessible && <ChevronRight size={13} style={{ color: "var(--color-text-muted)" }} />}
                </div>
                <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>{summary}</p>
              </button>
            );
          })}

          <button
            onClick={() => navigate(TOPOLOGY_CALLOUT.route)}
            className="rounded-xl px-5 py-4 text-left hover:opacity-85 transition-opacity"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Network size={13} style={{ color: "var(--color-text-muted)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Knowledge Graph</span>
              </div>
              <ChevronRight size={13} style={{ color: "var(--color-text-muted)" }} />
            </div>
            <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
              Worst:{" "}
              <span className="font-mono font-semibold" style={{ color: "#FFB020" }}>{TOPOLOGY_CALLOUT.region}</span>
              {" · "}
              <span className="font-semibold" style={{ color: "#FFB020" }}>{TOPOLOGY_CALLOUT.state}</span>
            </p>
          </button>
        </div>
      </div>

      {/* ── 8. AGENT TASK FEED (full-width, no load panel) ──────────────── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>
          Active agent tasks
        </p>
        <div
          className="rounded-xl overflow-hidden flex flex-col"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)", maxHeight: 400 }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5 shrink-0"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#2DD4BF", animation: "pulse-live 1.6s ease-in-out infinite" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {AGENT_FEED.length} tasks in progress
              </p>
            </div>
            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>All domains · live</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "var(--color-border)" }}>
            {AGENT_FEED.map((item) => {
              const cfg = STATE_CFG[item.state];
              return (
                <button
                  key={item.id}
                  className="w-full flex items-start gap-3 px-5 py-3 text-left hover:bg-white/[0.025] transition-colors"
                  onClick={() => navigate(item.incidentRoute)}
                >
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 whitespace-nowrap"
                    style={{ color: cfg.color, backgroundColor: cfg.bg, border: cfg.border ?? "none" }}
                  >
                    {item.state.toUpperCase()}
                  </span>
                  <p className="flex-1 text-[12px] leading-snug" style={{ color: "var(--color-text-primary)" }}>
                    {item.action}
                  </p>
                  <div className="flex flex-col items-end gap-0.5 shrink-0 min-w-[80px]">
                    <span className="text-[10px] font-semibold font-mono" style={{ color: "var(--color-brand)" }}>
                      {item.incidentRef}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{item.domainLabel}</span>
                    <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{item.relativeTime}</span>
                  </div>
                </button>
              );
            })}
          </div>
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
