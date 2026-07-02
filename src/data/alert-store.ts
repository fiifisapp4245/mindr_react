// ── Alert Store ────────────────────────────────────────────────────────────────
// Single source of truth for the unified Alert object (Scenario 1 — IP Peering).
// An Alert is a superset: Anodot-detected anomaly that links alarms, tickets,
// topology, RCA, and remediation into one operator-facing item.
//
// D3 CONSTRAINT: linked incident/ticket IDs are NEVER exposed here.
// Only descriptions + counts are stored for tickets.
// Alarm refs (ALM-xxxx) are OK to show.

export type AlertSeverity = "critical" | "high" | "medium" | "low";
export type AlertStatus   = "active" | "predicted" | "mitigating" | "resolved";
export type RiskLevel     = "LOW" | "MEDIUM" | "HIGH";
export type BuildoutFlag  = "CRITICAL" | "SOON" | "OK";
export type RcaClass = "Indirect Overflow" | "Handover Shift" | "Router Shift" | "Interface Shift" | "Organic-Event";

// ── OBSERVE: per-source evidence ──────────────────────────────────────────────

export interface AnodotSource {
  severity: string;
  handoverAS: string;
  score: number;
  router: string;
  ixp: string;
}

export interface NetworkLoadSource {
  decision: "escalate" | "resolve";
  reason: string;
  currentGbps: number;
  thresholdGbps: number;
}

export interface BenocsSource {
  sourceAS: string;
  baseline: number;  // Gbps
  peak: number;      // Gbps
  spikePercent: number;
  direction: string;
}

export interface SnmpSource {
  utilization: number;  // %
  threshold: number;    // %
  capacity: string;
  router: string;
  iface: string;
}

export interface BorderPort {
  port: string;
  ingressUtil: number;  // %
  capacity: string;
  transitAS: string;
  flag: BuildoutFlag;
}

export interface BorderPlannerSource {
  congestedPorts: number;
  buildoutFlag: BuildoutFlag;
  worstPort: string;
  ports: BorderPort[];
}

export interface CaemCasmSource {
  alarmCount: number;
  ticketCount: number;
  ticketDesc: string;  // description only — NO IDs per D3
  alarmRefs: string[]; // ALM-refs are OK
}

export interface RcaClassification {
  name: RcaClass;
  matches: boolean;
  confirms?: string;
}

export interface BenocsRcaSource {
  classifications: RcaClassification[];
  summary: string;
}

export interface RexSource {
  linkFlap: boolean;
  igpMetricChange: string;
  reroutePath: string;
  localPref: number;
  notes: string;
}

export interface EventScoutSource {
  matchCount: number;
  matches: Array<{ event: string; date: string; similarity: number }>;
}

export interface AlertSources {
  anodot: AnodotSource;
  networkLoadMonitor: NetworkLoadSource;
  benocs: BenocsSource;
  snmp: SnmpSource;
  borderPlanner: BorderPlannerSource;
  caemCasm: CaemCasmSource;
  benocsRca: BenocsRcaSource;
  rex: RexSource;
  eventScout: EventScoutSource;
}

// ── PREDICT ───────────────────────────────────────────────────────────────────

export interface AlertPredict {
  narrative: string;
  changeInFlight: string | null;
  evidenceChain: string[];
  ifUnmitigated: string;
  confidence: number;
}

// ── ACT ───────────────────────────────────────────────────────────────────────

export interface AlertAction {
  id: string;
  label: string;
  risk: RiskLevel;
  needsApproval: boolean;
  hold: boolean;          // blocked by in-flight change
  holdReason?: string;
  modalTitle: string;
  modalBody: string;
  confirmLabel: string;
  confirmColor: string;
  confirmed: boolean;
}

// ── Alert (top-level object) ──────────────────────────────────────────────────

