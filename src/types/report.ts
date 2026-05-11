import type { LucideIcon } from "lucide-react";

export type TimeRange = "24h" | "7d" | "30d";
export type ReportStatus = "COMPLETED" | "ARCHIVED" | "PROCESSING";

export interface PerfTrendPoint {
  day: string;
  throughput: number;
  volume: number;
  latency: number;
}

export interface IncidentTrendPoint {
  day: string;
  critical: number;
  high: number;
  medium: number;
}

export interface GeneratedReport {
  name: string;
  type: string;
  date: string;
  status: ReportStatus;
  iconColor: string;
}

export interface AIInsight {
  icon: LucideIcon;
  iconColor: string;
  text: string;
}
