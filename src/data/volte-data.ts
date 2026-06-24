// ── VoLTE module mock data ─────────────────────────────────────────────────────
// All domain/module labels use display strings. No internal scenario codes.

export type Segment    = "RAN" | "EPC" | "IMS";
export type NodeHealth = "healthy" | "warning" | "critical";
export type VolteSeverity  = "Critical" | "High" | "Medium" | "Low";
export type AlarmState = "Active" | "Predicted" | "Acknowledged";
export type EventType  = "anomaly" | "threshold" | "silent-degradation";
export type EventState = "New" | "Investigating" | "Resolved";
export type IncidentStatus   = "Open" | "Investigating" | "Resolved";
export type RemediationRisk  = "low" | "medium" | "high";
export type RemediationStatus = "auto-applied" | "pending-approval" | "approved" | "rejected";

// ── KPI dashboard data ────────────────────────────────────────────────────────

export const VOLTE_KPIS = {
  callDropRate:        2.3,   // % (threshold 1.5%)
  imsHealth:           91,    // %
  epcHealth:           87,    // %
  activeIncidents:     3,
  incidentBreakdown:   { critical: 1, high: 1, medium: 1 },
  affectedSubscribers: "47.2K",
  subscriberDelta:     "−12K vs 1H ago",
  mindrResolutions:    8,
  autonomyPct:         73,
  mttrReduction:       41,    // % vs baseline
};

export type TimeWindow = "1H" | "6H" | "24H" | "7D";

export interface TrendPoint { cssr: number; cdr: number; }  // call setup success rate, call drop rate

export const VOLTE_TREND: Record<TimeWindow, TrendPoint[]> = {
  "1H": [
    { cssr: 99.1, cdr: 1.2 }, { cssr: 99.0, cdr: 1.3 }, { cssr: 98.8, cdr: 1.5 },
    { cssr: 98.4, cdr: 1.9 }, { cssr: 97.8, cdr: 2.4 }, { cssr: 97.2, cdr: 2.9 },
    { cssr: 97.0, cdr: 3.1 }, { cssr: 97.3, cdr: 2.8 }, { cssr: 97.6, cdr: 2.5 },
    { cssr: 97.8, cdr: 2.3 }, { cssr: 97.9, cdr: 2.3 }, { cssr: 98.0, cdr: 2.2 },
  ],
  "6H": [
    { cssr: 99.2, cdr: 1.0 }, { cssr: 99.1, cdr: 1.1 }, { cssr: 99.0, cdr: 1.2 },
    { cssr: 98.7, cdr: 1.5 }, { cssr: 98.3, cdr: 1.9 }, { cssr: 97.9, cdr: 2.2 },
    { cssr: 97.5, cdr: 2.6 }, { cssr: 97.2, cdr: 2.9 }, { cssr: 97.0, cdr: 3.1 },
    { cssr: 97.3, cdr: 2.8 }, { cssr: 97.7, cdr: 2.4 }, { cssr: 98.0, cdr: 2.2 },
  ],
  "24H": [
    { cssr: 99.3, cdr: 0.9 }, { cssr: 99.2, cdr: 1.0 }, { cssr: 99.0, cdr: 1.2 },
    { cssr: 98.8, cdr: 1.4 }, { cssr: 98.5, cdr: 1.7 }, { cssr: 98.0, cdr: 2.1 },
    { cssr: 97.6, cdr: 2.5 }, { cssr: 97.1, cdr: 3.0 }, { cssr: 97.0, cdr: 3.1 },
    { cssr: 97.4, cdr: 2.7 }, { cssr: 97.8, cdr: 2.3 }, { cssr: 98.0, cdr: 2.2 },
  ],
  "7D": [
    { cssr: 99.5, cdr: 0.7 }, { cssr: 99.4, cdr: 0.8 }, { cssr: 99.2, cdr: 1.0 },
    { cssr: 99.0, cdr: 1.2 }, { cssr: 98.7, cdr: 1.5 }, { cssr: 98.3, cdr: 1.9 },
    { cssr: 97.8, cdr: 2.4 }, { cssr: 97.3, cdr: 2.8 }, { cssr: 97.1, cdr: 3.0 },
    { cssr: 97.4, cdr: 2.7 }, { cssr: 97.8, cdr: 2.4 }, { cssr: 98.0, cdr: 2.2 },
  ],
};

