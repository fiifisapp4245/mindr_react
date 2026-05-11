export type Range = "1H" | "6H" | "24H" | "7D";
export type IncidentSeverity = "CRITICAL" | "PREDICTED" | "MITIGATING";

export interface HealthDataPoint {
  t: string;
  health: number;
  target: number;
}

export interface AgentLoad {
  name: string;
  load: number;
}

export interface DashboardIncident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  description: string;
  age: string;
}
