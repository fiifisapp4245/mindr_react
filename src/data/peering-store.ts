// ── Types ──────────────────────────────────────────────────────────────────────

export type Band = 'green' | 'amber' | 'red';

export interface ThresholdSpec {
  /** boundary between green and amber bands */
  t1: number;
  /** boundary between amber and red bands */
  t2: number;
  direction: 'lower-better' | 'higher-better';
}

export interface KpiEntry {
  value: number;
  unit: string;
  source: string;
  description: string;
  thresholds: ThresholdSpec;
  thresholdLabel: string;
  supportText: string;
}

export interface AttentionItem {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'WATCH' | 'PREDICTED';
  age: string;
  source: string;
}

export interface PieSlice {
  name: string;
  value: number;
  color: string;
}

export interface LookingAheadItem {
  type: 'breach' | 'event';
  id: string;
  label: string;
  detail: string;
  timeLabel: string;
  timeUnit: 'MIN' | 'HOURS' | 'DAYS';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
}

// ── Threshold engine ───────────────────────────────────────────────────────────

export function computeBand(value: number, spec: ThresholdSpec): Band {
  if (spec.direction === 'lower-better') {
    if (value <= spec.t1) return 'green';
    if (value <= spec.t2) return 'amber';
    return 'red';
  }
  // higher-better (e.g. coverage %)
  if (value >= spec.t2) return 'green';
  if (value >= spec.t1) return 'amber';
  return 'red';
}

export function bandColor(band: Band): string {
  return band === 'green'
    ? 'var(--color-resolved)'
    : band === 'amber'
    ? 'var(--color-warning)'
    : 'var(--color-critical)';
}

export function bandBg(band: Band): string {
  return band === 'green'
    ? 'rgba(45,212,191,0.12)'
    : band === 'amber'
    ? 'rgba(255,176,32,0.12)'
    : 'rgba(255,59,59,0.12)';
}

export function bandLabel(band: Band): string {
  return band === 'green' ? 'HEALTHY' : band === 'amber' ? 'WATCH' : 'CRITICAL';
}

// ── Band 1 KPIs ────────────────────────────────────────────────────────────────
// "Active SC-1 Alerts" = ongoing SC-1 incidents in the IP peering domain (Anodot).
// The global "Active P1" in the top bar spans ALL domains (CXI, FLM, peering) — they are
// different scopes and should not be compared directly.

export const kpi: Record<string, KpiEntry> = {
  activeSC1Alerts: {
    value: 4,
    unit: 'incidents',
    source: 'Anodot',
    description:
      'Count of ongoing SC-1 (Priority-1) incidents active in the IP peering domain. ' +
      'Distinct from the global "Active P1" in the top bar, which spans all domains.',
    thresholds: { t1: 2, t2: 5, direction: 'lower-better' },
    thresholdLabel: 'Healthy 0–2 · Watch 3–5 · Critical >5',
    supportText: 'INC-3021 is current top trigger',
  },

  highSeverityAlerts: {
    value: 2,
    unit: 'alerts',
    source: 'Anodot',
    description:
      'Count of HIGH and CRITICAL severity alerts currently open — requires operator review or active remediation.',
    thresholds: { t1: 0, t2: 2, direction: 'lower-better' },
    thresholdLabel: 'Healthy 0 · Watch 1–2 · Critical ≥3',
    supportText: 'Both elevated above normal baseline',
  },

  congestedPorts: {
    value: 7,
    unit: 'ports',
    source: 'SNMP',
    description:
      'Ports running at 90%+ utilization — a sign links are near capacity. ' +
      'High counts risk packet loss and SLA breaches.',
    thresholds: { t1: 3, t2: 10, direction: 'lower-better' },
    thresholdLabel: 'Healthy 0–3 · Watch 4–10 · Critical >10',
    supportText: 'FRA-RTR-01 has 3 affected ports',
  },

  criticalBuildoutPorts: {
    value: 2,
    unit: 'ports',
    source: 'Border Planner',
    description:
      'Structurally overloaded peering ports at ≥100% of weekly traffic peak. ' +
      'Require capacity expansion — cannot be resolved by re-routing alone.',
    thresholds: { t1: 0, t2: 3, direction: 'lower-better' },
    thresholdLabel: 'Healthy 0 · Watch 1–3 · Critical >3',
    supportText: 'AS6453 & AS1299 links affected',
  },

  activeChangeTickets: {
    value: 8,
    unit: 'tickets',
    source: 'CASM',
    description:
      'Open network change tickets. A high count can delay incident response when tickets conflict with remediation windows.',
    thresholds: { t1: 5, t2: 18, direction: 'lower-better' },
    thresholdLabel: 'Healthy ≤5 · Watch 6–18 · Critical >18',
    supportText: 'CHG-0441 conflicts with peak window',
  },
};

