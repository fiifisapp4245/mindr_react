// ─── Types ───────────────────────────────────────────────────────────────────

export type NodeStatus = "core" | "healthy" | "warning" | "critical";

export interface NodeKpi {
  label: string;
  value: string;
  status: "ok" | "warn" | "crit";
}

export interface NodeAlarm {
  severity: "critical" | "warning";
  message: string;
  age: string;
}

export interface NodeDetail {
  description: string;
  location: string;
  team: string;
  kpis: NodeKpi[];
  alarms: NodeAlarm[];
}
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

// ─── Node detail data ─────────────────────────────────────────────────────────

export const NODE_DETAILS: Record<string, NodeDetail> = {
  // ── IP Core ──────────────────────────────────────────────────────────────────
  "de-cix": {
    description: "Primary Frankfurt internet exchange point. Handles inter-AS traffic routing for EU-CENTRAL and EU-CORE peers.",
    location: "Frankfurt, DE",
    team: "Peering Ops — IP Core",
    kpis: [
      { label: "BGP Sessions", value: "47",      status: "ok" },
      { label: "Traffic In",   value: "312 Gbps", status: "ok" },
      { label: "Traffic Out",  value: "289 Gbps", status: "ok" },
      { label: "Latency",      value: "1.2 ms",  status: "ok" },
    ],
    alarms: [],
  },
  "ams-ix": {
    description: "AMS-IX Amsterdam peering point. Currently absorbing excess traffic from DE-CIX reconvergence event.",
    location: "Amsterdam, NL",
    team: "Peering Ops — IP Core",
    kpis: [
      { label: "BGP Sessions", value: "31",    status: "ok"   },
      { label: "Utilisation",  value: "89%",   status: "warn" },
      { label: "Packet Loss",  value: "0.12%", status: "warn" },
      { label: "Latency",      value: "2.4 ms",status: "ok"   },
    ],
    alarms: [
      { severity: "warning", message: "Utilisation above 85% threshold — excess traffic from DE-CIX reconvergence", age: "14m" },
    ],
  },
  "linx": {
    description: "LINX London exchange. Healthy — acting as standby path for EU-CORE-02 traffic.",
    location: "London, UK",
    team: "Peering Ops — IP Core",
    kpis: [
      { label: "BGP Sessions", value: "28",    status: "ok" },
      { label: "Utilisation",  value: "54%",   status: "ok" },
      { label: "Packet Loss",  value: "0.01%", status: "ok" },
      { label: "Latency",      value: "4.1 ms",status: "ok" },
    ],
    alarms: [],
  },
  "eu-core-02": {
    description: "Critical EU backbone router. Primary path via DE-CIX is down — standby LINX route active with +18ms added latency.",
    location: "Frankfurt, DE",
    team: "Core Network Ops",
    kpis: [
      { label: "Reachability", value: "Degraded", status: "crit" },
      { label: "Active Paths", value: "1 / 2",    status: "crit" },
      { label: "Latency",      value: "+18 ms",   status: "warn" },
      { label: "CPU",          value: "76%",       status: "warn" },
    ],
    alarms: [
      { severity: "critical", message: "Primary path via DE-CIX unreachable — BGP reconvergence in progress", age: "22m" },
      { severity: "warning",  message: "Standby LINX route active — elevated latency (+18ms)", age: "22m" },
    ],
  },
  "eu-west-01": {
    description: "EU-WEST backbone router. Receiving degraded traffic via EU-CORE-02 failover path.",
    location: "Amsterdam, NL",
    team: "Core Network Ops",
    kpis: [
      { label: "Utilisation", value: "73%",   status: "warn" },
      { label: "CPU",         value: "62%",   status: "ok"   },
      { label: "Packet Loss", value: "0.08%", status: "warn" },
      { label: "BGP Peers",   value: "12",    status: "ok"   },
    ],
    alarms: [
      { severity: "warning", message: "Elevated packet loss from EU-CORE-02 failover path", age: "21m" },
    ],
  },
  "eu-central": {
    description: "EU-CENTRAL router at 93% utilisation. At current growth rate (+1.2%/min), 98% threshold breached in ~12 min.",
    location: "Frankfurt, DE",
    team: "Core Network Ops",
    kpis: [
      { label: "Utilisation", value: "93%",      status: "crit" },
      { label: "Traffic In",  value: "186 Gbps", status: "warn" },
      { label: "CPU",         value: "81%",       status: "warn" },
      { label: "BGP Peers",   value: "9",         status: "ok"   },
    ],
    alarms: [
      { severity: "warning", message: "Utilisation 93% — approaching 98% saturation threshold in ~12m", age: "8m" },
    ],
  },
  "milan-ix": {
    description: "Milan IX exchange. 39% spare capacity — candidate for traffic re-engineering from EU-CENTRAL.",
    location: "Milan, IT",
    team: "Peering Ops — IP Core",
    kpis: [
      { label: "Utilisation",  value: "61%", status: "ok"   },
      { label: "BGP Sessions", value: "22",  status: "ok"   },
      { label: "Latency",      value: "3.8 ms", status: "ok" },
      { label: "Headroom",     value: "39%", status: "ok"   },
    ],
    alarms: [
      { severity: "warning", message: "EU-CENTRAL upstream link entering warning state", age: "8m" },
    ],
  },
  "as3320": {
    description: "AS3320 (Deutsche Telekom AG). Withdrew 847 prefixes at 14:32 UTC causing BGP reconvergence cascade.",
    location: "Frankfurt, DE",
    team: "External — DTAG NOC",
    kpis: [
      { label: "Withdrawn Pfx", value: "847",    status: "crit" },
      { label: "Session State", value: "Down",   status: "crit" },
      { label: "Uptime",        value: "0h 22m", status: "crit" },
      { label: "Peer ASN",      value: "AS3320", status: "ok"   },
    ],
    alarms: [
      { severity: "critical", message: "847 prefixes withdrawn — BGP session reconverging", age: "22m" },
      { severity: "critical", message: "DE-CIX ↔ AS3320 path is down", age: "22m" },
    ],
  },

  // ── CXI ──────────────────────────────────────────────────────────────────────
  "cxi-core": {
    description: "Central CXI processing engine. Aggregates customer experience index scores from all geographic zones.",
    location: "Frankfurt Data Center",
    team: "CXI Analytics",
    kpis: [
      { label: "Zones Active", value: "3 / 3", status: "ok"   },
      { label: "CXI Score",    value: "3.6",   status: "warn" },
      { label: "Subscribers",  value: "1.24M", status: "ok"   },
      { label: "Active Cases", value: "3",     status: "warn" },
    ],
    alarms: [],
  },
  "zone-north": {
    description: "North zone covering Hamburg and Berlin metro areas. CXI degradation driven by Hamburg Met. load spike.",
    location: "North Germany",
    team: "RAN Ops — North",
    kpis: [
      { label: "CXI Score",        value: "3.4",     status: "warn" },
      { label: "Active Cells",     value: "312",     status: "ok"   },
      { label: "Subscribers",      value: "398K",    status: "ok"   },
      { label: "Below Threshold",  value: "2 cells", status: "warn" },
    ],
    alarms: [
      { severity: "warning", message: "Hamburg Met. CXI 3.1 — below 3.5 threshold, CA boost applied", age: "33m" },
    ],
  },
  "zone-west": {
    description: "West zone centered on Frankfurt Rhine. Critical CXI degradation — SINR interference on 1800 MHz band.",
    location: "West Germany",
    team: "RAN Ops — West",
    kpis: [
      { label: "CXI Score",     value: "2.8",   status: "crit" },
      { label: "Active Cells",  value: "284",   status: "ok"   },
      { label: "Affected UEs",  value: "232",   status: "crit" },
      { label: "SINR",          value: "-4 dB", status: "crit" },
    ],
    alarms: [
      { severity: "critical", message: "Frankfurt Rhine CXI 2.8 — RAN optimisation job queued", age: "6m" },
    ],
  },
  "zone-south": {
    description: "South zone covering Munich and Cologne/Bonn areas. All metrics within normal range.",
    location: "South Germany",
    team: "RAN Ops — South",
    kpis: [
      { label: "CXI Score",    value: "4.1",     status: "ok" },
      { label: "Active Cells", value: "356",     status: "ok" },
      { label: "Subscribers",  value: "461K",    status: "ok" },
      { label: "Throughput",   value: "2.4 Gbps",status: "ok" },
    ],
    alarms: [],
  },
  "hamburg": {
    description: "Hamburg Metropolitan cell cluster. Below CXI threshold — carrier aggregation boost applied on sectors 3 & 4.",
    location: "Hamburg, DE",
    team: "RAN Ops — North",
    kpis: [
      { label: "CXI Score",     value: "3.1",  status: "warn" },
      { label: "Connected UEs", value: "+40%", status: "warn" },
      { label: "CA Boost",      value: "Active",status: "ok"  },
      { label: "Recovery ETA",  value: "~11m", status: "warn" },
    ],
    alarms: [
      { severity: "warning", message: "Load spike — sporting event in coverage area, CA boost active", age: "33m" },
    ],
  },
  "berlin": {
    description: "Berlin Metro cell cluster. Marginal CXI at 3.7 — monitoring, no intervention required.",
    location: "Berlin, DE",
    team: "RAN Ops — North",
    kpis: [
      { label: "CXI Score",    value: "3.7",     status: "warn" },
      { label: "Active Cells", value: "184",     status: "ok"   },
      { label: "Throughput",   value: "1.1 Gbps",status: "ok"   },
      { label: "SINR",         value: "8.2 dB",  status: "ok"   },
    ],
    alarms: [
      { severity: "warning", message: "CXI 3.7 — marginal, monitoring without intervention", age: "1h" },
    ],
  },
  "frankfurt": {
    description: "Frankfurt Rhine cell cluster. Critical CXI 2.8 due to SON parameter mismatch causing SINR interference.",
    location: "Frankfurt, DE",
    team: "RAN Ops — West",
    kpis: [
      { label: "CXI Score",    value: "2.8",    status: "crit" },
      { label: "SINR",         value: "-4.0 dB",status: "crit" },
      { label: "Affected UEs", value: "232",    status: "crit" },
      { label: "RAN Opt. Job", value: "Queued", status: "warn" },
    ],
    alarms: [
      { severity: "critical", message: "SINR interference on 1800 MHz — SON neighbour mismatch after update", age: "6m" },
      { severity: "critical", message: "232 subscribers below CXI threshold", age: "6m" },
    ],
  },
  "munich": {
    description: "Munich Metro cell cluster. All KPIs within healthy range.",
    location: "Munich, DE",
    team: "RAN Ops — South",
    kpis: [
      { label: "CXI Score",    value: "4.3",     status: "ok" },
      { label: "Active Cells", value: "201",     status: "ok" },
      { label: "Throughput",   value: "1.4 Gbps",status: "ok" },
      { label: "SINR",         value: "12.1 dB", status: "ok" },
    ],
    alarms: [],
  },
  "cologne": {
    description: "Cologne/Bonn cell cluster. Borderline CXI 3.4 — transient user-plane congestion, no RAN fault detected.",
    location: "Cologne, DE",
    team: "RAN Ops — South",
    kpis: [
      { label: "CXI Score",    value: "3.4",     status: "warn" },
      { label: "Active Cells", value: "155",     status: "ok"   },
      { label: "Congestion",   value: "Moderate",status: "warn" },
      { label: "SINR",         value: "9.8 dB",  status: "ok"   },
    ],
    alarms: [],
  },

  // ── VoLTE ────────────────────────────────────────────────────────────────────
  "ims-core": {
    description: "IMS Core — central session control plane for VoLTE. Connects all P-CSCF, S-CSCF, HSS, and MME elements.",
    location: "Frankfurt, DE",
    team: "IMS Ops",
    kpis: [
      { label: "Sessions",   value: "84.2K", status: "ok" },
      { label: "SIP Errors", value: "0.3%",  status: "ok" },
      { label: "CPU",        value: "58%",   status: "ok" },
      { label: "Latency",    value: "12 ms", status: "ok" },
    ],
    alarms: [],
  },
  "p-cscf": {
    description: "Proxy-CSCF — SIP proxy handling session setup and bearer anchoring. CPU forecast exceeds threshold at 17:00.",
    location: "Frankfurt, DE",
    team: "IMS Ops",
    kpis: [
      { label: "CPU",          value: "71%",          status: "ok"   },
      { label: "Sessions",     value: "31.4K",        status: "ok"   },
      { label: "SIP Errors",   value: "0.4%",         status: "ok"   },
      { label: "Peak CPU ETA", value: "89% by 17:00", status: "warn" },
    ],
    alarms: [],
  },
  "s-cscf": {
    description: "Serving-CSCF — handles SIP registration and call routing. Operating within normal parameters.",
    location: "Frankfurt, DE",
    team: "IMS Ops",
    kpis: [
      { label: "CPU",       value: "44%",  status: "ok" },
      { label: "Sessions",  value: "28.1K",status: "ok" },
      { label: "Reg. Rate", value: "142/s",status: "ok" },
      { label: "Latency",   value: "8 ms", status: "ok" },
    ],
    alarms: [],
  },
  "hss": {
    description: "Home Subscriber Server — subscriber profile and authentication repository. No active issues.",
    location: "Frankfurt, DE",
    team: "Core Data Ops",
    kpis: [
      { label: "Auth/s",   value: "3.2K", status: "ok" },
      { label: "DB Lag",   value: "2 ms", status: "ok" },
      { label: "CPU",      value: "31%",  status: "ok" },
      { label: "Profiles", value: "4.8M", status: "ok" },
    ],
    alarms: [],
  },
  "mme": {
    description: "Mobility Management Entity — eNodeB attachment and bearer setup. S1 path to eNodeB-01 is down.",
    location: "Frankfurt, DE",
    team: "EPC Ops",
    kpis: [
      { label: "Attached eNBs",  value: "1 / 2", status: "warn" },
      { label: "Active Bearers", value: "62.3K", status: "ok"   },
      { label: "CPU",            value: "67%",   status: "ok"   },
      { label: "S11 Latency",    value: "14 ms", status: "ok"   },
    ],
    alarms: [
      { severity: "warning", message: "S1-MME path to eNodeB-01 is down — one eNB detached", age: "38m" },
    ],
  },
  "enodeb-01": {
    description: "eNodeB-01 — critical state. S1 path to MME is down; sessions concentrated on Bearer-A via P-CSCF.",
    location: "Frankfurt East",
    team: "RAN Ops — VoLTE",
    kpis: [
      { label: "S1 Status",    value: "Down",   status: "crit" },
      { label: "Attached UEs", value: "0",      status: "crit" },
      { label: "Bearer-A Load",value: "+18%",   status: "warn" },
      { label: "Last Sync",    value: "38m ago",status: "crit" },
    ],
    alarms: [
      { severity: "critical", message: "S1-MME interface down — all UEs migrated to eNodeB-02", age: "38m" },
      { severity: "critical", message: "Bearer-A at 88% — load surge from eNB-01 failover", age: "38m" },
    ],
  },
  "enodeb-02": {
    description: "eNodeB-02 — handling elevated load from eNodeB-01 failover. Within warning threshold.",
    location: "Frankfurt West",
    team: "RAN Ops — VoLTE",
    kpis: [
      { label: "S1 Status",    value: "Up",      status: "ok"   },
      { label: "Attached UEs", value: "4.2K",    status: "warn" },
      { label: "PRB Usage",    value: "78%",     status: "warn" },
      { label: "SINR",         value: "6.4 dB",  status: "ok"   },
    ],
    alarms: [
      { severity: "warning", message: "PRB utilisation elevated due to eNodeB-01 failover load", age: "38m" },
    ],
  },
  "bearer-a": {
    description: "Bearer-A — VoLTE media bearer at 88% capacity. SLA breach risk projected in ~22 minutes.",
    location: "Frankfurt, DE",
    team: "EPC Ops",
    kpis: [
      { label: "Utilisation", value: "88%",   status: "crit" },
      { label: "SLA Breach",  value: "~22m",  status: "crit" },
      { label: "Sessions",    value: "18.4K", status: "warn" },
      { label: "Headroom",    value: "7%",    status: "crit" },
    ],
    alarms: [
      { severity: "critical", message: "Bearer capacity 88% — SLA breach projected in ~22m", age: "31m" },
    ],
  },
  "bearer-b": {
    description: "Bearer-B — healthy VoLTE media bearer with 43% headroom. Can absorb Bearer-A overflow if redistributed.",
    location: "Frankfurt, DE",
    team: "EPC Ops",
    kpis: [
      { label: "Utilisation", value: "52%",   status: "ok" },
      { label: "Headroom",    value: "43%",   status: "ok" },
      { label: "Sessions",    value: "10.8K", status: "ok" },
      { label: "Latency",     value: "18 ms", status: "ok" },
    ],
    alarms: [],
  },
};
