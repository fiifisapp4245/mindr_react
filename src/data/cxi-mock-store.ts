/**
 * cxi-mock-store.ts — single source of truth for all CXI dashboard data.
 * All KPI cards, site map, trend chart, and movers derive from here.
 * Individual widgets must NOT have hand-typed counts that contradict this store.
 */

import { mockCases } from "./cxi-cases";

// ── Re-export cases so widgets always import from here ───────────────────────

export { mockCases };

// ── Site marker → region mapping (must match mockCases affectedScope.region) ─

export interface SiteMarker {
  city: string;
  displayLabel: string;
  region: string;   // must match mockCases[].affectedScope.region exactly
  x: number;
  y: number;
  cxiScore: number; // 1–5 composite score
}

export const SITE_MARKERS: SiteMarker[] = [
  { city: "Hamburg",   displayLabel: "Hamburg",   region: "Hamburg Metropolitan", x: 105, y: 48,  cxiScore: 3.8 },
  { city: "Berlin",    displayLabel: "Berlin",    region: "Berlin Metropolitan",  x: 206, y: 98,  cxiScore: 3.1 },
  { city: "Cologne",   displayLabel: "Cologne",   region: "Cologne/Bonn",         x: 68,  y: 140, cxiScore: 2.9 },
  { city: "Frankfurt", displayLabel: "Frankfurt", region: "Frankfurt Rhine-Main",  x: 118, y: 168, cxiScore: 3.3 },
  { city: "Munich",    displayLabel: "Munich",    region: "Munich Metropolitan",  x: 162, y: 258, cxiScore: 3.6 },
];

// ── Scope data for drill-down (Change 4) ─────────────────────────────────────

export type ScopeLevel = "country" | "region" | "city" | "cell";

export interface ScopeNode {
  id: string;
  label: string;
  level: ScopeLevel;
  parentId: string | null;
  cxiScore: number;
  delta: number;    // vs last week
  trendData: TrendPoint[];
}

export interface TrendPoint {
  day: string;
  score: number;
  cases: number;
}

const TREND_COUNTRY: TrendPoint[] = [
  { day: "21 May", score: 4.1, cases: 2  },
  { day: "22 May", score: 3.9, cases: 4  },
  { day: "23 May", score: 3.7, cases: 6  },
  { day: "24 May", score: 3.4, cases: 9  },
  { day: "25 May", score: 3.2, cases: 11 },
  { day: "26 May", score: 3.0, cases: 14 },
  { day: "27 May", score: 3.2, cases: 12 },
  { day: "28 May", score: 3.4, cases: 10 },
];

const TREND_NRW: TrendPoint[] = [
  { day: "21 May", score: 3.9, cases: 1 },
  { day: "22 May", score: 3.7, cases: 1 },
  { day: "23 May", score: 3.4, cases: 2 },
  { day: "24 May", score: 3.1, cases: 3 },
  { day: "25 May", score: 2.9, cases: 3 },
  { day: "26 May", score: 2.7, cases: 4 },
  { day: "27 May", score: 2.8, cases: 3 },
  { day: "28 May", score: 2.9, cases: 3 },
];

const TREND_BAVARIA: TrendPoint[] = [
  { day: "21 May", score: 4.2, cases: 0 },
  { day: "22 May", score: 4.1, cases: 0 },
  { day: "23 May", score: 3.9, cases: 1 },
  { day: "24 May", score: 3.8, cases: 1 },
  { day: "25 May", score: 3.7, cases: 1 },
  { day: "26 May", score: 3.5, cases: 1 },
  { day: "27 May", score: 3.6, cases: 1 },
  { day: "28 May", score: 3.6, cases: 1 },
];

const TREND_BERLIN: TrendPoint[] = [
  { day: "21 May", score: 3.9, cases: 0 },
  { day: "22 May", score: 3.8, cases: 0 },
  { day: "23 May", score: 3.5, cases: 1 },
  { day: "24 May", score: 3.3, cases: 2 },
  { day: "25 May", score: 3.2, cases: 2 },
  { day: "26 May", score: 3.0, cases: 2 },
  { day: "27 May", score: 3.1, cases: 2 },
  { day: "28 May", score: 3.1, cases: 2 },
];

const TREND_COLOGNE: TrendPoint[] = [
  { day: "21 May", score: 4.0, cases: 0 },
  { day: "22 May", score: 3.7, cases: 1 },
  { day: "23 May", score: 3.4, cases: 1 },
  { day: "24 May", score: 3.1, cases: 2 },
  { day: "25 May", score: 2.9, cases: 2 },
  { day: "26 May", score: 2.7, cases: 3 },
  { day: "27 May", score: 2.8, cases: 3 },
  { day: "28 May", score: 2.9, cases: 3 },
];

