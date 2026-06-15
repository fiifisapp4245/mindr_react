import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ChevronRight,
  GitBranch,
  Info,
  Layers,
  Radio,
  X,
  Zap,
} from "lucide-react";
import {
  mockCases,
  GERMANY_PATH,
  SCOPE_NODES,
  REGION_ZONES,
  SITES_DATA,
  HOTSPOTS,
  TOP_AFFECTED_CELLS,
  LARGE_MOCK_CASES,
  SCOPE_VIEWBOXES,
  type SiteDetail,
  type Hotspot,
} from "../../data/cxi-mock-store";
import { statusColor, statusBg } from "../cxi/CaseRow";
import { useCxiLens } from "../../contexts/cxi-lens";
import { useCxiScope } from "../../contexts/cxi-scope";
import type { MINDRCase } from "../../types/cxi";

// ── CXI score color ───────────────────────────────────────────────────────────

function cxiColor(score: number) {
  if (score < 3.0) return "var(--color-critical)";
  if (score < 3.5) return "var(--color-warning)";
  return "var(--color-resolved)";
}

function CxiChip({ score, size = "sm" }: { score: number; size?: "xs" | "sm" }) {
  const color = cxiColor(score);
  const px = size === "xs" ? "px-1 py-px text-[9px]" : "px-1.5 py-0.5 text-[10px]";
  return (
    <span
      className={`font-bold rounded ${px}`}
      style={{ color, backgroundColor: `${color}18`, fontFamily: "var(--font-mono)" }}
    >
      {score.toFixed(1)}
    </span>
  );
}

// ── Time window type ──────────────────────────────────────────────────────────

type TimeWindow = "24h" | "48h" | "7d";

// ── Overlay state ─────────────────────────────────────────────────────────────

interface Overlays {
  cases: boolean;
  incidents: boolean;
  changes: boolean;
  knownAreas: boolean;
}

// ── Breadcrumb navigation ─────────────────────────────────────────────────────

function Breadcrumb({
  scopeId,
  onNavigate,
}: {
  scopeId: string;
  onNavigate: (id: string) => void;
}) {
  const node = SCOPE_NODES.find((n) => n.id === scopeId) ?? SCOPE_NODES[0];
  const chain: typeof SCOPE_NODES = [];
  let cur: typeof node | undefined = node;
  while (cur) {
    chain.unshift(cur);
    cur = cur.parentId ? SCOPE_NODES.find((n) => n.id === cur!.parentId) : undefined;
  }

  return (
    <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
      {chain.map((n, i) => (
        <span key={n.id} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={10} />}
          <button
            onClick={() => onNavigate(n.id)}
            className="hover:opacity-80 transition-opacity"
            style={{
              color: i === chain.length - 1 ? "var(--color-text-primary)" : "var(--color-text-muted)",
              fontWeight: i === chain.length - 1 ? 600 : 400,
            }}
          >
            {n.label}
          </button>
        </span>
      ))}
    </div>
  );
}

// ── Overlay toggle row ────────────────────────────────────────────────────────

