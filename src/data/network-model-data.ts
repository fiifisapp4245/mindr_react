// ─── Types ───────────────────────────────────────────────────────────────────

export type NodeStatus = "core" | "healthy" | "warning" | "critical";
export type EdgeStatus = "healthy" | "warning" | "down";

export interface ChatMsg {
  role: "user" | "assistant";
  text: string;
  highlightNodeIds?: string[];  // assistant messages: graph nodes this answer references
  focusNodeId?: string;
}

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

export interface DomainGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ConvEntry {
  id: string;
  title: string;
  timestamp: string;  // ISO date string
  domainId: "ip-core" | "cxi" | "volte";
  messages: ChatMsg[];
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

// Intent system
export interface IntentAnswer {
  text: string;
  highlightNodeIds: string[];
  focusNodeId?: string;
}

export interface CuratedIntent {
  keywords: string[];
  answer: IntentAnswer;
}

// ─── Color maps ───────────────────────────────────────────────────────────────

export const NODE_COLOR: Record<NodeStatus, string> = {
  core:     "#4D9EFF",
  healthy:  "#2DD4BF",
  warning:  "#FFB020",
  critical: "#FF3B3B",
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
    label:       "IP Peering",
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
    label:       "VoLTE",
    fullLabel:   "VoLTE Overload Protection",
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
      { id: "de-cix",     label: "DE-CIX Frankfurt", x: 50, y: 44, status: "core"     },
      { id: "ams-ix",     label: "AMS-IX Amsterdam",  x: 22, y: 28, status: "healthy"  },
      { id: "linx",       label: "LINX London",       x: 76, y: 28, status: "healthy"  },
      { id: "eu-core-02", label: "EU-CORE-02",        x: 38, y: 65, status: "critical" },
      { id: "eu-west-01", label: "EU-WEST-01",        x: 14, y: 52, status: "warning"  },
      { id: "eu-central", label: "EU-CENTRAL",        x: 66, y: 60, status: "warning"  },
      { id: "milan-ix",   label: "Milan IX",          x: 74, y: 78, status: "warning"  },
      { id: "as3320",     label: "AS3320 (DTAG)",     x: 50, y: 12, status: "critical" },
    ],
    edges: [
      { from: "de-cix",     to: "ams-ix",     status: "healthy" },
      { from: "de-cix",     to: "linx",       status: "healthy" },
      { from: "de-cix",     to: "eu-core-02", status: "down"    },
      { from: "de-cix",     to: "eu-central", status: "warning" },
      { from: "de-cix",     to: "as3320",     status: "down"    },
      { from: "ams-ix",     to: "eu-west-01", status: "healthy" },
      { from: "ams-ix",     to: "eu-core-02", status: "down"    },
      { from: "linx",       to: "milan-ix",   status: "healthy" },
      { from: "eu-central", to: "milan-ix",   status: "warning" },
      { from: "eu-core-02", to: "eu-west-01", status: "warning" },
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
      { from: "cxi-core",   to: "zone-north", status: "warning" },
      { from: "cxi-core",   to: "zone-west",  status: "down"    },
      { from: "cxi-core",   to: "zone-south", status: "healthy" },
      { from: "zone-north", to: "hamburg",    status: "warning" },
      { from: "zone-north", to: "berlin",     status: "warning" },
      { from: "zone-west",  to: "frankfurt",  status: "down"    },
      { from: "zone-south", to: "munich",     status: "healthy" },
      { from: "zone-south", to: "cologne",    status: "healthy" },
    ],
  },

  volte: {
    nodes: [
      { id: "ims-core",  label: "IMS Core",  x: 50, y: 45, status: "core"     },
      { id: "p-cscf",    label: "P-CSCF",    x: 24, y: 24, status: "healthy"  },
      { id: "s-cscf",    label: "S-CSCF",    x: 76, y: 24, status: "healthy"  },
      { id: "hss",       label: "HSS",       x: 50, y: 10, status: "healthy"  },
      { id: "mme",       label: "MME",       x: 18, y: 65, status: "warning"  },
      { id: "enodeb-01", label: "eNodeB-01", x:  8, y: 45, status: "critical" },
      { id: "enodeb-02", label: "eNodeB-02", x: 82, y: 60, status: "warning"  },
      { id: "bearer-a",  label: "Bearer-A",  x: 34, y: 82, status: "warning"  },
      { id: "bearer-b",  label: "Bearer-B",  x: 64, y: 82, status: "healthy"  },
    ],
    edges: [
      { from: "ims-core",  to: "p-cscf",    status: "healthy" },
      { from: "ims-core",  to: "s-cscf",    status: "healthy" },
      { from: "ims-core",  to: "hss",       status: "healthy" },
      { from: "ims-core",  to: "mme",       status: "warning" },
      { from: "mme",       to: "enodeb-01", status: "down"    },
      { from: "mme",       to: "enodeb-02", status: "warning" },
      { from: "enodeb-01", to: "bearer-a",  status: "warning" },
      { from: "enodeb-02", to: "bearer-b",  status: "healthy" },
      { from: "p-cscf",    to: "bearer-a",  status: "warning" },
      { from: "s-cscf",    to: "bearer-b",  status: "healthy" },
    ],
  },
};

