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
  throughput: number;   // 0–100
  // Renamed from "stability" to "availability" for terminology accuracy.
  // NOTE: target is currently 90%. Real-world network availability targets are
  // typically 99.9%+ (five-nines). Confirm with the team whether this series
  // represents true availability % or a relative health/stability index before
  // changing the numeric target.
  availability: number; // 0–100
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
  // activeP1 must equal severityCritical + severityPredicted + severityMitigating.
  // The headline is computed from those three in the UI; this value is kept in
  // sync for any code that reads it directly (e.g. handleApprove logic).
  activeP1: 14,            // 2 critical + 5 predicted + 7 mitigating
  openIncidents: 14,       // Active (11) + Escalated (3) — matches donut
  totalIncidents: 50,      // sum of INCIDENT_DONUT segments (31+11+3+5)
  autoResolved: 31,        // matches INCIDENT_DONUT "Resolved" segment
  autonomyPct: 66,
  escalated: 3,            // matches INCIDENT_DONUT "Escalated" segment
  // Source values only — the % improvement is DERIVED in the component, not stored here,
  // so the headline and the absolute times can never disagree.
  mttrCurrentMinutes:  66,  // current average MTTR (minutes)
  mttrBaselineMinutes: 100, // pre-MINDR 90-day baseline MTTR (minutes)
  severityCritical: 2,
  severityPredicted: 5,
  severityMitigating: 7,
};

// ── Network health trend (cross-domain aggregate) ────────────────────────────
// Each array: 20 evenly-spaced data points over the selected window.
// throughput = global traffic throughput %, availability = network availability %.
// Targets: throughput 85 %, availability 90 %.

