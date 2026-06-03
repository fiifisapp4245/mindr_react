import { useMemo } from "react";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { mockCases } from "../../data/cxi-cases";
import { statusColor, statusBg } from "../cxi/CaseRow";

// ── CXI scale is 0 – 5 (5 = perfect) ─────────────────────────────────────────

const CXI_TREND = [
  { day: "21 May", score: 4.1, cases: 2  },
  { day: "22 May", score: 3.9, cases: 4  },
  { day: "23 May", score: 3.7, cases: 6  },
  { day: "24 May", score: 3.4, cases: 9  },
  { day: "25 May", score: 3.2, cases: 11 },
  { day: "26 May", score: 3.0, cases: 14 },
  { day: "27 May", score: 3.2, cases: 12 },
  { day: "28 May", score: 3.4, cases: 10 },
];

// ── German city positions (normalized to 280×320 map space) ──────────────────

const SITE_MARKERS = [
  { site: "Hamburg North",   region: "Hamburg North",   x: 105, y: 48,  cxiScore: 3.8 },
  { site: "Berlin Central",  region: "Berlin East",     x: 206, y: 98,  cxiScore: 3.1 },
  { site: "Cologne West Hub",region: "Cologne West",    x: 68,  y: 140, cxiScore: 2.9 },
  { site: "Frankfurt Metro", region: "Frankfurt Metro", x: 118, y: 168, cxiScore: 3.3 },
  { site: "Munich South",    region: "Munich South",    x: 162, y: 258, cxiScore: 3.6 },
];

function siteColor(score: number) {
  if (score < 3.0) return "var(--color-critical)";
  if (score < 3.5) return "var(--color-warning)";
  return "var(--color-resolved)";
}

// ── Germany outline SVG path (simplified) ────────────────────────────────────

const GERMANY_PATH =
  "M 95,28 L 108,18 L 130,14 L 150,14 L 168,14 L 182,18 L 200,22 L 218,28 L 228,50 L 234,78 L 224,108 L 232,138 L 230,162 L 220,195 L 210,228 L 196,264 L 168,282 L 142,282 L 112,275 L 92,262 L 78,228 L 64,195 L 58,162 L 60,132 L 54,104 L 58,78 L 70,52 L 83,38 Z";

// ── Map component ─────────────────────────────────────────────────────────────

