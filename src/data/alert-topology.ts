// ── Alert topology — multi-router / multi-interface / multi-port mock data ────
// Reuses the exact shapes established for the Event detail page's per-interface
// model (src/data/events.ts: PathNode, SeriesPoint, the worst-first + combined-
// line pattern) so the Alert detail page's Evidence tab can show the same
// summary-list + stacked-full-size-chart UI for its own affected interfaces.
//
// Unlike Events (forward-looking forecasts), an alert's utilization series is
// OBSERVED/RECENT HISTORY culminating in "now" — there is no "predicted vs
// actual" distinction here, just base load vs current (live) utilization, and
// — where another alert concurrently shares the same interface — a combined
// line the same way two concurrent events stack on a shared interface.
//
// All interface/port data below is procedurally generated (not hand-typed) from
// each alert's own existing fields (router, ixp, region, affectedAS, its own
// known utilization %), so the ~16 alerts × 8-10 interfaces × 3-4 ports stay
// internally consistent without manually authoring thousands of numbers.

import type { PathNode, SeriesPoint } from "./events";

export type { PathNode, SeriesPoint };

// Recent-history window for observed utilization — 40 minutes of trailing
// telemetry culminating in "now", as opposed to Events' forward-looking window.
export const ALERT_TIME_POINTS = ["-40m", "-30m", "-20m", "-10m", "now"];

export interface OverlappingAlertContribution {
  alertId: string;      // real Alert.id — deep-links to /alerts/:id
  alertTitle: string;
  contribution: SeriesPoint[]; // the OTHER alert's own incremental surge on this shared interface
}

// One interface a given alert affects. Two alerts can each carry an entry for
// the SAME physical interface (matched by `name`) — mirroring how concurrent
// events stack: each one's overlappingAlerts[] references the other, and both
// converge on identical combinedUtilization[] values (enforced structurally
// by applyOverlap() below, not hand-verified).
export interface AlertInterface {
  name: string;
  pathChain: PathNode[];
  baseLoad: SeriesPoint[];
  currentUtilization: SeriesPoint[];     // this alert's own observed utilization (base + its own surge)
  peakUtilization: number;               // combined peak where overlappingAlerts exist, else currentUtilization peak
  overlappingAlerts: OverlappingAlertContribution[];
  combinedUtilization: SeriesPoint[];    // baseLoad + this alert's surge + all overlappingAlerts contributions; [] when no overlap
}

export interface SnmpPort {
  port: string;
  utilization: number;   // %  — 90% default threshold is implicit, not stored (see AlertDetail's SNMP widget)
  capacity: string;
  router: string;
}

function series(times: string[], values: number[]): SeriesPoint[] {
  return times.map((time, i) => ({ time, value: values[i] }));
}

function ramp(times: string[], start: number, end: number): number[] {
  const n = times.length;
  return times.map((_, i) => Math.round(start + ((end - start) * i) / (n - 1)));
}

export function interfacesWorstFirst(interfaces: AlertInterface[]): AlertInterface[] {
  return [...interfaces].sort((a, b) => b.peakUtilization - a.peakUtilization);
}

// ── SNMP ports (3-4 per alert) ────────────────────────────────────────────────
// port[0] is always the alert's own known primary port (real router/iface/
// utilization already established elsewhere on the record); siblings are
// synthetic nearby ports on the same router, descending in utilization.

function bumpIfaceSuffix(iface: string, bump: number): string {
  const match = iface.match(/^(.*\/)(\d+)$/);
  if (!match) return `${iface}-${bump}`;
  const [, prefix, lastStr] = match;
  return `${prefix}${Number(lastStr) + bump}`;
}

export function generatePorts(router: string, primaryIface: string, primaryUtilization: number): SnmpPort[] {
  const siblingCount = 2 + (primaryUtilization % 2); // 2 or 3 siblings -> 3-4 ports total
  const ports: SnmpPort[] = [
    { port: primaryIface, utilization: primaryUtilization, capacity: "10 Gbps", router },
  ];
  for (let i = 1; i <= siblingCount; i++) {
    const drop = 12 * i + (i % 2 === 0 ? 4 : 0);
    ports.push({
      port: bumpIfaceSuffix(primaryIface, i),
      utilization: Math.max(18, primaryUtilization - drop),
      capacity: "10 Gbps",
      router,
    });
  }
  return ports;
}

