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
  },
];
