// Reports page — CXI domain
// A: KPIs from store; no Scenario 2 badge; approval rate basis labeled; P1 basis labeled
// B: Agent Activity Log description rewritten to match current pipeline-based page
// C: 4 new report catalog entries (C1–C4)
// D: Case Outcome table — filters, status totals, row cap, clickable IDs, CSV export
// E: Period selector drives KPI titles and table period label

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart2,
  Bot,
  Boxes,
  ClipboardList,
  Download,
  GitBranch,
  Search,
  Target,
  Timer,
  TrendingDown,
  X,
} from "lucide-react";
import { mockCases } from "../../data/cxi-cases";
import {
  statusColor,
  statusBg,
  severityColor,
  severityBg,
  classificationLabel,
} from "../cxi/CaseRow";
import { Badge } from "../ui/badge";
import type { CaseStatus, CaseSeverity, CaseClassification } from "../../types/cxi";

// ── Period ────────────────────────────────────────────────────────────────────

type Period = "7d" | "14d" | "28d";

const PERIOD_LABELS: Record<Period, string> = {
  "7d":  "This week",
  "14d": "Last 14 days",
  "28d": "Last 28 days",
};

// ── Report catalog ────────────────────────────────────────────────────────────

type ReportCategory = "all" | "cxi" | "agents" | "rca" | "audit";

interface Report {
  id: string;
  title: string;
  description: string;
  category: Exclude<ReportCategory, "all">;
  icon: React.ElementType;
  accentColor: string;
  generated: string;
  pages: number;
  format: "PDF" | "XLSX" | "CSV";
  isNew?: boolean;
}

