import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { mockCases } from "../../data/cxi-cases";
import type { MINDRCase } from "../../types/cxi";

// ── Hierarchy types ───────────────────────────────────────────────────────────

interface ClusterNode {
  id: string; name: string; cxiScore: number; cases: MINDRCase[];
}
interface CellNode {
  id: string; name: string; cxiScore: number; cases: MINDRCase[]; clusters: ClusterNode[];
}
interface SiteNode {
  id: string; name: string; cxiScore: number; cases: MINDRCase[]; cells: CellNode[];
}
interface RegionNode {
  id: string; name: string; cxiScore: number; sites: SiteNode[];
}

function buildHierarchy(cases: MINDRCase[]): RegionNode[] {
  const regionMap = new Map<string, Map<string, Map<string, MINDRCase[]>>>();
  cases.forEach((c) => {
    const { region, siteName, cellName } = c.affectedScope;
    if (!regionMap.has(region)) regionMap.set(region, new Map());
    const siteMap = regionMap.get(region)!;
    if (!siteMap.has(siteName)) siteMap.set(siteName, new Map());
    const cellMap = siteMap.get(siteName)!;
    if (!cellMap.has(cellName)) cellMap.set(cellName, []);
    cellMap.get(cellName)!.push(c);
  });
  const avg = (cs: MINDRCase[]) =>
    cs.length > 0 ? parseFloat((4.5 + cs.reduce((s, c) => s + c.cxiDrop, 0) / cs.length).toFixed(1)) : 4.5;
  return Array.from(regionMap.entries()).map(([region, siteMap]) => {
    const sites = Array.from(siteMap.entries()).map(([siteName, cellMap]) => {
      const cells = Array.from(cellMap.entries()).map(([cellName, cc]) => ({
        id: cellName, name: cellName, cxiScore: avg(cc), cases: cc,
        clusters: [{ id: `${cellName}::CLU-A`, name: `${cellName.split(" ").slice(-2).join(" ")} · Cluster`, cxiScore: parseFloat((avg(cc) - 0.2).toFixed(1)), cases: cc }],
      }));
      const allCases = cells.flatMap((c) => c.cases);
      return { id: siteName, name: siteName, cxiScore: avg(allCases), cases: allCases, cells };
    });
    return { id: region, name: region, cxiScore: avg(sites.flatMap((s) => s.cases)), sites };
  });
}

// ── Graph layout types ────────────────────────────────────────────────────────

type NodeLevel = 0 | 1 | 2 | 3;

interface GNode {
  id: string;
  label: string;
  shortLabel: string;
  level: NodeLevel;
  cxiScore: number;
  pendingCases: number;
  totalCases: number;
  x: number;
  y: number;
  parentId?: string;
}

interface GEdge { from: string; to: string; }

// ── Layout constants ──────────────────────────────────────────────────────────

const TIER_Y   = [90, 250, 410, 560] as const;
const NODE_R: Record<NodeLevel, number> = { 0: 36, 1: 28, 2: 22, 3: 16 };
const TIER_LABEL: Record<NodeLevel, string> = { 0: "REGION", 1: "SITE", 2: "CELL", 3: "CLUSTER" };
const SVG_H = 660;
const PAD   = 90;
const COL_W = 110;

// ── Helpers ───────────────────────────────────────────────────────────────────

function cxiColor(score: number): string {
  if (score < 3.0) return "#ef4444";
  if (score < 3.5) return "#f59e0b";
  return "#22c55e";
}

function cxiStatus(score: number): string {
  if (score < 3.0) return "Critical";
  if (score < 3.5) return "Degraded";
  return "Healthy";
}

function shortLabel(name: string, level: NodeLevel): string {
  const w = name.split(/[\s/]+/);
  if (level === 0) return w[0];
  if (level === 1) return w[w.length - 1];
  if (level === 2) return w.slice(-2).join(" ");
  return "Cluster";
}

// ── Graph builder ─────────────────────────────────────────────────────────────

