import { Gamepad2, Tv, Trophy, Radio } from "lucide-react";

export type EventStatus = "upcoming" | "live" | "past";
export type EventSeverity = "critical" | "high" | "medium" | "low";

export interface PathNode {
  label: string;
  detail: string;
  type: "cdn" | "ixp" | "router" | "region";
}

export interface ChartPoint {
  time: string;
  base: number;
  predicted: number;
  actual?: number | null;
}

export interface PlannedChange {
  ref: string;         // CASM change ticket ref
  description: string;
  overlapNote: string;
  window: string;
}

export interface RelatedAlarmRef {
  ref: string;         // ALM- ref — must exist on the linked alert's alarmDetails
  alertId: string;      // real Alert.id (alert-store.ts) — deep-links to /alerts/:id
  eventLabel: string;   // which past occurrence this alarm relates to
}

export interface EventFull {
  id: string;
  name: string;
  shortName: string;
  type: string;
  typeKey: string;
  typeIcon: React.ElementType;
  status: EventStatus;
  severity: EventSeverity;
  window: string;
  windowUTC: string;
  windowSub: string;
  affectedScope: string;
  affectedPath: PathNode[];
  predictedPeak: number;
  actualPeak?: number;
  confidence: number;
  accuracy?: number;
  source: string;
  detectionSource: string;
  historicOccurrences: string;
  weekStart: number;
  weekSpan: number;
  dayOffset: number;
  chartData: ChartPoint[];
  overloadStart?: string;
  overloadEnd?: string;
  rcaSummary: string;
  plannedChanges: PlannedChange[];
  similarEventIds: string[];        // real EVENTS_FULL ids
  relatedAlarms: RelatedAlarmRef[];
}

