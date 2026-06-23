// ── Overview mock data ────────────────────────────────────────────────────────

export type AgentState = "Resolved" | "Diagnosing" | "Escalated" | "Monitoring";

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
  recommendation: string;
  confidence: number;
  isLowRisk: boolean;
  incidentRoute: string;
}

export const OVERVIEW_KPIS = {
  activeP1: 2,
  openIncidents: 14,
  totalIncidents: 47,
  autoResolved: 31,
  autonomyPct: 66,
  escalated: 3,
};

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

export const DECISION_QUEUE: DecisionItem[] = [
  {
    id: "dq1",
    title: "Resolve packet loss via secondary path activation",
    incidentRef: "INC-8422",
    recommendation: "Activate secondary path",
    confidence: 94,
    isLowRisk: true,
    incidentRoute: "/incidents",
  },
  {
    id: "dq2",
    title: "Escalate CXI degradation to L2 for RAN optimization",
    incidentRef: "INC-8416",
    recommendation: "Escalate to L2",
    confidence: 82,
    isLowRisk: false,
    incidentRoute: "/incidents",
  },
  {
    id: "dq3",
    title: "Close resolved VoLTE bearer incident",
    incidentRef: "INC-8419",
    recommendation: "Close incident",
    confidence: 97,
    isLowRisk: true,
    incidentRoute: "/incidents",
  },
];

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
  route: "/topology",
};

export const APPROVE_CONFIDENCE_THRESHOLD = 90;