export const SCOPE_NODES: ScopeNode[] = [
  { id: "germany",   label: "Germany",                    level: "country", parentId: null,        cxiScore: 3.4, delta: -0.7, trendData: TREND_COUNTRY },
  { id: "nrw",       label: "North Rhine-Westphalia",     level: "region",  parentId: "germany",   cxiScore: 2.9, delta: -1.1, trendData: TREND_NRW    },
  { id: "bavaria",   label: "Bavaria",                    level: "region",  parentId: "germany",   cxiScore: 3.6, delta: -0.4, trendData: TREND_BAVARIA },
  { id: "berlin-bb", label: "Berlin-Brandenburg",         level: "region",  parentId: "germany",   cxiScore: 3.1, delta: -0.6, trendData: TREND_BERLIN  },
  { id: "hesse",     label: "Hesse",                      level: "region",  parentId: "germany",   cxiScore: 3.3, delta: -0.5, trendData: TREND_COUNTRY },
  { id: "hamburg-r", label: "Hamburg Metropolitan",       level: "region",  parentId: "germany",   cxiScore: 3.8, delta: -0.2, trendData: TREND_COUNTRY },
  { id: "cologne",   label: "Cologne",                    level: "city",    parentId: "nrw",       cxiScore: 2.9, delta: -1.1, trendData: TREND_COLOGNE  },
  { id: "munich",    label: "Munich",                     level: "city",    parentId: "bavaria",   cxiScore: 3.6, delta: -0.4, trendData: TREND_BAVARIA  },
  { id: "berlin",    label: "Berlin",                     level: "city",    parentId: "berlin-bb", cxiScore: 3.1, delta: -0.6, trendData: TREND_BERLIN   },
  { id: "frankfurt", label: "Frankfurt",                  level: "city",    parentId: "hesse",     cxiScore: 3.3, delta: -0.5, trendData: TREND_COUNTRY  },
  { id: "hamburg",   label: "Hamburg",                    level: "city",    parentId: "hamburg-r", cxiScore: 3.8, delta: -0.2, trendData: TREND_COUNTRY  },
  { id: "col-nord",  label: "Cologne Nord Sector 1",      level: "cell",    parentId: "cologne",   cxiScore: 2.1, delta: -1.7, trendData: TREND_COLOGNE  },
  { id: "muc-ost3",  label: "Munich Ost Sector 3",        level: "cell",    parentId: "munich",    cxiScore: 3.2, delta: -0.7, trendData: TREND_BAVARIA  },
  { id: "ber-nord",  label: "Berlin Nord Tower A",        level: "cell",    parentId: "berlin",    cxiScore: 2.9, delta: -0.5, trendData: TREND_BERLIN   },
];

// ── Biggest movers data (Change 5) ────────────────────────────────────────────

export interface Mover {
  cellName: string;
  city: string;
  fromScore: number;
  toScore: number;
  delta: number;
  sparkline: number[]; // ~8 points, oldest first
  caseCount: number;   // linked active cases
  region: string;      // for query-param link to CxiCases
}

const MOVERS_24H = {
  degraded: [
    { cellName: "Cologne Nord A",    city: "Cologne",   fromScore: 3.8, toScore: 2.1, delta: -1.7, sparkline: [3.8, 3.7, 3.5, 3.2, 2.9, 2.5, 2.2, 2.1], caseCount: 3, region: "Cologne/Bonn"        },
    { cellName: "Berlin Mitte B3",   city: "Berlin",    fromScore: 3.4, toScore: 2.9, delta: -0.5, sparkline: [3.4, 3.3, 3.2, 3.2, 3.1, 3.0, 2.9, 2.9], caseCount: 2, region: "Berlin Metropolitan"  },
    { cellName: "Leipzig Zentrum 1", city: "Leipzig",   fromScore: 3.6, toScore: 2.8, delta: -0.8, sparkline: [3.6, 3.5, 3.3, 3.2, 3.1, 3.0, 2.9, 2.8], caseCount: 1, region: "Leipzig Saxony"       },
    { cellName: "Frankfurt Süd C",   city: "Frankfurt", fromScore: 3.5, toScore: 3.0, delta: -0.5, sparkline: [3.5, 3.4, 3.3, 3.2, 3.2, 3.1, 3.0, 3.0], caseCount: 1, region: "Frankfurt Rhine-Main"  },
    { cellName: "Munich Ost Sek 3",  city: "Munich",    fromScore: 3.9, toScore: 3.6, delta: -0.3, sparkline: [3.9, 3.8, 3.8, 3.7, 3.7, 3.7, 3.6, 3.6], caseCount: 1, region: "Munich Metropolitan"  },
    { cellName: "Hamburg Mitte 4",   city: "Hamburg",   fromScore: 4.0, toScore: 3.8, delta: -0.2, sparkline: [4.0, 4.0, 3.9, 3.9, 3.9, 3.8, 3.8, 3.8], caseCount: 0, region: "Hamburg Metropolitan"  },
  ] as Mover[],
  improved: [
    { cellName: "Hannover Süd A",    city: "Hannover",   fromScore: 2.4, toScore: 3.2, delta: 0.8, sparkline: [2.4, 2.5, 2.6, 2.8, 2.9, 3.0, 3.1, 3.2], caseCount: 0, region: "Hannover Lower Saxony"  },
    { cellName: "Bremen Nord 1",     city: "Bremen",     fromScore: 2.5, toScore: 3.2, delta: 0.7, sparkline: [2.5, 2.6, 2.7, 2.8, 2.9, 3.0, 3.1, 3.2], caseCount: 0, region: "Bremen Northern"          },
    { cellName: "Stuttgart Nord S1", city: "Stuttgart",  fromScore: 2.8, toScore: 3.3, delta: 0.5, sparkline: [2.8, 2.9, 2.9, 3.0, 3.0, 3.1, 3.2, 3.3], caseCount: 0, region: "Stuttgart Baden-Württemberg" },
    { cellName: "Dresden Nord D",    city: "Dresden",    fromScore: 2.6, toScore: 3.1, delta: 0.5, sparkline: [2.6, 2.7, 2.7, 2.8, 2.9, 2.9, 3.0, 3.1], caseCount: 0, region: "Dresden Saxony"           },
    { cellName: "Nuremberg Mitte 4", city: "Nuremberg",  fromScore: 2.8, toScore: 3.2, delta: 0.4, sparkline: [2.8, 2.8, 2.9, 2.9, 3.0, 3.0, 3.1, 3.2], caseCount: 0, region: "Nuremberg Bavaria"        },
  ] as Mover[],
};

