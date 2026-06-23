import type { ThresholdSpec } from './peering-store';

// ── Types ───────────────────────────────────────────────────────────────────────

export type FLMStatus = 'Open' | 'In Progress' | 'Resolved' | 'Escalated' | 'Closed';
export type FLMSeverity = 'Critical' | 'High';
export type BuildoutFlag = 'CRITICAL' | 'SOON' | 'OK';

export interface MetricChangeEvent {
  time: string;
  desc: string;
}

export interface ActivityEntry {
  time: string;
  actor: string;
  action: string;
}

export interface FLMIncident {
  id: string;
  ref: string;
  title: string;
  severity: FLMSeverity;
  status: FLMStatus;
  slaRemaining: string;
  slaMinutes: number;
  slaPercent: number;
  region: string;
  openedAt: string;
  alarmRef: string;
  affectedPeer: string;
  scope: {
    peeringLink: string;
    bgpSession: string;
    asNumber: string;
    regionDetail: string;
    upstreamDevice: string;
    downstreamDevice: string;
  };

  // Band 1 — How bad now?
  portUtilizationMax: number;
  portUtilThresholds: ThresholdSpec;
  congestedInterfaces: number;
  trafficSpikePercent: number;
  peakTrafficTimeline: { t: string; gbps: number; target: number }[];

  // Band 2 — Structural or transient?
  buildoutFlag: BuildoutFlag;
  weeklyUtilTrend: { t: string; util: number }[];

  // Metric timeline
  timeline: { time: string; utilization: number }[];
  linkUtilization: number;

  // Band 3 — What changed?
  routeDeviationPercent: number;
  metricChangeEvents: MetricChangeEvent[];
  activeChangeTicket: string | null;

  // Evidence
  evidence: string[];

  // Audit trail
  activityLog: ActivityEntry[];

  // Right pane — agent hypothesis
  rootCause: {
    summary: string;
    category: string;
    confidence: number;
    recommendedAction: string;
    matchedPlaybook: string;
    steps: string[];
  };
  altPathHeadroom: number;
  altPathThresholds: ThresholdSpec;
}

// ── Shared thresholds (reused across incidents) ─────────────────────────────────

const PORT_UTIL_THRESHOLDS: ThresholdSpec = { t1: 70, t2: 90, direction: 'lower-better' };
const ALT_PATH_THRESHOLDS: ThresholdSpec  = { t1: 90, t2: 70, direction: 'higher-better' };

// ── Mock incidents ─────────────────────────────────────────────────────────────

