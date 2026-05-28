import { useState, useMemo } from "react";
import { ChevronRight, ChevronDown, Map as MapIcon, LayoutList, MapPin, Radio, Server, Users } from "lucide-react";
import { mockCases } from "../../data/cxi-cases";
import { Link } from "react-router-dom";
import { statusColor, statusBg } from "../cxi/CaseRow";
import type { MINDRCase } from "../../types/cxi";
import { TopologyMap } from "../topology/TopologyMap";

// ── Build hierarchy from mock cases ──────────────────────────────────────────

interface ClusterNode {
  id: string;
  name: string;
  cxiScore: number;
  cases: MINDRCase[];
}

interface CellNode {
  id: string;
  name: string;
  cxiScore: number;
  cases: MINDRCase[];
  clusters: ClusterNode[];
}

interface SiteNode {
  id: string;
  name: string;
  region: string;
  cxiScore: number;
  cases: MINDRCase[];
  cells: CellNode[];
}

interface RegionNode {
  id: string;
  name: string;
  cxiScore: number;
  sites: SiteNode[];
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

  const avgDrop = (cs: MINDRCase[]) =>
    cs.length > 0 ? 4.5 + cs.reduce((s, c) => s + c.cxiDrop, 0) / cs.length : 4.5;

  return Array.from(regionMap.entries()).map(([region, siteMap]) => {
    const sites: SiteNode[] = Array.from(siteMap.entries()).map(([siteName, cellMap]) => {
      const cells: CellNode[] = Array.from(cellMap.entries()).map(([cellName, cellCases]) => ({
        id: cellName,
        name: cellName,
        cxiScore: parseFloat(avgDrop(cellCases).toFixed(1)),
        cases: cellCases,
        clusters: [
          { id: `${cellName}-CLU-A`, name: `${cellName.slice(-4)}-Cluster-A`, cxiScore: parseFloat((avgDrop(cellCases) - 0.2).toFixed(1)), cases: cellCases },
        ],
      }));
      const allCases = cells.flatMap((c) => c.cases);
      return {
        id: siteName,
        name: siteName,
        region,
        cxiScore: parseFloat(avgDrop(allCases).toFixed(1)),
        cases: allCases,
        cells,
      };
    });
    const allSiteCases = sites.flatMap((s) => s.cases);
    return {
      id: region,
      name: region,
      cxiScore: parseFloat(avgDrop(allSiteCases).toFixed(1)),
      sites,
    };
  });
}

// ── CXI score badge ───────────────────────────────────────────────────────────

function CxiScore({ score }: { score: number }) {
  const color = score < 3.0 ? "var(--color-critical)" : score < 3.5 ? "var(--color-warning)" : "var(--color-resolved)";
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
      style={{ color, backgroundColor: `${color}15`, fontFamily: "var(--font-mono)" }}
    >
      {score.toFixed(1)}
    </span>
  );
}

// ── Cluster row ───────────────────────────────────────────────────────────────