// ─── Initial conversation history ─────────────────────────────────────────────
// Timestamps fixed relative to 2026-07-08 (today).
// Recent = today; Earlier = yesterday or older.

export const INITIAL_CONVERSATIONS: ConvEntry[] = [
  {
    id:        "c1",
    title:     "AMS-IX packet loss investigation",
    timestamp: "2026-07-08T13:20:00Z",
    domainId:  "ip-core",
    messages: [
      { role: "user", text: "What's causing the AMS-IX packet loss?" },
      {
        role:             "assistant",
        text:             "Analysis of DE-CIX peering telemetry indicates that AS3320 (DTAG) withdrew 847 prefixes at 14:32 UTC, triggering a BGP reconvergence cascade.\n\nAMS-IX Amsterdam is now absorbing 34% excess traffic, currently at 89% utilisation. EU-CORE-02 lost its primary path via DE-CIX — standby route via LINX London is active but adds +18ms latency.\n\nRecommended action: contact DTAG NOC (AS3320) to restore withdrawn prefixes. Estimated restoration window: 25–40 minutes.",
        highlightNodeIds: ["ams-ix", "de-cix", "as3320", "eu-core-02", "linx"],
        focusNodeId:      "ams-ix",
      },
    ],
  },
  {
    id:        "c2",
    title:     "EU-CENTRAL capacity forecast",
    timestamp: "2026-07-08T13:50:00Z",
    domainId:  "ip-core",
    messages: [
      { role: "user", text: "Show EU-CENTRAL capacity risk and alternatives" },
      {
        role:             "assistant",
        text:             "EU-CENTRAL link utilisation has climbed to 93% over the last 8 minutes, trending toward saturation.\n\nAt the current growth rate (+1.2%/min), the 98% threshold will be breached in approximately 12–15 minutes. Milan IX has spare capacity at 61% utilisation and can absorb rerouted traffic.\n\nRecommended action: apply ECMP weight shift to redistribute 30% of EU-CENTRAL traffic toward Milan IX. Requires a config push on eu-central-r01 and eu-central-r02.",
        highlightNodeIds: ["eu-central", "milan-ix"],
        focusNodeId:      "eu-central",
      },
    ],
  },
  {
    id:        "c3",
    title:     "BGP session flap — Telecom Italia",
    timestamp: "2026-07-07T11:14:00Z",
    domainId:  "ip-core",
    messages: [
      { role: "user", text: "Show the peers of AS6762" },
      {
        role:             "assistant",
        text:             "Historical BGP flap pattern for Telecom Italia (AS6762) shows 3 similar events in the past 14 days, all correlated with maintenance windows between 02:00–04:00 local time.\n\nCurrent session uptime is 7h 14m via LINX London. No active alarms on this peer right now, but the pattern suggests recurrence risk tonight.\n\nRecommendation: pre-stage a traffic shift to LINX as a contingency. I can generate the config diff for review if needed.",
        highlightNodeIds: ["linx", "de-cix"],
        focusNodeId:      "linx",
      },
    ],
  },
  {
    id:        "c4",
    title:     "DE-West CXI degradation root cause",
    timestamp: "2026-07-08T14:15:00Z",
    domainId:  "cxi",
    messages: [
      { role: "user", text: "Root cause for DE-West degradation?" },
      {
        role:             "assistant",
        text:             "DE-West zone is showing the most significant CXI degradation across all three monitored regions. Frankfurt Rhine is the worst-performing cluster at a score of 2.8 (threshold: 3.5).\n\nRoot cause: elevated SINR interference on the 1800 MHz band, caused by a neighbour cell parameter mismatch after last night's SON update. 232 subscribers are currently experiencing sub-threshold quality.\n\nRAN optimisation job has been queued for the affected cells. Estimated resolution: 18–25 minutes post-execution.",
        highlightNodeIds: ["zone-west", "frankfurt", "cxi-core"],
        focusNodeId:      "zone-west",
      },
    ],
  },
  {
    id:        "c5",
    title:     "North zone CXI score analysis",
    timestamp: "2026-07-07T12:00:00Z",
    domainId:  "cxi",
    messages: [
      { role: "user", text: "Which regions have the worst CXI scores?" },
      {
        role:             "assistant",
        text:             "North Zone CXI scores over the past 2 hours:\n• Hamburg Met.: 3.1 (below threshold, escalated)\n• Berlin Metro: 3.7 (marginal, monitoring)\n• Zone aggregate: 3.4\n\nHamburg Met. degradation correlates with a 40% increase in connected devices since 13:00, likely a sporting event venue load spike. CA boost applied on sectors 3 and 4. Projected recovery: crossing 3.5 in ~11 minutes.",
        highlightNodeIds: ["zone-north", "hamburg", "berlin"],
        focusNodeId:      "zone-north",
      },
    ],
  },
  {
    id:        "c6",
    title:     "Frankfurt Rhine critical alert",
    timestamp: "2026-07-07T09:00:00Z",
    domainId:  "cxi",
    messages: [
      { role: "user", text: "Show cells scoring below the 3.5 threshold" },
      {
        role:             "assistant",
        text:             "Cells scoring below the 3.5 CXI threshold:\n1. Frankfurt Rhine — 2.8 (critical, RAN opt. job queued)\n2. Hamburg Met. — 3.1 (degraded, CA boost applied)\n3. Cologne/Bonn — 3.4 (borderline, transient congestion)\n\nCologne/Bonn degradation appears transient — no RAN faults detected, no automated intervention recommended.\n\nOverall: 6 of 9 monitored clusters are at or above threshold.",
        highlightNodeIds: ["frankfurt", "hamburg", "cologne", "zone-west", "zone-north"],
        focusNodeId:      "frankfurt",
      },
    ],
  },
  {
    id:        "c7",
    title:     "VoLTE SLA breach risk — Frankfurt",
    timestamp: "2026-07-08T14:00:00Z",
    domainId:  "volte",
    messages: [
      { role: "user", text: "Is there a VoLTE SLA breach risk?" },
      {
        role:             "assistant",
        text:             "Bearer-A is currently at 88% capacity on the Frankfurt IMS region. At the current voice call arrival rate, SLA breach (>95% bearer utilisation) is projected in approximately 22 minutes.\n\nThe P-CSCF handling this bearer is at 71% CPU — within normal range. The risk is bearer-plane, not signalling.\n\nRecommended action: activate spare bearer capacity and update P-CSCF session routing to distribute new sessions. This can be executed without service interruption.",
        highlightNodeIds: ["bearer-a", "p-cscf", "enodeb-01", "mme"],
        focusNodeId:      "bearer-a",
      },
    ],
  },
  {
    id:        "c8",
    title:     "eNodeB-01 critical investigation",
    timestamp: "2026-07-07T10:00:00Z",
    domainId:  "volte",
    messages: [
      { role: "user", text: "Why is eNodeB-01 in critical state?" },
      {
        role:             "assistant",
        text:             "eNodeB-01 S1 path to MME is down. All UEs have migrated to eNodeB-02, concentrating load on Bearer-A via P-CSCF path.\n\nMME shows 1 of 2 attached eNBs. Bearer-A load has surged +18% from the failover. The S1-MME interface failure is the root cause.\n\nActive alarms on eNodeB-01:\n• Critical: S1-MME interface down — all UEs migrated to eNodeB-02\n• Critical: Bearer-A at 88% — load surge from eNB-01 failover",
        highlightNodeIds: ["enodeb-01", "mme", "bearer-a", "p-cscf", "enodeb-02"],
        focusNodeId:      "enodeb-01",
      },
    ],
  },
];

