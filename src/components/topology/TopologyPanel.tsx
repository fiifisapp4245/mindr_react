import { useState } from "react";
import { X, ChevronRight, ChevronDown, AlertTriangle } from "lucide-react";
import type { TopoSite, TopoCell, TopoCluster, IncidentStatus } from "../../types/topology";
import { getCXIColor, getCXIStatus, getCXIMessage } from "../../types/topology";

// ── Incident status helpers ───────────────────────────────────────────────────

const INCIDENT_COLORS: Record<IncidentStatus, { fg: string; bg: string }> = {
  OPEN:        { fg: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  IN_PROGRESS: { fg: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  APPROVED:    { fg: "#22c55e", bg: "rgba(34,197,94,0.12)" },
};

// ── Cluster row ───────────────────────────────────────────────────────────────

function ClusterRow({ cluster, expanded, onToggle }: {
  cluster:   TopoCluster;
  expanded:  boolean;
  onToggle:  () => void;
}) {
  const col     = getCXIColor(cluster.cxi);
  const pct     = Math.min(100, (cluster.cxi / 5) * 100);
  const isActive = cluster.incidents.some((i) => i.status === "OPEN" || i.status === "IN_PROGRESS");

  return (
    <>
      <button
        onClick={onToggle}
        style={{
          width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8,
          padding: "7px 16px 7px 28px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          transition: "background 0.1s",
          fontFamily: "'IBM Plex Sans', sans-serif",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
      >
        {expanded ? <ChevronDown size={10} style={{ color: "#71717A", flexShrink: 0 }} /> : <ChevronRight size={10} style={{ color: "#71717A", flexShrink: 0 }} />}
        <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: isActive ? col : col + "99", flexShrink: 0, animation: isActive ? "cxiPulse 2s ease-in-out infinite" : "none" }} />
        <span style={{ flex: 1, fontSize: 10, fontWeight: 500, color: "#C4C4CC", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {cluster.name}
        </span>
        <span style={{ fontSize: 9, fontWeight: 700, color: col, fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>
          {cluster.cxi.toFixed(1)}
        </span>
        <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: col, flexShrink: 0 }} />
      </button>

      {expanded && (
        <div style={{ padding: "10px 16px 10px 36px", borderBottom: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(0,0,0,0.25)" }}>
          {/* CXI detail */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: col, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1 }}>{cluster.cxi.toFixed(1)}</span>
            <span style={{ fontSize: 11, color: "#52525B" }}>/ 5.0</span>
            <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, color: col, backgroundColor: `${col}1a`, padding: "2px 7px", borderRadius: 999, textTransform: "capitalize", flexShrink: 0 }}>{getCXIStatus(cluster.cxi)}</span>
          </div>
          <div style={{ height: 5, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ width: `${pct}%`, height: "100%", backgroundColor: col, borderRadius: 3 }} />
          </div>
          <p style={{ fontSize: 10, color: "#71717A", marginBottom: cluster.incidents.length ? 10 : 0 }}>{getCXIMessage(cluster.cxi)}</p>

          {/* Incidents */}
          {cluster.incidents.length > 0 && (
            <>
              <p style={{ fontSize: 9, fontWeight: 700, color: "#52525B", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                Linked Incidents
              </p>
              {cluster.incidents.map((inc) => {
                const ic = INCIDENT_COLORS[inc.status];
                return (
                  <div key={inc.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#E2007A", fontFamily: "'IBM Plex Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inc.id}</p>
                      <p style={{ fontSize: 9, color: "#52525B", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inc.description}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 9, fontWeight: 700, color: ic.fg, backgroundColor: ic.bg, padding: "2px 6px", borderRadius: 4 }}>{inc.status.replace("_", " ")}</p>
                      <p style={{ fontSize: 9, color: "#52525B", marginTop: 2, fontFamily: "'IBM Plex Mono', monospace" }}>{inc.cxiDrop.toFixed(1)}</p>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </>
  );
}

// ── Cell row ──────────────────────────────────────────────────────────────────

function CellRow({ cell, expanded, onToggle, expandedClusterId, onClusterToggle }: {
  cell:               TopoCell;
  expanded:           boolean;
  onToggle:           () => void;
  expandedClusterId:  string | null;
  onClusterToggle:    (id: string) => void;
}) {
  const col = getCXIColor(cell.cxi);

  return (
    <>
      <button
        onClick={onToggle}
        style={{
          width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8,
          padding: "9px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          fontFamily: "'IBM Plex Sans', sans-serif",
          transition: "background 0.1s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
      >
        {expanded ? <ChevronDown size={11} style={{ color: "#71717A", flexShrink: 0 }} /> : <ChevronRight size={11} style={{ color: "#71717A", flexShrink: 0 }} />}
        <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: "#D4D4D8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {cell.name}
        </span>
        {cell.hasActiveIncident && (
          <AlertTriangle size={10} style={{ color: "#ef4444", flexShrink: 0 }} />
        )}
        <span style={{ fontSize: 9, fontWeight: 700, color: col, fontFamily: "'IBM Plex Mono', monospace", backgroundColor: `${col}1a`, padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>
          {cell.cxi.toFixed(1)}
        </span>
        <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: col, flexShrink: 0 }} />
      </button>

      {expanded && cell.clusters.map((cl) => (
        <ClusterRow
          key={cl.id}
          cluster={cl}
          expanded={expandedClusterId === cl.id}
          onToggle={() => onClusterToggle(cl.id)}
        />
      ))}
    </>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function TopologyPanel({ site, onClose }: { site: TopoSite; onClose: () => void }) {
  const [expandedCellId, setExpandedCellId]       = useState<string | null>(null);
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);

  const col = getCXIColor(site.cxi);
  const pct = Math.min(100, (site.cxi / 5) * 100);

  const toggleCell = (id: string) => {
    setExpandedCellId((prev) => prev === id ? null : id);
    setExpandedClusterId(null);
  };

  const toggleCluster = (id: string) => {
    setExpandedClusterId((prev) => prev === id ? null : id);
  };

  return (
    <div
      style={{
        position: "absolute", top: 0, right: 0, bottom: 0, width: 320,
        backgroundColor: "#111",
        borderLeft: "1px solid #2a2a2a",
        display: "flex", flexDirection: "column",
        zIndex: 1000,
        fontFamily: "'IBM Plex Sans', sans-serif",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.55)",
      }}
    >
      {/* Header */}
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #1e1e1e", display: "flex", alignItems: "flex-start", gap: 10, flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#52525B" }}>SITE</span>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#F4F4F5", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {site.name}
          </p>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#52525B", flexShrink: 0 }}>
          <X size={14} />
        </button>
      </div>

      {/* CXI summary */}
      <div style={{ padding: "12px 16px 14px", borderBottom: "1px solid #1e1e1e", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 36, fontWeight: 700, color: col, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1 }}>{site.cxi.toFixed(1)}</span>
          <span style={{ fontSize: 13, color: "#52525B" }}>/ 5.0</span>
          <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, color: col, backgroundColor: `${col}1a`, padding: "3px 8px", borderRadius: 999, flexShrink: 0 }}>{getCXIStatus(site.cxi)}</span>
        </div>
        {/* CXI bar with threshold markers */}
        <div style={{ position: "relative", height: 7, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 4, overflow: "hidden", marginBottom: 5 }}>
          <div style={{ width: `${pct}%`, height: "100%", backgroundColor: col, borderRadius: 4 }} />
          <div style={{ position: "absolute", top: 0, left: "60%", width: 1, height: "100%", backgroundColor: "rgba(255,255,255,0.2)" }} />
          <div style={{ position: "absolute", top: 0, left: "80%", width: 1, height: "100%", backgroundColor: "rgba(255,255,255,0.15)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#3f3f46" }}>
          <span>0</span><span style={{ color: "#ef444460" }}>3.0</span><span style={{ color: "#f59e0b60" }}>4.0</span><span>5.0</span>
        </div>
        <p style={{ fontSize: 11, color: "#71717A", marginTop: 8, lineHeight: 1.5 }}>{getCXIMessage(site.cxi)}</p>
      </div>

      {/* Cells */}
      <div style={{ flexShrink: 0, padding: "8px 16px 4px", borderBottom: "1px solid #1e1e1e" }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: "#52525B", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Cells ({site.cells.length})
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {site.cells.map((cell) => (
          <CellRow
            key={cell.id}
            cell={cell}
            expanded={expandedCellId === cell.id}
            onToggle={() => toggleCell(cell.id)}
            expandedClusterId={expandedClusterId}
            onClusterToggle={toggleCluster}
          />
        ))}
      </div>
    </div>
  );
}
