import type { LucideIcon } from "lucide-react";

export type IncidentStatus = "active" | "predicted" | "mitigating";
export type Severity = "critical" | "high" | "medium" | "low";
export type StageStatus = "completed" | "active" | "pending";
export type MetricSeverity = "critical" | "warning" | "info";
export type LogType = "CRIT" | "AI" | "WARN" | "INFO";

export interface TimelineStage {
  label: string;
  time?: string;
  status: StageStatus;
  sub?: string;
}

export interface LiveMetric {
  label: string;
  value: string;
  unit: string;
  sub: string;
  severity: MetricSeverity;
  icon: LucideIcon;
}

export interface LogEntry {
  time: string;
  type: LogType;
  message: string;
}

export interface Incident {
  id: string;
  ref: string;
  title: string;
  status: IncidentStatus;
  severity: Severity;
  age: string;
  region: string;
  affectedUsers: string;
  duration: string;
  timeline: TimelineStage[];
  metrics: LiveMetric[];
  insights: { confidence: number; text: string; highlights: string[] };
  logs: LogEntry[];
}