// ─── Curated intent library ───────────────────────────────────────────────────
// Each intent: keyword set + grounded answer with node highlights.
// matchIntent() below maps user text to the closest supported intent.

const IP_CORE_INTENTS: CuratedIntent[] = [
  {
    keywords: ["ams-ix", "amsterdam", "packet loss"],
    answer: {
      text:             "Analysis of DE-CIX peering telemetry indicates that AS3320 (DTAG) withdrew 847 prefixes at 14:32 UTC, triggering a BGP reconvergence cascade.\n\nAMS-IX Amsterdam is now absorbing 34% excess traffic, currently at 89% utilisation. EU-CORE-02 lost its primary path via DE-CIX — standby route via LINX London is active but adds +18ms latency.\n\nRecommended action: contact DTAG NOC (AS3320) to restore withdrawn prefixes. Estimated restoration window: 25–40 minutes.",
      highlightNodeIds: ["ams-ix", "de-cix", "as3320", "eu-core-02", "linx"],
      focusNodeId:      "ams-ix",
    },
  },
  {
    keywords: ["eu-central", "capacity", "saturation", "congestion", "utilisation"],
    answer: {
      text:             "EU-CENTRAL link utilisation has climbed to 93% over the last 8 minutes, trending toward saturation.\n\nAt the current growth rate (+1.2%/min), the 98% threshold will be breached in approximately 12–15 minutes. Milan IX has spare capacity at 61% utilisation and can absorb rerouted traffic.\n\nRecommended action: apply ECMP weight shift to redistribute 30% of EU-CENTRAL traffic toward Milan IX. Requires a config push on eu-central-r01 and eu-central-r02.",
      highlightNodeIds: ["eu-central", "milan-ix"],
      focusNodeId:      "eu-central",
    },
  },
  {
    keywords: ["as3320", "dtag", "deutsche telekom", "prefix withdrawal", "bgp"],
    answer: {
      text:             "AS3320 (Deutsche Telekom AG) withdrew 847 prefixes at 14:32 UTC. The BGP session to DE-CIX Frankfurt is currently down (session uptime: 0h 22m).\n\nThis triggered a reconvergence cascade: EU-CORE-02 lost its primary upstream path, forcing traffic reroute via LINX London with +18ms latency. AMS-IX Amsterdam is absorbing overflow at 89% utilisation.\n\nTwo critical alarms are active on AS3320. Action: contact DTAG NOC directly.",
      highlightNodeIds: ["as3320", "de-cix", "eu-core-02", "ams-ix", "linx"],
      focusNodeId:      "as3320",
    },
  },
  {
    keywords: ["eu-core-02", "unreachable", "path", "route", "backbone"],
    answer: {
      text:             "EU-CORE-02 primary path via DE-CIX Frankfurt is down. The router is currently reachable only via standby LINX London route, adding +18ms latency.\n\nActive paths: 1 of 2. CPU usage at 76%. EU-WEST-01 is experiencing elevated packet loss (0.08%) from this failover path.\n\nActive alarms:\n• Critical: Primary path via DE-CIX unreachable — BGP reconvergence in progress\n• Warning: Standby LINX London route active — elevated latency",
      highlightNodeIds: ["eu-core-02", "de-cix", "linx", "eu-west-01"],
      focusNodeId:      "eu-core-02",
    },
  },
  {
    keywords: ["critical", "warning", "degraded", "alarms", "status", "health", "which nodes"],
    answer: {
      text:             "Current node health summary for IP Peering:\n\nCritical (2 nodes):\n• AS3320 (DTAG) — BGP session down, 847 prefixes withdrawn\n• EU-CORE-02 — primary path down, degraded reachability\n\nWarning (4 nodes):\n• AMS-IX Amsterdam — 89% utilisation, packet loss 0.12%\n• EU-CENTRAL — 93% utilisation, saturation risk in ~12m\n• EU-WEST-01 — elevated packet loss from EU-CORE-02 failover\n• Milan IX — EU-CENTRAL upstream entering warning state\n\nHealthy: DE-CIX Frankfurt, LINX London",
      highlightNodeIds: ["as3320", "eu-core-02", "ams-ix", "eu-central", "eu-west-01", "milan-ix"],
      focusNodeId:      "as3320",
    },
  },
  {
    keywords: ["linx", "london", "standby", "peers of", "peering"],
    answer: {
      text:             "LINX London is currently serving as the standby path for EU-CORE-02 following the DE-CIX ↔ AS3320 session failure. Utilisation is 54%, well within normal range.\n\nBGP sessions active on LINX London: 28. Latency: 4.1ms. Packet loss: 0.01%.\n\nLINX London also has a healthy link to Milan IX. It is the only active path currently reaching EU-CORE-02 — preserving LINX stability is critical during the AS3320 reconvergence.",
      highlightNodeIds: ["linx", "eu-core-02", "milan-ix", "de-cix"],
      focusNodeId:      "linx",
    },
  },
];

