import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Send as SendIcon } from "lucide-react";
import { ALERTS, type Alert } from "../../data/alert-store";
import { buildAlertSubgraph, type SubgraphNode, type SubgraphEdge } from "../../data/alert-subgraph";
import { AlertSubgraphCanvas } from "./AlertSubgraphCanvas";
import { NetworkNodePopup } from "./NetworkNodePopup";
import { NodeFormModal, type NodeFormValues } from "./NodeFormModal";
import { Toast, TOAST_DURATION_MS } from "../shared/Toast";
import { Badge } from "../ui/badge";

// ── Audit trail ────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: string;
  title: string;
  body: string;
  timestamp: string;
}

function seedAuditTrail(alert: Alert, nodeCount: number, edgeCount: number): AuditEntry[] {
  return [
    {
      id: "seed-1",
      title: "AI Analysis initiated",
      body: alert.predict.narrative.length > 160 ? `${alert.predict.narrative.slice(0, 160)}…` : alert.predict.narrative,
      timestamp: alert.raised,
    },
    {
      id: "seed-2",
      title: "Subgraph loaded",
      body: `Loaded ${nodeCount} nodes and ${edgeCount} connections from this alert's scope.`,
      timestamp: alert.raised,
    },
    {
      id: "seed-3",
      title: "Awaiting FLM review",
      body: "Propose topology changes below, then send them to the CDN for review.",
      timestamp: alert.raised,
    },
  ];
}

