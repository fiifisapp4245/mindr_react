import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Globe2, Network, Radio, Shield, X } from "lucide-react";
import { mockCases } from "../../data/cxi-cases";
import type { MINDRCase } from "../../types/cxi";

// ── Hierarchy builder ─────────────────────────────────────────────────────────

interface RegionSummary {
  id: string;
  name: string;
  cxiScore: number;
  pendingCases: number;
  totalCases: number;
}

function getRegionSummaries(cases: MINDRCase[]): RegionSummary[] {
  const map = new Map<string, MINDRCase[]>();
  cases.forEach((c) => {
    const r = c.affectedScope.region;
    if (!map.has(r)) map.set(r, []);
    map.get(r)!.push(c);
  });
  return Array.from(map.entries()).map(([name, cs]) => ({
    id: name,
    name,
    cxiScore: parseFloat((4.5 + cs.reduce((s, c) => s + c.cxiDrop, 0) / cs.length).toFixed(1)),
    pendingCases: cs.filter((c) => c.status === "pending").length,
    totalCases: cs.length,
  }));
}

// ── Graph data ────────────────────────────────────────────────────────────────

interface ZoneConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  angle: number;   // degrees from root (0 = right, 90 = down)
  dist: number;    // px from root
  regionIds: string[];
}

const ZONES: ZoneConfig[] = [
  {
    id: "zone-north",
    label: "North",
    icon: Globe2,
    angle: -115,
    dist: 215,
    regionIds: ["Hamburg Metropolitan", "Bremen Northern", "Hannover Lower Saxony", "Berlin Metropolitan"],
  },
  {
    id: "zone-west",
    label: "West",
    icon: Network,
    angle: 25,
    dist: 200,
    regionIds: ["Cologne/Bonn", "Düsseldorf Rhine-Ruhr", "Frankfurt Rhine-Main", "Stuttgart Baden-Württemberg"],
  },
  {
    id: "zone-south",
    label: "South",
    icon: Network,
    angle: 120,
    dist: 205,
    regionIds: ["Munich Metropolitan", "Nuremberg Bavaria", "Dresden Saxony", "Leipzig Saxony"],
  },
];

// ── Color helpers ─────────────────────────────────────────────────────────────

function leafColor(cxi: number): string {
  if (cxi < 3.0) return "#7C2C2C";
  if (cxi < 3.5) return "#7A6820";
  return "#2A6B3A";
}

function leafBorder(cxi: number): string {
  if (cxi < 3.0) return "#C0392B";
  if (cxi < 3.5) return "#C0A020";
  return "#2ECC71";
}

function cxiStatus(cxi: number): string {
  if (cxi < 3.0) return "Critical";
  if (cxi < 3.5) return "Degraded";
  return "Healthy";
}

function cxiTextColor(cxi: number): string {
  if (cxi < 3.0) return "#ef4444";
  if (cxi < 3.5) return "#f59e0b";
  return "#22c55e";
}

// ── Position calculator ───────────────────────────────────────────────────────

const SVG_W = 960;
const SVG_H = 820;
const ROOT_X = SVG_W / 2 - 30;
const ROOT_Y = SVG_H / 2 - 20;

const ROOT_R  = 36;
const ZONE_R  = 22;
const LEAF_R  = 16;

function deg(a: number) { return (a * Math.PI) / 180; }

interface NodePos { x: number; y: number; }

