import { AlertTriangle, Info, TrendingUp } from "lucide-react";
import type { AIInsight, GeneratedReport, IncidentTrendPoint, PerfTrendPoint } from "../types/report";

export const PERF_TREND: PerfTrendPoint[] = [
  { day: "MON", throughput: 2.8, volume: 240, latency: 42 },
  { day: "TUE", throughput: 3.1, volume: 270, latency: 45 },
  { day: "WED", throughput: 3.5, volume: 310, latency: 48 },
  { day: "THU", throughput: 4.2, volume: 380, latency: 52 },
  { day: "FRI", throughput: 3.8, volume: 340, latency: 47 },
  { day: "SAT", throughput: 3.0, volume: 260, latency: 41 },
  { day: "SUN", throughput: 2.6, volume: 220, latency: 38 },
];

export const INCIDENT_TREND: IncidentTrendPoint[] = [
  { day: "MON", critical: 1, high: 2, medium: 3 },
  { day: "TUE", critical: 2, high: 3, medium: 2 },
  { day: "WED", critical: 3, high: 4, medium: 2 },
  { day: "THU", critical: 5, high: 4, medium: 3 },
  { day: "FRI", critical: 2, high: 3, medium: 2 },
  { day: "SAT", critical: 2, high: 2, medium: 2 },
  { day: "SUN", critical: 1, high: 2, medium: 2 },
];

export const GENERATED_REPORTS: GeneratedReport[] = [
  { name: "Weekly Network Performance",   type: "PDF Report", date: "Oct 24, 2023", status: "COMPLETED",  iconColor: "#FF4444"                 },
  { name: "Monthly SLA Summary",          type: "CSV Export", date: "Oct 01, 2023", status: "COMPLETED",  iconColor: "var(--color-mitigating)" },
  { name: "Incident Audit Log",           type: "System Log", date: "Sep 28, 2023", status: "ARCHIVED",   iconColor: "var(--color-neutral)"    },
  { name: "Security Compliance Audit Q3", type: "PDF Report", date: "Sep 15, 2023", status: "COMPLETED",  iconColor: "#FF4444"                 },
];

export const AI_INSIGHTS: AIInsight[] = [
  {
    icon: TrendingUp,
    iconColor: "var(--color-resolved)",
    text: "System performance increased by **1.2%** compared to last week, primarily due to node optimization in US-East-1.",
  },
  {
    icon: AlertTriangle,
    iconColor: "var(--color-warning)",
    text: "Incident resolution time spiked during **Peak Tuesday** hours. Consider auto-scaling agent clusters.",
  },
  {
    icon: Info,
    iconColor: "var(--color-mitigating)",
    text: "No critical outages detected in the last **168 hours**. The network is stable.",
  },
];
