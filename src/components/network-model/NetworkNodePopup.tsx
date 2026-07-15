import { ArrowRight, ArrowLeftRight, Trash2 } from "lucide-react";
import { DetailModal } from "../shared/DetailModal";
import { Badge } from "../ui/badge";
import { roleLabel, type SubgraphNode, type SubgraphEdge } from "../../data/alert-subgraph";

const ROLE_COLOR = { primary: "#E9187C", secondary: "#4D9EFF", edge: "var(--color-text-muted)" } as const;

interface ConnectedEntry {
  edgeId: string;
  other: SubgraphNode;
  directionLabel: string;
}

function connectedEntries(node: SubgraphNode, edges: SubgraphEdge[], allNodes: SubgraphNode[]): ConnectedEntry[] {
  return edges
    .filter((e) => e.from === node.id || e.to === node.id)
    .map((e) => {
      const otherId = e.from === node.id ? e.to : e.from;
      const other = allNodes.find((n) => n.id === otherId);
      if (!other) return null;
      let directionLabel: string;
      if (e.direction === "bidirectional") directionLabel = "↔ bidirectional";
      else if (e.from === node.id) directionLabel = e.direction === "forward" ? "→ outbound" : "← inbound";
      else directionLabel = e.direction === "forward" ? "← inbound" : "→ outbound";
      return { edgeId: e.id, other, directionLabel };
    })
    .filter((x): x is ConnectedEntry => x !== null);
}

interface Props {
  node: SubgraphNode;
  edges: SubgraphEdge[];
  allNodes: SubgraphNode[];
  onClose: () => void;
  onEditNode: () => void;
  onAddNode: () => void;
  onDeleteConnection: (edgeId: string) => void;
}

export function NetworkNodePopup({ node, edges, allNodes, onClose, onEditNode, onAddNode, onDeleteConnection }: Props) {
  const connections = connectedEntries(node, edges, allNodes);

  return (
    <DetailModal title="Network Node" onClose={onClose} maxWidth={440}>
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <Badge className="text-[9px] font-bold uppercase" style={{ color: ROLE_COLOR[node.role], backgroundColor: `${ROLE_COLOR[node.role]}22` }}>
          {roleLabel(node.role)}
        </Badge>
        <span className="text-[10px] font-mono" style={{ color: "var(--color-text-muted)" }}>{node.nodeType}</span>
        <span className="text-[9px] font-mono ml-auto" style={{ color: "var(--color-text-muted)" }}>#{node.id}</span>
      </div>

      <p className="text-sm font-bold mb-1.5" style={{ color: "var(--color-text-primary)" }}>{node.label}</p>
      <p className="text-[12px] leading-relaxed mb-4" style={{ color: "var(--color-text-muted)" }}>{node.description}</p>

      <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>
        Connected nodes ({connections.length})
      </p>
      <div className="space-y-1.5 mb-4">
        {connections.length === 0 ? (
          <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>No connections.</p>
        ) : (
          connections.map(({ edgeId, other, directionLabel }) => (
            <div
              key={edgeId}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)" }}
            >
              {directionLabel.includes("↔") ? (
                <ArrowLeftRight size={11} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
              ) : (
                <ArrowRight size={11} style={{ color: "var(--color-text-muted)", flexShrink: 0, transform: directionLabel.startsWith("←") ? "scaleX(-1)" : undefined }} />
              )}
              <span className="text-[11px] font-medium flex-1 min-w-0 truncate" style={{ color: "var(--color-text-primary)" }}>{other.label}</span>
              <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>{directionLabel.replace(/^[↔←→]\s*/, "")}</span>
              <button
                onClick={() => onDeleteConnection(edgeId)}
                aria-label={`Remove connection to ${other.label}`}
                className="p-1 rounded hover:bg-white/5 transition-colors shrink-0"
                style={{ color: "#FF3B3B" }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEditNode}
          className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors hover:bg-white/5"
          style={{ border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
        >
          Edit Node
        </button>
        <button
          onClick={onAddNode}
          className="flex-1 py-2 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
        >
          Add Node
        </button>
      </div>
    </DetailModal>
  );
}
