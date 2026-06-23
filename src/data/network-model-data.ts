// ─── Types ───────────────────────────────────────────────────────────────────

export type NodeStatus = "core" | "healthy" | "warning" | "critical";
export type EdgeStatus = "healthy" | "warning" | "down";
export type ConvStatus = "Resolved" | "Rejected" | "Pending";

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  status: NodeStatus;
}

export interface GraphEdge {
  from: string;
  to: string;
  status: EdgeStatus;
}

export interface ConvEntry {
  id: string;
  title: string;
  preview: string;
  status: ConvStatus;
  age: string;
  domainId: "ip-core" | "cxi" | "volte";
}

export interface DomainGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface DomainMetaRow {
  domainId: "ip-core" | "cxi" | "volte";
  label: string;
  fullLabel: string;
  severity: "Critical" | "High" | "Medium";
  description: string;
  activeCases: number;
  lastUpdated: string;
}

// ─── Color maps ───────────────────────────────────────────────────────────────

export const NODE_COLOR: Record<NodeStatus, string> = {
  core:     "#4D9EFF",
  healthy:  "#2DD4BF",
  warning:  "#FFB020",
  critical: "#FF3B3B",
};

export const CONV_STATUS: Record<ConvStatus, { color: string; bg: string }> = {
  Resolved: { color: "#2DD4BF", bg: "rgba(45,212,191,0.12)" },
  Rejected: { color: "#FF3B3B", bg: "rgba(255,59,59,0.12)" },
  Pending:  { color: "#FFB020", bg: "rgba(255,176,32,0.12)" },
};

export const SEV_CFG: Record<"Critical" | "High" | "Medium", { color: string; bg: string }> = {
  Critical: { color: "#FF3B3B", bg: "rgba(255,59,59,0.12)" },
  High:     { color: "#FFB020", bg: "rgba(255,176,32,0.12)" },
  Medium:   { color: "#9CA3AF", bg: "rgba(255,255,255,0.06)" },
};

// ─── Domain meta rows ─────────────────────────────────────────────────────────

export const DOMAIN_META_ROWS: DomainMetaRow[] = [
  {
    domainId:    "ip-core",
    label:       "IP Core",
    fullLabel:   "IP Peering Overload Protection",
    severity:    "Critical",
    description: "Real-time BGP peering health monitoring with predictive overload detection across AMS-IX, DE-CIX, and LINX exchange points.",
    activeCases: 2,
    lastUpdated: "14m ago",
  },
  {
    domainId:    "cxi",
    label:       "CXI",
    fullLabel:   "CXI Degradation",
    severity:    "High",
    description: "Customer experience index monitoring across 3 geographic zones. Active RAN degradation root-cause analysis in DE-West region.",
    activeCases: 3,
    lastUpdated: "6m ago",
  },
  {
    domainId:    "volte",
    label:       "Volte",
    fullLabel:   "Volte",
    severity:    "Medium",
    description: "VoLTE bearer and IMS core health tracking with SLA breach prediction. Bearer capacity approaching threshold in Frankfurt region.",
    activeCases: 1,
    lastUpdated: "31m ago",
  },
];

// ─── Graph data ───────────────────────────────────────────────────────────────

