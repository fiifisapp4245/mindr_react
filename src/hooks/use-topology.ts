import { EDGES, NODES } from "../data/topology";

export function useTopology() {
  return { nodes: NODES, edges: EDGES };
}
