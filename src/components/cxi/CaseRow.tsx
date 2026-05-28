import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { MINDRCase, CaseStatus, CaseSeverity, CaseClassification } from "../../types/cxi";

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

// ── Timestamp helper ──────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface CaseRowProps {
  c: MINDRCase;
}

export function CaseRow({ c }: CaseRowProps) {
  return (
    <Link
      to={`/cxi-cases/${c.caseId}`}
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 transition-colors"
      style={{ borderBottom: "1px solid var(--color-border)" }}
    >
      {/* Case ID */}
      <span
        className="text-xs font-bold shrink-0 w-40"
        style={{ color: "var(--color-brand)", fontFamily: "var(--font-mono)" }}
      >
        {c.caseId}
      </span>

      {/* Status pill */}
      <span
        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0"
        style={{ color: statusColor(c.status), backgroundColor: statusBg(c.status) }}
      >
        {c.status}
      </span>

      {/* Severity */}
      <span
        className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0"
        style={{ color: severityColor(c.severity), backgroundColor: severityBg(c.severity) }}
      >
        {c.severity}
      </span>

      {/* Classification */}
      <span
        className="text-[10px] font-medium px-2 py-0.5 rounded-md shrink-0"
        style={{
          color: "var(--color-text-secondary)",
          backgroundColor: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
        }}
      >
        {classificationLabel(c.classification)}
      </span>

      {/* Affected scope */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
          {c.affectedScope.cellName}
        </p>
        <p className="text-[10px] truncate" style={{ color: "var(--color-text-muted)" }}>
          {c.affectedScope.siteName} · {c.affectedScope.region}
        </p>
      </div>

      {/* CXI drop */}
      <div className="text-right shrink-0 w-20">
        <p
          className="text-sm font-bold"
          style={{
            color: c.cxiDrop < -1.5 ? "var(--color-critical)" : "var(--color-warning)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {c.cxiDrop.toFixed(1)}
        </p>
        <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          CXI drop
        </p>
      </div>

      {/* Duration */}
      <div className="text-right shrink-0 w-16">
        <p className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
          {c.duration}
        </p>
        <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          open
        </p>
      </div>

      {/* Assigned agent */}
      <p
        className="text-[10px] truncate shrink-0 w-36"
        style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
      >
        {c.assignedAgent}
      </p>

      {/* Timestamp */}
      <p className="text-[10px] shrink-0 w-16 text-right" style={{ color: "var(--color-text-muted)" }}>
        {relativeTime(c.createdAt)}
      </p>

      {/* Chevron */}
      <ChevronRight size={14} className="shrink-0 ml-1" style={{ color: "var(--color-text-muted)" }} />
    </Link>
  );
}