export const GRAPH_DATA: Record<"ip-core" | "cxi" | "volte", DomainGraphData> = {
  "ip-core": {
    nodes: [
      { id: "de-cix",      label: "DE-CIX Frankfurt", x: 50, y: 44, status: "core"     },
      { id: "ams-ix",      label: "AMS-IX Amsterdam",  x: 22, y: 28, status: "healthy"  },
      { id: "linx",        label: "LINX London",       x: 76, y: 28, status: "healthy"  },
      { id: "eu-core-02",  label: "EU-CORE-02",        x: 38, y: 65, status: "critical" },
      { id: "eu-west-01",  label: "EU-WEST-01",        x: 14, y: 52, status: "warning"  },
      { id: "eu-central",  label: "EU-CENTRAL",        x: 66, y: 60, status: "warning"  },
      { id: "milan-ix",    label: "Milan IX",          x: 74, y: 78, status: "warning"  },
      { id: "as3320",      label: "AS3320 (DTAG)",     x: 50, y: 12, status: "critical" },
    ],
    edges: [
      { from: "de-cix",     to: "ams-ix",     status: "healthy"  },
      { from: "de-cix",     to: "linx",       status: "healthy"  },
      { from: "de-cix",     to: "eu-core-02", status: "down"     },
      { from: "de-cix",     to: "eu-central", status: "warning"  },
      { from: "de-cix",     to: "as3320",     status: "down"     },
      { from: "ams-ix",     to: "eu-west-01", status: "healthy"  },
      { from: "ams-ix",     to: "eu-core-02", status: "down"     },
      { from: "linx",       to: "milan-ix",   status: "healthy"  },
      { from: "eu-central", to: "milan-ix",   status: "warning"  },
      { from: "eu-core-02", to: "eu-west-01", status: "warning"  },
    ],
  },

  cxi: {
    nodes: [
      { id: "cxi-core",   label: "CXI Core",       x: 50, y: 46, status: "core"     },
      { id: "zone-north", label: "North Zone",      x: 28, y: 24, status: "warning"  },
      { id: "zone-west",  label: "West Zone",       x: 72, y: 30, status: "critical" },
      { id: "zone-south", label: "South Zone",      x: 46, y: 76, status: "healthy"  },
      { id: "hamburg",    label: "Hamburg Met.",    x: 16, y: 10, status: "warning"  },
      { id: "berlin",     label: "Berlin Metro",    x: 40, y: 10, status: "warning"  },
      { id: "frankfurt",  label: "Frankfurt Rhine", x: 82, y: 16, status: "critical" },
      { id: "munich",     label: "Munich Metro",    x: 32, y: 90, status: "healthy"  },
      { id: "cologne",    label: "Cologne/Bonn",    x: 62, y: 90, status: "healthy"  },
    ],
    edges: [
      { from: "cxi-core",   to: "zone-north", status: "warning"  },
      { from: "cxi-core",   to: "zone-west",  status: "down"     },
      { from: "cxi-core",   to: "zone-south", status: "healthy"  },
      { from: "zone-north", to: "hamburg",    status: "warning"  },
      { from: "zone-north", to: "berlin",     status: "warning"  },
      { from: "zone-west",  to: "frankfurt",  status: "down"     },
      { from: "zone-south", to: "munich",     status: "healthy"  },
      { from: "zone-south", to: "cologne",    status: "healthy"  },
    ],
  },

  volte: {
    nodes: [
      { id: "ims-core",  label: "IMS Core",   x: 50, y: 45, status: "core"     },
      { id: "p-cscf",    label: "P-CSCF",     x: 24, y: 24, status: "healthy"  },
      { id: "s-cscf",    label: "S-CSCF",     x: 76, y: 24, status: "healthy"  },
      { id: "hss",       label: "HSS",        x: 50, y: 10, status: "healthy"  },
      { id: "mme",       label: "MME",        x: 18, y: 65, status: "warning"  },
      { id: "enodeb-01", label: "eNodeB-01",  x:  8, y: 45, status: "critical" },
      { id: "enodeb-02", label: "eNodeB-02",  x: 82, y: 60, status: "warning"  },
      { id: "bearer-a",  label: "Bearer-A",   x: 34, y: 82, status: "warning"  },
      { id: "bearer-b",  label: "Bearer-B",   x: 64, y: 82, status: "healthy"  },
    ],
    edges: [
      { from: "ims-core",  to: "p-cscf",   status: "healthy" },
      { from: "ims-core",  to: "s-cscf",   status: "healthy" },
      { from: "ims-core",  to: "hss",      status: "healthy" },
      { from: "ims-core",  to: "mme",      status: "warning" },
      { from: "mme",       to: "enodeb-01",status: "down"    },
      { from: "mme",       to: "enodeb-02",status: "warning" },
      { from: "enodeb-01", to: "bearer-a", status: "warning" },
      { from: "enodeb-02", to: "bearer-b", status: "healthy" },
      { from: "p-cscf",    to: "bearer-a", status: "warning" },
      { from: "s-cscf",    to: "bearer-b", status: "healthy" },
    ],
  },
};