function buildGraph(hierarchy: RegionNode[]): { nodes: GNode[]; edges: GEdge[]; svgW: number } {
  const nodes: GNode[] = [];
  const edges: GEdge[] = [];

  const totalChains = hierarchy.reduce(
    (s, r) => s + r.sites.reduce((ss, site) => ss + site.cells.reduce((sss, cell) => sss + cell.clusters.length, 0), 0),
    0
  );
  const svgW = Math.max(totalChains * COL_W + PAD * 2, 900);

  // x of the centre of a run starting at `start` spanning `count` chains
  function cx(start: number, count: number): number {
    if (count <= 1) return PAD + start * COL_W;
    return PAD + (start + (count - 1) / 2) * COL_W;
  }

  let chainIdx = 0;

  hierarchy.forEach((region) => {
    const rChains = region.sites.reduce((s, site) => s + site.cells.reduce((ss, cell) => ss + cell.clusters.length, 0), 0);
    const rStart  = chainIdx;
    const allRC   = region.sites.flatMap((s) => s.cases);

    nodes.push({
      id: region.id, label: region.name, shortLabel: shortLabel(region.name, 0),
      level: 0, cxiScore: region.cxiScore,
      pendingCases: allRC.filter((c) => c.status === "pending").length,
      totalCases: allRC.length,
      x: cx(rStart, rChains), y: TIER_Y[0],
    });

    region.sites.forEach((site) => {
      const sChains = site.cells.reduce((s, cell) => s + cell.clusters.length, 0);
      const sStart  = chainIdx;

      nodes.push({
        id: site.id, label: site.name, shortLabel: shortLabel(site.name, 1),
        level: 1, cxiScore: site.cxiScore,
        pendingCases: site.cases.filter((c) => c.status === "pending").length,
        totalCases: site.cases.length,
        x: cx(sStart, sChains), y: TIER_Y[1],
        parentId: region.id,
      });
      edges.push({ from: region.id, to: site.id });

      site.cells.forEach((cell) => {
        const cChains = cell.clusters.length;
        const cStart  = chainIdx;

        nodes.push({
          id: cell.id, label: cell.name, shortLabel: shortLabel(cell.name, 2),
          level: 2, cxiScore: cell.cxiScore,
          pendingCases: cell.cases.filter((c) => c.status === "pending").length,
          totalCases: cell.cases.length,
          x: cx(cStart, cChains), y: TIER_Y[2],
          parentId: site.id,
        });
        edges.push({ from: site.id, to: cell.id });

        cell.clusters.forEach((cluster) => {
          nodes.push({
            id: cluster.id, label: cluster.name, shortLabel: shortLabel(cluster.name, 3),
            level: 3, cxiScore: cluster.cxiScore,
            pendingCases: 0,
            totalCases: cluster.cases.length,
            x: PAD + chainIdx * COL_W, y: TIER_Y[3],
            parentId: cell.id,
          });
          edges.push({ from: cell.id, to: cluster.id });
          chainIdx++;
        });
      });
    });
  });

  return { nodes, edges, svgW };
}

// ── SVG Node ──────────────────────────────────────────────────────────────────

