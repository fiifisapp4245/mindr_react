import type { LucideIcon } from "lucide-react";

export type AgentStatus = "active" | "idle";
export type TagColor = "brand" | "info" | "muted";

export interface Agent {
  id: string;
  name: string;
  layer: string;
  status: AgentStatus;
  tasks: number | null;
  confidence: string;
  latency: string;
  tag: { label: string; icon: LucideIcon; color: TagColor };
}

export interface PerfDataPoint {
  t: string;
  ms: number;
}