const REPORTS: Report[] = [
  // ── Existing reports ─────────────────────────────────────────────────────────
  {
    id: "r01",
    title: "Daily CXI Degradation Summary",
    description: "Network-wide CXI score trends, top degraded sites, and open case breakdown for the last 24 hours",
    category: "cxi",
    icon: TrendingDown,
    accentColor: "#E2007A",
    generated: "Today, 06:00",
    pages: 8,
    format: "PDF",
  },
  {
    id: "r02",
    title: "Weekly CXI Performance Report",
    description: "7-day aggregate view across all regions, approval rate analysis, and SLA compliance metrics",
    category: "cxi",
    icon: BarChart2,
    accentColor: "#1A5A8A",
    generated: "28 May, 06:00",
    pages: 22,
    format: "PDF",
  },
  // B1: description rewritten — matches current Agent Activity page (case pipeline, HVA, anti-loop)
  {
    id: "r03",
    title: "Agent Activity Log",
    description: "Case pipeline progression across all 7 stages (Trigger → HVA → Execution), human-approval actions, recommendation acceptance outcomes, and safety anti-loop events — one row per case per stage",
    category: "agents",
    icon: Bot,
    accentColor: "#6B2FA0",
    generated: "Today, 06:00",
    pages: 6,
    format: "PDF",
  },
  {
    id: "r04",
    title: "Root Cause Analysis Summary",
    description: "Classification distribution (Incident / Optimisation / Known Problem / Unknown), confidence scores, and human correction rate across all cases",
    category: "rca",
    icon: GitBranch,
    accentColor: "#B45000",
    generated: "28 May, 06:00",
    pages: 14,
    format: "PDF",
  },
  {
    id: "r05",
    title: "Reviewer Action Audit Trail",
    description: "Full log of all approval, rejection, correction and escalation actions with timestamps and reviewer identity",
    category: "audit",
    icon: ClipboardList,
    accentColor: "#1A7A4A",
    generated: "28 May, 12:30",
    pages: 3,
    format: "XLSX",
  },
  {
    id: "r06",
    title: "CXI Case Export — All Cases",
    description: `Full export of all ${mockCases.length} cases with sub-metric timeseries, hypotheses, evidence references and outcomes`,
    category: "cxi",
    icon: BarChart2,
    accentColor: "#1A5A8A",
    generated: "28 May, 12:00",
    pages: 0,
    format: "CSV",
  },
  {
    id: "r07",
    title: "One-Click Execution Report",
    description: "All sleeping cell resets and automated remediations executed this week, with outcomes and rollback status",
    category: "agents",
    icon: Bot,
    accentColor: "#E2007A",
    generated: "28 May, 08:00",
    pages: 4,
    format: "PDF",
  },
  {
    id: "r08",
    title: "Known Problem Correlation Report",
    description: "Recurring degradation patterns matched to known problem areas — recurrence frequency and playbook match rates",
    category: "rca",
    icon: GitBranch,
    accentColor: "#6B2FA0",
    generated: "27 May, 06:00",
    pages: 11,
    format: "PDF",
  },
  // ── C: New reports ────────────────────────────────────────────────────────────
  // C1: Recommendation Accuracy & Calibration (RCA & Classification)
  {
    id: "r09",
    title: "Recommendation Accuracy & Calibration",
    description: "Hypothesis acceptance vs correction vs rejection rates as an accuracy proxy; confidence-vs-outcome calibration chart mapping agent confidence bands to actual acceptance outcomes — closes the agent learning-loop requirement",
    category: "rca",
    icon: Target,
    accentColor: "#B45000",
    generated: "Today, 06:00",
    pages: 9,
    format: "PDF",
    isNew: true,
  },
  // C2: Recommendation Acceptance Trend (CXI Performance)
  {
    id: "r10",
    title: "Recommendation Acceptance Trend",
    description: "Weekly trend of recommendation acceptance rate vs the 75% trust target — approval and correction rates over time, annotated with significant process or data-quality changes",
    category: "cxi",
    icon: BarChart2,
    accentColor: "#1A7A4A",
    generated: "28 May, 06:00",
    pages: 6,
    format: "PDF",
    isNew: true,
  },
  // C3: Duplicate Work Avoided (Audit & Actions) — ROI / NFR4 report
  {
    id: "r11",
    title: "Duplicate Work Avoided",
    description: "Cases suppressed or matched to existing incidents and tickets this period — estimated engineer-hours saved, deduplication rate, and SCC task-reduction ROI metrics",
    category: "audit",
    icon: Boxes,
    accentColor: "#1A5A8A",
    generated: "28 May, 08:00",
    pages: 4,
    format: "PDF",
    isNew: true,
  },
  // C4: Time to First Assessment (CXI Performance) — NFR1: <10 min target
  {
    id: "r12",
    title: "Time to First Assessment",
    description: "Trend of MINDR's time-to-RCA over the period vs the <10 min NFR1 target — agent pipeline timing, latency distribution by stage, and bottleneck identification",
    category: "cxi",
    icon: Timer,
    accentColor: "#6B2FA0",
    generated: "Today, 06:00",
    pages: 5,
    format: "PDF",
    isNew: true,
  },
];

// ── Category metadata ─────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  all:    "All Reports",
  cxi:    "CXI Performance",
  agents: "Agent Activity",
  rca:    "RCA & Classification",
  audit:  "Audit & Actions",
};

const CATEGORY_COLORS: Partial<Record<ReportCategory, string>> = {
  cxi:    "#E2007A",
  agents: "#6B2FA0",
  rca:    "#B45000",
  audit:  "#1A7A4A",
};

const CATEGORIES: ReportCategory[] = ["all", "cxi", "agents", "rca", "audit"];

// Per-category report counts (static — REPORTS is constant)
const CATEGORY_COUNTS: Record<ReportCategory, number> = {
  all:    REPORTS.length,
  cxi:    REPORTS.filter((r) => r.category === "cxi").length,
  agents: REPORTS.filter((r) => r.category === "agents").length,
  rca:    REPORTS.filter((r) => r.category === "rca").length,
  audit:  REPORTS.filter((r) => r.category === "audit").length,
};

// ── A2: KPI computation — same formula as StatsBar to prevent cross-page drift ─