const MOVERS_48H = {
  degraded: [
    { cellName: "Cologne Nord A",    city: "Cologne",   fromScore: 4.1, toScore: 2.1, delta: -2.0, sparkline: [4.1, 3.9, 3.6, 3.3, 2.9, 2.6, 2.3, 2.1], caseCount: 3, region: "Cologne/Bonn"         },
    { cellName: "Berlin Mitte B3",   city: "Berlin",    fromScore: 3.7, toScore: 2.9, delta: -0.8, sparkline: [3.7, 3.6, 3.5, 3.4, 3.2, 3.1, 3.0, 2.9], caseCount: 2, region: "Berlin Metropolitan"   },
    { cellName: "Leipzig Zentrum 1", city: "Leipzig",   fromScore: 3.9, toScore: 2.8, delta: -1.1, sparkline: [3.9, 3.7, 3.5, 3.3, 3.1, 3.0, 2.9, 2.8], caseCount: 1, region: "Leipzig Saxony"        },
    { cellName: "Frankfurt Süd C",   city: "Frankfurt", fromScore: 3.8, toScore: 3.0, delta: -0.8, sparkline: [3.8, 3.7, 3.6, 3.5, 3.3, 3.2, 3.1, 3.0], caseCount: 1, region: "Frankfurt Rhine-Main"   },
    { cellName: "Düsseldorf Ost C",  city: "Düsseldorf", fromScore: 3.5, toScore: 2.9, delta: -0.6, sparkline: [3.5, 3.4, 3.3, 3.2, 3.1, 3.0, 2.9, 2.9], caseCount: 1, region: "Düsseldorf Rhine-Ruhr" },
    { cellName: "Munich Ost Sek 3",  city: "Munich",    fromScore: 4.0, toScore: 3.6, delta: -0.4, sparkline: [4.0, 3.9, 3.9, 3.8, 3.8, 3.7, 3.7, 3.6], caseCount: 1, region: "Munich Metropolitan"   },
  ] as Mover[],
  improved: [
    { cellName: "Hannover Süd A",    city: "Hannover",   fromScore: 2.2, toScore: 3.2, delta: 1.0, sparkline: [2.2, 2.4, 2.5, 2.7, 2.8, 3.0, 3.1, 3.2], caseCount: 0, region: "Hannover Lower Saxony"  },
    { cellName: "Bremen Nord 1",     city: "Bremen",     fromScore: 2.3, toScore: 3.2, delta: 0.9, sparkline: [2.3, 2.5, 2.6, 2.8, 2.9, 3.0, 3.1, 3.2], caseCount: 0, region: "Bremen Northern"          },
    { cellName: "Stuttgart Nord S1", city: "Stuttgart",  fromScore: 2.5, toScore: 3.3, delta: 0.8, sparkline: [2.5, 2.6, 2.7, 2.9, 3.0, 3.1, 3.2, 3.3], caseCount: 0, region: "Stuttgart Baden-Württemberg" },
    { cellName: "Düsseldorf Ost C",  city: "Düsseldorf", fromScore: 2.6, toScore: 3.3, delta: 0.7, sparkline: [2.6, 2.7, 2.8, 2.9, 3.0, 3.1, 3.2, 3.3], caseCount: 0, region: "Düsseldorf Rhine-Ruhr"   },
    { cellName: "Dresden Nord D",    city: "Dresden",    fromScore: 2.4, toScore: 3.1, delta: 0.7, sparkline: [2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0, 3.1], caseCount: 0, region: "Dresden Saxony"           },
    { cellName: "Nuremberg Mitte 4", city: "Nuremberg",  fromScore: 2.6, toScore: 3.2, delta: 0.6, sparkline: [2.6, 2.7, 2.8, 2.9, 2.9, 3.0, 3.1, 3.2], caseCount: 0, region: "Nuremberg Bavaria"        },
  ] as Mover[],
};

