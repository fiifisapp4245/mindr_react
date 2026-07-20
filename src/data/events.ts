import { Gamepad2, Tv, Trophy, Radio } from "lucide-react";

export type EventStatus = "upcoming" | "live" | "past";
export type EventSeverity = "critical" | "high" | "medium" | "low";

export interface PathNode {
  label: string;
  detail: string;
  type: "cdn" | "ixp" | "router" | "region";
}

export interface SeriesPoint {
  time: string;
  value: number;
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

// An event's contribution to a shared interface's load, as seen from another
// event's own record — i.e. the OTHER event's incremental surge on THIS
// interface (not that event's own total forecast, which lives on its own
// affectedInterfaces entry).
export interface OverlappingEventContribution {
  eventId: string;   // real EVENTS_FULL id
  eventName: string;
  window: string;    // the overlapping event's active window on this interface
  contribution: SeriesPoint[];
}

// One interface a given event affects. Multiple events can each carry an
// entry for the SAME physical interface (matched by `name`) — that's how two
// concurrent events "stack": each one's overlappingEvents[] references the
// other, and both converge on the same combinedForecast[] values (see
// events.ts's inline data comments on EVT-0091 / EVT-0096 for a worked
// example of this consistency).
export interface AffectedInterface {
  name: string;
  pathChain: PathNode[];
  baseLoad: SeriesPoint[];
  eventForecast: SeriesPoint[];        // THIS event's own total forecast (base + this event's surge)
  actual?: SeriesPoint[];              // only present for live/past events; gaps omitted (not null-padded)
  predictedPeak: number;               // combined peak where overlappingEvents exist, else eventForecast peak
  actualPeak?: number;
  overlappingEvents: OverlappingEventContribution[];
  combinedForecast: SeriesPoint[];     // baseLoad + this event's surge + all overlappingEvents contributions; [] when no overlap
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
  affectedInterfaces: AffectedInterface[];
  confidence: number;
  accuracy?: number;
  source: string;
  detectionSource: string;
  historicOccurrences: string;
  weekStart: number;
  weekSpan: number;
  dayOffset: number;
  rcaSummary: string;
  plannedChanges: PlannedChange[];
  similarEventIds: string[];        // real EVENTS_FULL ids
  relatedAlarms: RelatedAlarmRef[];
}

// ── Per-interface derivation helpers ──────────────────────────────────────────
// Single source of truth for "which interface is worst" / "what's the header
// peak" — every consumer (header, Evidence small-multiples, Events list page,
// buildEventDiscussPrompt) calls these instead of reading a stored scalar, so
// they can never disagree with the underlying interface data.

export function interfacesWorstFirst(event: EventFull): AffectedInterface[] {
  return [...event.affectedInterfaces].sort((a, b) => b.predictedPeak - a.predictedPeak);
}

export function worstInterface(event: EventFull): AffectedInterface {
  return interfacesWorstFirst(event)[0];
}

// Header "Predicted peak load" = the worst interface's peak across affectedInterfaces[].
export function eventPredictedPeak(event: EventFull): number {
  return worstInterface(event)?.predictedPeak ?? 0;
}

export function eventActualPeak(event: EventFull): number | undefined {
  const peaks = event.affectedInterfaces.map((i) => i.actualPeak).filter((v): v is number => v != null);
  return peaks.length ? Math.max(...peaks) : undefined;
}

export function eventScopeSummary(event: EventFull): string {
  const names = interfacesWorstFirst(event).map((i) => i.name);
  if (names.length === 0) return "—";
  return names.length === 1 ? names[0] : `${names[0]} +${names.length - 1} more`;
}

export interface ConcurrentEventEntry {
  eventId: string;
  eventName: string;
  window: string;
  interfaces: { name: string; combinedPeak: number }[];
}

// RCA "Concurrent events on shared interfaces" — derived entirely from the
// SAME overlappingEvents/combinedForecast data the Evidence tab's combined
// lines read (single source, not mocked twice). Groups by the other event
// since one event can overlap on more than one shared interface.
//
// PREDICTION-BACKEND NOTE: the real combined-load computation (summing every
// concurrent event's per-interface contribution live) is a prediction-backend
// capability. This prototype only renders the combined line / concurrent-
// events section from the mocked overlap data below — nothing here is
// computed from a live feed.
export function getConcurrentEvents(event: EventFull): ConcurrentEventEntry[] {
  const byEvent = new Map<string, ConcurrentEventEntry>();
  for (const iface of event.affectedInterfaces) {
    for (const overlap of iface.overlappingEvents) {
      const combinedPeak = iface.combinedForecast.length
        ? Math.max(...iface.combinedForecast.map((p) => p.value))
        : iface.predictedPeak;
      if (!byEvent.has(overlap.eventId)) {
        byEvent.set(overlap.eventId, { eventId: overlap.eventId, eventName: overlap.eventName, window: overlap.window, interfaces: [] });
      }
      byEvent.get(overlap.eventId)!.interfaces.push({ name: iface.name, combinedPeak });
    }
  }
  return Array.from(byEvent.values());
}

// ── Mock data construction helpers ────────────────────────────────────────────

function toSeries(times: string[], values: number[]): SeriesPoint[] {
  return times.map((time, i) => ({ time, value: values[i] }));
}

// Builds a single-interface AffectedInterface (the common case — most events
// affect just one interface with no concurrent overlap).
function singleInterface(opts: {
  name: string;
  pathChain: PathNode[];
  times: string[];
  base: number[];
  forecast: number[];
  actual?: (number | null)[];
  predictedPeak: number;
  actualPeak?: number;
}): AffectedInterface {
  const actualSeries = opts.actual
    ? opts.times
        .map((time, i) => ({ time, value: opts.actual![i] }))
        .filter((p): p is SeriesPoint => p.value != null)
    : undefined;
  return {
    name: opts.name,
    pathChain: opts.pathChain,
    baseLoad: toSeries(opts.times, opts.base),
    eventForecast: toSeries(opts.times, opts.forecast),
    actual: actualSeries,
    predictedPeak: opts.predictedPeak,
    actualPeak: opts.actualPeak,
    overlappingEvents: [],
    combinedForecast: [],
  };
}

const NOVA_TIMES = ["16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "00:00"];

const AMS_IX_PATH_CHAIN: PathNode[] = [
  { label: "EdgeCDN-EU egress", detail: "edge-cdn-eu-fra-01", type: "cdn" },
  { label: "AMS-IX Amsterdam", detail: "IXP · 300 Gbps", type: "ixp" },
  { label: "core-rtr-fra-01.dt.net", detail: "ge-0/2/1 · peer AS1299", type: "router" },
  { label: "EU-CORE-01 / EU-WEST-01", detail: "Region downstream", type: "region" },
];

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
    confidence: 88,
    source: "AI forecast + operator alert",
    detectionSource: "News/social signals + historic pattern",
    historicOccurrences: "S1 +34 Gbps, S2 +41 Gbps on AMS-IX path",
    weekStart: 1,
    weekSpan: 1,
    dayOffset: 2,
    // Problem 1: this event affects 3 interfaces, not one path.
    // Problem 2: the AMS-IX interface also carries EVT-0096 (EU Regional Cup
    // Final) in an overlapping 20:00–22:00 UTC window — its combinedForecast
    // is base + this event's own surge + EVT-0096's contribution, and that
    // total (peaking at 112%) is physically the SAME number EVT-0096's own
    // record reports for this interface (see EVT-0096 below) — both events'
    // cards agree on one real combined value, not two independent guesses.
    affectedInterfaces: [
      {
        name: "AMS-IX Amsterdam — ge-0/2/1 peer AS1299",
        pathChain: AMS_IX_PATH_CHAIN,
        baseLoad: toSeries(NOVA_TIMES, [44, 46, 45, 44, 46, 45, 44, 45, 46]),
        eventForecast: toSeries(NOVA_TIMES, [44, 49, 58, 74, 91, 96, 88, 65, 50]),
        predictedPeak: 112,
        overlappingEvents: [
          {
            eventId: "EVT-0096",
            eventName: "EU Regional Cup Final — AMS-IX surge",
            window: "20:00–22:00 UTC",
            contribution: toSeries(NOVA_TIMES, [0, 0, 0, 4, 10, 16, 12, 4, 0]),
          },
        ],
        combinedForecast: toSeries(NOVA_TIMES, [44, 49, 58, 78, 101, 112, 100, 69, 50]),
      },
      {
        name: "LINX London — xe-2/0/2 peer AS5413",
        pathChain: [
          { label: "EdgeCDN-EU secondary egress", detail: "edge-cdn-eu-lon-05", type: "cdn" },
          { label: "LINX London", detail: "IXP · 200 Gbps", type: "ixp" },
          { label: "core-rtr-lon-02.dt.net", detail: "xe-2/0/2 · peer AS5413", type: "router" },
          { label: "EU-WEST-01", detail: "Region downstream", type: "region" },
        ],
        baseLoad: toSeries(NOVA_TIMES, [25, 26, 25, 24, 26, 25, 24, 25, 26]),
        eventForecast: toSeries(NOVA_TIMES, [25, 29, 38, 52, 68, 74, 66, 48, 32]),
        predictedPeak: 74,
        overlappingEvents: [],
        combinedForecast: [],
      },
      {
        name: "DE-CIX Frankfurt — xe-1/1/0 peer AS3320",
        pathChain: [
          { label: "EdgeCDN-EU tertiary egress", detail: "edge-cdn-eu-fra-06", type: "cdn" },
          { label: "DE-CIX Frankfurt", detail: "IXP · 400 Gbps", type: "ixp" },
          { label: "core-rtr-fra-03.dt.net", detail: "xe-1/1/0 · peer AS3320", type: "router" },
          { label: "EU-CENTRAL", detail: "Region downstream", type: "region" },
        ],
        baseLoad: toSeries(NOVA_TIMES, [30, 31, 30, 29, 31, 30, 29, 30, 31]),
        eventForecast: toSeries(NOVA_TIMES, [30, 33, 40, 52, 64, 68, 60, 45, 35]),
        predictedPeak: 68,
        overlappingEvents: [],
        combinedForecast: [],
      },
    ],
    rcaSummary:
      "Nova Strike S3 is a major game-release event on AS1299's distribution network. Historic S1 and S2 launches " +
      "both drove sustained multi-hour surges on the AMS-IX Amsterdam path, and pre-order/social signals for S3 " +
      "match that pattern closely — the 88% confidence reflects strong correlation with 2 prior launches on the " +
      "same path. The AMS-IX interface additionally carries a concurrent event (EU Regional Cup Final) in an " +
      "overlapping window, pushing its combined forecast above the interfaces forecast on its own.",
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
    id: "EVT-0096",
    name: "EU Regional Cup Final — AMS-IX surge",
    shortName: "EU Cup Final",
    type: "Live sports",
    typeKey: "live-sports",
    typeIcon: Trophy,
    status: "upcoming",
    severity: "high",
    window: "Thu 14 Jun, 20:00–22:00 UTC",
    windowUTC: "Thu 14 Jun 20:00–22:00 UTC",
    windowSub: "2h window",
    confidence: 79,
    source: "Broadcast schedule + AI forecast",
    detectionSource: "Broadcast schedule + historic sport events",
    historicOccurrences: "Regional final +10 Gbps on AMS-IX path (prior season)",
    weekStart: 1,
    weekSpan: 1,
    dayOffset: 2,
    // Shares the AMS-IX interface with EVT-0091 (Nova Strike S3) in an
    // overlapping window — see that record's comment for how the two
    // combinedForecast values are kept physically consistent.
    affectedInterfaces: [
      {
        name: "AMS-IX Amsterdam — ge-0/2/1 peer AS1299",
        pathChain: AMS_IX_PATH_CHAIN,
        baseLoad: toSeries(NOVA_TIMES, [44, 46, 45, 44, 46, 45, 44, 45, 46]),
        eventForecast: toSeries(NOVA_TIMES, [44, 46, 45, 48, 56, 61, 56, 49, 46]),
        predictedPeak: 112,
        overlappingEvents: [
          {
            eventId: "EVT-0091",
            eventName: "Nova Strike — S3 launch",
            window: "18:00–23:00 UTC",
            contribution: toSeries(NOVA_TIMES, [0, 3, 13, 30, 45, 51, 44, 20, 4]),
          },
        ],
        combinedForecast: toSeries(NOVA_TIMES, [44, 49, 58, 78, 101, 112, 100, 69, 50]),
      },
    ],
    rcaSummary:
      "EU Regional Cup Final is a live broadcast event sharing the AMS-IX Amsterdam peering interface with Nova " +
      "Strike S3 (EVT-0091) during an overlapping 20:00–22:00 UTC window. Neither event alone would breach " +
      "capacity on this interface, but the combined forecast does — this is a stacking risk, not a single-event one.",
    plannedChanges: [],
    similarEventIds: [],
    relatedAlarms: [],
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
    confidence: 81,
    source: "AI forecast",
    detectionSource: "Streaming schedule + social signals",
    historicOccurrences: "S1 +18 Gbps, S2 +22 Gbps on LINX path",
    weekStart: 2,
    weekSpan: 1,
    dayOffset: 5,
    affectedInterfaces: [
      singleInterface({
        name: "LINX London — ge-1/0/3 peer AS5413",
        pathChain: [
          { label: "StreamCDN-UK egress", detail: "cdn-uk-lon-02", type: "cdn" },
          { label: "LINX London", detail: "IXP · 200 Gbps", type: "ixp" },
          { label: "core-rtr-lon-01.dt.net", detail: "ge-1/0/3 · peer AS5413", type: "router" },
          { label: "EU-WEST-01", detail: "Region downstream", type: "region" },
        ],
        times: ["01:00", "02:00", "02:30", "03:00", "03:30", "04:00", "05:00"],
        base: [32, 31, 33, 32, 31, 32, 33],
        forecast: [32, 48, 62, 78, 71, 55, 38],
        predictedPeak: 78,
      }),
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
    confidence: 74,
    source: "Vendor advisory",
    detectionSource: "Vendor advisory + AI pattern match",
    historicOccurrences: "Prior OS rollout +14 Gbps on DE-CIX path",
    weekStart: 2,
    weekSpan: 2,
    dayOffset: 7,
    affectedInterfaces: [
      singleInterface({
        name: "DE-CIX Frankfurt — ge-0/0/2 peer AS3320",
        pathChain: [
          { label: "Update CDN DE egress", detail: "cdn-de-fra-03", type: "cdn" },
          { label: "DE-CIX Frankfurt", detail: "IXP · 400 Gbps", type: "ixp" },
          { label: "core-rtr-fra-02.dt.net", detail: "ge-0/0/2 · peer AS3320", type: "router" },
          { label: "EU-CENTRAL", detail: "Region downstream", type: "region" },
        ],
        times: ["Mon 00", "Mon 06", "Mon 12", "Mon 18", "Tue 00", "Tue 12", "Wed 00", "Wed 12"],
        base: [38, 39, 40, 38, 39, 40, 38, 39],
        forecast: [38, 44, 52, 62, 58, 51, 44, 39],
        predictedPeak: 62,
      }),
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
    confidence: 90,
    source: "Broadcast schedule + AI forecast",
    detectionSource: "Broadcast schedule + historic sport events",
    historicOccurrences: "CL QF +21 Gbps, CL SF +24 Gbps on DE-CIX path",
    weekStart: 1,
    weekSpan: 1,
    dayOffset: 0,
    affectedInterfaces: [
      singleInterface({
        name: "DE-CIX Frankfurt — ge-0/0/4 peer AS3320",
        pathChain: [
          { label: "SportsCDN-EU egress", detail: "cdn-eu-fra-04", type: "cdn" },
          { label: "DE-CIX Frankfurt", detail: "IXP · 400 Gbps", type: "ixp" },
          { label: "core-rtr-fra-02.dt.net", detail: "ge-0/0/4 · peer AS3320", type: "router" },
          { label: "EU-CORE-02", detail: "Region downstream", type: "region" },
        ],
        times: ["18:00", "19:00", "19:45", "20:30", "21:00", "21:30", "22:00", "22:30"],
        base: [38, 40, 39, 38, 40, 39, 38, 40],
        forecast: [41, 52, 61, 68, 64, 57, 48, 42],
        actual: [40, 54, 63, 71, 67, null, null, null],
        predictedPeak: 68,
        actualPeak: 71,
      }),
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
    confidence: 87,
    accuracy: 96,
    source: "AI forecast",
    detectionSource: "News/social signals + historic pattern",
    historicOccurrences: "S1 +34 Gbps on AMS-IX path",
    weekStart: 1,
    weekSpan: 1,
    dayOffset: -41,
    affectedInterfaces: [
      singleInterface({
        name: "AMS-IX Amsterdam — ge-0/2/1 peer AS1299",
        pathChain: [
          { label: "EdgeCDN-EU egress", detail: "edge-cdn-eu-fra-01", type: "cdn" },
          { label: "AMS-IX Amsterdam", detail: "IXP · 300 Gbps", type: "ixp" },
          { label: "core-rtr-fra-01.dt.net", detail: "ge-0/2/1 · peer AS1299", type: "router" },
          { label: "EU-CORE-01", detail: "Region downstream", type: "region" },
        ],
        times: NOVA_TIMES,
        base: [43, 45, 44, 43, 44, 43, 44, 45, 44],
        forecast: [43, 51, 64, 81, 92, 87, 68, 51, 44],
        actual: [43, 53, 69, 86, 95, 91, 72, 53, 44],
        predictedPeak: 92,
        actualPeak: 95,
      }),
    ],
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
    confidence: 79,
    accuracy: 91,
    source: "AI forecast",
    detectionSource: "Retailer announcement + historic commerce pattern",
    historicOccurrences: "Black Friday +16 Gbps, Prime Day +12 Gbps",
    weekStart: 1,
    weekSpan: 1,
    dayOffset: -46,
    affectedInterfaces: [
      singleInterface({
        name: "DE-CIX Frankfurt — ge-0/0/1 peer AS3320",
        pathChain: [
          { label: "CommerceCDN egress", detail: "cdn-de-fra-02", type: "cdn" },
          { label: "DE-CIX Frankfurt", detail: "IXP · 400 Gbps", type: "ixp" },
          { label: "core-rtr-fra-02.dt.net", detail: "ge-0/0/1 · peer AS3320", type: "router" },
          { label: "EU-CENTRAL", detail: "Region downstream", type: "region" },
        ],
        times: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
        base: [34, 35, 36, 34, 35, 36],
        forecast: [37, 48, 62, 70, 58, 38],
        actual: [35, 42, 55, 64, 53, 36],
        predictedPeak: 70,
        actualPeak: 64,
      }),
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
    confidence: 80,
    accuracy: 94,
    source: "AI forecast",
    detectionSource: "News/social signals + historic pattern",
    historicOccurrences: "First Nova Strike launch — no prior data available",
    weekStart: 1,
    weekSpan: 1,
    dayOffset: -158,
    affectedInterfaces: [
      singleInterface({
        name: "AMS-IX Amsterdam — ge-0/2/1 peer AS1299",
        pathChain: [
          { label: "EdgeCDN-EU egress", detail: "edge-cdn-eu-fra-01", type: "cdn" },
          { label: "AMS-IX Amsterdam", detail: "IXP · 300 Gbps", type: "ixp" },
          { label: "core-rtr-fra-01.dt.net", detail: "ge-0/2/1 · peer AS1299", type: "router" },
          { label: "EU-CORE-01", detail: "Region downstream", type: "region" },
        ],
        times: NOVA_TIMES,
        base: [40, 41, 40, 41, 40, 41, 40, 41, 40],
        forecast: [40, 46, 58, 78, 84, 76, 60, 47, 40],
        actual: [40, 48, 63, 84, 88, 80, 63, 48, 40],
        predictedPeak: 84,
        actualPeak: 88,
      }),
    ],
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
    confidence: 85,
    source: "Broadcast schedule + AI forecast",
    detectionSource: "Broadcast schedule + historic esports events",
    historicOccurrences: "Regional final +19 Gbps, World final +26 Gbps on LINX path",
    weekStart: 1,
    weekSpan: 1,
    dayOffset: 0,
    affectedInterfaces: [
      singleInterface({
        name: "LINX London — ge-1/0/4 peer AS5413",
        pathChain: [
          { label: "StreamCDN-UK egress", detail: "cdn-uk-lon-03", type: "cdn" },
          { label: "LINX London", detail: "IXP · 200 Gbps", type: "ixp" },
          { label: "core-rtr-lon-01.dt.net", detail: "ge-1/0/4 · peer AS5413", type: "router" },
          { label: "EU-WEST-01", detail: "Region downstream", type: "region" },
        ],
        times: ["18:00", "19:00", "20:00", "20:30", "21:00", "21:30", "22:00", "23:00"],
        base: [34, 36, 35, 34, 36, 35, 34, 36],
        forecast: [38, 50, 66, 82, 78, 63, 52, 40],
        actual: [37, 53, 71, 85, 80, null, null, null],
        predictedPeak: 82,
        actualPeak: 85,
      }),
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
    confidence: 91,
    accuracy: 97,
    source: "Change calendar",
    detectionSource: "Scheduled maintenance calendar",
    historicOccurrences: "Routine quarterly firmware update — low impact expected",
    weekStart: 1,
    weekSpan: 1,
    dayOffset: -31,
    affectedInterfaces: [
      singleInterface({
        name: "DE-CIX Frankfurt — ge-0/0/3 peer AS3320",
        pathChain: [
          { label: "Ops change window", detail: "scheduled-fw-update", type: "cdn" },
          { label: "DE-CIX Frankfurt", detail: "IXP · 400 Gbps", type: "ixp" },
          { label: "core-rtr-fra-03.dt.net", detail: "ge-0/0/3 · peer AS3320", type: "router" },
          { label: "EU-CENTRAL", detail: "Region downstream", type: "region" },
        ],
        times: ["01:00", "02:00", "03:00", "04:00", "05:00"],
        base: [22, 21, 22, 21, 22],
        forecast: [24, 30, 35, 27, 22],
        actual: [23, 28, 33, 25, 22],
        predictedPeak: 35,
        actualPeak: 33,
      }),
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
// event's own worst-interface data so the Assistant's first message is
// grounded in this specific event, not a generic template.

export function buildEventDiscussPrompt(event: EventFull): string {
  const iface = worstInterface(event);
  const ixpNode = iface.pathChain.find((p) => p.type === "ixp");
  const routerNode = iface.pathChain.find((p) => p.type === "router");
  const asMatch = routerNode?.detail.match(/AS\d+/)?.[0];
  const pathLabel = [asMatch, ixpNode?.label].filter(Boolean).join(" / ") || iface.name;
  const timeRange = event.window.includes(", ") ? event.window.split(", ")[1] : event.window;

  return (
    `Help me prepare for ${event.id} (${event.name}) — predicted ${eventPredictedPeak(event)}% peak on the ` +
    `${pathLabel} path during ${timeRange}. What should I prioritise?`
  );
}