function ClusterRow({ node }: { node: ClusterNode }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2 ml-24"
      style={{ borderBottom: "1px solid var(--color-border)" }}
    >
      <span className="w-px h-4 ml-1" style={{ backgroundColor: "var(--color-border)", display: "inline-block" }} />
      <Server size={11} style={{ color: "var(--color-text-muted)" }} className="shrink-0" />
      <p className="text-[11px] flex-1" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
        {node.name}
      </p>
      <CxiScore score={node.cxiScore} />
      <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
        {node.cases.length} case{node.cases.length !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

// ── Cell row ─────────────────────────────────────────────────────────────────

function CellRow({ node, showClusters }: { node: CellNode; showClusters: boolean }) {
  const [open, setOpen] = useState(false);
  const activeCases = node.cases.filter((c) => c.status === "pending");

  return (
    <>
      <div
        className="flex items-center gap-3 px-4 py-2.5 ml-12 cursor-pointer hover:bg-white/4 transition-colors"
        style={{ borderBottom: "1px solid var(--color-border)" }}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="w-px h-4 ml-2" style={{ backgroundColor: "var(--color-border)", display: "inline-block" }} />
        {open ? <ChevronDown size={11} style={{ color: "var(--color-text-muted)" }} /> : <ChevronRight size={11} style={{ color: "var(--color-text-muted)" }} />}
        <Radio size={12} style={{ color: "var(--color-brand)" }} className="shrink-0" />
        <p className="text-xs font-medium flex-1" style={{ color: "var(--color-text-primary)" }}>
          {node.name}
        </p>
        {activeCases.length > 0 && (
          <span
            className="text-[9px] font-bold px-1.5 py-px rounded-full"
            style={{ backgroundColor: "var(--mindr-pending)", color: "#fff" }}
          >
            {activeCases.length} pending
          </span>
        )}
        <CxiScore score={node.cxiScore} />
        <span className="text-[10px] w-16 text-right" style={{ color: "var(--color-text-muted)" }}>
          {node.cases.length} case{node.cases.length !== 1 ? "s" : ""}
        </span>
      </div>

      {open && showClusters && node.clusters.map((cl) => (
        <ClusterRow key={cl.id} node={cl} />
      ))}

      {open && (
        <div className="ml-24 px-4 py-2" style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-elevated)" }}>
          {node.cases.slice(0, 3).map((c) => (
            <Link
              key={c.caseId}
              to={`/cxi-cases/${c.caseId}`}
              className="flex items-center justify-between py-1.5 hover:opacity-80 transition-opacity"
            >
              <span className="text-[10px]" style={{ color: "var(--color-brand)", fontFamily: "var(--font-mono)" }}>
                {c.caseId}
              </span>
              <span
                className="text-[9px] font-bold px-1.5 py-px rounded-full uppercase"
                style={{ color: statusColor(c.status), backgroundColor: statusBg(c.status) }}
              >
                {c.status}
              </span>
            </Link>
          ))}
          {node.cases.length > 3 && (
            <Link to="/cxi-cases" className="text-[10px] mt-1 block" style={{ color: "var(--color-text-muted)" }}>
              +{node.cases.length - 3} more cases
            </Link>
          )}
        </div>
      )}
    </>
  );
}

// ── Site row ──────────────────────────────────────────────────────────────────

function SiteRow({ node }: { node: SiteNode }) {
  const [open, setOpen] = useState(false);
  const pendingCount = node.cases.filter((c) => c.status === "pending").length;

  return (
    <>
      <div
        className="flex items-center gap-3 px-4 py-3 ml-6 cursor-pointer hover:bg-white/4 transition-colors"
        style={{ borderBottom: "1px solid var(--color-border)" }}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="w-px h-4 ml-1" style={{ backgroundColor: "var(--color-border)", display: "inline-block" }} />
        {open ? <ChevronDown size={12} style={{ color: "var(--color-text-muted)" }} /> : <ChevronRight size={12} style={{ color: "var(--color-text-muted)" }} />}
        <MapPin size={13} style={{ color: "#1A5A8A" }} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>{node.name}</p>
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{node.cells.length} cells</p>
        </div>
        {pendingCount > 0 && (
          <span
            className="text-[9px] font-bold px-1.5 py-px rounded-full"
            style={{ backgroundColor: "rgba(180,80,0,0.2)", color: "var(--mindr-pending)" }}
          >
            {pendingCount} pending
          </span>
        )}
        <CxiScore score={node.cxiScore} />
        <span className="text-[10px] w-16 text-right" style={{ color: "var(--color-text-muted)" }}>
          {node.cases.length} case{node.cases.length !== 1 ? "s" : ""}
        </span>
      </div>
      {open && node.cells.map((cell) => (
        <CellRow key={cell.id} node={cell} showClusters={false} />
      ))}
    </>
  );
}

// ── Region row ────────────────────────────────────────────────────────────────

function RegionRow({ node }: { node: RegionNode }) {
  const [open, setOpen] = useState(true);
  const pendingCount = node.sites.flatMap((s) => s.cases).filter((c) => c.status === "pending").length;
  const totalCases = node.sites.reduce((s, st) => s + st.cases.length, 0);

  return (
    <>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/4 transition-colors"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: open ? "var(--color-bg-elevated)" : undefined }}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDown size={14} style={{ color: "var(--color-text-secondary)" }} /> : <ChevronRight size={14} style={{ color: "var(--color-text-secondary)" }} />}
        <Users size={14} style={{ color: "var(--color-brand)" }} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>{node.name}</p>
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{node.sites.length} sites</p>
        </div>
        {pendingCount > 0 && (
          <span
            className="text-[10px] font-bold px-2 py-px rounded-full"
            style={{ backgroundColor: "rgba(180,80,0,0.2)", color: "var(--mindr-pending)" }}
          >
            {pendingCount} pending
          </span>
        )}
        <CxiScore score={node.cxiScore} />
        <span className="text-[10px] w-16 text-right font-medium" style={{ color: "var(--color-text-secondary)" }}>
          {totalCases} case{totalCases !== 1 ? "s" : ""}
        </span>
      </div>
      {open && node.sites.map((site) => (
        <SiteRow key={site.id} node={site} />
      ))}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

// ── List view (original tree) ─────────────────────────────────────────────────

function ListView() {
  const [affectedOnly, setAffectedOnly] = useState(false);
  const [search, setSearch] = useState("");

  const hierarchy = useMemo(() => {
    let cases = mockCases;
    if (affectedOnly) cases = cases.filter((c) => c.status === "pending" || c.severity === "P1");
    if (search.trim()) {
      const q = search.toLowerCase();
      cases = cases.filter(
        (c) =>
          c.affectedScope.region.toLowerCase().includes(q) ||
          c.affectedScope.siteName.toLowerCase().includes(q) ||
          c.affectedScope.cellName.toLowerCase().includes(q)
      );
    }
    return buildHierarchy(cases);
  }, [affectedOnly, search]);

  const totals = useMemo(() => ({
    regions: hierarchy.length,
    sites: hierarchy.reduce((s, r) => s + r.sites.length, 0),
    cells: hierarchy.reduce((s, r) => s + r.sites.reduce((ss, st) => ss + st.cells.length, 0), 0),
  }), [hierarchy]);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-5">
      {/* Filters */}
      <div className="flex items-center justify-between mb-5 gap-4">
        <div className="flex items-center gap-3">
          {[
            { icon: Users,  label: "Regions", value: totals.regions },
            { icon: MapPin, label: "Sites",   value: totals.sites   },
            { icon: Radio,  label: "Cells",   value: totals.cells   },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
              <Icon size={12} style={{ color: "var(--color-text-muted)" }} />
              <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
              <span className="font-bold" style={{ color: "var(--color-text-primary)" }}>{value}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--color-text-secondary)" }}>
            <input type="checkbox" checked={affectedOnly} onChange={(e) => setAffectedOnly(e.target.checked)} className="w-3.5 h-3.5 accent-pink-600" />
            Affected only
          </label>
          <input
            type="text"
            placeholder="Search region, site, cell…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs outline-none"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", width: 200 }}
          />
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center gap-3 px-4 py-2" style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-elevated)" }}>
          <span className="flex-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Node</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>CXI Score</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest w-16 text-right" style={{ color: "var(--color-text-muted)" }}>Cases</span>
        </div>
        {hierarchy.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No nodes match the current filter.</p>
          </div>
        ) : (
          hierarchy.map((region) => <RegionRow key={region.id} node={region} />)
        )}
      </div>
    </div>
  );
}

