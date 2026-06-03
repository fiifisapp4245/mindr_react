import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  ReactFlow, ReactFlowProvider, useNodesState, useEdgesState,
  Background, Controls, MiniMap, Handle, Position, BackgroundVariant, MarkerType,
  type Node, type Edge, type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Dagre from "@dagrejs/dagre";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { mockCases } from "../../data/cxi-cases";
import type { MINDRCase } from "../../types/cxi";
import { Link } from "react-router-dom";
import { statusColor, statusBg } from "../cxi/CaseRow";

// ── Types ─────────────────────────────────────────────────────────────────────

type NodeLevel    = "region" | "site" | "cell" | "cluster";
type HealthStatus = "healthy" | "degraded" | "critical";
type FilterType   = "all" | "critical" | "degraded" | "healthy";

interface TopoNodeData extends Record<string, unknown> {
  label:      string;
  level:      NodeLevel;
  cxi:        number;
  health:     HealthStatus;
  cases:      MINDRCase[];
  dimmed?:    boolean;
  collapsed?: boolean;
}

type TopoNode = Node<TopoNodeData>;
type TopoEdge = Edge;

// ── Constants ─────────────────────────────────────────────────────────────────

const HC: Record<HealthStatus, string> = {
  healthy:  "#2DD4BF",
  degraded: "#FFB020",
  critical: "#FF3B3B",
};

const SZ = {
  site:    { w: 130, h: 38 },
  cell:    { w: 90,  h: 48 },
  cluster: { w: 30,  h: 30 },
};

const GROUP_COLS = 3;
const GROUP_W    = 480;
const GROUP_GAP  = 40;
const DG_MX      = 16;
const DG_MY      = 52;

// ── Helpers ───────────────────────────────────────────────────────────────────

function health(cxi: number): HealthStatus {
  return cxi >= 3.5 ? "healthy" : cxi >= 3.0 ? "degraded" : "critical";
}

function avgCxi(cases: MINDRCase[]): number {
  if (!cases.length) return 4.5;
  return cases.map((c) => Math.max(0, Math.min(5, 4.5 + c.cxiDrop))).reduce((a, b) => a + b, 0) / cases.length;
}

// ── Region data ───────────────────────────────────────────────────────────────

interface CellDatum { id: string; label: string; cxi: number; health: HealthStatus; cases: MINDRCase[] }
interface SiteDatum { id: string; label: string; cxi: number; health: HealthStatus; cases: MINDRCase[]; cells: CellDatum[] }
interface RegionDatum { id: string; region: string; cxi: number; health: HealthStatus; cases: MINDRCase[]; sites: SiteDatum[] }

function buildRegions(): RegionDatum[] {
  const rMap = new Map<string, Map<string, Map<string, MINDRCase[]>>>();
  mockCases.forEach((c) => {
    const { region, siteName, cellName } = c.affectedScope;
    if (!rMap.has(region)) rMap.set(region, new Map());
    const sMap = rMap.get(region)!;
    if (!sMap.has(siteName)) sMap.set(siteName, new Map());
    const cMap = sMap.get(siteName)!;
    if (!cMap.has(cellName)) cMap.set(cellName, []);
    cMap.get(cellName)!.push(c);
  });

  return Array.from(rMap.entries()).map(([region, sMap]) => {
    const sites = Array.from(sMap.entries()).map(([sName, cMap]) => {
      const cells = Array.from(cMap.entries()).map(([cName, cc]) => {
        const cxi = avgCxi(cc);
        return { id: `cell-${cName}`, label: cName, cxi, health: health(cxi), cases: cc };
      });
      const sc = cells.flatMap((c) => c.cases);
      const scxi = avgCxi(sc);
      return { id: `site-${sName}`, label: sName, cxi: scxi, health: health(scxi), cases: sc, cells };
    });
    const rc = sites.flatMap((s) => s.cases);
    const rcxi = avgCxi(rc);
    return { id: `rg-${region}`, region, cxi: rcxi, health: health(rcxi), cases: rc, sites };
  });
}

// ── Build RF nodes/edges ──────────────────────────────────────────────────────

