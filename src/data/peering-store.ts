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

export interface PieSlice {
  name: string;
  value: number;
  color: string;
}

import { OPEN_ALERTS_COUNT, HIGH_SEVERITY_ALERTS_COUNT, getAlertsByAS } from './alert-store';
import {
  CONGESTED_PORTS,
  CRITICAL_BUILDOUT_PORTS,
  BUILDOUT_INTERIM_LABEL,
  BUILDOUT_EXHAUSTION_PCT,
  BUILDOUT_CRITICAL_WEEKS,
  getPortsByRouter,
} from './border-ports';
import { EVENTS_FULL } from './events';

// Same queries as the Events page filters, so the Dashboard cards and the
// Events page's filtered row counts never diverge.
const UPCOMING_EVENTS = EVENTS_FULL.filter((e) => e.status === 'upcoming');
const LIVE_HIGH_SEVERITY_EVENTS = EVENTS_FULL.filter((e) => e.status === 'live' && e.severity === 'high');

export { BUILDOUT_INTERIM_LABEL };

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
// "Open SC-1 Alerts" = ongoing SC-1 incidents in the IP peering domain (Anodot).
// The global "Active P1" in the top bar spans ALL domains (CXI, FLM, peering) — they are
// different scopes and should not be compared directly.

export const kpi: Record<string, KpiEntry> = {
  activeSC1Alerts: {
    value: OPEN_ALERTS_COUNT,
    unit: 'incidents',
    source: 'Anodot',
    description:
      'Count of ongoing SC-1 (Priority-1) incidents open in the IP peering domain — same query as the ' +
      'Alerts page "Open" status filter, excluding forecast-only Predicted alerts. Distinct from the global ' +
      '"Active P1" in the top bar, which spans all domains.',
    thresholds: { t1: 2, t2: 5, direction: 'lower-better' },
    thresholdLabel: 'Healthy 0–2 · Watch 3–5 · Critical >5',
    supportText: 'INC-3021 is current top trigger',
  },

  highSeverityAlerts: {
    value: HIGH_SEVERITY_ALERTS_COUNT,
    unit: 'alerts',
    source: 'Anodot',
    description:
      'Count of HIGH severity alerts currently open — same query as the Alerts page "High" severity filter. ' +
      'Requires operator review or active remediation.',
    thresholds: { t1: 0, t2: 2, direction: 'lower-better' },
    thresholdLabel: 'Healthy 0 · Watch 1–2 · Critical ≥3',
    supportText: 'Both elevated above normal baseline',
  },

  congestedPorts: {
    value: CONGESTED_PORTS.length,
    unit: 'ports',
    source: 'SNMP',
    description:
      'Ports running at 90%+ instantaneous utilization (max of ingress/egress) at the current SNMP polling ' +
      'interval — no sustained window. High counts risk packet loss and SLA breaches. Count may flicker between polls.',
    thresholds: { t1: 3, t2: 10, direction: 'lower-better' },
    thresholdLabel: 'Healthy 0–3 · Watch 4–10 · Critical >10',
    supportText: 'FRA-RTR-01 has 2 affected ports',
  },

  criticalBuildoutPorts: {
    value: CRITICAL_BUILDOUT_PORTS.length,
    unit: 'ports',
    source: 'Border Planner',
    description:
      `Ports projected to reach ${BUILDOUT_EXHAUSTION_PCT}% utilization within ${BUILDOUT_CRITICAL_WEEKS} weeks ` +
      `at current growth. ${BUILDOUT_INTERIM_LABEL} Require capacity expansion — cannot be resolved by re-routing alone.`,
    thresholds: { t1: 0, t2: 3, direction: 'lower-better' },
    thresholdLabel: 'Healthy 0 · Watch 1–3 · Critical >3',
    supportText: 'AS3320 & AS3549 links affected',
  },

  upcomingEvents: {
    value: UPCOMING_EVENTS.length,
    unit: 'events',
    source: 'Event Scout',
    description:
      'Count of upcoming events — future traffic surges predicted by MINDR, not yet started — same query as ' +
      'the Events page "Upcoming" status filter.',
    thresholds: { t1: 2, t2: 5, direction: 'lower-better' },
    thresholdLabel: 'Healthy 0–2 · Watch 3–5 · Critical >5',
    supportText: UPCOMING_EVENTS[0] ? `${UPCOMING_EVENTS[0].shortName} is next up` : 'None scheduled',
  },

  highSeverityEvents: {
    value: LIVE_HIGH_SEVERITY_EVENTS.length,
    unit: 'events',
    source: 'Event Scout',
    description:
      'Count of currently LIVE events at High severity — same query as the Events page "Live" status + "High" ' +
      'severity filter. Upcoming high-severity events are tracked separately by the Upcoming Events card.',
    thresholds: { t1: 0, t2: 2, direction: 'lower-better' },
    thresholdLabel: 'Healthy 0 · Watch 1–2 · Critical ≥3',
    supportText: LIVE_HIGH_SEVERITY_EVENTS[0] ? `${LIVE_HIGH_SEVERITY_EVENTS[0].shortName} in progress` : 'None in progress',
  },
};

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

