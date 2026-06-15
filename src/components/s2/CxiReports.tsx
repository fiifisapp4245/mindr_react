import { useState } from "react";
import {
  BarChart2,
  Bot,
  ChevronRight,
  ClipboardList,
  Download,
  GitBranch,
  Search,
  TrendingDown,
} from "lucide-react";
import { mockCases } from "../../data/cxi-cases";
import { statusColor, statusBg } from "../cxi/CaseRow";

// ── Report definitions ────────────────────────────────────────────────────────

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
}

const REPORTS: Report[] = [
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
  {
    id: "r03",
    title: "Agent Activity Log",
    description: "Per-agent processing volumes, queue depths, latency percentiles and error rates for all 7 MINDR agents",
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
    description: "Classification distribution (incident / optimisation / known problem / unknown), confidence scores and human correction rate",
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
    description: "Full export of all 12 cases with sub-metric timeseries, hypotheses, evidence references and outcomes",
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
];

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

// ── Summary stats from mock data ──────────────────────────────────────────────

const reviewed = mockCases.filter((c) => c.status !== "pending").length;
const approvalRate = reviewed > 0
  ? Math.round((mockCases.filter((c) => c.status === "approved" || c.status === "corrected").length / reviewed) * 100)
  : 0;

const SUMMARY = [
  { label: "Cases This Week", value: mockCases.length, color: "var(--color-brand)" },
  { label: "Approval Rate",   value: `${approvalRate}%`, color: "var(--mindr-approved)" },
  { label: "P1 Cases",        value: mockCases.filter((c) => c.severity === "P1").length, color: "var(--color-critical)" },
  { label: "Reports Ready",   value: REPORTS.length, color: "var(--color-text-primary)" },
];

// ── Report card ───────────────────────────────────────────────────────────────

function ReportCard({ report }: { report: Report }) {
  const Icon = report.icon;
  return (
    <div
      className="flex items-start gap-4 p-4 rounded-xl transition-colors hover:bg-white/4"
      style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${report.accentColor}18` }}
      >
        <Icon size={16} style={{ color: report.accentColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug" style={{ color: "var(--color-text-primary)" }}>
          {report.title}
        </p>
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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors hover:opacity-80"
        style={{
          backgroundColor: `${report.accentColor}18`,
          border: `1px solid ${report.accentColor}40`,
          color: report.accentColor,
        }}
        onClick={() => {/* demo only */}}
      >
        <Download size={12} />
        Export
      </button>
    </div>
  );
}

// ── Case-level summary table ──────────────────────────────────────────────────

function CaseSummaryTable() {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
    >
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-elevated)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
          Case Outcome Summary
        </p>
        <button className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--color-brand)" }}>
          <Download size={11} /> Export CSV
        </button>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ backgroundColor: "var(--color-bg-elevated)" }}>
            {["Case ID", "Severity", "Classification", "CXI Δ", "Region", "Status"].map((h) => (
              <th key={h} className="px-5 py-2 text-left font-semibold text-[10px] uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mockCases.map((c) => (
            <tr key={c.caseId} style={{ borderTop: "1px solid var(--color-border)" }}>
              <td className="px-5 py-2.5 font-bold" style={{ color: "var(--color-brand)", fontFamily: "var(--font-mono)" }}>{c.caseId}</td>
              <td className="px-5 py-2.5" style={{ color: c.severity === "P1" ? "var(--color-critical)" : c.severity === "P2" ? "var(--color-warning)" : "var(--color-mitigating)" }}>
                {c.severity}
              </td>
              <td className="px-5 py-2.5" style={{ color: "var(--color-text-secondary)" }}>{c.classification}</td>
              <td className="px-5 py-2.5 font-bold" style={{ color: c.cxiDrop < -1.5 ? "var(--color-critical)" : "var(--color-warning)", fontFamily: "var(--font-mono)" }}>
                {c.cxiDrop.toFixed(1)}
              </td>
              <td className="px-5 py-2.5" style={{ color: "var(--color-text-secondary)" }}>{c.affectedScope.region}</td>
              <td className="px-5 py-2.5">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{ color: statusColor(c.status), backgroundColor: statusBg(c.status) }}
                >
                  {c.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CxiReports() {
  const [activeCategory, setActiveCategory] = useState<ReportCategory>("all");
  const [search, setSearch] = useState("");

  const filtered = REPORTS.filter((r) => {
    const matchesCat = activeCategory === "all" || r.category === activeCategory;
    const matchesSearch = !search.trim() || r.title.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

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
              Reports
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              CXI performance, agent activity and audit documentation
            </p>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {SUMMARY.map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-4"
              style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
            >
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
                {s.label}
              </p>
              <p className="text-3xl font-bold mt-1" style={{ color: s.color, fontFamily: "var(--font-mono)" }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filter + search bar */}
        <div className="flex items-center justify-between mb-5 gap-4">
          <div className="flex items-center gap-1">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              const underline = CATEGORY_COLORS[cat] ?? "var(--color-brand)";
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="px-3 py-2 text-xs transition-colors"
                  style={{
                    backgroundColor: "transparent",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? (CATEGORY_COLORS[cat] ?? "var(--color-text-primary)") : "var(--color-text-muted)",
                    borderBottom: isActive ? `2px solid ${underline}` : "2px solid transparent",
                    borderRadius: 0,
                  }}
                >
                  {CATEGORY_LABELS[cat]}
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
          </div>
        </div>

        {/* Report cards */}
        <div className="space-y-3 mb-8">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No reports match your filter.</p>
            </div>
          ) : (
            filtered.map((r) => <ReportCard key={r.id} report={r} />)
          )}
        </div>

        {/* Case summary table */}
        <CaseSummaryTable />
      </div>
    </div>
  );
}
