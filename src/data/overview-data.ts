// ── Overview mock data ────────────────────────────────────────────────────────

export type AgentState = "Resolved" | "Diagnosing" | "Escalated" | "Monitoring";
export type TimeWindow = "1H" | "6H" | "24H" | "7D";

export interface AgentAction {
  id: string;
  state: AgentState;
  action: string;
  incidentRef: string;
  domainLabel: string;
  relativeTime: string;
  incidentRoute: string;
}

export interface DecisionItem {
  id: string;
  title: string;
  incidentRef: string;
  domainLabel: string;
  recommendation: string;
  confidence: number;
  isLowRisk: boolean;
  incidentRoute: string;
}

export interface TrendDataPoint {
  throughput: number; // 0–100
  stability: number;  // 0–100
}

export interface AgentLoad {
  id: string;
  name: string;
  capacity: number; // 0–100
  status: "healthy" | "high" | "critical" | "idle";
  domain: string;
}

// ── KPIs ──────────────────────────────────────────────────────────────────────

export const OVERVIEW_KPIS = {
  activeP1: 2,
  openIncidents: 14,
  totalIncidents: 47,
  autoResolved: 31,
  autonomyPct: 66,
  escalated: 3,
  mttrReduction: 34,       // % reduction vs pre-MINDR baseline
  severityCritical: 2,
  severityPredicted: 5,
  severityMitigating: 7,
};

// ── Network health trend (cross-domain aggregate) ────────────────────────────
// Each array: 20 evenly-spaced data points over the selected window.
// throughput = global traffic throughput %, stability = network stability index %.
// Targets: throughput 85 %, stability 90 %.

export const HEALTH_TREND: Record<TimeWindow, TrendDataPoint[]> = {
  "1H": [
    { throughput: 84, stability: 92 }, { throughput: 85, stability: 92 },
    { throughput: 85, stability: 91 }, { throughput: 84, stability: 91 },
    { throughput: 83, stability: 90 }, { throughput: 82, stability: 89 },
    { throughput: 78, stability: 86 }, { throughput: 74, stability: 82 },
    { throughput: 71, stability: 79 }, { throughput: 73, stability: 81 },
    { throughput: 76, stability: 85 }, { throughput: 80, stability: 88 },
    { throughput: 83, stability: 90 }, { throughput: 84, stability: 91 },
    { throughput: 85, stability: 91 }, { throughput: 85, stability: 91 },
    { throughput: 86, stability: 92 }, { throughput: 85, stability: 91 },
    { throughput: 85, stability: 90 }, { throughput: 85, stability: 90 },
  ],
  "6H": [
    { throughput: 86, stability: 91 }, { throughput: 86, stability: 90 },
    { throughput: 85, stability: 90 }, { throughput: 82, stability: 87 },
    { throughput: 78, stability: 84 }, { throughput: 80, stability: 86 },
    { throughput: 84, stability: 89 }, { throughput: 86, stability: 91 },
    { throughput: 85, stability: 92 }, { throughput: 87, stability: 91 },
    { throughput: 86, stability: 90 }, { throughput: 85, stability: 90 },
    { throughput: 84, stability: 89 }, { throughput: 83, stability: 88 },
    { throughput: 80, stability: 85 }, { throughput: 75, stability: 81 },
    { throughput: 79, stability: 84 }, { throughput: 83, stability: 87 },
    { throughput: 85, stability: 89 }, { throughput: 85, stability: 90 },
  ],
  "24H": [
    { throughput: 84, stability: 90 }, { throughput: 82, stability: 89 },
    { throughput: 81, stability: 88 }, { throughput: 80, stability: 87 },
    { throughput: 79, stability: 86 }, { throughput: 82, stability: 88 },
    { throughput: 85, stability: 91 }, { throughput: 87, stability: 92 },
    { throughput: 86, stability: 91 }, { throughput: 85, stability: 90 },
    { throughput: 84, stability: 89 }, { throughput: 83, stability: 88 },
    { throughput: 79, stability: 84 }, { throughput: 74, stability: 80 },
    { throughput: 78, stability: 83 }, { throughput: 83, stability: 88 },
    { throughput: 85, stability: 90 }, { throughput: 86, stability: 91 },
    { throughput: 85, stability: 90 }, { throughput: 85, stability: 90 },
  ],
  "7D": [
    { throughput: 82, stability: 88 }, { throughput: 84, stability: 90 },
    { throughput: 86, stability: 91 }, { throughput: 85, stability: 90 },
    { throughput: 83, stability: 89 }, { throughput: 80, stability: 86 },
    { throughput: 77, stability: 83 }, { throughput: 82, stability: 87 },
    { throughput: 85, stability: 90 }, { throughput: 86, stability: 91 },
    { throughput: 87, stability: 92 }, { throughput: 85, stability: 90 },
    { throughput: 84, stability: 89 }, { throughput: 83, stability: 88 },
    { throughput: 81, stability: 86 }, { throughput: 78, stability: 83 },
    { throughput: 81, stability: 86 }, { throughput: 84, stability: 88 },
    { throughput: 85, stability: 90 }, { throughput: 85, stability: 90 },
  ],
};