// ── Affected interfaces (8-10 per alert) + path chains (2-3 distinct routers) ─

function buildPathChain(opts: { region: string; ixp: string; router: string; affectedAS: string }, variantIndex: number): PathNode[] {
  const routerLabel = variantIndex === 0
    ? opts.router
    : `${opts.region.split("-")[0].toLowerCase()}-rtr-0${2 + (variantIndex % 2)}`;
  return [
    { label: "EdgeCDN-EU egress", detail: "edge-cdn-eu-fra-01", type: "cdn" },
    { label: opts.ixp, detail: "IXP · peering point", type: "ixp" },
    { label: `${routerLabel}.dt.net`, detail: `peer ${opts.affectedAS}`, type: "router" },
    { label: opts.region, detail: "Region downstream", type: "region" },
  ];
}

export function generateAlertInterfaces(opts: {
  idNum: number;
  router: string;
  ixp: string;
  region: string;
  affectedAS: string;
  primaryUtilization: number; // this alert's own known peak % on its primary interface
}): AlertInterface[] {
  const count = 8 + (opts.idNum % 3); // 8, 9, or 10
  const interfaces: AlertInterface[] = [];
  for (let i = 0; i < count; i++) {
    const peak = i === 0
      ? opts.primaryUtilization
      : Math.max(32, opts.primaryUtilization - 8 - i * 5 - (opts.idNum % 4));
    const base = Math.max(15, peak - 22 - (i % 3) * 4);
    const name = i === 0
      ? `${opts.ixp} — ${opts.router} peer ${opts.affectedAS}`
      : `${opts.ixp} — congested iface ${i + 1}`;
    interfaces.push({
      name,
      pathChain: buildPathChain(opts, i),
      baseLoad: series(ALERT_TIME_POINTS, ramp(ALERT_TIME_POINTS, base - 3, base)),
      currentUtilization: series(ALERT_TIME_POINTS, ramp(ALERT_TIME_POINTS, base, peak)),
      peakUtilization: peak,
      overlappingAlerts: [],
      combinedUtilization: [],
    });
  }
  return interfaces;
}

// ── Concurrent-alert overlap ───────────────────────────────────────────────────
// Curated to a handful of alert pairs sharing a handover-AS interface — not
// every alert overlaps with another; most interfaces carry no overlap, exactly
// as most Event interfaces didn't either (see events.ts EVT-0091/EVT-0096).
// Mutates both sides in place so combinedUtilization/peakUtilization are
// structurally guaranteed identical, rather than hand-verified per pair.

export function applyOverlap(
  ifaceA: AlertInterface, alertA: { id: string; title: string },
  ifaceB: AlertInterface, alertB: { id: string; title: string },
): void {
  const times = ifaceA.baseLoad.map(p => p.time);
  const base = ifaceA.baseLoad.map(p => p.value);
  const contribA = ifaceA.currentUtilization.map((p, i) => p.value - base[i]);
  const contribB = ifaceB.currentUtilization.map((p, i) => p.value - base[i]);
  const combined = base.map((b, i) => b + contribA[i] + contribB[i]);
  const combinedSeries = series(times, combined);
  const peak = Math.max(...combined);

  ifaceA.combinedUtilization = combinedSeries;
  ifaceA.peakUtilization = peak;
  ifaceA.overlappingAlerts = [{ alertId: alertB.id, alertTitle: alertB.title, contribution: series(times, contribB) }];

  ifaceB.combinedUtilization = combinedSeries;
  ifaceB.peakUtilization = peak;
  ifaceB.overlappingAlerts = [{ alertId: alertA.id, alertTitle: alertA.title, contribution: series(times, contribA) }];
}