export const FLM_INCIDENTS: FLMIncident[] = [
  // ── INC-2847 — Congested link / traffic redistribution ─────────────────────
  {
    id: 'inc-2847',
    ref: 'INC-2847',
    title: 'Peering link EU-CORE-01 → AS5413 congestion',
    severity: 'Critical',
    status: 'Open',
    slaRemaining: '22m',
    slaMinutes: 22,
    slaPercent: 82,
    region: 'EU-CORE-01',
    openedAt: '14:32 UTC',
    alarmRef: 'ALM-0038',
    affectedPeer: 'AS5413 (DE-CIX Frankfurt)',
    scope: {
      peeringLink: 'EU-CORE-01 → AS5413',
      bgpSession: 'BGP-v4 / DE-CIX Frankfurt / ge-0/2/1',
      asNumber: 'AS5413',
      regionDetail: 'EU-CORE-01',
      upstreamDevice: 'core-rtr-fra-01.dt.net',
      downstreamDevice: 'peer-gw-fra-14.dt.net',
    },

    portUtilizationMax: 97.3,
    portUtilThresholds: PORT_UTIL_THRESHOLDS,
    congestedInterfaces: 3,
    trafficSpikePercent: 38,
    peakTrafficTimeline: [
      { t: '08:00', gbps: 310, target: 420 },
      { t: '09:00', gbps: 325, target: 420 },
      { t: '10:00', gbps: 338, target: 420 },
      { t: '11:00', gbps: 355, target: 420 },
      { t: '12:00', gbps: 370, target: 420 },
      { t: '13:00', gbps: 390, target: 420 },
      { t: '14:00', gbps: 435, target: 420 },
    ],

    buildoutFlag: 'SOON',
    weeklyUtilTrend: [
      { t: 'Mon', util: 72 },
      { t: 'Tue', util: 75 },
      { t: 'Wed', util: 78 },
      { t: 'Thu', util: 82 },
      { t: 'Fri', util: 88 },
      { t: 'Sat', util: 93 },
      { t: 'Sun', util: 97 },
    ],

    timeline: [
      { time: '00:00', utilization: 75 },
      { time: '02:00', utilization: 78 },
      { time: '04:00', utilization: 82 },
      { time: '06:00', utilization: 88 },
      { time: '08:00', utilization: 95 },
      { time: '10:00', utilization: 93 },
      { time: '12:00', utilization: 91 },
      { time: '14:00', utilization: 85 },
      { time: '15:00', utilization: 97 },
    ],
    linkUtilization: 97.3,

    routeDeviationPercent: 8,
    metricChangeEvents: [
      { time: '14:28 UTC', desc: 'AS3320 withdrew prefix 195.34.0.0/16 — REX detected BGP withdrawal' },
      { time: '14:30 UTC', desc: 'Traffic rerouted to EU-CORE-01 ge-0/2/1 — +38 Gbps shift' },
      { time: '14:32 UTC', desc: 'Utilization threshold breached: 90% on ge-0/2/1' },
    ],
    activeChangeTicket: 'CHG-9912',

    evidence: [
      'BGP withdrawal event: AS3320 withdrew prefix 195.34.0.0/16 at 14:28 UTC',
      'Traffic increased 38 Gbps on EU-CORE-01 ge-0/2/1 within 4m of withdrawal',
      'Change ticket CHG-9912: Planned maintenance AS3320 14:00–16:00 UTC',
      'No hardware errors on affected interface',
    ],

    activityLog: [
      { time: '14:32 UTC', actor: 'MINDR', action: 'Incident auto-created from ALM-0038 threshold breach' },
      { time: '14:33 UTC', actor: 'MINDR', action: 'Root cause analysis completed — confidence 91%' },
    ],

    rootCause: {
      summary:
        'Congestion from traffic shift after AS3320 route withdrawal. EU-CORE-01 absorbing redistributed flows from withdrawn prefix 195.34.0.0/16.',
      category: 'Traffic Redistribution / Congestion',
      confidence: 91,
      recommendedAction:
        'Shift traffic off congested link using policy-based routing. Re-advertise withdrawn prefix via backup path.',
      matchedPlaybook: 'Congested Peering Link Reroute',
      steps: [
        'Confirm utilization threshold breached: show interfaces ge-0/2/1 detail',
        'Identify top talkers contributing to congestion using flow telemetry',
        'Check available capacity on parallel or backup peering paths',
        'Apply policy-based routing to shift heaviest prefix groups to alternate path',
        'Verify traffic rebalanced: utilization target <80% on primary link',
        'Monitor for 5 minutes to confirm stability after shift',
        'Update traffic engineering policy if reroute is to be permanent',
        'Document traffic engineering change in change management system',
      ],
    },
    altPathHeadroom: 22,
    altPathThresholds: ALT_PATH_THRESHOLDS,
  },

  // ── INC-2853 — BGP session instability ──────────────────────────────────────
  {
    id: 'inc-2853',
    ref: 'INC-2853',
    title: 'BGP session instability — AS3320 at DE-CIX Frankfurt',
    severity: 'Critical',
    status: 'In Progress',
    slaRemaining: '19m',
    slaMinutes: 19,
    slaPercent: 75,
    region: 'EU-CORE-01',
    openedAt: '14:28 UTC',
    alarmRef: 'ALM-0042',
    affectedPeer: 'AS3320 (DE-CIX Frankfurt)',
    scope: {
      peeringLink: 'EU-CORE-01 → AS3320',
      bgpSession: 'BGP-v4 / DE-CIX Frankfurt / ge-0/1/4',
      asNumber: 'AS3320',
      regionDetail: 'EU-CORE-01',
      upstreamDevice: 'core-rtr-fra-01.dt.net',
      downstreamDevice: 'peer-gw-fra-01.dt.net',
    },

    portUtilizationMax: 85,
    portUtilThresholds: PORT_UTIL_THRESHOLDS,
    congestedInterfaces: 2,
    trafficSpikePercent: 12,
    peakTrafficTimeline: [
      { t: '08:00', gbps: 210, target: 380 },
      { t: '09:00', gbps: 218, target: 380 },
      { t: '10:00', gbps: 225, target: 380 },
      { t: '11:00', gbps: 240, target: 380 },
      { t: '12:00', gbps: 255, target: 380 },
      { t: '13:00', gbps: 270, target: 380 },
      { t: '14:00', gbps: 290, target: 380 },
    ],

    buildoutFlag: 'OK',
    weeklyUtilTrend: [
      { t: 'Mon', util: 60 },
      { t: 'Tue', util: 63 },
      { t: 'Wed', util: 67 },
      { t: 'Thu', util: 72 },
      { t: 'Fri', util: 78 },
      { t: 'Sat', util: 82 },
      { t: 'Sun', util: 85 },
    ],

    timeline: [
      { time: '00:00', utilization: 60 },
      { time: '02:00', utilization: 63 },
      { time: '04:00', utilization: 68 },
      { time: '06:00', utilization: 72 },
      { time: '08:00', utilization: 78 },
      { time: '10:00', utilization: 76 },
      { time: '12:00', utilization: 74 },
      { time: '14:00', utilization: 76 },
      { time: '15:00', utilization: 85 },
    ],
    linkUtilization: 85.0,

    routeDeviationPercent: 6,
    metricChangeEvents: [
      { time: '14:22 UTC', desc: 'BGP session flap detected on AS3320 peering — hold timer expired' },
      { time: '14:25 UTC', desc: '412 prefixes withdrawn and re-announced — route table instability' },
      { time: '14:28 UTC', desc: 'Traffic load imbalance across remaining peers detected' },
    ],
    activeChangeTicket: 'CHG-9912',

    evidence: [
      'BGP session flap detected on AS3320 peering at 14:22 UTC',
      'Route table instability: 412 prefixes withdrawn and re-announced',
      'Change ticket CHG-9912: Planned maintenance AS3320 14:00–16:00 UTC',
      'No hardware errors on core-rtr-fra-01.dt.net',
    ],

    activityLog: [
      { time: '14:28 UTC', actor: 'MINDR', action: 'Incident auto-created from ALM-0042 BGP flap detection' },
      { time: '14:30 UTC', actor: 'MINDR', action: 'Root cause analysis completed — confidence 87%' },
      { time: '14:35 UTC', actor: 'Kwame Asante', action: 'Investigation started — reviewing BGP session logs' },
    ],

    rootCause: {
      summary:
        'BGP session instability on AS3320 peer during planned maintenance window. Route oscillations causing traffic load imbalance across remaining peers.',
      category: 'BGP Session Instability',
      confidence: 87,
      recommendedAction:
        'Apply BGP graceful-restart and route dampening to stabilize route table. Monitor session flap rate.',
      matchedPlaybook: 'BGP Session Recovery',
      steps: [
        'Verify BGP session state: show bgp neighbor <peer-ip>',
        'Check error counters and hold-timer expiry logs',
        'Apply route dampening policy to affected peer',
        'Enable BGP graceful-restart if not already configured',
        'Monitor prefix count stability for 5 minutes',
        'Coordinate with AS3320 NOC on maintenance window timeline',
        'Document session event in change management system',
      ],
    },
    altPathHeadroom: 35,
    altPathThresholds: ALT_PATH_THRESHOLDS,
  },

  // ── INC-2891 — Frankfurt IXP port utilization ──────────────────────────────
  {
    id: 'inc-2891',
    ref: 'INC-2891',
    title: 'Frankfurt IXP port utilization ≥90% — AS6453',
    severity: 'High',
    status: 'Open',
    slaRemaining: '47m',
    slaMinutes: 47,
    slaPercent: 60,
    region: 'EU-CORE-02',
    openedAt: '13:56 UTC',
    alarmRef: 'ALM-0044',
    affectedPeer: 'AS6453 (Tata Communications)',
    scope: {
      peeringLink: 'EU-CORE-02 → AS6453',
      bgpSession: 'BGP-v4 / DE-CIX Frankfurt / ge-1/0/2',
      asNumber: 'AS6453',
      regionDetail: 'EU-CORE-02',
      upstreamDevice: 'core-rtr-fra-02.dt.net',
      downstreamDevice: 'peer-gw-fra-22.tata.net',
    },

    portUtilizationMax: 92,
    portUtilThresholds: PORT_UTIL_THRESHOLDS,
    congestedInterfaces: 2,
    trafficSpikePercent: 22,
    peakTrafficTimeline: [
      { t: '08:00', gbps: 280, target: 360 },
      { t: '09:00', gbps: 292, target: 360 },
      { t: '10:00', gbps: 305, target: 360 },
      { t: '11:00', gbps: 318, target: 360 },
      { t: '12:00', gbps: 330, target: 360 },
      { t: '13:00', gbps: 345, target: 360 },
      { t: '14:00', gbps: 358, target: 360 },
    ],

    buildoutFlag: 'CRITICAL',
    weeklyUtilTrend: [
      { t: 'Mon', util: 78 },
      { t: 'Tue', util: 81 },
      { t: 'Wed', util: 84 },
      { t: 'Thu', util: 87 },
      { t: 'Fri', util: 89 },
      { t: 'Sat', util: 91 },
      { t: 'Sun', util: 92 },
    ],

    timeline: [
      { time: '00:00', utilization: 78 },
      { time: '02:00', utilization: 80 },
      { time: '04:00', utilization: 83 },
      { time: '06:00', utilization: 86 },
      { time: '08:00', utilization: 88 },
      { time: '10:00', utilization: 89 },
      { time: '12:00', utilization: 90 },
      { time: '14:00', utilization: 91 },
      { time: '15:00', utilization: 92 },
    ],
    linkUtilization: 92.0,

    routeDeviationPercent: 3,
    metricChangeEvents: [
      { time: '13:50 UTC', desc: 'Utilization crossed 90% threshold on ge-1/0/2 — SNMP alert triggered' },
      { time: '13:56 UTC', desc: 'Sustained high utilization — incident auto-created' },
    ],
    activeChangeTicket: null,

    evidence: [
      'Port ge-1/0/2 utilization at 92% — SNMP polling (5-min average)',
      'Traffic growth trend: +18 Gbps over 6 hours',
      'Border Planner flags AS6453 link as CRITICAL for capacity build-out',
      'No BGP events or route changes detected — pure traffic growth',
    ],

    activityLog: [
      { time: '13:56 UTC', actor: 'MINDR', action: 'Incident auto-created from ALM-0044 utilization threshold breach' },
      { time: '13:58 UTC', actor: 'MINDR', action: 'Root cause analysis completed — confidence 94%' },
    ],

    rootCause: {
      summary:
        'Organic traffic growth on AS6453 peering link exceeding port capacity. No routing events — structural congestion requiring capacity expansion.',
      category: 'Capacity Saturation (Structural)',
      confidence: 94,
      recommendedAction:
        'Raise build-out order with Border Planner for AS6453 link upgrade. Apply QoS to deprioritize best-effort traffic in interim.',
      matchedPlaybook: 'Peering Port Capacity Build-out',
      steps: [
        'Confirm sustained utilization: show interface ge-1/0/2 utilization 1h',
        'Review Border Planner build-out priority for AS6453',
        'Apply QoS marking to deprioritize low-priority traffic classes',
        'Submit capacity expansion request via Border Planner portal',
        'Coordinate with AS6453 NOC to confirm traffic growth expectations',
        'Monitor utilization trend until build-out is approved',
        'Document interim QoS changes in change management system',
      ],
    },
    altPathHeadroom: 18,
    altPathThresholds: ALT_PATH_THRESHOLDS,
  },

  // ── INC-2835 — Pre-resolved demo incident ────────────────────────────────────
  {
    id: 'inc-2835',
    ref: 'INC-2835',
    title: 'Temporary congestion — AS1299 backup path restored',
    severity: 'High',
    status: 'Resolved',
    slaRemaining: 'Met',
    slaMinutes: 0,
    slaPercent: 100,
    region: 'EU-CORE-01',
    openedAt: '10:14 UTC',
    alarmRef: 'ALM-0031',
    affectedPeer: 'AS1299 (TELIA)',
    scope: {
      peeringLink: 'EU-CORE-01 → AS1299',
      bgpSession: 'BGP-v4 / DE-CIX Frankfurt / ge-0/3/0',
      asNumber: 'AS1299',
      regionDetail: 'EU-CORE-01',
      upstreamDevice: 'core-rtr-fra-01.dt.net',
      downstreamDevice: 'peer-gw-fra-10.telia.net',
    },

    portUtilizationMax: 58,
    portUtilThresholds: PORT_UTIL_THRESHOLDS,
    congestedInterfaces: 0,
    trafficSpikePercent: 5,
    peakTrafficTimeline: [
      { t: '10:00', gbps: 180, target: 350 },
      { t: '11:00', gbps: 210, target: 350 },
      { t: '12:00', gbps: 340, target: 350 },
      { t: '13:00', gbps: 240, target: 350 },
      { t: '14:00', gbps: 195, target: 350 },
    ],

    buildoutFlag: 'OK',
    weeklyUtilTrend: [
      { t: 'Mon', util: 45 },
      { t: 'Tue', util: 48 },
      { t: 'Wed', util: 52 },
      { t: 'Thu', util: 88 },
      { t: 'Fri', util: 55 },
      { t: 'Sat', util: 51 },
      { t: 'Sun', util: 58 },
    ],

    timeline: [
      { time: '10:00', utilization: 45 },
      { time: '11:00', utilization: 91 },
      { time: '11:30', utilization: 88 },
      { time: '12:00', utilization: 72 },
      { time: '12:30', utilization: 60 },
      { time: '13:00', utilization: 55 },
      { time: '14:00', utilization: 58 },
    ],
    linkUtilization: 58,

    routeDeviationPercent: 2,
    metricChangeEvents: [
      { time: '10:14 UTC', desc: 'Utilization spike to 91% — backup AS1299 path lost' },
      { time: '11:45 UTC', desc: 'Backup path restored — traffic redistributing' },
      { time: '12:10 UTC', desc: 'Utilization normalizing — below 80%' },
    ],
    activeChangeTicket: null,

    evidence: [
      'AS1299 backup BGP path flapped due to upstream maintenance at 10:14 UTC',
      'Primary path absorbed rerouted traffic — peak 91% utilization for 90 minutes',
      'Backup path restored at 11:45 UTC — traffic rebalanced automatically',
      'No SLA breach — incident resolved within window',
    ],

    activityLog: [
      { time: '10:14 UTC', actor: 'MINDR', action: 'Incident auto-created from ALM-0031' },
      { time: '11:48 UTC', actor: 'MINDR', action: 'Traffic rebalancing detected — monitoring' },
      { time: '12:15 UTC', actor: 'Kwame Asante', action: 'Confirmed resolution — SLA met. Resolved.' },
    ],

    rootCause: {
      summary:
        'Temporary congestion caused by AS1299 upstream maintenance removing backup BGP path. Auto-recovered when maintenance completed.',
      category: 'BGP Path Loss (Temporary)',
      confidence: 97,
      recommendedAction: 'No further action required. Monitor for recurrence.',
      matchedPlaybook: 'BGP Session Recovery',
      steps: [
        'Verify BGP session state: show bgp neighbor <peer-ip>',
        'Check error counters and hold-timer expiry logs',
        'Apply route dampening policy to affected peer',
        'Enable BGP graceful-restart if not already configured',
        'Monitor prefix count stability for 5 minutes',
        'Coordinate with AS1299 NOC on maintenance window timeline',
        'Document session event in change management system',
      ],
    },
    altPathHeadroom: 82,
    altPathThresholds: ALT_PATH_THRESHOLDS,
  },
];

// ── Threshold helpers (re-exported for convenience) ────────────────────────────

export { computeBand, bandColor, bandBg, bandLabel } from './peering-store';

export const CONGESTED_IFACE_THRESHOLDS: ThresholdSpec = { t1: 1, t2: 3, direction: 'lower-better' };
export const TRAFFIC_SPIKE_THRESHOLDS: ThresholdSpec   = { t1: 20, t2: 200, direction: 'lower-better' };
export const ROUTE_DEV_THRESHOLDS: ThresholdSpec       = { t1: 5,  t2: 10,  direction: 'lower-better' };
export const CONFIDENCE_THRESHOLDS: ThresholdSpec      = { t1: 85, t2: 95,  direction: 'higher-better' };

export function buildoutColor(flag: BuildoutFlag): string {
  return flag === 'CRITICAL' ? 'var(--color-critical)' : flag === 'SOON' ? 'var(--color-warning)' : 'var(--color-resolved)';
}
export function buildoutBg(flag: BuildoutFlag): string {
  return flag === 'CRITICAL' ? 'rgba(255,59,59,0.12)' : flag === 'SOON' ? 'rgba(255,176,32,0.12)' : 'rgba(45,212,191,0.12)';
}
