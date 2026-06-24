import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, AlertTriangle, ArrowDown, ChevronRight,
  Clock, PhoneCall, PhoneMissed, RefreshCw, Shield, Users,
} from "lucide-react";
import {
  VOLTE_KPIS, VOLTE_TREND, VOLTE_INCIDENTS,
  type TimeWindow, type TrendPoint,
} from "../../data/volte-data";

// ── Design tokens ──────────────────────────────────────────────────────────────

const SEV_COLOR: Record<string, string> = {
  Critical: "#FF3B3B", High: "#FFB020", Medium: "#4D9EFF", Investigating: "#FFB020", Open: "#FF3B3B",
};
const SEV_BG: Record<string, string> = {
  Critical: "rgba(255,59,59,0.12)", High: "rgba(255,176,32,0.12)",
  Medium: "rgba(77,158,255,0.12)", Investigating: "rgba(255,176,32,0.12)", Open: "rgba(255,59,59,0.12)",
};

// ── KPI card with hover micro-interaction ──────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, iconColor, iconBg, border, children }: {
  label: string; value: React.ReactNode; sub?: string;
  icon: React.ElementType; iconColor: string; iconBg: string; border?: string;
  children?: React.ReactNode;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="rounded-xl px-4 py-4 flex items-start gap-3"
      style={{
        backgroundColor: "var(--color-bg-card)", border: border ?? "1px solid var(--color-border)",
        transform: hov ? "translateY(-2px) scale(1.012)" : "translateY(0) scale(1)",
        boxShadow: hov ? "0 8px 24px rgba(0,0,0,0.35)" : "none",
        transition: "transform 0.15s ease, box-shadow 0.15s ease", cursor: "default",
      }}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: iconBg }}>
        <Icon size={16} style={{ color: iconColor }} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{label}</p>
        <div className="text-2xl font-bold tabular-nums mt-0.5" style={{ color: "var(--color-text-primary)" }}>{value}</div>
        {sub && <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{sub}</p>}
        {children}
      </div>
    </div>
  );
}

// ── catmullRom smooth path ─────────────────────────────────────────────────────