// ── Service chain nodes ───────────────────────────────────────────────────────

export interface NodeKPI {
  label: string;
  value: number;
  unit: string;
  trend: number[];    // 10 data points, ascending time, newest last
  target?: number;
  healthy: boolean;
}

export interface NodeTrace {
  id: string;
  protocol: string;
  timestamp: string;
  summary: string;
}

export interface ChainNodeDetail {
  kpis: NodeKPI[];
  alarmIds: string[];
  traces: NodeTrace[];
  upstream: string[];    // node IDs this element depends on
  downstream: string[];  // node IDs that depend on this element
  team: { name: string; lead: string; email: string; oncall: string };
}

export interface ChainNode {
  id: string;
  label: string;
  type: string;
  segment: Segment;
  health: NodeHealth;
  tagline: string;
  detail: ChainNodeDetail;
}

export const VOLTE_NODES: ChainNode[] = [
  {
    id: "enb-west-01", label: "eNB-WEST-01", type: "eNB", segment: "RAN", health: "warning",
    tagline: "Elevated handover failure rate — 7.4% vs 2% target",
    detail: {
      kpis: [
        { label: "Handover Success Rate", value: 92.6, unit: "%",   trend: [99,98,97,96,95,94,93,93,92,93], target: 98,   healthy: false },
        { label: "Connected UEs",         value: 1847, unit: "",    trend: [1900,1880,1860,1850,1840,1830,1850,1860,1850,1847], healthy: true },
        { label: "RSRP (avg)",            value: -88,  unit: "dBm", trend: [-85,-86,-87,-87,-88,-88,-89,-89,-88,-88], target: -90, healthy: true },
      ],
      alarmIds: ["alm-v004"],
      traces: [
        { id: "TRC-R001", protocol: "X2 Handover", timestamp: "14:31 UTC", summary: "X2 handover failure — target eNB capacity exceeded" },
        { id: "TRC-R002", protocol: "S1-MME",      timestamp: "14:28 UTC", summary: "S1-MME setup request latency 340ms (threshold 100ms)" },
      ],
      upstream: [],
      downstream: ["mme-01", "sgw-01"],
      team: { name: "Radio Access Network Team", lead: "Alex Müller", email: "a.mueller@mindr.network", oncall: "+49 30 555-0101" },
    },
  },
  {
    id: "enb-west-02", label: "eNB-WEST-02", type: "eNB", segment: "RAN", health: "healthy",
    tagline: "Operating normally — all KPIs within target",
    detail: {
      kpis: [
        { label: "Handover Success Rate", value: 98.8, unit: "%", trend: [98,99,99,99,99,99,98,99,99,99], target: 98, healthy: true },
        { label: "Connected UEs",         value: 2103, unit: "",  trend: [2050,2060,2070,2080,2090,2100,2105,2110,2100,2103], healthy: true },
      ],
      alarmIds: [],
      traces: [],
      upstream: [],
      downstream: ["mme-01"],
      team: { name: "Radio Access Network Team", lead: "Alex Müller", email: "a.mueller@mindr.network", oncall: "+49 30 555-0101" },
    },
  },
  {
    id: "mme-01", label: "MME-01", type: "MME", segment: "EPC", health: "critical",
    tagline: "Signaling overload — 94% capacity, causing attach failures",
    detail: {
      kpis: [
        { label: "CPU Load",              value: 94,   unit: "%",    trend: [70,72,75,78,82,86,89,92,93,94], target: 80, healthy: false },
        { label: "Attach Success Rate",   value: 91.2, unit: "%",    trend: [99,98,98,97,96,95,94,93,92,91], target: 99, healthy: false },
        { label: "Signaling Load",        value: 18400,unit: "msg/s",trend: [12000,13000,14000,15000,16000,17000,17500,18000,18200,18400], healthy: false },
      ],
      alarmIds: ["alm-v002"],
      traces: [
        { id: "TRC-E001", protocol: "NAS Attach",   timestamp: "14:33 UTC", summary: "NAS attach reject — overload indication, 892 affected UEs" },
        { id: "TRC-E002", protocol: "S1-AP",         timestamp: "14:30 UTC", summary: "S1-AP initial context setup failure rate 8.8%" },
      ],
      upstream: ["enb-west-01", "enb-west-02"],
      downstream: ["sgw-01"],
      team: { name: "Core Network Engineering", lead: "Jana Novak", email: "j.novak@mindr.network", oncall: "+49 89 555-0202" },
    },
  },
  {
    id: "sgw-01", label: "SGW-01", type: "SGW", segment: "EPC", health: "warning",
    tagline: "Session establishment failure rate elevated — 4.1% vs 1% target",
    detail: {
      kpis: [
        { label: "Session Est. Success Rate", value: 95.9, unit: "%", trend: [99,99,98,98,97,97,96,96,96,96], target: 99, healthy: false },
        { label: "Active Bearers",             value: 84200,unit: "",  trend: [88000,87000,86000,85500,85000,84800,84500,84300,84200,84200], healthy: true },
        { label: "Throughput",                 value: 12.4, unit: "Gbps", trend: [14,14,13.5,13,13,12.8,12.6,12.5,12.4,12.4], healthy: true },
      ],
      alarmIds: ["alm-v003"],
      traces: [
        { id: "TRC-E003", protocol: "GTPv2", timestamp: "14:32 UTC", summary: "Create Session Response failure — overload from MME" },
      ],
      upstream: ["mme-01", "enb-west-01"],
      downstream: ["pgw-01"],
      team: { name: "Core Network Engineering", lead: "Jana Novak", email: "j.novak@mindr.network", oncall: "+49 89 555-0202" },
    },
  },
  {
    id: "pgw-01", label: "PGW-01", type: "PGW", segment: "EPC", health: "healthy",
    tagline: "Operating normally — data path unaffected",
    detail: {
      kpis: [
        { label: "PDN Connection Success", value: 99.1, unit: "%",   trend: [99,99,99,99,99,99,99,99,99,99], target: 99, healthy: true },
        { label: "Traffic Throughput",     value: 28.6, unit: "Gbps",trend: [28,28,29,29,28,28,29,29,28,29], healthy: true },
      ],
      alarmIds: [],
      traces: [],
      upstream: ["sgw-01"],
      downstream: ["p-cscf-01"],
      team: { name: "Core Network Engineering", lead: "Jana Novak", email: "j.novak@mindr.network", oncall: "+49 89 555-0202" },
    },
  },
  {
    id: "p-cscf-01", label: "P-CSCF-01", type: "P-CSCF", segment: "IMS", health: "critical",
    tagline: "Response timeout causing call drops — root cause of INC-V001",
    detail: {
      kpis: [
        { label: "Response Success Rate", value: 89.3, unit: "%",   trend: [99,99,98,97,96,94,92,90,89,89], target: 99, healthy: false },
        { label: "Avg Response Time",     value: 1840, unit: "ms",  trend: [80,85,100,180,350,680,1100,1500,1750,1840], target: 200, healthy: false },
        { label: "Active Sessions",       value: 31200,unit: "",    trend: [38000,37000,36000,35000,34000,33000,32000,31500,31200,31200], healthy: false },
      ],
      alarmIds: ["alm-v001"],
      traces: [
        { id: "TRC-I001", protocol: "SIP REGISTER", timestamp: "14:34 UTC", summary: "SIP REGISTER timeout — 100-Trying not received within 1800ms" },
        { id: "TRC-I002", protocol: "SIP INVITE",   timestamp: "14:34 UTC", summary: "SIP INVITE failure — 503 Service Unavailable from P-CSCF" },
        { id: "TRC-I003", protocol: "Diameter Cx",  timestamp: "14:33 UTC", summary: "Diameter Cx LIR timeout — HSS lookup stalled" },
      ],
      upstream: ["pgw-01"],
      downstream: ["s-cscf-01"],
      team: { name: "IMS Platform Team", lead: "Priya Sharma", email: "p.sharma@mindr.network", oncall: "+44 20 555-0303" },
    },
  },
  {
    id: "s-cscf-01", label: "S-CSCF-01", type: "S-CSCF", segment: "IMS", health: "warning",
    tagline: "Downstream impact from P-CSCF — registration success rate reduced",
    detail: {
      kpis: [
        { label: "Registration Success",  value: 91.8, unit: "%",  trend: [99,98,98,97,96,95,94,93,92,92], target: 99, healthy: false },
        { label: "Call Setup Latency",    value: 940,  unit: "ms", trend: [120,130,150,200,320,520,700,850,920,940], target: 300, healthy: false },
      ],
      alarmIds: [],
      traces: [
        { id: "TRC-I004", protocol: "SIP", timestamp: "14:33 UTC", summary: "S-CSCF registration failure — P-CSCF not reachable for auth" },
      ],
      upstream: ["p-cscf-01"],
      downstream: ["bgcf-01"],
      team: { name: "IMS Platform Team", lead: "Priya Sharma", email: "p.sharma@mindr.network", oncall: "+44 20 555-0303" },
    },
  },
  {
    id: "bgcf-01", label: "BGCF-01", type: "BGCF", segment: "IMS", health: "healthy",
    tagline: "PSTN breakout operating normally",
    detail: {
      kpis: [
        { label: "PSTN Routing Success", value: 99.4, unit: "%", trend: [99,99,99,99,99,99,99,99,99,99], target: 99, healthy: true },
        { label: "Active PSTN Sessions", value: 4820, unit: "",  trend: [5100,5050,5000,4980,4960,4940,4900,4870,4840,4820], healthy: true },
      ],
      alarmIds: [],
      traces: [],
      upstream: ["s-cscf-01"],
      downstream: [],
      team: { name: "IMS Platform Team", lead: "Priya Sharma", email: "p.sharma@mindr.network", oncall: "+44 20 555-0303" },
    },
  },
];