const MOVERS_7D = {
  degraded: [
    { cellName: "Cologne Nord A",    city: "Cologne",   fromScore: 4.4, toScore: 2.1, delta: -2.3, sparkline: [4.4, 4.2, 3.9, 3.5, 3.1, 2.7, 2.3, 2.1], caseCount: 3, region: "Cologne/Bonn"         },
    { cellName: "Leipzig Zentrum 1", city: "Leipzig",   fromScore: 4.2, toScore: 2.8, delta: -1.4, sparkline: [4.2, 4.0, 3.8, 3.5, 3.2, 3.0, 2.9, 2.8], caseCount: 1, region: "Leipzig Saxony"        },
    { cellName: "Berlin Mitte B3",   city: "Berlin",    fromScore: 4.0, toScore: 2.9, delta: -1.1, sparkline: [4.0, 3.8, 3.6, 3.4, 3.3, 3.1, 3.0, 2.9], caseCount: 2, region: "Berlin Metropolitan"   },
    { cellName: "Düsseldorf Ost C",  city: "Düsseldorf", fromScore: 3.9, toScore: 2.9, delta: -1.0, sparkline: [3.9, 3.7, 3.5, 3.3, 3.2, 3.1, 3.0, 2.9], caseCount: 1, region: "Düsseldorf Rhine-Ruhr" },
    { cellName: "Frankfurt Süd C",   city: "Frankfurt", fromScore: 4.0, toScore: 3.0, delta: -1.0, sparkline: [4.0, 3.8, 3.6, 3.4, 3.3, 3.2, 3.1, 3.0], caseCount: 1, region: "Frankfurt Rhine-Main"   },
    { cellName: "Munich Ost Sek 3",  city: "Munich",    fromScore: 4.2, toScore: 3.6, delta: -0.6, sparkline: [4.2, 4.1, 4.0, 3.9, 3.8, 3.7, 3.7, 3.6], caseCount: 1, region: "Munich Metropolitan"   },
    { cellName: "Hamburg Mitte 4",   city: "Hamburg",   fromScore: 4.3, toScore: 3.8, delta: -0.5, sparkline: [4.3, 4.2, 4.1, 4.1, 4.0, 3.9, 3.9, 3.8], caseCount: 0, region: "Hamburg Metropolitan"  },
  ] as Mover[],
  improved: [
    { cellName: "Hannover Süd A",    city: "Hannover",  fromScore: 2.1, toScore: 3.2, delta: 1.1, sparkline: [2.1, 2.3, 2.5, 2.7, 2.8, 3.0, 3.1, 3.2], caseCount: 0, region: "Hannover Lower Saxony"  },
    { cellName: "Bremen Nord 1",     city: "Bremen",    fromScore: 2.2, toScore: 3.2, delta: 1.0, sparkline: [2.2, 2.4, 2.6, 2.7, 2.9, 3.0, 3.1, 3.2], caseCount: 0, region: "Bremen Northern"          },
    { cellName: "Stuttgart Nord S1", city: "Stuttgart", fromScore: 2.4, toScore: 3.3, delta: 0.9, sparkline: [2.4, 2.6, 2.7, 2.9, 3.0, 3.1, 3.2, 3.3], caseCount: 0, region: "Stuttgart Baden-Württemberg" },
    { cellName: "Nuremberg Mitte 4", city: "Nuremberg", fromScore: 2.5, toScore: 3.2, delta: 0.7, sparkline: [2.5, 2.6, 2.7, 2.8, 2.9, 3.0, 3.1, 3.2], caseCount: 0, region: "Nuremberg Bavaria"        },
    { cellName: "Dresden Nord D",    city: "Dresden",   fromScore: 2.3, toScore: 3.1, delta: 0.8, sparkline: [2.3, 2.5, 2.6, 2.8, 2.9, 3.0, 3.0, 3.1], caseCount: 0, region: "Dresden Saxony"           },
    { cellName: "Düsseldorf Ost C",  city: "Düsseldorf", fromScore: 2.4, toScore: 3.3, delta: 0.9, sparkline: [2.4, 2.6, 2.7, 2.9, 3.0, 3.1, 3.2, 3.3], caseCount: 0, region: "Düsseldorf Rhine-Ruhr"   },
  ] as Mover[],
};

export type MoverWindow = "24h" | "48h" | "7d";

export const MOVERS_BY_WINDOW: Record<MoverWindow, { degraded: Mover[]; improved: Mover[] }> = {
  "24h": MOVERS_24H,
  "48h": MOVERS_48H,
  "7d":  MOVERS_7D,
};

// ── Germany SVG path ─────────────────────────────────────────────────────────

export const GERMANY_PATH =
  "M 95,28 L 108,18 L 130,14 L 150,14 L 168,14 L 182,18 L 200,22 L 218,28 L 228,50 L 234,78 L 224,108 L 232,138 L 230,162 L 220,195 L 210,228 L 196,264 L 168,282 L 142,282 L 112,275 L 92,262 L 78,228 L 64,195 L 58,162 L 60,132 L 54,104 L 58,78 L 70,52 L 83,38 Z";

// ── KPI computation helpers ───────────────────────────────────────────────────

