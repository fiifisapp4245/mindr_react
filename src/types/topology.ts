// ── S1 network topology types ─────────────────────────────────────────────────

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

// ── Scenario 2 geographic topology map types ──────────────────────────────────

export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'APPROVED';
export type MapFilter      = 'all' | 'critical' | 'degraded' | 'healthy';

export interface TopoIncident {
  id:          string;
  description: string;
  cxiDrop:     number;
  status:      IncidentStatus;
}

export interface TopoCluster {
  id:        string;
  name:      string;
  cxi:       number;
  incidents: TopoIncident[];
}

export interface TopoCell {
  id:                 string;
  name:               string;
  cxi:                number;
  clusters:           TopoCluster[];
  hasActiveIncident:  boolean;
}

export interface TopoSite {
  id:                string;
  name:              string;
  lat:               number;
  lng:               number;
  cxi:               number;
  cells:             TopoCell[];
  hasActiveIncident: boolean;
}

export interface TopoRegion {
  id:                string;
  name:              string;
  lat:               number;
  lng:               number;
  cxi:               number;
  sites:             TopoSite[];
  hasActiveIncident: boolean;
}

export function getCXIColor(cxi: number): string {
  if (cxi >= 4.0) return '#22c55e';
  if (cxi >= 3.0) return '#f59e0b';
  return '#ef4444';
}

export function getCXIStatus(cxi: number): 'Healthy' | 'Degraded' | 'Critical' {
  if (cxi >= 4.0) return 'Healthy';
  if (cxi >= 3.0) return 'Degraded';
  return 'Critical';
}

export function getCXIMessage(cxi: number): string {
  if (cxi >= 4.0) return 'Above target — no action required';
  if (cxi >= 3.0) return 'Monitor closely — approaching threshold';
  return 'Action required — CXI below minimum';
}
