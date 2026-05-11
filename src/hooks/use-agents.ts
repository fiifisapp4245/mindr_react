import { AGENTS, PERF_DATA } from "../data/agents";

export function useAgents() {
  return { agents: AGENTS, perfData: PERF_DATA };
}
