// ── Agent activity mock data ──────────────────────────────────────────────────

export type LifecycleStage = "Sense" | "Understand" | "Decide" | "Act" | "Learn";
export type AgentStatus    = "active" | "idle" | "escalating";
export type FeedState      = "Resolved" | "Diagnosing" | "Escalated" | "Monitoring";

export const LIFECYCLE_STAGES: LifecycleStage[] = [
  "Sense", "Understand", "Decide", "Act", "Learn",
];

export interface RosterAgent {
  id: string;
  name: string;
  role: string;
  lifecycleStage: LifecycleStage;
  status: AgentStatus;
  currentTask: string;
  load: number;        // 0–100
  domains: string[];   // display labels
}

export interface FeedEntry {
  id: string;
  state: FeedState;
  action: string;
  agentName: string;
  domainLabel: string;
  incidentRef: string;
  relativeTime: string;
  incidentRoute: string;
  lifecycleStage: LifecycleStage;
}

// ── Roster (one row per agent in the fleet) ───────────────────────────────────

export const AGENT_ROSTER: RosterAgent[] = [
  // IP Core
  { id: "r1",  name: "SCAN-ALPHA",   role: "Anomaly Detection",     lifecycleStage: "Act",        status: "active",     currentTask: "Rerouting AS3320 via secondary path",               load: 67, domains: ["IP Peering"] },
  { id: "r2",  name: "FIX-DELTA",    role: "Auto Resolution",       lifecycleStage: "Act",        status: "active",     currentTask: "Pushing config fix to EU-CORE-01 — 5 ops remain",   load: 91, domains: ["IP Peering"] },
  { id: "r3",  name: "VFY-GAMMA",    role: "Root Cause Analysis",   lifecycleStage: "Understand", status: "active",     currentTask: "Correlating 4 BGP session flaps vs 30-day baseline", load: 45, domains: ["IP Peering", "CXI"] },
  { id: "r4",  name: "MON-BETA",     role: "Network Monitor",       lifecycleStage: "Sense",      status: "active",     currentTask: "Watching AS1299 utilisation post-reroute",           load: 78, domains: ["IP Peering"] },
  // CXI
  { id: "r5",  name: "CXI-TRIAGE",   role: "CXI Scoring Engine",    lifecycleStage: "Understand", status: "active",     currentTask: "Running RCA for 232 affected subscribers — DE-West", load: 82, domains: ["CXI"] },
  { id: "r6",  name: "CXI-RESOLVE",  role: "Auto Resolution",       lifecycleStage: "Decide",     status: "escalating", currentTask: "Awaiting L2 approval — RAN score below threshold",   load: 58, domains: ["CXI"] },
  { id: "r7",  name: "CXI-SCORE",    role: "CXI Quality Analyst",   lifecycleStage: "Sense",      status: "active",     currentTask: "Ingesting RAN telemetry from 84 DE-West cells",      load: 40, domains: ["CXI"] },
  // Volte
  { id: "r8",  name: "VOL-PREDICT",  role: "Predictive Forecasting",lifecycleStage: "Decide",     status: "active",     currentTask: "Pre-emptive SLA risk model — EU Frankfurt bearers",  load: 55, domains: ["Volte"] },
  { id: "r9",  name: "VOL-MONITOR",  role: "Network Monitor",       lifecycleStage: "Sense",      status: "idle",       currentTask: "Idle — last task completed 9m ago",                  load: 12, domains: ["Volte"] },
  // Cross-domain
  { id: "r10", name: "PRED-ZETA",    role: "Predictive Forecasting",lifecycleStage: "Learn",      status: "active",     currentTask: "Updating traffic surge model post-SVOD launch event", load: 34, domains: ["IP Core", "Volte"] },
  { id: "r11", name: "CORR-OMEGA",   role: "Correlation Engine",    lifecycleStage: "Understand", status: "active",     currentTask: "Cross-domain incident pattern matching — 3 domains",  load: 61, domains: ["IP Peering", "CXI", "Volte"] },
  { id: "r12", name: "COORD-PRIME",  role: "Orchestration",         lifecycleStage: "Decide",     status: "idle",       currentTask: "Idle — awaiting next task assignment",               load: 8,  domains: ["IP Peering", "CXI", "Volte"] },
];

// ── Activity feed (reverse-chronological, all domains) ────────────────────────

