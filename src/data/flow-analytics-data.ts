// ── Traffic Flow Analytics — mock data ────────────────────────────────────────
// MOCK DATA — pending real flow-data integration from stakeholders. Every value
// here (flow paths, hourly volumes, SNMP totals) is synthetic, generated with a
// seeded PRNG so the demo is stable across reloads. Structured as a small set
// of unique "flow paths" (dimensional combinations) x an hourly volume series
// per path, rather than a full cartesian product, to keep the dataset a
// realistic size while still giving every filterable entity real coverage.

export interface AsEntity {
  asn: number;
  name: string;
}

export type StageKey =
  | "sourceAS"
  | "handoverAS"
  | "ingressRouter"
  | "egressRouter"
  | "nexthopAS"
  | "destinationAS";

export const STAGES: { key: StageKey; label: string }[] = [
  { key: "sourceAS",      label: "Source AS" },
  { key: "handoverAS",    label: "Handover AS" },
  { key: "ingressRouter", label: "Ingress Router" },
  { key: "egressRouter",  label: "Egress Router" },
  { key: "nexthopAS",     label: "Nexthop AS" },
  { key: "destinationAS", label: "Destination AS" },
];

export const ROUTER_STAGE_KEYS: StageKey[] = ["ingressRouter", "egressRouter"];
export const AS_STAGE_KEYS: StageKey[] = ["sourceAS", "handoverAS", "nexthopAS", "destinationAS"];

// ── Entity pools ───────────────────────────────────────────────────────────────

export const SOURCE_HANDOVER_POOL: AsEntity[] = [
  { asn: 16509, name: "Amazon" },
  { asn: 174,   name: "Cogent" },
  { asn: 2914,  name: "NTT" },
  { asn: 6453,  name: "Tata Communications" },
  { asn: 3209,  name: "Vodafone Germany" },
  { asn: 6805,  name: "Telefonica International" },
  { asn: 4637,  name: "Telstra Global" },
  { asn: 3356,  name: "Lumen" },
  { asn: 6461,  name: "Zayo Group" },
  { asn: 3257,  name: "GTT Communications" },
];

export const NEXTHOP_DEST_POOL: AsEntity[] = [
  { asn: 0,     name: "Deutsche Telekom Internal Network" },
  { asn: 8412,  name: "T-Mobile Austria" },
  { asn: 44178, name: "T-Mobile Deutschland" },
  { asn: 12912, name: "T-Mobile Polska" },
  { asn: 6855,  name: "Slovak Telecom" },
  { asn: 5483,  name: "Magyar Telekom" },
  { asn: 3303,  name: "Swisscom" },
  { asn: 5391,  name: "Hrvatski Telekom" },
];

export const INGRESS_ROUTERS = ["HH-EF1", "F-EH4", "M-EF1", "M-EF2", "F-EH1", "B-EH3", "B-EH2"];
export const EGRESS_ROUTERS  = ["D-ED5", "D-ED6", "F-ED14", "VIE-SB5", "VIE-SB6"];

// ── Seeded PRNG (deterministic — stable demo data across reloads) ─────────────

function mulberry32(seed: number) {
  let s = seed;
  return function rand(): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20251101);