const CXI_INTENTS: CuratedIntent[] = [
  {
    keywords: ["de-west", "west zone", "frankfurt", "degradation", "root cause", "sinr"],
    answer: {
      text:             "DE-West zone is showing the most significant CXI degradation across all three monitored regions. Frankfurt Rhine is the worst-performing cluster at a score of 2.8 (threshold: 3.5).\n\nRoot cause: elevated SINR interference on the 1800 MHz band, caused by a neighbour cell parameter mismatch after last night's SON update. 232 subscribers are currently experiencing sub-threshold quality.\n\nRAN optimisation job has been queued. Estimated resolution: 18–25 minutes post-execution.",
      highlightNodeIds: ["zone-west", "frankfurt", "cxi-core"],
      focusNodeId:      "zone-west",
    },
  },
  {
    keywords: ["worst", "regions", "zones", "scores", "ranking", "which regions"],
    answer: {
      text:             "CXI scores by zone:\n\n• West Zone — 2.8 avg (Critical: Frankfurt Rhine 2.8)\n• North Zone — 3.4 avg (Warning: Hamburg Met. 3.1, Berlin Metro 3.7)\n• South Zone — 4.1 avg (Healthy: Munich Metro 4.3, Cologne/Bonn 3.4)\n\nWest Zone is the primary concern. Frankfurt Rhine at 2.8 is 0.7 below the 3.5 threshold with 232 affected subscribers.",
      highlightNodeIds: ["zone-west", "zone-north", "zone-south", "frankfurt", "hamburg"],
      focusNodeId:      "zone-west",
    },
  },
  {
    keywords: ["threshold", "below 3.5", "below threshold", "cells", "below"],
    answer: {
      text:             "Cells scoring below the 3.5 CXI threshold:\n1. Frankfurt Rhine — 2.8 (critical, RAN opt. job queued)\n2. Hamburg Met. — 3.1 (degraded, CA boost active)\n3. Cologne/Bonn — 3.4 (borderline, transient congestion)\n\nCologne/Bonn degradation appears transient — no RAN faults detected, no automated intervention recommended.\n\nOverall: 6 of 9 monitored clusters are at or above threshold.",
      highlightNodeIds: ["frankfurt", "hamburg", "cologne", "zone-west", "zone-north"],
      focusNodeId:      "frankfurt",
    },
  },
  {
    keywords: ["north", "hamburg", "berlin", "north zone"],
    answer: {
      text:             "North Zone CXI scores over the past 2 hours:\n• Hamburg Met.: 3.1 (below threshold, escalated)\n• Berlin Metro: 3.7 (marginal, monitoring)\n• Zone aggregate: 3.4\n\nHamburg Met. degradation correlates with a 40% increase in connected devices since 13:00, likely a sporting event venue load spike. CA boost applied on sectors 3 and 4.\n\nProjected recovery: Hamburg Met. crossing 3.5 within ~11 minutes.",
      highlightNodeIds: ["zone-north", "hamburg", "berlin"],
      focusNodeId:      "zone-north",
    },
  },
  {
    keywords: ["south", "munich", "cologne"],
    answer: {
      text:             "South Zone CXI scores:\n• Munich Metro — 4.3 (healthy)\n• Cologne/Bonn — 3.4 (borderline, transient user-plane congestion)\n• Zone aggregate: 4.1\n\nCologne/Bonn is the only South Zone cluster showing any deviation. No RAN faults detected — congestion is user-plane only and expected to resolve without intervention.\n\nSouth Zone overall is healthy and does not require action.",
      highlightNodeIds: ["zone-south", "munich", "cologne"],
      focusNodeId:      "zone-south",
    },
  },
];

