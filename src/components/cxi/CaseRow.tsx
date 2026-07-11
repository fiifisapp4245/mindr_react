import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Badge } from "../ui/badge";
import type { MINDRCase, CaseStatus, CaseSeverity, CaseClassification, ActionType } from "../../types/cxi";

// ── Color helpers ─────────────────────────────────────────────────────────────

export function statusColor(s: CaseStatus): string {
  return {
    pending:   "var(--mindr-pending)",
    approved:  "var(--mindr-approved)",
    rejected:  "var(--mindr-rejected)",
    escalated: "var(--mindr-escalated)",
    corrected: "var(--mindr-corrected)",
  }[s];
}

export function statusBg(s: CaseStatus): string {
  return {
    pending:   "rgba(180,80,0,0.15)",
    approved:  "rgba(26,122,74,0.15)",
    rejected:  "rgba(192,57,43,0.15)",
    escalated: "rgba(107,47,160,0.15)",
    corrected: "rgba(26,90,138,0.15)",
  }[s];
}

export function severityColor(s: CaseSeverity): string {
  return { P1: "var(--color-critical)", P2: "var(--color-warning)", P3: "var(--color-mitigating)" }[s];
}

export function severityBg(s: CaseSeverity): string {
  return {
    P1: "rgba(255,59,59,0.12)",
    P2: "rgba(255,176,32,0.12)",
    P3: "rgba(77,158,255,0.12)",
  }[s];
}

export function classificationLabel(c: CaseClassification): string {
  return {
    incident:      "Incident",
    optimization:  "Optimization",
    known_problem: "Known Problem",
    unknown:       "Unknown",
  }[c];
}

// ── Recommendation label ──────────────────────────────────────────────────────

const ACTION_LABEL: Record<ActionType, string> = {
  create_ticket:   "Create Ticket",
  escalate:        "Escalate",
  one_click_reset: "One-Click Reset",
  suppress:        "Suppress",
};

// ── Timestamp helper ──────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Pipeline stage indicator ──────────────────────────────────────────────────
// 6 stages: CCA → DRA → CA → RCA → RA → HVA
// Pending cases: stages 0-4 done (green), stage 5 (HVA) awaiting (amber pulse).
// Actioned cases: all 6 stages done.

const PIPELINE_STAGES = [
  { short: "CCA", label: "Context Collection" },
  { short: "DRA", label: "Data Retrieval" },
  { short: "CA",  label: "Correlation Analysis" },
  { short: "RCA", label: "Root Cause Analysis" },
  { short: "RA",  label: "Recommendation" },
  { short: "HVA", label: "Human Validation" },
];