function GNode({ node, selected, onClick }: { node: GNode; selected: boolean; onClick: () => void }) {
  const r   = NODE_R[node.level];
  const col = cxiColor(node.cxiScore);
  const hasPending = node.pendingCases > 0;
  const fs  = r > 30 ? 11 : r > 22 ? 9 : 8;

  return (
    <g transform={`translate(${node.x},${node.y})`} onClick={onClick} style={{ cursor: "pointer" }}>
      {/* Ambient glow for pending */}
      {hasPending && <circle r={r + 11} style={{ fill: "none", stroke: col, strokeWidth: 1, opacity: 0.25 }} />}
      {/* Selection ring */}
      {selected && <circle r={r + 6} style={{ fill: "none", stroke: "#fff", strokeWidth: 1.5, opacity: 0.4 }} />}
      {/* Main body */}
      <circle r={r} style={{ fill: `${col}1a`, stroke: col, strokeWidth: selected ? 2.5 : 1.5 }} />
      {/* CXI score */}
      <text
        y={fs / 3}
        textAnchor="middle"
        style={{ fill: "#fff", fontSize: fs, fontWeight: 700, fontFamily: "var(--font-mono)", pointerEvents: "none" }}
      >
        {node.cxiScore.toFixed(1)}
      </text>
      {/* Short label below */}
      <text
        y={r + 14}
        textAnchor="middle"
        style={{ fill: "rgba(255,255,255,0.45)", fontSize: r > 24 ? 9 : 8, fontFamily: "var(--font-ui)", pointerEvents: "none" }}
      >
        {node.shortLabel}
      </text>
      {/* Pending badge */}
      {hasPending && (
        <g transform={`translate(${r - 3},${-r + 3})`}>
          <circle r={7} style={{ fill: "#ef4444" }} />
          <text y={3} textAnchor="middle" style={{ fill: "#fff", fontSize: 7, fontWeight: 700, pointerEvents: "none" }}>
            {node.pendingCases}
          </text>
        </g>
      )}
    </g>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({ node, onClose }: { node: GNode; onClose: () => void }) {
  const col  = cxiColor(node.cxiScore);
  const name = ["Region", "Site", "Cell", "Cluster"][node.level];
  return (
    <div
      className="absolute right-0 top-0 bottom-0 flex flex-col"
      style={{ width: 260, backgroundColor: "var(--color-bg-card)", borderLeft: "1px solid var(--color-border)", zIndex: 20 }}
    >
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
          {name} · Detail
        </span>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10 transition-colors" style={{ color: "var(--color-text-muted)" }}>
          <X size={12} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Name + CXI */}
        <div>
          <p className="text-sm font-bold leading-snug" style={{ color: "var(--color-text-primary)" }}>
            {node.label}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-lg font-bold font-mono" style={{ color: col }}>
              {node.cxiScore.toFixed(1)}
            </span>
            <span
              className="text-[10px] font-semibold px-2 py-px rounded-full"
              style={{ backgroundColor: `${col}22`, color: col }}
            >
              {cxiStatus(node.cxiScore)}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Pending", value: node.pendingCases, color: node.pendingCases > 0 ? "#ef4444" : "rgba(255,255,255,0.35)" },
            { label: "Total Cases", value: node.totalCases, color: "var(--color-text-primary)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="px-3 py-2.5 rounded-lg" style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
              <p className="text-[9px] uppercase tracking-widest font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>{label}</p>
              <p className="text-lg font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* CXI bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--color-text-muted)" }}>CXI Score</span>
            <span className="text-[10px] font-bold font-mono" style={{ color: col }}>{node.cxiScore.toFixed(1)} / 5.0</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${(node.cxiScore / 5) * 100}%`, backgroundColor: col, transition: "width 0.4s ease" }}
            />
          </div>
        </div>

        <Link
          to="/cxi-cases"
          className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-85"
          style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
        >
          View Cases →
        </Link>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function CxiKnowledgeGraph() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const hierarchy = useMemo(() => buildHierarchy(mockCases), []);
  const { nodes, edges, svgW } = useMemo(() => buildGraph(hierarchy), [hierarchy]);

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;
  const nodeById     = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  return (
    <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>

      {/* ── Tier labels (left strip) ── */}
      <div
        className="absolute left-0 top-0 bottom-0 z-10 flex flex-col"
        style={{ width: 56, borderRight: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
      >
        {([0, 1, 2, 3] as NodeLevel[]).map((level) => {
          const pct = (TIER_Y[level] / SVG_H) * 100;
          return (
            <div
              key={level}
              className="absolute flex items-center justify-center"
              style={{ left: 0, right: 0, top: `${pct}%`, transform: "translateY(-50%)", height: 32 }}
            >
              <span
                className="text-[8px] font-bold tracking-widest uppercase select-none"
                style={{
                  color: "rgba(255,255,255,0.25)",
                  writingMode: "vertical-rl" as React.CSSProperties["writingMode"],
                  transform: "rotate(180deg)",
                }}
              >
                {TIER_LABEL[level]}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Graph canvas ── */}
      <div
        className="absolute inset-0 overflow-auto"
        style={{ left: 56, right: selectedNode ? 260 : 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}
      >
        <svg
          width={svgW}
          height={SVG_H}
          viewBox={`0 0 ${svgW} ${SVG_H}`}
          style={{ display: "block" }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}
        >
          {/* Alternating tier bands */}
          {([0, 1, 2, 3] as NodeLevel[]).map((level) => (
            <rect
              key={level}
              x={0} y={TIER_Y[level] - 65}
              width={svgW} height={130}
              style={{ fill: level % 2 === 0 ? "rgba(255,255,255,0.012)" : "transparent" }}
            />
          ))}

          {/* Tier separator lines */}
          {[1, 2, 3].map((i) => (
            <line
              key={i}
              x1={0} y1={TIER_Y[i as NodeLevel] - 65}
              x2={svgW} y2={TIER_Y[i as NodeLevel] - 65}
              style={{ stroke: "rgba(255,255,255,0.05)", strokeWidth: 1 }}
            />
          ))}

          {/* Edges */}
          {edges.map((edge) => {
            const from = nodeById.get(edge.from);
            const to   = nodeById.get(edge.to);
            if (!from || !to) return null;
            const y1   = from.y + NODE_R[from.level];
            const y2   = to.y   - NODE_R[to.level];
            const midY = (y1 + y2) / 2;
            const d    = `M ${from.x} ${y1} C ${from.x} ${midY} ${to.x} ${midY} ${to.x} ${y2}`;
            const isHighlit = edge.from === selectedId || edge.to === selectedId;
            return (
              <path
                key={`${edge.from}→${edge.to}`}
                d={d}
                style={{
                  fill: "none",
                  stroke: isHighlit ? cxiColor(from.cxiScore) : "rgba(255,255,255,0.1)",
                  strokeWidth: isHighlit ? 1.5 : 1,
                  opacity: isHighlit ? 0.85 : 0.55,
                }}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => (
            <GNode
              key={node.id}
              node={node}
              selected={selectedId === node.id}
              onClick={() => setSelectedId(selectedId === node.id ? null : node.id)}
            />
          ))}
        </svg>
      </div>

      {/* ── Detail panel ── */}
      {selectedNode && <DetailPanel node={selectedNode} onClose={() => setSelectedId(null)} />}

      {/* ── CXI legend ── */}
      <div
        className="absolute bottom-4 left-16 flex flex-col gap-1.5 px-3 py-2.5 rounded-xl z-10 pointer-events-none"
        style={{ backgroundColor: "rgba(14,14,20,0.85)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}
      >
        <p className="text-[8px] font-bold tracking-widest uppercase mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>CXI Impact</p>
        {[
          { label: "Critical  < 3.0", color: "#ef4444" },
          { label: "Degraded < 3.5", color: "#f59e0b" },
          { label: "Healthy  ≥ 3.5", color: "#22c55e" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