const VOLTE_INTENTS: CuratedIntent[] = [
  {
    keywords: ["sla", "breach", "risk", "sla breach", "bearer-a", "bearer a"],
    answer: {
      text:             "Bearer-A is currently at 88% capacity on the Frankfurt IMS region. At the current voice call arrival rate, SLA breach (>95% bearer utilisation) is projected in approximately 22 minutes.\n\nThe P-CSCF handling this bearer is at 71% CPU — within normal range. The risk is bearer-plane, not signalling.\n\nRecommended action: activate spare bearer capacity and update P-CSCF session routing policy to distribute new sessions across both bearers. This can be executed without service interruption.",
      highlightNodeIds: ["bearer-a", "p-cscf", "enodeb-01", "mme"],
      focusNodeId:      "bearer-a",
    },
  },
  {
    keywords: ["bearer", "capacity", "utilisation", "headroom"],
    answer: {
      text:             "Bearer capacity summary:\n• Bearer-A: 88% utilisation (Critical — SLA breach risk in ~22m)\n• Bearer-B: 52% utilisation (Healthy — 43% headroom available)\n\nBearer-A is the only bearer at risk. Bearer-B can absorb up to 35% additional load.\n\neNodeB-01 feeding Bearer-A is in critical state — the MME→eNodeB-01 S1 path is down, concentrating sessions on Bearer-A via P-CSCF. Restoring the MME path is the highest-priority remediation.",
      highlightNodeIds: ["bearer-a", "bearer-b", "enodeb-01", "enodeb-02", "mme"],
      focusNodeId:      "bearer-a",
    },
  },
  {
    keywords: ["enodeb-01", "enodeb01", "enodeb 01", "s1", "critical state", "why is"],
    answer: {
      text:             "eNodeB-01 S1 path to MME is down. All UEs have migrated to eNodeB-02, concentrating load on Bearer-A via P-CSCF path.\n\nMME shows 1 of 2 attached eNBs. Bearer-A load has surged +18% from the failover. The S1-MME interface failure is the root cause.\n\nActive alarms on eNodeB-01:\n• Critical: S1-MME interface down — all UEs migrated to eNodeB-02\n• Critical: Bearer-A at 88% — load surge from eNB-01 failover",
      highlightNodeIds: ["enodeb-01", "mme", "bearer-a", "p-cscf", "enodeb-02"],
      focusNodeId:      "enodeb-01",
    },
  },
  {
    keywords: ["p-cscf", "pcscf", "cpu", "load", "peak", "proxy"],
    answer: {
      text:             "P-CSCF peak hour load prediction:\n• 15:00–16:00: 74% CPU (current: 71%)\n• 16:00–17:00: 81% CPU (elevated — typical evening peak)\n• 17:00–18:00: 89% CPU (high risk — approaching 200ms SLA threshold)\n• 18:00–19:00: 83% CPU (declining)\n\nAt 89% CPU load, P-CSCF response latency will exceed the 200ms SLA target for a portion of sessions. Pre-emptive horizontal scaling (spin up P-CSCF-2) recommended before 16:30.\n\nS-CSCF is not at risk — current load 44%, projected peak 58%.",
      highlightNodeIds: ["p-cscf", "s-cscf", "bearer-a"],
      focusNodeId:      "p-cscf",
    },
  },
];