// Mocked action: in the real system this submits the proposed topology change
// to the CDN's review queue (via CASM or an equivalent change-management
// integration). No real message is dispatched here — this only simulates the
// send so the propose → pending flow is wired end-to-end ahead of the real
// integration. The demo intentionally stops at "Pending"; there is no
// simulated CDN confirmation/apply step in this prototype.
function mockSendProposal(_alert: Alert, _nodes: SubgraphNode[], _edges: SubgraphEdge[]): void {
  // no-op
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ── Left panel ────────────────────────────────────────────────────────────────

function AuditTrailItem({ entry, index, isLast }: { entry: AuditEntry; index: number; isLast: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center shrink-0">
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
          style={{ border: "1px solid var(--color-brand)", color: "var(--color-brand)" }}
        >
          {index + 1}
        </span>
        {!isLast && <span className="flex-1 w-px mt-1" style={{ backgroundColor: "var(--color-border)", minHeight: 24 }} />}
      </div>
      <div className="rounded-xl p-3 mb-3 flex-1 min-w-0" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <p className="text-[12px] font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>{entry.title}</p>
        <p className="text-[11px] leading-snug mb-1.5" style={{ color: "var(--color-text-muted)" }}>{entry.body}</p>
        <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{entry.timestamp}</p>
      </div>
    </div>
  );
}

function LeftPanel({
  alert,
  auditTrail,
  comment,
  onCommentChange,
  onAddComment,
  onCancel,
  onSend,
  proposalSent,
}: {
  alert: Alert;
  auditTrail: AuditEntry[];
  comment: string;
  onCommentChange: (v: string) => void;
  onAddComment: () => void;
  onCancel: () => void;
  onSend: () => void;
  proposalSent: boolean;
}) {
  return (
    <div
      className="shrink-0 flex flex-col min-h-0"
      style={{ width: 320, borderRight: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-base)" }}
    >
      {/* Alert Details (static) */}
      <div className="shrink-0 px-4 pt-4">
        <div className="flex items-center gap-1.5 mb-3">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#2DD4BF" }} />
          <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>Alert Details</p>
        </div>
        <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-sm font-bold font-mono" style={{ color: "var(--color-text-primary)" }}>#{alert.id}</span>
            <Badge className="text-[9px] font-bold uppercase" style={{ color: "#FFB020", backgroundColor: "rgba(255,176,32,0.12)" }}>
              {proposalSent ? "Pending" : "Draft"}
            </Badge>
          </div>
          <p className="text-[11px] leading-snug mb-1.5" style={{ color: "var(--color-text-muted)" }}>{alert.title}</p>
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Raised {alert.raised}</p>
        </div>
      </div>

      {/* Audit Trails (the only scrollable region) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4">
        <p className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>Audit Trails</p>
        <div className="mb-2">
          {auditTrail.map((entry, i) => (
            <AuditTrailItem key={entry.id} entry={entry} index={i} isLast={i === auditTrail.length - 1} />
          ))}
        </div>
      </div>

      {/* Add Comment + CTAs (static) */}
      <div className="shrink-0 px-4 pb-4 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
        <p className="text-sm font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>Add Comment</p>
        <textarea
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="Enter your comment here..."
          rows={4}
          className="w-full rounded-lg px-3 py-2 text-xs mb-3 resize-none"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", outline: "none" }}
        />
        <button
          onClick={onAddComment}
          disabled={!comment.trim()}
          className="w-full py-2.5 rounded-lg text-xs font-bold mb-3 transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
        >
          Add Comment
        </button>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg text-xs font-semibold transition-colors hover:bg-white/5"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          >
            Cancel
          </button>
          <button
            onClick={onSend}
            disabled={proposalSent}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#2DD4BF", color: "#0A0A0F" }}
          >
            <SendIcon size={12} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function AlertProposalGraph({ alertId }: { alertId: string }) {
  const navigate = useNavigate();
  const alert = ALERTS.find((a) => a.id === alertId);

  return alert ? <AlertProposalGraphInner alert={alert} /> : <NotFound />;

  function NotFound() {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertTriangle size={28} style={{ color: "var(--color-critical)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Alert not found</p>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>No alert with ID "{alertId}" exists in this session.</p>
        <button onClick={() => navigate("/alerts")} className="text-xs font-medium hover:opacity-80" style={{ color: "var(--color-brand)" }}>
          ← Back to Alerts
        </button>
      </div>
    );
  }
}

function AlertProposalGraphInner({ alert }: { alert: Alert }) {
  const navigate = useNavigate();
  const baseline = useMemo(() => buildAlertSubgraph(alert), [alert.id]);

  const [nodes, setNodes] = useState<SubgraphNode[]>(baseline.nodes);
  const [edges, setEdges] = useState<SubgraphEdge[]>(baseline.edges);
  const [newNodeIds, setNewNodeIds] = useState<Set<string>>(new Set());
  const [editedNodeIds, setEditedNodeIds] = useState<Set<string>>(new Set());
  const [editCount, setEditCount] = useState(0);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);

  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>(() => seedAuditTrail(alert, baseline.nodes.length, baseline.edges.length));
  const [comment, setComment] = useState("");
  const [proposalSent, setProposalSent] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const hasEdits = editCount > 0;
  const changedNodeIds = useMemo(() => new Set([...newNodeIds, ...editedNodeIds]), [newNodeIds, editedNodeIds]);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  function appendAudit(title: string, body: string) {
    setAuditTrail((prev) => [...prev, { id: `entry-${prev.length}`, title, body, timestamp: "Just now" }]);
  }

  function handleAddComment() {
    if (!comment.trim()) return;
    appendAudit("FLM comment", comment.trim());
    setComment("");
  }

  function handleDeleteConnection(edgeId: string) {
    const edge = edges.find((e) => e.id === edgeId);
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
    setEditCount((c) => c + 1);
    if (edge) {
      const fromLabel = nodes.find((n) => n.id === edge.from)?.label ?? edge.from;
      const toLabel = nodes.find((n) => n.id === edge.to)?.label ?? edge.to;
      appendAudit("Connection removed", `Removed connection between ${fromLabel} and ${toLabel}.`);
    }
  }

  function handleAddNodeSubmit(values: NodeFormValues) {
    const anchor = nodes.find((n) => n.id === selectedNodeId);
    const newId = `custom-${nodes.length}-${Date.now()}`;
    const newNode: SubgraphNode = {
      id: newId,
      label: values.name,
      nodeType: values.nodeType,
      description: values.description || `${values.nodeType} added as part of this proposal.`,
      role: "edge",
      status: "healthy",
      x: anchor ? clamp(anchor.x + 12, 5, 95) : 50,
      y: anchor ? clamp(anchor.y + 14, 5, 95) : 50,
    };
    setNodes((prev) => [...prev, newNode]);
    if (anchor) {
      setEdges((prev) => [...prev, { id: `${anchor.id}--${newId}`, from: anchor.id, to: newId, direction: "forward" }]);
    }
    setNewNodeIds((prev) => new Set(prev).add(newId));
    setEditCount((c) => c + 1);
    appendAudit("Node added", `Added "${values.name}" (${values.nodeType}) to the proposed graph.`);
    setFormMode(null);
    setSelectedNodeId(null);
  }

  function handleEditNodeSubmit(values: NodeFormValues) {
    if (!selectedNodeId) return;
    setNodes((prev) => prev.map((n) => (n.id === selectedNodeId ? { ...n, label: values.name, nodeType: values.nodeType, description: values.description } : n)));
    setEditedNodeIds((prev) => new Set(prev).add(selectedNodeId));
    setEditCount((c) => c + 1);
    appendAudit("Node edited", `Updated "${values.name}" in the proposed graph.`);
    setFormMode(null);
    setSelectedNodeId(null);
  }

  function handleSend() {
    mockSendProposal(alert, nodes, edges);
    setProposalSent(true);
    appendAudit(
      "Proposal sent",
      `Sent to CDN for review — ${changedNodeIds.size} node(s) changed. Status: Pending CDN confirmation.`,
    );
    setToastMsg("Proposal sent to CDN — pending review");
    setTimeout(() => setToastMsg(null), TOAST_DURATION_MS);
  }

  return (
    <div className="flex" style={{ height: "calc(100vh - 56px)", margin: "-16px -24px" }}>
      <LeftPanel
        alert={alert}
        auditTrail={auditTrail}
        comment={comment}
        onCommentChange={setComment}
        onAddComment={handleAddComment}
        onCancel={() => navigate(`/alerts/${alert.id}`)}
        onSend={handleSend}
        proposalSent={proposalSent}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-4 px-5 py-3 shrink-0" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hasEdits ? "var(--color-brand)" : "#FFB020" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {hasEdits ? "Current vs Proposed" : "Current"}
            </span>
          </div>
          <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
            Alert-scoped subgraph — click a node to inspect or edit
          </span>
        </div>

        <div className="flex-1 min-h-0 flex">
          {hasEdits && (
            <div className="flex-1 min-w-0 relative" style={{ borderRight: "1px solid var(--color-border)" }}>
              <span className="absolute top-2 left-2 z-10 text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded" style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "var(--color-text-muted)" }}>
                Current
              </span>
              <AlertSubgraphCanvas nodes={baseline.nodes} edges={baseline.edges} />
            </div>
          )}
          <div className="flex-1 min-w-0 relative">
            {hasEdits && (
              <span className="absolute top-2 left-2 z-10 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded" style={{ backgroundColor: "rgba(233,24,124,0.15)", color: "var(--color-brand)" }}>
                Proposed
              </span>
            )}
            <AlertSubgraphCanvas
              nodes={nodes}
              edges={edges}
              changedNodeIds={changedNodeIds}
              onNodeClick={setSelectedNodeId}
            />
          </div>
        </div>
      </div>

      {selectedNode && !formMode && (
        <NetworkNodePopup
          node={selectedNode}
          edges={edges}
          allNodes={nodes}
          onClose={() => setSelectedNodeId(null)}
          onEditNode={() => setFormMode("edit")}
          onAddNode={() => setFormMode("add")}
          onDeleteConnection={handleDeleteConnection}
        />
      )}

      {formMode === "add" && (
        <NodeFormModal mode="add" onSubmit={handleAddNodeSubmit} onClose={() => setFormMode(null)} />
      )}
      {formMode === "edit" && selectedNode && (
        <NodeFormModal
          mode="edit"
          initial={{ name: selectedNode.label, nodeType: selectedNode.nodeType, description: selectedNode.description }}
          onSubmit={handleEditNodeSubmit}
          onClose={() => setFormMode(null)}
        />
      )}

      {toastMsg && <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />}
    </div>
  );
}