function buildPositions(regions: RegionSummary[]) {
  const pos: Record<string, NodePos> = {};
  pos["root"] = { x: ROOT_X, y: ROOT_Y };

  ZONES.forEach((zone) => {
    const za = deg(zone.angle);
    const zx = ROOT_X + zone.dist * Math.cos(za);
    const zy = ROOT_Y + zone.dist * Math.sin(za);
    pos[zone.id] = { x: zx, y: zy };

    const zoneRegions = zone.regionIds
      .map((rid) => regions.find((r) => r.id === rid))
      .filter(Boolean) as RegionSummary[];

    const coneSpan = 72;
    const coneBase = zone.angle;
    const count = zoneRegions.length;

    zoneRegions.forEach((region, i) => {
      const leafAngle = coneBase - coneSpan / 2 + (count > 1 ? (coneSpan / (count - 1)) * i : 0);
      const la = deg(leafAngle);
      pos[region.id] = {
        x: zx + 150 * Math.cos(la),
        y: zy + 150 * Math.sin(la),
      };
    });
  });

  return pos;
}

// ── SVG node sub-components ───────────────────────────────────────────────────

function RootNode({ x, y, selected, onClick }: { x: number; y: number; selected: boolean; onClick: () => void }) {
  return (
    <g transform={`translate(${x},${y})`} onClick={onClick} style={{ cursor: "pointer" }}>
      {selected && <circle r={ROOT_R + 8} style={{ fill: "none", stroke: "#3B82F6", strokeWidth: 1.5, opacity: 0.4 }} />}
      <circle r={ROOT_R} style={{ fill: "#0F4C8A", stroke: "#3B82F6", strokeWidth: 2 }} />
      <Radio x={-11} y={-11} size={22} color="#93C5FD" strokeWidth={1.5} />
    </g>
  );
}

function ZoneNode({ x, y, zone, selected, onClick }: { x: number; y: number; zone: ZoneConfig; selected: boolean; onClick: () => void }) {
  const Icon = zone.icon;
  return (
    <g transform={`translate(${x},${y})`} onClick={onClick} style={{ cursor: "pointer" }}>
      {selected && <circle r={ZONE_R + 7} style={{ fill: "none", stroke: "#3B82F6", strokeWidth: 1.2, opacity: 0.4 }} />}
      <circle r={ZONE_R} style={{ fill: "#0D3B6E", stroke: "#2563EB", strokeWidth: 1.5 }} />
      <Icon x={-9} y={-9} size={18} color="#60A5FA" strokeWidth={1.5} />
    </g>
  );
}

