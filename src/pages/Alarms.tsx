import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  BellOff,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Filter,
  GitMerge,
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
  CheckCheck,
  CheckCircle2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────

type Severity = "critical" | "high" | "predicted";
type AlarmStatus = "active" | "acknowledged" | "predicted";
type AlarmType = "bgp" | "utilization" | "latency" | "prediction" | "flap" | "sla";
type ViewMode = "list" | "grouped";

interface AlarmRow {
  id: string;
  ref: string;
  name: string;
  description: string;
  severity: Severity;
  status: AlarmStatus;
  type: AlarmType;
  affected: string;
  iface?: string;
  ixp: string;
  region: string;
  metric: string;
  metricValue: number;
  metricUnit: string;
  metricMax: number;
  threshold: number;
  raised: string;
  isETA: boolean;
  sourceLink?: { label: string; href: string };
  linkedIncident?: string;
  linkedIncidentId?: string;
}

interface GroupMember {
  ref: string;
  name: string;
  metric: string;
  iface: string;
  severity: Severity;
}

interface CorrelationGroup {
  id: string;
  summary: string;
  confidence: number;
  highestSeverity: Severity;
  region: string;
  memberCount: number;
  linkedIncident?: string;
  linkedIncidentId?: string;
  members: GroupMember[];
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const SEV: Record<Severity, { label: string; bg: string; color: string }> = {
  critical:  { label: "Critical",  bg: "rgba(255,59,59,0.12)",  color: "#FF3B3B" },
  high:      { label: "High",      bg: "rgba(255,176,32,0.12)", color: "#FFB020" },
  predicted: { label: "Predicted", bg: "rgba(77,158,255,0.12)", color: "#4D9EFF" },
};

const STATUS: Record<AlarmStatus, { label: string; bg: string; color: string }> = {
  active:       { label: "Active",    bg: "rgba(255,59,59,0.10)",  color: "#FF3B3B" },
  acknowledged: { label: "Ack'd",     bg: "rgba(45,212,191,0.10)", color: "#2DD4BF" },
  predicted:    { label: "Predicted", bg: "rgba(77,158,255,0.10)", color: "#4D9EFF" },
};

const TYPE_ICON: Record<AlarmType, React.ElementType> = {
  bgp:         Radio,
  utilization: TrendingUp,
  latency:     Zap,
  prediction:  Bell,
  flap:        RefreshCw,
  sla:         AlertTriangle,
};

// ── Data ──────────────────────────────────────────────────────────────────────

const ALARMS: AlarmRow[] = [
  {
    id: "a1", ref: "ALM-0042",
    name: "Packet loss threshold exceeded",
    description: "Packet loss on the peering path to AS1299 has breached the 2% alert threshold (currently 4.2%). Likely congestion or interface degradation on the AMS-IX Amsterdam cross-connect. Investigate BGP-advertised routes and physical layer on ams-ix-rtr-01 xe-0/0/0.",
    severity: "critical", status: "active", type: "bgp",
    affected: "Peering path to AS1299", iface: "ams-ix-rtr-01 xe-0/0/0",
    ixp: "AMS-IX Amsterdam", region: "EU-CORE-02",
    metric: "Packet loss", metricValue: 4.2, metricUnit: "%", metricMax: 5, threshold: 2,
    raised: "14m ago", isETA: false,
    linkedIncident: "INC-2847", linkedIncidentId: "INC-2847",
  },
  {
    id: "a2", ref: "ALM-0043",
    name: "Link utilization high",
    description: "Interface utilization on EU-WEST → LINX London path is at 92%, approaching the 95% SLA threshold. Traffic rerouting to secondary path may be required within the next 20 minutes.",
    severity: "critical", status: "active", type: "utilization",
    affected: "EU-WEST → LINX London", iface: "linx-rtr-01 ge-2/1/0",
    ixp: "LINX London", region: "EU-WEST-01",
    metric: "Utilization", metricValue: 92, metricUnit: "%", metricMax: 100, threshold: 90,
    raised: "5m ago", isETA: false,
  },
  {
    id: "a3", ref: "ALM-0046",
    name: "Latency spike",
    description: "Round-trip latency on AMS-IX → Frankfurt transit has spiked to 42ms (+34ms above baseline of 8ms). Possible route flap or mid-mile congestion on the DE-CIX interconnect. Correlates with ALM-0042.",
    severity: "critical", status: "active", type: "latency",
    affected: "AMS-IX → Frankfurt transit", iface: "de-cix-rtr-02 et-0/0/2",
    ixp: "AMS-IX Amsterdam", region: "EU-CORE-02",
    metric: "Latency", metricValue: 42, metricUnit: "ms", metricMax: 60, threshold: 18,
    raised: "6m ago", isETA: false,
    linkedIncident: "INC-2853", linkedIncidentId: "INC-2853",
  },
  {
    id: "a4", ref: "ALM-0045",
    name: "BGP session flapping",
    description: "BGP session to AS6762 (Telecom Italia) via Milan IX has reset 12 times in the last 5 minutes. Hold-timer expiry events indicate instability in the peer router. Check for config mismatch or upstream issues on the Telecom Italia side.",
    severity: "high", status: "active", type: "flap",
    affected: "AS6762 — Telecom Italia", iface: "mil-ix-rtr-01 xe-3/0/1",
    ixp: "Milan IX", region: "EU-SOUTH",
    metric: "Flap rate", metricValue: 12, metricUnit: "/5m", metricMax: 20, threshold: 5,
    raised: "12m ago", isETA: false,
  },
  {
    id: "a5", ref: "ALM-0044",
    name: "Transit saturation predicted",
    description: "MINDR ML model forecasts 98% utilization on EU-CENTRAL-B4 transit link within 15 minutes. Source: real-time telemetry trend — no event correlation. Pre-emptive traffic redistribution to DE-CIX secondary recommended.",
    severity: "predicted", status: "predicted", type: "prediction",
    affected: "EU-CENTRAL-B4 transit", iface: "de-cix-rtr-01 ge-0/0/4",
    ixp: "DE-CIX Frankfurt", region: "EU-CENTRAL",
    metric: "Predicted peak", metricValue: 98, metricUnit: "%", metricMax: 100, threshold: 90,
    raised: "in 15m", isETA: true,
    sourceLink: { label: "Telemetry trend", href: "#" },
  },
  {
    id: "a6", ref: "ALM-0060",
    name: "Predicted overload — mass event",
    description: "Nova Strike S3 launch (EVT-0101) traffic model correlated with current AMS-IX baseline predicts 96% utilization on AMS-IX → EU-CORE-01 (AS1299) in 3 days. Pre-positioning of capacity recommended before the event window.",
    severity: "predicted", status: "predicted", type: "prediction",
    affected: "AMS-IX → EU-CORE-01 (AS1299)", iface: "ams-ix-rtr-02 et-0/1/0",
    ixp: "AMS-IX Amsterdam", region: "EU-CORE-01",
    metric: "Predicted peak", metricValue: 96, metricUnit: "%", metricMax: 100, threshold: 90,
    raised: "in 3 days", isETA: true,
    sourceLink: { label: "EVT-0101", href: "/events/EVT-0101" },
  },
  {
    id: "a7", ref: "ALM-0061",
    name: "SLA breach risk",
    description: "AS3215 (France Telecom) utilization is trending toward contractual SLA breach threshold. Forecast indicates breach in 22 minutes. If unresolved, an incident ticket may be auto-created against SLA obligation.",
    severity: "predicted", status: "predicted", type: "sla",
    affected: "AS3215 — France Telecom", iface: "de-cix-rtr-03 ge-1/0/2",
    ixp: "DE-CIX Frankfurt", region: "EU-WEST-01",
    metric: "SLA breach in", metricValue: 22, metricUnit: "m", metricMax: 30, threshold: 0,
    raised: "in 22m", isETA: true,
    sourceLink: { label: "→ may open INC", href: "#" },
  },
];

const CORR_GROUPS: CorrelationGroup[] = [
  {
    id: "g1",
    summary: "AS3320 prefix withdrawal → congestion on EU-CORE-01",
    confidence: 91,
    highestSeverity: "critical",
    region: "EU-CORE-01",
    memberCount: 4,
    linkedIncident: "INC-2847",
    linkedIncidentId: "INC-2847",
    members: [
      { ref: "ALM-0050", name: "Link utilization 97%", metric: "97% util",  iface: "core-rtr-fra-01 ge-0/2/1",     severity: "critical" },
      { ref: "ALM-0051", name: "Packet loss 3.1%",     metric: "3.1% loss", iface: "EU-CORE-01 → AS5413",          severity: "critical" },
      { ref: "ALM-0052", name: "SLA breach risk",      metric: "< 8m SLA",  iface: "EU-CORE-01 aggregate",         severity: "critical" },
      { ref: "ALM-0053", name: "Latency +28ms",        metric: "+28ms RT",  iface: "EU-CORE-01 transit",           severity: "high"     },
    ],
  },
  {
    id: "g2",
    summary: "AMS-IX transit latency — under investigation",
    confidence: 78,
    highestSeverity: "critical",
    region: "EU-CORE-02",
    memberCount: 2,
    members: [
      { ref: "ALM-0054", name: "Latency spike +32ms", metric: "+32ms RT",  iface: "AMS-IX → DE-CIX transit",      severity: "critical" },
      { ref: "ALM-0055", name: "Packet loss 2.8%",    metric: "2.8% loss", iface: "AMS-IX Amsterdam xe-2/0",      severity: "critical" },
    ],
  },
];

const REGIONS = ["All regions", "EU-CORE-01", "EU-CORE-02", "EU-WEST-01", "EU-CENTRAL", "EU-SOUTH"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function metricColor(value: number, max: number) {
  const pct = value / max;
  if (pct >= 0.85) return "#FF3B3B";
  if (pct >= 0.65) return "#FFB020";
  return "#2DD4BF";
}

function makeChartData(alarm: AlarmRow) {
  if (alarm.type === "sla") {
    const jitter = [0, -0.3, 0.2, -0.5, 0.4, -0.2, 0.3, -0.4, 0.2, -0.3, 0.1, 0];
    return Array.from({ length: 12 }, (_, i) => ({
      t: `${(11 - i) * 5}m`,
      v: Math.max(0, Math.round((alarm.metricMax - ((alarm.metricMax - alarm.metricValue) * i) / 11 + jitter[i]) * 10) / 10),
    }));
  }
  const ratios = [0.40, 0.43, 0.47, 0.52, 0.57, 0.62, 0.68, 0.75, 0.83, 0.90, 0.96, 1.00];
  const jitter  = [0, 0.6, -0.4, 1.1, -0.8, 0.5, 0.9, -0.3, 0.7, 1.2, -0.5, 0];
  const base = alarm.metricValue * 0.38;
  return ratios.map((r, i) => ({
    t: `${(11 - i) * 5}m`,
    v: Math.round((base + (alarm.metricValue - base) * r + jitter[i]) * 10) / 10,
  }));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SevBadge({ severity }: { severity: Severity }) {
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

// ── Alarm Detail Panel (Frame 3) ──────────────────────────────────────────────

function AlarmDetailPanel({ alarm, onClose }: { alarm: AlarmRow; onClose: () => void }) {
  const sev = SEV[alarm.severity];
  const stat = STATUS[alarm.status];
  const TypeIcon = TYPE_ICON[alarm.type];
  const chartData = makeChartData(alarm);

  return (
    <div
      className="flex flex-col shrink-0"
      style={{
        width: 368,
        borderLeft: "1px solid var(--color-border)",
        backgroundColor: "var(--color-bg-card)",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-start gap-3 px-5 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: `${sev.color}18`, border: `1px solid ${sev.color}35` }}
        >
          <TypeIcon size={14} style={{ color: sev.color }} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold leading-snug" style={{ color: "var(--color-text-primary)" }}>
            {alarm.name}
          </h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="font-mono text-[10px]" style={{ color: "var(--color-text-muted)" }}>{alarm.ref}</span>
            <SevBadge severity={alarm.severity} />
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
              style={{ backgroundColor: stat.bg, color: stat.color }}
            >
              {stat.label}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded-md hover:bg-white/5 transition-colors"
          style={{ color: "var(--color-text-muted)" }}
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Description */}
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          {alarm.description}
        </p>

        {/* Metadata grid */}
        <div
          className="rounded-xl p-4 grid grid-cols-2 gap-x-4 gap-y-3"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
        >
          {[
            { label: "Affected",     value: alarm.affected },
            { label: "Interface",    value: alarm.iface ?? "—" },
            { label: "IXP",          value: alarm.ixp },
            { label: "Region",       value: alarm.region },
            { label: alarm.isETA ? "ETA" : "Raised", value: alarm.raised },
            { label: "Source",       value: alarm.type.charAt(0).toUpperCase() + alarm.type.slice(1) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[9px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "var(--color-text-muted)" }}>
                {label}
              </p>
              <p className="text-[12px] font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Predicted source banner */}
        {alarm.sourceLink && (
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
            style={{ backgroundColor: "rgba(77,158,255,0.08)", border: "1px solid rgba(77,158,255,0.2)" }}
          >
            <Bell size={12} style={{ color: "#4D9EFF" }} />
            <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>Forecast source:</span>
            <Link
              to={alarm.sourceLink.href}
              className="text-[11px] font-semibold hover:opacity-80 transition-opacity flex items-center gap-1"
              style={{ color: "#4D9EFF" }}
            >
              {alarm.sourceLink.label}
              <ExternalLink size={9} />
            </Link>
          </div>
        )}

        {/* Metric chart */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
              {alarm.type === "sla" ? "SLA time remaining" : alarm.metric} — last 55 min
            </p>
            <span
              className="text-sm font-bold tabular-nums"
              style={{ color: metricColor(alarm.metricValue, alarm.metricMax) }}
            >
              {alarm.metricValue}{alarm.metricUnit}
            </span>
          </div>
          <div style={{ height: 96 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="t"
                  tick={{ fontSize: 8, fill: "rgba(255,255,255,0.28)" }}
                  interval={2}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 8, fill: "rgba(255,255,255,0.28)" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, alarm.metricMax]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1f28",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 6,
                    fontSize: 11,
                    color: "#f0f2f5",
                  }}
                  formatter={(v: number) => [`${v}${alarm.metricUnit}`, alarm.metric]}
                />
                {alarm.threshold > 0 && (
                  <ReferenceLine
                    y={alarm.threshold}
                    stroke="#FF3B3B"
                    strokeDasharray="4 2"
                    strokeOpacity={0.65}
                    label={{ value: "threshold", position: "insideTopRight", fill: "rgba(255,59,59,0.6)", fontSize: 8 }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={metricColor(alarm.metricValue, alarm.metricMax)}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Correlation block */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-[9px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "var(--color-text-muted)" }}>
            Correlation
          </p>
          {alarm.linkedIncident ? (
            <div className="space-y-1.5">
              <p className="text-xs" style={{ color: "var(--color-text-primary)" }}>
                Part of active incident cluster
              </p>
              <Link
                to={`/incidents/${alarm.linkedIncidentId}`}
                className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-80 transition-opacity"
                style={{ color: "var(--color-brand)" }}
              >
                <ExternalLink size={10} />
                {alarm.linkedIncident}
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle2 size={12} style={{ color: "#2DD4BF" }} />
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                No correlated alarm cluster detected
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>
            Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)", color: "#2DD4BF" }}
            >
              <CheckCheck size={11} />
              Acknowledge
            </button>
            <button
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
            >
              <GitMerge size={11} />
              Add to group
            </button>
            <button
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "rgba(255,176,32,0.1)", border: "1px solid rgba(255,176,32,0.2)", color: "#FFB020" }}
            >
              <PlusCircle size={11} />
              Create incident
            </button>
            <button
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
            >
              <BellOff size={11} />
              Snooze
            </button>
            <button
              className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
            >
              <UserPlus size={11} />
              Assign to engineer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Correlation Group Card (grouped view) ─────────────────────────────────────

function GroupCard({
  group,
  defaultExpanded = false,
  onMemberClick,
}: {
  group: CorrelationGroup;
  defaultExpanded?: boolean;
  onMemberClick?: (ref: string) => void;
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
      {/* Group header */}
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
              style={{ backgroundColor: "rgba(255,176,32,0.1)", color: "#FFB020", border: "1px solid rgba(255,176,32,0.2)" }}
            >
              Create incident
            </button>
          )}
        </div>
      </button>

      {/* Member rows */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--color-border)" }}>
          {group.members.map((m, i) => {
            const msev = SEV[m.severity];
            return (
              <button
                key={m.ref}
                className="w-full flex items-center gap-4 pl-12 pr-4 py-2.5 hover:bg-white/[0.02] transition-colors text-left"
                style={{
                  borderBottom: i < group.members.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
                onClick={() => onMemberClick?.(m.ref)}
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
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const GRID = "32px minmax(180px,2fr) 80px 88px minmax(140px,1.8fr) 80px minmax(100px,1fr) 120px";

export default function Alarms() {
  const [activeTab, setActiveTab]     = useState<"all" | Severity>("all");
  const [view, setView]               = useState<ViewMode>("list");
  const [region, setRegion]           = useState("All regions");
  const [search, setSearch]           = useState("");
  const [checked, setChecked]         = useState<Set<string>>(new Set());
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmRow | null>(null);

  const filtered = ALARMS.filter((a) => {
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
    all:       ALARMS.length,
    critical:  ALARMS.filter((a) => a.severity === "critical").length,
    high:      ALARMS.filter((a) => a.severity === "high").length,
    predicted: ALARMS.filter((a) => a.severity === "predicted").length,
  };

  const checkedCount = [...checked].filter((id) => filtered.some((a) => a.id === id)).length;
  const allChecked   = filtered.length > 0 && filtered.every((a) => checked.has(a.id));

  function toggleAll() {
    const next = new Set(checked);
    if (allChecked) filtered.forEach((a) => next.delete(a.id));
    else            filtered.forEach((a) => next.add(a.id));
    setChecked(next);
  }

  function toggleRow(id: string) {
    const next = new Set(checked);
    next.has(id) ? next.delete(id) : next.add(id);
    setChecked(next);
  }

  return (
    <>
      <style>{`
        @keyframes alarm-pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
        .alarm-live-dot { animation: alarm-pulse 1.6s ease-in-out infinite; }
      `}</style>

      <div
        className="flex h-full overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-base)", color: "var(--color-text-primary)" }}
      >
        {/* ── Main content ───────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

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
            <div className="flex items-center gap-3">
              {/* Live indicator */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)" }}
              >
                <span className="alarm-live-dot w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#2DD4BF" }} />
                <span className="text-[11px] font-semibold" style={{ color: "#2DD4BF" }}>Live · streaming</span>
                <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Updated just now</span>
              </div>
            </div>
          </div>

          {/* KPI strip */}
          <div
            className="grid grid-cols-3 gap-3 px-6 py-4 shrink-0"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            {([
              { key: "critical"  as const, label: "Critical",  sub: "requires immediate action", bg: "rgba(255,59,59,0.06)",  border: "rgba(255,59,59,0.2)",  color: "#FF3B3B" },
              { key: "high"      as const, label: "High",      sub: "monitor closely",           bg: "rgba(255,176,32,0.06)", border: "rgba(255,176,32,0.2)", color: "#FFB020" },
              { key: "predicted" as const, label: "Predicted", sub: "AI-forecast breaches",     bg: "rgba(77,158,255,0.06)", border: "rgba(77,158,255,0.2)", color: "#4D9EFF" },
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

          {/* Bulk action bar */}
          {checkedCount > 0 && (
            <div
              className="flex items-center gap-3 px-6 py-2.5 shrink-0"
              style={{ backgroundColor: "rgba(226,0,116,0.06)", borderBottom: "1px solid rgba(226,0,116,0.15)" }}
            >
              <span className="text-xs font-semibold" style={{ color: "var(--color-brand)" }}>
                {checkedCount} selected
              </span>
              <div className="flex items-center gap-2 ml-1">
                {[
                  { label: "Acknowledge",       icon: CheckCheck,  bg: "rgba(45,212,191,0.12)", color: "#2DD4BF" },
                  { label: "Group correlated",  icon: GitMerge,    bg: "rgba(255,255,255,0.07)", color: "var(--color-text-primary)" },
                  { label: "Create incident",   icon: PlusCircle,  bg: "rgba(255,176,32,0.12)", color: "#FFB020" },
                  { label: "Assign",            icon: UserPlus,    bg: "rgba(255,255,255,0.07)", color: "var(--color-text-muted)" },
                  { label: "Snooze",            icon: BellOff,     bg: "rgba(255,255,255,0.07)", color: "var(--color-text-muted)" },
                ].map(({ label, icon: Icon, bg, color }) => (
                  <button
                    key={label}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: bg, color }}
                  >
                    <Icon size={11} />
                    {label}
                  </button>
                ))}
              </div>
              <button className="ml-auto hover:opacity-60 transition-opacity" onClick={() => setChecked(new Set())} style={{ color: "var(--color-text-muted)" }}>
                <X size={13} />
              </button>
            </div>
          )}

          {/* ── Content area ───────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">

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
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-3.5 h-3.5 accent-pink-500" />
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
                  const TypeIcon = TYPE_ICON[alarm.type];
                  const isChecked = checked.has(alarm.id);
                  const isPredicted = alarm.severity === "predicted";
                  const isSelected = selectedAlarm?.id === alarm.id;

                  return (
                    <div
                      key={alarm.id}
                      className="grid items-center px-6 py-3.5 hover:bg-white/[0.025] transition-colors cursor-pointer"
                      style={{
                        gridTemplateColumns: GRID,
                        borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border)" : "none",
                        backgroundColor: isSelected ? "rgba(226,0,116,0.05)" : isChecked ? "rgba(226,0,116,0.03)" : "transparent",
                        borderLeft: isPredicted ? "3px solid rgba(77,158,255,0.4)" : "3px solid transparent",
                      }}
                      onClick={() => setSelectedAlarm(isSelected ? null : alarm)}
                    >
                      {/* Checkbox */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRow(alarm.id)}
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
                        <p className="text-[10px] mt-0.5 ml-5 truncate" style={{ color: "var(--color-text-muted)" }}>
                          {alarm.ixp}
                        </p>
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
                    </div>
                  );
                })}

                {/* Footer */}
                <div
                  className="flex items-center justify-between px-6 py-3"
                  style={{ borderTop: "1px solid var(--color-border)" }}
                >
                  <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                    Showing {filtered.length} of {ALARMS.length} alarms · virtualized scroll enabled
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
                {/* Section: correlation groups */}
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

                {/* Section: uncorrelated alarms */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-3 mt-2" style={{ color: "var(--color-text-muted)" }}>
                    Uncorrelated alarms — {ALARMS.length} individual signals
                  </p>
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
                  >
                    {ALARMS.map((alarm, i) => {
                      const sev = SEV[alarm.severity];
                      const TypeIcon = TYPE_ICON[alarm.type];
                      const isPredicted = alarm.severity === "predicted";
                      const isSelected = selectedAlarm?.id === alarm.id;

                      return (
                        <div
                          key={alarm.id}
                          className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.025] transition-colors cursor-pointer"
                          style={{
                            borderBottom: i < ALARMS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                            borderLeft: `3px solid ${isPredicted ? "rgba(77,158,255,0.35)" : sev.color + "35"}`,
                            backgroundColor: isSelected ? "rgba(226,0,116,0.04)" : "transparent",
                          }}
                          onClick={() => setSelectedAlarm(isSelected ? null : alarm)}
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
        </div>

        {/* ── Alarm Detail Panel (Frame 3) ───────────────────────────────────── */}
        {selectedAlarm && (
          <AlarmDetailPanel alarm={selectedAlarm} onClose={() => setSelectedAlarm(null)} />
        )}
      </div>
    </>
  );
}