function OverlayToggles({
  overlays,
  onChange,
}: {
  overlays: Overlays;
  onChange: (o: Partial<Overlays>) => void;
}) {
  const chips: { key: keyof Overlays; label: string; icon: React.ReactNode; activeColor: string }[] = [
    { key: "cases",      label: "Cases",              icon: <AlertTriangle size={10} />, activeColor: "var(--color-warning)"  },
    { key: "incidents",  label: "Incidents",           icon: <Zap size={10} />,           activeColor: "var(--color-critical)" },
    { key: "changes",    label: "Changes",             icon: <GitBranch size={10} />,     activeColor: "var(--color-mitigating)" },
    { key: "knownAreas", label: "Known problem areas", icon: <Info size={10} />,          activeColor: "var(--color-resolved)" },
  ];

  return (
    <div className="flex items-center gap-2">
      {chips.map(({ key, label, icon, activeColor }) => {
        const on = overlays[key];
        return (
          <button
            key={key}
            onClick={() => onChange({ [key]: !on })}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors"
            style={{
              backgroundColor: on ? `${activeColor}15` : "var(--color-bg-elevated)",
              border: `1px solid ${on ? activeColor : "var(--color-border)"}`,
              color: on ? activeColor : "var(--color-text-muted)",
            }}
          >
            {icon}
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Systemic banner ───────────────────────────────────────────────────────────

function SystemicBanner({ pct }: { pct: number }) {
  if (pct <= 30) return null;
  return (
    <div
      className="flex items-center gap-3 px-5 py-2 shrink-0 text-sm font-semibold"
      style={{
        backgroundColor: "rgba(255,176,32,0.08)",
        borderBottom: "1px solid rgba(255,176,32,0.3)",
        color: "#FFB020",
      }}
    >
      <AlertTriangle size={14} />
      Systemic pattern detected · {pct}% of active cases clustered · multi-site investigation recommended
    </div>
  );
}

// ── Component breakdown bar ───────────────────────────────────────────────────

function ComponentBar({ label, current, baseline }: { label: string; current: number; baseline: number }) {
  const pct = Math.round((current / 10) * 100);
  const bPct = Math.round((baseline / 10) * 100);
  const drop = baseline - current;
  const col = drop > 2 ? "var(--color-critical)" : drop > 0.5 ? "var(--color-warning)" : "var(--color-resolved)";
  return (
    <div className="flex items-center gap-2.5 py-1">
      <span className="text-[10px] w-24 shrink-0" style={{ color: "var(--color-text-muted)" }}>{label}</span>
      <div className="flex-1 relative h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all"
          style={{ width: `${bPct}%`, backgroundColor: "rgba(255,255,255,0.1)" }}
        />
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: col }}
        />
      </div>
      <span className="text-[10px] font-bold w-8 text-right shrink-0" style={{ color: col, fontFamily: "var(--font-mono)" }}>
        {current.toFixed(1)}
      </span>
    </div>
  );
}

// ── Site detail panel (right rail) ────────────────────────────────────────────

function SiteDetailPanel({
  site,
  cases,
  onClose,
}: {
  site: SiteDetail;
  cases: MINDRCase[];
  onClose: () => void;
}) {
  const linkedCases = cases.filter(
    (c) => c.affectedScope.region === site.region &&
           (c.affectedScope.siteName === site.name ||
            c.affectedScope.region === site.region)
  ).slice(0, 5);

  // Neighbour interpretation
  const degradedNeighbours = site.neighbors.filter((n) => n.cxiScore < 3.0).length;
  const interpretation =
    degradedNeighbours >= 2
      ? "Neighbours degraded → likely area-wide issue"
      : "Neighbours healthy → likely cell-local fault";

  const trendIcon = site.cxiTrend === "down" ? "↓" : site.cxiTrend === "up" ? "↑" : "→";
  const trendColor =
    site.cxiTrend === "down" ? "var(--color-critical)" :
    site.cxiTrend === "up"   ? "var(--color-resolved)" :
                                "var(--color-text-muted)";

  return (
    <div
      className="flex flex-col overflow-hidden shrink-0"
      style={{
        width: 360,
        borderLeft: "1px solid var(--color-border)",
        backgroundColor: "var(--color-bg-card)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between p-4 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-elevated)" }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
              {site.name}
            </p>
            <span className="text-[10px] font-mono" style={{ color: "var(--color-text-muted)" }}>
              {site.id}
            </span>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {site.city} · {site.region}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-sm font-bold" style={{ color: cxiColor(site.cxiScore), fontFamily: "var(--font-mono)" }}>
              {site.cxiScore.toFixed(1)}
              <span className="text-xs" style={{ color: trendColor }}>{trendIcon}</span>
            </span>
            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
              {linkedCases.length} active {linkedCases.length === 1 ? "case" : "cases"}
            </span>
            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
              ~{site.affectedCustomers.toLocaleString()} affected
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors shrink-0 ml-2"
          style={{ color: "var(--color-text-muted)" }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* Cells / sectors */}
        <div className="p-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "var(--color-text-muted)" }}>
            Cells · Sectors
          </p>
          <div className="space-y-1.5">
            {site.cells.map((cell) => (
              <div key={cell.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg" style={{ backgroundColor: "var(--color-bg-elevated)" }}>
                <Radio size={11} style={{ color: "var(--color-brand)" }} />
                <span className="text-[11px] font-medium flex-1" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>
                  {cell.id}
                </span>
                <span
                  className="text-[9px] font-bold px-1.5 py-px rounded"
                  style={{ backgroundColor: cell.rat === "5G NR" ? "rgba(77,158,255,0.15)" : "rgba(255,255,255,0.06)", color: cell.rat === "5G NR" ? "#4D9EFF" : "var(--color-text-muted)" }}
                >
                  {cell.rat}
                </span>
                <CxiChip score={cell.cxiScore} size="xs" />
              </div>
            ))}
          </div>
        </div>

        {/* CXI component breakdown */}
        <div className="p-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>
            CXI Component Breakdown
          </p>
          {site.components.map((c) => (
            <ComponentBar key={c.label} label={c.label} current={c.current} baseline={c.baseline} />
          ))}
        </div>

        {/* Known-cause check */}
        <div className="p-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "var(--color-text-muted)" }}>
            Known-Cause Check
          </p>
          {site.knownCauses.length === 0 ? (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px dashed var(--color-border)", color: "var(--color-text-muted)" }}
            >
              <Info size={11} />
              No known cause on record — investigation required
            </div>
          ) : (
            <div className="space-y-2">
              {site.knownCauses.map((kc) => {
                const typeColor =
                  kc.type === "incident"   ? "var(--color-critical)"   :
                  kc.type === "change"     ? "var(--color-mitigating)" :
                  kc.type === "ticket"     ? "var(--color-warning)"    :
                                             "var(--color-resolved)";
                const statusStyle =
                  kc.status === "open" || kc.status === "active"
                    ? { color: "var(--color-critical)", bg: "rgba(255,59,59,0.1)" }
                    : { color: "var(--color-resolved)", bg: "rgba(45,212,191,0.1)" };
                return (
                  <div key={kc.id} className="flex items-start gap-2.5 px-3 py-2 rounded-lg" style={{ backgroundColor: "var(--color-bg-elevated)" }}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: typeColor }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold" style={{ color: typeColor, fontFamily: "var(--font-mono)" }}>
                          {kc.id}
                        </span>
                        <span
                          className="text-[9px] font-bold px-1 py-px rounded uppercase"
                          style={{ color: statusStyle.color, backgroundColor: statusStyle.bg }}
                        >
                          {kc.status}
                        </span>
                        {kc.confidence !== undefined && (
                          <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>
                            {kc.confidence}% match
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "var(--color-text-muted)" }}>
                        {kc.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Neighbour cells */}
        <div className="p-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-text-muted)" }}>
            Neighbour Cells
          </p>
          <p
            className="text-[10px] mb-2.5 px-2.5 py-1.5 rounded"
            style={{
              color: degradedNeighbours >= 2 ? "var(--color-warning)" : "var(--color-resolved)",
              backgroundColor: degradedNeighbours >= 2 ? "rgba(255,176,32,0.08)" : "rgba(45,212,191,0.08)",
            }}
          >
            {interpretation}
          </p>
          <div className="space-y-1">
            {site.neighbors.map((nb) => (
              <div key={nb.id} className="flex items-center gap-2.5 px-2 py-1.5">
                <span className="text-[9px] w-6 text-center font-medium" style={{ color: "var(--color-text-muted)" }}>
                  {nb.direction}
                </span>
                <span className="text-[11px] flex-1" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                  {nb.id}
                </span>
                <CxiChip score={nb.cxiScore} size="xs" />
              </div>
            ))}
          </div>
        </div>

        {/* Active cases on this site */}
        <div className="p-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
              Active Cases
            </p>
            {linkedCases.length > 0 && (
              <Link
                to={`/cxi-cases?region=${encodeURIComponent(site.region)}`}
                className="text-[10px] font-medium hover:opacity-80 transition-opacity"
                style={{ color: "var(--color-brand)" }}
              >
                View all →
              </Link>
            )}
          </div>
          {linkedCases.length === 0 ? (
            <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>No active cases at this site</p>
          ) : (
            <div className="space-y-1.5">
              {linkedCases.map((c) => (
                <Link
                  key={c.caseId}
                  to={`/cxi-cases/${c.caseId}`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                  style={{ backgroundColor: "var(--color-bg-elevated)" }}
                >
                  <span className="text-[10px] font-bold shrink-0" style={{ color: "var(--color-brand)", fontFamily: "var(--font-mono)" }}>
                    {c.caseId}
                  </span>
                  <span className="text-[9px] font-bold px-1 py-px rounded flex-shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)" }}>
                    {c.severity}
                  </span>
                  <span className="text-[10px] font-bold shrink-0" style={{ color: cxiColor(4.5 + c.cxiDrop), fontFamily: "var(--font-mono)" }}>
                    {c.cxiDrop.toFixed(1)}
                  </span>
                  <span className="flex-1" />
                  <span
                    className="text-[9px] font-bold px-1.5 py-px rounded-full uppercase shrink-0"
                    style={{ color: statusColor(c.status), backgroundColor: statusBg(c.status) }}
                  >
                    {c.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Affected customers (privacy-safe) */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
            <span>Affected customers (approx):</span>
            <span className="font-bold" style={{ color: site.affectedCustomers > 0 ? "var(--color-warning)" : "var(--color-resolved)" }}>
              {site.affectedCustomers > 0 ? `~${site.affectedCustomers.toLocaleString()}` : "None detected"}
            </span>
          </div>
          <p className="text-[9px] mt-0.5" style={{ color: "var(--color-text-muted)", opacity: 0.6 }}>
            Cell-level aggregate only · no individual customer data rendered
          </p>
        </div>

      </div>
    </div>
  );
}

// ── Left strip: top affected cells ────────────────────────────────────────────

function TopCellsStrip({
  onSelectSite,
  selectedSiteId,
}: {
  onSelectSite: (siteId: string) => void;
  selectedSiteId: string | null;
}) {
  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden"
      style={{ width: 224, borderRight: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
    >
      <div
        className="px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-elevated)" }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
          Top Affected Cells
        </p>
        <p className="text-[9px] mt-0.5" style={{ color: "var(--color-text-muted)", opacity: 0.6 }}>
          Ranked by case concentration
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {TOP_AFFECTED_CELLS.map((tc) => {
          const isSelected = selectedSiteId === tc.siteId;
          return (
            <button
              key={tc.cellId}
              onClick={() => onSelectSite(tc.siteId)}
              className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
              style={{
                borderBottom: "1px solid var(--color-border)",
                backgroundColor: isSelected ? "rgba(226,0,122,0.06)" : "transparent",
                borderLeft: isSelected ? "2px solid var(--color-brand)" : "2px solid transparent",
              }}
            >
              {/* Rank */}
              <span
                className="text-[9px] font-bold w-4 shrink-0 mt-0.5 text-center"
                style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
              >
                {tc.rank}
              </span>

              {/* Cell info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10px] font-medium truncate"
                    style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}
                  >
                    {tc.cellId}
                  </span>
                  <span
                    className="text-[8px] font-bold px-1 rounded shrink-0"
                    style={{
                      backgroundColor: tc.rat === "5G NR" ? "rgba(77,158,255,0.15)" : "rgba(255,255,255,0.06)",
                      color: tc.rat === "5G NR" ? "#4D9EFF" : "var(--color-text-muted)",
                    }}
                  >
                    {tc.rat === "5G NR" ? "5G" : "LTE"}
                  </span>
                </div>
                <p className="text-[9px] truncate mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {tc.siteName}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <CxiChip score={tc.cxiScore} size="xs" />
                  <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>
                    {tc.caseCount} {tc.caseCount === 1 ? "case" : "cases"}
                  </span>
                  {tc.hotspotId && (
                    <span
                      className="text-[8px] font-bold px-1 py-px rounded"
                      style={{ backgroundColor: "rgba(255,176,32,0.15)", color: "#FFB020" }}
                    >
                      HOTSPOT
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {/* All-healthy placeholder */}
        {TOP_AFFECTED_CELLS.length === 0 && (
          <div className="px-4 py-8 text-center">
            <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: "rgba(45,212,191,0.1)" }}>
              <Radio size={14} style={{ color: "var(--color-resolved)" }} />
            </div>
            <p className="text-[11px] font-medium" style={{ color: "var(--color-resolved)" }}>All cells healthy</p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>No active cases detected</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Germany map SVG ───────────────────────────────────────────────────────────

function GermanyMap({
  scopeId,
  sites,
  hotspots,
  overlays,
  selectedSiteId,
  cases,
  onSiteClick,
}: {
  scopeId: string;
  sites: SiteDetail[];
  hotspots: Hotspot[];
  overlays: Overlays;
  selectedSiteId: string | null;
  cases: MINDRCase[];
  onSiteClick: (id: string) => void;
}) {
  const viewBox = SCOPE_VIEWBOXES[scopeId] ?? "0 0 288 296";
  const isCountry = scopeId === "germany";
  const currentNode = SCOPE_NODES.find((n) => n.id === scopeId);
  const isRegionLevel = currentNode?.level === "region";

  // Compute active case count per site
  const casesPerSiteRegion = useMemo(() => {
    const m = new Map<string, number>();
    cases
      .filter((c) => c.status === "pending" || c.status === "escalated")
      .forEach((c) => m.set(c.affectedScope.region, (m.get(c.affectedScope.region) ?? 0) + 1));
    return m;
  }, [cases]);

  // Sites to show depend on scope
  const visibleSites = useMemo(() => {
    if (isCountry) return sites; // show all
    if (currentNode?.level === "region") {
      // show sites in this region
      const regionNode = SCOPE_NODES.find((n) => n.id === scopeId);
      const cityIds = SCOPE_NODES.filter((n) => n.parentId === scopeId).map((n) => n.id);
      const labelMap: Record<string, string> = {
        nrw:        "Cologne/Bonn",
        bavaria:    "Munich Metropolitan",
        "berlin-bb":"Berlin Metropolitan",
        hesse:      "Frankfurt Rhine-Main",
        "hamburg-r":"Hamburg Metropolitan",
      };
      const regionLabel = regionNode ? labelMap[regionNode.id] ?? regionNode.label : "";
      return sites.filter((s) => s.region === regionLabel || cityIds.some((cid) => s.city.toLowerCase().includes(cid)));
    }
    // city / cell level
    const cityNode = SCOPE_NODES.find((n) => n.id === scopeId);
    if (cityNode) {
      return sites.filter((s) => s.city.toLowerCase() === cityNode.label.toLowerCase() || s.region.toLowerCase().includes(cityNode.label.toLowerCase()));
    }
    return sites;
  }, [sites, scopeId, isCountry, currentNode]);

  return (
    <div
      className="flex-1 relative flex items-center justify-center"
      style={{ backgroundColor: "var(--color-bg-base)", minHeight: 0 }}
    >
      <svg
        viewBox={viewBox}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ maxHeight: "100%", transition: "viewBox 0.4s" }}
      >
        {/* Dot grid background */}
        <defs>
          <pattern id="nmDots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="8" cy="8" r="0.55" fill="rgba(255,255,255,0.05)" />
          </pattern>
        </defs>
        <rect x="-1000" y="-1000" width="3000" height="3000" fill="url(#nmDots)" />

        {/* Country outline */}
        <path
          d={GERMANY_PATH}
          fill="rgba(255,255,255,0.03)"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Choropleth region blobs (country view) */}
        {isCountry && REGION_ZONES.map((rz) => {
          const col = cxiColor(rz.cxiScore);
          return (
            <circle
              key={rz.id}
              cx={rz.x}
              cy={rz.y}
              r={rz.r}
              fill={col}
              opacity={0.13}
              style={{ pointerEvents: "none" }}
            />
          );
        })}

        {/* Region boundary highlight when drilled */}
        {isRegionLevel && REGION_ZONES.map((rz) => {
          const active = rz.id === scopeId;
          if (!active) return null;
          return (
            <circle
              key={rz.id}
              cx={rz.x}
              cy={rz.y}
              r={rz.r + 8}
              fill="none"
              stroke="rgba(226,0,122,0.3)"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />
          );
        })}

        {/* Hotspot halos */}
        {overlays.cases && hotspots.map((h) => (
          <g key={h.id}>
            {/* Outer glow */}
            <circle cx={h.x} cy={h.y} r={h.r + 8} fill="#FFB020" opacity={0.05} />
            {/* Dashed halo */}
            <circle
              cx={h.x}
              cy={h.y}
              r={h.r}
              fill="none"
              stroke="#FFB020"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              opacity={0.7}
            />
            {/* Badge background */}
            <rect
              x={h.x - 38}
              y={h.y - h.r - 14}
              width={76}
              height={13}
              rx={4}
              fill="rgba(255,176,32,0.18)"
            />
            {/* Badge text */}
            <text
              x={h.x}
              y={h.y - h.r - 7}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="6"
              fill="#FFB020"
              fontFamily="var(--font-ui)"
              fontWeight="600"
            >
              Hotspot · {h.caseCount} cases · {h.cellCount} cells · {h.windowHours}h
            </text>
          </g>
        ))}

        {/* Site dots */}
        {visibleSites.map((site) => {
          const activeCnt = casesPerSiteRegion.get(site.region) ?? 0;
          const dotR = isCountry ? 5 + Math.min(site.activeCaseCount * 1.2, 8) : 7 + Math.min(site.activeCaseCount * 1.5, 10);
          const col = cxiColor(site.cxiScore);
          const selected = site.id === selectedSiteId;
          const hasIncident = site.knownCauses.some((k) => k.type === "incident" && (k.status === "open" || k.status === "active"));
          const hasChange = site.knownCauses.some((k) => k.type === "change" && k.status === "active");

          return (
            <g key={site.id} onClick={() => onSiteClick(site.id)} style={{ cursor: "pointer" }}>
              {/* Selection ring */}
              {selected && (
                <circle cx={site.x} cy={site.y} r={dotR + 4} fill="none" stroke="#fff" strokeWidth={1.5} opacity={0.6} />
              )}
              {/* Glow */}
              <circle cx={site.x} cy={site.y} r={dotR + 5} fill={col} opacity={0.1} />
              {/* Dot */}
              <circle cx={site.x} cy={site.y} r={dotR} fill={col} opacity={selected ? 1 : 0.85} />
              {/* CXI text (country level only for main sites) */}
              {(isCountry || !isCountry) && (
                <text
                  x={site.x}
                  y={site.y + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={isCountry ? "5.5" : "6"}
                  fontWeight="700"
                  fontFamily="var(--font-mono)"
                  fill="#fff"
                  style={{ pointerEvents: "none" }}
                >
                  {site.cxiScore.toFixed(1)}
                </text>
              )}
              {/* Site label (at region/city zoom) */}
              {!isCountry && (
                <text
                  x={site.x + dotR + 5}
                  y={site.y}
                  dominantBaseline="middle"
                  fontSize="7"
                  fontFamily="var(--font-ui)"
                  fill="var(--color-text-muted)"
                  style={{ pointerEvents: "none" }}
                >
                  {site.name}
                </text>
              )}

              {/* Overlay: Incident glyph */}
              {overlays.incidents && hasIncident && (
                <rect
                  x={site.x + dotR - 1}
                  y={site.y - dotR - 5}
                  width={7}
                  height={7}
                  rx={1.5}
                  fill="var(--color-critical)"
                  opacity={0.95}
                />
              )}
              {/* Overlay: Change glyph */}
              {overlays.changes && hasChange && (
                <polygon
                  points={`${site.x + dotR + 1},${site.y - dotR + 1} ${site.x + dotR + 7},${site.y - dotR + 1} ${site.x + dotR + 4},${site.y - dotR - 4}`}
                  fill="var(--color-mitigating)"
                  opacity={0.9}
                />
              )}
              {/* Overlay: Case count badge */}
              {overlays.cases && activeCnt > 0 && (
                <g>
                  <circle cx={site.x - dotR + 1} cy={site.y - dotR + 1} r={5} fill="var(--color-warning)" />
                  <text
                    x={site.x - dotR + 1}
                    y={site.y - dotR + 1.5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="5"
                    fontWeight="800"
                    fill="#000"
                    style={{ pointerEvents: "none" }}
                  >
                    {Math.min(activeCnt, 99)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Map legend */}
      <div
        className="absolute bottom-3 left-3 flex flex-col gap-1 px-3 py-2 rounded-lg text-[9px]"
        style={{ backgroundColor: "rgba(14,14,18,0.85)", border: "1px solid var(--color-border)" }}
      >
        {[
          { color: "var(--color-resolved)", label: "CXI ≥ 3.5" },
          { color: "var(--color-warning)",  label: "3.0–3.5" },
          { color: "var(--color-critical)", label: "< 3.0" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
          </span>
        ))}
        <span className="flex items-center gap-1.5 mt-0.5" style={{ borderTop: "1px solid var(--color-border)", paddingTop: 4 }}>
          <span className="w-4 h-px border-t border-dashed" style={{ borderColor: "#FFB020" }} />
          <span style={{ color: "#FFB020" }}>Hotspot</span>
        </span>
      </div>

      {/* Overlay glyph legend (visible when overlays are on) */}
      {(overlays.incidents || overlays.changes) && (
        <div
          className="absolute bottom-3 right-3 flex flex-col gap-1 px-3 py-2 rounded-lg text-[9px]"
          style={{ backgroundColor: "rgba(14,14,18,0.85)", border: "1px solid var(--color-border)" }}
        >
          {overlays.incidents && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: "var(--color-critical)" }} />
              <span style={{ color: "var(--color-text-muted)" }}>Incident</span>
            </span>
          )}
          {overlays.changes && (
            <span className="flex items-center gap-1.5">
              <span className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[7px] border-l-transparent border-r-transparent border-b-[#4D9EFF]" />
              <span style={{ color: "var(--color-text-muted)" }}>Change</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── All-healthy empty state ───────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(45,212,191,0.08)" }}>
        <Layers size={20} style={{ color: "var(--color-resolved)" }} />
      </div>
      <p className="text-sm font-semibold" style={{ color: "var(--color-resolved)" }}>No active hotspots</p>
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>All sites within normal CXI range</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CxiTopology() {
  const { lens } = useCxiLens();
  const { scopeId, setScopeId } = useCxiScope();
  const [searchParams] = useSearchParams();
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("48h");
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  // Role-aware overlay defaults per spec (SMC: cases+incidents; RAN: cases+changes)
  const [overlays, setOverlays] = useState<Overlays>(() => ({
    cases:      true,
    incidents:  lens === "smc",
    changes:    lens === "ran",
    knownAreas: false,
  }));

  // Re-apply defaults when lens changes
  useEffect(() => {
    setOverlays((prev) => ({
      ...prev,
      incidents: lens === "smc",
      changes:   lens === "ran",
    }));
  }, [lens]);

  const isHighVolume = searchParams.get("volume") === "high";
  const allCases     = isHighVolume ? [...mockCases, ...LARGE_MOCK_CASES] : mockCases;

  // Derive clustered % for systemic banner
  const activeCases = allCases.filter((c) => c.status === "pending" || c.status === "escalated");
  const regionCounts = new Map<string, number>();
  activeCases.forEach((c) => regionCounts.set(c.affectedScope.region, (regionCounts.get(c.affectedScope.region) ?? 0) + 1));
  const clustered = [...regionCounts.values()].filter((n) => n > 1).reduce((s, n) => s + n, 0);
  const clusteredPct = activeCases.length > 0 ? Math.round((clustered / activeCases.length) * 100) : 0;

  const selectedSite = selectedSiteId ? SITES_DATA.find((s) => s.id === selectedSiteId) ?? null : null;

  function handleSiteClick(id: string) {
    setSelectedSiteId((prev) => (prev === id ? null : id));
  }

  // Drill map scope when top-cells strip selects a site
  function handleStripSelect(siteId: string) {
    setSelectedSiteId(siteId);
    const site = SITES_DATA.find((s) => s.id === siteId);
    if (site) {
      // Navigate to city scope for that site
      const cityNode = SCOPE_NODES.find((n) => n.label.toLowerCase() === site.city.toLowerCase() && n.level === "city");
      if (cityNode) setScopeId(cityNode.id);
    }
  }

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        margin: "-1rem -1.5rem",
        width: "calc(100% + 3rem)",
        height: "calc(100% + 2rem)",
        backgroundColor: "var(--color-bg-base)",
        fontFamily: "var(--font-ui)",
      }}
    >
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
      >
        <div>
          <h1 className="text-lg font-bold leading-none" style={{ color: "var(--color-text-primary)" }}>
            Network model
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              CXI Degradation · RAN view
            </p>
            <span className="opacity-30 text-xs">·</span>
            <Breadcrumb scopeId={scopeId} onNavigate={setScopeId} />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Overlay toggles */}
          <OverlayToggles
            overlays={overlays}
            onChange={(o) => setOverlays((prev) => ({ ...prev, ...o }))}
          />

          {/* Time window */}
          <div
            className="flex items-center gap-px p-px rounded-lg"
            style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
          >
            {(["24h", "48h", "7d"] as const).map((w) => (
              <button
                key={w}
                onClick={() => setTimeWindow(w)}
                className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors"
                style={{
                  backgroundColor: timeWindow === w ? "rgba(255,255,255,0.10)" : "transparent",
                  color: timeWindow === w ? "var(--color-text-primary)" : "var(--color-text-muted)",
                }}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Systemic banner ──────────────────────────────────────────────────── */}
      <SystemicBanner pct={clusteredPct} />

      {/* ── Three-column body ────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Left strip */}
        <TopCellsStrip onSelectSite={handleStripSelect} selectedSiteId={selectedSiteId} />

        {/* Map canvas */}
        {activeCases.length === 0 && !isHighVolume ? (
          <EmptyState />
        ) : (
          <GermanyMap
            scopeId={scopeId}
            sites={SITES_DATA}
            hotspots={HOTSPOTS}
            overlays={overlays}
            selectedSiteId={selectedSiteId}
            cases={allCases}
            onSiteClick={handleSiteClick}
          />
        )}

        {/* Right: site detail panel */}
        {selectedSite && (
          <SiteDetailPanel
            site={selectedSite}
            cases={allCases}
            onClose={() => setSelectedSiteId(null)}
          />
        )}
      </div>
    </div>
  );
}