// ─── Conversations ────────────────────────────────────────────────────────────

export const CONVERSATIONS: ConvEntry[] = [
  {
    id:       "c1",
    title:    "AMS-IX packet loss investigation",
    preview:  "Root cause traced to AS3320 prefix withdrawal.",
    status:   "Resolved",
    age:      "1h ago",
    domainId: "ip-core",
  },
  {
    id:       "c2",
    title:    "EU-CENTRAL capacity forecast",
    preview:  "98% utilisation predicted in 15 min.",
    status:   "Pending",
    age:      "22m ago",
    domainId: "ip-core",
  },
  {
    id:       "c3",
    title:    "BGP session flap — Telecom Italia",
    preview:  "Recommendation rejected by on-call engineer.",
    status:   "Rejected",
    age:      "3h ago",
    domainId: "ip-core",
  },
  {
    id:       "c4",
    title:    "DE-West CXI degradation root cause",
    preview:  "232 subscribers affected — RAN optimisation queued.",
    status:   "Pending",
    age:      "11m ago",
    domainId: "cxi",
  },
  {
    id:       "c5",
    title:    "North zone CXI score analysis",
    preview:  "Hamburg Met. below 3.5 — case escalated.",
    status:   "Resolved",
    age:      "2h ago",
    domainId: "cxi",
  },
  {
    id:       "c6",
    title:    "Frankfurt Rhine critical alert",
    preview:  "Score 2.8 — action taken, monitoring.",
    status:   "Resolved",
    age:      "5h ago",
    domainId: "cxi",
  },
  {
    id:       "c7",
    title:    "VoLTE SLA breach risk — Frankfurt",
    preview:  "Bearer-A at 88% — SLA breach in 22m.",
    status:   "Pending",
    age:      "31m ago",
    domainId: "volte",
  },
  {
    id:       "c8",
    title:    "eNodeB-01 critical investigation",
    preview:  "P-CSCF reroute applied — monitoring.",
    status:   "Resolved",
    age:      "4h ago",
    domainId: "volte",
  },
];

// ─── Suggestion chips ─────────────────────────────────────────────────────────

export const SUGGESTION_CHIPS: Record<"ip-core" | "cxi" | "volte", string[]> = {
  "ip-core": [
    "What's causing the AMS-IX packet loss?",
    "Show top 3 congested peering links",
    "Predict capacity risk for next 24h",
  ],
  cxi: [
    "Which regions have the worst CXI scores?",
    "Root cause for DE-West degradation?",
    "Show cells scoring below 3.5 threshold",
  ],
  volte: [
    "Is there a VoLTE SLA breach risk?",
    "Which bearers are nearing capacity?",
    "Predict P-CSCF load for peak hours",
  ],
};

// ─── Mock responses ───────────────────────────────────────────────────────────