function LeafNode({ x, y, region, selected, onClick }: { x: number; y: number; region: RegionSummary; selected: boolean; onClick: () => void }) {
  const bg     = leafColor(region.cxiScore);
  const border = leafBorder(region.cxiScore);
  return (
    <g transform={`translate(${x},${y})`} onClick={onClick} style={{ cursor: "pointer" }}>
      {region.pendingCases > 0 && (
        <circle r={LEAF_R + 7} style={{ fill: "none", stroke: border, strokeWidth: 1, opacity: 0.3 }} />
      )}
      {selected && (
        <circle r={LEAF_R + 5} style={{ fill: "none", stroke: "#fff", strokeWidth: 1, opacity: 0.35 }} />
      )}
      <circle r={LEAF_R} style={{ fill: bg, stroke: border, strokeWidth: 1.5 }} />
      <Shield x={-7} y={-7} size={14} color={border} strokeWidth={1.5} />
    </g>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────

type SelectedNode =
  | { kind: "root" }
  | { kind: "zone"; zone: ZoneConfig }
  | { kind: "leaf"; region: RegionSummary };

function DetailPanel({ node, regions, onClose }: { node: SelectedNode; regions: RegionSummary[]; onClose: () => void }) {
  const zoneRegions =
    node.kind === "zone"
      ? node.zone.regionIds.map((rid) => regions.find((r) => r.id === rid)).filter(Boolean) as RegionSummary[]
      : [];

  const zoneAvgCxi =
    zoneRegions.length > 0
      ? parseFloat((zoneRegions.reduce((s, r) => s + r.cxiScore, 0) / zoneRegions.length).toFixed(1))
      : 0;

  const title =
    node.kind === "root" ? "CXI Network"
    : node.kind === "zone" ? `${node.zone.label} Zone`
    : node.region.name;

  const sub =
    node.kind === "root" ? "Network root · All zones"
    : node.kind === "zone" ? `${zoneRegions.length} regions · Avg CXI ${zoneAvgCxi.toFixed(1)}`
    : `CXI ${node.region.cxiScore.toFixed(1)} · ${cxiStatus(node.region.cxiScore)}`;

  const accentColor =
    node.kind === "leaf" ? cxiTextColor(node.region.cxiScore) : "#3B82F6";

  return (
    <div
      className="absolute right-0 top-0 bottom-0 flex flex-col"
      style={{ width: 260, backgroundColor: "#0A0A14", borderLeft: "1px solid rgba(59,130,246,0.2)", zIndex: 20 }}
    >
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
          Node Detail
        </span>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10 transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>
          <X size={12} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <p className="text-sm font-bold leading-snug" style={{ color: "#F4F4F5" }}>{title}</p>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{sub}</p>
        </div>

        {node.kind === "leaf" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "CXI Score",    value: node.region.cxiScore.toFixed(1), color: accentColor },
                { label: "Pending",      value: String(node.region.pendingCases), color: node.region.pendingCases > 0 ? "#ef4444" : "rgba(255,255,255,0.35)" },
                { label: "Total Cases",  value: String(node.region.totalCases),   color: "#F4F4F5" },
                { label: "Status",       value: cxiStatus(node.region.cxiScore),  color: accentColor },
              ].map(({ label, value, color }) => (
                <div key={label} className="px-3 py-2.5 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-[9px] uppercase tracking-widest font-semibold mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</p>
                  <p className="text-base font-bold" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>CXI Score</span>
                <span className="text-[9px] font-mono font-bold" style={{ color: accentColor }}>{node.region.cxiScore.toFixed(1)} / 5.0</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full" style={{ width: `${(node.region.cxiScore / 5) * 100}%`, backgroundColor: accentColor }} />
              </div>
            </div>

            <Link
              to="/cxi-cases"
              className="flex items-center justify-center gap-1.5 w-full px-3 py-2.5 rounded-lg text-[11px] font-semibold transition-opacity hover:opacity-85"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}40` }}
            >
              View Cases →
            </Link>
          </>
        )}

        {node.kind === "zone" && (
          <div className="space-y-3">
            {/* Zone average CXI bar */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Zone avg CXI</span>
                <span className="text-[9px] font-mono font-bold" style={{ color: cxiTextColor(zoneAvgCxi) }}>
                  {zoneAvgCxi.toFixed(1)} / 5.0
                </span>
              </div>
              <div className="h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(zoneAvgCxi / 5) * 100}%`, backgroundColor: cxiTextColor(zoneAvgCxi) }}
                />
              </div>
            </div>

            {/* Region list with scores */}
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                Regions
              </p>
              <div className="space-y-1.5">
                {zoneRegions.map((region) => {
                  const col = cxiTextColor(region.cxiScore);
                  const status = cxiStatus(region.cxiScore);
                  return (
                    <div
                      key={region.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: `1px solid ${col}25`,
                      }}
                    >
                      {/* Status dot */}
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col }} />

                      {/* Name + status */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate" style={{ color: "#F4F4F5" }}>
                          {region.name}
                        </p>
                        <p className="text-[9px]" style={{ color: col }}>{status}</p>
                      </div>

                      {/* CXI score */}
                      <span
                        className="text-[11px] font-bold font-mono shrink-0"
                        style={{ color: col }}
                      >
                        {region.cxiScore.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div
      className="absolute bottom-5 left-5 flex flex-col gap-2 px-3 py-2.5 rounded-xl pointer-events-none"
      style={{ backgroundColor: "rgba(6,6,16,0.88)", border: "1px solid rgba(59,130,246,0.15)", backdropFilter: "blur(8px)" }}
    >
      <p className="text-[8px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>CXI Impact</p>
      {[
        { label: "Critical  < 3.0", color: "#C0392B" },
        { label: "Degraded < 3.5",  color: "#C0A020" },
        { label: "Healthy  ≥ 3.5",  color: "#2ECC71" },
      ].map(({ label, color }) => (
        <div key={label} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.38)" }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function CxiKnowledgeGraph() {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const regions  = useMemo(() => getRegionSummaries(mockCases), []);
  const positions = useMemo(() => buildPositions(regions), [regions]);

  function select(key: string) {
    setSelectedKey((prev) => (prev === key ? null : key));
  }

  const selectedNode: SelectedNode | null = useMemo(() => {
    if (!selectedKey) return null;
    if (selectedKey === "root") return { kind: "root" };
    const zone = ZONES.find((z) => z.id === selectedKey);
    if (zone) return { kind: "zone", zone };
    const region = regions.find((r) => r.id === selectedKey);
    if (region) return { kind: "leaf", region };
    return null;
  }, [selectedKey, regions]);

  const rootPos = positions["root"]!;

  return (
    <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0, backgroundColor: "#060610" }}>

      {/* Graph canvas */}
      <div
        className="absolute inset-0 overflow-auto"
        style={{ right: selectedNode ? 260 : 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) setSelectedKey(null); }}
      >
        <svg
          width={SVG_W}
          height={SVG_H}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ display: "block", minWidth: "100%", minHeight: "100%" }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedKey(null); }}
        >
          {/* ── Edges: root → zones ── */}
          {ZONES.map((zone) => {
            const zp = positions[zone.id];
            if (!zp) return null;
            const isHl = selectedKey === zone.id || selectedKey === "root";
            return (
              <line
                key={zone.id}
                x1={rootPos.x} y1={rootPos.y}
                x2={zp.x} y2={zp.y}
                style={{ stroke: isHl ? "#3B82F6" : "rgba(59,130,246,0.45)", strokeWidth: isHl ? 1.8 : 1.2 }}
              />
            );
          })}

          {/* ── Edges: zones → leaves ── */}
          {ZONES.map((zone) =>
            zone.regionIds.map((rid) => {
              const zp = positions[zone.id];
              const lp = positions[rid];
              if (!zp || !lp) return null;
              const isHl = selectedKey === rid || selectedKey === zone.id;
              return (
                <line
                  key={`${zone.id}→${rid}`}
                  x1={zp.x} y1={zp.y}
                  x2={lp.x} y2={lp.y}
                  style={{ stroke: isHl ? "#3B82F6" : "rgba(59,130,246,0.35)", strokeWidth: isHl ? 1.5 : 1 }}
                />
              );
            })
          )}

          {/* ── Leaf nodes ── */}
          {ZONES.map((zone) =>
            zone.regionIds.map((rid) => {
              const region = regions.find((r) => r.id === rid);
              const lp = positions[rid];
              if (!region || !lp) return null;
              return (
                <LeafNode
                  key={rid}
                  x={lp.x} y={lp.y}
                  region={region}
                  selected={selectedKey === rid}
                  onClick={() => select(rid)}
                />
              );
            })
          )}

          {/* ── Zone nodes (drawn on top of edges) ── */}
          {ZONES.map((zone) => {
            const zp = positions[zone.id];
            if (!zp) return null;
            return (
              <ZoneNode
                key={zone.id}
                x={zp.x} y={zp.y}
                zone={zone}
                selected={selectedKey === zone.id}
                onClick={() => select(zone.id)}
              />
            );
          })}

          {/* ── Root node (top-most) ── */}
          <RootNode
            x={rootPos.x} y={rootPos.y}
            selected={selectedKey === "root"}
            onClick={() => select("root")}
          />
        </svg>
      </div>

      {/* Detail panel */}
      {selectedNode && <DetailPanel node={selectedNode} regions={regions} onClose={() => setSelectedKey(null)} />}

      <Legend />
    </div>
  );
}