function PipelineStageIndicator({ status }: { status: CaseStatus }) {
  const activeIdx = status === "pending" ? 5 : 6;

  return (
    <div className="flex items-center gap-px" aria-label="Agent pipeline stages">
      {PIPELINE_STAGES.map((stage, i) => {
        const done   = i < activeIdx;
        const active = i === activeIdx && status === "pending";
        const dotColor = done
          ? "var(--color-resolved)"
          : active
            ? "var(--color-warning)"
            : "rgba(255,255,255,0.12)";
        return (
          <div key={stage.short} className="flex items-center">
            <div
              title={`${stage.label} (${stage.short})`}
              className="w-2.5 h-2.5 rounded-sm"
              style={{
                backgroundColor: dotColor,
                border: active ? "1px solid var(--color-warning)" : "none",
                boxShadow: active ? "0 0 5px rgba(255,176,32,0.5)" : "none",
                flexShrink: 0,
              }}
            />
            {i < 5 && (
              <div
                className="w-1.5 h-px"
                style={{ backgroundColor: done ? "rgba(45,212,191,0.3)" : "rgba(255,255,255,0.06)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface CaseRowProps {
  c: MINDRCase;
}

export function CaseRow({ c }: CaseRowProps) {
  return (
    <Link
      to={`/cxi-cases/${c.caseId}`}
      className="flex items-center gap-4 px-5 py-3 hover:bg-white/5 transition-colors"
      style={{ borderBottom: "1px solid var(--color-border)" }}
    >
      {/* Case ID */}
      <span
        className="text-xs font-bold shrink-0 w-36"
        style={{ color: "var(--color-brand)", fontFamily: "var(--font-mono)" }}
      >
        {c.caseId}
      </span>

      {/* Status pill */}
      <Badge
        className="font-bold uppercase tracking-wider shrink-0 w-20 justify-center"
        style={{ color: statusColor(c.status), backgroundColor: statusBg(c.status) }}
      >
        {c.status}
      </Badge>

      {/* Severity */}
      <Badge
        className="font-bold uppercase tracking-wider shrink-0"
        style={{ color: severityColor(c.severity), backgroundColor: severityBg(c.severity) }}
      >
        {c.severity}
      </Badge>

      {/* Classification */}
      <Badge
        className="font-medium shrink-0 w-20 justify-center"
        style={{
          color: "var(--color-text-secondary)",
          backgroundColor: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
        }}
      >
        {classificationLabel(c.classification)}
      </Badge>

      {/* Affected scope + trigger + cluster/dup signals */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
          {c.affectedScope.cellName}
        </p>
        <p className="text-[10px] truncate" style={{ color: "var(--color-text-muted)" }}>
          {c.affectedScope.siteName} · {c.affectedScope.region}
        </p>
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          {/* Trigger chip */}
          <Badge
            className="text-[8px] px-1.5 py-px uppercase tracking-wide"
            style={{
              backgroundColor: c.triggerType === "cell_based"
                ? "rgba(77,158,255,0.12)"
                : "rgba(255,176,32,0.12)",
              color: c.triggerType === "cell_based"
                ? "var(--color-mitigating)"
                : "var(--color-warning)",
            }}
          >
            {c.triggerType === "cell_based" ? "Cell" : "Customer"}
          </Badge>
          {/* Cluster chip */}
          {c.clusterInfo && (
            <Badge
              className="text-[8px] font-medium px-1.5 py-px"
              style={{
                backgroundColor: "rgba(226,0,122,0.1)",
                color: "var(--color-brand)",
                border: "1px solid rgba(226,0,122,0.2)",
              }}
            >
              Cluster · {c.clusterInfo.clusterId} · {c.clusterInfo.caseCount}
            </Badge>
          )}
          {/* Duplicate risk flag */}
          {c.duplicateRisk && (
            <Badge
              className="text-[8px] px-1.5 py-px"
              style={{
                backgroundColor: "rgba(255,176,32,0.1)",
                color: "var(--color-warning)",
                border: "1px solid rgba(255,176,32,0.2)",
              }}
            >
              Possible duplicate
            </Badge>
          )}
        </div>
      </div>

      {/* CXI score: from → to (Δ) */}
      <div className="text-right shrink-0 w-36">
        <p
          className="text-xs font-bold"
          style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}
        >
          <span style={{ color: "var(--color-text-muted)" }}>{c.cxiBaseline.toFixed(1)}</span>
          <span style={{ color: "var(--color-text-muted)", margin: "0 3px" }}>→</span>
          <span style={{ color: c.cxiCurrent < 3.0 ? "var(--color-critical)" : "var(--color-warning)" }}>
            {c.cxiCurrent.toFixed(1)}
          </span>
        </p>
        <p
          className="text-[10px] font-semibold"
          style={{
            color: c.cxiDrop < -0.75 ? "var(--color-critical)" : "var(--color-warning)",
            fontFamily: "var(--font-mono)",
          }}
        >
          ({c.cxiDrop.toFixed(1)})
        </p>
      </div>

      {/* Duration open */}
      <div className="text-right shrink-0 w-14">
        <p className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
          {c.duration}
        </p>
        <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          open
        </p>
      </div>

      {/* Pipeline stage indicator */}
      <div className="shrink-0 w-24 flex items-center">
        <PipelineStageIndicator status={c.status} />
      </div>

      {/* Recommendation chip */}
      <div className="shrink-0 w-24">
        <Badge
          className="text-[9px] px-2 py-0.5"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          {ACTION_LABEL[c.recommendation.actionType]}
        </Badge>
      </div>

      {/* Age */}
      <p className="text-[10px] shrink-0 w-14 text-right" style={{ color: "var(--color-text-muted)" }}>
        {relativeTime(c.createdAt)}
      </p>

      {/* Chevron */}
      <ChevronRight size={14} className="shrink-0 ml-1" style={{ color: "var(--color-text-muted)" }} />
    </Link>
  );
}