// ── Service chain edges ───────────────────────────────────────────────────────

export interface ChainEdge {
  from: string;
  to: string;
  fault: boolean;
}

export const VOLTE_EDGES: ChainEdge[] = [
  { from: "enb-west-01", to: "mme-01",    fault: false },
  { from: "enb-west-02", to: "mme-01",    fault: false },
  { from: "mme-01",      to: "sgw-01",    fault: false },
  { from: "sgw-01",      to: "pgw-01",    fault: false },
  { from: "pgw-01",      to: "p-cscf-01", fault: true  },
  { from: "p-cscf-01",   to: "s-cscf-01", fault: true  },
  { from: "s-cscf-01",   to: "bgcf-01",   fault: false },
];

// ── Alarms ────────────────────────────────────────────────────────────────────

export interface VolteAlarm {
  id: string;
  name: string;
  severity: VolteSeverity;
  state: AlarmState;
  segment: Segment;
  affected: string;
  metric: string;
  metricValue: number;
  metricUnit: string;
  threshold: number;
  raisedAt: string;
  eta: string;
  nodeId: string;
  groupedCount?: number;  // number of similar alarms deduplicated into this one
}

export const VOLTE_ALARMS: VolteAlarm[] = [
  {
    id: "alm-v001",
    name: "P-CSCF Response Timeout",
    severity: "Critical",
    state: "Active",
    segment: "IMS",
    affected: "P-CSCF-01 · 47.2K subscribers",
    metric: "Response Success Rate",
    metricValue: 89.3, metricUnit: "%", threshold: 99,
    raisedAt: "14:28 UTC",
    eta: "~35 min",
    nodeId: "p-cscf-01",
    groupedCount: 3,
  },
  {
    id: "alm-v002",
    name: "MME Signaling Overload",
    severity: "Critical",
    state: "Active",
    segment: "EPC",
    affected: "MME-01 · EU-West core",
    metric: "CPU Load",
    metricValue: 94, metricUnit: "%", threshold: 80,
    raisedAt: "14:22 UTC",
    eta: "~50 min",
    nodeId: "mme-01",
  },
  {
    id: "alm-v003",
    name: "SGW Session Establishment Failures",
    severity: "High",
    state: "Active",
    segment: "EPC",
    affected: "SGW-01 · ~3400 sessions/h",
    metric: "Session Success Rate",
    metricValue: 95.9, metricUnit: "%", threshold: 99,
    raisedAt: "14:25 UTC",
    eta: "~45 min",
    nodeId: "sgw-01",
    groupedCount: 2,
  },
  {
    id: "alm-v004",
    name: "RAN Handover Failure Rate Elevated",
    severity: "Medium",
    state: "Predicted",
    segment: "RAN",
    affected: "eNB-WEST-01 · EU-West cells",
    metric: "Handover Success Rate",
    metricValue: 92.6, metricUnit: "%", threshold: 98,
    raisedAt: "14:31 UTC",
    eta: "~1h 20m",
    nodeId: "enb-west-01",
  },
];

