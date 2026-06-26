import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  AlertTriangle,
  ChevronRight,
  Info,
  Zap,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { ConfirmModal } from "../components/shared/ConfirmModal";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";
import { useAuth } from "../contexts/auth";
import { INCIDENTS } from "../data/incidents";
import { IncidentDetail as IncidentDetailComponent } from "../components/incidents/IncidentDetail";
import { useFLMIncidents } from "../contexts/flm-incidents";
import { InfoTooltip } from "../components/flm/InfoTooltip";
import {
  computeBand,
  bandColor,
  bandBg,
  bandLabel,
  buildoutColor,
  buildoutBg,
  CONGESTED_IFACE_THRESHOLDS,
  TRAFFIC_SPIKE_THRESHOLDS,
  ROUTE_DEV_THRESHOLDS,
  CONFIDENCE_THRESHOLDS,
  type FLMIncident,
} from "../data/flm-incident-store";

// ─── Admin detail ─────────────────────────────────────────────────────────────

const STATUS_COLOR = {
  active:     "var(--color-critical)",
  predicted:  "var(--color-warning)",
  mitigating: "var(--color-mitigating)",
} as const;

function AdminIncidentDetail() {
  const { id } = useParams() as { id: string };
  const incident = INCIDENTS.find((i) => i.id === id);

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertTriangle size={40} style={{ color: "var(--color-text-muted)" }} />
        <p className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Incident not found
        </p>
        <Link to="/incidents" className="text-sm font-medium transition-opacity hover:opacity-80" style={{ color: "var(--color-brand)" }}>
          ← Back to Incidents
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
        <Link to="/incidents" className="font-medium transition-colors hover:opacity-80 flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
          Incidents
        </Link>
        <ChevronRight size={12} style={{ opacity: 0.5 }} />
        <span
          className="text-[10px] font-semibold px-1.5 py-px rounded uppercase tracking-wide"
          style={{ color: STATUS_COLOR[incident.status], backgroundColor: `${STATUS_COLOR[incident.status]}20` }}
        >
          {incident.ref}
        </span>
        <ChevronRight size={12} style={{ opacity: 0.5 }} />
        <span className="font-medium truncate max-w-xs" style={{ color: "var(--color-text-primary)" }}>
          {incident.title}
        </span>
      </nav>
      <IncidentDetailComponent incident={incident} />
    </div>
  );
}

// ─── FLM detail — shared sub-components ──────────────────────────────────────