export const DOMAIN_INTENTS: Record<"ip-core" | "cxi" | "volte", CuratedIntent[]> = {
  "ip-core": IP_CORE_INTENTS,
  cxi:       CXI_INTENTS,
  volte:     VOLTE_INTENTS,
};

const UNSUPPORTED_ANSWER: IntentAnswer = {
  text:             "I can't map that question to a supported query for this domain.\n\nSupported queries include:\n• Path analysis between nodes\n• Node connectivity (1–2 hops)\n• Critical / warning node status\n• Capacity risk and alternatives\n• Peer / session status by AS or node\n• Alarm correlation for a specific node\n\nTry rephrasing with a specific node name, metric, or condition — or use one of the suggested questions below.",
  highlightNodeIds: [],
};

export function matchIntent(
  text: string,
  domainId: "ip-core" | "cxi" | "volte"
): IntentAnswer {
  const lower   = text.toLowerCase();
  const intents = DOMAIN_INTENTS[domainId];
  for (const intent of intents) {
    if (intent.keywords.some(kw => lower.includes(kw.toLowerCase()))) {
      return intent.answer;
    }
  }
  return UNSUPPORTED_ANSWER;
}

// ─── Suggestion chips ─────────────────────────────────────────────────────────
// 3 per domain — distinct, real, answerable questions that teach the operator
// what this tool can do. No generic placeholders.