// ── Events ────────────────────────────────────────────────────────────────────

export interface VolteEvent {
  id: string;
  type: EventType;
  segment: Segment;
  affectedKPI: string;
  value: string;
  threshold: string;
  summary: string;
  state: EventState;
  timestamp: string;
  nodeId: string;
  relatedAlarmId?: string;
  relatedIncidentId?: string;
}

export const VOLTE_EVENTS: VolteEvent[] = [
  {
    id: "evt-v001",
    type: "anomaly",
    segment: "IMS",
    affectedKPI: "P-CSCF Response Time",
    value: "1840ms",
    threshold: "200ms",
    summary: "P-CSCF response time spiked 9.2× baseline — root cause under investigation",
    state: "Investigating",
    timestamp: "14:28 UTC",
    nodeId: "p-cscf-01",
    relatedAlarmId: "alm-v001",
    relatedIncidentId: "inc-v001",
  },
  {
    id: "evt-v002",
    type: "threshold",
    segment: "IMS",
    affectedKPI: "Call Drop Rate",
    value: "2.3%",
    threshold: "1.5%",
    summary: "Call drop rate exceeded 1.5% target — 8740 dropped calls in last 15 minutes",
    state: "Investigating",
    timestamp: "14:30 UTC",
    nodeId: "p-cscf-01",
    relatedIncidentId: "inc-v001",
  },
  {
    id: "evt-v003",
    type: "threshold",
    segment: "EPC",
    affectedKPI: "MME CPU Load",
    value: "94%",
    threshold: "80%",
    summary: "MME-01 CPU exceeded 80% threshold — signaling queue depth increasing",
    state: "Investigating",
    timestamp: "14:22 UTC",
    nodeId: "mme-01",
    relatedAlarmId: "alm-v002",
    relatedIncidentId: "inc-v002",
  },
  {
    id: "evt-v004",
    type: "silent-degradation",
    segment: "EPC",
    affectedKPI: "Session Establishment Failures",
    value: "4.1%",
    threshold: "1.0%",
    summary: "Gradual EPC session failure rate increase detected over 18 minutes — now 4.1× baseline",
    state: "Investigating",
    timestamp: "14:25 UTC",
    nodeId: "sgw-01",
    relatedAlarmId: "alm-v003",
    relatedIncidentId: "inc-v002",
  },
  {
    id: "evt-v005",
    type: "anomaly",
    segment: "RAN",
    affectedKPI: "Handover Failure Rate",
    value: "7.4%",
    threshold: "2.0%",
    summary: "eNB-WEST-01 X2 handover failure rate elevated — capacity constraint at target cells",
    state: "Investigating",
    timestamp: "14:31 UTC",
    nodeId: "enb-west-01",
    relatedAlarmId: "alm-v004",
  },
  {
    id: "evt-v006",
    type: "threshold",
    segment: "IMS",
    affectedKPI: "Call Setup Success Rate",
    value: "97.0%",
    threshold: "98.5%",
    summary: "CSSR dropped 1.5pp below 98.5% target — correlated with P-CSCF timeout event",
    state: "New",
    timestamp: "14:34 UTC",
    nodeId: "s-cscf-01",
    relatedIncidentId: "inc-v001",
  },
];