function buildTopology(regions: RegionDatum[]): {
  nodes: TopoNode[];
  edges: TopoEdge[];
  groupHeights: Map<string, number>;
} {
  const allNodes: TopoNode[] = [];
  const allEdges: TopoEdge[] = [];
  const groupHeights = new Map<string, number>();

  regions.forEach((region, idx) => {
    const col = idx % GROUP_COLS;
    const row = Math.floor(idx / GROUP_COLS);
    const gx  = 40 + col * (GROUP_W + GROUP_GAP);
    const gy  = 80 + row * (360 + GROUP_GAP);

    // Per-region dagre
    const g = new Dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: "TB", ranksep: 45, nodesep: 20, marginx: DG_MX, marginy: DG_MY });

    region.sites.forEach((site) => {
      g.setNode(site.id, { width: SZ.site.w, height: SZ.site.h });
      site.cells.forEach((cell) => {
        g.setNode(cell.id, { width: SZ.cell.w, height: SZ.cell.h });
        g.setEdge(site.id, cell.id);
        const clId = `cl-${cell.id}`;
        g.setNode(clId, { width: SZ.cluster.w, height: SZ.cluster.h });
        g.setEdge(cell.id, clId);
      });
    });

    Dagre.layout(g);

    // Auto-size group from dagre output
    let maxX = 280, maxY = 200;
    g.nodes().forEach((nid) => {
      const p = g.node(nid);
      if (!p) return;
      const sz = nid.startsWith("site-") ? SZ.site : nid.startsWith("cell-") ? SZ.cell : SZ.cluster;
      maxX = Math.max(maxX, p.x + sz.w / 2 + DG_MX + 8);
      maxY = Math.max(maxY, p.y + sz.h / 2 + 16);
    });

    const gw = Math.max(280, maxX);
    const gh = Math.max(200, maxY);
    groupHeights.set(region.id, gh);

    // Group node
    allNodes.push({
      id:       region.id,
      type:     "regionGroupNode",
      position: { x: gx, y: gy },
      style:    { width: gw, height: gh, overflow: "hidden" },
      data:     { label: region.region, level: "region" as NodeLevel, cxi: region.cxi, health: region.health, cases: region.cases },
    } as TopoNode);

    // Children
    region.sites.forEach((site) => {
      const sp = g.node(site.id);
      if (!sp) return;
      allNodes.push({
        id: site.id, type: "siteNode", parentId: region.id, extent: "parent" as const,
        position: { x: sp.x - SZ.site.w / 2, y: sp.y - SZ.site.h / 2 },
        style: { width: SZ.site.w, height: SZ.site.h },
        data: { label: site.label, level: "site" as NodeLevel, cxi: site.cxi, health: site.health, cases: site.cases },
      } as TopoNode);

      site.cells.forEach((cell) => {
        const cp = g.node(cell.id);
        if (!cp) return;
        allNodes.push({
          id: cell.id, type: "cellNode", parentId: region.id, extent: "parent" as const,
          position: { x: cp.x - SZ.cell.w / 2, y: cp.y - SZ.cell.h / 2 },
          style: { width: SZ.cell.w, height: SZ.cell.h },
          data: { label: cell.label, level: "cell" as NodeLevel, cxi: cell.cxi, health: cell.health, cases: cell.cases },
        } as TopoNode);
        allEdges.push({ id: `e-${site.id}→${cell.id}`, source: site.id, target: cell.id });

        const clId  = `cl-${cell.id}`;
        const clp   = g.node(clId);
        if (!clp) return;
        const clCxi = Math.max(0, Math.min(5, cell.cxi - 0.1));
        allNodes.push({
          id: clId, type: "clusterNode", parentId: region.id, extent: "parent" as const,
          position: { x: clp.x - SZ.cluster.w / 2, y: clp.y - SZ.cluster.h / 2 },
          style: { width: SZ.cluster.w, height: SZ.cluster.h },
          data: { label: `${cell.label}-A`, level: "cluster" as NodeLevel, cxi: clCxi, health: health(clCxi), cases: cell.cases },
        } as TopoNode);
        allEdges.push({ id: `e-${cell.id}→${clId}`, source: cell.id, target: clId });
      });
    });
  });

  return { nodes: allNodes, edges: allEdges, groupHeights };
}

// ── Apply display state ────────────────────────────────────────────────────────

function applyDisplay(
  nodes: TopoNode[],
  groupHeights: Map<string, number>,
  collapsedIds: Set<string>,
  filter: FilterType,
): TopoNode[] {
  const dimmedGroups = new Set<string>();
  nodes.forEach((n) => {
    const d = n.data as TopoNodeData;
    if (d.level === "region" && filter !== "all" && d.health !== filter) dimmedGroups.add(n.id);
  });

  return nodes.map((n) => {
    const d       = n.data as TopoNodeData;
    const isGroup = d.level === "region";

    if (isGroup) {
      const collapsed = collapsedIds.has(n.id);
      const dimmed    = dimmedGroups.has(n.id);
      return {
        ...n,
        style: { ...n.style, height: collapsed ? 48 : (groupHeights.get(n.id) ?? 200), opacity: dimmed ? 0.2 : 1 },
        data:  { ...n.data, dimmed, collapsed },
      };
    }

    const parentCollapsed = n.parentId ? collapsedIds.has(n.parentId) : false;
    const parentDimmed    = n.parentId ? dimmedGroups.has(n.parentId) : false;
    return {
      ...n,
      hidden: parentCollapsed,
      style:  { ...n.style, opacity: parentDimmed ? 0.15 : 1 },
      data:   { ...n.data, dimmed: parentDimmed },
    };
  });
}