function SLABar({ percent }: { percent: number }) {
  const color =
    percent >= 80 ? "var(--color-warning)"
    : percent >= 50 ? "#f97316"
    : percent > 0 ? "var(--color-critical)"
    : "var(--color-resolved)";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: percent > 0 ? `${percent}%` : "100%", backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold shrink-0" style={{ color }}>
        {percent > 0 ? `${percent}%` : "Met"}
      </span>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg p-4 ${className}`}
      style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>
      {children}
    </p>
  );
}

// SVG arc gauge
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const s = polarToCartesian(cx, cy, r, startAngle);
  const e = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

function UtilGauge({ value, color, size = 96 }: { value: number; color: string; size?: number }) {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.38;
  const sw = size * 0.09;
  const START = 135, SWEEP = 270;
  const end = START + SWEEP * Math.min(1, value / 100);
  const trackD = arcPath(cx, cy, r, START, START + SWEEP);
  const fillD = value > 0 ? arcPath(cx, cy, r, START, end) : null;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`${value}% utilization`}>
      <path d={trackD} stroke="rgba(255,255,255,0.07)" strokeWidth={sw} fill="none" strokeLinecap="round" />
      {fillD && <path d={fillD} stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" />}
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={size * 0.14} fontWeight="bold" fill={color} fontFamily="var(--font-ui)">
        {value}%
      </text>
    </svg>
  );
}

function FLMChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg text-xs"
      style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
    >
      <p style={{ color: "var(--color-text-muted)" }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold mt-0.5" style={{ color: p.color ?? p.stroke ?? "var(--color-text-primary)" }}>
          {p.name}: {p.value}{typeof p.value === "number" && p.unit ? p.unit : ""}
        </p>
      ))}
    </div>
  );
}

// ─── Action modal config ──────────────────────────────────────────────────────

type PendingAction = "notifyCdn" | "close" | null;

const MODAL_CFG: Record<NonNullable<PendingAction>, {
  title: (ref: string) => string;
  body: string;
  confirmLabel: string;
  confirmColor: string;
}> = {
  notifyCdn: {
    title: (ref) => `Notify CDN for ${ref}?`,
    body: "This will notify the CDN provider to load-balance and reroute traffic per the recommended action. The CDN will begin redistributing traffic away from the congested peering link.",
    confirmLabel: "Notify CDN",
    confirmColor: "var(--color-brand)",
  },
  close: {
    title: (ref) => `Close ${ref}?`,
    body: "Closes this incident and applies the Scenario 1 happy path — KPIs will flip to stable/green and the incident will move to the resolved filter.",
    confirmLabel: "Close Incident",
    confirmColor: "var(--color-resolved)",
  },
};

// ─── FLM detail page ──────────────────────────────────────────────────────────

function FLMIncidentDetailPage({ inc }: { inc: FLMIncident }) {
  const { notifyCdn, close, toggleStep, checkedSteps } = useFLMIncidents();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [cdnNote, setCdnNote] = useState("");
  const [cdnNotified, setCdnNotified] = useState(false);

  const steps = inc.rootCause.steps;
  const myChecked = checkedSteps[inc.id] ?? new Set<number>();

  const isActionable = inc.status === "Open" || inc.status === "In Progress";

  // Band 1 KPIs
  const portBand  = computeBand(inc.portUtilizationMax, inc.portUtilThresholds);
  const ifaceBand = computeBand(inc.congestedInterfaces, CONGESTED_IFACE_THRESHOLDS);
  const spikeBand = computeBand(inc.trafficSpikePercent, TRAFFIC_SPIKE_THRESHOLDS);

  // Band 2
  const weeklyMax = Math.max(...inc.weeklyUtilTrend.map((p) => p.util));
  const weeklyBand = computeBand(weeklyMax, { t1: 90, t2: 100, direction: "lower-better" });

  // Band 3
  const routeDevBand = computeBand(inc.routeDeviationPercent, ROUTE_DEV_THRESHOLDS);

  // Right pane
  const confBand    = computeBand(inc.rootCause.confidence, CONFIDENCE_THRESHOLDS);
  const altBand     = computeBand(inc.altPathHeadroom, inc.altPathThresholds);

  function handleConfirm() {
    if (!pendingAction) return;
    if (pendingAction === "notifyCdn") {
      notifyCdn(inc.id);
      setCdnNotified(true);
    } else {
      close(inc.id);
    }
    setPendingAction(null);
    setCdnNote("");
  }

  function handleCloseModal() {
    setPendingAction(null);
    setCdnNote("");
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
        <Link to="/incidents" className="font-medium hover:opacity-80 transition-opacity" style={{ color: "var(--color-text-muted)" }}>
          Incidents
        </Link>
        <ChevronRight size={12} style={{ opacity: 0.5 }} />
        <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {inc.ref}
        </span>
      </nav>

      {/* Main layout: content + right pane */}
      <div className="flex gap-6 items-start">

        {/* ── Main content area ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Incident header */}
          <Card>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[10px] font-bold px-2 py-1 rounded"
                  style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
                >
                  {inc.ref}
                </span>
                <span
                  className="text-[10px] font-semibold px-2 py-1 rounded"
                  style={{ backgroundColor: "rgba(255,59,59,0.15)", color: "var(--color-critical)" }}
                >
                  {inc.severity.toUpperCase()}
                </span>
                <span
                  className="text-[10px] font-semibold px-2 py-1 rounded"
                  style={{
                    backgroundColor: inc.status === "Resolved" ? "rgba(45,212,191,0.12)" : inc.status === "Escalated" ? "rgba(77,158,255,0.12)" : "var(--color-bg-elevated)",
                    border: "1px solid var(--color-border)",
                    color: inc.status === "Resolved" ? "var(--color-resolved)" : inc.status === "Escalated" ? "var(--color-mitigating)" : "var(--color-text-muted)",
                  }}
                >
                  {inc.status.toUpperCase()}
                </span>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Opened {inc.openedAt}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>Ref: {inc.alarmRef}</p>
              </div>
            </div>
            <h1 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              {inc.title}
            </h1>
            {inc.slaMinutes > 0 ? (
              <div className="flex items-center gap-3 text-xs mb-4">
                <span style={{ color: "var(--color-text-muted)" }}>SLA: {inc.slaRemaining} remaining</span>
                <div className="flex-1">
                  <SLABar percent={inc.slaPercent} />
                </div>
              </div>
            ) : (
              <p className="text-xs mb-4" style={{ color: "var(--color-resolved)" }}>SLA: Met</p>
            )}

            {/* Affected scope */}
            <SectionLabel>Affected scope</SectionLabel>
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
                  <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{label}</p>
                  <p className="text-xs font-medium mt-0.5 break-all" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* ── BAND 1: How bad now? ─────────────────────────────────────────── */}
          <div>
            <p className="text-[11px] font-semibold mb-3 flex items-center gap-1.5" style={{ color: "var(--color-text-muted)" }}>
              <span className="w-1 h-3 rounded-full inline-block" style={{ backgroundColor: "var(--color-critical)" }} />
              BAND 1 — HOW BAD NOW?
            </p>

            {/* 3-column KPI row */}
            <div className="grid grid-cols-3 gap-4 mb-4">

              {/* Port Utilization Gauge */}
              <Card>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-[11px] font-semibold leading-tight" style={{ color: "var(--color-text-primary)" }}>
                    Port Utilization (Max)
                  </p>
                  <InfoTooltip
                    description="Maximum port utilization on any affected interface. ≥90% is congested; ≥100% means packets are being dropped."
                    source="SNMP"
                    thresholdLabel="Healthy <70% · Watch 70–90% · Critical ≥90%"
                  />
                </div>
                <div className="flex justify-center my-1">
                  <UtilGauge value={inc.portUtilizationMax} color={bandColor(portBand)} size={88} />
                </div>
                <div className="text-center">
                  <span
                    className="text-[10px] font-semibold px-1.5 py-px rounded"
                    style={{ color: bandColor(portBand), backgroundColor: bandBg(portBand) }}
                  >
                    {bandLabel(portBand)}
                  </span>
                </div>
              </Card>

              {/* Congested Interfaces */}
              <Card>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-[11px] font-semibold leading-tight" style={{ color: "var(--color-text-primary)" }}>
                    Congested Interfaces
                  </p>
                  <InfoTooltip
                    description="Count of interfaces at ≥90% utilization on the affected scope. Multiple congested interfaces signals broader impact."
                    source="SNMP"
                    thresholdLabel="Healthy 0–1 · Watch 2–3 · Critical >3"
                  />
                </div>
                <div className="flex items-end gap-1 my-3">
                  <p className="text-4xl font-bold tabular-nums leading-none" style={{ color: bandColor(ifaceBand) }}>
                    {inc.congestedInterfaces}
                  </p>
                  <span className="text-xs pb-1" style={{ color: "var(--color-text-muted)" }}>interfaces</span>
                </div>
                <span
                  className="text-[10px] font-semibold px-1.5 py-px rounded"
                  style={{ color: bandColor(ifaceBand), backgroundColor: bandBg(ifaceBand) }}
                >
                  {bandLabel(ifaceBand)}
                </span>
              </Card>

              {/* Traffic Spike % */}
              <Card>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-[11px] font-semibold leading-tight" style={{ color: "var(--color-text-primary)" }}>
                    Traffic Spike %
                  </p>
                  <InfoTooltip
                    description="Percentage above normal baseline traffic on this link. A spike above 20% indicates an anomalous redistribution event."
                    source="BENOCS"
                    thresholdLabel="Healthy <20% · Watch 20–200% · Critical >200%"
                  />
                </div>
                <div className="flex items-end gap-1 my-3">
                  <p className="text-4xl font-bold tabular-nums leading-none" style={{ color: bandColor(spikeBand) }}>
                    {inc.trafficSpikePercent}
                  </p>
                  <span className="text-xs pb-1" style={{ color: "var(--color-text-muted)" }}>% above normal</span>
                </div>
                <span
                  className="text-[10px] font-semibold px-1.5 py-px rounded"
                  style={{ color: bandColor(spikeBand), backgroundColor: bandBg(spikeBand) }}
                >
                  {bandLabel(spikeBand)}
                </span>
              </Card>
            </div>

            {/* Peak Traffic Volume line chart */}
            <Card>
              <div className="flex items-center justify-between mb-3 gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Peak Traffic Volume</p>
                  <InfoTooltip
                    description="Total traffic volume on the affected peering link over the current shift. Dashed line marks near-capacity threshold."
                    source="BENOCS"
                    thresholdLabel="Watch when near-target · Critical when exceeding capacity"
                  />
                </div>
                <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-5 h-0.5 rounded" style={{ backgroundColor: "var(--color-brand)" }} />
                    Traffic
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-5 h-0.5 border-t border-dashed" style={{ borderColor: "rgba(255,255,255,0.3)" }} />
                    Capacity
                  </span>
                </div>
              </div>
              <div style={{ height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={inc.peakTrafficTimeline} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="t" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}G`} />
                    <Tooltip content={<FLMChartTooltip />} />
                    <ReferenceLine
                      y={inc.peakTrafficTimeline[0]?.target}
                      stroke="rgba(255,255,255,0.25)"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                      label={{ value: "Cap", fill: "rgba(255,255,255,0.3)", fontSize: 9, position: "right" }}
                    />
                    <defs>
                      <linearGradient id={`grad-${inc.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="gbps" name="Traffic (Gbps)" stroke="var(--color-brand)" strokeWidth={2} fill={`url(#grad-${inc.id})`} dot={false} activeDot={{ r: 4, fill: "var(--color-brand)" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* ── BAND 2: Structural or transient? ─────────────────────────────── */}
          <div>
            <p className="text-[11px] font-semibold mb-3 flex items-center gap-1.5" style={{ color: "var(--color-text-muted)" }}>
              <span className="w-1 h-3 rounded-full inline-block" style={{ backgroundColor: "var(--color-warning)" }} />
              BAND 2 — STRUCTURAL OR TRANSIENT?
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Build-out Flag badge */}
              <Card>
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[11px] font-semibold" style={{ color: "var(--color-text-primary)" }}>Build-out Flag</p>
                  <InfoTooltip
                    description="Border Planner capacity expansion status for this peering link. CRITICAL means immediate expansion required; SOON means within next planning cycle."
                    source="Border Planner"
                    thresholdLabel="OK — capacity adequate · SOON — plan expansion · CRITICAL — immediate action"
                  />
                </div>
                <div className="flex items-center gap-3 py-3">
                  <span
                    className="text-sm font-bold px-3 py-1.5 rounded-lg"
                    style={{ color: buildoutColor(inc.buildoutFlag), backgroundColor: buildoutBg(inc.buildoutFlag) }}
                  >
                    {inc.buildoutFlag}
                  </span>
                  <p className="text-xs leading-snug" style={{ color: "var(--color-text-muted)" }}>
                    {inc.buildoutFlag === "CRITICAL"
                      ? "Immediate capacity expansion required — link at structural limit"
                      : inc.buildoutFlag === "SOON"
                      ? "Capacity expansion planned — next cycle priority"
                      : "Capacity adequate — no expansion needed currently"}
                  </p>
                </div>
              </Card>

              {/* Weekly Utilization Trend */}
              <Card>
                <div className="flex items-start justify-between mb-1">
                  <p className="text-[11px] font-semibold" style={{ color: "var(--color-text-primary)" }}>Weekly Utilization Trend</p>
                  <InfoTooltip
                    description="7-day utilization trend for this link. A consistently rising trend above 90% signals a structural saturation pattern."
                    source="Border Planner"
                    thresholdLabel="Healthy <90% · Watch 90–100% · Critical ≥100%"
                  />
                </div>
                <p className="text-[11px] mb-2" style={{ color: "var(--color-text-muted)" }}>
                  Peak {weeklyMax}% —{" "}
                  <span style={{ color: bandColor(weeklyBand) }}>{bandLabel(weeklyBand)}</span>
                </p>
                <div style={{ height: 80 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={inc.weeklyUtilTrend} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="t" tick={{ fontSize: 9, fill: "var(--color-text-muted)" }} tickLine={false} axisLine={false} />
                      <YAxis hide domain={[0, 110]} />
                      <ReferenceLine y={90} stroke="rgba(255,176,32,0.4)" strokeDasharray="3 3" strokeWidth={1} />
                      <ReferenceLine y={100} stroke="rgba(255,59,59,0.4)" strokeDasharray="3 3" strokeWidth={1} />
                      <defs>
                        <linearGradient id={`wgrad-${inc.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={bandColor(weeklyBand)} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={bandColor(weeklyBand)} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="util" name="Util %" stroke={bandColor(weeklyBand)} strokeWidth={1.5} fill={`url(#wgrad-${inc.id})`} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>

          {/* ── Metric timeline ──────────────────────────────────────────────── */}
          <Card>
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Metric Timeline</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold" style={{ color: bandColor(portBand) }}>{inc.linkUtilization}%</span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Link Utilization</span>
                </div>
                <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-6 h-0.5 rounded" style={{ backgroundColor: bandColor(portBand) }} />
                    Current
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-6 h-0.5 border-t border-dashed" style={{ borderColor: "rgba(255,255,255,0.3)" }} />
                    Target
                  </span>
                </div>
              </div>
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={inc.timeline} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} tickLine={false} axisLine={false} interval={1} />
                  <YAxis domain={[50, 105]} tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<FLMChartTooltip />} />
                  <ReferenceLine y={87} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 4" strokeWidth={1} />
                  <ReferenceLine y={90} stroke="rgba(255,59,59,0.2)" strokeDasharray="2 4" strokeWidth={1} />
                  <Line type="monotone" dataKey="utilization" name="Utilization %" stroke={bandColor(portBand)} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: bandColor(portBand) }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* ── BAND 3: What changed? ────────────────────────────────────────── */}
          <div>
            <p className="text-[11px] font-semibold mb-3 flex items-center gap-1.5" style={{ color: "var(--color-text-muted)" }}>
              <span className="w-1 h-3 rounded-full inline-block" style={{ backgroundColor: "var(--color-mitigating)" }} />
              BAND 3 — WHAT CHANGED?
            </p>

            {/* Active Change Ticket banner */}
            {inc.activeChangeTicket && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-lg mb-4"
                style={{ backgroundColor: "rgba(255,176,32,0.08)", border: "1px solid rgba(255,176,32,0.25)" }}
              >
                <Calendar size={16} style={{ color: "var(--color-warning)", flexShrink: 0 }} />
                <div className="flex-1">
                  <p className="text-xs font-semibold" style={{ color: "var(--color-warning)" }}>
                    Active Change Ticket: {inc.activeChangeTicket}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    Planned maintenance window overlaps with this incident — coordinate resolution with change owner
                  </p>
                </div>
                <InfoTooltip
                  description="An active change ticket is open for the affected scope. Remediation actions may require coordination with the change owner."
                  source="CASM"
                  thresholdLabel="Change conflict increases resolution complexity"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Route Deviation % */}
              <Card>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-[11px] font-semibold" style={{ color: "var(--color-text-primary)" }}>Route Deviation %</p>
                  <InfoTooltip
                    description="Percentage of routes deviating from their expected paths. High deviation indicates BGP instability or policy-driven rerouting."
                    source="REX"
                    thresholdLabel="Healthy <5% · Watch 5–10% · Critical >10%"
                  />
                </div>
                <div className="flex items-end gap-1 my-2">
                  <p className="text-3xl font-bold tabular-nums leading-none" style={{ color: bandColor(routeDevBand) }}>
                    {inc.routeDeviationPercent}
                  </p>
                  <span className="text-xs pb-0.5" style={{ color: "var(--color-text-muted)" }}>% deviation</span>
                </div>
                <span
                  className="text-[10px] font-semibold px-1.5 py-px rounded"
                  style={{ color: bandColor(routeDevBand), backgroundColor: bandBg(routeDevBand) }}
                >
                  {bandLabel(routeDevBand)}
                </span>
              </Card>

              {/* Metric Change Events */}
              <Card>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-[11px] font-semibold" style={{ color: "var(--color-text-primary)" }}>Metric Change Events</p>
                  <InfoTooltip
                    description="Key metric changes detected by REX in temporal order. Events are correlated with traffic anomalies."
                    source="REX"
                    thresholdLabel="Timeline of significant metric changes"
                  />
                </div>
                <div className="space-y-2 relative">
                  <div className="absolute left-1.5 top-1.5 bottom-1.5 w-px" style={{ backgroundColor: "var(--color-border)" }} />
                  {inc.metricChangeEvents.map((ev, i) => (
                    <div key={i} className="flex items-start gap-3 pl-4 relative">
                      <div className="absolute left-0.5 mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: i === 0 ? "var(--color-critical)" : "var(--color-mitigating)" }} />
                      <div>
                        <p className="text-[10px] font-semibold" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>{ev.time}</p>
                        <p className="text-[11px] leading-snug mt-0.5" style={{ color: "var(--color-text-primary)" }}>{ev.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

          </div>
        </div>

        {/* ── Right pane: agent hypothesis + actions ──────────────────────── */}
        <div
          className="w-[400px] shrink-0 rounded-lg overflow-hidden sticky top-0"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>

            {/* Root cause */}
            <div>
              <p className="text-sm font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>Root Cause</p>
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
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                    Root Cause Confidence
                  </span>
                  <InfoTooltip
                    description="RCA Engine confidence score — probability that the identified root cause is correct. Scores above 95% are highly reliable."
                    source="RCA Engine"
                    thresholdLabel="Low <85% · Good 85–95% · High >95%"
                  />
                </div>
                <span className="text-xs font-bold" style={{ color: bandColor(confBand) }}>
                  {inc.rootCause.confidence}%
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full" style={{ width: `${inc.rootCause.confidence}%`, backgroundColor: bandColor(confBand) }} />
              </div>
              <p className="text-[10px] mt-1" style={{ color: bandColor(confBand) }}>{bandLabel(confBand)}</p>
            </div>

            <div style={{ height: 1, backgroundColor: "var(--color-border)" }} />

            {/* Alternative Path Headroom gauge */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <p className="text-[11px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    Alt. Path Headroom
                  </p>
                  <InfoTooltip
                    description="Available capacity on the best alternative routing path. Low headroom means rerouting is risky — the backup path may also become congested."
                    source="SNMP + REX"
                    thresholdLabel="Healthy ≥90% · Watch 70–90% · Critical <70%"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <UtilGauge value={inc.altPathHeadroom} color={bandColor(altBand)} size={80} />
                <div>
                  <p className="text-xs font-bold" style={{ color: bandColor(altBand) }}>{inc.altPathHeadroom}%</p>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-px rounded"
                    style={{ color: bandColor(altBand), backgroundColor: bandBg(altBand) }}
                  >
                    {bandLabel(altBand)}
                  </span>
                  <p className="text-[11px] mt-1" style={{ color: "var(--color-text-muted)" }}>
                    {inc.altPathHeadroom < 70 ? "High reroute risk" : inc.altPathHeadroom < 90 ? "Moderate headroom" : "Safe to reroute"}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ height: 1, backgroundColor: "var(--color-border)" }} />

            {/* Recommended action */}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                Recommended Action
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
                {inc.rootCause.recommendedAction}
              </p>
              <p className="mt-2 text-xs font-medium" style={{ color: "var(--color-brand)" }}>
                Playbook: {inc.rootCause.matchedPlaybook}
              </p>
            </div>

            <div style={{ height: 1, backgroundColor: "var(--color-border)" }} />

            {/* Playbook checklist */}
            <div>
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
                {inc.rootCause.matchedPlaybook}
              </p>
              <div className="space-y-2.5">
                {steps.map((step, i) => {
                  const checked = myChecked.has(i);
                  return (
                    <label key={i} className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => toggleStep(inc.id, i, e.target.checked)}
                        className="mt-px shrink-0"
                        style={{ accentColor: "var(--color-brand)" }}
                      />
                      <span
                        className="text-[11px] leading-snug"
                        style={{
                          color: checked ? "var(--color-text-muted)" : "var(--color-text-primary)",
                          textDecoration: checked ? "line-through" : "none",
                        }}
                      >
                        {step}
                      </span>
                    </label>
                  );
                })}
              </div>
              {myChecked.size > 0 && (
                <p className="text-[10px] mt-3" style={{ color: "var(--color-text-muted)" }}>
                  {myChecked.size}/{steps.length} steps completed
                </p>
              )}
            </div>
          </div>

          {/* Action decision point */}
          <div
            className="p-4 space-y-2"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>
              Action — Human Decision Point
            </p>
            {isActionable ? (
              <>
                {cdnNotified ? (
                  <div
                    className="w-full py-2.5 rounded-lg text-sm font-semibold text-center"
                    style={{ backgroundColor: "rgba(45,212,191,0.10)", border: "1px solid rgba(45,212,191,0.3)", color: "var(--color-resolved)" }}
                  >
                    ✓ CDN Notified
                  </div>
                ) : (
                  <button
                    onClick={() => setPendingAction("notifyCdn")}
                    className="w-full py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 active:scale-[0.98]"
                    style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
                  >
                    Notify CDN
                  </button>
                )}
                <button
                  onClick={() => setPendingAction("close")}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors hover:bg-white/5"
                  style={{ border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
                >
                  Close
                </button>
              </>
            ) : (
              <div
                className="px-3 py-2.5 rounded-lg text-center"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)" }}
              >
                <p className="text-xs font-semibold" style={{ color: inc.status === "Closed" ? "var(--color-resolved)" : "var(--color-mitigating)" }}>
                  {inc.status === "Closed" ? "✓ Closed" : `↑ ${inc.status}`}
                </p>
                <p className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>
                  No further action required
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Centered confirmation modal (portal, z-50) ─────────────────────── */}
      {pendingAction && (() => {
        const cfg = MODAL_CFG[pendingAction];
        return (
          <ConfirmModal
            title={cfg.title(inc.ref)}
            body={cfg.body}
            confirmLabel={cfg.confirmLabel}
            confirmColor={cfg.confirmColor}
            onConfirm={handleConfirm}
            onClose={handleCloseModal}
          >
            {pendingAction === "notifyCdn" && (
              <div>
                <label
                  className="text-xs font-semibold mb-1.5 block"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Note (optional)
                </label>
                <textarea
                  value={cdnNote}
                  onChange={(e) => setCdnNote(e.target.value)}
                  rows={3}
                  placeholder="Add context for the CDN notification…"
                  className="w-full rounded-lg px-3 py-2 text-xs resize-none"
                  style={{
                    backgroundColor: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                    outline: "none",
                  }}
                />
              </div>
            )}
          </ConfirmModal>
        );
      })()}
    </div>
  );
}

// ─── Route entry — forks by module ───────────────────────────────────────────

export default function IncidentDetail() {
  const { role } = useAuth();
  const { id } = useParams() as { id: string };

  if (role === "flm") {
    return <FLMDetail incId={id} />;
  }
  return <AdminIncidentDetail />;
}

function FLMDetail({ incId }: { incId: string }) {
  const { incidents } = useFLMIncidents();
  const inc = incidents.find((i) => i.id === incId);

  if (!inc) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertTriangle size={40} style={{ color: "var(--color-text-muted)" }} />
        <p className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Incident not found
        </p>
        <Link to="/incidents" className="text-sm font-medium transition-opacity hover:opacity-80" style={{ color: "var(--color-brand)" }}>
          ← Back to Incidents
        </Link>
      </div>
    );
  }

  return <FLMIncidentDetailPage inc={inc} />;
}
