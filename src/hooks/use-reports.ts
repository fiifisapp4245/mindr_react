import { AI_INSIGHTS, GENERATED_REPORTS, INCIDENT_TREND, PERF_TREND } from "../data/reports";

export function useReports() {
  return { perfTrend: PERF_TREND, incidentTrend: INCIDENT_TREND, generatedReports: GENERATED_REPORTS, aiInsights: AI_INSIGHTS };
}