export const HEALTH_STATS = {
  systemHealth: 87,
  systemHealthDelta: "+0.4%",
  systemHealthWindow: "last 1H",
  affectedUsers: "14.2K",
  affectedUsersDelta: "12K fewer",
  affectedUsersWindow: "last 1H",
  aiConfidence: 91,
  aiConfidenceTrend: "stable" as "stable" | "up" | "down",
};

// ── Agent load ────────────────────────────────────────────────────────────────

export const AGENT_LOAD: AgentLoad[] = [
  { id: "al1", name: "SCAN-ALPHA", capacity: 67, status: "healthy",  domain: "IP Core" },
  { id: "al2", name: "FIX-DELTA",  capacity: 91, status: "critical", domain: "IP Core" },
  { id: "al3", name: "VFY-GAMMA",  capacity: 45, status: "healthy",  domain: "CXI"     },
  { id: "al4", name: "MON-BETA",   capacity: 78, status: "high",     domain: "CXI"     },
  { id: "al5", name: "PRED-ZETA",  capacity: 12, status: "idle",     domain: "Volte"   },
];

// ── Agent feed ────────────────────────────────────────────────────────────────

export const AGENT_FEED: AgentAction[] = [
  {
    id: "af1", state: "Resolved",
    action: "Rerouted traffic via DE-CIX secondary path after AS3320 prefix withdrawal",
    incidentRef: "INC-8422", domainLabel: "IP Core", relativeTime: "just now", incidentRoute: "/incidents",
  },
  {
    id: "af2", state: "Diagnosing",
    action: "Correlating 4 BGP session flaps on AMS-IX — comparing against 30-day baseline",
    incidentRef: "INC-8431", domainLabel: "IP Core", relativeTime: "2m ago", incidentRoute: "/incidents",
  },
  {
    id: "af3", state: "Monitoring",
    action: "Watching AS1299 link utilization post-reroute — within SLA threshold for 18m",
    incidentRef: "INC-8422", domainLabel: "IP Core", relativeTime: "3m ago", incidentRoute: "/incidents",
  },
  {
    id: "af4", state: "Escalated",
    action: "Packet loss on EU-CORE-01 above 5% — auto-escalated to L2 for physical investigation",
    incidentRef: "PRE-2019", domainLabel: "Volte", relativeTime: "5m ago", incidentRoute: "/incidents",
  },
  {
    id: "af5", state: "Resolved",
    action: "VoLTE SLA breach prevented — traffic load-balanced across 3 Frankfurt bearers",
    incidentRef: "INC-8419", domainLabel: "Volte", relativeTime: "9m ago", incidentRoute: "/incidents",
  },
  {
    id: "af6", state: "Diagnosing",
    action: "Running CXI degradation root-cause analysis for 232 affected subscribers in DE-West region",
    incidentRef: "INC-8416", domainLabel: "CXI", relativeTime: "11m ago", incidentRoute: "/incidents",
  },
  {
    id: "af7", state: "Monitoring",
    action: "EU-CENTRAL-B4 transit stabilised — autonomy rate 94% for this window",
    incidentRef: "INC-8418", domainLabel: "IP Core", relativeTime: "14m ago", incidentRoute: "/incidents",
  },
  {
    id: "af8", state: "Resolved",
    action: "BGP hold-timer resets on Telecom Italia peering link self-healed via configuration push",
    incidentRef: "INC-8421", domainLabel: "IP Core", relativeTime: "19m ago", incidentRoute: "/incidents",
  },
  {
    id: "af9", state: "Escalated",
    action: "CXI RAN score < 70 persisting beyond 20m threshold — human review required",
    incidentRef: "INC-8416", domainLabel: "CXI", relativeTime: "22m ago", incidentRoute: "/incidents",
  },
  {
    id: "af10", state: "Monitoring",
    action: "Tracking SVOD launch traffic surge — EU peering links currently at 78% capacity",
    incidentRef: "EVT-0121", domainLabel: "IP Core", relativeTime: "31m ago", incidentRoute: "/incidents",
  },
];