// ── Incidents ─────────────────────────────────────────────────────────────────

export interface RemediationItem {
  id: string;
  rank: number;
  action: string;
  rationale: string;
  risk: RemediationRisk;
  status: RemediationStatus;
  appliedBy?: string;
  appliedAt?: string;
}

export interface EvidenceItem {
  alarmIds: string[];
  kpiBreaches: { kpi: string; value: string; threshold: string; segment: Segment; nodeId: string }[];
  traces: { id: string; protocol: string; summary: string }[];
  changeRefs: { id: string; summary: string; timestamp: string }[];
  ticketRefs: { id: string; summary: string; team: string }[];
}

export interface VolteIncident {
  id: string;
  title: string;
  status: IncidentStatus;
  severity: VolteSeverity;
  affectedScope: { segments: Segment[]; nodeIds: string[] };
  affectedSubscribers: number;
  customerImpactScore: number;  // 0-100
  rca: {
    summary: string;
    confidence: number;
    rootNodeId: string;
    rootNodeLabel: string;
    chain: string[];   // ordered causal chain description
  };
  responsibleTeam: { name: string; lead: string; email: string };
  remediations: RemediationItem[];
  evidence: EvidenceItem;
  openedAt: string;
  resolvedAt?: string;
  mttr?: string;
}

