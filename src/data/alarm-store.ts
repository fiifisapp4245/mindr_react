// ── Types ──────────────────────────────────────────────────────────────────────

export type AlarmSeverity = "critical" | "high" | "predicted";
export type AlarmStatus   = "active" | "acknowledged" | "predicted" | "snoozed";
export type AlarmType     = "bgp" | "utilization" | "latency" | "prediction" | "flap" | "sla";

export interface AlarmRow {
  id: string;
  ref: string;
  name: string;
  description: string;
  severity: AlarmSeverity;
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
  // Correlation / linked records
  linkedIncident?: string;       // display label e.g. "INC-2847"
  linkedIncidentId?: string;     // route param e.g. "inc-2847"
  // Mutable state (set by context actions)
  assignedTo?: string;
  createdIncidentId?: string;    // set after "Create incident"
  snoozeUntil?: string;
  addedToGroupId?: string;
}

export interface GroupMember {
  ref: string;
  name: string;
  metric: string;
  iface: string;
  severity: AlarmSeverity;
}

export interface CorrelationGroup {
  id: string;
  summary: string;
  confidence: number;
  highestSeverity: AlarmSeverity;
  region: string;
  memberCount: number;
  linkedIncident?: string;
  linkedIncidentId?: string;
  members: GroupMember[];
}

// ── Design tokens ──────────────────────────────────────────────────────────────

export const SEV: Record<AlarmSeverity, { label: string; bg: string; color: string }> = {
  critical:  { label: "Critical",  bg: "rgba(255,59,59,0.12)",  color: "#FF3B3B" },
  high:      { label: "High",      bg: "rgba(255,176,32,0.12)", color: "#FFB020" },
  predicted: { label: "Predicted", bg: "rgba(77,158,255,0.12)", color: "#4D9EFF" },
};

export const STATUS: Record<AlarmStatus, { label: string; bg: string; color: string }> = {
  active:       { label: "Active",    bg: "rgba(255,59,59,0.10)",  color: "#FF3B3B" },
  acknowledged: { label: "Ack'd",     bg: "rgba(45,212,191,0.10)", color: "#2DD4BF" },
  predicted:    { label: "Predicted", bg: "rgba(77,158,255,0.10)", color: "#4D9EFF" },
  snoozed:      { label: "Snoozed",   bg: "rgba(107,114,128,0.10)", color: "#6B7280" },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

export function metricColor(value: number, max: number): string {
  const pct = value / max;
  if (pct >= 0.85) return "#FF3B3B";
  if (pct >= 0.65) return "#FFB020";
  return "#2DD4BF";
}

export function makeChartData(alarm: AlarmRow) {
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

// ── Mock alarm data ────────────────────────────────────────────────────────────

export const INITIAL_ALARMS: AlarmRow[] = [
  {
    id: "a1", ref: "ALM-0042",
    name: "Packet loss threshold exceeded",
    description: "Packet loss on the peering path to AS1299 has breached the 2% alert threshold (currently 4.2%). Likely congestion or interface degradation on the AMS-IX Amsterdam cross-connect. Investigate BGP-advertised routes and physical layer on ams-ix-rtr-01 xe-0/0/0.",
    severity: "critical", status: "active", type: "bgp",
    affected: "Peering path to AS1299", iface: "ams-ix-rtr-01 xe-0/0/0",
    ixp: "AMS-IX Amsterdam", region: "EU-CORE-02",
    metric: "Packet loss", metricValue: 4.2, metricUnit: "%", metricMax: 5, threshold: 2,
    raised: "14m ago", isETA: false,
    linkedIncident: "INC-2847", linkedIncidentId: "inc-2847",
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
    linkedIncident: "INC-2853", linkedIncidentId: "inc-2853",
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

export const CORR_GROUPS: CorrelationGroup[] = [
  {
    id: "g1",
    summary: "AS3320 prefix withdrawal → congestion on EU-CORE-01",
    confidence: 91,
    highestSeverity: "critical",
    region: "EU-CORE-01",
    memberCount: 4,
    linkedIncident: "INC-2847",
    linkedIncidentId: "inc-2847",
    members: [
      { ref: "ALM-0050", name: "Link utilization 97%", metric: "97% util",  iface: "core-rtr-fra-01 ge-0/2/1",  severity: "critical" },
      { ref: "ALM-0051", name: "Packet loss 3.1%",     metric: "3.1% loss", iface: "EU-CORE-01 → AS5413",        severity: "critical" },
      { ref: "ALM-0052", name: "SLA breach risk",      metric: "< 8m SLA",  iface: "EU-CORE-01 aggregate",       severity: "critical" },
      { ref: "ALM-0053", name: "Latency +28ms",        metric: "+28ms RT",  iface: "EU-CORE-01 transit",         severity: "high"     },
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
      { ref: "ALM-0054", name: "Latency spike +32ms", metric: "+32ms RT",  iface: "AMS-IX → DE-CIX transit",  severity: "critical" },
      { ref: "ALM-0055", name: "Packet loss 2.8%",    metric: "2.8% loss", iface: "AMS-IX Amsterdam xe-2/0",  severity: "critical" },
    ],
  },
];

export const REGIONS = ["All regions", "EU-CORE-01", "EU-CORE-02", "EU-WEST-01", "EU-CENTRAL", "EU-SOUTH"];

// ── Incident ID counter (for Create Incident action) ──────────────────────────

let _nextIncId = 9001;
export function nextIncidentId(): string {
  return `INC-${_nextIncId++}`;
}
