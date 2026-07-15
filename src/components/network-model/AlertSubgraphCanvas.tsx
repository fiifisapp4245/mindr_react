import { useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  BackgroundVariant,
  MarkerType,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Radio, Globe, Share2, MapPin, Shield } from "lucide-react";
import type { SubgraphNode, SubgraphEdge, SubgraphNodeStatus } from "../../data/alert-subgraph";

// ── Status / icon maps ────────────────────────────────────────────────────────

const STATUS_COLOR: Record<SubgraphNodeStatus, string> = {
  healthy: "#2DD4BF",
  warning: "#FFB020",
  critical: "#FF3B3B",
  core: "#4D9EFF",
};

const CHANGED_COLOR = "#E9187C"; // var(--color-brand) — visually distinguishes Proposed edits

function typeIcon(nodeType: string) {
  if (nodeType === "Router") return Radio;
  if (nodeType === "IXP") return Globe;
  if (nodeType === "Peer AS") return Share2;
  if (nodeType === "Region") return MapPin;
  return Shield; // Interface / Interface Group / Firewall / Load Balancer
}

// ── RF node data shape ─────────────────────────────────────────────────────────

interface RFNodeData extends Record<string, unknown> {
  label: string;
  nodeType: string;
  status: SubgraphNodeStatus;
  role: SubgraphNode["role"];
  changed: boolean;
}

type RFNode = Node<RFNodeData>;

const HANDLE_STYLE = { border: "none", width: 4, height: 4, background: "transparent" };

function CircleNode({ data, selected }: NodeProps) {
  const d = data as RFNodeData;
  const Icon = typeIcon(d.nodeType);
  const color = d.changed ? CHANGED_COLOR : STATUS_COLOR[d.status];
  const size = d.role === "primary" ? 64 : d.role === "secondary" ? 50 : 40;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 96 }}>
      <Handle type="target" position={Position.Top} style={HANDLE_STYLE} />
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: `${color}22`,
          border: `2px solid ${selected ? color : `${color}88`}`,
          boxShadow: selected ? `0 0 0 3px ${color}33` : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <Icon size={size * 0.4} style={{ color }} strokeWidth={2} />
      </div>
      <span
        style={{
          marginTop: 6,
          fontSize: 10,
          fontWeight: 600,
          color: "var(--color-text-primary)",
          textAlign: "center",
          lineHeight: 1.2,
          maxWidth: 96,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {d.label}
      </span>
      {d.changed && (
        <span style={{ fontSize: 8, fontWeight: 700, color: CHANGED_COLOR, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          changed
        </span>
      )}
      <Handle type="source" position={Position.Bottom} style={HANDLE_STYLE} />
    </div>
  );
}

const nodeTypes = { circle: CircleNode };

// ── Build RF nodes/edges from subgraph data ───────────────────────────────────

function toRfNodes(nodes: SubgraphNode[], changedNodeIds: Set<string>): RFNode[] {
  return nodes.map((n) => ({
    id: n.id,
    type: "circle",
    position: { x: n.x * 8, y: n.y * 6 },
    data: { label: n.label, nodeType: n.nodeType, status: n.status, role: n.role, changed: changedNodeIds.has(n.id) },
    draggable: true,
  }));
}

function toRfEdges(edges: SubgraphEdge[], changedEdgeIds: Set<string>): Edge[] {
  return edges.map((e) => {
    const color = changedEdgeIds.has(e.id) ? CHANGED_COLOR : "#5c5c7a";
    return {
      id: e.id,
      source: e.from,
      target: e.to,
      type: "smoothstep",
      style: { stroke: color, strokeWidth: 1.5 },
      markerEnd: e.direction !== "reverse" ? { type: MarkerType.ArrowClosed, color, width: 14, height: 14 } : undefined,
      markerStart: e.direction !== "forward" ? { type: MarkerType.ArrowClosed, color, width: 14, height: 14 } : undefined,
    };
  });
}

// ── Public component ──────────────────────────────────────────────────────────

interface Props {
  nodes: SubgraphNode[];
  edges: SubgraphEdge[];
  changedNodeIds?: Set<string>;
  changedEdgeIds?: Set<string>;
  onNodeClick?: (nodeId: string) => void;
}

function CanvasInner({ nodes, edges, changedNodeIds = new Set(), changedEdgeIds = new Set(), onNodeClick }: Props) {
  const rfNodes = useMemo(() => toRfNodes(nodes, changedNodeIds), [nodes, changedNodeIds]);
  const rfEdges = useMemo(() => toRfEdges(edges, changedEdgeIds), [edges, changedEdgeIds]);

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={nodeTypes}
      onNodeClick={(_, node) => onNodeClick?.(node.id)}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.4}
      maxZoom={2}
      style={{ backgroundColor: "var(--color-bg-base)" }}
      nodesConnectable={false}
      elementsSelectable
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={0.7} color="rgba(255,255,255,0.05)" />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

export function AlertSubgraphCanvas(props: Props) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <ReactFlowProvider>
        <CanvasInner {...props} />
      </ReactFlowProvider>
    </div>
  );
}