export const VOLTE_INCIDENTS: VolteIncident[] = [
  {
    id: "inc-v001",
    title: "IMS P-CSCF Signaling Cascade — Call Drop Surge",
    status: "Investigating",
    severity: "Critical",
    affectedScope: { segments: ["IMS", "EPC", "RAN"], nodeIds: ["p-cscf-01", "s-cscf-01", "pgw-01"] },
    affectedSubscribers: 47200,
    customerImpactScore: 82,
    rca: {
      summary: "P-CSCF-01 response timeout (1840ms vs 200ms target) caused by HSS Diameter Cx lookup stall, triggering SIP registration failures and cascading call drops across the EU-West IMS domain.",
      confidence: 91,
      rootNodeId: "p-cscf-01",
      rootNodeLabel: "P-CSCF-01",
      chain: [
        "HSS Diameter Cx query latency spike → P-CSCF-01 lookup timeout",
        "P-CSCF-01 response time 1840ms → SIP REGISTER failures (10.7%)",
        "S-CSCF-01 registration stall → CSSR drops from 99.1% to 97.0%",
        "Call drop rate rises from 1.2% to 2.3% (53% above target)",
        "47,200 subscribers impacted across EU-West cells",
      ],
    },
    responsibleTeam: { name: "IMS Platform Team", lead: "Priya Sharma", email: "p.sharma@mindr.network" },
    remediations: [
      {
        id: "rem-v001", rank: 1,
        action: "Enable IMS load balancing — redirect 40% of P-CSCF-01 sessions to P-CSCF-02",
        rationale: "Immediate traffic relief; no subscriber disruption",
        risk: "low", status: "auto-applied", appliedBy: "MINDR Agent", appliedAt: "14:35 UTC",
      },
      {
        id: "rem-v002", rank: 2,
        action: "Flush and restart Diameter Cx connection pool on P-CSCF-01",
        rationale: "Clears stalled HSS lookup threads; estimated 4-min service interruption",
        risk: "medium", status: "pending-approval",
      },
      {
        id: "rem-v003", rank: 3,
        action: "Scale HSS capacity by 30% to relieve Diameter signaling queue",
        rationale: "Addresses root cause; 8-min provisioning window required",
        risk: "high", status: "pending-approval",
      },
    ],
    evidence: {
      alarmIds: ["alm-v001", "alm-v003"],
      kpiBreaches: [
        { kpi: "P-CSCF Response Time", value: "1840ms", threshold: "200ms",   segment: "IMS", nodeId: "p-cscf-01" },
        { kpi: "Call Drop Rate",        value: "2.3%",   threshold: "1.5%",    segment: "IMS", nodeId: "s-cscf-01" },
        { kpi: "CSSR",                  value: "97.0%",  threshold: "98.5%",   segment: "IMS", nodeId: "s-cscf-01" },
        { kpi: "Diameter Cx Latency",   value: "1620ms", threshold: "50ms",    segment: "IMS", nodeId: "p-cscf-01" },
      ],
      traces: [
        { id: "TRC-I001", protocol: "SIP REGISTER", summary: "SIP REGISTER timeout — 100-Trying not received within 1800ms" },
        { id: "TRC-I002", protocol: "SIP INVITE",   summary: "SIP INVITE 503 Service Unavailable from P-CSCF-01" },
        { id: "TRC-I003", protocol: "Diameter Cx",  summary: "Diameter Cx LIR stalled — HSS response > 1600ms" },
      ],
      changeRefs: [
        { id: "CHG-4821", summary: "HSS software upgrade v8.2 → v8.3 rolled to EU-West", timestamp: "08:00 UTC −3h" },
      ],
      ticketRefs: [
        { id: "TKT-9204", summary: "P-CSCF-01 intermittent HSS lookup failures (pre-existing)", team: "IMS Platform Team" },
      ],
    },
    openedAt: "14:28 UTC",
  },
  {
    id: "inc-v002",
    title: "EPC MME Signaling Overload — Session Establishment Failures",
    status: "Investigating",
    severity: "High",
    affectedScope: { segments: ["EPC", "RAN"], nodeIds: ["mme-01", "sgw-01", "enb-west-01"] },
    affectedSubscribers: 12400,
    customerImpactScore: 61,
    rca: {
      summary: "Traffic redistribution from eNB-WEST-01 handover failures overloaded MME-01 signaling capacity (94% CPU), causing SGW-01 session establishment failures and partial VoLTE bearer degradation.",
      confidence: 84,
      rootNodeId: "mme-01",
      rootNodeLabel: "MME-01",
      chain: [
        "eNB-WEST-01 X2 handover failures → S1-MME re-attach signaling surge",
        "MME-01 CPU load rises to 94% (threshold 80%)",
        "SGW-01 session establishment failure rate increases to 4.1%",
        "12,400 subscribers experience intermittent VoLTE bearer drops",
      ],
    },
    responsibleTeam: { name: "Core Network Engineering", lead: "Jana Novak", email: "j.novak@mindr.network" },
    remediations: [
      {
        id: "rem-v004", rank: 1,
        action: "Throttle S1-MME re-attach rate from eNB-WEST-01 (50 msg/s limit)",
        rationale: "Immediate CPU relief without service interruption",
        risk: "low", status: "auto-applied", appliedBy: "MINDR Agent", appliedAt: "14:38 UTC",
      },
      {
        id: "rem-v005", rank: 2,
        action: "Offload 30% of MME-01 UE contexts to MME-02 (hot standby)",
        rationale: "Redistributes signaling load; ~2min context transfer window",
        risk: "medium", status: "pending-approval",
      },
    ],
    evidence: {
      alarmIds: ["alm-v002", "alm-v003", "alm-v004"],
      kpiBreaches: [
        { kpi: "MME CPU Load",              value: "94%",  threshold: "80%", segment: "EPC", nodeId: "mme-01" },
        { kpi: "SGW Session Success Rate",   value: "95.9%",threshold: "99%", segment: "EPC", nodeId: "sgw-01" },
        { kpi: "eNB Handover Success Rate",  value: "92.6%",threshold: "98%", segment: "RAN", nodeId: "enb-west-01" },
      ],
      traces: [
        { id: "TRC-E001", protocol: "NAS Attach", summary: "NAS attach reject — overload indication, 892 affected UEs" },
        { id: "TRC-E003", protocol: "GTPv2",      summary: "Create Session Response failure — MME overload propagated to SGW" },
      ],
      changeRefs: [],
      ticketRefs: [
        { id: "TKT-9198", summary: "MME-01 capacity review — flagged for upgrade in Q3", team: "Core Network Engineering" },
      ],
    },
    openedAt: "14:22 UTC",
  },
];

