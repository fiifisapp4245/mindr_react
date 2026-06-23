import { useScenario } from "../contexts/scenario";
import { CxiReports } from "../components/s2/CxiReports";
import { useState } from "react";
import { motion } from "framer-motion";
import { kpiCard, kpiValue, kpiValueScale } from "../lib/animations";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlignJustify,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileText,
  FilePlus,
  Globe2,
  LayoutGrid,
  Lightbulb,
  X,
  XCircle,
} from "lucide-react";
import { useReports } from "../hooks/use-reports";
import { SLARing } from "../components/reports/SLARing";
import { TrendTooltip } from "../components/reports/TrendTooltip";
import { IncidentTooltip } from "../components/reports/IncidentTooltip";
import { BoldText } from "../components/shared/BoldText";
import type { TimeRange } from "../types/report";

const STATUS_STYLE = {
  COMPLETED:  { color: "var(--color-resolved)",   bg: "rgba(45,212,191,0.12)"  },
  ARCHIVED:   { color: "var(--color-neutral)",    bg: "rgba(107,114,128,0.12)" },
  PROCESSING: { color: "var(--color-warning)",    bg: "rgba(255,176,32,0.12)"  },
} as const;

const SLA_REGIONS = [
  { region: "EU-West",  sla: 99.1, ok: true  },
  { region: "US-East",  sla: 99.7, ok: true  },
  { region: "APAC",     sla: 99.3, ok: true  },
  { region: "LATAM",    sla: 82.4, ok: false },
];

