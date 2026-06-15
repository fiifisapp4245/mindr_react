import { useState, useMemo, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  GitBranch,
  HelpCircle,
  MapPin,
  RotateCcw,
  Zap,
  X,
  AlertTriangle,
  Clock,
  Wrench,
} from "lucide-react";
import {
  ComposedChart,
  Line,
  ReferenceLine,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { mockCases } from "../data/cxi-cases";
import {
  statusColor,
  statusBg,
  severityColor,
  severityBg,
  classificationLabel,
} from "../components/cxi/CaseRow";
import { useCxiLens } from "../contexts/cxi-lens";
import type { CaseClassification, ActionType, MINDRCase } from "../types/cxi";

// ── Sub-metric chart colors (PRD §10.3) ──────────────────────────────────────
// These are raw KPI sub-metrics (0–10 scale), NOT CXI composite scores (1–5).

const METRIC_COLORS = {
  voiceMOS:       "#E2007A",
  dataThroughput: "#1A7A4A",
  accessibility:  "#1A5A8A",
  retainability:  "#B45000",
  mobility:       "#6B2FA0",
} as const;

const METRIC_LABELS: Record<keyof typeof METRIC_COLORS, string> = {
  voiceMOS:       "Voice MOS",
  dataThroughput: "Data Throughput",
  accessibility:  "Accessibility Rate",
  retainability:  "Retainability Rate",
  mobility:       "Mobility Rate",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  backgroundColor: "var(--color-bg-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  padding: "8px 12px",
  color: "var(--color-text-primary)",
  fontSize: 13,
  fontFamily: "var(--font-ui)",
  outline: "none",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtHHmm(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function fmtFull(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
function relTime(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Status banner ─────────────────────────────────────────────────────────────

function StatusBanner({ c }: { c: MINDRCase }) {
  const cfg = {
    approved:  { bg: "rgba(26,122,74,0.15)",   border: "rgba(26,122,74,0.4)",   color: "var(--mindr-approved)",  icon: <Check size={14} /> },
    rejected:  { bg: "rgba(192,57,43,0.15)",   border: "rgba(192,57,43,0.4)",   color: "var(--mindr-rejected)",  icon: <X size={14} /> },
    corrected: { bg: "rgba(180,80,0,0.12)",     border: "rgba(180,80,0,0.35)",   color: "var(--color-warning)",   icon: <GitBranch size={14} /> },
    escalated: { bg: "rgba(107,47,160,0.15)",  border: "rgba(107,47,160,0.4)",  color: "var(--mindr-escalated)", icon: <AlertTriangle size={14} /> },
    pending:   null,
  }[c.status];

  if (!cfg) return null;

  return (
    <div
      className="flex items-start gap-3 px-6 py-3 shrink-0"
      style={{ backgroundColor: cfg.bg, borderBottom: `1px solid ${cfg.border}` }}
    >
      <span style={{ color: cfg.color, marginTop: 1 }}>{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        {c.status === "approved" && (
          <p className="text-xs font-semibold" style={{ color: cfg.color }}>
            Approved by{" "}
            <span style={{ color: "var(--color-text-primary)" }}>{c.reviewedBy}</span>
            {c.reviewedAt && <> · <span style={{ color: "var(--color-text-muted)" }}>{fmtFull(c.reviewedAt)}</span></>}
          </p>
        )}
        {c.status === "rejected" && (
          <>
            <p className="text-xs font-semibold" style={{ color: cfg.color }}>
              Rejected by{" "}
              <span style={{ color: "var(--color-text-primary)" }}>{c.reviewedBy}</span>
              {c.reviewedAt && <> · {relTime(c.reviewedAt)}</>}
            </p>
            {c.rejectionReason && (
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                {c.rejectionReason.category}
                {c.rejectionReason.note && ` — ${c.rejectionReason.note}`}
              </p>
            )}
          </>
        )}
        {c.status === "corrected" && c.correction && (
          <>
            <p className="text-xs font-semibold" style={{ color: cfg.color }}>
              Classification corrected by {c.reviewedBy ?? "reviewer"}
            </p>
            <div className="flex items-center gap-2 mt-0.5 text-[11px]">
              <span style={{ color: "var(--color-text-muted)" }}>{classificationLabel(c.classification)}</span>
              <span style={{ color: "var(--color-text-muted)" }}>→</span>
              <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
                {classificationLabel(c.correction.correctedClassification)}
              </span>
            </div>
          </>
        )}
        {c.status === "escalated" && (
          <p className="text-xs font-semibold" style={{ color: cfg.color }}>
            Escalated to L2/L3 Engineering for manual investigation
            {c.reviewedBy && <> · by <span style={{ color: "var(--color-text-primary)" }}>{c.reviewedBy}</span></>}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Sub-metric chart tooltip ──────────────────────────────────────────────────

function SubMetricTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2.5 text-xs"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        minWidth: 200,
      }}
    >
      <p className="font-semibold mb-1" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>{label}</p>
      <p className="text-[9px] mb-1.5 italic" style={{ color: "var(--color-text-muted)" }}>Raw KPI scale (0–10, not CXI)</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-3">
          <span style={{ color: p.color }}>{METRIC_LABELS[p.name as keyof typeof METRIC_COLORS] ?? p.name}</span>
          <span className="font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>
            {p.value.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Confidence progress bar ───────────────────────────────────────────────────

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 70 ? "var(--color-resolved)" : value >= 40 ? "var(--color-warning)" : "var(--color-critical)";
  const label = value >= 70 ? "High confidence" : value >= 40 ? "Moderate confidence" : "Low — escalation recommended";
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
          Confidence
        </span>
        <span className="text-xs font-bold" style={{ color, fontFamily: "var(--font-mono)" }}>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${value}%`, backgroundColor: color, transition: "width 0.6s ease" }}
        />
      </div>
      <p className="text-[10px] mt-1" style={{ color }}>{label}</p>
    </div>
  );
}

// ── Sleeping cell panel ───────────────────────────────────────────────────────

function SleepingCellPanel({ cellId, cellName }: { cellId: string; cellName: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(77,158,255,0.35)", backgroundColor: "rgba(77,158,255,0.05)" }}
    >
      <div
        className="px-5 py-3 flex items-center gap-2"
        style={{ borderBottom: "1px solid rgba(77,158,255,0.2)", backgroundColor: "rgba(77,158,255,0.1)" }}
      >
        <Zap size={13} style={{ color: "var(--color-mitigating)" }} />
        <p className="text-sm font-semibold" style={{ color: "var(--color-mitigating)" }}>One-Click Recovery Available</p>
        <span
          className="ml-auto text-[9px] font-bold px-2 py-px rounded-full uppercase tracking-wider"
          style={{ backgroundColor: "rgba(77,158,255,0.2)", color: "var(--color-mitigating)" }}
        >
          Sleeping Cell
        </span>
      </div>
      <div className="px-5 py-4">
        <p className="text-xs mb-3" style={{ color: "var(--color-text-secondary)" }}>
          MINDR has identified this as a recoverable sleeping cell. An automated parameter reset can restore normal
          operation without field intervention.
        </p>
        <div className="flex items-center gap-4 mb-4 text-xs">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--color-text-muted)" }}>Target Cell</p>
            <p className="font-bold mt-0.5" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>{cellId}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--color-text-muted)" }}>Cell Name</p>
            <p className="mt-0.5" style={{ color: "var(--color-text-primary)" }}>{cellName}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--color-text-muted)" }}>Est. Restore</p>
            <p className="mt-0.5" style={{ color: "var(--color-resolved)" }}>~4 min</p>
          </div>
        </div>
        {state === "idle" && (
          <button
            onClick={() => { setState("loading"); setTimeout(() => setState("done"), 2200); }}
            className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "var(--color-mitigating)", color: "#fff" }}
          >
            <RotateCcw size={14} />
            Execute One-Click Reset
          </button>
        )}
        {state === "loading" && (
          <div className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            style={{ backgroundColor: "rgba(77,158,255,0.15)", border: "1px solid rgba(77,158,255,0.3)", color: "var(--color-mitigating)" }}>
            <span className="w-4 h-4 rounded-full border-2 animate-spin shrink-0"
              style={{ borderColor: "var(--color-mitigating)", borderTopColor: "transparent" }} />
            Executing reset…
          </div>
        )}
        {state === "done" && (
          <div className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            style={{ backgroundColor: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.3)", color: "var(--color-resolved)" }}>
            <Check size={14} />
            Reset executed — cell recovering
          </div>
        )}
      </div>
    </div>
  );
}

// ── Evidence accordion ────────────────────────────────────────────────────────

function Accordion({
  title, count, accentColor, isOpen, onToggle, children,
}: {
  title: string; count: number; accentColor?: string;
  isOpen: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{ borderBottom: "1px solid var(--color-border)" }}>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full py-2.5 text-left hover:opacity-80 transition-opacity"
      >
        <span className="text-xs font-semibold flex-1" style={{ color: "var(--color-text-primary)" }}>{title}</span>
        {count > 0 && (
          <span className="text-[9px] font-bold px-1.5 py-px rounded-full"
            style={{
              backgroundColor: accentColor ? `${accentColor}20` : "var(--color-bg-elevated)",
              color: accentColor ?? "var(--color-text-muted)",
            }}>
            {count}
          </span>
        )}
        <ChevronDown size={13} style={{
          color: "var(--color-text-muted)",
          transform: isOpen ? "rotate(180deg)" : "none",
          transition: "transform 0.2s ease",
        }} />
      </button>
      {isOpen && <div className="pb-3">{children}</div>}
    </div>
  );
}

// ── Evidence table ────────────────────────────────────────────────────────────

function EvidenceTable({ headers, rows, empty }: {
  headers: string[];
  rows: React.ReactNode[];
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <div
        className="flex items-center gap-2 text-[11px] py-2.5 px-1"
        style={{ color: "var(--color-text-muted)" }}
      >
        <Check size={12} style={{ color: "var(--color-resolved)", flexShrink: 0 }} />
        {empty}
      </div>
    );
  }
  return (
    <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} className="text-left pb-2 pr-3" style={{
              color: "var(--color-text-muted)", fontSize: 9,
              fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em",
              borderBottom: "1px solid var(--color-border)",
            }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

// ── Modal shell ───────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.72)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-6"
        style={{
          backgroundColor: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h3>
          <button onClick={onClose} className="hover:opacity-80" style={{ color: "var(--color-text-muted)" }}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-text-muted)" }}>{label}</p>
      <div className="px-3 py-2 rounded-lg text-sm"
        style={{ backgroundColor: "var(--color-bg-base)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
        {value}
      </div>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ModalType = "reject" | "escalate" | "correct" | "approve" | null;
type ApproveStep = "idle" | "confirm" | "acting" | "done";
type CorrectStep = "form" | "running" | "done";
type TimeRange = "6h" | "24h" | "7d";

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CxiCaseDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { lens } = useCxiLens();
  const c = useMemo(() => mockCases.find((m) => m.caseId === caseId), [caseId]);

  // Action states
  const [approveStep, setApproveStep] = useState<ApproveStep>("idle");
  const [modal, setModal] = useState<ModalType>(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [escalateLoading, setEscalateLoading] = useState(false);

  // Form state
  const [rejectCategory, setRejectCategory] = useState("Wrong classification");
  const [rejectNote, setRejectNote] = useState("");
  const [escalateNote, setEscalateNote] = useState("");
  const [correctStep, setCorrectStep] = useState<CorrectStep>("form");
  const [correctedClassification, setCorrectedClassification] = useState<CaseClassification>("incident");
  const [correctedHypothesis, setCorrectedHypothesis] = useState("");
  const [correctedEvidence, setCorrectedEvidence] = useState("");
  const [correctedAction, setCorrectedAction] = useState<ActionType | "">("");

  // B6: role-aware accordion defaults — RAN expands changes; SMC expands alarms + tickets
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    if (lens === "ran") return new Set(["changes"]);
    if (lens === "smc") return new Set(["alarms", "tickets"]);
    return new Set(["alarms"]);
  });

  const [timeRange, setTimeRange] = useState<TimeRange>("24h");

  useEffect(() => {
    if (modal === "correct" && c) {
      setCorrectedClassification(c.classification);
      setCorrectedHypothesis(c.hypothesis.text);
      setCorrectedEvidence("");
      setCorrectedAction("");
      setCorrectStep("form");
    }
  }, [modal, c]);

  if (!c) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4" style={{ backgroundColor: "var(--color-bg-base)" }}>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Case not found: {caseId}</p>
        <Link to="/cxi-cases" className="text-xs font-medium" style={{ color: "var(--color-brand)" }}>← Back to Cases</Link>
      </div>
    );
  }

  // Time-range filtered chart data
  const chartData = useMemo(() => {
    const pts = c.cxiTimeseries;
    if (timeRange === "6h") return pts.slice(-12).map((p) => ({ ...p, t: fmtHHmm(p.t) }));
    if (timeRange === "24h") return pts.filter((_, i) => i % 4 === 0).map((p) => ({ ...p, t: fmtHHmm(p.t) }));
    return pts.filter((_, i) => i % 8 === 0).map((p) => ({ ...p, t: fmtHHmm(p.t) }));
  }, [c.cxiTimeseries, timeRange]);

  function toggleSection(s: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  }

  function handleApproveConfirm() {
    setApproveStep("acting");
    setTimeout(() => setApproveStep("done"), 1400);
  }

  function handleRejectSubmit() {
    setRejectLoading(true);
    setTimeout(() => { setRejectLoading(false); setModal(null); }, 1200);
  }

  function handleEscalateSubmit() {
    setEscalateLoading(true);
    setTimeout(() => { setEscalateLoading(false); setModal(null); }, 1200);
  }

  function handleCorrectSubmit() {
    setCorrectStep("running");
    setTimeout(() => setCorrectStep("done"), 2000);
    setTimeout(() => setModal(null), 3400);
  }

  const caseIsActioned = c.status !== "pending";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: "var(--color-bg-base)" }}>

      {/* Status banner */}
      <StatusBanner c={c} />

      {/* ════ Two-column layout ════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT — Scope + Chart + Evidence + Audit Trail ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-w-0">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <button onClick={() => navigate("/cxi-cases")}
              className="flex items-center gap-1 hover:opacity-80 transition-opacity">
              <ArrowLeft size={13} />
              CXI Cases
            </button>
            <ChevronRight size={11} />
            <span style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}>{c.caseId}</span>
          </div>

          {/* Case header */}
          <div className="rounded-xl p-5" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                    style={{ color: statusColor(c.status), backgroundColor: statusBg(c.status) }}>{c.status}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
                    style={{ color: severityColor(c.severity), backgroundColor: severityBg(c.severity) }}>{c.severity}</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                    style={{ color: "var(--color-text-secondary)", backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
                    {classificationLabel(c.classification)}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                    style={{ color: "var(--color-text-muted)", backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
                    {c.triggerType === "cell_based" ? "Cell-based" : "Customer-based"}
                  </span>
                </div>
                <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>{c.caseId}</h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                  {c.affectedScope.cellName} · {c.affectedScope.siteName}
                </p>
              </div>
              <div className="text-right text-xs space-y-1 shrink-0">
                <p style={{ color: "var(--color-text-muted)" }}>Created: <span style={{ color: "var(--color-text-primary)" }}>{fmtFull(c.createdAt)}</span></p>
                <p style={{ color: "var(--color-text-muted)" }}>Agent: <span style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>{c.assignedAgent}</span></p>
                <p style={{ color: "var(--color-text-muted)" }}>Duration: <span style={{ color: "var(--color-text-primary)" }}>{c.duration}</span></p>
              </div>
            </div>

            {/* B1: CXI values on 1–5 scale */}
            <div className="flex items-center gap-6 mt-4 pt-4 flex-wrap" style={{ borderTop: "1px solid var(--color-border)" }}>
              {[
                { label: "Baseline CXI",  value: c.cxiBaseline.toFixed(1), color: "var(--color-text-primary)" },
                { label: "Current CXI",   value: c.cxiCurrent.toFixed(1),  color: c.cxiCurrent < 3.5 ? "var(--color-critical)" : "var(--color-warning)" },
                { label: "CXI Drop",      value: c.cxiDrop.toFixed(1),     color: "var(--color-critical)" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>{label}</p>
                  <p className="text-2xl font-bold leading-none mt-0.5" style={{ color, fontFamily: "var(--font-mono)" }}>{value}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>/5 scale</p>
                </div>
              ))}
              <div className="ml-auto text-right">
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>CXI Threshold</p>
                <p className="text-2xl font-bold leading-none mt-0.5" style={{ color: "var(--cxi-threshold-line)", fontFamily: "var(--font-mono)" }}>3.5</p>
                <p className="text-[9px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>/5 scale</p>
              </div>
            </div>
          </div>

          {/* Affected scope */}
          <div className="rounded-xl p-5" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={13} style={{ color: "var(--color-brand)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Affected Scope</p>
            </div>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs">
              {[
                { label: "Cell ID",      value: c.affectedScope.cellId },
                { label: "Cell Name",    value: c.affectedScope.cellName },
                { label: "Site Name",    value: c.affectedScope.siteName },
                { label: "Cluster",      value: c.affectedScope.cluster },
                { label: "Region",       value: c.affectedScope.region },
                { label: "Coordinates",  value: `${c.affectedScope.geoLat.toFixed(4)}, ${c.affectedScope.geoLng.toFixed(4)}` },
                { label: "Trigger Type", value: c.triggerType === "cell_based" ? "Cell-based" : "Customer-based" },
                ...(c.affectedScope.customerId ? [{ label: "Customer ID", value: c.affectedScope.customerId }] : []),
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--color-text-muted)" }}>{label}</p>
                  <p style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* B1: Sub-metric chart — clearly labelled as raw KPI scale, not CXI */}
          <div className="rounded-xl p-5" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="flex items-center justify-between mb-1 gap-2">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  Sub-metric Trend
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                  Raw KPI scale (0–10) — Voice, Data, Accessibility, Retainability, Mobility.
                  <span className="ml-1 font-semibold" style={{ color: "var(--color-warning)" }}>
                    These are not CXI scores.
                  </span>
                </p>
              </div>
              <div className="flex items-center rounded-md overflow-hidden shrink-0" style={{ border: "1px solid var(--color-border)" }}>
                {(["6h", "24h", "7d"] as TimeRange[]).map((r) => (
                  <button key={r} onClick={() => setTimeRange(r)}
                    className="px-2.5 py-1 text-[10px] font-medium transition-colors"
                    style={{
                      color: timeRange === r ? "var(--color-text-primary)" : "var(--color-text-muted)",
                      backgroundColor: timeRange === r ? "var(--color-bg-elevated)" : "transparent",
                    }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 mb-3 flex-wrap">
              {(Object.keys(METRIC_COLORS) as (keyof typeof METRIC_COLORS)[]).map((key) => (
                <span key={key} className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  <span className="inline-block w-4 h-0.5 rounded-full" style={{ backgroundColor: METRIC_COLORS[key] }} />
                  {METRIC_LABELS[key]}
                </span>
              ))}
              <span className="flex items-center gap-1.5 text-[10px] ml-auto" style={{ color: "var(--cxi-threshold-line)" }}>
                <span className="w-4 inline-block" style={{ borderTop: "1.5px dashed var(--cxi-threshold-line)" }} />
                Sub-metric threshold 7.0
              </span>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="t" tick={{ fill: "var(--color-text-muted)", fontSize: 10, fontFamily: "var(--font-ui)" }}
                    axisLine={false} tickLine={false} interval={2} />
                  <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]}
                    tick={{ fill: "var(--color-text-muted)", fontSize: 10, fontFamily: "var(--font-ui)" }}
                    axisLine={false} tickLine={false} width={26} />
                  <Tooltip content={<SubMetricTooltip />} cursor={{ stroke: "rgba(255,255,255,0.07)", strokeWidth: 1 }} />
                  <ReferenceLine y={7.0} stroke="var(--cxi-threshold-line)" strokeDasharray="4 4" strokeWidth={1.5} />
                  {(Object.keys(METRIC_COLORS) as (keyof typeof METRIC_COLORS)[]).map((key) => (
                    <Line key={key} type="monotone" dataKey={key}
                      stroke={METRIC_COLORS[key]} strokeWidth={1.5} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sleeping cell panel */}
          {c.recommendation.oneClickAvailable && (
            <SleepingCellPanel cellId={c.affectedScope.cellId} cellName={c.affectedScope.cellName} />
          )}

          {/* Evidence */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-elevated)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Evidence</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                Correlated alarms, changes, and tickets
              </p>
            </div>
            <div className="px-5 py-2">
              <Accordion title="Active Alarms" count={c.evidence.alarms.length} accentColor="var(--color-critical)"
                isOpen={openSections.has("alarms")} onToggle={() => toggleSection("alarms")}>
                <EvidenceTable headers={["Alarm ID", "Type", "Severity", "Start Time", "Status"]}
                  empty="No active alarms found in search window — confirmed absence, not missing data"
                  rows={c.evidence.alarms.map((a) => (
                    <tr key={a.alarmId} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td className="py-2 pr-4 font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)", fontSize: 11 }}>{a.alarmId}</td>
                      <td className="py-2 pr-4" style={{ color: "var(--color-text-secondary)", fontSize: 11 }}>{a.type}</td>
                      <td className="py-2 pr-4"><span className="text-[9px] font-bold px-1.5 py-px rounded-full"
                        style={{ color: severityColor(a.severity), backgroundColor: severityBg(a.severity) }}>{a.severity}</span></td>
                      <td className="py-2 pr-4 text-[10px]" style={{ color: "var(--color-text-muted)" }}>{relTime(a.startTime)}</td>
                      <td className="py-2"><span className="text-[9px] px-1.5 py-px rounded-full"
                        style={{ color: a.status === "Active" ? "var(--color-critical)" : "var(--color-resolved)", backgroundColor: a.status === "Active" ? "rgba(255,59,59,0.12)" : "rgba(45,212,191,0.12)" }}>{a.status}</span></td>
                    </tr>
                  ))} />
              </Accordion>

              {/* B4: Negatives reconciled — empty state now explicitly says "none found in 72h window" */}
              <Accordion title="Recent Changes" count={c.evidence.changes.length} accentColor="var(--color-mitigating)"
                isOpen={openSections.has("changes")} onToggle={() => toggleSection("changes")}>
                <EvidenceTable headers={["Change ID", "Description", "Initiated By", "Time", "Status"]}
                  empty="No change records found in 72h search window — consistent with hypothesis"
                  rows={c.evidence.changes.map((ch) => (
                    <tr key={ch.changeId} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td className="py-2 pr-4 font-bold" style={{ color: "var(--color-mitigating)", fontFamily: "var(--font-mono)", fontSize: 11 }}>{ch.changeId}</td>
                      <td className="py-2 pr-4" style={{ color: "var(--color-text-secondary)", fontSize: 11 }}>{ch.description}</td>
                      <td className="py-2 pr-4 text-[10px]" style={{ color: "var(--color-text-muted)" }}>{ch.initiatedBy}</td>
                      <td className="py-2 pr-4 text-[10px]" style={{ color: "var(--color-text-muted)" }}>{relTime(ch.time)}</td>
                      <td className="py-2 text-[10px]" style={{ color: "var(--color-text-muted)" }}>{ch.status}</td>
                    </tr>
                  ))} />
              </Accordion>

              <Accordion title="Open Tickets" count={c.evidence.tickets.length} accentColor="var(--color-warning)"
                isOpen={openSections.has("tickets")} onToggle={() => toggleSection("tickets")}>
                <EvidenceTable headers={["Ticket ID", "Title", "Team", "Priority", "Created"]}
                  empty="No tickets found — no prior incident or problem record linked to this cell"
                  rows={c.evidence.tickets.map((tk) => (
                    <tr key={tk.ticketId} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td className="py-2 pr-4 font-bold" style={{ color: "var(--color-warning)", fontFamily: "var(--font-mono)", fontSize: 11 }}>{tk.ticketId}</td>
                      <td className="py-2 pr-4" style={{ color: "var(--color-text-secondary)", fontSize: 11 }}>{tk.title}</td>
                      <td className="py-2 pr-4 text-[10px]" style={{ color: "var(--color-text-muted)" }}>{tk.team}</td>
                      <td className="py-2 pr-4"><span className="text-[9px] font-bold px-1.5 py-px rounded-full"
                        style={{ color: severityColor(tk.priority), backgroundColor: severityBg(tk.priority) }}>{tk.priority}</span></td>
                      <td className="py-2 text-[10px]" style={{ color: "var(--color-text-muted)" }}>{relTime(tk.created)}</td>
                    </tr>
                  ))} />
              </Accordion>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-elevated)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Audit Trail</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                Full agent pipeline history — newest first
              </p>
            </div>
            <div className="px-5 py-4">
              {[...c.auditTrail].reverse().map((entry, i) => (
                <div key={i} className="flex gap-3 pb-4 relative">
                  {i < c.auditTrail.length - 1 && (
                    <div className="absolute left-3 top-6 bottom-0 w-px" style={{ backgroundColor: "var(--color-border)" }} />
                  )}
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      backgroundColor: entry.actorType === "reviewer" ? "var(--color-brand)" : "var(--color-bg-elevated)",
                      border: `1px solid ${entry.actorType === "system" ? "var(--color-border)" : "transparent"}`,
                      zIndex: 1,
                    }}>
                    {entry.actorType === "reviewer"
                      ? <Check size={10} color="#fff" />
                      : entry.actorType === "mindr"
                      ? <AlertTriangle size={10} style={{ color: "var(--color-warning)" }} />
                      : <Clock size={10} style={{ color: "var(--color-text-muted)" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>{entry.action}</p>
                      <span className="text-[10px] shrink-0" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                        {relTime(entry.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{entry.detail}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{entry.actor}</p>
                    {entry.diff && (
                      <div className="mt-2 rounded-lg overflow-hidden text-[10px]" style={{ border: "1px solid var(--color-border)" }}>
                        <div className="px-3 py-1.5 flex items-start gap-2"
                          style={{ backgroundColor: "rgba(255,59,59,0.08)", borderBottom: "1px solid var(--color-border)" }}>
                          <span className="font-bold shrink-0" style={{ color: "var(--color-critical)" }}>−</span>
                          <span style={{ color: "var(--color-text-muted)" }}>{entry.diff.before}</span>
                        </div>
                        <div className="px-3 py-1.5 flex items-start gap-2" style={{ backgroundColor: "rgba(45,212,191,0.06)" }}>
                          <span className="font-bold shrink-0" style={{ color: "var(--color-resolved)" }}>+</span>
                          <span style={{ color: "var(--color-text-primary)" }}>{entry.diff.after}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── RIGHT — Hypothesis + Remediation Proposal + Review Actions ── */}
        <div
          className="overflow-y-auto px-5 py-5 space-y-4 shrink-0"
          style={{ width: "35%", borderLeft: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
        >
          {/* Hypothesis */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <GitBranch size={13} style={{ color: "var(--color-brand)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>CXI Hypothesis</p>
              </div>
              <span className="text-[10px] font-semibold px-1.5 py-px rounded-md"
                style={{ backgroundColor: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>
                {classificationLabel(c.classification)}
              </span>
            </div>

            <ConfidenceBar value={c.hypothesis.confidence} />

            <p className="text-xs leading-relaxed mt-3 mb-3" style={{ color: "var(--color-text-primary)" }}>
              {c.hypothesis.text}
            </p>

            {/* Supporting signals */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>
                Supporting Signals
              </p>
              <ul className="space-y-1.5">
                {c.hypothesis.signals.map((sig, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                    <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: "var(--color-brand)" }} />
                    {sig}
                  </li>
                ))}
              </ul>
            </div>

            {/* B2: Open uncertainties */}
            {c.hypothesis.openUncertainties && c.hypothesis.openUncertainties.length > 0 && (
              <div
                className="mt-3 pt-3"
                style={{ borderTop: "1px solid var(--color-border)" }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <HelpCircle size={11} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                    Open Uncertainties
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {c.hypothesis.openUncertainties.map((u, i) => (
                    <li
                      key={i}
                      className="text-[11px] leading-snug pl-3"
                      style={{
                        color: "var(--color-text-muted)",
                        borderLeft: "2px solid rgba(255,176,32,0.3)",
                      }}
                    >
                      {u}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-[9px] mt-3" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
              {c.hypothesis.agentVersion}
            </p>
          </div>

          {/* B3: Structured Remediation Proposal */}
          <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Wrench size={13} style={{ color: "var(--color-mitigating)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Remediation Proposal</p>
            </div>

            {/* Action type chip */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider"
                style={{
                  backgroundColor: "rgba(77,158,255,0.12)",
                  color: "var(--color-mitigating)",
                  border: "1px solid rgba(77,158,255,0.25)",
                }}
              >
                {c.recommendation.actionType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                → {c.recommendation.targetTeam}
              </span>
            </div>

            {/* Proposed action */}
            {c.recommendation.proposedAction && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>
                  Proposed Action
                </p>
                <p className="text-[11px] leading-snug" style={{ color: "var(--color-text-primary)" }}>
                  {c.recommendation.proposedAction}
                </p>
              </div>
            )}

            {/* Expected effect */}
            {c.recommendation.expectedEffect && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>
                  Expected Effect
                </p>
                <p className="text-[11px] leading-snug" style={{ color: "var(--color-text-secondary)" }}>
                  {c.recommendation.expectedEffect}
                </p>
              </div>
            )}

            {/* Routing rationale */}
            <div className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>
                Why This Routing
              </p>
              <p className="text-[11px] leading-snug" style={{ color: "var(--color-text-secondary)" }}>
                {c.recommendation.rationale}
              </p>
            </div>

            {/* Alternatives considered */}
            {c.recommendation.alternativesConsidered && (
              <div
                className="pt-2.5 mt-2.5"
                style={{ borderTop: "1px solid var(--color-border)" }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>
                  Alternatives Considered
                </p>
                <p className="text-[11px] leading-snug" style={{ color: "var(--color-text-muted)" }}>
                  {c.recommendation.alternativesConsidered}
                </p>
              </div>
            )}

            {/* Supporting metadata */}
            <div
              className="grid grid-cols-2 gap-2 pt-2.5 mt-2.5"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--color-text-muted)" }}>Ticket Type</p>
                <p className="text-xs" style={{ color: "var(--color-text-primary)" }}>{c.recommendation.ticketType}</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--color-text-muted)" }}>One-Click</p>
                <p className="text-xs" style={{ color: c.recommendation.oneClickAvailable ? "var(--color-resolved)" : "var(--color-text-muted)" }}>
                  {c.recommendation.oneClickAvailable ? "Available" : "Not available"}
                </p>
              </div>
            </div>
          </div>

          {/* Review Actions */}
          <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--color-text-muted)" }}>
              Review Actions
            </p>

            {approveStep === "acting" && (
              <div className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 mb-3"
                style={{ backgroundColor: "rgba(26,122,74,0.12)", border: "1px solid rgba(26,122,74,0.3)" }}>
                <span className="w-4 h-4 rounded-full border-2 animate-spin shrink-0"
                  style={{ borderColor: "var(--mindr-approved)", borderTopColor: "transparent" }} />
                <span className="text-xs font-medium" style={{ color: "var(--mindr-approved)" }}>Approving…</span>
              </div>
            )}

            {approveStep === "done" && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-3"
                style={{ backgroundColor: "rgba(26,122,74,0.12)", border: "1px solid rgba(26,122,74,0.35)" }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "var(--mindr-approved)" }}>
                  <Check size={11} color="#fff" />
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--mindr-approved)" }}>Case approved</p>
                  <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Recommended action triggered</p>
                </div>
              </div>
            )}

            <button
              onClick={() => !caseIsActioned && approveStep === "idle" ? setModal("approve") : undefined}
              disabled={caseIsActioned || approveStep !== "idle"}
              className="w-full py-3.5 rounded-xl text-base font-bold mb-3 transition-opacity"
              style={{ backgroundColor: "var(--mindr-approved)", color: "#fff", opacity: (caseIsActioned || approveStep !== "idle") ? 0.4 : 1 }}
            >
              Approve
            </button>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setModal("correct")}
                disabled={caseIsActioned}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity"
                style={{ backgroundColor: "rgba(180,80,0,0.2)", color: "var(--color-warning)", border: "1px solid rgba(180,80,0,0.4)", opacity: caseIsActioned ? 0.4 : 1 }}
              >
                Correct
              </button>
              <button
                onClick={() => setModal("reject")}
                disabled={caseIsActioned}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity"
                style={{ backgroundColor: "transparent", color: "var(--mindr-rejected)", border: "1px solid var(--mindr-rejected)", opacity: caseIsActioned ? 0.4 : 1 }}
              >
                Reject
              </button>
            </div>

            {/* B5: Consistent escalation label — "Escalate to L2/L3" */}
            <button
              onClick={() => setModal("escalate")}
              disabled={c.status === "escalated"}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-opacity"
              style={{
                backgroundColor: "transparent",
                color: c.status === "escalated" ? "var(--mindr-escalated)" : "var(--color-text-muted)",
                border: `1px solid ${c.status === "escalated" ? "var(--mindr-escalated)" : "var(--color-border)"}`,
                opacity: c.status === "escalated" ? 0.5 : 1,
              }}
            >
              {c.status === "escalated" ? "Already Escalated" : "Escalate to L2/L3"}
            </button>

            {c.correction && (
              <div className="mt-3 rounded-lg px-3 py-2.5 text-xs"
                style={{ backgroundColor: "rgba(26,90,138,0.15)", border: "1px solid rgba(26,90,138,0.3)" }}>
                <p className="font-semibold mb-1" style={{ color: "var(--mindr-corrected)" }}>Override Applied</p>
                <p style={{ color: "var(--color-text-muted)" }}>
                  Changed to <span style={{ color: "var(--color-text-primary)" }}>{classificationLabel(c.correction.correctedClassification)}</span>
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ════ Modals ════ */}

      {/* Approve confirmation modal */}
      {modal === "approve" && (
        <Modal title="Approve CXI Recommendation" onClose={() => setModal(null)}>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            You are about to approve the CXI recommendation for{" "}
            <span style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>{c.caseId}</span>.
          </p>
          <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: "rgba(26,122,74,0.1)", border: "1px solid rgba(26,122,74,0.3)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--mindr-approved)" }}>Action Summary</p>
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--color-text-muted)" }}>Ticket Type</p>
                <p style={{ color: "var(--color-text-primary)" }}>{c.recommendation.ticketType}</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--color-text-muted)" }}>Target Team</p>
                <p style={{ color: "var(--color-text-primary)" }}>{c.recommendation.targetTeam}</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--color-text-muted)" }}>Action</p>
                <p style={{ color: "var(--color-text-primary)" }}>
                  {c.recommendation.actionType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--color-text-muted)" }}>One-Click</p>
                <p style={{ color: c.recommendation.oneClickAvailable ? "var(--color-resolved)" : "var(--color-text-muted)" }}>
                  {c.recommendation.oneClickAvailable ? "Available" : "Not available"}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs mb-5" style={{ color: "var(--color-text-muted)" }}>
            This action cannot be undone. The recommended action will be triggered immediately.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setModal(null)}
              className="flex-1 py-2.5 rounded-xl text-sm"
              style={{ backgroundColor: "var(--color-bg-card)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}>
              Cancel
            </button>
            <button
              onClick={() => { setModal(null); handleApproveConfirm(); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold"
              style={{ backgroundColor: "var(--mindr-approved)", color: "#fff" }}
            >
              Confirm Approval
            </button>
          </div>
        </Modal>
      )}

      {/* Reject modal */}
      {modal === "reject" && (
        <Modal title="Reject MINDR Recommendation" onClose={() => !rejectLoading && setModal(null)}>
          <Field label="Rejection Category">
            <select value={rejectCategory} onChange={(e) => setRejectCategory(e.target.value)} style={INPUT_STYLE}>
              <option>Wrong classification</option>
              <option>Insufficient evidence</option>
              <option>Known false positive</option>
              <option>Out of scope</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="Additional Note (optional)">
            <textarea rows={3} placeholder="Add context..."
              value={rejectNote} onChange={(e) => setRejectNote(e.target.value)}
              style={{ ...INPUT_STYLE, resize: "none" }} />
          </Field>
          <div className="flex gap-2">
            <button onClick={() => setModal(null)} disabled={rejectLoading}
              className="flex-1 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "var(--color-bg-card)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)", opacity: rejectLoading ? 0.4 : 1 }}>
              Cancel
            </button>
            <button onClick={handleRejectSubmit} disabled={rejectLoading}
              className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: "var(--mindr-rejected)", color: "#fff" }}>
              {rejectLoading
                ? <><span className="w-3.5 h-3.5 rounded-full border-2 animate-spin shrink-0"
                    style={{ borderColor: "#fff", borderTopColor: "transparent" }} />Rejecting…</>
                : "Reject Case"}
            </button>
          </div>
        </Modal>
      )}

      {/* B5: Escalate modal — uses "L2/L3" language consistently */}
      {modal === "escalate" && (
        <Modal title="Escalate Case to L2/L3" onClose={() => !escalateLoading && setModal(null)}>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            Escalate{" "}
            <span style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>{c.caseId}</span>{" "}
            to L2/L3 Engineering for manual investigation.
          </p>
          <div className="rounded-lg px-3 py-2 mb-4 text-xs"
            style={{ backgroundColor: "rgba(107,47,160,0.1)", border: "1px solid rgba(107,47,160,0.25)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "var(--mindr-escalated)" }}>
              MINDR Suggested Team
            </p>
            <p style={{ color: "var(--color-text-secondary)" }}>{c.recommendation.targetTeam}</p>
          </div>
          <Field label="Escalation Note">
            <textarea rows={3} placeholder="Reason for escalation..."
              value={escalateNote} onChange={(e) => setEscalateNote(e.target.value)}
              style={{ ...INPUT_STYLE, resize: "none" }} />
          </Field>
          <div className="flex gap-2">
            <button onClick={() => setModal(null)} disabled={escalateLoading}
              className="flex-1 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "var(--color-bg-card)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)", opacity: escalateLoading ? 0.4 : 1 }}>
              Cancel
            </button>
            <button onClick={handleEscalateSubmit} disabled={escalateLoading}
              className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: "var(--mindr-escalated)", color: "#fff" }}>
              {escalateLoading
                ? <><span className="w-3.5 h-3.5 rounded-full border-2 animate-spin shrink-0"
                    style={{ borderColor: "#fff", borderTopColor: "transparent" }} />Escalating…</>
                : "Confirm Escalation"}
            </button>
          </div>
        </Modal>
      )}

      {/* Correction modal */}
      {modal === "correct" && (
        <Modal title="Correct MINDR Analysis" onClose={() => correctStep === "form" && setModal(null)}>
          {correctStep === "running" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <span className="w-10 h-10 rounded-full border-2 animate-spin"
                style={{ borderColor: "var(--color-brand)", borderTopColor: "transparent" }} />
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>MINDR is re-analyzing…</p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>Applying correction and regenerating hypothesis</p>
              </div>
            </div>
          )}
          {correctStep === "done" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--mindr-corrected)" }}>
                <Check size={18} color="#fff" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Correction applied</p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                  Case updated to <span style={{ color: "var(--color-text-primary)" }}>{classificationLabel(correctedClassification)}</span>
                </p>
              </div>
            </div>
          )}
          {correctStep === "form" && (
            <>
              <ReadOnly label="Current Classification" value={classificationLabel(c.classification)} />
              <Field label="Correct Classification">
                <select value={correctedClassification}
                  onChange={(e) => setCorrectedClassification(e.target.value as CaseClassification)}
                  style={INPUT_STYLE}>
                  <option value="incident">Incident</option>
                  <option value="optimization">Optimization</option>
                  <option value="known_problem">Known Problem</option>
                  <option value="unknown">Unknown</option>
                </select>
              </Field>
              <Field label="Corrected Hypothesis">
                <textarea rows={4} placeholder="Describe the correct root cause…"
                  value={correctedHypothesis} onChange={(e) => setCorrectedHypothesis(e.target.value)}
                  style={{ ...INPUT_STYLE, resize: "none" }} />
              </Field>
              <Field label="Supporting Evidence (optional)">
                <textarea rows={2} placeholder="Additional evidence or context…"
                  value={correctedEvidence} onChange={(e) => setCorrectedEvidence(e.target.value)}
                  style={{ ...INPUT_STYLE, resize: "none" }} />
              </Field>
              <Field label="Recommended Action Override (optional)">
                <select value={correctedAction}
                  onChange={(e) => setCorrectedAction(e.target.value as ActionType | "")}
                  style={INPUT_STYLE}>
                  <option value="">Keep original recommendation</option>
                  <option value="create_ticket">Create Ticket</option>
                  <option value="escalate">Escalate</option>
                  <option value="one_click_reset">One-Click Reset</option>
                  <option value="suppress">Suppress</option>
                </select>
              </Field>
              <div className="flex gap-2">
                <button onClick={() => setModal(null)}
                  className="flex-1 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: "var(--color-bg-card)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}>
                  Cancel
                </button>
                <button onClick={handleCorrectSubmit}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: "var(--mindr-corrected)", color: "#fff" }}>
                  Submit Correction
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
