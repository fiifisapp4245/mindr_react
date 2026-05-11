import { agentLoads, healthData, recentIncidents } from "../data/dashboard";

export function useDashboard() {
  return { healthData, agentLoads, recentIncidents };
}