// ── Band 1 — Attention list (ranked by severity + SLA risk, distinct IDs) ──────

export const attentionItems: AttentionItem[] = [
  {
    id: 'INC-3021',
    title: 'Peer AS6453 traffic spike — 94% utilization',
    severity: 'CRITICAL',
    age: '5M AGO',
    source: 'SNMP / Anodot',
  },
  {
    id: 'INC-2847',
    title: 'BGP session instability with Tier-1 carrier',
    severity: 'HIGH',
    age: '12M AGO',
    source: 'REX',
  },
  {
    id: 'INC-2891',
    title: 'Frankfurt IXP port utilization ≥90%',
    severity: 'HIGH',
    age: '18M AGO',
    source: 'SNMP',
  },
  {
    id: 'CHG-0441',
    title: 'Scheduled maintenance conflicts with peak window',
    severity: 'WATCH',
    age: '31M AGO',
    source: 'CASM',
  },
  {
    id: 'PRE-0087',
    title: 'Predicted capacity breach — AS1299 peering link',
    severity: 'PREDICTED',
    age: '45M AGO',
    source: 'BENOCS / Nova',
  },
];

// ── Band 2 — Trend time-series ─────────────────────────────────────────────────

export interface TrafficPoint { t: string; gbps: number; }
export interface RoutingPoint { t: string; changes: number; }

export const trafficTrendData: TrafficPoint[] = [
  { t: '08:00', gbps: 342 },
  { t: '09:00', gbps: 358 },
  { t: '10:00', gbps: 371 },
  { t: '11:00', gbps: 384 },
  { t: '12:00', gbps: 402 },
  { t: '13:00', gbps: 418 },
  { t: '14:00', gbps: 435 },
];

export const routingInstabilityData: RoutingPoint[] = [
  { t: '08:00', changes: 12 },
  { t: '09:00', changes: 8 },
  { t: '10:00', changes: 14 },
  { t: '11:00', changes: 11 },
  { t: '12:00', changes: 23 },
  { t: '13:00', changes: 31 },
  { t: '14:00', changes: 28 },
];

export const trafficKpi: KpiEntry = {
  value: 435,
  unit: 'Gbps',
  source: 'BENOCS',
  description:
    'Total network traffic across all peering interfaces. ' +
    'Spikes above 500 Gbps risk congestion on secondary links.',
  thresholds: { t1: 400, t2: 500, direction: 'lower-better' },
  thresholdLabel: 'Stable <400 Gbps · Watch 400–500 · Spike >500',
  supportText: 'State: INCREASING',
};

export const routingKpi: KpiEntry = {
  value: 28,
  unit: 'events/hr',
  source: 'REX',
  description:
    'Routing change rate per hour — combines metric changes and BGP events. ' +
    'Elevated counts indicate network instability.',
  thresholds: { t1: 15, t2: 30, direction: 'lower-better' },
  thresholdLabel: 'Low <15 · Medium 15–30 · High >30',
  supportText: 'State: ELEVATED (MEDIUM)',
};

// ── Band 3 — Distribution data ─────────────────────────────────────────────────

export const alertsByAS = [
  { as: 'AS6453', count: 8 },
  { as: 'AS1299', count: 5 },
  { as: 'AS3356', count: 4 },
  { as: 'AS5511', count: 3 },
  { as: 'AS3257', count: 1 },
];