// ── Chat conversation history (scoped to Volte service chain) ─────────────────

export type ConvStatus = "Resolved" | "Pending" | "Rejected";

export interface ChatConversation {
  id: string;
  title: string;
  preview: string;
  status: ConvStatus;
  updatedAt: string;
}

export const VOLTE_CONVERSATIONS: ChatConversation[] = [
  { id: "c1", title: "P-CSCF timeout root cause",  preview: "What is causing the P-CSCF-01 response...", status: "Resolved", updatedAt: "14:35 UTC" },
  { id: "c2", title: "IMS / EPC dependency trace",  preview: "Show the dependency path from MME-01 to...",  status: "Pending",  updatedAt: "14:32 UTC" },
  { id: "c3", title: "Handover failure correlation", preview: "Is the RAN handover failure correlated...",   status: "Pending",  updatedAt: "14:29 UTC" },
  { id: "c4", title: "Historical CSSR dip 09:00",   preview: "Compare today's CSSR drop with the...",       status: "Rejected", updatedAt: "09:18 UTC" },
];

// ── Reports ───────────────────────────────────────────────────────────────────

export type ReportType = "post-incident" | "rca" | "sla-weekly" | "accuracy";

export interface VolteReport {
  id: string;
  type: ReportType;
  title: string;
  incidentId?: string;
  generatedAt: string;
  status: "ready" | "generating";
  slaOutcome?: "met" | "missed";
  mttr?: string;
  summary: string;
}