function TopSitesMap() {
  const siteImpact = useMemo(() => {
    const map = new Map<string, number>();
    mockCases.forEach((c) => {
      const key = c.affectedScope.region;
      map.set(key, (map.get(key) ?? 0) + Math.abs(c.cxiDrop));
    });
    return map;
  }, []);

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
    >
      <div
        className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-elevated)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
          Top Affected Sites
        </p>
        <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          {[
            { color: "var(--color-resolved)", label: "≥ 3.5" },
            { color: "var(--color-warning)",  label: "3.0–3.5" },
            { color: "var(--color-critical)", label: "< 3.0" },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color, display: "inline-block" }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* SVG map */}
        <div className="flex-1 flex items-center justify-center p-4">
          <svg
            viewBox="0 0 288 296"
            width="100%"
            style={{ maxHeight: 260 }}
          >
            {/* Subtle dot grid */}
            <defs>
              <pattern id="dotGrid" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="8" cy="8" r="0.6" fill="rgba(255,255,255,0.06)" />
              </pattern>
            </defs>
            <rect width="288" height="296" fill="url(#dotGrid)" />

            {/* Germany outline */}
            <path
              d={GERMANY_PATH}
              fill="rgba(255,255,255,0.04)"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Site markers */}
            {SITE_MARKERS.map((m) => {
              const impact = siteImpact.get(m.region) ?? 0;
              const col = siteColor(m.cxiScore);
              const r = 5 + Math.min(impact * 1.2, 10);
              return (
                <g key={m.site}>
                  {/* Pulse ring */}
                  <circle cx={m.x} cy={m.y} r={r + 5} fill={col} opacity="0.12" />
                  {/* Core dot */}
                  <circle cx={m.x} cy={m.y} r={r} fill={col} opacity="0.9" />
                  {/* Score label */}
                  <text
                    x={m.x}
                    y={m.y + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="7"
                    fontFamily="var(--font-mono)"
                    fontWeight="700"
                    fill="#fff"
                  >
                    {m.cxiScore.toFixed(1)}
                  </text>
                  {/* City label */}
                  <text
                    x={m.x + r + 6}
                    y={m.y}
                    dominantBaseline="middle"
                    fontSize="7.5"
                    fontFamily="var(--font-ui)"
                    fontWeight="500"
                    fill="var(--color-text-secondary)"
                  >
                    {m.region.replace(" Metro", "").replace(" South", "").replace(" North", "").replace(" West", "").replace(" East", "")}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Site list */}
        <div className="shrink-0 flex flex-col justify-center gap-0 py-3" style={{ width: 160, borderLeft: "1px solid var(--color-border)" }}>
          {SITE_MARKERS.sort((a, b) => a.cxiScore - b.cxiScore).map((m) => {
            const col = siteColor(m.cxiScore);
            return (
              <div
                key={m.site}
                className="flex items-center justify-between px-3 py-2"
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                    {m.region.split(" ")[0]}
                  </p>
                  <p className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>
                    {mockCases.filter((c) => c.affectedScope.region === m.region).length} cases
                  </p>
                </div>
                <span
                  className="text-[10px] font-bold shrink-0 ml-2"
                  style={{ color: col, fontFamily: "var(--font-mono)" }}
                >
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

// ── Shared tooltip shell ──────────────────────────────────────────────────────

const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: "#1E1E2A",   // hard-coded so it never picks up browser defaults
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  boxShadow: "0 8px 24px rgba(0,0,0,0.55)",
  fontFamily: "'IBM Plex Sans', sans-serif",
  fontSize: 12,
  color: "#F4F4F5",             // explicit: never transparent / never black
  padding: "10px 14px",
  minWidth: 160,
  pointerEvents: "none",
};

// ── Trend chart tooltip ───────────────────────────────────────────────────────

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

// ── Pie chart tooltip ─────────────────────────────────────────────────────────

const STATUS_PIE_COLORS: Record<string, string> = {
  pending:   "#B45000",
  approved:  "#1A7A4A",
  rejected:  "#C0392B",
  corrected: "#1A5A8A",
  escalated: "#6B2FA0",
};

function PieTooltip({ active, payload, total }: {
  active?: boolean;
  payload?: { name: string; value: number }[];
  total: number;
}) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
  const color = STATUS_PIE_COLORS[name] ?? "#888";
  return (
    <div style={TOOLTIP_STYLE}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color, flexShrink: 0, display: "inline-block" }} />
        <span style={{ color: "#F4F4F5", fontWeight: 600, textTransform: "capitalize" }}>{name}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 24, marginBottom: 3 }}>
        <span style={{ color: "#F4F4F5" }}>Cases</span>
        <span style={{ color: "#F4F4F5", fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>{value}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
        <span style={{ color: "#F4F4F5" }}>Share</span>
        <span style={{ color: color, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>{pct}%</span>
      </div>
    </div>
  );
}

// ── Cases by status – pie chart ───────────────────────────────────────────────

function StatusPie() {
  const data = useMemo(() => {
    const counts: Record<string, number> = { pending: 0, approved: 0, rejected: 0, corrected: 0, escalated: 0 };
    mockCases.forEach((c) => { counts[c.status]++; });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([status, value]) => ({ name: status, value }));
  }, []);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div
      className="rounded-xl p-5 flex flex-col"
      style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)", minHeight: 260 }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-secondary)" }}>
        Cases by Status
      </p>
      <div className="flex-1 flex flex-col items-center justify-center">
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={68}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={STATUS_PIE_COLORS[entry.name] ?? "#888"} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip total={total} />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend — count + percentage */}
        <div className="flex flex-col gap-1.5 w-full mt-2">
          {data.map((d) => {
            const pct = total > 0 ? ((d.value / total) * 100).toFixed(0) : "0";
            return (
              <div key={d.name} className="flex items-center gap-2 text-[10px]">
                <span
                  className="w-2 h-2 rounded-sm shrink-0"
                  style={{ backgroundColor: STATUS_PIE_COLORS[d.name] ?? "#888", display: "inline-block" }}
                />
                <span className="flex-1 capitalize" style={{ color: "var(--color-text-secondary)" }}>{d.name}</span>
                <span style={{ color: "var(--color-text-muted)" }}>{pct}%</span>
                <span className="font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)", minWidth: 16, textAlign: "right" }}>
                  {d.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Recent cases ──────────────────────────────────────────────────────────────

function RecentCases() {
  const recent = mockCases.slice(0, 6);
  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
    >
      <div
        className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-elevated)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
          Recent Cases
        </p>
        <Link
          to="/cxi-cases"
          className="flex items-center gap-1 text-[10px] font-medium"
          style={{ color: "var(--color-brand)" }}
        >
          View all <ArrowRight size={11} />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        {recent.map((c) => (
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
                {c.affectedScope.cellName} · {c.affectedScope.siteName}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              <span
                className="text-xs font-bold"
                style={{ color: c.cxiDrop < -1.5 ? "var(--color-critical)" : "var(--color-warning)", fontFamily: "var(--font-mono)" }}
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

// ── Main component ────────────────────────────────────────────────────────────

export function CxiDashboard() {
  const total = mockCases.length;
  const pending = mockCases.filter((c) => c.status === "pending").length;
  const avgDrop = (mockCases.reduce((s, c) => s + Math.abs(c.cxiDrop), 0) / total).toFixed(1);
  const p1Count = mockCases.filter((c) => c.severity === "P1").length;

  const kpis = [
    { label: "Network CXI Score",   value: "3.4 / 5",    sub: "↓ −0.7 vs last week", subColor: "var(--color-critical)",       accentColor: "var(--color-brand)"    },
    { label: "Active Degradations", value: pending,       sub: `${total - pending} resolved`,   subColor: "var(--color-text-secondary)", accentColor: "var(--mindr-pending)"  },
    { label: "Avg CXI Drop",        value: `−${avgDrop}`, sub: "Across open cases",   subColor: "var(--color-text-secondary)", accentColor: "var(--color-warning)"  },
    { label: "P1 Incidents",        value: p1Count,       sub: "Critical severity",   subColor: "var(--color-text-secondary)", accentColor: "var(--color-critical)" },
  ];

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-base)", fontFamily: "var(--font-ui)" }}
    >
      <div className="flex-1 overflow-y-auto px-8 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold leading-none" style={{ color: "var(--color-text-primary)" }}>
              Dashboard
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              CXI Degradation — network overview
            </p>
          </div>
          {/* Compact scenario badge */}
          <span
            className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md"
            style={{
              backgroundColor: "rgba(255,176,32,0.1)",
              border: "1px solid rgba(255,176,32,0.2)",
              color: "var(--color-warning)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--color-warning)" }} />
            Scenario 2
          </span>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-xl p-4 flex flex-col gap-1"
              style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
                {k.label}
              </p>
              <p className="text-2xl font-bold leading-none mt-1" style={{ color: k.accentColor, fontFamily: "var(--font-mono)" }}>
                {k.value}
              </p>
              <p className="text-[11px] mt-1" style={{ color: k.subColor }}>
                {k.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Row 2: Trend chart + Pie chart */}
        <div className="flex gap-5 mb-5" style={{ minHeight: 260 }}>
          {/* Trend chart — 65% */}
          <div
            className="rounded-xl p-5 flex flex-col"
            style={{ flex: "65 1 0%", backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
                Network CXI Score — 7 Day Trend
              </p>
              <div className="flex items-center gap-4 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-px" style={{ backgroundColor: "#E2007A", display: "inline-block" }} />
                  CXI Score
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "rgba(255,176,32,0.35)", display: "inline-block" }} />
                  New Cases
                </span>
              </div>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={CXI_TREND} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--color-text-muted)", fontFamily: "var(--font-ui)" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="score" domain={[2.5, 5]} tick={{ fontSize: 10, fill: "var(--color-text-muted)", fontFamily: "var(--font-ui)" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="cases" orientation="right" tick={{ fontSize: 10, fill: "var(--color-text-muted)", fontFamily: "var(--font-ui)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<TrendTooltip />} />
                  {/* Target CXI threshold */}
                  <ReferenceLine yAxisId="score" y={4.0} stroke="rgba(226,0,122,0.35)" strokeDasharray="4 3" label={{ value: "Target 4.0", position: "right", fontSize: 9, fill: "rgba(226,0,122,0.6)" }} />
                  <Bar yAxisId="cases" dataKey="cases" fill="rgba(255,176,32,0.22)" radius={[2, 2, 0, 0]} />
                  <Line yAxisId="score" dataKey="score" stroke="#E2007A" strokeWidth={2} dot={{ r: 3, fill: "#E2007A", strokeWidth: 0 }} activeDot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cases by status — 35% */}
          <div style={{ flex: "35 1 0%" }}>
            <StatusPie />
          </div>
        </div>

        {/* Row 3: Map + Recent cases */}
        <div className="grid grid-cols-2 gap-5" style={{ minHeight: 310 }}>
          <TopSitesMap />
          <RecentCases />
        </div>
      </div>
    </div>
  );
}
