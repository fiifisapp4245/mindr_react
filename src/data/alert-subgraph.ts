import type { Alert } from "./alert-store";

// ── Alert-scoped knowledge-graph subgraph ─────────────────────────────────────
// Mocked locally for the prototype — derived entirely from the alert's own
// fields (router/ixp/AS/ports) so it never drifts from the alert it scopes to.
//
// BACKEND INTEGRATION (confirm with the KG team later): how FLM edits made here
// reach the real knowledge graph — a direct graph-mutation API vs. translating
// each edit into a chat/assistant command — is unresolved and does NOT block
// building these screens against this local mock.

export type SubgraphNodeRole = "primary" | "secondary" | "edge";
export type SubgraphNodeStatus = "healthy" | "warning" | "critical" | "core";
export type ConnectionDirection = "bidirectional" | "forward" | "reverse";

export interface SubgraphNode {
  id: string;
  label: string;
  nodeType: string;
  description: string;
  role: SubgraphNodeRole;
  status: SubgraphNodeStatus;
  x: number; // 0-100 layout position
  y: number; // 0-100 layout position
}

export interface SubgraphEdge {
  id: string;
  from: string;
  to: string;
  direction: ConnectionDirection;
}

export interface AlertSubgraph {
  alertId: string;
  nodes: SubgraphNode[];
  edges: SubgraphEdge[];
}

// Dropdown options for the Add/Edit Node "Type" field.
export const COMPONENT_TYPES = [
  "Router",
  "IXP",
  "Peer AS",
  "Region",
  "Interface",
  "Firewall",
  "Load Balancer",
] as const;

const ROLE_LABEL: Record<SubgraphNodeRole, string> = {
  primary: "Primary",
  secondary: "Secondary",
  edge: "Edge",
};

export function roleLabel(role: SubgraphNodeRole): string {
  return ROLE_LABEL[role];
}

function severityToStatus(severity: Alert["severity"]): SubgraphNodeStatus {
  if (severity === "critical") return "critical";
  if (severity === "high") return "warning";
  return "healthy";
}

// Builds the alert's subgraph — the triggering router, its IXP, the peer AS
// driving the traffic, the downstream region, and (if the alert has any)
// the congested interfaces on that router — all derived from the alert's own
// `sources`/`affectedAS`/`region` fields, never hand-mocked separately.
export function buildAlertSubgraph(alert: Alert): AlertSubgraph {
  const routerId = "router";
  const ixpId = "ixp";
  const asId = "as-peer";
  const regionId = "region";

  const nodes: SubgraphNode[] = [
    {
      id: routerId,
      label: alert.sources.anodot.router,
      nodeType: "Router",
      description:
        `Primary router handling this alert's traffic — ${alert.severity} severity, ` +
        `${alert.sources.snmp.ports[0].utilization}% utilisation on ${alert.sources.snmp.ports[0].port}.`,
      role: "primary",
      status: severityToStatus(alert.severity),
      x: 50,
      y: 38,
    },
    {
      id: ixpId,
      label: alert.sources.anodot.ixp,
      nodeType: "IXP",
      description: `Internet exchange point carrying this alert's handover traffic.`,
      role: "secondary",
      status: "core",
      x: 50,
      y: 10,
    },
    {
      id: asId,
      label: alert.affectedAS,
      nodeType: "Peer AS",
      description: `Peer autonomous system driving this alert's traffic pattern.`,
      role: "secondary",
      status: "warning",
      x: 84,
      y: 24,
    },
    {
      id: regionId,
      label: alert.region,
      nodeType: "Region",
      description: `Downstream region affected by this alert.`,
      role: "edge",
      status: "healthy",
      x: 16,
      y: 24,
    },
  ];

  const edges: SubgraphEdge[] = [
    { id: `${ixpId}--${routerId}`, from: ixpId, to: routerId, direction: "bidirectional" },
    { id: `${routerId}--${asId}`, from: routerId, to: asId, direction: "forward" },
    { id: `${regionId}--${routerId}`, from: regionId, to: routerId, direction: "reverse" },
  ];

  // Some alerts' borderPlanner.ports reference the network-wide congested-port
  // list rather than just this router's ports — filter to this router only so
  // every interface shown under the hub genuinely belongs to it.
  const ports = alert.sources.borderPlanner.ports.filter((p) => p.port.startsWith(alert.sources.anodot.router));
  if (ports.length > 0) {
    const hubId = "iface-hub";
    nodes.push({
      id: hubId,
      label: "Congested Interfaces",
      nodeType: "Interface Group",
      description: `Interfaces on ${alert.sources.anodot.router} flagged by Border Planner for this alert.`,
      role: "secondary",
      status: "warning",
      x: 50,
      y: 68,
    });
    edges.push({ id: `${routerId}--${hubId}`, from: routerId, to: hubId, direction: "forward" });

    const shown = ports.slice(0, 3);
    const spread = shown.length > 1 ? 44 / (shown.length - 1) : 0;
    shown.forEach((port, i) => {
      const portId = `iface-${i}`;
      nodes.push({
        id: portId,
        label: port.port.split(" ")[1] ?? port.port,
        nodeType: "Interface",
        description: `${port.port} — ${port.ingressUtil}% utilisation, transit ${port.transitAS}, build-out flag ${port.flag}.`,
        role: "edge",
        status: port.flag === "CRITICAL" ? "critical" : port.flag === "SOON" ? "warning" : "healthy",
        x: shown.length > 1 ? 28 + i * spread : 50,
        y: 92,
      });
      edges.push({ id: `${hubId}--${portId}`, from: hubId, to: portId, direction: "forward" });
    });
  }

  return { alertId: alert.id, nodes, edges };
}