export const HEALTH_TREND: Record<TimeWindow, TrendDataPoint[]> = {
  "1H": [
    { throughput: 84, availability: 92 }, { throughput: 85, availability: 92 },
    { throughput: 85, availability: 91 }, { throughput: 84, availability: 91 },
    { throughput: 83, availability: 90 }, { throughput: 82, availability: 89 },
    { throughput: 78, availability: 86 }, { throughput: 74, availability: 82 },
    { throughput: 71, availability: 79 }, { throughput: 73, availability: 81 },
    { throughput: 76, availability: 85 }, { throughput: 80, availability: 88 },
    { throughput: 83, availability: 90 }, { throughput: 84, availability: 91 },
    { throughput: 85, availability: 91 }, { throughput: 85, availability: 91 },
    { throughput: 86, availability: 92 }, { throughput: 85, availability: 91 },
    { throughput: 85, availability: 90 }, { throughput: 85, availability: 90 },
  ],
  "6H": [
    { throughput: 86, availability: 91 }, { throughput: 86, availability: 90 },
    { throughput: 85, availability: 90 }, { throughput: 82, availability: 87 },
    { throughput: 78, availability: 84 }, { throughput: 80, availability: 86 },
    { throughput: 84, availability: 89 }, { throughput: 86, availability: 91 },
    { throughput: 85, availability: 92 }, { throughput: 87, availability: 91 },
    { throughput: 86, availability: 90 }, { throughput: 85, availability: 90 },
    { throughput: 84, availability: 89 }, { throughput: 83, availability: 88 },
    { throughput: 80, availability: 85 }, { throughput: 75, availability: 81 },
    { throughput: 79, availability: 84 }, { throughput: 83, availability: 87 },
    { throughput: 85, availability: 89 }, { throughput: 85, availability: 90 },
  ],
  "24H": [
    { throughput: 84, availability: 90 }, { throughput: 82, availability: 89 },
    { throughput: 81, availability: 88 }, { throughput: 80, availability: 87 },
    { throughput: 79, availability: 86 }, { throughput: 82, availability: 88 },
    { throughput: 85, availability: 91 }, { throughput: 87, availability: 92 },
    { throughput: 86, availability: 91 }, { throughput: 85, availability: 90 },
    { throughput: 84, availability: 89 }, { throughput: 83, availability: 88 },
    { throughput: 79, availability: 84 }, { throughput: 74, availability: 80 },
    { throughput: 78, availability: 83 }, { throughput: 83, availability: 88 },
    { throughput: 85, availability: 90 }, { throughput: 86, availability: 91 },
    { throughput: 85, availability: 90 }, { throughput: 85, availability: 90 },
  ],
  "7D": [
    { throughput: 82, availability: 88 }, { throughput: 84, availability: 90 },
    { throughput: 86, availability: 91 }, { throughput: 85, availability: 90 },
    { throughput: 83, availability: 89 }, { throughput: 80, availability: 86 },
    { throughput: 77, availability: 83 }, { throughput: 82, availability: 87 },
    { throughput: 85, availability: 90 }, { throughput: 86, availability: 91 },
    { throughput: 87, availability: 92 }, { throughput: 85, availability: 90 },
    { throughput: 84, availability: 89 }, { throughput: 83, availability: 88 },
    { throughput: 81, availability: 86 }, { throughput: 78, availability: 83 },
    { throughput: 81, availability: 86 }, { throughput: 84, availability: 88 },
    { throughput: 85, availability: 90 }, { throughput: 85, availability: 90 },
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
  { id: "al1", name: "SCAN-ALPHA", capacity: 67, status: "healthy",  domain: "IP Peering" },
  { id: "al2", name: "FIX-DELTA",  capacity: 91, status: "critical", domain: "IP Peering" },
  { id: "al3", name: "VFY-GAMMA",  capacity: 45, status: "healthy",  domain: "CXI"     },
  { id: "al4", name: "MON-BETA",   capacity: 78, status: "high",     domain: "CXI"     },
  { id: "al5", name: "PRED-ZETA",  capacity: 12, status: "idle",     domain: "Volte"   },
];

// ── Agent feed ────────────────────────────────────────────────────────────────

export const AGENT_FEED: AgentAction[] = [
  {
    id: "af1", state: "Resolved",
    action: "Rerouted traffic via DE-CIX secondary path after AS3320 prefix withdrawal",
    incidentRef: "INC-8422", domainLabel: "IP Peering", relativeTime: "just now", incidentRoute: "/alerts",
  },
  {
    id: "af2", state: "Diagnosing",
    action: "Correlating 4 BGP session flaps on AMS-IX — comparing against 30-day baseline",
    incidentRef: "INC-8431", domainLabel: "IP Peering", relativeTime: "2m ago", incidentRoute: "/alerts",
  },
  {
    id: "af3", state: "Monitoring",
    action: "Watching AS1299 link utilization post-reroute — within SLA threshold for 18m",
    incidentRef: "INC-8422", domainLabel: "IP Peering", relativeTime: "3m ago", incidentRoute: "/alerts",
  },
  {
    id: "af4", state: "Escalated",
    action: "Packet loss on EU-CORE-01 above 5% — auto-escalated to L2 for physical investigation",
    incidentRef: "PRE-2019", domainLabel: "Volte", relativeTime: "5m ago", incidentRoute: "/alerts",
  },
  {
    id: "af5", state: "Resolved",
    action: "VoLTE SLA breach prevented — traffic load-balanced across 3 Frankfurt bearers",
    incidentRef: "INC-8419", domainLabel: "Volte", relativeTime: "9m ago", incidentRoute: "/alerts",
  },
  {
    id: "af6", state: "Diagnosing",
    action: "Running CXI degradation root-cause analysis for 232 affected subscribers in DE-West region",
    incidentRef: "INC-8416", domainLabel: "CXI", relativeTime: "11m ago", incidentRoute: "/alerts",
  },
  {
    id: "af7", state: "Monitoring",
    action: "EU-CENTRAL-B4 transit stabilised — autonomy rate 94% for this window",
    incidentRef: "INC-8418", domainLabel: "IP Peering", relativeTime: "14m ago", incidentRoute: "/alerts",
  },
  {
    id: "af8", state: "Resolved",
    action: "BGP hold-timer resets on Telecom Italia peering link self-healed via configuration push",
    incidentRef: "INC-8421", domainLabel: "IP Peering", relativeTime: "19m ago", incidentRoute: "/alerts",
  },
  {
    id: "af9", state: "Escalated",
    action: "CXI RAN score < 70 persisting beyond 20m threshold — human review required",
    incidentRef: "INC-8416", domainLabel: "CXI", relativeTime: "22m ago", incidentRoute: "/alerts",
  },
  {
    id: "af10", state: "Monitoring",
    action: "Tracking SVOD launch traffic surge — EU peering links currently at 78% capacity",
    incidentRef: "EVT-0121", domainLabel: "IP Peering", relativeTime: "31m ago", incidentRoute: "/alerts",
  },
];

// ── Decision queue ────────────────────────────────────────────────────────────

export const DECISION_QUEUE: DecisionItem[] = [
  {
    id: "dq1",
    title: "Resolve packet loss via secondary path activation",
    incidentRef: "INC-2847",
    domainLabel: "IP Peering",
    recommendation: "Activate secondary path",
    confidence: 94,
    isLowRisk: true,
    incidentRoute: "/incidents/inc-2847",
  },
  {
    id: "dq2",
    title: "Escalate CXI degradation to L2 for RAN optimisation",
    incidentRef: "CXI-2026-0040",
    domainLabel: "CXI",
    recommendation: "Escalate to L2",
    confidence: 82,
    isLowRisk: false,
    incidentRoute: "/cxi-cases/CXI-2026-0040",
  },
  {
    id: "dq3",
    title: "Approve remediation for IMS P-CSCF signaling cascade",
    incidentRef: "INC-V001",
    domainLabel: "Volte",
    recommendation: "Approve remediation",
    confidence: 91,
    isLowRisk: true,
    incidentRoute: "/volte/incidents/inc-v001",
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
  // casesManaged (53) is intentionally larger than totalIncidents (50): it
  // includes 3 predicted/pipeline cases that MINDR tracked but that have not
  // yet been counted as active incidents in the donut breakdown.
  casesManaged:          53,
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