export const VOLTE_REPORTS: VolteReport[] = [
  {
    id: "rpt-v001", type: "post-incident",
    title: "Post-Incident Summary — IMS P-CSCF Cascade (INC-V003)",
    incidentId: "inc-v003",
    generatedAt: "Yesterday, 22:14 UTC",
    status: "ready",
    slaOutcome: "missed",
    mttr: "1h 42m",
    summary: "P-CSCF HSS lookup degradation resolved with load-balancing; 52K subscribers impacted for 1h 42m. SLA missed by 12 minutes.",
  },
  {
    id: "rpt-v002", type: "sla-weekly",
    title: "VoLTE SLA Weekly Summary — W25",
    generatedAt: "Monday, 07:00 UTC",
    status: "ready",
    slaOutcome: "met",
    mttr: "28m avg",
    summary: "Week 25: 3 incidents, 2 SLA met, 1 missed. Avg MTTR 28m (target 45m). CSSR 98.8% avg (target 98.5%). Call drop rate 1.1% avg (target 1.5%).",
  },
  {
    id: "rpt-v003", type: "rca",
    title: "RCA Report — EPC MME Overload Pattern (INC-V002)",
    incidentId: "inc-v002",
    generatedAt: "Today, generating...",
    status: "generating",
    summary: "Generating — estimated ready in 4 minutes.",
  },
  {
    id: "rpt-v004", type: "accuracy",
    title: "MINDR Prediction & RCA Accuracy Feedback — VoLTE",
    generatedAt: "Yesterday, 06:00 UTC",
    status: "ready",
    summary: "10 predictions reviewed: 8 accurate, 1 partially accurate, 1 rejected. Playbook confidence 87%. 2 model retraining triggers flagged.",
  },
];

export interface FeedbackEntry {
  incidentId: string;
  title: string;
  rcaSummary: string;
  userRating: "accurate" | "partial" | "inaccurate" | null;
  comment?: string;
}

export const FEEDBACK_ENTRIES: FeedbackEntry[] = [
  { incidentId: "inc-v003", title: "IMS P-CSCF Cascade (INC-V003)", rcaSummary: "HSS Diameter lookup stall → P-CSCF timeout", userRating: "accurate" },
  { incidentId: "inc-v004", title: "EPC PGW Throughput Drop (INC-V004)", rcaSummary: "Upstream firewall rule mismatch causing bearer drops", userRating: "partial", comment: "Root node correct; missed the firewall change ref" },
  { incidentId: "inc-v005", title: "RAN Handover Cascade (INC-V005)", rcaSummary: "S1-MME signaling surge from eNB-WEST-03 capacity breach", userRating: "accurate" },
  { incidentId: "inc-v006", title: "IMS BGCF PSTN Routing (INC-V006)", rcaSummary: "PSTN trunk group saturation in EU-South", userRating: "inaccurate", comment: "Wrong segment identified — was provider routing table, not trunk saturation" },
];

export const PLAYBOOK_RECOMMENDATIONS = [
  { id: "pr-01", title: "Add HSS Diameter health check to P-CSCF pre-alarm runbook", rationale: "3 of last 4 P-CSCF incidents correlated with HSS latency; early detection would cut MTTR by est. 25 min.", priority: "High" },
  { id: "pr-02", title: "Lower MME CPU alert threshold from 80% to 70%", rationale: "Current threshold fires too late — overload already cascaded by the time alarm fires at 80%.", priority: "High" },
  { id: "pr-03", title: "Automate P-CSCF load-balancing as default low-risk action", rationale: "Action was applied in 2/2 P-CSCF incidents with positive outcome; safe to automate.", priority: "Medium" },
];