function pickWeighted<T>(pool: T[], weights: number[], r: number): T {
  const total = weights.reduce((s, w) => s + w, 0);
  let x = r * total;
  for (let i = 0; i < pool.length; i++) {
    x -= weights[i];
    if (x <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

// ── Flow path generation ───────────────────────────────────────────────────────
// A "path" is one unique 6-dimension combination with a baseline volume weight.
// Amazon / Deutsche Telekom Internal Network dominate, mirroring the reference.

export interface FlowPath {
  id: string;
  sourceAS: AsEntity;
  handoverAS: AsEntity;
  ingressRouter: string;
  egressRouter: string;
  nexthopAS: AsEntity;
  destinationAS: AsEntity;
  weightBps: number; // baseline (pre-diurnal) average volume for this path
}

// Source AS volume shares — Amazon dominant, remaining pool splits the rest.
const SOURCE_SHARES = [0.90, 0.028, 0.022, 0.016, 0.012, 0.009, 0.006, 0.005, 0.0035, 0.0025];

// Nexthop/Destination volume shares — DT-Internal dominant.
const DEST_SHARES = [0.90, 0.02, 0.018, 0.016, 0.014, 0.012, 0.011, 0.009];

function buildFlowPaths(): FlowPath[] {
  const paths: FlowPath[] = [];
  const TOTAL_BASELINE_BPS = 40_000_000_000; // 40 Gbps average across the whole mock network

  SOURCE_HANDOVER_POOL.forEach((source, sIdx) => {
    const isAmazon = sIdx === 0;
    const ingressCount = isAmazon ? 6 : 4;
    const ingressChoices = Array.from({ length: ingressCount }, (_, k) => INGRESS_ROUTERS[(sIdx + k) % INGRESS_ROUTERS.length]);
    const sourceShare = SOURCE_SHARES[sIdx];
    const perIngressShare = sourceShare / ingressChoices.length;

    ingressChoices.forEach((ingressRouter, ii) => {
      const egressRouter = EGRESS_ROUTERS[(sIdx + ii) % EGRESS_ROUTERS.length];

      // Handover AS: mostly direct (self); Amazon occasionally hands over via a
      // minor peer, minor sources occasionally transit via Amazon — this is what
      // pushes Amazon's aggregated HANDOVER share above its SOURCE share.
      const handoverAS = isAmazon
        ? (ii % 5 === 4 ? SOURCE_HANDOVER_POOL[(sIdx + ii + 1) % SOURCE_HANDOVER_POOL.length] : source)
        : (ii % 3 === 2 ? SOURCE_HANDOVER_POOL[0] : source);

      // Nexthop/destination: weighted pick, DT-Internal dominant. ~30% of paths
      // route via DT-Internal as nexthop before reaching a subsidiary destination.
      const destRoll = rand();
      const destination = pickWeighted(NEXTHOP_DEST_POOL, DEST_SHARES, destRoll);
      const viaInternal = destination.asn !== 0 && rand() < 0.3;
      const nexthopAS = viaInternal ? NEXTHOP_DEST_POOL[0] : destination;

      paths.push({
        id: `path-${paths.length}`,
        sourceAS: source,
        handoverAS,
        ingressRouter,
        egressRouter,
        nexthopAS,
        destinationAS: destination,
        weightBps: TOTAL_BASELINE_BPS * perIngressShare,
      });
    });
  });

  // Coverage guarantee: the weighted random picks above can (and do, with a
  // small pool and modest path count) miss some Nexthop/Destination AS entities
  // entirely, which would make their column filters return empty results. Add
  // one small dedicated path per entity to guarantee non-empty coverage — a
  // deliberately tiny weight so these don't meaningfully dilute the aggregate
  // volume shares the main weighted paths above establish.
  const COVERAGE_SHARE = 0.0015;
  NEXTHOP_DEST_POOL.forEach((dest, i) => {
    const source = SOURCE_HANDOVER_POOL[i % SOURCE_HANDOVER_POOL.length];
    paths.push({
      id: `path-${paths.length}`,
      sourceAS: source,
      handoverAS: source,
      ingressRouter: INGRESS_ROUTERS[i % INGRESS_ROUTERS.length],
      egressRouter: EGRESS_ROUTERS[i % EGRESS_ROUTERS.length],
      nexthopAS: dest,
      destinationAS: dest,
      weightBps: TOTAL_BASELINE_BPS * COVERAGE_SHARE,
    });
  });

  return paths;
}

export const FLOW_PATHS: FlowPath[] = buildFlowPaths();

// ── Time range ─────────────────────────────────────────────────────────────────

export const RANGE_START = Date.UTC(2025, 10, 1, 0, 0, 0);  // 01 Nov 2025 00:00 UTC
export const RANGE_END   = Date.UTC(2025, 10, 6, 23, 0, 0); // 06 Nov 2025 23:00 UTC
const HOUR_MS = 60 * 60 * 1000;
export const HOURS_COUNT = Math.round((RANGE_END - RANGE_START) / HOUR_MS) + 1; // 144

export const TIMESTAMPS: number[] = Array.from({ length: HOURS_COUNT }, (_, h) => RANGE_START + h * HOUR_MS);

// Evening peak (~21:00), overnight trough (~09:00) diurnal curve + mild noise.
function diurnalMultiplier(hourOfDay: number, noise: number): number {
  const peakHour = 21;
  const angle = ((hourOfDay - peakHour) / 24) * Math.PI * 2;
  const base = 0.75 + 0.4 * Math.cos(angle);
  return Math.max(0.15, base + noise);
}

// ── Flat flow records — one row per (path, hour) ──────────────────────────────

export interface FlowRecord {
  pathId: string;
  sourceAS: string;
  sourceASN: number;
  handoverAS: string;
  handoverASN: number;
  ingressRouter: string;
  egressRouter: string;
  nexthopAS: string;
  nexthopASN: number;
  destinationAS: string;
  destinationASN: number;
  volumeBps: number;
  timestamp: number;
}

function buildFlowRecords(): FlowRecord[] {
  const records: FlowRecord[] = [];
  for (const path of FLOW_PATHS) {
    for (const ts of TIMESTAMPS) {
      const hourOfDay = new Date(ts).getUTCHours();
      const noise = (rand() - 0.5) * 0.18;
      const volumeBps = Math.max(0, path.weightBps * diurnalMultiplier(hourOfDay, noise));
      records.push({
        pathId: path.id,
        sourceAS: path.sourceAS.name,
        sourceASN: path.sourceAS.asn,
        handoverAS: path.handoverAS.name,
        handoverASN: path.handoverAS.asn,
        ingressRouter: path.ingressRouter,
        egressRouter: path.egressRouter,
        nexthopAS: path.nexthopAS.name,
        nexthopASN: path.nexthopAS.asn,
        destinationAS: path.destinationAS.name,
        destinationASN: path.destinationAS.asn,
        volumeBps,
        timestamp: ts,
      });
    }
  }
  return records;
}

export const FLOW_RECORDS: FlowRecord[] = buildFlowRecords();

// ── SNMP dataset (separate — port/interface total counters, per router) ──────
// Independent of the flow records: SNMP measures total interface throughput,
// not per-flow volume, so it's generated as its own series per router and is
// deliberately scaled ABOVE the summed flow volume for that router (flow
// sampling captures a subset of total interface traffic, as in real tooling).

export interface SnmpRecord {
  router: string;
  timestamp: number;
  totalBps: number;
}

function buildSnmpRecords(): SnmpRecord[] {
  const allRouters = [...INGRESS_ROUTERS, ...EGRESS_ROUTERS];
  const overheadByRouter = new Map<string, number>(allRouters.map((r) => [r, 1.15 + rand() * 0.2])); // 1.15x-1.35x

  // Sum flow volume per router per hour first, so SNMP can scale off it.
  const flowByRouterHour = new Map<string, number>();
  for (const rec of FLOW_RECORDS) {
    for (const router of [rec.ingressRouter, rec.egressRouter]) {
      const key = `${router}|${rec.timestamp}`;
      flowByRouterHour.set(key, (flowByRouterHour.get(key) ?? 0) + rec.volumeBps);
    }
  }

  const records: SnmpRecord[] = [];
  for (const router of allRouters) {
    const overhead = overheadByRouter.get(router)!;
    for (const ts of TIMESTAMPS) {
      const flowVolume = flowByRouterHour.get(`${router}|${ts}`) ?? 0;
      const jitter = 1 + (rand() - 0.5) * 0.06;
      records.push({ router, timestamp: ts, totalBps: flowVolume * overhead * jitter });
    }
  }
  return records;
}

export const SNMP_RECORDS: SnmpRecord[] = buildSnmpRecords();

// ── Filter state ───────────────────────────────────────────────────────────────

export interface FlowFilters {
  sourceAS: Set<string>;
  handoverAS: Set<string>;
  ingressRouter: Set<string>;
  egressRouter: Set<string>;
  nexthopAS: Set<string>;
  destinationAS: Set<string>;
  beginDate: string; // yyyy-mm-dd
  endDate: string;   // yyyy-mm-dd
}

export function emptyFilters(): FlowFilters {
  return {
    sourceAS: new Set(),
    handoverAS: new Set(),
    ingressRouter: new Set(),
    egressRouter: new Set(),
    nexthopAS: new Set(),
    destinationAS: new Set(),
    beginDate: toDateInput(RANGE_START),
    endDate: toDateInput(RANGE_END),
  };
}

export function toDateInput(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

// ASN for a stage+entity label — null for router-stage entities (no ASN concept).
export function asnForEntity(stage: StageKey, label: string): number | null {
  if (stage === "sourceAS" || stage === "handoverAS") {
    return SOURCE_HANDOVER_POOL.find((e) => e.name === label)?.asn ?? null;
  }
  if (stage === "nexthopAS" || stage === "destinationAS") {
    return NEXTHOP_DEST_POOL.find((e) => e.name === label)?.asn ?? null;
  }
  return null;
}

export function stageEntityOptions(stage: StageKey): string[] {
  const values = new Set<string>();
  for (const rec of FLOW_RECORDS) values.add(rec[stage]);
  return Array.from(values).sort();
}

// Active AS-level stage filters (the ones SNMP has no visibility into).
export function activeAsFilters(filters: FlowFilters): StageKey[] {
  return AS_STAGE_KEYS.filter((key) => filters[key].size > 0);
}

export function matchesFilters(rec: FlowRecord, filters: FlowFilters): boolean {
  const beginMs = Date.parse(`${filters.beginDate}T00:00:00Z`);
  const endMs = Date.parse(`${filters.endDate}T23:59:59Z`);
  if (rec.timestamp < beginMs || rec.timestamp > endMs) return false;
  for (const stage of STAGES) {
    const set = filters[stage.key];
    if (set.size > 0 && !set.has(rec[stage.key])) return false;
  }
  return true;
}

export function filterRecords(filters: FlowFilters, records: FlowRecord[] = FLOW_RECORDS): FlowRecord[] {
  return records.filter((rec) => matchesFilters(rec, filters));
}

// ── Aggregation helpers ────────────────────────────────────────────────────────

export interface SankeyAgg {
  nodes: { key: string; stage: StageKey; label: string; value: number }[];
  links: { source: string; target: string; value: number }[];
}

// Aggregates filtered records into per-stage nodes and adjacent-stage links.
export function buildSankeyAgg(records: FlowRecord[]): SankeyAgg {
  const nodeValues = new Map<string, number>();
  const linkValues = new Map<string, number>();
  const nodeKey = (stage: StageKey, label: string) => `${stage}::${label}`;

  for (const rec of records) {
    for (const stage of STAGES) {
      const label = rec[stage.key];
      const key = nodeKey(stage.key, label);
      nodeValues.set(key, (nodeValues.get(key) ?? 0) + rec.volumeBps);
    }
    for (let i = 0; i < STAGES.length - 1; i++) {
      const from = nodeKey(STAGES[i].key, rec[STAGES[i].key]);
      const to = nodeKey(STAGES[i + 1].key, rec[STAGES[i + 1].key]);
      const lk = `${from}=>${to}`;
      linkValues.set(lk, (linkValues.get(lk) ?? 0) + rec.volumeBps);
    }
  }

  const nodes = Array.from(nodeValues.entries()).map(([key, value]) => {
    const [stage, label] = key.split("::") as [StageKey, string];
    return { key, stage, label, value };
  });
  const links = Array.from(linkValues.entries()).map(([key, value]) => {
    const [source, target] = key.split("=>");
    return { source, target, value };
  });

  return { nodes, links };
}

export interface FlowTableRow {
  key: string;
  stage: StageKey;
  label: string;
  average: number;
  max: number;
  p95: number;
  total: number;
}

// Groups filtered records by a stage and computes Average/Max/95th/Total
// (Average/Max/95th computed over the per-hour aggregated series for that
// entity, Total is the summed volume across the whole range).
export function buildTableRows(records: FlowRecord[], stage: StageKey): FlowTableRow[] {
  const byEntityHour = new Map<string, Map<number, number>>();
  for (const rec of records) {
    const label = rec[stage];
    if (!byEntityHour.has(label)) byEntityHour.set(label, new Map());
    const hourMap = byEntityHour.get(label)!;
    hourMap.set(rec.timestamp, (hourMap.get(rec.timestamp) ?? 0) + rec.volumeBps);
  }

  const rows: FlowTableRow[] = [];
  for (const [label, hourMap] of byEntityHour) {
    const values = Array.from(hourMap.values()).sort((a, b) => a - b);
    const total = values.reduce((s, v) => s + v, 0);
    const average = total / values.length;
    const max = values[values.length - 1] ?? 0;
    const p95Index = Math.min(values.length - 1, Math.floor(values.length * 0.95));
    const p95 = values[p95Index] ?? 0;
    rows.push({ key: `${stage}::${label}`, stage, label, average, max, p95, total });
  }
  return rows;
}

// Time series pivoted by hour x entity-of-stage, for the stacked area chart.
export function buildTimeSeries(records: FlowRecord[], stage: StageKey): { time: number; [entity: string]: number }[] {
  const byHour = new Map<number, Map<string, number>>();
  for (const rec of records) {
    if (!byHour.has(rec.timestamp)) byHour.set(rec.timestamp, new Map());
    const entityMap = byHour.get(rec.timestamp)!;
    const label = rec[stage];
    entityMap.set(label, (entityMap.get(label) ?? 0) + rec.volumeBps);
  }
  return Array.from(byHour.entries())
    .sort(([a], [b]) => a - b)
    .map(([time, entityMap]) => ({ time, ...Object.fromEntries(entityMap) }));
}

// SNMP total series scoped to the routers implied by the current filters (all
// routers if no router filter is active, else just the selected router(s)).
export function buildSnmpSeries(filters: FlowFilters): { time: number; snmpTotalBps: number }[] {
  const allRouters = [...INGRESS_ROUTERS, ...EGRESS_ROUTERS];
  const scopedRouters = new Set<string>();
  if (filters.ingressRouter.size === 0 && filters.egressRouter.size === 0) {
    allRouters.forEach((r) => scopedRouters.add(r));
  } else {
    filters.ingressRouter.forEach((r) => scopedRouters.add(r));
    filters.egressRouter.forEach((r) => scopedRouters.add(r));
  }

  const beginMs = Date.parse(`${filters.beginDate}T00:00:00Z`);
  const endMs = Date.parse(`${filters.endDate}T23:59:59Z`);

  const byHour = new Map<number, number>();
  for (const rec of SNMP_RECORDS) {
    if (!scopedRouters.has(rec.router)) continue;
    if (rec.timestamp < beginMs || rec.timestamp > endMs) continue;
    byHour.set(rec.timestamp, (byHour.get(rec.timestamp) ?? 0) + rec.totalBps);
  }
  return Array.from(byHour.entries())
    .sort(([a], [b]) => a - b)
    .map(([time, snmpTotalBps]) => ({ time, snmpTotalBps }));
}