export const EVENTS_FULL: EventFull[] = [
  {
    id: "EVT-0091",
    name: "Nova Strike — S3 launch",
    shortName: "Nova Strike S3",
    type: "Game release",
    typeKey: "game-release",
    typeIcon: Gamepad2,
    status: "upcoming",
    severity: "critical",
    window: "Thu 14 Jun, 18:00–23:00 UTC",
    windowUTC: "Thu 14 Jun 18:00–23:00 UTC",
    windowSub: "5h window",
    affectedScope: "EdgeCDN-EU → AMS-IX Amsterdam → EU-CORE-01 (AS1299)",
    affectedPath: [
      { label: "EdgeCDN-EU egress", detail: "edge-cdn-eu-fra-01", type: "cdn" },
      { label: "AMS-IX Amsterdam", detail: "IXP · 300 Gbps", type: "ixp" },
      { label: "core-rtr-fra-01.dt.net", detail: "ge-0/2/1 · peer AS1299", type: "router" },
      { label: "EU-CORE-01 / EU-WEST-01", detail: "Region downstream", type: "region" },
    ],
    predictedPeak: 96,
    confidence: 88,
    source: "AI forecast + operator alert",
    detectionSource: "News/social signals + historic pattern",
    historicOccurrences: "S1 +34 Gbps, S2 +41 Gbps on AMS-IX path",
    weekStart: 1,
    weekSpan: 1,
    dayOffset: 2,
    chartData: [
      { time: "16:00", base: 44, predicted: 44 },
      { time: "17:00", base: 46, predicted: 49 },
      { time: "18:00", base: 45, predicted: 58 },
      { time: "19:00", base: 44, predicted: 74 },
      { time: "20:00", base: 46, predicted: 91 },
      { time: "21:00", base: 45, predicted: 96 },
      { time: "22:00", base: 44, predicted: 88 },
      { time: "23:00", base: 45, predicted: 65 },
      { time: "00:00", base: 46, predicted: 50 },
    ],
    overloadStart: "20:00",
    overloadEnd: "22:00",
    rcaSummary:
      "Nova Strike S3 is a major game-release event on AS1299's distribution network. Historic S1 and S2 launches " +
      "both drove sustained multi-hour surges on the AMS-IX Amsterdam path, and pre-order/social signals for S3 " +
      "match that pattern closely — the 88% confidence reflects strong correlation with 2 prior launches on the " +
      "same path.",
    plannedChanges: [
      {
        ref: "CHG-9912",
        description: "AS3320 maintenance",
        overlapNote: "Maintenance window overlaps with event pre-load phase — capacity temporarily reduced",
        window: "14:00–16:00 UTC",
      },
    ],
    similarEventIds: ["EVT-0045", "EVT-0031"],
    relatedAlarms: [
      { ref: "ALM-0042", alertId: "ALT-001", eventLabel: "Nova Strike S2" },
      { ref: "ALM-0320", alertId: "ALT-012", eventLabel: "Nova Strike S2" },
      { ref: "ALM-0280", alertId: "ALT-008", eventLabel: "Nova Strike S1" },
    ],
  },
  {
    id: "EVT-0092",
    name: "SVOD finale drop",
    shortName: "SVOD Finale",
    type: "Streaming event",
    typeKey: "streaming-event",
    typeIcon: Tv,
    status: "upcoming",
    severity: "high",
    window: "Sun 17 Jun, 02:00–04:00 UTC",
    windowUTC: "Sun 17 Jun 02:00–04:00 UTC",
    windowSub: "2h window",
    affectedScope: "LINX London → EU-WEST-01",
    affectedPath: [
      { label: "StreamCDN-UK egress", detail: "cdn-uk-lon-02", type: "cdn" },
      { label: "LINX London", detail: "IXP · 200 Gbps", type: "ixp" },
      { label: "core-rtr-lon-01.dt.net", detail: "ge-1/0/3 · peer AS5413", type: "router" },
      { label: "EU-WEST-01", detail: "Region downstream", type: "region" },
    ],
    predictedPeak: 78,
    confidence: 81,
    source: "AI forecast",
    detectionSource: "Streaming schedule + social signals",
    historicOccurrences: "S1 +18 Gbps, S2 +22 Gbps on LINX path",
    weekStart: 2,
    weekSpan: 1,
    dayOffset: 5,
    chartData: [
      { time: "01:00", base: 32, predicted: 32 },
      { time: "02:00", base: 31, predicted: 48 },
      { time: "02:30", base: 33, predicted: 62 },
      { time: "03:00", base: 32, predicted: 78 },
      { time: "03:30", base: 31, predicted: 71 },
      { time: "04:00", base: 32, predicted: 55 },
      { time: "05:00", base: 33, predicted: 38 },
    ],
    rcaSummary:
      "SVOD finale drop is a scheduled streaming release on the LINX London path. Historic S1/S2 finale drops show " +
      "a consistent ~2-hour surge pattern; the 81% confidence reflects moderate correlation with 2 prior finale events.",
    plannedChanges: [],
    similarEventIds: [],
    relatedAlarms: [],
  },
  {
    id: "EVT-0093",
    name: "Console OS rollout",
    shortName: "Console OS",
    type: "Software update",
    typeKey: "software-update",
    typeIcon: Gamepad2,
    status: "upcoming",
    severity: "medium",
    window: "Mon 19 Jun – Wed 21 Jun, staggered",
    windowUTC: "19–21 Jun staggered rollout",
    windowSub: "48h window",
    affectedScope: "DE-CIX Frankfurt → EU-CENTRAL",
    affectedPath: [
      { label: "Update CDN DE egress", detail: "cdn-de-fra-03", type: "cdn" },
      { label: "DE-CIX Frankfurt", detail: "IXP · 400 Gbps", type: "ixp" },
      { label: "core-rtr-fra-02.dt.net", detail: "ge-0/0/2 · peer AS3320", type: "router" },
      { label: "EU-CENTRAL", detail: "Region downstream", type: "region" },
    ],
    predictedPeak: 62,
    confidence: 74,
    source: "Vendor advisory",
    detectionSource: "Vendor advisory + AI pattern match",
    historicOccurrences: "Prior OS rollout +14 Gbps on DE-CIX path",
    weekStart: 2,
    weekSpan: 2,
    dayOffset: 7,
    chartData: [
      { time: "Mon 00", base: 38, predicted: 38 },
      { time: "Mon 06", base: 39, predicted: 44 },
      { time: "Mon 12", base: 40, predicted: 52 },
      { time: "Mon 18", base: 38, predicted: 62 },
      { time: "Tue 00", base: 39, predicted: 58 },
      { time: "Tue 12", base: 40, predicted: 51 },
      { time: "Wed 00", base: 38, predicted: 44 },
      { time: "Wed 12", base: 39, predicted: 39 },
    ],
    rcaSummary:
      "Console OS rollout is a staggered software update pushing traffic through DE-CIX Frankfurt over 48 hours. " +
      "Prior OS rollouts showed a modest, sustained load increase rather than a sharp spike; the 74% confidence " +
      "reflects a single historic reference point.",
    plannedChanges: [],
    similarEventIds: [],
    relatedAlarms: [],
  },
  {
    id: "EVT-0094",
    name: "Champions matchday stream",
    shortName: "Champions Stream",
    type: "Live sports",
    typeKey: "live-sports",
    typeIcon: Trophy,
    status: "live",
    severity: "medium",
    window: "Today, 19:45–22:30 UTC",
    windowUTC: "12 Jun 19:45–22:30 UTC",
    windowSub: "In progress",
    affectedScope: "DE-CIX Frankfurt → EU-CORE-02",
    affectedPath: [
      { label: "SportsCDN-EU egress", detail: "cdn-eu-fra-04", type: "cdn" },
      { label: "DE-CIX Frankfurt", detail: "IXP · 400 Gbps", type: "ixp" },
      { label: "core-rtr-fra-02.dt.net", detail: "ge-0/0/4 · peer AS3320", type: "router" },
      { label: "EU-CORE-02", detail: "Region downstream", type: "region" },
    ],
    predictedPeak: 68,
    actualPeak: 71,
    confidence: 90,
    source: "Broadcast schedule + AI forecast",
    detectionSource: "Broadcast schedule + historic sport events",
    historicOccurrences: "CL QF +21 Gbps, CL SF +24 Gbps on DE-CIX path",
    weekStart: 1,
    weekSpan: 1,
    dayOffset: 0,
    chartData: [
      { time: "18:00", base: 38, predicted: 41, actual: 40 },
      { time: "19:00", base: 40, predicted: 52, actual: 54 },
      { time: "19:45", base: 39, predicted: 61, actual: 63 },
      { time: "20:30", base: 38, predicted: 68, actual: 71 },
      { time: "21:00", base: 40, predicted: 64, actual: 67 },
      { time: "21:30", base: 39, predicted: 57, actual: null },
      { time: "22:00", base: 38, predicted: 48, actual: null },
      { time: "22:30", base: 40, predicted: 42, actual: null },
    ],
    rcaSummary:
      "Champions matchday stream is a live sports broadcast on the DE-CIX Frankfurt path. Actual load (71%) is " +
      "tracking slightly above the 68% forecast, consistent with prior Champions League fixtures on this path.",
    plannedChanges: [],
    similarEventIds: [],
    relatedAlarms: [],
  },
  {
    id: "EVT-0045",
    name: "Nova Strike — S2 launch",
    shortName: "Nova Strike S2",
    type: "Game release",
    typeKey: "game-release",
    typeIcon: Gamepad2,
    status: "past",
    severity: "critical",
    window: "Fri 2 May, 18:00–23:00 UTC",
    windowUTC: "02 May 18:00–23:00 UTC",
    windowSub: "Completed",
    affectedScope: "EdgeCDN-EU → AMS-IX Amsterdam → EU-CORE-01 (AS1299)",
    affectedPath: [
      { label: "EdgeCDN-EU egress", detail: "edge-cdn-eu-fra-01", type: "cdn" },
      { label: "AMS-IX Amsterdam", detail: "IXP · 300 Gbps", type: "ixp" },
      { label: "core-rtr-fra-01.dt.net", detail: "ge-0/2/1 · peer AS1299", type: "router" },
      { label: "EU-CORE-01", detail: "Region downstream", type: "region" },
    ],
    predictedPeak: 92,
    actualPeak: 95,
    confidence: 87,
    accuracy: 96,
    source: "AI forecast",
    detectionSource: "News/social signals + historic pattern",
    historicOccurrences: "S1 +34 Gbps on AMS-IX path",
    weekStart: 1,
    weekSpan: 1,
    dayOffset: -41,
    chartData: [
      { time: "16:00", base: 43, predicted: 43, actual: 43 },
      { time: "17:00", base: 45, predicted: 51, actual: 53 },
      { time: "18:00", base: 44, predicted: 64, actual: 69 },
      { time: "19:00", base: 43, predicted: 81, actual: 86 },
      { time: "20:00", base: 44, predicted: 92, actual: 95 },
      { time: "21:00", base: 43, predicted: 87, actual: 91 },
      { time: "22:00", base: 44, predicted: 68, actual: 72 },
      { time: "23:00", base: 45, predicted: 51, actual: 53 },
      { time: "00:00", base: 44, predicted: 44, actual: 44 },
    ],
    overloadStart: "19:00",
    overloadEnd: "22:00",
    rcaSummary:
      "Nova Strike S2 launch drove a sustained surge on the AMS-IX Amsterdam / AS1299 path, peaking at 95% against " +
      "a 92% forecast — the model under-predicted by 3 points, later attributed to a longer-than-usual pre-load window.",
    plannedChanges: [],
    similarEventIds: ["EVT-0031"],
    relatedAlarms: [
      { ref: "ALM-0042", alertId: "ALT-001", eventLabel: "Nova Strike S2" },
    ],
  },
  {
    id: "EVT-0046",
    name: "Major sale event",
    shortName: "Major Sale",
    type: "Commerce",
    typeKey: "commerce",
    typeIcon: Radio,
    status: "past",
    severity: "high",
    window: "Sat 27 Apr, 00:00–20:00 UTC",
    windowUTC: "27 Apr 00:00–20:00 UTC",
    windowSub: "Completed",
    affectedScope: "CommerceCDN → DE-CIX Frankfurt → EU-CENTRAL",
    affectedPath: [
      { label: "CommerceCDN egress", detail: "cdn-de-fra-02", type: "cdn" },
      { label: "DE-CIX Frankfurt", detail: "IXP · 400 Gbps", type: "ixp" },
      { label: "core-rtr-fra-02.dt.net", detail: "ge-0/0/1 · peer AS3320", type: "router" },
      { label: "EU-CENTRAL", detail: "Region downstream", type: "region" },
    ],
    predictedPeak: 70,
    actualPeak: 64,
    confidence: 79,
    accuracy: 91,
    source: "AI forecast",
    detectionSource: "Retailer announcement + historic commerce pattern",
    historicOccurrences: "Black Friday +16 Gbps, Prime Day +12 Gbps",
    weekStart: 1,
    weekSpan: 1,
    dayOffset: -46,
    chartData: [
      { time: "00:00", base: 34, predicted: 37, actual: 35 },
      { time: "04:00", base: 35, predicted: 48, actual: 42 },
      { time: "08:00", base: 36, predicted: 62, actual: 55 },
      { time: "12:00", base: 34, predicted: 70, actual: 64 },
      { time: "16:00", base: 35, predicted: 58, actual: 53 },
      { time: "20:00", base: 36, predicted: 38, actual: 36 },
    ],
    rcaSummary:
      "Major sale event drove a daytime surge on the DE-CIX Frankfurt / AS3320 path, peaking at 64% against a 70% " +
      "forecast — the model over-predicted, attributed to better-than-expected CDN pre-caching.",
    plannedChanges: [],
    similarEventIds: [],
    relatedAlarms: [],
  },
  {
    id: "EVT-0031",
    name: "Nova Strike — S1 launch",
    shortName: "Nova Strike S1",
    type: "Game release",
    typeKey: "game-release",
    typeIcon: Gamepad2,
    status: "past",
    severity: "critical",
    window: "Tue 14 Jan, 18:00–23:00 UTC",
    windowUTC: "14 Jan 18:00–23:00 UTC",
    windowSub: "Completed",
    affectedScope: "EdgeCDN-EU → AMS-IX Amsterdam → EU-CORE-01 (AS1299)",
    affectedPath: [
      { label: "EdgeCDN-EU egress", detail: "edge-cdn-eu-fra-01", type: "cdn" },
      { label: "AMS-IX Amsterdam", detail: "IXP · 300 Gbps", type: "ixp" },
      { label: "core-rtr-fra-01.dt.net", detail: "ge-0/2/1 · peer AS1299", type: "router" },
      { label: "EU-CORE-01", detail: "Region downstream", type: "region" },
    ],
    predictedPeak: 84,
    actualPeak: 88,
    confidence: 80,
    accuracy: 94,
    source: "AI forecast",
    detectionSource: "News/social signals + historic pattern",
    historicOccurrences: "First Nova Strike launch — no prior data available",
    weekStart: 1,
    weekSpan: 1,
    dayOffset: -158,
    chartData: [
      { time: "16:00", base: 40, predicted: 40, actual: 40 },
      { time: "17:00", base: 41, predicted: 46, actual: 48 },
      { time: "18:00", base: 40, predicted: 58, actual: 63 },
      { time: "19:00", base: 41, predicted: 78, actual: 84 },
      { time: "20:00", base: 40, predicted: 84, actual: 88 },
      { time: "21:00", base: 41, predicted: 76, actual: 80 },
      { time: "22:00", base: 40, predicted: 60, actual: 63 },
      { time: "23:00", base: 41, predicted: 47, actual: 48 },
      { time: "00:00", base: 40, predicted: 40, actual: 40 },
    ],
    overloadStart: "19:00",
    overloadEnd: "21:00",
    rcaSummary:
      "Nova Strike S1 launch — the first in the franchise's launch pattern on this path — peaked at 88% against " +
      "an 84% forecast, giving MINDR its first calibration point for AS1299 game-release surges.",
    plannedChanges: [],
    similarEventIds: [],
    relatedAlarms: [
      { ref: "ALM-0280", alertId: "ALT-008", eventLabel: "Nova Strike S1" },
    ],
  },
  {
    id: "EVT-0095",
    name: "Continental Esports Final — live surge",
    shortName: "Esports Final",
    type: "Live sports",
    typeKey: "live-sports",
    typeIcon: Trophy,
    status: "live",
    severity: "high",
    window: "Today, 20:00–23:00 UTC",
    windowUTC: "16 Jul 20:00–23:00 UTC",
    windowSub: "In progress",
    affectedScope: "LINX London → EU-WEST-01",
    affectedPath: [
      { label: "StreamCDN-UK egress", detail: "cdn-uk-lon-03", type: "cdn" },
      { label: "LINX London", detail: "IXP · 200 Gbps", type: "ixp" },
      { label: "core-rtr-lon-01.dt.net", detail: "ge-1/0/4 · peer AS5413", type: "router" },
      { label: "EU-WEST-01", detail: "Region downstream", type: "region" },
    ],
    predictedPeak: 82,
    actualPeak: 85,
    confidence: 85,
    source: "Broadcast schedule + AI forecast",
    detectionSource: "Broadcast schedule + historic esports events",
    historicOccurrences: "Regional final +19 Gbps, World final +26 Gbps on LINX path",
    weekStart: 1,
    weekSpan: 1,
    dayOffset: 0,
    chartData: [
      { time: "18:00", base: 34, predicted: 38, actual: 37 },
      { time: "19:00", base: 36, predicted: 50, actual: 53 },
      { time: "20:00", base: 35, predicted: 66, actual: 71 },
      { time: "20:30", base: 34, predicted: 82, actual: 85 },
      { time: "21:00", base: 36, predicted: 78, actual: 80 },
      { time: "21:30", base: 35, predicted: 63, actual: null },
      { time: "22:00", base: 34, predicted: 52, actual: null },
      { time: "23:00", base: 36, predicted: 40, actual: null },
    ],
    rcaSummary:
      "Continental Esports Final is a live broadcast event on the LINX London path. Actual load (85%) is tracking " +
      "above the 82% forecast, consistent with prior regional/world final matches on this path.",
    plannedChanges: [],
    similarEventIds: [],
    relatedAlarms: [],
  },
  {
    id: "EVT-0047",
    name: "Firmware maintenance — DE-CIX",
    shortName: "FW Maintenance",
    type: "Software update",
    typeKey: "software-update",
    typeIcon: Gamepad2,
    status: "past",
    severity: "low",
    window: "Sun 15 Jun, 02:00–04:00 UTC",
    windowUTC: "15 Jun 02:00–04:00 UTC",
    windowSub: "Completed",
    affectedScope: "DE-CIX Frankfurt → EU-CENTRAL",
    affectedPath: [
      { label: "Ops change window", detail: "scheduled-fw-update", type: "cdn" },
      { label: "DE-CIX Frankfurt", detail: "IXP · 400 Gbps", type: "ixp" },
      { label: "core-rtr-fra-03.dt.net", detail: "ge-0/0/3 · peer AS3320", type: "router" },
      { label: "EU-CENTRAL", detail: "Region downstream", type: "region" },
    ],
    predictedPeak: 35,
    actualPeak: 33,
    confidence: 91,
    accuracy: 97,
    source: "Change calendar",
    detectionSource: "Scheduled maintenance calendar",
    historicOccurrences: "Routine quarterly firmware update — low impact expected",
    weekStart: 1,
    weekSpan: 1,
    dayOffset: -31,
    chartData: [
      { time: "01:00", base: 22, predicted: 24, actual: 23 },
      { time: "02:00", base: 21, predicted: 30, actual: 28 },
      { time: "03:00", base: 22, predicted: 35, actual: 33 },
      { time: "04:00", base: 21, predicted: 27, actual: 25 },
      { time: "05:00", base: 22, predicted: 22, actual: 22 },
    ],
    rcaSummary:
      "Routine quarterly firmware maintenance on DE-CIX Frankfurt. Actual load (33%) tracked close to the 35% " +
      "forecast — a low-impact, low-severity window with no customer-visible disruption.",
    plannedChanges: [],
    similarEventIds: [],
    relatedAlarms: [],
  },
];

// ── Assistant hand-off ────────────────────────────────────────────────────────
// Builds the seeded opener for "Discuss with MINDR" — generated from the
// event's own data so the Assistant's first message is grounded in this
// specific event, not a generic template.

export function buildEventDiscussPrompt(event: EventFull): string {
  const ixpNode = event.affectedPath.find((p) => p.type === "ixp");
  const routerNode = event.affectedPath.find((p) => p.type === "router");
  const asMatch = routerNode?.detail.match(/AS\d+/)?.[0];
  const pathLabel = [asMatch, ixpNode?.label].filter(Boolean).join(" / ") || event.affectedScope;
  const timeRange = event.window.includes(", ") ? event.window.split(", ")[1] : event.window;

  return (
    `Help me prepare for ${event.id} (${event.name}) — predicted ${event.predictedPeak}% peak on the ` +
    `${pathLabel} path during ${timeRange}. What should I prioritise?`
  );
}