// ── Main export with Graph / List toggle ──────────────────────────────────────

export function CxiTopology() {
  const [view, setView] = useState<"graph" | "list">("graph");

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        margin: "-1rem -1.5rem",
        width: "calc(100% + 3rem)",
        height: "calc(100% + 2rem)",
        backgroundColor: "var(--color-bg-base)",
        fontFamily: "var(--font-ui)",
      }}
    >
      {/* Shared header */}
      <div
        className="flex items-center justify-between px-8 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div>
          <h1 className="text-2xl font-bold leading-none" style={{ color: "var(--color-text-primary)" }}>
            Topology
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Region → Site → Cell → Cluster — CXI impact view
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Graph / List toggle */}
          <div
            className="flex items-center p-0.5 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
          >
            {([
              { id: "graph", icon: MapIcon,      label: "Map" },
              { id: "list",  icon: LayoutList, label: "List"  },
            ] as const).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                style={{
                  backgroundColor: view === id ? "var(--color-bg-card)" : "transparent",
                  color: view === id ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  border: view === id ? "1px solid var(--color-border)" : "1px solid transparent",
                }}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>

          {/* Scenario badge */}
          <span
            className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md"
            style={{ backgroundColor: "rgba(255,176,32,0.1)", border: "1px solid rgba(255,176,32,0.2)", color: "var(--color-warning)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--color-warning)" }} />
            Scenario 2
          </span>
        </div>
      </div>

      {view === "graph" ? <TopologyMap /> : <ListView />}
    </div>
  );
}
