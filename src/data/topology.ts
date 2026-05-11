import type { TimelineEvent, TopologyEdge, TopologyNode } from "../types/topology";

export const NODES: TopologyNode[] = [
  {
    id: "orch-primary",
    label: "ORCH-PRIMARY",
    type: "router",
    status: "healthy",
    layer: "orchestration",
    x: 50, y: 16,
    metrics: { cpu: 42, memory: 38, latency: 8, uptime: "312d" },
  },
  {
    id: "eu-core-01",
    label: "EU-CORE-01",
    type: "router",
    status: "healthy",
    layer: "core",
    x: 50, y: 40,
    incident: { count: 1, title: "Core Network Overload - EU-West", id: "INC-8422" },
    metrics: { cpu: 68, memory: 74, latency: 32, uptime: "124d" },
  },
  {
    id: "dc-alpha",
    label: "DC-ALPHA",
    type: "datacenter",
    status: "healthy",
    layer: "transport",
    x: 22, y: 62,
    metrics: { cpu: 31, memory: 45, latency: 11, uptime: "87d" },
  },
  {
    id: "edge-nyc-02",
    label: "EDGE-NYC-02",
    type: "edge",
    status: "warning",
    layer: "transport",
    x: 78, y: 62,
    metrics: { cpu: 78, memory: 82, latency: 64, uptime: "42d" },
  },
  {
    id: "cdn-west",
    label: "CDN-WEST",
    type: "cdn",
    status: "healthy",
    layer: "edge",
    x: 22, y: 84,
    metrics: { cpu: 24, memory: 30, latency: 6, uptime: "201d" },
  },
  {
    id: "latam-down",
    label: "LATAM-DOWN",
    type: "router",
    status: "down",
    layer: "edge",
    x: 78, y: 84,
    incident: { count: 1, title: "LATAM Link Failure — Node offline", id: "INC-8421" },
  },
];

export const EDGES: TopologyEdge[] = [
  { from: "orch-primary",  to: "eu-core-01",  status: "healthy" },
  { from: "eu-core-01",    to: "dc-alpha",     status: "healthy" },
  { from: "eu-core-01",    to: "edge-nyc-02",  status: "healthy" },
  { from: "eu-core-01",    to: "cdn-west",     status: "healthy" },
  { from: "eu-core-01",    to: "latam-down",   status: "down"    },
  { from: "dc-alpha",      to: "cdn-west",     status: "healthy" },
];

export const TIMELINE_EVENTS: TimelineEvent[] = [
  { t: "14:02", pct: 8,  type: "critical", label: "Anomaly detected: EU-CORE-01 latency spike" },
  { t: "14:05", pct: 24, type: "info",     label: "Analysis agent deployed to EU-WEST-01"       },
  { t: "14:10", pct: 48, type: "warning",  label: "Traffic volume exceeded 400% threshold"       },
  { t: "14:12", pct: 63, type: "ai",       label: "Root cause localized to GW-10.0.42.1"         },
  { t: "14:14", pct: 75, type: "critical", label: "Cluster CR-04 memory exhaustion"              },
];

export const CURRENT_EVENT_PCT = 75;