export interface Alert {
  id: string;          // ALT-001 (visible — alerts CAN have IDs per spec)
  title: string;
  severity: AlertSeverity;
  confidence: number;
  status: AlertStatus;
  impact: { baseline: number; peak: number; unit: "Gbps" };
  affected: string;         // handover AS / router
  linkedAlarms: number;
  linkedTickets: number;
  linkedAlarmRefs: string[];   // OK per D3
  ticketDesc: string;          // description only, no IDs
  eta: string;
  age: string;
  raised: string;
  region: string;
  sources: AlertSources;
  predict: AlertPredict;
  actions: AlertAction[];
}

// ── Severity / status design tokens ──────────────────────────────────────────

export const ALERT_SEV: Record<AlertSeverity, { label: string; color: string; bg: string }> = {
  critical: { label: "CRITICAL", color: "#FF3B3B", bg: "rgba(255,59,59,0.12)"   },
  high:     { label: "HIGH",     color: "#FFB020", bg: "rgba(255,176,32,0.12)"  },
  medium:   { label: "MEDIUM",   color: "#4D9EFF", bg: "rgba(77,158,255,0.12)"  },
  low:      { label: "LOW",      color: "#2DD4BF", bg: "rgba(45,212,191,0.12)"  },
};

export const ALERT_STATUS: Record<AlertStatus, { label: string; color: string; bg: string }> = {
  active:    { label: "ACTIVE",     color: "#FF3B3B", bg: "rgba(255,59,59,0.12)"   },
  predicted: { label: "PREDICTED",  color: "#FFB020", bg: "rgba(255,176,32,0.12)"  },
  mitigating:{ label: "MITIGATING", color: "#4D9EFF", bg: "rgba(77,158,255,0.12)"  },
  resolved:  { label: "RESOLVED",   color: "#2DD4BF", bg: "rgba(45,212,191,0.12)"  },
};

// ── Mock data ─────────────────────────────────────────────────────────────────
// Values reconcile with peering-store.ts:
//   activeSC1Alerts: 4    → 4 alerts total
//   highSeverityAlerts: 2 → ALT-002 (high/active) + ALT-003 (high/predicted)
//   congestedPorts: 7     → 7 rows in ALT-001 borderPlanner
//   criticalBuildoutPorts:2→ 2 CRITICAL rows in port table

const BORDER_PORTS: BorderPort[] = [
  { port: "ams-ix-rtr-01 xe-0/0/0", ingressUtil: 94, capacity: "10G", transitAS: "AS3320", flag: "CRITICAL" },
  { port: "fra-rtr-01 xe-0/0/0",    ingressUtil: 91, capacity: "10G", transitAS: "AS3549", flag: "CRITICAL" },
  { port: "ams-ix-rtr-01 xe-0/0/1", ingressUtil: 88, capacity: "10G", transitAS: "AS1299", flag: "SOON"     },
  { port: "ams-ix-rtr-02 xe-1/0/0", ingressUtil: 85, capacity: "10G", transitAS: "AS6453", flag: "SOON"     },
  { port: "fra-rtr-01 xe-0/0/1",    ingressUtil: 82, capacity: "10G", transitAS: "AS6762", flag: "SOON"     },
  { port: "bru-peer-01 ge-0/0/0",   ingressUtil: 79, capacity: "1G",  transitAS: "AS5432", flag: "SOON"     },
  { port: "lux-peer-03 ge-0/0/0",   ingressUtil: 77, capacity: "1G",  transitAS: "AS8218", flag: "SOON"     },
];