export const alertsByAS = getAlertsByAS();

export const alertsByASKpi: KpiEntry = {
  value: alertsByAS[0]?.count ?? 0,
  unit: 'alerts (max AS)',
  source: 'Anodot',
  description:
    'Alert count per handover autonomous system — same query as the Alerts page "Handover AS" filter. ' +
    'A skewed distribution signals a single-peer problem rather than a broad network issue.',
  thresholds: { t1: 3, t2: 6, direction: 'lower-better' },
  thresholdLabel: 'Balanced ≤3/AS · Skewed 4–6 · Concentrated >6',
  supportText: `${alertsByAS[0]?.as ?? '—'} is dominant problem peer`,
};

export const congestedRouters = getPortsByRouter(CONGESTED_PORTS).map(({ router, count }) => ({ router, ports: count }));

export const congestedRoutersKpi: KpiEntry = {
  value: congestedRouters[0]?.ports ?? 0,
  unit: 'ports (max router)',
  source: 'SNMP',
  description:
    'Number of congested ports (≥90% utilization) per router — same query as the Knowledge Graph chat query a bar ' +
    'drills into. Hotspot routers require priority attention.',
  thresholds: { t1: 1, t2: 3, direction: 'lower-better' },
  thresholdLabel: 'Low ≤1/router · Moderate 2–3 · Hotspot >3',
  supportText: `${congestedRouters[0]?.router ?? '—'} worst offender`,
};

export const capacityRiskSlices: PieSlice[] = [
  { name: 'Critical', value: 12, color: '#FF3B3B' },
  { name: 'Soon',     value: 18, color: '#FFB020' },
  { name: 'OK',       value: 70, color: '#2DD4BF' },
];

export const capacityRiskKpi: KpiEntry = {
  value: 30,
  unit: '% at risk',
  source: 'Border Planner (interim estimate based on recent utilisation trend — pending full Border Planner integration)',
  description:
    'Shows how close your peering ports are to running out of capacity. Critical = needs a capacity build-out very ' +
    'soon (projected to hit 95% within ~2 weeks); Soon = within ~4 weeks; OK = healthy headroom.',
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
    'Shows how much of your current alert load is tangled up with planned changes. With Change Ticket = a change is ' +
    "already logged; Blocked by Changes = work can't proceed until a change clears; Clear = no change dependency. " +
    "High numbers mean you'll need to coordinate with change management before acting.",
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
    'Shows how many current incidents we can explain by a known event (like a game release or streaming spike) vs. ' +
    'ones with no known cause. Explained = matched to a known event; Unexplained = cause still unknown and may need ' +
    'investigation. Low coverage means more mystery anomalies.',
  thresholds: { t1: 30, t2: 60, direction: 'higher-better' },
  thresholdLabel: 'Healthy >60% · Watch 30–60% · Critical <30%',
  supportText: '55% remain unexplained',
};