function downloadReport(name: string, type: string) {
  const lines = [
    `MINDR — ${name}`,
    `Report Type: ${type}`,
    `Generated: ${new Date().toUTCString()}`,
    `Platform: MINDR v4.0.0`,
    ``,
    `─────────────────────────────────────────`,
    `SUMMARY`,
    `─────────────────────────────────────────`,
    `SLA Compliance: 99.4% (Target: 99.0%)`,
    `Total Downtime: 42 mins (−18% vs prior week)`,
    `Incident Count: 12 (Target: <15/week)`,
    `Avg Resolution: 18 mins (−6%)`,
    `Availability:   99.98% (Tier 4 standard)`,
    ``,
    `─────────────────────────────────────────`,
    `REGIONAL BREAKDOWN`,
    `─────────────────────────────────────────`,
    `EU-West: 99.1% SLA  ✓`,
    `US-East: 99.7% SLA  ✓`,
    `APAC:    99.3% SLA  ✓`,
    `LATAM:   82.4% SLA  ⚠ Below target`,
    ``,
    `─────────────────────────────────────────`,
    `NOTE: This is a simulated export. In production,`,
    `full telemetry data and charts are included.`,
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${name.replace(/[^a-z0-9]/gi, "_")}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { activeScenario } = useScenario();
  if (activeScenario.id === "s2") return <CxiReports />;

  const { perfTrend, incidentTrend, generatedReports, aiInsights } = useReports();
  const [timeRange,    setTimeRange]    = useState<TimeRange>("7d");
  const [showAnalysis, setShowAnalysis] = useState(false);

  const ranges: { id: TimeRange; label: string }[] = [
    { id: "24h", label: "Last 24h"    },
    { id: "7d",  label: "Last 7 days" },
    { id: "30d", label: "Last 30d"    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>Reports</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              Network Performance Reports, Trends &amp; Exports
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <div className="flex items-center rounded-md overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
              {ranges.map(({ id, label }) => (
                <button key={id} onClick={() => setTimeRange(id)}
                  className="px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{ backgroundColor: timeRange === id ? "var(--color-brand)" : "transparent", color: timeRange === id ? "#fff" : "var(--color-text-muted)" }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
              style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
            >
              <Globe2 size={13} style={{ color: "var(--color-text-muted)" }} />
              All Regions
              <ChevronDown size={11} style={{ color: "var(--color-text-muted)" }} />
            </button>
            <div className="flex items-center rounded-md overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
              <button className="p-2" style={{ color: "var(--color-text-muted)" }}><AlignJustify size={13} /></button>
              <button className="p-2" style={{ color: "var(--color-text-muted)", borderLeft: "1px solid var(--color-border)" }}><LayoutGrid size={13} /></button>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
            >
              <FilePlus size={14} />
              Generate Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div initial="rest" whileHover="hover" variants={kpiCard} className="kpi-card rounded-lg p-5 flex flex-col gap-2" style={{ backgroundColor: "var(--color-bg-card)", borderWidth: 1, borderStyle: "solid" }}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>SLA Compliance</p>
              <span className="text-[10px] font-semibold" style={{ color: "var(--color-resolved)" }}>+1.2%</span>
            </div>
            <motion.p className="text-3xl font-bold tabular-nums" style={{ color: "var(--color-brand)" }} variants={kpiValueScale}>99.4%</motion.p>
            <div className="h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full" style={{ width: "99.4%", backgroundColor: "var(--color-brand)" }} />
            </div>
          </motion.div>

          <motion.div initial="rest" whileHover="hover" variants={kpiCard} className="kpi-card rounded-lg p-5 flex flex-col gap-2" style={{ backgroundColor: "var(--color-bg-card)", borderWidth: 1, borderStyle: "solid" }}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Total Downtime</p>
              <span className="text-[10px] font-semibold" style={{ color: "var(--color-resolved)" }}>−18%</span>
            </div>
            <motion.p className="text-3xl font-bold tabular-nums" variants={kpiValue}>42 <span className="text-base font-semibold">mins</span></motion.p>
            <div className="h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full" style={{ width: "42%", backgroundColor: "var(--color-brand)" }} />
            </div>
          </motion.div>

          <motion.div initial="rest" whileHover="hover" variants={kpiCard} className="kpi-card rounded-lg p-5 flex flex-col gap-2" style={{ backgroundColor: "var(--color-bg-card)", borderWidth: 1, borderStyle: "solid" }}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Incident Count</p>
              <span className="text-[10px] font-semibold" style={{ color: "var(--color-resolved)" }}>−3</span>
            </div>
            <motion.p className="text-3xl font-bold tabular-nums" variants={kpiValue}>12</motion.p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Target: &lt;15 / week</p>
          </motion.div>

          <motion.div initial="rest" whileHover="hover" variants={kpiCard} className="kpi-card rounded-lg p-5 flex flex-col gap-2" style={{ backgroundColor: "var(--color-bg-card)", borderWidth: 1, borderStyle: "solid" }}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Avg Resolution</p>
              <span className="text-[10px] font-semibold" style={{ color: "var(--color-resolved)" }}>−6%</span>
            </div>
            <motion.p className="text-3xl font-bold tabular-nums" variants={kpiValue}>18 <span className="text-base font-semibold">mins</span></motion.p>
            <div className="h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full" style={{ width: "30%", backgroundColor: "var(--color-brand)" }} />
            </div>
          </motion.div>

          <motion.div initial="rest" whileHover="hover" variants={kpiCard} className="kpi-card rounded-lg p-5 flex flex-col gap-2" style={{ backgroundColor: "var(--color-bg-card)", borderWidth: 1, borderStyle: "solid" }}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Availability</p>
              <span className="text-[9px] font-semibold px-1 py-px rounded" style={{ color: "var(--color-resolved)", backgroundColor: "rgba(45,212,191,0.12)" }}>✓</span>
            </div>
            <motion.p className="text-3xl font-bold tabular-nums" style={{ color: "var(--color-resolved)" }} variants={kpiValueScale}>99.98%</motion.p>
            <p className="text-[9px] uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Standard: Tier 4</p>
          </motion.div>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: "3fr 2fr", alignItems: "stretch" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <div className="rounded-lg p-5 shrink-0" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity size={14} style={{ color: "var(--color-brand)" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Network Performance Trend</p>
                </div>
                <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-brand)" }} />THROUGHPUT</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "rgba(77,158,255,0.7)" }} />LATENCY</span>
                </div>
              </div>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={perfTrend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E91E8C" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#E91E8C" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="day" tick={{ fill: "var(--color-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fill: "var(--color-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => `${v}`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: "var(--color-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => `${v}ms`} />
                    <Tooltip content={<TrendTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                    <Bar yAxisId="left" dataKey="volume" fill="url(#volGrad)" stroke="rgba(233,30,140,0.15)" strokeWidth={1} radius={[3, 3, 0, 0]} />
                    <Line yAxisId="left" type="monotone" dataKey="throughput" stroke="var(--color-brand)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-brand)", strokeWidth: 0 }} activeDot={{ r: 4, fill: "var(--color-brand)", strokeWidth: 0 }} />
                    <Line yAxisId="right" type="monotone" dataKey="latency" stroke="rgba(77,158,255,0.7)" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: "rgba(77,158,255,0.9)", strokeWidth: 0 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div
              className="rounded-lg p-5 flex flex-col"
              style={{ flex: 1, minHeight: 0, backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
            >
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <BarChart2 size={14} style={{ color: "var(--color-brand)" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Incident Trends</p>
                </div>
                <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium"
                  style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
                >
                  By Priority <ChevronDown size={10} />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incidentTrend} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barSize={28}>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="day" tick={{ fill: "var(--color-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--color-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip content={<IncidentTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                    <Bar dataKey="medium"   stackId="s" fill="rgba(233,30,140,0.18)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="high"     stackId="s" fill="rgba(233,30,140,0.38)" />
                    <Bar dataKey="critical" stackId="s" fill="var(--color-brand)"    radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <div className="rounded-lg p-5 shrink-0" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                  Overall SLA Health
                </p>
                <span className="text-[10px] font-semibold px-1.5 py-px rounded" style={{ color: "var(--color-resolved)", backgroundColor: "rgba(45,212,191,0.12)" }}>
                  ↑ +0.4% vs last week
                </span>
              </div>

              <SLARing value={99.4} />

              <div
                className="flex items-center justify-between rounded-lg px-3 py-2 mt-3"
                style={{ backgroundColor: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.15)" }}
              >
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Tier 4 target</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: "var(--color-resolved)" }}>99.0%</span>
                <span className="text-[10px] font-semibold" style={{ color: "var(--color-resolved)" }}>
                  +0.4pp headroom
                </span>
              </div>

              <div className="mt-4 pt-4 space-y-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                  Regional Compliance
                </p>
                {SLA_REGIONS.map(({ region, sla, ok }) => {
                  const barColor = ok ? "var(--color-resolved)" : "var(--color-critical)";
                  const pct      = Math.min(100, (sla / 100) * 100);
                  return (
                    <div key={region}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {ok
                            ? <CheckCircle2 size={10} style={{ color: "var(--color-resolved)" }} />
                            : <XCircle      size={10} style={{ color: "var(--color-critical)" }} />
                          }
                          <span className="text-[11px] font-medium" style={{ color: "var(--color-text-primary)" }}>
                            {region}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold tabular-nums" style={{ color: barColor }}>
                          {sla.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className="rounded-lg p-5 flex flex-col"
              style={{ flex: 1, minHeight: 0, backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
            >
              <div className="flex items-center gap-2 mb-4 shrink-0">
                <Lightbulb size={15} style={{ color: "var(--color-brand)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>AI Insights</p>
              </div>
              <div className="space-y-3 flex-1">
                {aiInsights.map(({ icon: Icon, iconColor, text }, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Icon size={13} className="shrink-0 mt-0.5" style={{ color: iconColor }} />
                    <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                      <BoldText text={text} />
                    </p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowAnalysis(true)}
                className="w-full mt-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all hover:opacity-90 shrink-0"
                style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
              >
                View Full Analysis
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg overflow-hidden" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Generated Reports</p>
            <button className="text-xs font-medium transition-opacity hover:opacity-80" style={{ color: "var(--color-brand)" }}>View Archive</button>
          </div>
          <div className="grid px-5 py-2.5" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 60px", borderBottom: "1px solid var(--color-border)" }}>
            {["Report Name", "Type", "Date", "Status", "Action"].map((h) => (
              <p key={h} className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>{h}</p>
            ))}
          </div>
          {generatedReports.map((report, i) => {
            const st     = STATUS_STYLE[report.status];
            const isLast = i === generatedReports.length - 1;
            return (
              <div
                key={i}
                className="grid items-center px-5 py-3.5 transition-colors"
                style={{
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 60px",
                  borderBottom: isLast ? "none" : "1px solid var(--color-border)",
                }}
              >
                <div className="flex items-center gap-3">
                  <FileText size={14} className="shrink-0" style={{ color: report.iconColor }} />
                  <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{report.name}</span>
                </div>
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{report.type}</span>
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{report.date}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded inline-block w-fit" style={{ color: st.color, backgroundColor: st.bg }}>
                  {report.status}
                </span>
                <div className="flex justify-center">
                  <button
                    onClick={() => report.status !== "ARCHIVED" && downloadReport(report.name, report.type)}
                    className="p-1.5 rounded transition-all hover:scale-110"
                    style={{
                      color: report.status === "ARCHIVED" ? "var(--color-text-muted)" : "var(--color-resolved)",
                      cursor: report.status === "ARCHIVED" ? "default" : "pointer",
                    }}
                    title={report.status === "ARCHIVED" ? "Archived" : `Download ${report.name}`}
                  >
                    {report.status === "ARCHIVED" ? <Eye size={14} /> : <Download size={14} />}
                  </button>
                </div>
              </div>
            );
          })}
          <div className="px-5 py-3" style={{ borderTop: "1px solid var(--color-border)" }}>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Showing 4 of 124 Reports</p>
          </div>
        </div>
      </div>

      {showAnalysis && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAnalysis(false); }}
        >
          <div
            className="rounded-2xl flex flex-col overflow-hidden"
            style={{
              width: 600,
              maxHeight: "85vh",
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
            }}
          >
            <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <div className="flex items-center gap-3">
                <Lightbulb size={18} style={{ color: "var(--color-brand)" }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>Full AI Analysis</p>
                  <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>Network intelligence report — last 7 days</p>
                </div>
              </div>
              <button onClick={() => setShowAnalysis(false)} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--color-text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5" style={{ scrollbarWidth: "thin" }}>
              {aiInsights.map(({ icon: Icon, iconColor, text }, i) => (
                <div key={i} className="rounded-xl p-4" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} style={{ color: iconColor }} />
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: iconColor }}>
                      {i === 0 ? "Performance" : i === 1 ? "Warning" : "Status"}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
                    <BoldText text={text} />
                  </p>
                </div>
              ))}

              <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>
                  Regional SLA Compliance — 7D
                </p>
                <div className="space-y-3">
                  {SLA_REGIONS.map(({ region, sla, ok }) => {
                    const color = ok ? "var(--color-resolved)" : "var(--color-critical)";
                    return (
                      <div key={region}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            {ok ? <CheckCircle2 size={12} style={{ color }} /> : <XCircle size={12} style={{ color }} />}
                            <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{region}</span>
                            {!ok && (
                              <span className="text-[9px] font-bold px-1.5 py-px rounded uppercase" style={{ backgroundColor: "rgba(255,59,59,0.15)", color: "var(--color-critical)" }}>
                                Below Target
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-bold tabular-nums" style={{ color }}>{sla.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, (sla / 100) * 100)}%`, backgroundColor: color }} />
                        </div>
                        <div className="flex justify-between mt-0.5">
                          <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>Target: 99.0%</span>
                          <span className="text-[9px]" style={{ color: ok ? "var(--color-resolved)" : "var(--color-critical)" }}>
                            {ok ? `+${(sla - 99.0).toFixed(1)}pp above` : `−${(99.0 - sla).toFixed(1)}pp below`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(233,30,140,0.06)", border: "1px solid rgba(233,30,140,0.18)" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--color-brand)" }}>
                  MINDR Recommendation
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
                  Priority action: restore LATAM-02 SLA compliance by addressing the backhaul saturation incident (INC-4935). This single region is suppressing the global SLA score by <strong>−0.4pp</strong>. Resolving it would bring global compliance to <strong style={{ color: "var(--color-resolved)" }}>99.8%</strong> — well above Tier 4 target.
                </p>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 shrink-0" style={{ borderTop: "1px solid var(--color-border)" }}>
              <button
                onClick={() => { downloadReport("Full AI Analysis Report", "PDF Report"); setShowAnalysis(false); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
              >
                <Download size={14} />
                Export Report
              </button>
              <button
                onClick={() => setShowAnalysis(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