export const ACTIVITY_FEED: FeedEntry[] = [
  { id: "f1",  state: "Resolved",   action: "Rerouted traffic via DE-CIX secondary path after AS3320 prefix withdrawal",               agentName: "SCAN-ALPHA",  domainLabel: "IP Peering", incidentRef: "INC-8422", relativeTime: "just now", incidentRoute: "/alerts", lifecycleStage: "Act"        },
  { id: "f2",  state: "Diagnosing", action: "Correlating 4 BGP session flaps on AMS-IX — comparing against 30-day baseline",           agentName: "VFY-GAMMA",   domainLabel: "IP Peering", incidentRef: "INC-8431", relativeTime: "2m ago",   incidentRoute: "/alerts", lifecycleStage: "Understand" },
  { id: "f3",  state: "Monitoring", action: "Watching AS1299 link utilisation post-reroute — within SLA threshold for 18m",             agentName: "MON-BETA",    domainLabel: "IP Peering", incidentRef: "INC-8422", relativeTime: "3m ago",   incidentRoute: "/alerts", lifecycleStage: "Sense"      },
  { id: "f4",  state: "Escalated",  action: "Packet loss on EU-CORE-01 exceeds 5% — auto-escalated to L2 for physical inspection",     agentName: "FIX-DELTA",   domainLabel: "IP Peering", incidentRef: "INC-8433", relativeTime: "4m ago",   incidentRoute: "/alerts", lifecycleStage: "Act"        },
  { id: "f5",  state: "Diagnosing", action: "Running root-cause analysis for 232 affected CXI subscribers in DE-West region",          agentName: "CXI-TRIAGE",  domainLabel: "CXI",     incidentRef: "INC-8416", relativeTime: "5m ago",   incidentRoute: "/alerts", lifecycleStage: "Understand" },
  { id: "f6",  state: "Escalated",  action: "CXI RAN score below 70 for > 20m — human L2 review required before action",              agentName: "CXI-RESOLVE", domainLabel: "CXI",     incidentRef: "INC-8416", relativeTime: "5m ago",   incidentRoute: "/alerts", lifecycleStage: "Decide"     },
  { id: "f7",  state: "Monitoring", action: "EU-CENTRAL-B4 transit stabilised — autonomy rate at 94% for this window",                 agentName: "CORR-OMEGA",  domainLabel: "IP Peering", incidentRef: "INC-8418", relativeTime: "7m ago",   incidentRoute: "/alerts", lifecycleStage: "Sense"      },
  { id: "f8",  state: "Resolved",   action: "VoLTE SLA breach prevented — traffic load-balanced across 3 Frankfurt bearers",           agentName: "VOL-PREDICT", domainLabel: "Volte",   incidentRef: "INC-8419", relativeTime: "9m ago",   incidentRoute: "/alerts", lifecycleStage: "Act"        },
  { id: "f9",  state: "Diagnosing", action: "Cross-domain incident pattern match: CXI degradation correlates with IP Core BGP flap",   agentName: "CORR-OMEGA",  domainLabel: "CXI",     incidentRef: "INC-8416", relativeTime: "11m ago",  incidentRoute: "/alerts", lifecycleStage: "Understand" },
  { id: "f10", state: "Monitoring", action: "Ingesting RAN telemetry from 84 DE-West cells — baseline nominal, no anomaly",            agentName: "CXI-SCORE",   domainLabel: "CXI",     incidentRef: "EVT-0202", relativeTime: "12m ago",  incidentRoute: "/alerts", lifecycleStage: "Sense"      },
  { id: "f11", state: "Resolved",   action: "BGP hold-timer resets on Telecom Italia peering link self-healed via config push",        agentName: "FIX-DELTA",   domainLabel: "IP Peering", incidentRef: "INC-8421", relativeTime: "19m ago",  incidentRoute: "/alerts", lifecycleStage: "Act"        },
  { id: "f12", state: "Monitoring", action: "Tracking SVOD traffic surge — EU peering links at 78% capacity, within SLA threshold",   agentName: "MON-BETA",    domainLabel: "IP Peering", incidentRef: "EVT-0121", relativeTime: "31m ago",  incidentRoute: "/alerts", lifecycleStage: "Sense"      },
  { id: "f13", state: "Resolved",   action: "Predicted VoLTE bearer congestion — pre-emptive load distribution applied and confirmed", agentName: "VOL-PREDICT", domainLabel: "Volte",   incidentRef: "PRE-2021", relativeTime: "38m ago",  incidentRoute: "/alerts", lifecycleStage: "Decide"     },
  { id: "f14", state: "Escalated",  action: "Volte bearer capacity breach predicted within 45m — L2 engineer alerted for review",     agentName: "VOL-PREDICT", domainLabel: "Volte",   incidentRef: "PRE-2019", relativeTime: "41m ago",  incidentRoute: "/alerts", lifecycleStage: "Decide"     },
  { id: "f15", state: "Resolved",   action: "Traffic surge model updated with SVOD event patterns — applied to 3 future windows",     agentName: "PRED-ZETA",   domainLabel: "IP Peering", incidentRef: "EVT-0121", relativeTime: "55m ago",  incidentRoute: "/alerts", lifecycleStage: "Learn"      },
];

// ── Global fleet summary (always shows unfiltered totals) ─────────────────────

export const FLEET_METRICS = {
  totalAgents:              12,
  activeNow:                 9,
  idle:                      2,
  escalationsAwaitingHuman:  3,
  actionsTakenThisPeriod:   53,
  autonomyRate:             83,  // % of agent actions completed without human intervention
};