function catmullRom(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = i > 1 ? pts[i - 2] : pts[0];
    const p1 = pts[i - 1], p2 = pts[i], p3 = i < pts.length - 1 ? pts[i + 1] : p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6, cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6, cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

// ── Mini trend chart (single metric) ─────────────────────────────────────────

function MiniChart({
  data, accessor, yMin, yMax, targetY, color, targetColor, h = 72, tooltip,
}: {
  data: TrendPoint[];
  accessor: (p: TrendPoint) => number;
  yMin: number; yMax: number;
  targetY: number;
  color: string; targetColor: string;
  h?: number;
  tooltip?: (p: TrendPoint) => string;
}) {
  const [tipIdx, setTipIdx] = useState<number | null>(null);
  const W = 420, PAD = 6;
  const range = yMax - yMin;

  function toX(i: number) { return PAD + (i / (data.length - 1)) * (W - PAD * 2); }
  function toY(v: number) { return h - PAD - ((v - yMin) / range) * (h - PAD * 2); }

  const pts = data.map((p, i): [number, number] => [toX(i), toY(accessor(p))]);
  const tY = toY(targetY);
  const last = data[data.length - 1];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none" className="w-full"
        style={{ height: h, display: "block", cursor: "crosshair" }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const relX = (e.clientX - rect.left) / rect.width;
          setTipIdx(Math.min(data.length - 1, Math.max(0, Math.round(relX * (data.length - 1)))));
        }}
        onMouseLeave={() => setTipIdx(null)}
      >
        <line x1={PAD} y1={tY.toFixed(1)} x2={W - PAD} y2={tY.toFixed(1)}
          stroke={targetColor} strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
        <path d={catmullRom(pts)} fill="none" stroke={color} strokeWidth="2" />
        <circle cx={toX(data.length - 1).toFixed(1)} cy={toY(accessor(last)).toFixed(1)} r="4" fill={color} />
        {tipIdx !== null && (
          <>
            <line x1={toX(tipIdx).toFixed(1)} y1={PAD} x2={toX(tipIdx).toFixed(1)} y2={h - PAD}
              stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3 2" />
            <circle cx={toX(tipIdx).toFixed(1)} cy={toY(accessor(data[tipIdx])).toFixed(1)} r="4" fill={color} />
          </>
        )}
      </svg>
      {tipIdx !== null && tooltip && (
        <div className="absolute pointer-events-none z-20 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold"
          style={{
            left: `${(tipIdx / (data.length - 1)) * 100}%`, bottom: "calc(100% + 6px)",
            transform: "translateX(-50%)", backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)", color, whiteSpace: "nowrap",
          }}>
          {tooltip(data[tipIdx])}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VolteDashboard() {
  const navigate      = useNavigate();
  const [tw, setTw]   = useState<TimeWindow>("1H");
  const data          = VOLTE_TREND[tw];
  const recentIncidents = VOLTE_INCIDENTS.slice(0, 3);

  const cdrHealthy = VOLTE_KPIS.callDropRate <= 1.5;
  const imsHealthy = VOLTE_KPIS.imsHealth >= 90;
  const epcHealthy = VOLTE_KPIS.epcHealth >= 90;

  return (
    <div className="flex flex-col gap-6 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
            Volte dashboard
          </h1>
          <p className="text-sm mt-0.5 flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
            Volte module · live
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#2DD4BF", animation: "pulse-live 1.6s ease-in-out infinite" }} />
          </p>
        </div>
        <div className="text-[11px] flex items-center gap-1.5 mt-1" style={{ color: "var(--color-text-muted)" }}>
          <RefreshCw size={11} />Updated just now
        </div>
      </div>

      {/* KPI strip */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>Service health</p>
        <div className="grid grid-cols-4 gap-3">
          <KpiCard label="Call drop rate" value={<span style={{ color: cdrHealthy ? "#2DD4BF" : "#FF3B3B" }}>{VOLTE_KPIS.callDropRate}%</span>}
            sub="target ≤ 1.5%" icon={PhoneMissed} iconColor={cdrHealthy ? "#2DD4BF" : "#FF3B3B"}
            iconBg={cdrHealthy ? "rgba(45,212,191,0.08)" : "rgba(255,59,59,0.08)"}
            border={cdrHealthy ? undefined : "1px solid rgba(255,59,59,0.3)"} />
          <KpiCard label="IMS health" value={<span style={{ color: imsHealthy ? "#2DD4BF" : "#FFB020" }}>{VOLTE_KPIS.imsHealth}%</span>}
            sub="response success" icon={Activity} iconColor={imsHealthy ? "#2DD4BF" : "#FFB020"}
            iconBg={imsHealthy ? "rgba(45,212,191,0.08)" : "rgba(255,176,32,0.08)"} />
          <KpiCard label="EPC health" value={<span style={{ color: epcHealthy ? "#2DD4BF" : "#FFB020" }}>{VOLTE_KPIS.epcHealth}%</span>}
            sub="session success" icon={Activity} iconColor={epcHealthy ? "#2DD4BF" : "#FFB020"}
            iconBg={epcHealthy ? "rgba(45,212,191,0.08)" : "rgba(255,176,32,0.08)"} />
          <KpiCard label="Active incidents" value={VOLTE_KPIS.activeIncidents}
            icon={AlertTriangle} iconColor="#FF3B3B" iconBg="rgba(255,59,59,0.08)" border="1px solid rgba(255,59,59,0.25)">
            <div className="flex flex-wrap gap-1 mt-1.5">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(255,59,59,0.12)", color: "#FF3B3B" }}>
                {VOLTE_KPIS.incidentBreakdown.critical} critical
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(255,176,32,0.12)", color: "#FFB020" }}>
                {VOLTE_KPIS.incidentBreakdown.high} high
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(77,158,255,0.12)", color: "#4D9EFF" }}>
                {VOLTE_KPIS.incidentBreakdown.medium} medium
              </span>
            </div>
          </KpiCard>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <KpiCard label="Affected subscribers" value={VOLTE_KPIS.affectedSubscribers}
            icon={Users} iconColor="#FFB020" iconBg="rgba(255,176,32,0.08)">
            <p className="text-[10px] mt-0.5 font-semibold flex items-center gap-1" style={{ color: "#2DD4BF" }}>
              <ArrowDown size={10} />{VOLTE_KPIS.subscriberDelta}
            </p>
          </KpiCard>
          <KpiCard label="MINDR resolutions" value={VOLTE_KPIS.mindrResolutions}
            icon={Shield} iconColor="#2DD4BF" iconBg="rgba(45,212,191,0.08)" border="1px solid rgba(45,212,191,0.2)">
            <p className="text-[10px] mt-0.5 font-semibold" style={{ color: "#2DD4BF" }}>{VOLTE_KPIS.autonomyPct}% autonomous</p>
          </KpiCard>
          <KpiCard label="MTTR reduction" value={<span style={{ color: "#2DD4BF" }}>−{VOLTE_KPIS.mttrReduction}%</span>}
            sub="vs pre-MINDR baseline" icon={Clock} iconColor="#2DD4BF" iconBg="rgba(45,212,191,0.08)" />
        </div>
      </div>

      {/* Trend chart + recent incidents */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)" }}>

        {/* Trend card */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>KPI trend</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>Hover to inspect — dashed line = target</p>
            </div>
            <div className="flex items-center gap-px rounded-lg p-px" style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
              {(["1H", "6H", "24H", "7D"] as TimeWindow[]).map((w) => (
                <button key={w} onClick={() => setTw(w)}
                  className="px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors"
                  style={{ backgroundColor: tw === w ? "rgba(255,255,255,0.10)" : "transparent",
                    color: tw === w ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                  {w}
                </button>
              ))}
            </div>
          </div>
          <div className="px-5 py-4 space-y-5">
            {/* CSSR */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <PhoneCall size={12} style={{ color: "#2DD4BF" }} />
                  <span className="text-[11px] font-semibold" style={{ color: "var(--color-text-primary)" }}>Call Setup Success Rate</span>
                  <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>target 98.5%</span>
                </div>
                <span className="text-sm font-bold tabular-nums" style={{ color: "#2DD4BF" }}>
                  {data[data.length - 1].cssr.toFixed(1)}%
                </span>
              </div>
              <MiniChart data={data} accessor={(p) => p.cssr} yMin={94} yMax={101}
                targetY={98.5} color="#2DD4BF" targetColor="#2DD4BF" h={72}
                tooltip={(p) => `CSSR: ${p.cssr.toFixed(1)}%`} />
            </div>
            <div style={{ borderTop: "1px solid var(--color-border)" }} />
            {/* CDR */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <PhoneMissed size={12} style={{ color: "#FF3B3B" }} />
                  <span className="text-[11px] font-semibold" style={{ color: "var(--color-text-primary)" }}>Call Drop Rate</span>
                  <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>target ≤ 1.5%</span>
                </div>
                <span className="text-sm font-bold tabular-nums" style={{ color: "#FF3B3B" }}>
                  {data[data.length - 1].cdr.toFixed(1)}%
                </span>
              </div>
              <MiniChart data={data} accessor={(p) => p.cdr} yMin={0} yMax={5}
                targetY={1.5} color="#FF3B3B" targetColor="#FF3B3B" h={72}
                tooltip={(p) => `CDR: ${p.cdr.toFixed(1)}%`} />
            </div>
          </div>
        </div>

        {/* Recent incidents */}
        <div className="rounded-xl overflow-hidden flex flex-col"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="flex items-center justify-between px-5 py-3.5 shrink-0"
            style={{ borderBottom: "1px solid var(--color-border)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Recent incidents</p>
            <button onClick={() => navigate("/volte/incidents")}
              className="text-[11px] font-semibold flex items-center gap-0.5 hover:opacity-70 transition-opacity"
              style={{ color: "#2DD4BF" }}>
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex-1 divide-y" style={{ borderColor: "var(--color-border)" }}>
            {recentIncidents.map((inc) => (
              <button key={inc.id} onClick={() => navigate(`/volte/incidents/${inc.id}`)}
                className="w-full flex flex-col gap-2 px-5 py-4 text-left hover:bg-white/[0.025] transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[12px] font-semibold leading-snug" style={{ color: "var(--color-text-primary)" }}>{inc.title}</span>
                  <span className="inline-flex items-center shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold"
                    style={{ color: SEV_COLOR[inc.severity], backgroundColor: SEV_BG[inc.severity] }}>
                    {inc.severity}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold"
                      style={{ color: SEV_COLOR[inc.status], backgroundColor: SEV_BG[inc.status] }}>
                      {inc.status}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                      {inc.affectedSubscribers.toLocaleString()} subscribers
                    </span>
                  </div>
                  <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{inc.openedAt}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse-live { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