export const ALERTS: Alert[] = [
  // ── ALT-001 — main detail alert (CRITICAL/active) ─────────────────────────
  {
    id: "ALT-001",
    title: "Handover surge — AMS-SC1 / AS3320 overflow",
    severity: "critical",
    confidence: 91,
    status: "active",
    impact: { baseline: 7.1, peak: 9.4, unit: "Gbps" },
    affected: "AMS-SC1 / ams-ix-rtr-01",
    linkedAlarms: 6,
    linkedTickets: 3,
    linkedAlarmRefs: ["ALM-0042", "ALM-0043", "ALM-0044", "ALM-0045", "ALM-0046", "ALM-0047"],
    ticketDesc: "3 customer tickets — voice degradation on AMS-SC1 path, raised by Tele2 NL and KPN ops teams",
    eta: "Immediate operator review",
    age: "14m",
    raised: "14:23 UTC",
    region: "AMS-EU-WEST",

    sources: {
      anodot: {
        severity: "CRITICAL",
        handoverAS: "AS3320",
        score: 94.2,
        router: "ams-ix-rtr-01",
        ixp: "AMS-IX Amsterdam",
      },
      networkLoadMonitor: {
        decision: "escalate",
        reason: "Ingress spike 7.1 → 9.4 Gbps exceeds 15% surge threshold; port utilisation at 94% — auto-escalated to operator",
        currentGbps: 9.4,
        thresholdGbps: 8.2,
      },
      benocs: {
        sourceAS: "AS3320",
        baseline: 7.1,
        peak: 9.4,
        spikePercent: 32,
        direction: "AMS-SC1 → EU-CORE-01",
      },
      snmp: {
        utilization: 94,
        threshold: 85,
        capacity: "10 Gbps",
        router: "ams-ix-rtr-01",
        iface: "xe-0/0/0",
      },
      borderPlanner: {
        congestedPorts: 7,
        buildoutFlag: "CRITICAL",
        worstPort: "ams-ix-rtr-01 xe-0/0/0",
        ports: BORDER_PORTS,
      },
      caemCasm: {
        alarmCount: 6,
        ticketCount: 3,
        ticketDesc: "3 customer tickets — voice degradation on AMS-SC1 path, raised by Tele2 NL and KPN ops teams",
        alarmRefs: ["ALM-0042", "ALM-0043", "ALM-0044", "ALM-0045", "ALM-0046", "ALM-0047"],
      },
      benocsRca: {
        classifications: [
          { name: "Handover Shift",   matches: true,  confirms: "Handover Shift — AS3320 volume migrated from NL-IX to AMS-IX within 4-hour window" },
          { name: "Indirect Overflow",matches: false },
          { name: "Router Shift",     matches: false },
          { name: "Interface Shift",  matches: false },
          { name: "Organic-Event",    matches: false },
        ],
        summary: "Single classification match: Handover Shift. AS3320 appears to have shifted transit volume from NL-IX to AMS-IX, causing localised port saturation.",
      },
      rex: {
        linkFlap: false,
        igpMetricChange: "none",
        reroutePath: "Partial reroute via DE-CIX Frankfurt secondary confirmed at 14:19 UTC",
        localPref: 100,
        notes: "No BGP withdrawals detected. Routing table stable. Volume increase consistent with policy-driven handover, not failure.",
      },
      eventScout: {
        matchCount: 0,
        matches: [],
      },
    },

    predict: {
      narrative:
        "AS3320 has shifted a significant portion of transit volume from NL-IX to the AMS-IX peering point, likely due to a policy change or upstream maintenance on their NL-IX path. The AMS-SC1 port (ams-ix-rtr-01 xe-0/0/0) is absorbing the overflow — currently at 94% of a 10 Gbps interface. BENOCS confirms the spike is sourced entirely from AS3320 (32% above baseline). Border Planner shows 7 congested ports across the peering estate, with 2 requiring immediate capacity build-out. A capacity change (CHG-0441) targeting this link is already in flight with an ETA of ~47 minutes.",
      changeInFlight: "CHG-0441 — AMS-IX port capacity upgrade (ams-ix-rtr-01 xe-0/0/0): 10G → 40G. Approved and in progress. ETA: 47 min.",
      evidenceChain: [
        "Anodot fired CRITICAL anomaly at 14:23 UTC: AS3320 handover score 94.2 on ams-ix-rtr-01",
        "BENOCS confirms 32% ingress spike on AMS-SC1 → EU-CORE-01 path, sourced entirely from AS3320",
        "SNMP: ams-ix-rtr-01 xe-0/0/0 at 94% utilisation vs 85% threshold",
        "BENOCS RCA: Handover Shift classification (only match) — volume policy change, not failure",
        "REX: no link flaps or IGP instability detected — confirms this is a traffic volume event, not a routing fault",
      ],
      ifUnmitigated:
        "At current growth rate, ams-ix-rtr-01 xe-0/0/0 will reach 100% capacity in approximately 12–18 minutes, causing packet drops and SLA breach for AS3320 and co-located peers. Estimated impact: 218K+ users on AMS-SC1 path, 3 confirmed customer tickets already raised.",
      confidence: 91,
    },

    actions: [
      {
        id: "act-coordinate",
        label: "Coordinate with in-flight change (CHG-0441)",
        risk: "LOW",
        needsApproval: true,
        hold: false,
        modalTitle: "Coordinate with CHG-0441",
        modalBody:
          "CHG-0441 (AMS-IX port upgrade) is already approved and in progress. Confirming coordination will log your review and notify the change team to maintain priority. No traffic changes will be made.",
        confirmLabel: "Confirm coordination",
        confirmColor: "#2DD4BF",
        confirmed: false,
      },
      {
        id: "act-notify-partner",
        label: "Notify transit partner (AS3320 / Deutsche Telekom)",
        risk: "LOW",
        needsApproval: true,
        hold: false,
        modalTitle: "Notify AS3320 — Deutsche Telekom",
        modalBody:
          "Send a peering notification to Deutsche Telekom (AS3320) informing them of the handover surge on AMS-IX and requesting confirmation of the policy change. This is informational only and does not alter routing.",
        confirmLabel: "Send notification",
        confirmColor: "#2DD4BF",
        confirmed: false,
      },
      {
        id: "act-rebalance",
        label: "Rebalance handover via DE-CIX secondary",
        risk: "MEDIUM",
        needsApproval: true,
        hold: true,
        holdReason: "HOLD — CHG-0441 in flight. Rerouting now may conflict with the in-progress capacity upgrade. Revisit after CHG-0441 completes.",
        modalTitle: "Rebalance via DE-CIX Frankfurt",
        modalBody:
          "Shift 30% of AS3320 handover volume from AMS-IX to the DE-CIX Frankfurt secondary path. This will reduce ams-ix-rtr-01 xe-0/0/0 utilisation by ~8–10%. Note: this action is currently held pending CHG-0441 completion.",
        confirmLabel: "Approve rebalance",
        confirmColor: "#FFB020",
        confirmed: false,
      },
      {
        id: "act-buildout",
        label: "Raise capacity build-out — ams-ix-rtr-01",
        risk: "HIGH",
        needsApproval: true,
        hold: false,
        modalTitle: "Raise capacity build-out request",
        modalBody:
          "Create an emergency capacity build-out ticket for ams-ix-rtr-01 xe-0/0/0 (CRITICAL flag). This will escalate to the IP Peering capacity planning team and may trigger an expedited procurement process. CHG-0441 already covers this port — confirm only if you want to add an additional escalation path.",
        confirmLabel: "Raise build-out",
        confirmColor: "#FF3B3B",
        confirmed: false,
      },
      {
        id: "act-escalate",
        label: "Escalate to IP Peering Ops",
        risk: "MEDIUM",
        needsApproval: true,
        hold: false,
        modalTitle: "Escalate to IP Peering Ops",
        modalBody:
          "Page the IP Peering Ops on-call team with full alert context. Use this if the in-flight change (CHG-0441) is delayed or if utilisation exceeds 98% before completion.",
        confirmLabel: "Escalate now",
        confirmColor: "#FFB020",
        confirmed: false,
      },
    ],
  },

  // ── ALT-002 — HIGH / active ───────────────────────────────────────────────
  {
    id: "ALT-002",
    title: "Transit congestion — DE-CIX Frankfurt / AS6453",
    severity: "high",
    confidence: 84,
    status: "active",
    impact: { baseline: 6.2, peak: 8.1, unit: "Gbps" },
    affected: "FRA-RTR-01 / fra-rtr-01",
    linkedAlarms: 4,
    linkedTickets: 2,
    linkedAlarmRefs: ["ALM-0043", "ALM-0050", "ALM-0051", "ALM-0052"],
    ticketDesc: "2 customer tickets — elevated latency on Frankfurt peering path, raised by Cogent and Lumen teams",
    eta: "Review within 30 min",
    age: "31m",
    raised: "14:06 UTC",
    region: "FRA-EU-CENTRAL",
    sources: {
      anodot: { severity: "HIGH", handoverAS: "AS6453", score: 87.4, router: "fra-rtr-01", ixp: "DE-CIX Frankfurt" },
      networkLoadMonitor: { decision: "escalate", reason: "Sustained ingress above 80% threshold for 28+ minutes", currentGbps: 8.1, thresholdGbps: 7.4 },
      benocs: { sourceAS: "AS6453", baseline: 6.2, peak: 8.1, spikePercent: 31, direction: "DE-CIX Frankfurt → EU-CORE-02" },
      snmp: { utilization: 91, threshold: 85, capacity: "10 Gbps", router: "fra-rtr-01", iface: "xe-0/0/0" },
      borderPlanner: { congestedPorts: 3, buildoutFlag: "CRITICAL", worstPort: "fra-rtr-01 xe-0/0/0", ports: BORDER_PORTS.filter(p => p.port.startsWith("fra")) },
      caemCasm: { alarmCount: 4, ticketCount: 2, ticketDesc: "2 customer tickets — elevated latency on Frankfurt peering path, raised by Cogent and Lumen teams", alarmRefs: ["ALM-0043", "ALM-0050", "ALM-0051", "ALM-0052"] },
      benocsRca: {
        classifications: [
          { name: "Indirect Overflow", matches: true, confirms: "Indirect Overflow — AS6453 receiving redirected volume from Cogent re-routing event" },
          { name: "Handover Shift",    matches: false },
          { name: "Router Shift",      matches: false },
          { name: "Interface Shift",   matches: false },
          { name: "Organic-Event",     matches: false },
        ],
        summary: "Indirect Overflow: AS6453 absorbing redirected traffic from Cogent upstream re-route.",
      },
      rex: { linkFlap: true, igpMetricChange: "+15 on DE-CIX secondary", reroutePath: "No automatic reroute; primary path still active", localPref: 90, notes: "1 link flap detected at 14:08 UTC on fra-rtr-01 xe-0/0/1. Recovered in 4 seconds." },
      eventScout: { matchCount: 1, matches: [{ event: "Cogent upstream maintenance — EU-CENTRAL-B4", date: "13:55 UTC today", similarity: 0.79 }] },
    },
    predict: {
      narrative: "AS6453 is absorbing traffic redirected by a Cogent upstream maintenance event that began around 13:55 UTC. A brief link flap on fra-rtr-01 xe-0/0/1 at 14:08 recovered quickly, but sustained ingress above threshold indicates the overflow is ongoing. Event Scout matches a prior Cogent maintenance pattern with 79% similarity.",
      changeInFlight: null,
      evidenceChain: [
        "Anodot HIGH anomaly at 14:06 UTC: AS6453 congestion score 87.4 on fra-rtr-01",
        "BENOCS: 31% ingress spike sourced from AS6453, direction DE-CIX → EU-CORE-02",
        "BENOCS RCA: Indirect Overflow — Cogent redirect confirmed",
        "REX: link flap at 14:08 UTC (4s recovery), IGP metric +15 on secondary",
        "Event Scout: Cogent EU-CENTRAL-B4 maintenance match at 79% similarity",
      ],
      ifUnmitigated: "If Cogent maintenance continues, fra-rtr-01 xe-0/0/0 may reach capacity within 45–60 min. Current SLA margin: ~9% headroom.",
      confidence: 84,
    },
    actions: [
      { id: "act-notify-cogent", label: "Notify AS6453 / Cogent of redirect impact", risk: "LOW", needsApproval: true, hold: false, modalTitle: "Notify Cogent ops team", modalBody: "Send notification to Cogent (AS6453) ops team flagging the utilisation impact of their upstream re-route on DE-CIX Frankfurt.", confirmLabel: "Send notification", confirmColor: "#2DD4BF", confirmed: false },
      { id: "act-monitor", label: "Place fra-rtr-01 xe-0/0/0 on heightened monitoring", risk: "LOW", needsApproval: true, hold: false, modalTitle: "Enable heightened monitoring", modalBody: "Set 5-minute SNMP polling interval on fra-rtr-01 xe-0/0/0 for the next 2 hours and create auto-escalation trigger at 95% utilisation.", confirmLabel: "Enable monitoring", confirmColor: "#2DD4BF", confirmed: false },
      { id: "act-preprovision", label: "Pre-provision failover path — AMS-IX secondary", risk: "MEDIUM", needsApproval: true, hold: false, modalTitle: "Pre-provision AMS-IX failover", modalBody: "Pre-stage a failover routing policy to shift 25% of DE-CIX Frankfurt AS6453 traffic to AMS-IX if utilisation exceeds 95%. Does not activate until threshold is crossed.", confirmLabel: "Approve pre-provision", confirmColor: "#FFB020", confirmed: false },
    ],
  },

  // ── ALT-003 — HIGH / predicted ────────────────────────────────────────────
  {
    id: "ALT-003",
    title: "Capacity breach forecast — AMS-RTR-02 peak overflow",
    severity: "high",
    confidence: 87,
    status: "predicted",
    impact: { baseline: 5.8, peak: 9.1, unit: "Gbps" },
    affected: "AMS-RTR-02 / ams-ix-rtr-02",
    linkedAlarms: 3,
    linkedTickets: 1,
    linkedAlarmRefs: ["ALM-0045", "ALM-0048", "ALM-0049"],
    ticketDesc: "1 capacity planning ticket — AMS-RTR-02 flagged for Q3 upgrade review",
    eta: "Breach in ~3 hrs",
    age: "2h 14m",
    raised: "12:23 UTC",
    region: "AMS-EU-WEST",
    sources: {
      anodot: { severity: "HIGH", handoverAS: "AS6453", score: 81.0, router: "ams-ix-rtr-02", ixp: "AMS-IX Amsterdam" },
      networkLoadMonitor: { decision: "escalate", reason: "Forecast model projects breach in 3 hours based on SVOD event traffic pattern", currentGbps: 5.8, thresholdGbps: 8.5 },
      benocs: { sourceAS: "AS6453", baseline: 5.8, peak: 9.1, spikePercent: 57, direction: "AMS-IX → EU-CORE-01" },
      snmp: { utilization: 85, threshold: 85, capacity: "10 Gbps", router: "ams-ix-rtr-02", iface: "xe-1/0/0" },
      borderPlanner: { congestedPorts: 2, buildoutFlag: "SOON", worstPort: "ams-ix-rtr-02 xe-1/0/0", ports: BORDER_PORTS.filter(p => p.port.startsWith("ams-ix-rtr-02")) },
      caemCasm: { alarmCount: 3, ticketCount: 1, ticketDesc: "1 capacity planning ticket — AMS-RTR-02 flagged for Q3 upgrade review", alarmRefs: ["ALM-0045", "ALM-0048", "ALM-0049"] },
      benocsRca: {
        classifications: [
          { name: "Organic-Event",    matches: true, confirms: "Organic-Event — SVOD streaming peak aligns with historical Thursday evening pattern" },
          { name: "Indirect Overflow",matches: false },
          { name: "Handover Shift",   matches: false },
          { name: "Router Shift",     matches: false },
          { name: "Interface Shift",  matches: false },
        ],
        summary: "Organic-Event: SVOD Thursday peak. Traffic growth is demand-driven, not a fault.",
      },
      rex: { linkFlap: false, igpMetricChange: "none", reroutePath: "No rerouting active", localPref: 100, notes: "Routing stable. Forecast-only alert — no current fault condition." },
      eventScout: { matchCount: 2, matches: [{ event: "SVOD Thursday evening peak — EU-West", date: "Last Thursday", similarity: 0.91 }, { event: "SVOD series finale — AMS-IX spike", date: "3 weeks ago", similarity: 0.84 }] },
    },
    predict: {
      narrative: "BENOCS and Event Scout both confirm this is a predictable SVOD streaming peak. Historical Thursday evening patterns show a 40–60% spike in AS6453 traffic via AMS-IX. Current utilisation on ams-ix-rtr-02 xe-1/0/0 is exactly at threshold (85%), and the model projects breach within 3 hours as EU viewers come online for the SVOD prime window.",
      changeInFlight: null,
      evidenceChain: [
        "Anodot predictive HIGH anomaly at 12:23 UTC: forecast breach on ams-ix-rtr-02",
        "BENOCS projects 57% spike from AS6453 — SVOD demand-driven",
        "Event Scout: 91% similarity to last Thursday evening SVOD peak",
        "SNMP: currently at exactly 85% threshold — no headroom",
        "Border Planner: SOON flag on ams-ix-rtr-02 xe-1/0/0",
      ],
      ifUnmitigated: "Port saturation expected ~17:30 UTC. Packet drops affecting up to 85K SVOD viewers on EU-West path.",
      confidence: 87,
    },
    actions: [
      { id: "act-preposition", label: "Pre-position traffic via BRU-PEER-01 secondary", risk: "LOW", needsApproval: true, hold: false, modalTitle: "Pre-position via Brussels secondary", modalBody: "Shift 20% of AS6453 Thursday-peak traffic to BRU-PEER-01 from 16:30 UTC to avoid the projected breach. Reversible within 5 minutes if latency degrades.", confirmLabel: "Approve pre-position", confirmColor: "#2DD4BF", confirmed: false },
      { id: "act-notify-svod", label: "Notify CDN partner of projected constraint", risk: "LOW", needsApproval: true, hold: false, modalTitle: "Notify CDN / AS6453", modalBody: "Send advance notification to the CDN partner (AS6453) advising of the projected capacity constraint on AMS-IX from ~17:30 UTC.", confirmLabel: "Send notification", confirmColor: "#2DD4BF", confirmed: false },
    ],
  },

  // ── ALT-004 — MEDIUM / mitigating ────────────────────────────────────────
  {
    id: "ALT-004",
    title: "BGP flap stabilising — Tele Italia peering link",
    severity: "medium",
    confidence: 78,
    status: "mitigating",
    impact: { baseline: 3.1, peak: 4.8, unit: "Gbps" },
    affected: "EU-CORE-01 / AS6762",
    linkedAlarms: 2,
    linkedTickets: 1,
    linkedAlarmRefs: ["ALM-0046", "ALM-0047"],
    ticketDesc: "1 maintenance ticket — Tele Italia scheduled BGP timer adjustment, window closes 15:30 UTC",
    eta: "Resolving — ETA 15:30 UTC",
    age: "47m",
    raised: "13:50 UTC",
    region: "EU-CENTRAL",
    sources: {
      anodot: { severity: "MEDIUM", handoverAS: "AS6762", score: 72.1, router: "eu-core-01", ixp: "DE-CIX Frankfurt" },
      networkLoadMonitor: { decision: "resolve", reason: "BGP session re-established; traffic recovering. Monitoring only.", currentGbps: 4.1, thresholdGbps: 5.0 },
      benocs: { sourceAS: "AS6762", baseline: 3.1, peak: 4.8, spikePercent: 55, direction: "DE-CIX → EU-CORE-01" },
      snmp: { utilization: 62, threshold: 85, capacity: "10 Gbps", router: "eu-core-01", iface: "xe-2/0/0" },
      borderPlanner: { congestedPorts: 0, buildoutFlag: "OK", worstPort: "—", ports: [] },
      caemCasm: { alarmCount: 2, ticketCount: 1, ticketDesc: "1 maintenance ticket — Tele Italia scheduled BGP timer adjustment, window closes 15:30 UTC", alarmRefs: ["ALM-0046", "ALM-0047"] },
      benocsRca: {
        classifications: [
          { name: "Router Shift",     matches: true, confirms: "Router Shift — BGP hold-timer reset triggered transient reroute via secondary path" },
          { name: "Indirect Overflow",matches: false },
          { name: "Handover Shift",   matches: false },
          { name: "Interface Shift",  matches: false },
          { name: "Organic-Event",    matches: false },
        ],
        summary: "Router Shift: BGP hold-timer reset on AS6762 peer. Session re-established; traffic returning to primary path.",
      },
      rex: { linkFlap: true, igpMetricChange: "-10 on primary (restored)", reroutePath: "Reroute via secondary completed; primary path restored at 14:17 UTC", localPref: 100, notes: "3 BGP flaps detected between 13:50–14:02 UTC. Session stable for 35 minutes." },
      eventScout: { matchCount: 0, matches: [] },
    },
    predict: {
      narrative: "A scheduled BGP hold-timer adjustment by Tele Italia (AS6762) caused 3 brief session flaps between 13:50 and 14:02 UTC. Traffic rerouted to the DE-CIX secondary path automatically, returned to primary at 14:17 UTC. The maintenance window closes at 15:30 UTC — no further intervention expected unless a 4th flap is detected.",
      changeInFlight: "Tele Italia maintenance window CHG-TI-0112 — BGP timer adjustment. Window: 13:45–15:30 UTC. Auto-resolving.",
      evidenceChain: [
        "Anodot MEDIUM anomaly at 13:50 UTC: AS6762 BGP instability score 72.1",
        "REX: 3 BGP flaps 13:50–14:02 UTC, primary session restored 14:17 UTC",
        "BENOCS RCA: Router Shift — hold-timer reset confirmed",
        "Network Load Monitor: decision=resolve — traffic recovering, no escalation needed",
        "Maintenance ticket CHG-TI-0112 confirms scheduled BGP work",
      ],
      ifUnmitigated: "Likely self-resolves by 15:30 UTC per maintenance window. Risk is low unless a 4th flap triggers extended convergence.",
      confidence: 78,
    },
    actions: [
      { id: "act-monitor-flap", label: "Monitor for 4th BGP flap — auto-escalate threshold", risk: "LOW", needsApproval: true, hold: false, modalTitle: "Set flap escalation threshold", modalBody: "Configure auto-escalation if a 4th BGP flap is detected on AS6762 before 15:30 UTC. Currently monitoring passively.", confirmLabel: "Enable auto-escalation", confirmColor: "#2DD4BF", confirmed: false },
    ],
  },
];

// ── KPI helpers (reconcile with peering-store) ────────────────────────────────
// Active: 4, Critical: 1, Predicted: 1, Avg confidence: 85, Needs review: 2

export const ALERT_KPIS = {
  total:        ALERTS.length,                                                       // 4
  critical:     ALERTS.filter(a => a.severity === "critical").length,               // 1
  predicted:    ALERTS.filter(a => a.status === "predicted").length,                // 1
  avgConfidence: Math.round(ALERTS.reduce((s, a) => s + a.confidence, 0) / ALERTS.length), // 85
  needsReview:  ALERTS.filter(a => (a.status === "active" && (a.severity === "critical" || a.severity === "high"))).length, // 2
};

// ── Mutable state (mirrors alarms context pattern) ────────────────────────────

let _actions: Record<string, boolean> = {};

export function confirmAction(alertId: string, actionId: string): void {
  _actions[`${alertId}:${actionId}`] = true;
}

export function isConfirmed(alertId: string, actionId: string): boolean {
  return !!_actions[`${alertId}:${actionId}`];
}