export const alertsByASKpi: KpiEntry = {
  value: 8,
  unit: 'alerts (max AS)',
  source: 'Anodot',
  description:
    'Alert count per handover autonomous system. A skewed distribution signals a single-peer problem rather than a broad network issue.',
  thresholds: { t1: 3, t2: 6, direction: 'lower-better' },
  thresholdLabel: 'Balanced ≤3/AS · Skewed 4–6 · Concentrated >6',
  supportText: 'AS6453 is dominant problem peer',
};

export const congestedRouters = [
  { router: 'FRA-RTR-01', ports: 3 },
  { router: 'AMS-RTR-02', ports: 2 },
  { router: 'MUC-RTR-01', ports: 1 },
  { router: 'BER-RTR-03', ports: 1 },
];

export const congestedRoutersKpi: KpiEntry = {
  value: 3,
  unit: 'ports (max router)',
  source: 'SNMP',
  description:
    'Number of congested ports (≥90% utilization) per router. Hotspot routers require priority attention.',
  thresholds: { t1: 1, t2: 3, direction: 'lower-better' },
  thresholdLabel: 'Low ≤1/router · Moderate 2–3 · Hotspot >3',
  supportText: 'FRA-RTR-01 worst offender',
};

export const capacityRiskSlices: PieSlice[] = [
  { name: 'Critical', value: 12, color: '#FF3B3B' },
  { name: 'Soon',     value: 18, color: '#FFB020' },
  { name: 'OK',       value: 70, color: '#2DD4BF' },
];

export const capacityRiskKpi: KpiEntry = {
  value: 30,
  unit: '% at risk',
  source: 'Border Planner',
  description:
    'Proportion of peering ports flagged as CRITICAL or SOON for capacity build-out. Above 30% indicates systemic structural congestion risk.',
  thresholds: { t1: 10, t2: 30, direction: 'lower-better' },
  thresholdLabel: 'Healthy <10% · Watch 10–30% · Critical >30%',
  supportText: '12% CRITICAL + 18% SOON',
};

export const coordinationSlices: PieSlice[] = [
  { name: 'With Change Ticket', value: 8,  color: '#FFB020' },
  { name: 'Blocked by Changes', value: 7,  color: '#FF3B3B' },
  { name: 'Clear',              value: 85, color: 'rgba(255,255,255,0.08)' },
];

export const coordinationKpi: KpiEntry = {
  value: 15,
  unit: '% coordinating',
  source: 'CASM',
  description:
    'Percentage of open alerts that have an active change ticket or are blocked by a change window — indicates coordination overhead.',
  thresholds: { t1: 10, t2: 30, direction: 'lower-better' },
  thresholdLabel: 'Healthy <10% · Watch 10–30% · Critical >30%',
  supportText: '8% w/ ticket + 7% blocked',
};

export const eventMatchSlices: PieSlice[] = [
  { name: 'Explained',   value: 45, color: '#e20074' },
  { name: 'Unexplained', value: 55, color: 'rgba(255,255,255,0.08)' },
];

export const eventMatchKpi: KpiEntry = {
  value: 45,
  unit: '% explained',
  source: 'Event Scout',
  description:
    'Percentage of traffic anomalies and incidents matched to known planned events. Higher coverage means more triage context for the operator.',
  thresholds: { t1: 30, t2: 60, direction: 'higher-better' },
  thresholdLabel: 'Healthy >60% · Watch 30–60% · Critical <30%',
  supportText: '55% remain unexplained',
};

// ── Band 4 — Looking ahead ─────────────────────────────────────────────────────

export const lookingAheadItems: LookingAheadItem[] = [
  {
    type: 'breach',
    id: 'PRED-AS1299',
    label: 'Capacity breach predicted',
    detail: 'AS1299 peering link — trending at 98% utilization',
    timeLabel: '47',
    timeUnit: 'MIN',
    severity: 'CRITICAL',
  },
  {
    type: 'event',
    id: 'EVT-NOVA',
    label: 'Nova Strike — Gaming Tournament',
    detail: 'Expected +28% traffic surge on EU peering links',
    timeLabel: '3',
    timeUnit: 'DAYS',
    severity: 'WARNING',
  },
  {
    type: 'event',
    id: 'EVT-SVOD',
    label: 'SVOD Platform Release',
    detail: 'Expected +18% streaming traffic increase',
    timeLabel: '5',
    timeUnit: 'DAYS',
    severity: 'INFO',
  },
];