export const MOCK_RESPONSES: Record<"ip-core" | "cxi" | "volte", string[]> = {
  "ip-core": [
    "Analysis of DE-CIX peering telemetry indicates that AS3320 (DTAG) withdrew 847 prefixes at 14:32 UTC, triggering a cascade of BGP reconvergence events.\n\nAMS-IX is currently absorbing 34% excess traffic as a result, with utilisation at 89%. EU-CORE-02 lost its primary path and is now unreachable via DE-CIX — standby route via LINX is active but adds 18ms latency.\n\nRecommended action: contact DTAG NOC (AS3320) to restore withdrawn prefixes. Estimated restoration window: 25–40 minutes.",
    "EU-CENTRAL link utilisation has climbed to 93% over the last 8 minutes and is trending toward saturation.\n\nAt current ingestion rate (+1.2% per minute), the 98% threshold will be breached in approximately 12–15 minutes. The Milan IX peer has spare capacity (61% utilisation) and can absorb traffic if traffic engineering policies are updated.\n\nRecommended action: apply ECMP weight shift to redistribute 30% of EU-CENTRAL traffic toward Milan IX. This requires a router config push on eu-central-r01 and eu-central-r02. Change ticket can be raised automatically — confirm to proceed.",
    "Historical BGP flap pattern for Telecom Italia peer (AS6762) shows 3 similar events in the past 14 days, all correlated with maintenance windows between 02:00–04:00 local time.\n\nCurrent session uptime is 7h 14m. No active alarms on this peer right now, but the pattern suggests a recurrence risk tonight.\n\nRecommendation: pre-stage a traffic shift to LINX as a contingency. I can generate the config diff for review if needed.",
  ],
  cxi: [
    "DE-West zone is showing the most significant CXI degradation across all three monitored regions. Frankfurt Rhine is the worst-performing cell cluster at a score of 2.8 (threshold: 3.5).\n\nRoot cause analysis points to elevated SINR interference on the 1800 MHz band, likely caused by a neighbour cell parameter mismatch after last night's SON update. 232 subscribers are currently experiencing sub-threshold quality.\n\nRAN optimisation job has been queued for the affected cells. Estimated time to resolve: 18–25 minutes post-execution.",
    "North Zone CXI scores over the past 2 hours:\n• Hamburg Met.: 3.1 (below threshold, escalated)\n• Berlin Metro: 3.7 (marginal, monitoring)\n• Zone aggregate: 3.4\n\nHamburg Met. degradation correlates with a 40% increase in connected devices since 13:00, likely a sporting event venue load spike. Temporary capacity boost via carrier aggregation activation on sector 3 and 4 has been applied.\n\nCurrent Hamburg Met. score trajectory shows recovery — projected to cross 3.5 within 11 minutes.",
    "Cells scoring below the 3.5 CXI threshold right now:\n1. Frankfurt Rhine — 2.8 (critical, action in progress)\n2. Hamburg Met. — 3.1 (degraded, CA boost applied)\n3. Cologne North — 3.4 (borderline, monitor)\n\nCologne North degradation appears to be transient — no RAN faults detected, likely user-plane congestion. No automated intervention recommended at this time.\n\nOverall zone health: 6 of 9 monitored cell clusters are at or above threshold.",
  ],
  volte: [
    "Bearer-A is currently at 88% capacity on the Frankfurt IMS region. At the current voice call arrival rate, SLA breach (>95% bearer utilisation) is projected in approximately 22 minutes.\n\nThe P-CSCF handling this bearer is at 71% CPU — within normal range. The risk is bearer-plane, not signalling.\n\nRecommended action: activate the spare bearer (Bearer-C, currently idle) and update the session routing policy on P-CSCF to distribute new sessions across both bearers. This can be executed without service interruption. Confirm to generate the config change.",
    "Bearer capacity utilisation summary:\n• Bearer-A: 88% (critical — approaching SLA breach)\n• Bearer-B: 52% (healthy)\n• Bearer-C: 0% (idle, standby)\n\nBearer-A is the only bearer at risk. Bearer-B has sufficient headroom and could absorb up to 35% additional load if traffic is redistributed.\n\neNodeB-01 feeding Bearer-A is in critical state — the MME→eNodeB-01 path is down, which is contributing to session concentration on Bearer-A from the P-CSCF path.\n\nRestoring the MME path is the highest-priority remediation.",
    "P-CSCF peak hour load prediction for the next 4 hours:\n• 15:00–16:00: 74% CPU (current: 71%)\n• 16:00–17:00: 81% CPU (elevated — typical evening peak)\n• 17:00–18:00: 89% CPU (high risk — approaching threshold)\n• 18:00–19:00: 83% CPU (declining)\n\nAt 89% CPU load, P-CSCF response latency will exceed the 200ms SLA target for a portion of sessions. Pre-emptive horizontal scaling (spin up P-CSCF-2) is recommended before 16:30.\n\nThe S-CSCF is not at risk — current load 44%, projected peak 58%.",
  ],
};