export function computeKpis(cases: typeof mockCases) {
  const total      = cases.length;
  const activeCases = cases.filter((c) => c.status === "pending" || c.status === "escalated");
  const active     = activeCases.length;
  const p1         = cases.filter((c) => c.severity === "P1").length;
  // 0a: highSev is a subset of active cases — never exceeds active
  // Definition: CXI composite < 2 (4.5 + drop < 2 → drop < -2.5) OR |drop| > 2
  const highSev    = activeCases.filter((c) => (4.5 + c.cxiDrop) < 2 || Math.abs(c.cxiDrop) > 2).length;
  const unknown   = cases.filter((c) => c.classification === "unknown").length;
  const knownPct  = total > 0 ? Math.round(((total - unknown) / total) * 100) : 0;
  const unknownPct = 100 - knownPct;

  // Cases with existing ticket/incident coverage that might be duplicates
  const withTickets = cases.filter((c) => c.evidence.tickets.length > 0).length;
  const dupRiskPct  = total > 0 ? Math.round((withTickets / total) * 100) : 0;

  // Needs incident action: active P1 with no existing tickets
  const needsAction = cases.filter(
    (c) =>
      (c.status === "pending" || c.status === "escalated") &&
      c.severity === "P1" &&
      c.evidence.tickets.length === 0,
  ).length;

  // Clustered: cities with > 1 active case
  const regionCounts = new Map<string, number>();
  cases
    .filter((c) => c.status === "pending" || c.status === "escalated")
    .forEach((c) => regionCounts.set(c.affectedScope.region, (regionCounts.get(c.affectedScope.region) ?? 0) + 1));
  const clustered = [...regionCounts.values()].filter((n) => n > 1).reduce((s, n) => s + n, 0);
  const clusteredPct = active > 0 ? Math.round((clustered / active) * 100) : 0;

  // Top 5 regions by case count
  const sorted = [...regionCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const top5Sum = sorted.reduce((s, [, n]) => s + n, 0);
  const top5Pct = active > 0 ? Math.round((top5Sum / active) * 100) : 0;

  // Change-linked: cases with correlated change records
  const changeLinkCount = cases.filter((c) => c.evidence.changes.length > 0).length;
  const changeLinkPct   = total > 0 ? Math.round((changeLinkCount / total) * 100) : 0;

  // Routed to optimization/capacity teams
  const optTeams = ["Capacity Planning Team", "Network Optimization Team", "RAN Optimization"];
  const routedOpt = cases.filter(
    (c) => optTeams.some((t) => c.recommendation.targetTeam.includes(t.split(" ")[0])),
  ).length;
  const routedOptPct = total > 0 ? Math.round((routedOpt / total) * 100) : 0;

  // 0b: baseline scales with dataset size
  const baseline = total <= 20 ? 10 : Math.round(active * 0.7);

  return {
    total, active, p1, highSev,
    knownPct, unknownPct,
    dupRiskPct,
    needsAction,
    clusteredPct,
    top5Pct,
    changeLinkPct,
    routedOpt, routedOptPct,
    baseline,
  };
}

// ── Large-volume mock generator for scale-readiness toggle ───────────────────

// 0d: plausible German cell names for volume mode
const GEN_CITIES   = ["Köln", "Essen", "Berlin", "München", "Frankfurt", "Hamburg", "Düsseldorf", "Nürnberg", "Hannover", "Leipzig", "Dresden", "Stuttgart"];
const GEN_DIRS     = ["Nord", "Süd", "Ost", "West", "Mitte"];
const GEN_SECTORS  = ["A1", "A2", "B1", "B2", "B3", "C1", "C2", "D1"];

function genLargeCases(count: number) {
  const statuses = ["pending", "approved", "rejected", "escalated", "corrected"] as const;
  const severities = ["P1", "P2", "P3"] as const;
  const regions = [
    "Cologne/Bonn", "Berlin Metropolitan", "Munich Metropolitan",
    "Frankfurt Rhine-Main", "Hamburg Metropolitan", "Stuttgart Baden-Württemberg",
    "Düsseldorf Rhine-Ruhr", "Nuremberg Bavaria", "Bremen Northern",
    "Hannover Lower Saxony", "Leipzig Saxony", "Dresden Saxony",
  ];
  const classifs = ["incident", "optimization", "known_problem", "unknown"] as const;
  const cases = [];
  for (let i = 0; i < count; i++) {
    const drop = -(0.8 + (i % 30) * 0.08);
    const city   = GEN_CITIES[i % GEN_CITIES.length];
    const dir    = GEN_DIRS[Math.floor(i / GEN_CITIES.length) % GEN_DIRS.length];
    const sector = GEN_SECTORS[Math.floor(i / (GEN_CITIES.length * GEN_DIRS.length)) % GEN_SECTORS.length];
    const cellName = `${city} ${dir} ${sector}`;
    const siteName = `${city} ${dir} Stm.`;
    cases.push({
      caseId: `CXI-2026-${String(1000 + i).padStart(4, "0")}`,
      status: statuses[i % statuses.length],
      classification: classifs[i % classifs.length],
      severity: severities[i % severities.length],
      triggerType: "cell_based" as const,
      duration: `${1 + (i % 10)}h ${i % 60}m`,
      assignedAgent: `CCA-DRA/gen-${i}`,
      affectedScope: {
        cellId: `DEU-GEN-${i}`,
        cellName,
        siteId: `SITE-${i}`,
        siteName,
        cluster: `CLUSTER-${i % 20}`,
        region: regions[i % regions.length],
        geoLat: 48 + (i % 10) * 0.4,
        geoLng: 8 + (i % 12) * 0.5,
      },
      cxiBaseline: 8.0,
      cxiCurrent: 8.0 + drop,
      cxiDrop: drop,
      cxiTimeseries: [],
      hypothesis: { text: `Auto-generated case ${i}`, confidence: 40 + (i % 50), signals: [], agentVersion: "CXI-RCA-v2.4.1" },
      recommendation: { actionType: "create_ticket" as const, targetTeam: "NOC", ticketType: "Incident" as const, rationale: "Auto", oneClickAvailable: false },
      evidence: { alarms: [], changes: [], tickets: [] },
      auditTrail: [],
      createdAt: new Date(Date.now() - i * 600000).toISOString(),
      updatedAt: new Date(Date.now() - i * 300000).toISOString(),
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      correction: null,
    });
  }
  return cases as typeof mockCases;
}

export const LARGE_MOCK_CASES = genLargeCases(988);

// ── SVG viewBoxes per scope level for map zoom ────────────────────────────────

export const SCOPE_VIEWBOXES: Record<string, string> = {
  germany:    "0 0 288 296",
  nrw:        "18 102 130 128",
  bavaria:    "108 192 132 118",
  "berlin-bb":"144 58 106 98",
  hesse:      "76 136 102 82",
  "hamburg-r":"62 20 100 82",
  cologne:    "28 112 108 88",
  munich:     "128 208 88 84",
  berlin:     "154 62 96 82",
  frankfurt:  "80 142 90 74",
  hamburg:    "68 24 90 72",
  "col-nord": "28 112 108 88",
  "muc-ost3": "128 208 88 84",
  "ber-nord": "154 62 96 82",
};

// ── Region zones for choropleth (country-level map blobs) ─────────────────────

export interface RegionZone {
  id: string;
  label: string;
  x: number;  // SVG center
  y: number;
  r: number;  // blob radius
  cxiScore: number;
}

export const REGION_ZONES: RegionZone[] = [
  { id: "nrw",        label: "NRW",       x: 70,  y: 148, r: 48, cxiScore: 2.9 },
  { id: "bavaria",    label: "Bavaria",   x: 170, y: 242, r: 52, cxiScore: 3.6 },
  { id: "berlin-bb",  label: "Berlin-BB", x: 202, y: 100, r: 36, cxiScore: 3.1 },
  { id: "hesse",      label: "Hesse",     x: 116, y: 170, r: 36, cxiScore: 3.3 },
  { id: "hamburg-r",  label: "Hamburg",   x: 108, y: 58,  r: 32, cxiScore: 3.8 },
];

// ── Site detail data for Network Model ───────────────────────────────────────

export interface SiteCellDetail {
  id: string;
  rat: "LTE" | "5G NR";
  cxiScore: number;
}

export interface ComponentScore {
  label: "Signal" | "Throughput" | "Voice Quality" | "Reliability";
  current: number;
  baseline: number;
}

export interface KnownCauseItem {
  type: "incident" | "change" | "ticket" | "known_area";
  id: string;
  description: string;
  status: "open" | "active" | "completed" | "closed";
  confidence?: number;
}

export interface NeighborCell {
  id: string;
  cxiScore: number;
  direction: string;
}

export interface SiteDetail {
  id: string;           // "KIN-001"
  name: string;         // "Köln Innenstadt"
  city: string;
  region: string;
  x: number;            // SVG position
  y: number;
  cxiScore: number;
  cxiTrend: "up" | "down" | "stable";
  cells: SiteCellDetail[];
  components: ComponentScore[];
  knownCauses: KnownCauseItem[];
  neighbors: NeighborCell[];
  affectedCustomers: number;
}

export const SITES_DATA: SiteDetail[] = [
  // ── Cologne / Bonn ──────────────────────────────────────────────────────────
  {
    id: "KIN-001",
    name: "Köln Innenstadt",
    city: "Cologne",
    region: "Cologne/Bonn",
    x: 55, y: 148,
    cxiScore: 2.4,
    cxiTrend: "down",
    cells: [
      { id: "KIN-001-A1", rat: "LTE",   cxiScore: 2.1 },
      { id: "KIN-001-N1", rat: "5G NR", cxiScore: 2.7 },
    ],
    components: [
      { label: "Signal",        current: 4.2, baseline: 7.8 },
      { label: "Throughput",    current: 3.8, baseline: 8.0 },
      { label: "Voice Quality", current: 5.1, baseline: 8.5 },
      { label: "Reliability",   current: 4.6, baseline: 8.2 },
    ],
    knownCauses: [
      { type: "incident",   id: "INC-7741", description: "Transmission path fault — EU-CORE ring", status: "open"      },
      { type: "change",     id: "CHG-2210", description: "Antenna tilt adjustment — Sektor A",      status: "completed" },
    ],
    neighbors: [
      { id: "KBN-007-A1", cxiScore: 3.1, direction: "S"  },
      { id: "KID-014-A1", cxiScore: 2.8, direction: "NE" },
      { id: "KEH-003-N2", cxiScore: 3.4, direction: "NW" },
    ],
    affectedCustomers: 1200,
  },
  {
    id: "KBN-007",
    name: "Bonn Zentrum",
    city: "Cologne",
    region: "Cologne/Bonn",
    x: 60, y: 163,
    cxiScore: 3.1,
    cxiTrend: "stable",
    cells: [
      { id: "KBN-007-A1", rat: "LTE",   cxiScore: 3.0 },
      { id: "KBN-007-N1", rat: "5G NR", cxiScore: 3.2 },
    ],
    components: [
      { label: "Signal",        current: 6.5, baseline: 8.0 },
      { label: "Throughput",    current: 6.2, baseline: 7.8 },
      { label: "Voice Quality", current: 7.0, baseline: 8.5 },
      { label: "Reliability",   current: 6.8, baseline: 8.2 },
    ],
    knownCauses: [
      { type: "ticket", id: "TKT-2026-3311", description: "Capacity threshold ticket — uplink congestion", status: "open" },
    ],
    neighbors: [
      { id: "KIN-001-A1", cxiScore: 2.4, direction: "N" },
      { id: "KBN-010-A2", cxiScore: 3.4, direction: "E" },
      { id: "KEH-003-N2", cxiScore: 3.5, direction: "W" },
    ],
    affectedCustomers: 680,
  },
  {
    id: "KID-014",
    name: "Köln Nippes",
    city: "Cologne",
    region: "Cologne/Bonn",
    x: 68, y: 137,
    cxiScore: 2.8,
    cxiTrend: "down",
    cells: [
      { id: "KID-014-A1", rat: "LTE",   cxiScore: 2.6 },
      { id: "KID-014-N1", rat: "5G NR", cxiScore: 3.0 },
    ],
    components: [
      { label: "Signal",        current: 5.0, baseline: 7.9 },
      { label: "Throughput",    current: 4.8, baseline: 7.7 },
      { label: "Voice Quality", current: 5.8, baseline: 8.4 },
      { label: "Reliability",   current: 5.3, baseline: 8.1 },
    ],
    knownCauses: [],
    neighbors: [
      { id: "KIN-001-N1", cxiScore: 2.7, direction: "S"  },
      { id: "KLE-002-A1", cxiScore: 3.2, direction: "N"  },
      { id: "KIN-008-A2", cxiScore: 3.4, direction: "NE" },
    ],
    affectedCustomers: 820,
  },

  // ── Munich ─────────────────────────────────────────────────────────────────
  {
    id: "MUE-031",
    name: "München Ost",
    city: "Munich",
    region: "Munich Metropolitan",
    x: 172, y: 255,
    cxiScore: 2.9,
    cxiTrend: "down",
    cells: [
      { id: "MUE-031-A1", rat: "LTE",   cxiScore: 2.7 },
      { id: "MUE-031-N2", rat: "5G NR", cxiScore: 3.1 },
      { id: "MUE-031-A2", rat: "LTE",   cxiScore: 3.0 },
    ],
    components: [
      { label: "Signal",        current: 5.8, baseline: 8.0 },
      { label: "Throughput",    current: 5.5, baseline: 7.9 },
      { label: "Voice Quality", current: 6.2, baseline: 8.4 },
      { label: "Reliability",   current: 5.9, baseline: 8.1 },
    ],
    knownCauses: [
      { type: "change",     id: "CHG-2026-0811", description: "RAN config update — uplink scheduler",    status: "active"    },
      { type: "known_area", id: "PSDB-MUC-04",   description: "PSDB: Known capacity gap — Ostbahnhof area", status: "open", confidence: 72 },
    ],
    neighbors: [
      { id: "MUS-045-A1", cxiScore: 3.5, direction: "SW" },
      { id: "MUN-003-N1", cxiScore: 3.2, direction: "W"  },
      { id: "MUE-028-A2", cxiScore: 3.3, direction: "SE" },
    ],
    affectedCustomers: 890,
  },
  {
    id: "MUS-045",
    name: "München Süd",
    city: "Munich",
    region: "Munich Metropolitan",
    x: 158, y: 268,
    cxiScore: 3.5,
    cxiTrend: "stable",
    cells: [
      { id: "MUS-045-A1", rat: "LTE",   cxiScore: 3.6 },
      { id: "MUS-045-N1", rat: "5G NR", cxiScore: 3.4 },
    ],
    components: [
      { label: "Signal",        current: 7.0, baseline: 8.0 },
      { label: "Throughput",    current: 6.8, baseline: 7.9 },
      { label: "Voice Quality", current: 7.4, baseline: 8.4 },
      { label: "Reliability",   current: 7.1, baseline: 8.1 },
    ],
    knownCauses: [],
    neighbors: [
      { id: "MUE-031-A1", cxiScore: 2.9, direction: "NE" },
      { id: "MUS-048-N1", cxiScore: 3.7, direction: "S"  },
      { id: "MUS-011-A3", cxiScore: 3.6, direction: "W"  },
    ],
    affectedCustomers: 420,
  },

  // ── Berlin ─────────────────────────────────────────────────────────────────
  {
    id: "BLN-012",
    name: "Berlin Mitte",
    city: "Berlin",
    region: "Berlin Metropolitan",
    x: 200, y: 98,
    cxiScore: 2.9,
    cxiTrend: "down",
    cells: [
      { id: "BLN-012-A1", rat: "LTE",   cxiScore: 2.7 },
      { id: "BLN-012-N3", rat: "5G NR", cxiScore: 3.1 },
    ],
    components: [
      { label: "Signal",        current: 5.9, baseline: 7.9 },
      { label: "Throughput",    current: 5.7, baseline: 7.8 },
      { label: "Voice Quality", current: 6.4, baseline: 8.3 },
      { label: "Reliability",   current: 6.0, baseline: 8.0 },
    ],
    knownCauses: [
      { type: "incident", id: "INC-7798", description: "Transport path fault — Berlin backbone ring", status: "open" },
      { type: "ticket",   id: "TKT-2026-4288", description: "Capacity ticket — uplink congestion",    status: "open" },
    ],
    neighbors: [
      { id: "BLN-028-A1", cxiScore: 3.4, direction: "N" },
      { id: "BLN-004-N2", cxiScore: 3.2, direction: "S" },
      { id: "BLN-019-A3", cxiScore: 3.0, direction: "E" },
    ],
    affectedCustomers: 1050,
  },
  {
    id: "BLN-028",
    name: "Berlin Nord",
    city: "Berlin",
    region: "Berlin Metropolitan",
    x: 203, y: 86,
    cxiScore: 3.4,
    cxiTrend: "stable",
    cells: [
      { id: "BLN-028-A1", rat: "LTE",   cxiScore: 3.5 },
      { id: "BLN-028-N1", rat: "5G NR", cxiScore: 3.3 },
    ],
    components: [
      { label: "Signal",        current: 7.1, baseline: 8.0 },
      { label: "Throughput",    current: 6.9, baseline: 7.9 },
      { label: "Voice Quality", current: 7.5, baseline: 8.4 },
      { label: "Reliability",   current: 7.2, baseline: 8.1 },
    ],
    knownCauses: [],
    neighbors: [
      { id: "BLN-012-A1", cxiScore: 2.9, direction: "S"  },
      { id: "BLN-033-A2", cxiScore: 3.6, direction: "N"  },
      { id: "BLN-017-N1", cxiScore: 3.5, direction: "NE" },
    ],
    affectedCustomers: 320,
  },

  // ── Hamburg ────────────────────────────────────────────────────────────────
  {
    id: "HBG-001",
    name: "Hamburg Mitte",
    city: "Hamburg",
    region: "Hamburg Metropolitan",
    x: 105, y: 52,
    cxiScore: 3.8,
    cxiTrend: "stable",
    cells: [
      { id: "HBG-001-A1", rat: "LTE",   cxiScore: 3.9 },
      { id: "HBG-001-N1", rat: "5G NR", cxiScore: 3.7 },
    ],
    components: [
      { label: "Signal",        current: 7.8, baseline: 8.1 },
      { label: "Throughput",    current: 7.6, baseline: 7.9 },
      { label: "Voice Quality", current: 8.0, baseline: 8.4 },
      { label: "Reliability",   current: 7.7, baseline: 8.0 },
    ],
    knownCauses: [],
    neighbors: [
      { id: "HBG-005-A1", cxiScore: 3.7, direction: "N"  },
      { id: "HBG-012-N2", cxiScore: 3.9, direction: "W"  },
      { id: "HBG-003-A2", cxiScore: 3.8, direction: "SE" },
    ],
    affectedCustomers: 0,
  },

  // ── Frankfurt ──────────────────────────────────────────────────────────────
  {
    id: "FRA-009",
    name: "Frankfurt Süd",
    city: "Frankfurt",
    region: "Frankfurt Rhine-Main",
    x: 115, y: 176,
    cxiScore: 3.0,
    cxiTrend: "down",
    cells: [
      { id: "FRA-009-A1", rat: "LTE",   cxiScore: 2.9 },
      { id: "FRA-009-N1", rat: "5G NR", cxiScore: 3.1 },
    ],
    components: [
      { label: "Signal",        current: 6.0, baseline: 8.1 },
      { label: "Throughput",    current: 5.8, baseline: 7.9 },
      { label: "Voice Quality", current: 6.5, baseline: 8.4 },
      { label: "Reliability",   current: 6.2, baseline: 8.1 },
    ],
    knownCauses: [
      { type: "change", id: "CHG-2026-0821", description: "Fiber splice work — backbone segment", status: "completed" },
    ],
    neighbors: [
      { id: "FRA-015-A1", cxiScore: 3.5, direction: "N" },
      { id: "FRA-022-N2", cxiScore: 3.3, direction: "E" },
      { id: "FRA-007-A1", cxiScore: 3.4, direction: "W" },
    ],
    affectedCustomers: 780,
  },
];

// ── Hotspot clusters ──────────────────────────────────────────────────────────

export interface Hotspot {
  id: string;
  label: string;
  x: number;   // SVG halo center
  y: number;
  r: number;   // halo radius
  caseCount: number;
  cellCount: number;
  windowHours: number;
  siteIds: string[];
}

export const HOTSPOTS: Hotspot[] = [
  {
    id: "HOT-A",
    label: "Cologne Center",
    x: 60, y: 150, r: 30,
    caseCount: 4, cellCount: 4, windowHours: 2,
    siteIds: ["KIN-001", "KBN-007"],
  },
  {
    id: "HOT-B",
    label: "Munich Ost",
    x: 172, y: 255, r: 22,
    caseCount: 2, cellCount: 3, windowHours: 3,
    siteIds: ["MUE-031"],
  },
];

// ── Top affected cells (ranked by case concentration) ────────────────────────

export interface TopCell {
  rank: number;
  cellId: string;
  siteId: string;
  siteName: string;
  rat: "LTE" | "5G NR";
  cxiScore: number;
  caseCount: number;
  hotspotId: string | null;
  region: string;
}

export const TOP_AFFECTED_CELLS: TopCell[] = [
  { rank: 1, cellId: "KIN-001-A1", siteId: "KIN-001", siteName: "Köln Innenstadt",  rat: "LTE",   cxiScore: 2.1, caseCount: 2, hotspotId: "HOT-A", region: "Cologne/Bonn"         },
  { rank: 2, cellId: "MUE-031-A1", siteId: "MUE-031", siteName: "München Ost",       rat: "LTE",   cxiScore: 2.7, caseCount: 1, hotspotId: "HOT-B", region: "Munich Metropolitan"  },
  { rank: 3, cellId: "BLN-012-A1", siteId: "BLN-012", siteName: "Berlin Mitte",      rat: "LTE",   cxiScore: 2.7, caseCount: 1, hotspotId: null,    region: "Berlin Metropolitan"  },
  { rank: 4, cellId: "KIN-001-N1", siteId: "KIN-001", siteName: "Köln Innenstadt",  rat: "5G NR", cxiScore: 2.7, caseCount: 1, hotspotId: "HOT-A", region: "Cologne/Bonn"         },
  { rank: 5, cellId: "KID-014-A1", siteId: "KID-014", siteName: "Köln Nippes",       rat: "LTE",   cxiScore: 2.6, caseCount: 1, hotspotId: null,    region: "Cologne/Bonn"         },
  { rank: 6, cellId: "KBN-007-A1", siteId: "KBN-007", siteName: "Bonn Zentrum",      rat: "LTE",   cxiScore: 3.0, caseCount: 1, hotspotId: "HOT-A", region: "Cologne/Bonn"         },
  { rank: 7, cellId: "MUE-031-N2", siteId: "MUE-031", siteName: "München Ost",       rat: "5G NR", cxiScore: 3.1, caseCount: 1, hotspotId: "HOT-B", region: "Munich Metropolitan"  },
  { rank: 8, cellId: "FRA-009-A1", siteId: "FRA-009", siteName: "Frankfurt Süd",     rat: "LTE",   cxiScore: 2.9, caseCount: 1, hotspotId: null,    region: "Frankfurt Rhine-Main" },
];
