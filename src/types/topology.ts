export type NodeStatus   = "healthy" | "warning" | "down";
export type NodeType     = "router" | "datacenter" | "edge" | "cdn";
export type EdgeStatus   = "healthy" | "down";
export type NodeFilter   = "all" | "router" | "edge" | "datacenter" | "cdn";
export type NetworkLayer = "orchestration" | "core" | "transport" | "edge";
export type ViewMode     = "scope" | "replay" | "present";

export interface TopologyNode {
  id: string;
  label: string;
  type: NodeType;
  status: NodeStatus;
  layer: NetworkLayer;
  x: number;
  y: number;
  incident?: { count: number; title: string; id: string };
  metrics?: { cpu: number; memory: number; latency: number; uptime: string };
}

export interface TopologyEdge {
  from: string;
  to: string;
  status: EdgeStatus;
}

export interface TimelineEvent {
  t: string;
  pct: number;
  type: "critical" | "warning" | "ai" | "info";
  label: string;
}