function computeKpis(cases: typeof mockCases) {
  const pending   = cases.filter((c) => c.status === "pending");
  const reviewed  = cases.filter((c) => c.status !== "pending");
  const approved  = reviewed.filter((c) => c.status === "approved").length;
  const corrected = reviewed.filter((c) => c.status === "corrected").length;
  const approvalRate = reviewed.length > 0
    ? Math.round(((approved + corrected) / reviewed.length) * 100)
    : 0;
  const p1Total  = cases.filter((c) => c.severity === "P1").length;
  const p1Active = pending.filter((c) => c.severity === "P1").length;
  return {
    total: cases.length,
    pending: pending.length,
    reviewed: reviewed.length,
    approved,
    corrected,
    approvalRate,
    p1Total,
    p1Active,
  };
}

// Pre-computed from static import — no useMemo needed
const KPIS = computeKpis(mockCases);

// Unique regions for table filter
const REGIONS = ["all", ...Array.from(new Set(mockCases.map((c) => c.affectedScope.region))).sort()];

// Status counts for table footer (D1)
const STATUS_COUNTS: Record<CaseStatus, number> = {
  pending:   mockCases.filter((c) => c.status === "pending").length,
  approved:  mockCases.filter((c) => c.status === "approved").length,
  rejected:  mockCases.filter((c) => c.status === "rejected").length,
  corrected: mockCases.filter((c) => c.status === "corrected").length,
  escalated: mockCases.filter((c) => c.status === "escalated").length,
};

// Table row cap — show top N by default (D3)
const ROW_CAP = 10;

// ── Table filter types ────────────────────────────────────────────────────────

interface TableFilter {
  status:         CaseStatus | "all";
  severity:       CaseSeverity | "all";
  region:         string;
  classification: CaseClassification | "all";
}

const EMPTY_FILTER: TableFilter = {
  status: "all", severity: "all", region: "all", classification: "all",
};

