import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { kpiCard, kpiValue, kpiValueScale } from "../../lib/animations";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { mockCases, SITE_MARKERS, SCOPE_NODES, MOVERS_BY_WINDOW, GERMANY_PATH, computeKpis, LARGE_MOCK_CASES, type MoverWindow, type Mover } from "../../data/cxi-mock-store";
import { statusColor, statusBg } from "../cxi/CaseRow";
import { Badge } from "../ui/badge";
import { useCxiLens } from "../../contexts/cxi-lens";
import { useCxiScope } from "../../contexts/cxi-scope";
import type { MINDRCase } from "../../types/cxi";

// ── Tooltip shell ─────────────────────────────────────────────────────────────

const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: "#1E1E2A",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  boxShadow: "0 8px 24px rgba(0,0,0,0.55)",
  fontFamily: "'IBM Plex Sans', sans-serif",
  fontSize: 12,
  color: "#F4F4F5",
  padding: "10px 14px",
  minWidth: 160,
  pointerEvents: "none",
};

function TrendTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={{ color: "#F4F4F5", fontSize: 11, marginBottom: 6, fontWeight: 500 }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 2 }}>
          <span style={{ color: "#F4F4F5" }}>{p.name === "score" ? "CXI Score" : "New Cases"}</span>
          <span style={{ color: "#F4F4F5", fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
            {p.name === "score" ? (p.value as number).toFixed(1) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Site color helper ─────────────────────────────────────────────────────────

function siteColor(score: number) {
  if (score < 3.0) return "var(--color-critical)";
  if (score < 3.5) return "var(--color-warning)";
  return "var(--color-resolved)";
}

// ── Inline SVG sparkline ──────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min  = Math.min(...data);
  const max  = Math.max(...data);
  const rng  = max - min || 1;
  const W = 44; const H = 16;
  const pts  = data
    .map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / rng) * (H - 2) - 1}`)
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Threshold-state KPI card ──────────────────────────────────────────────────

type CardState = "normal" | "warning" | "alert";

const STATE_BORDER: Record<CardState, string> = {
  normal:  "var(--color-border)",
  warning: "rgba(255,176,32,0.35)",
  alert:   "rgba(255,59,59,0.35)",
};

const STATE_BG: Record<CardState, string> = {
  normal:  "var(--color-bg-card)",
  warning: "rgba(255,176,32,0.04)",
  alert:   "rgba(255,59,59,0.04)",
};

const STATE_ACCENT: Record<CardState, string> = {
  normal:  "var(--color-text-primary)",
  warning: "#FFB020",
  alert:   "#FF3B3B",
};

interface KpiCardProps {
  label: string;
  value: string | number;
  sub: string;
  state?: CardState;
  extra?: React.ReactNode;
}

function KpiCard({ label, value, sub, state = "normal", extra }: KpiCardProps) {
  // warning/alert values already carry semantic color — scale only to avoid overriding meaning
  const valueVariant = state === "normal" ? kpiValue : kpiValueScale;
  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      variants={kpiCard}
      className="rounded-xl p-4 flex flex-col gap-1.5"
      style={{
        backgroundColor: STATE_BG[state],
        borderWidth: 1,
        borderStyle: "solid",
        // kpiCard variant animates borderColor — seed it with the correct rest color
        borderColor: STATE_BORDER[state],
        minWidth: 0,
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest truncate" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </p>
      <motion.p
        variants={valueVariant}
        className="text-2xl font-bold leading-none"
        style={{ color: STATE_ACCENT[state], fontFamily: "var(--font-mono)" }}
      >
        {value}
      </motion.p>
      {extra}
      <p className="text-[11px] leading-snug" style={{ color: "var(--color-text-muted)" }}>
        {sub}
      </p>
    </motion.div>
  );
}

// ── Dual-bar (known vs unknown) ───────────────────────────────────────────────

function KnownBar({ knownPct, unknownPct }: { knownPct: number; unknownPct: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 flex h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
        <div className="h-full" style={{ width: `${knownPct}%`, backgroundColor: "var(--color-resolved)" }} />
        <div className="h-full" style={{ width: `${unknownPct}%`, backgroundColor: "var(--color-warning)" }} />
      </div>
      <span className="text-[10px] shrink-0" style={{ color: "var(--color-resolved)" }}>{knownPct}% K</span>
      <span className="text-[10px] shrink-0" style={{ color: "var(--color-warning)" }}>{unknownPct}% U</span>
    </div>
  );
}

// ── Filter bar (Change 6a) ────────────────────────────────────────────────────

interface Filters {
  region: string;
  severity: string;
  status: string;
  window: string;
}

const REGIONS_FILTER = ["All regions", "Cologne/Bonn", "Berlin Metropolitan", "Munich Metropolitan",
  "Frankfurt Rhine-Main", "Hamburg Metropolitan", "Stuttgart Baden-Württemberg",
  "Düsseldorf Rhine-Ruhr", "Nuremberg Bavaria", "Bremen Northern",
  "Hannover Lower Saxony", "Leipzig Saxony", "Dresden Saxony"];

function FilterBar({ filters, onChange }: {
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
}) {
  const sel: React.CSSProperties = {
    backgroundColor: "var(--color-bg-elevated)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text-primary)",
    borderRadius: 8,
    padding: "5px 10px",
    fontSize: 12,
    outline: "none",
    cursor: "pointer",
    fontFamily: "var(--font-ui)",
  };
  return (
    <div
      className="flex items-center gap-3 px-6 py-3 shrink-0"
      style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-widest shrink-0" style={{ color: "var(--color-text-muted)" }}>Filter</span>
      <select style={sel} value={filters.region} onChange={(e) => onChange({ region: e.target.value })}>
        {REGIONS_FILTER.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <select style={sel} value={filters.severity} onChange={(e) => onChange({ severity: e.target.value })}>
        {["All severity", "P1", "P2", "P3"].map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select style={sel} value={filters.status} onChange={(e) => onChange({ status: e.target.value })}>
        {["All status", "pending", "approved", "rejected", "escalated", "corrected"].map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select style={sel} value={filters.window} onChange={(e) => onChange({ window: e.target.value })}>
        {["Last 24h", "Last 48h", "Last 7d", "Last 30d"].map((w) => <option key={w} value={w}>{w}</option>)}
      </select>
      {(filters.region !== "All regions" || filters.severity !== "All severity" || filters.status !== "All status" || filters.window !== "Last 7d") && (
        <button
          onClick={() => onChange({ region: "All regions", severity: "All severity", status: "All status", window: "Last 7d" })}
          className="text-[11px] font-medium hover:opacity-80 transition-opacity"
          style={{ color: "var(--color-brand)" }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

// ── Trust strip (Change 2) ────────────────────────────────────────────────────

function TrustStrip({ acceptancePct }: { acceptancePct: number }) {
  const ttaOk  = true; // 4m 12s is below 10m target
  const accOk  = acceptancePct >= 75;
  return (
    <div
      className="flex items-center gap-6 px-1 py-2"
      style={{ color: "var(--color-text-muted)", fontSize: 11 }}
    >
      <span>
        Time to first assessment:{" "}
        <span className="font-semibold" style={{ color: ttaOk ? "var(--color-resolved)" : "var(--color-warning)" }}>
          4m 12s
        </span>
        <span style={{ opacity: 0.5 }}> (target &lt; 10m)</span>
      </span>
      <span className="opacity-30">·</span>
      <span>
        Recommendation acceptance:{" "}
        <span className="font-semibold" style={{ color: accOk ? "var(--color-resolved)" : "var(--color-warning)" }}>
          {acceptancePct}%
        </span>
        <span style={{ opacity: 0.5 }}> (target &gt; 75%)</span>
      </span>
    </div>
  );
}

// ── Trend chart with scope (Changes 4 & 7) ────────────────────────────────────

const SCOPE_OPTIONS = SCOPE_NODES.filter((n) => n.level !== "cell");

function TrendChart({
  scopeId,
  onScopeChange,
  caseScale = 1,
}: {
  scopeId: string;
  onScopeChange: (id: string) => void;
  caseScale?: number;
}) {
  const scope = SCOPE_NODES.find((n) => n.id === scopeId) ?? SCOPE_NODES[0];
  // 0c: scale daily case bars to match volume dataset
  const trendData = caseScale <= 1
    ? scope.trendData
    : scope.trendData.map((pt) => ({ ...pt, cases: Math.round(pt.cases * caseScale) }));
  const parentChain: string[] = [];
  let cur: typeof scope | undefined = scope;
  while (cur) {
    parentChain.unshift(cur.label);
    cur = cur.parentId ? SCOPE_NODES.find((n) => n.id === cur!.parentId) : undefined;
  }
  const scopeLabel = parentChain.join(" › ");

  return (
    <div
      className="rounded-xl p-5 flex flex-col"
      style={{ flex: "65 1 0%", backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
              Network CXI Score — 7 day trend
            </p>
          </div>
          {/* Score + delta */}
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold" style={{ color: "var(--color-brand)", fontFamily: "var(--font-mono)" }}>
              {scope.cxiScore.toFixed(1)} / 5
            </span>
            <span className="text-sm font-semibold" style={{ color: "var(--color-critical)" }}>
              ↓ {scope.delta.toFixed(1)} vs last week
            </span>
          </div>
          {/* Scope breadcrumb */}
          <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Network average · {scopeLabel} · last 7 days
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Scope selector */}
          <div className="relative flex items-center gap-1">
            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Scope:</span>
            <div className="relative">
              <select
                value={scopeId}
                onChange={(e) => onScopeChange(e.target.value)}
                className="appearance-none pl-2 pr-6 py-1 rounded-md text-[11px] font-medium cursor-pointer"
                style={{
                  backgroundColor: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                  fontFamily: "var(--font-ui)",
                }}
              >
                {SCOPE_OPTIONS.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.level === "country" ? "Country" : n.level === "region" ? "Region" : "City"}: {n.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={9} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-text-muted)" }} />
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-px" style={{ backgroundColor: "#E2007A", display: "inline-block" }} />
              CXI Score
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "rgba(255,176,32,0.35)", display: "inline-block" }} />
              New Cases
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-px border-t border-dashed" style={{ borderColor: "rgba(226,0,122,0.4)", display: "inline-block" }} />
              Target 4.0
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1" style={{ minHeight: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "var(--color-text-muted)", fontFamily: "var(--font-ui)" }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              yAxisId="score"
              domain={[2.5, 5]}
              tick={{ fontSize: 10, fill: "var(--color-text-muted)", fontFamily: "var(--font-ui)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="cases"
              orientation="right"
              tick={{ fontSize: 10, fill: "var(--color-text-muted)", fontFamily: "var(--font-ui)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<TrendTooltip />} />
            <ReferenceLine
              yAxisId="score"
              y={4.0}
              stroke="rgba(226,0,122,0.35)"
              strokeDasharray="4 3"
              label={{ value: "Target 4.0", position: "right", fontSize: 9, fill: "rgba(226,0,122,0.55)" }}
            />
            <Bar yAxisId="cases" dataKey="cases" fill="rgba(255,176,32,0.22)" radius={[2, 2, 0, 0]} />
            <Line
              yAxisId="score"
              dataKey="score"
              stroke="#E2007A"
              strokeWidth={2}
              dot={{ r: 3, fill: "#E2007A", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Biggest Movers panel (Change 5, replaces StatusPie) ──────────────────────

function BiggestMovers() {
  const navigate = useNavigate();
  const [window, setWindow] = useState<MoverWindow>("48h");
  const [tab, setTab]       = useState<"degraded" | "improved">("degraded");

  const { degraded, improved } = MOVERS_BY_WINDOW[window];
  const movers = tab === "degraded" ? degraded : improved;

  function goToCase(mover: Mover) {
    navigate(`/cxi-cases?region=${encodeURIComponent(mover.region)}`);
  }

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ flex: "35 1 0%", backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-elevated)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
          Biggest Movers
        </p>
        {/* Window selector */}
        <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          {(["24h", "48h", "7d"] as const).map((w) => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              className="px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors"
              style={{
                backgroundColor: window === w ? "rgba(255,255,255,0.1)" : "transparent",
                color: window === w ? "var(--color-text-primary)" : "var(--color-text-muted)",
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex shrink-0" style={{ borderBottom: "1px solid var(--color-border)" }}>
        {(["degraded", "improved"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-colors"
            style={{
              color: tab === t
                ? (t === "degraded" ? "#FF3B3B" : "#2DD4BF")
                : "var(--color-text-muted)",
              borderBottom: tab === t
                ? `2px solid ${t === "degraded" ? "#FF3B3B" : "#2DD4BF"}`
                : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {t === "degraded"
              ? <><TrendingDown size={11} /> Degraded most</>
              : <><TrendingUp size={11} /> Improved most</>
            }
          </button>
        ))}
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {movers.map((m, i) => {
          const isDown = m.delta < 0;
          const deltaColor = isDown ? "#FF3B3B" : "#2DD4BF";
          return (
            <button
              key={i}
              onClick={() => goToCase(m)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors text-left"
              style={{ borderBottom: i < movers.length - 1 ? "1px solid var(--color-border)" : "none" }}
            >
              {/* Cell + city */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                  {m.cellName}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {m.city}
                  {m.caseCount > 0 && (
                    <span style={{ color: "var(--color-warning)", marginLeft: 4 }}>
                      · {m.caseCount} {m.caseCount === 1 ? "case" : "cases"}
                    </span>
                  )}
                </p>
              </div>

              {/* Scores */}
              <div className="text-[10px] shrink-0 text-right">
                <span style={{ color: "var(--color-text-muted)" }}>{m.fromScore.toFixed(1)}</span>
                <span style={{ color: "var(--color-text-muted)", margin: "0 2px" }}>→</span>
                <span style={{ color: deltaColor, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{m.toScore.toFixed(1)}</span>
              </div>

              {/* Delta chip */}
              <Badge
                className="font-bold px-1.5 py-0.5 shrink-0 justify-center"
                style={{
                  backgroundColor: isDown ? "rgba(255,59,59,0.12)" : "rgba(45,212,191,0.12)",
                  color: deltaColor,
                  fontFamily: "var(--font-mono)",
                  minWidth: 38,
                }}
              >
                {isDown ? "" : "+"}{m.delta.toFixed(1)}
              </Badge>

              {/* Sparkline */}
              <Sparkline data={m.sparkline} color={deltaColor} />

              <ChevronRight size={11} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Top sites map (case counts now derived from store) ────────────────────────

function TopSitesMap({ cases }: { cases: MINDRCase[] }) {
  const siteImpact = useMemo(() => {
    const map = new Map<string, number>();
    cases.forEach((c) => map.set(c.affectedScope.region, (map.get(c.affectedScope.region) ?? 0) + Math.abs(c.cxiDrop)));
    return map;
  }, [cases]);

  const casesPerRegion = useMemo(() => {
    const map = new Map<string, number>();
    cases.forEach((c) => map.set(c.affectedScope.region, (map.get(c.affectedScope.region) ?? 0) + 1));
    return map;
  }, [cases]);

  const sorted = [...SITE_MARKERS].sort((a, b) => a.cxiScore - b.cxiScore);

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
    >
      <div
        className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-elevated)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
          Top Affected Sites
        </p>
        <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          {[
            { color: "var(--color-resolved)", label: "≥ 3.5" },
            { color: "var(--color-warning)",  label: "3.0–3.5" },
            { color: "var(--color-critical)", label: "< 3.0" },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* SVG map */}
        <div className="flex-1 flex items-center justify-center p-4">
          <svg viewBox="0 0 288 296" width="100%" style={{ maxHeight: 240 }}>
            <defs>
              <pattern id="dotGrid2" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="8" cy="8" r="0.6" fill="rgba(255,255,255,0.06)" />
              </pattern>
            </defs>
            <rect width="288" height="296" fill="url(#dotGrid2)" />
            <path d={GERMANY_PATH} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinejoin="round" />
            {SITE_MARKERS.map((m) => {
              const impact = siteImpact.get(m.region) ?? 0;
              const col    = siteColor(m.cxiScore);
              const r      = 5 + Math.min(impact * 1.0, 10);
              return (
                <g key={m.city}>
                  <circle cx={m.x} cy={m.y} r={r + 5} fill={col} opacity="0.1" />
                  <circle cx={m.x} cy={m.y} r={r}     fill={col} opacity="0.9" />
                  <text x={m.x} y={m.y + 1} textAnchor="middle" dominantBaseline="middle"
                    fontSize="7" fontFamily="var(--font-mono)" fontWeight="700" fill="#fff">
                    {m.cxiScore.toFixed(1)}
                  </text>
                  <text x={m.x + r + 6} y={m.y} dominantBaseline="middle"
                    fontSize="7.5" fontFamily="var(--font-ui)" fontWeight="500" fill="var(--color-text-muted)">
                    {m.displayLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Site list — counts now from actual data */}
        <div className="shrink-0 flex flex-col justify-center" style={{ width: 160, borderLeft: "1px solid var(--color-border)" }}>
          {sorted.map((m) => {
            const col   = siteColor(m.cxiScore);
            const count = casesPerRegion.get(m.region) ?? 0;
            return (
              <div
                key={m.city}
                className="flex items-center justify-between px-3 py-2.5"
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                    {m.displayLabel}
                  </p>
                  <p className="text-[9px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {count} {count === 1 ? "case" : "cases"}
                  </p>
                </div>
                <span className="text-[11px] font-bold shrink-0 ml-2" style={{ color: col, fontFamily: "var(--font-mono)" }}>
                  {m.cxiScore.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Recent cases (capped at 5, Change 6b) ─────────────────────────────────────

function RecentCases({ cases }: { cases: MINDRCase[] }) {
  const top5 = useMemo(
    () =>
      [...cases]
        .sort((a, b) => {
          const sevOrder = { P1: 0, P2: 1, P3: 2 };
          const sa = sevOrder[a.severity as keyof typeof sevOrder] ?? 3;
          const sb = sevOrder[b.severity as keyof typeof sevOrder] ?? 3;
          if (sa !== sb) return sa - sb;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .slice(0, 5),
    [cases],
  );

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
    >
      <div
        className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-elevated)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
          Recent Cases
        </p>
        <Link
          to="/cxi-cases"
          className="flex items-center gap-1 text-[11px] font-medium hover:opacity-80 transition-opacity"
          style={{ color: "var(--color-brand)" }}
        >
          View all ({cases.length}) <ArrowRight size={11} />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        {top5.map((c) => (
          <Link
            key={c.caseId}
            to={`/cxi-cases/${c.caseId}`}
            className="flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold" style={{ color: "var(--color-brand)", fontFamily: "var(--font-mono)" }}>
                {c.caseId}
              </p>
              <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>
                {c.affectedScope.cellName} · {c.affectedScope.region}
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 ml-3">
              <span
                className="text-[10px] font-bold px-1.5 py-px rounded"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
              >
                {c.severity}
              </span>
              <span
                className="text-xs font-bold"
                style={{ color: Math.abs(c.cxiDrop) > 2 ? "var(--color-critical)" : "var(--color-warning)", fontFamily: "var(--font-mono)" }}
              >
                {c.cxiDrop.toFixed(1)}
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ color: statusColor(c.status), backgroundColor: statusBg(c.status) }}
              >
                {c.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export function CxiDashboard() {
  const { lens } = useCxiLens();
  const { scopeId, setScopeId } = useCxiScope();
  const [searchParams] = useSearchParams();
  const [filters, setFilters]   = useState<Filters>({
    region:   "All regions",
    severity: "All severity",
    status:   "All status",
    window:   "Last 7d",
  });

  // Scale-readiness toggle: ?volume=high
  const isHighVolume = searchParams.get("volume") === "high";
  const baseCases    = isHighVolume ? [...mockCases, ...LARGE_MOCK_CASES] : mockCases;
  // 0c: scale trend chart case bars proportionally to volume dataset
  const caseScale    = isHighVolume ? Math.max(1, Math.round(baseCases.length / 15)) : 1;

  const filteredCases = useMemo(() => {
    return baseCases.filter((c) => {
      if (filters.region   !== "All regions"  && c.affectedScope.region !== filters.region)  return false;
      if (filters.severity !== "All severity" && c.severity             !== filters.severity) return false;
      if (filters.status   !== "All status"   && c.status               !== filters.status)   return false;
      return true;
    });
  }, [baseCases, filters]);

  const kpis = useMemo(() => computeKpis(filteredCases), [filteredCases]);

  // Acceptance rate: approved / (approved + rejected) for reviewed cases
  const reviewed  = filteredCases.filter((c) => ["approved", "rejected"].includes(c.status));
  const approved  = reviewed.filter((c) => c.status === "approved").length;
  const acceptPct = reviewed.length > 0 ? Math.round((approved / reviewed.length) * 100) : 78;

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-base)", fontFamily: "var(--font-ui)" }}
    >
      {/* Filter bar */}
      <FilterBar filters={filters} onChange={(f) => setFilters((prev) => ({ ...prev, ...f }))} />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

        {/* Page header — NO Scenario 2 badge (Change 1a) */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold leading-none" style={{ color: "var(--color-text-primary)" }}>
              Dashboard
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
              CXI Degradation · network overview
            </p>
          </div>
          {isHighVolume && (
            <div
              className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md"
              style={{ backgroundColor: "rgba(77,158,255,0.1)", border: "1px solid rgba(77,158,255,0.2)", color: "#4D9EFF" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#4D9EFF" }} />
              Volume mode · {baseCases.length.toLocaleString()} cases
            </div>
          )}
        </div>

        {/* KPI row — role-aware (Change 2) */}
        <div>
          <div className={`grid gap-3 ${lens === "smc" ? "grid-cols-5" : "grid-cols-5"}`}>
            {/* Shared card */}
            <KpiCard
              label="Total Active Cases"
              value={kpis.active}
              sub={`vs 7-day baseline of ${kpis.baseline}`}
              state={kpis.active > kpis.baseline ? "alert" : "normal"}
            />

            {lens === "smc" ? (
              <>
                <KpiCard
                  label="High Severity Cases"
                  value={`${kpis.highSev} · ${kpis.total > 0 ? Math.round((kpis.highSev / kpis.total) * 100) : 0}%`}
                  sub="CXI < 2 OR drop > 2 pts · definition P1"
                  state={kpis.highSev > 0 ? "alert" : "normal"}
                />
                <KpiCard
                  label="Needs Incident Action"
                  value={kpis.needsAction}
                  sub="Active P1 with no ticket coverage"
                  state={kpis.needsAction > 0 ? "alert" : "normal"}
                />
                <KpiCard
                  label="Duplicate Risk"
                  value={`${kpis.dupRiskPct}%`}
                  sub="Cases with existing ticket overlap · target < 15%"
                  state={kpis.dupRiskPct >= 15 ? "warning" : "normal"}
                />
                <KpiCard
                  label="Known vs Unknown"
                  value={`${kpis.knownPct}% / ${kpis.unknownPct}%`}
                  sub="High unknown = investigation gap"
                  state={kpis.unknownPct > 30 ? "warning" : "normal"}
                  extra={<KnownBar knownPct={kpis.knownPct} unknownPct={kpis.unknownPct} />}
                />
              </>
            ) : (
              <>
                <KpiCard
                  label="Clustered / Hotspots"
                  value={`${kpis.clusteredPct}%`}
                  sub="Cases in same area/time — > 30% = systemic"
                  state={kpis.clusteredPct > 30 ? "alert" : "normal"}
                />
                <KpiCard
                  label="Top Cell Concentration"
                  value={`${kpis.top5Pct}%`}
                  sub="Top 5 regions share of active cases"
                  state={kpis.top5Pct > 60 ? "warning" : "normal"}
                />
                <KpiCard
                  label="Change-Linked Cases"
                  value={`${kpis.changeLinkPct}%`}
                  sub="Correlated with recent config changes · > 20% = warning"
                  state={kpis.changeLinkPct > 20 ? "warning" : "normal"}
                />
                <KpiCard
                  label="Routed to Optimization"
                  value={`${kpis.routedOpt} · ${kpis.routedOptPct}%`}
                  sub="Cases routed to RAN/capacity queue"
                  state="normal"
                />
              </>
            )}
          </div>

          {/* Trust strip (Change 2) */}
          <div className="mt-2">
            <TrustStrip acceptancePct={acceptPct} />
          </div>
        </div>

        {/* Row 2: Trend chart + Biggest Movers (donut REMOVED, Change 5) */}
        <div className="flex gap-4" style={{ minHeight: 270 }}>
          <TrendChart scopeId={scopeId} onScopeChange={setScopeId} caseScale={caseScale} />
          <BiggestMovers />
        </div>

        {/* Row 3: Map + Recent Cases */}
        <div className="grid grid-cols-2 gap-4" style={{ minHeight: 300 }}>
          <TopSitesMap cases={filteredCases} />
          <RecentCases cases={filteredCases} />
        </div>

        {/* Scale-readiness dev toggle (Change 6c) */}
        <div
          className="flex items-center justify-between px-4 py-2.5 rounded-lg"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
            Dev · Scale readiness
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
              Simulate 1,000-case volume
            </span>
            <a
              href={isHighVolume ? "?" : "?volume=high"}
              className="text-[11px] font-semibold px-3 py-1 rounded-md hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: isHighVolume ? "rgba(77,158,255,0.15)" : "rgba(255,255,255,0.06)",
                color: isHighVolume ? "#4D9EFF" : "var(--color-text-primary)",
                border: `1px solid ${isHighVolume ? "rgba(77,158,255,0.3)" : "var(--color-border)"}`,
                textDecoration: "none",
              }}
            >
              {isHighVolume ? "High volume ON" : "Enable high volume"}
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
