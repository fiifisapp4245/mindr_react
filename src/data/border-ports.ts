// ── Border / peering port congestion & build-out model ───────────────────────
// Single source of truth for peering port utilisation, consumed by both the
// FLM Dashboard KPI cards and the Network Model chat answers so the two
// surfaces never diverge on the underlying port data.

export type BuildoutFlag = "CRITICAL" | "SOON" | "OK";

export interface BorderPort {
  port: string;
  ingressUtil: number;      // % — instantaneous SNMP reading (max ingress/egress)
  weeklyGrowthPct: number;  // percentage-point utilisation growth per week (recent trend)
  capacity: string;
  transitAS: string;
  flag: BuildoutFlag;
}

// Instantaneous congestion threshold — SNMP poll, no sustained window.
export const CONGESTION_UTIL_PCT = 90;

// ── Build-out status — INTERIM PROXY pending Border Planner integration ──────
// Projects recent linear utilisation growth to estimate time-to-exhaustion.
// Swap the body of computeBuildOutStatus() for real Border Planner logic later
// — callers only ever consume the BuildoutFlag result, never these constants.
export const BUILDOUT_EXHAUSTION_PCT = 95;
export const BUILDOUT_CRITICAL_WEEKS = 2;
export const BUILDOUT_SOON_WEEKS = 4;

export const BUILDOUT_INTERIM_LABEL =
  "Interim estimate based on recent utilisation trend — pending Border Planner integration.";

interface BorderPortSeed {
  port: string;
  ingressUtil: number;
  weeklyGrowthPct: number;
  capacity: string;
  transitAS: string;
}

export function computeBuildOutStatus(seed: Pick<BorderPortSeed, "ingressUtil" | "weeklyGrowthPct">): BuildoutFlag {
  if (seed.ingressUtil >= BUILDOUT_EXHAUSTION_PCT) return "CRITICAL";
  if (seed.weeklyGrowthPct <= 0) return "OK";
  const weeksToExhaustion = (BUILDOUT_EXHAUSTION_PCT - seed.ingressUtil) / seed.weeklyGrowthPct;
  if (weeksToExhaustion <= BUILDOUT_CRITICAL_WEEKS) return "CRITICAL";
  if (weeksToExhaustion <= BUILDOUT_SOON_WEEKS) return "SOON";
  return "OK";
}

export function computeCongestedPorts(ports: BorderPort[]): BorderPort[] {
  return ports.filter(p => p.ingressUtil >= CONGESTION_UTIL_PCT);
}

const BORDER_PORT_SEEDS: BorderPortSeed[] = [
  { port: "ams-ix-rtr-01 xe-0/0/0", ingressUtil: 94, weeklyGrowthPct: 3,   capacity: "10G", transitAS: "AS3320" },
  { port: "fra-rtr-01 xe-0/0/0",    ingressUtil: 91, weeklyGrowthPct: 2.5, capacity: "10G", transitAS: "AS3549" },
  { port: "ams-ix-rtr-01 xe-0/0/1", ingressUtil: 92, weeklyGrowthPct: 1,   capacity: "10G", transitAS: "AS1299" },
  { port: "ams-ix-rtr-02 xe-1/0/0", ingressUtil: 93, weeklyGrowthPct: 0.7, capacity: "10G", transitAS: "AS6453" },
  { port: "fra-rtr-01 xe-0/0/1",    ingressUtil: 90, weeklyGrowthPct: 1.5, capacity: "10G", transitAS: "AS6762" },
  { port: "bru-peer-01 ge-0/0/0",   ingressUtil: 90, weeklyGrowthPct: 1.5, capacity: "1G",  transitAS: "AS5432" },
  { port: "lux-peer-03 ge-0/0/0",   ingressUtil: 90, weeklyGrowthPct: 1.4, capacity: "1G",  transitAS: "AS8218" },
];

export const BORDER_PORTS: BorderPort[] = BORDER_PORT_SEEDS.map(seed => ({
  ...seed,
  flag: computeBuildOutStatus(seed),
}));

export const CONGESTED_PORTS = computeCongestedPorts(BORDER_PORTS);
export const CRITICAL_BUILDOUT_PORTS = BORDER_PORTS.filter(p => p.flag === "CRITICAL");

// Router name a port belongs to — e.g. "ams-ix-rtr-01 xe-0/0/0" → "ams-ix-rtr-01".
export function routerOf(port: BorderPort): string {
  return port.port.split(" ")[0];
}

// Single source for the "Top Congested Routers" chart AND the Network Model
// chat query for a given router, so the two never diverge.
export function getPortsByRouter(ports: BorderPort[]): { router: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of ports) counts.set(routerOf(p), (counts.get(routerOf(p)) ?? 0) + 1);
  return Array.from(counts, ([router, count]) => ({ router, count })).sort((a, b) => b.count - a.count);
}