// ── Reusable filter <select> ──────────────────────────────────────────────────

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const isActive = value !== "all";
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs px-2.5 py-1.5 rounded-lg outline-none"
      style={{
        backgroundColor: isActive ? "rgba(226,0,122,0.06)" : "var(--color-bg-card)",
        border: `1px solid ${isActive ? "rgba(226,0,122,0.3)" : "var(--color-border)"}`,
        color: "var(--color-text-primary)",
        cursor: "pointer",
      }}
    >
      {options.map((o) => (
        <option
          key={o.value}
          value={o.value}
          style={{ backgroundColor: "var(--color-bg-elevated)" }}
        >
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ── Report card ───────────────────────────────────────────────────────────────

function ReportCard({ report }: { report: Report }) {
  const Icon = report.icon;
  return (
    <div
      className="flex items-start gap-4 p-4 rounded-xl transition-colors hover:bg-white/[0.02]"
      style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${report.accentColor}18` }}
      >
        <Icon size={16} style={{ color: report.accentColor }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold leading-snug" style={{ color: "var(--color-text-primary)" }}>
            {report.title}
          </p>
          {report.isNew && (
            <span
              className="text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wider"
              style={{
                backgroundColor: "rgba(226,0,122,0.12)",
                color: "var(--color-brand)",
                border: "1px solid rgba(226,0,122,0.2)",
              }}
            >
              New
            </span>
          )}
        </div>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {report.description}
        </p>
        <div className="flex items-center gap-3 mt-2 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          <span>Generated: {report.generated}</span>
          {report.pages > 0 && <span>· {report.pages} pages</span>}
          <span
            className="px-1.5 py-px rounded font-bold"
            style={{ backgroundColor: "var(--color-bg-elevated)", color: "var(--color-text-secondary)" }}
          >
            {report.format}
          </span>
        </div>
      </div>

      <button
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 hover:opacity-80 transition-opacity"
        style={{
          backgroundColor: `${report.accentColor}18`,
          border: `1px solid ${report.accentColor}40`,
          color: report.accentColor,
        }}
        onClick={() => { /* demo only */ }}
      >
        <Download size={12} />
        Export
      </button>
    </div>
  );
}

// ── Case Outcome Summary Table (D) ────────────────────────────────────────────

function CaseSummaryTable({ period }: { period: Period }) {
  const [tableFilter, setTableFilter] = useState<TableFilter>(EMPTY_FILTER);
  const [showAll,     setShowAll]     = useState(false);

  const hasFilters = JSON.stringify(tableFilter) !== JSON.stringify(EMPTY_FILTER);

  // Apply filters + sort: P1 first, then by severity, then newest
  const filtered = mockCases
    .filter((c) => {
      if (tableFilter.status         !== "all" && c.status                  !== tableFilter.status)         return false;
      if (tableFilter.severity       !== "all" && c.severity                !== tableFilter.severity)       return false;
      if (tableFilter.region         !== "all" && c.affectedScope.region    !== tableFilter.region)         return false;
      if (tableFilter.classification !== "all" && c.classification          !== tableFilter.classification) return false;
      return true;
    })
    .sort((a, b) => {
      const sev = { P1: 0, P2: 1, P3: 2 } as Record<string, number>;
      const d = (sev[a.severity] ?? 1) - (sev[b.severity] ?? 1);
      if (d !== 0) return d;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const visible = showAll ? filtered : filtered.slice(0, ROW_CAP);
  const hasMore = filtered.length > ROW_CAP;

  // Real CSV export (D3)
  function handleExportCsv() {
    const headers = ["Case ID", "Severity", "Classification", "CXI Baseline", "CXI Current", "CXI Δ", "Region", "Status"];
    const rows = mockCases.map((c) => [
      c.caseId,
      c.severity,
      c.classification,
      c.cxiBaseline.toFixed(1),
      c.cxiCurrent.toFixed(1),
      c.cxiDrop.toFixed(1),
      c.affectedScope.region,
      c.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `cxi-cases-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function setFilter<K extends keyof TableFilter>(key: K, value: TableFilter[K]) {
    setTableFilter((prev) => ({ ...prev, [key]: value }));
    setShowAll(false);
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
    >
      {/* Table header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-elevated)" }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
            Case Outcome Summary
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {PERIOD_LABELS[period]} · {filtered.length} of {mockCases.length} case{mockCases.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 text-[10px] font-medium hover:opacity-80 transition-opacity"
          style={{ color: "var(--color-brand)" }}
        >
          <Download size={11} />
          Export full CSV ({mockCases.length})
        </button>
      </div>

      {/* D2: Filters row */}
      <div
        className="flex items-center gap-2 flex-wrap px-5 py-2.5"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "rgba(255,255,255,0.01)" }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
          Filter:
        </span>

        <FilterSelect
          value={tableFilter.status}
          onChange={(v) => setFilter("status", v as CaseStatus | "all")}
          options={[
            { value: "all",       label: "All Status" },
            { value: "pending",   label: "Pending" },
            { value: "approved",  label: "Approved" },
            { value: "rejected",  label: "Rejected" },
            { value: "escalated", label: "Escalated" },
            { value: "corrected", label: "Corrected" },
          ]}
        />

        <FilterSelect
          value={tableFilter.severity}
          onChange={(v) => setFilter("severity", v as CaseSeverity | "all")}
          options={[
            { value: "all", label: "All Severity" },
            { value: "P1",  label: "P1 — Critical" },
            { value: "P2",  label: "P2 — High" },
            { value: "P3",  label: "P3 — Medium" },
          ]}
        />

        <FilterSelect
          value={tableFilter.region}
          onChange={(v) => setFilter("region", v)}
          options={REGIONS.map((r) => ({ value: r, label: r === "all" ? "All Regions" : r }))}
        />

        <FilterSelect
          value={tableFilter.classification}
          onChange={(v) => setFilter("classification", v as CaseClassification | "all")}
          options={[
            { value: "all",           label: "All Types" },
            { value: "incident",      label: "Incident" },
            { value: "optimization",  label: "Optimization" },
            { value: "known_problem", label: "Known Problem" },
            { value: "unknown",       label: "Unknown" },
          ]}
        />

        {hasFilters && (
          <button
            onClick={() => { setTableFilter(EMPTY_FILTER); setShowAll(false); }}
            className="flex items-center gap-1 text-[10px] font-medium hover:opacity-80 transition-opacity"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X size={10} />
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <table className="w-full text-xs">
        <thead>
          <tr style={{ backgroundColor: "var(--color-bg-elevated)" }}>
            {["Case ID", "Severity", "Classification", "CXI Δ", "Region", "Status"].map((h) => (
              <th
                key={h}
                className="px-5 py-2 text-left font-semibold text-[10px] uppercase tracking-widest"
                style={{ color: "var(--color-text-muted)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-8 text-center" style={{ color: "var(--color-text-muted)" }}>
                No cases match the current filters.
              </td>
            </tr>
          ) : (
            visible.map((c) => (
              <tr
                key={c.caseId}
                className="hover:bg-white/[0.02] transition-colors"
                style={{ borderTop: "1px solid var(--color-border)" }}
              >
                {/* D4: clickable case ID → case detail */}
                <td className="px-5 py-2.5">
                  <Link
                    to={`/cxi-cases/${c.caseId}`}
                    className="font-bold hover:underline"
                    style={{ color: "var(--color-brand)", fontFamily: "var(--font-mono)" }}
                  >
                    {c.caseId}
                  </Link>
                </td>

                <td className="px-5 py-2.5">
                  <Badge
                    className="font-bold px-1.5 py-px"
                    style={{ color: severityColor(c.severity), backgroundColor: severityBg(c.severity) }}
                  >
                    {c.severity}
                  </Badge>
                </td>

                <td className="px-5 py-2.5" style={{ color: "var(--color-text-secondary)" }}>
                  {classificationLabel(c.classification)}
                </td>

                {/* A3: CXI Δ threshold corrected to 1-5 scale (was -1.5 on old 0-10 scale) */}
                <td
                  className="px-5 py-2.5 font-bold"
                  style={{
                    color: c.cxiDrop < -0.75 ? "var(--color-critical)" : "var(--color-warning)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {c.cxiDrop.toFixed(1)}
                </td>

                <td className="px-5 py-2.5" style={{ color: "var(--color-text-secondary)" }}>
                  {c.affectedScope.region}
                </td>

                <td className="px-5 py-2.5">
                  <Badge
                    className="font-bold uppercase tracking-wider"
                    style={{ color: statusColor(c.status), backgroundColor: statusBg(c.status) }}
                  >
                    {c.status}
                  </Badge>
                </td>
              </tr>
            ))
          )}
        </tbody>

        {/* D1: Status totals footer — reconciles with CXI Cases tab counts */}
        <tfoot>
          <tr style={{ borderTop: "2px solid var(--color-border)", backgroundColor: "var(--color-bg-elevated)" }}>
            <td colSpan={6} className="px-5 py-3">
              <div className="flex items-center gap-4 flex-wrap text-[10px]">
                <span style={{ color: "var(--color-text-muted)" }}>Totals:</span>
                {(["pending", "approved", "rejected", "escalated", "corrected"] as CaseStatus[]).map((s) => (
                  <span key={s} className="flex items-center gap-1.5">
                    <Badge
                      className="font-bold px-1.5 py-px text-[9px] uppercase tracking-wider"
                      style={{ color: statusColor(s), backgroundColor: statusBg(s) }}
                    >
                      {s}
                    </Badge>
                    <span
                      className="font-bold"
                      style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}
                    >
                      {STATUS_COUNTS[s]}
                    </span>
                  </span>
                ))}
              </div>
            </td>
          </tr>
        </tfoot>
      </table>

      {/* D3: Row cap controls — only shown when there are more rows than cap */}
      {hasMore && (
        <div
          className="flex items-center justify-center gap-4 px-5 py-3"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-medium hover:opacity-80 transition-opacity"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {showAll
              ? `Collapse to top ${ROW_CAP}`
              : `Show all ${filtered.length} rows`}
          </button>
          <span style={{ color: "var(--color-border)" }}>·</span>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-opacity"
            style={{ color: "var(--color-brand)" }}
          >
            <Download size={11} />
            Export all as CSV
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CxiReports() {
  const [activeCategory, setActiveCategory] = useState<ReportCategory>("all");
  const [search,         setSearch]         = useState("");
  const [period,         setPeriod]         = useState<Period>("7d");

  const filtered = REPORTS.filter((r) => {
    const matchesCat    = activeCategory === "all" || r.category === activeCategory;
    const matchesSearch = !search.trim() || r.title.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-base)", fontFamily: "var(--font-ui)" }}
    >
      <div className="flex-1 overflow-y-auto px-8 py-6">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold leading-none" style={{ color: "var(--color-text-primary)" }}>
              Reports
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              CXI performance, agent activity and audit documentation
            </p>
          </div>

          {/* E1: Period selector */}
          <div
            className="flex items-center overflow-hidden rounded-lg"
            style={{ border: "1px solid var(--color-border)" }}
          >
            {(["7d", "14d", "28d"] as Period[]).map((p, i) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: period === p ? "var(--color-bg-elevated)" : "transparent",
                  color: period === p ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  borderRight: i < 2 ? "1px solid var(--color-border)" : "none",
                }}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* ── A2: KPI strip — all values from store, bases labeled ── */}
        <div className="grid grid-cols-4 gap-4 mb-6">

          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
              Cases · {PERIOD_LABELS[period]}
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: "var(--color-brand)", fontFamily: "var(--font-mono)" }}>
              {KPIS.total}
            </p>
            <p className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>
              {KPIS.pending} pending · {KPIS.reviewed} reviewed
            </p>
          </div>

          {/* Same formula as CXI Cases list StatsBar — prevents cross-page contradiction */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
              Approval Rate
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: "var(--mindr-approved)", fontFamily: "var(--font-mono)" }}>
              {KPIS.approvalRate}%
            </p>
            <p className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>
              {KPIS.approved + KPIS.corrected} of {KPIS.reviewed} reviews actioned
            </p>
          </div>

          {/* A2: P1 clearly labeled as "total" vs "active (pending)" */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
              P1 Cases
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: "var(--color-critical)", fontFamily: "var(--font-mono)" }}>
              {KPIS.p1Total}
            </p>
            <p className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>
              {KPIS.p1Active} active (pending review)
            </p>
          </div>

          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
              Reports Ready
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>
              {REPORTS.length}
            </p>
            <p className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>
              across {CATEGORIES.length - 1} categories
            </p>
          </div>
        </div>

        {/* ── Category filter tabs + search ── */}
        <div className="flex items-center justify-between mb-5 gap-4">
          <div className="flex items-center gap-1">
            {CATEGORIES.map((cat) => {
              const isActive    = activeCategory === cat;
              const underline   = CATEGORY_COLORS[cat] ?? "var(--color-brand)";
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs transition-colors"
                  style={{
                    backgroundColor: "transparent",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive
                      ? (CATEGORY_COLORS[cat] ?? "var(--color-text-primary)")
                      : "var(--color-text-muted)",
                    borderBottom: isActive ? `2px solid ${underline}` : "2px solid transparent",
                    borderRadius: 0,
                  }}
                >
                  {CATEGORY_LABELS[cat]}
                  <span
                    className="text-[9px] font-bold px-1 py-px rounded-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "var(--color-text-muted)" }}
                  >
                    {CATEGORY_COUNTS[cat]}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)", width: 240 }}
          >
            <Search size={12} style={{ color: "var(--color-text-muted)" }} />
            <input
              type="text"
              placeholder="Search reports…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-xs"
              style={{ color: "var(--color-text-primary)" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ color: "var(--color-text-muted)" }}>
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* ── Report cards ── */}
        <div className="space-y-3 mb-8">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                No reports match your filter.
              </p>
            </div>
          ) : (
            filtered.map((r) => <ReportCard key={r.id} report={r} />)
          )}
        </div>

        {/* ── Case Outcome Summary (D) ── */}
        <CaseSummaryTable period={period} />

      </div>
    </div>
  );
}