// ── Decision queue ────────────────────────────────────────────────────────────

export const DECISION_QUEUE: DecisionItem[] = [
  {
    id: "dq1",
    title: "Resolve packet loss via secondary path activation",
    incidentRef: "INC-8422",
    domainLabel: "IP Core",
    recommendation: "Activate secondary path",
    confidence: 94,
    isLowRisk: true,
    incidentRoute: "/incidents",
  },
  {
    id: "dq2",
    title: "Escalate CXI degradation to L2 for RAN optimisation",
    incidentRef: "INC-8416",
    domainLabel: "CXI",
    recommendation: "Escalate to L2",
    confidence: 82,
    isLowRisk: false,
    incidentRoute: "/incidents",
  },
  {
    id: "dq3",
    title: "Close resolved VoLTE bearer incident",
    incidentRef: "INC-8419",
    domainLabel: "Volte",
    recommendation: "Close incident",
    confidence: 97,
    isLowRisk: true,
    incidentRoute: "/incidents",
  },
];

// ── Domain tiles ──────────────────────────────────────────────────────────────

export const DOMAIN_TILES_DATA: {
  domainId: "ip-core" | "cxi" | "volte";
  statusLevel: "critical" | "warning" | "ok";
  summary: string;
}[] = [
  { domainId: "ip-core", statusLevel: "critical", summary: "1 active P1 · 7 open alarms" },
  { domainId: "cxi",     statusLevel: "warning",  summary: "232 degraded scores · 3 cases" },
  { domainId: "volte",   statusLevel: "warning",  summary: "SLA breach risk · 1 predicted" },
];

export const TOPOLOGY_CALLOUT = {
  region: "EU-CORE-02",
  state: "DEGRADED",
  route: "/network-model",
};

// ── MINDR performance metrics ─────────────────────────────────────────────────

export const MINDR_PERFORMANCE = {
  casesManaged:          53,  // total incidents MINDR was involved in this period
  autonomouslyResolved:  31,  // closed with zero human action
  autonomyPct:           66,
  escalatedToMindr:       8,  // cases handed to MINDR from L1 / field teams
  hoursRecovered:        47,  // engineer hours freed up
};

// ── Incident status donut ─────────────────────────────────────────────────────

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
  description: string;
}

export const INCIDENT_DONUT: DonutSegment[] = [
  { label: "Resolved",  value: 31, color: "#2DD4BF", description: "Autonomously closed by MINDR agents" },
  { label: "Active",    value: 11, color: "#4D9EFF", description: "Open and actively monitored" },
  { label: "Escalated", value:  3, color: "#FFB020", description: "Escalated to L2 / L3 engineers" },
  { label: "Predicted", value:  5, color: "#FF3B3B", description: "Pre-emptive — risk detected early" },
];

export const APPROVE_CONFIDENCE_THRESHOLD = 90;