// ── Module-level toggle (avoids prop-drilling through RF nodeTypes) ────────────

const _toggle = { fn: (_id: string) => {} };

// ── Custom node components ────────────────────────────────────────────────────

const HS: React.CSSProperties = { border: "none", width: 5, height: 5 };

function RegionGroupNode({ data, id, selected }: NodeProps) {
  const d   = data as TopoNodeData;
  const col = HC[d.health];
  return (
    <div style={{ width: "100%", height: "100%", borderRadius: 10, backgroundColor: "rgba(20,20,26,0.97)", border: `1.5px solid ${selected ? col : col + "44"}`, overflow: "hidden", boxShadow: selected ? `0 0 0 2px ${col}40` : "0 2px 16px rgba(0,0,0,0.45)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 10px", height: 48, backgroundColor: `${col}12`, borderBottom: d.collapsed ? "none" : `1px solid ${col}25`, flexShrink: 0 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: col, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: "#E4E4E7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'IBM Plex Sans', sans-serif" }}>
          {d.label}
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, color: col, fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>
          {d.cxi.toFixed(1)}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); _toggle.fn(id); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#F4F4F5", padding: 2, display: "flex", alignItems: "center", flexShrink: 0 }}
        >
          {d.collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>
    </div>
  );
}

function SiteNode({ data, selected }: NodeProps) {
  const d   = data as TopoNodeData;
  const col = HC[d.health];
  const fs  = d.label.length > 18 ? 9 : 10;
  return (
    <div style={{ width: "100%", height: "100%", backgroundColor: `${col}10`, border: `1px solid ${selected ? col : col + "50"}`, borderRadius: 6, display: "flex", alignItems: "center", gap: 7, padding: "0 9px", cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", boxShadow: selected ? `0 0 0 2px ${col}45` : "none" }}>
      <Handle type="target" position={Position.Top}    style={{ ...HS, background: col + "60" }} />
      <span style={{ flex: 1, fontSize: fs, fontWeight: 500, color: "#D4D4D8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span>
      <span style={{ fontSize: 9, fontWeight: 700, color: col, fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>{d.cxi.toFixed(1)}</span>
      <Handle type="source" position={Position.Bottom} style={{ ...HS, background: col + "60" }} />
    </div>
  );
}

function CellNode({ data, selected }: NodeProps) {
  const d   = data as TopoNodeData;
  const col = HC[d.health];
  const pct = (d.cxi / 5) * 100;
  const fs  = d.label.length > 18 ? 8 : 9;
  return (
    <div style={{ width: "100%", height: "100%", backgroundColor: `${col}0d`, border: `1px solid ${selected ? col : col + "55"}`, borderRadius: 5, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 8px", gap: 5, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", boxShadow: selected ? `0 0 0 2px ${col}45` : "none" }}>
      <Handle type="target" position={Position.Top}    style={{ ...HS, background: col + "60" }} />
      <span style={{ fontSize: fs, fontWeight: 600, color: "#D4D4D8", fontFamily: "'IBM Plex Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ flex: 1, height: 4, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", backgroundColor: col, borderRadius: 2 }} />
        </div>
        <span style={{ fontSize: 8, fontWeight: 700, color: col, fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>{d.cxi.toFixed(1)}</span>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ ...HS, background: col + "60" }} />
    </div>
  );
}

function ClusterNode({ data, selected }: NodeProps) {
  const d   = data as TopoNodeData;
  const col = HC[d.health];
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Handle type="target" position={Position.Top} style={{ ...HS, background: col + "60", top: 2 }} />
      {d.health === "critical" && !d.dimmed && (
        <div style={{ position: "absolute", inset: -6, borderRadius: "50%", backgroundColor: col, animation: "cxiPulse 2s ease-in-out infinite", pointerEvents: "none" }} />
      )}
      <div style={{ width: "100%", height: "100%", borderRadius: "50%", backgroundColor: `${col}28`, border: `2px solid ${selected ? col : col + "70"}`, boxShadow: selected ? `0 0 0 2px ${col}50` : "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: "#fff", fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1 }}>{d.cxi.toFixed(1)}</span>
      </div>
    </div>
  );
}

const nodeTypes = { regionGroupNode: RegionGroupNode, siteNode: SiteNode, cellNode: CellNode, clusterNode: ClusterNode };

// ── Tooltip ───────────────────────────────────────────────────────────────────

const LL: Record<NodeLevel, string> = { region: "Region", site: "Site", cell: "Cell", cluster: "Cluster" };

function NodeTooltip({ node, x, y }: { node: TopoNode; x: number; y: number }) {
  const d   = node.data;
  const col = HC[d.health];
  return (
    <div style={{ position: "absolute", left: x + 14, top: y - 90, zIndex: 100, pointerEvents: "none", backgroundColor: "#1e1e1e", border: "1px solid #333", borderRadius: 8, padding: "10px 14px", fontFamily: "'IBM Plex Sans', sans-serif", minWidth: 160, boxShadow: "0 8px 24px rgba(0,0,0,0.65)" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#F4F4F5", marginBottom: 5 }}>{d.label}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: col, backgroundColor: `${col}1a`, padding: "2px 6px", borderRadius: 4 }}>{LL[d.level]}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: col, fontFamily: "'IBM Plex Mono', monospace" }}>{d.cxi.toFixed(2)}</span>
        <span style={{ fontSize: 10, color: "#F4F4F5", textTransform: "capitalize" }}>{d.health}</span>
      </div>
      <p style={{ fontSize: 10, color: "#F4F4F5" }}>{d.cases.length} case{d.cases.length !== 1 ? "s" : ""}</p>
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────

const TM: Record<HealthStatus, string> = {
  healthy:  "Above target — no action required",
  degraded: "Monitor closely — approaching threshold",
  critical: "Action required — CXI below minimum",
};

function DetailPanel({ node, onClose }: { node: TopoNode; onClose: () => void }) {
  const d   = node.data;
  const col = HC[d.health];
  const pct = Math.min(100, (d.cxi / 5) * 100);
  return (
    <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 296, backgroundColor: "#0E0E12", borderLeft: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", zIndex: 10, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: col, backgroundColor: `${col}1a`, padding: "2px 7px", borderRadius: 4, display: "inline-block" }}>{LL[d.level]}</span>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#F4F4F5", marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</p>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#F4F4F5", flexShrink: 0, marginTop: 2 }}><X size={13} /></button>
      </div>

      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 40, fontWeight: 700, color: col, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1 }}>{d.cxi.toFixed(1)}</span>
          <span style={{ fontSize: 13, color: "#F4F4F5" }}>/ 5.0</span>
          <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, color: col, backgroundColor: `${col}1a`, padding: "3px 8px", borderRadius: 999, textTransform: "capitalize", flexShrink: 0 }}>{d.health}</span>
        </div>
        <div style={{ position: "relative", height: 7, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
          <div style={{ width: `${pct}%`, height: "100%", backgroundColor: col, borderRadius: 4, transition: "width 0.4s ease" }} />
          <div style={{ position: "absolute", top: 0, left: "60%", width: 1, height: "100%", backgroundColor: "rgba(255,255,255,0.2)" }} />
          <div style={{ position: "absolute", top: 0, left: "70%", width: 1, height: "100%", backgroundColor: "rgba(255,255,255,0.15)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#F4F4F5", marginBottom: 8 }}>
          <span>0</span><span style={{ color: "#FF3B3B80" }}>3.0</span><span style={{ color: "#FFB02080" }}>3.5</span><span>5.0</span>
        </div>
        <p style={{ fontSize: 11, color: "#F4F4F5", lineHeight: 1.5 }}>{TM[d.health]}</p>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <p style={{ padding: "10px 16px 6px", fontSize: 10, fontWeight: 600, color: "#F4F4F5", textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }}>
          {d.cases.length} Case{d.cases.length !== 1 ? "s" : ""}
        </p>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {d.cases.map((c: MINDRCase) => (
            <Link key={c.caseId} to={`/cxi-cases/${c.caseId}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", textDecoration: "none" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#E2007A", fontFamily: "'IBM Plex Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.caseId}</p>
                <p style={{ fontSize: 9, color: "#F4F4F5", marginTop: 2 }}>{c.affectedScope.cellName} · {c.cxiDrop.toFixed(1)} drop</p>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999, color: statusColor(c.status), backgroundColor: statusBg(c.status), textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>{c.status}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Legend ─────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div style={{ position: "absolute", bottom: 12, left: 12, zIndex: 5, backgroundColor: "rgba(14,14,18,0.88)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 12px", display: "flex", gap: 14, fontFamily: "'IBM Plex Sans', sans-serif", backdropFilter: "blur(8px)" }}>
      {(["critical", "degraded", "healthy"] as HealthStatus[]).map((h) => (
        <span key={h} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: "#F4F4F5" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: HC[h], display: "inline-block" }} />
          {h.charAt(0).toUpperCase() + h.slice(1)}
        </span>
      ))}
      <span style={{ width: 1, backgroundColor: "rgba(255,255,255,0.08)", alignSelf: "stretch" }} />
      {(["Region", "Site", "Cell", "Cluster"] as const).map((l, i) => (
        <span key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: "#F4F4F5" }}>
          <span style={{ width: 7, height: 7, borderRadius: i === 3 ? "50%" : 2, backgroundColor: "rgba(255,255,255,0.15)", display: "inline-block", flexShrink: 0 }} />
          {l}
        </span>
      ))}
    </div>
  );
}

// ── Inner graph ────────────────────────────────────────────────────────────────

const FILTERS: { id: FilterType; label: string; color?: string }[] = [
  { id: "all",      label: "All" },
  { id: "critical", label: "Critical", color: HC.critical },
  { id: "degraded", label: "Degraded", color: HC.degraded },
  { id: "healthy",  label: "Healthy",  color: HC.healthy  },
];

function TopologyGraphInner() {
  const regions = useMemo(buildRegions, []);
  const { nodes: baseNodes, edges: baseEdges, groupHeights } = useMemo(() => buildTopology(regions), [regions]);

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter]             = useState<FilterType>("all");
  const [selected, setSelected]         = useState<TopoNode | null>(null);
  const [tooltip, setTooltip]           = useState<{ node: TopoNode; x: number; y: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Wire the module-level toggle callback
  _toggle.fn = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const displayNodes = useMemo(
    () => applyDisplay(baseNodes, groupHeights, collapsedIds, filter),
    [baseNodes, groupHeights, collapsedIds, filter],
  );

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(displayNodes);
  const [rfEdges, , onEdgesChange]           = useEdgesState(baseEdges);

  useEffect(() => { setRfNodes(displayNodes); }, [displayNodes, setRfNodes]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const d = (node as TopoNode).data as TopoNodeData;
    if (d.level === "region") return;
    setSelected((prev) => prev?.id === node.id ? null : (node as TopoNode));
    setTooltip(null);
  }, []);

  const onNodeMouseEnter = useCallback((e: React.MouseEvent, node: Node) => {
    const d = (node as TopoNode).data as TopoNodeData;
    if (d.level === "region") return;
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ node: node as TopoNode, x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const onNodeMouseLeave = useCallback(() => setTooltip(null), []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!tooltip) return;
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip((prev) => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
  }, [tooltip]);

  return (
    <div ref={wrapperRef} style={{ position: "absolute", inset: 0 }} onMouseMove={onMouseMove}>
      {/* Filter bar */}
      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 5, display: "flex", gap: 4 }}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => { setFilter(f.id); setSelected(null); }}
            style={{
              padding: "4px 11px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer",
              fontFamily: "'IBM Plex Sans', sans-serif",
              backgroundColor: filter === f.id ? (f.color ? `${f.color}22` : "rgba(255,255,255,0.08)") : "rgba(14,14,18,0.88)",
              border: `1px solid ${filter === f.id ? (f.color ?? "rgba(255,255,255,0.2)") : "rgba(255,255,255,0.08)"}`,
              color: filter === f.id ? (f.color ?? "#F4F4F5") : "#F4F4F5",
              backdropFilter: "blur(8px)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={() => setSelected(null)}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.08 }}
        minZoom={0.3}
        maxZoom={2}
        style={{ backgroundColor: "#0E0E12", height: "100%", width: "100%" }}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: false,
          style: { stroke: "#444", strokeWidth: 1 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#444", width: 12, height: 12 },
        }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={0.7} color="rgba(255,255,255,0.05)" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => {
            const d = n.data as TopoNodeData;
            const col = HC[d?.health ?? "healthy"];
            return d?.level === "region" ? col + "33" : col + "99";
          }}
          maskColor="rgba(14,14,18,0.7)"
          style={{ bottom: 44, right: 12 }}
        />
      </ReactFlow>

      <Legend />
      {tooltip && <NodeTooltip node={tooltip.node} x={tooltip.x} y={tooltip.y} />}
      {selected && <DetailPanel node={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ── Export ─────────────────────────────────────────────────────────────────────

export function CXITopologyGraph() {
  return (
    <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
      <ReactFlowProvider>
        <TopologyGraphInner />
      </ReactFlowProvider>
    </div>
  );
}
