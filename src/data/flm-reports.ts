// ── FLM Shift Report data ──────────────────────────────────────────────────────
// Backs the IP Peering "Shift Report" page (src/pages/FLMReports.tsx, /flm-reports).

export type ShiftIncidentStatus   = "Resolved" | "Escalated";
export type ShiftIncidentSeverity = "Critical" | "High" | "Medium";

export interface ShiftIncident {
  id: string;
  ref: string;
  title: string;
  region: string;
  affected: string;
  status: ShiftIncidentStatus;
  severity: ShiftIncidentSeverity;
  resolvedAt: string;   // "HH:MM" time-of-day within the shift window, for filtering/sorting
  duration: string;
  summary: string;
  rootCause: string;
  linkedAlarms: string[];
  actionsTaken: string[];
}

export const SHIFT_WINDOW = {
  label: "Shift B handover summary — IP Peering · 2026-06-04 06:00–14:00 UTC",
  start: "06:00",
  end:   "14:00",
};

export const SHIFT_INCIDENTS: ShiftIncident[] = [
  {
    id: "1", ref: "#INC-4921", title: "Core Network Overload – EU-West",
    region: "EU-WEST-01 (Frankfurt)", affected: "EU-WEST-01 → LINX",
    status: "Resolved", severity: "Critical", resolvedAt: "06:41", duration: "14m",
    summary: "Sustained ingress overload on the EU-WEST-01 core link to LINX London driven by a transit reroute from an upstream peer. Utilisation peaked at 96% before capacity was rebalanced.",
    rootCause: "Upstream transit reroute increased ingress beyond provisioned capacity on the LINX secondary path.",
    linkedAlarms: ["ALM-1042", "ALM-1043"],
    actionsTaken: ["Rebalanced handover across LINX + DE-CIX secondary paths", "Notified transit partner of sustained overload", "Confirmed utilisation back under 80% before closing"],
  },
  {
    id: "2", ref: "#INC-4925", title: "5G Slice SLA Breach Risk",
    region: "EU-Central (Berlin)", affected: "AS5413 peer DE-CIX",
    status: "Resolved", severity: "Critical", resolvedAt: "07:14", duration: "5m",
    summary: "A 5G network slice serving EU-Central approached its latency SLA threshold due to a brief congestion spike on the AS5413 peering link.",
    rootCause: "Short-lived congestion spike on AS5413 peering session coinciding with a scheduled maintenance window.",
    linkedAlarms: ["ALM-1051"],
    actionsTaken: ["Shifted slice traffic to secondary peer", "Confirmed SLA compliance restored within 5 minutes"],
  },
  {
    id: "3", ref: "#INC-4918", title: "CDN Cache Miss Rate Spike",
    region: "Global CDN", affected: "EU-CORE-02 → AS1299",
    status: "Resolved", severity: "Critical", resolvedAt: "07:52", duration: "42m",
    summary: "Cache miss rate on the Global CDN tier spiked well above baseline, increasing origin-fetch load on EU-CORE-02 toward AS1299.",
    rootCause: "CDN edge node pool degraded after a routine cache-purge job ran outside its expected window.",
    linkedAlarms: ["ALM-1039", "ALM-1040", "ALM-1041"],
    actionsTaken: ["Paused the offending cache-purge job", "Warmed cache on affected edge nodes", "Monitored miss rate back to baseline before closing"],
  },
  {
    id: "4", ref: "#INC-4930", title: "5G NR Core Slice Failure – APAC-south",
    region: "APAC-SOUTH (Singapore)", affected: "AMS-IX transit",
    status: "Resolved", severity: "High", resolvedAt: "08:31", duration: "12m",
    summary: "A 5G NR core slice serving APAC-South failed over after a transit session flap on the AMS-IX path.",
    rootCause: "Brief BGP session flap on the AMS-IX transit link triggered an automatic slice failover.",
    linkedAlarms: ["ALM-1058"],
    actionsTaken: ["Confirmed automatic failover completed cleanly", "Restored primary transit session", "Failed slice back to primary path"],
  },
  {
    id: "5", ref: "#INC-4927", title: "BGP Session Collapse – US-East-1 Peering",
    region: "US-EAST-1 (Virginia)", affected: "AS6762 → Telecom Italia",
    status: "Escalated", severity: "Critical", resolvedAt: "09:22", duration: "6m",
    summary: "The BGP peering session with AS6762 (Telecom Italia) collapsed unexpectedly, dropping all routes learned via that peer.",
    rootCause: "Under investigation — Telecom Italia NOC reports a router process restart on their side; awaiting confirmation.",
    linkedAlarms: ["ALM-1063", "ALM-1064"],
    actionsTaken: ["Rerouted affected prefixes via backup transit", "Opened a coordination bridge with Telecom Italia NOC", "Escalated to IP Peering Ops — session still not re-established at shift end"],
  },
  {
    id: "6", ref: "#INC-4933", title: "Storage Node Capacity Breach – EU-Central",
    region: "EU-CENTRAL (Frankfurt)", affected: "AS3215 France Telecom",
    status: "Resolved", severity: "Medium", resolvedAt: "10:05", duration: "20m",
    summary: "A storage node supporting EU-Central logging exceeded its capacity threshold, risking dropped telemetry from the AS3215 peering path.",
    rootCause: "Log retention job had not rotated old telemetry data, filling the node beyond its 85% threshold.",
    linkedAlarms: ["ALM-1071"],
    actionsTaken: ["Triggered manual log rotation", "Freed 22% capacity on the affected node", "Adjusted retention job schedule to prevent recurrence"],
  },
  {
    id: "7", ref: "#INC-4935", title: "Backhaul Link Saturation Forecast – LATAM-02",
    region: "LATAM-02 (Sao Paulo)", affected: "EU-CENTRAL-A2",
    status: "Escalated", severity: "High", resolvedAt: "11:38", duration: "8m",
    summary: "Forecast modelling flagged a projected backhaul saturation on the LATAM-02 to EU-CENTRAL-A2 link within the next few hours.",
    rootCause: "Organic traffic growth trending above the provisioned backhaul capacity for this route.",
    linkedAlarms: ["ALM-1078"],
    actionsTaken: ["Flagged to capacity planning for expedited build-out", "Pre-positioned 15% of traffic onto an alternate route", "Escalated — build-out request still pending vendor confirmation"],
  },
  {
    id: "8", ref: "#INC-4920", title: "DNS Resolution Latency – Global CDN Tier",
    region: "Global CDN", affected: "AS3215 France Telecom",
    status: "Resolved", severity: "Medium", resolvedAt: "12:47", duration: "16m",
    summary: "DNS resolution latency on the Global CDN tier rose above the 50ms target, affecting a subset of resolvers routed via AS3215.",
    rootCause: "One of three anycast DNS resolver nodes was operating in a degraded state after a routine restart.",
    linkedAlarms: ["ALM-1084"],
    actionsTaken: ["Pulled the degraded resolver node from rotation", "Confirmed latency back under target on remaining nodes", "Restarted the affected node cleanly and returned it to rotation"],
  },
  {
    id: "9", ref: "#INC-4919", title: "Core Network Overload – EU-East",
    region: "EU-EAST-01 (Frankfurt)", affected: "EU-CENTRAL-A2",
    status: "Escalated", severity: "Critical", resolvedAt: "13:32", duration: "58m",
    summary: "A second, longer-running overload event on EU-EAST-01 developed toward the end of the shift, compounding the earlier LATAM-02 backhaul forecast.",
    rootCause: "Combined effect of the LATAM-02 traffic pre-positioning (INC-4935) and an unrelated organic peak pushed EU-EAST-01 past capacity.",
    linkedAlarms: ["ALM-1091", "ALM-1092", "ALM-1093"],
    actionsTaken: ["Reverted the LATAM-02 traffic pre-positioning", "Requested emergency capacity review for EU-EAST-01", "Escalated to next shift with full context — not fully resolved at handover"],
  },
];