export const SUGGESTION_CHIPS: Record<"ip-core" | "cxi" | "volte", string[]> = {
  "ip-core": [
    "What's causing the AMS-IX packet loss?",
    "Show EU-CENTRAL capacity risk and alternatives",
    "Which nodes are in critical or warning state?",
  ],
  cxi: [
    "Which regions have the worst CXI scores?",
    "Root cause for DE-West degradation?",
    "Show cells scoring below the 3.5 threshold",
  ],
  volte: [
    "Is there a VoLTE SLA breach risk?",
    "What's the bearer capacity situation?",
    "Why is eNodeB-01 in critical state?",
  ],
};

// ─── Node detail data ─────────────────────────────────────────────────────────

export const NODE_DETAILS: Record<string, NodeDetail> = {
  // ── IP Peering ───────────────────────────────────────────────────────────────
  "de-cix": {
    description: "Primary Frankfurt internet exchange point. Handles inter-AS traffic routing for EU-CENTRAL and EU-CORE peers.",
    location: "Frankfurt, DE",
    team: "Peering Ops — IP Peering",
    kpis: [
      { label: "BGP Sessions", value: "47",       status: "ok" },
      { label: "Traffic In",   value: "312 Gbps", status: "ok" },
      { label: "Traffic Out",  value: "289 Gbps", status: "ok" },
      { label: "Latency",      value: "1.2 ms",   status: "ok" },
    ],
    alarms: [],
  },
  "ams-ix": {
    description: "AMS-IX Amsterdam peering point. Currently absorbing excess traffic from DE-CIX reconvergence event.",
    location: "Amsterdam, NL",
    team: "Peering Ops — IP Peering",
    kpis: [
      { label: "BGP Sessions", value: "31",     status: "ok"   },
      { label: "Utilisation",  value: "89%",    status: "warn" },
      { label: "Packet Loss",  value: "0.12%",  status: "warn" },
      { label: "Latency",      value: "2.4 ms", status: "ok"   },
    ],
    alarms: [
      { severity: "warning", message: "Utilisation above 85% threshold — excess traffic from DE-CIX reconvergence", age: "14m" },
    ],
  },
  "linx": {
    description: "LINX London exchange. Healthy — acting as standby path for EU-CORE-02 traffic.",
    location: "London, UK",
    team: "Peering Ops — IP Peering",
    kpis: [
      { label: "BGP Sessions", value: "28",     status: "ok" },
      { label: "Utilisation",  value: "54%",    status: "ok" },
      { label: "Packet Loss",  value: "0.01%",  status: "ok" },
      { label: "Latency",      value: "4.1 ms", status: "ok" },
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
      { label: "Utilisation", value: "73%",    status: "warn" },
      { label: "CPU",         value: "62%",    status: "ok"   },
      { label: "Packet Loss", value: "0.08%",  status: "warn" },
      { label: "BGP Peers",   value: "12",     status: "ok"   },
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
      { label: "Utilisation", value: "93%",       status: "crit" },
      { label: "Traffic In",  value: "186 Gbps",  status: "warn" },
      { label: "CPU",         value: "81%",        status: "warn" },
      { label: "BGP Peers",   value: "9",          status: "ok"   },
    ],
    alarms: [
      { severity: "warning", message: "Utilisation 93% — approaching 98% saturation threshold in ~12m", age: "8m" },
    ],
  },
  "milan-ix": {
    description: "Milan IX exchange. 39% spare capacity — candidate for traffic re-engineering from EU-CENTRAL.",
    location: "Milan, IT",
    team: "Peering Ops — IP Peering",
    kpis: [
      { label: "Utilisation",  value: "61%",    status: "ok"   },
      { label: "BGP Sessions", value: "22",     status: "ok"   },
      { label: "Latency",      value: "3.8 ms", status: "ok"   },
      { label: "Headroom",     value: "39%",    status: "ok"   },
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
      { label: "CXI Score",       value: "3.4",     status: "warn" },
      { label: "Active Cells",    value: "312",     status: "ok"   },
      { label: "Subscribers",     value: "398K",    status: "ok"   },
      { label: "Below Threshold", value: "2 cells", status: "warn" },
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
      { label: "CXI Score",    value: "2.8",   status: "crit" },
      { label: "Active Cells", value: "284",   status: "ok"   },
      { label: "Affected UEs", value: "232",   status: "crit" },
      { label: "SINR",         value: "-4 dB", status: "crit" },
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
      { label: "CXI Score",    value: "4.1",      status: "ok" },
      { label: "Active Cells", value: "356",      status: "ok" },
      { label: "Subscribers",  value: "461K",     status: "ok" },
      { label: "Throughput",   value: "2.4 Gbps", status: "ok" },
    ],
    alarms: [],
  },
  "hamburg": {
    description: "Hamburg Metropolitan cell cluster. Below CXI threshold — carrier aggregation boost applied on sectors 3 & 4.",
    location: "Hamburg, DE",
    team: "RAN Ops — North",
    kpis: [
      { label: "CXI Score",     value: "3.1",   status: "warn" },
      { label: "Connected UEs", value: "+40%",  status: "warn" },
      { label: "CA Boost",      value: "Active",status: "ok"   },
      { label: "Recovery ETA",  value: "~11m",  status: "warn" },
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
      { label: "CXI Score",    value: "3.7",      status: "warn" },
      { label: "Active Cells", value: "184",      status: "ok"   },
      { label: "Throughput",   value: "1.1 Gbps", status: "ok"   },
      { label: "SINR",         value: "8.2 dB",   status: "ok"   },
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
      { label: "CXI Score",    value: "2.8",     status: "crit" },
      { label: "SINR",         value: "-4.0 dB", status: "crit" },
      { label: "Affected UEs", value: "232",     status: "crit" },
      { label: "RAN Opt. Job", value: "Queued",  status: "warn" },
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
      { label: "CXI Score",    value: "4.3",      status: "ok" },
      { label: "Active Cells", value: "201",      status: "ok" },
      { label: "Throughput",   value: "1.4 Gbps", status: "ok" },
      { label: "SINR",         value: "12.1 dB",  status: "ok" },
    ],
    alarms: [],
  },
  "cologne": {
    description: "Cologne/Bonn cell cluster. Borderline CXI 3.4 — transient user-plane congestion, no RAN fault detected.",
    location: "Cologne, DE",
    team: "RAN Ops — South",
    kpis: [
      { label: "CXI Score",    value: "3.4",      status: "warn" },
      { label: "Active Cells", value: "155",      status: "ok"   },
      { label: "Congestion",   value: "Moderate", status: "warn" },
      { label: "SINR",         value: "9.8 dB",   status: "ok"   },
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
      { label: "CPU",          value: "71%",           status: "ok"   },
      { label: "Sessions",     value: "31.4K",         status: "ok"   },
      { label: "SIP Errors",   value: "0.4%",          status: "ok"   },
      { label: "Peak CPU ETA", value: "89% by 17:00",  status: "warn" },
    ],
    alarms: [],
  },
  "s-cscf": {
    description: "Serving-CSCF — handles SIP registration and call routing. Operating within normal parameters.",
    location: "Frankfurt, DE",
    team: "IMS Ops",
    kpis: [
      { label: "CPU",       value: "44%",   status: "ok" },
      { label: "Sessions",  value: "28.1K", status: "ok" },
      { label: "Reg. Rate", value: "142/s", status: "ok" },
      { label: "Latency",   value: "8 ms",  status: "ok" },
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
      { label: "S1 Status",     value: "Down",    status: "crit" },
      { label: "Attached UEs",  value: "0",       status: "crit" },
      { label: "Bearer-A Load", value: "+18%",    status: "warn" },
      { label: "Last Sync",     value: "38m ago", status: "crit" },
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
      { label: "S1 Status",   value: "Up",     status: "ok"   },
      { label: "Attached UEs",value: "4.2K",   status: "warn" },
      { label: "PRB Usage",   value: "78%",    status: "warn" },
      { label: "SINR",        value: "6.4 dB", status: "ok"   },
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
