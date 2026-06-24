import { useState } from "react";
import { Download, RefreshCw, ThumbsDown, ThumbsUp, Minus } from "lucide-react";
import {
  VOLTE_REPORTS, FEEDBACK_ENTRIES, PLAYBOOK_RECOMMENDATIONS,
  type FeedbackEntry,
} from "../../data/volte-data";

// ── Tokens ─────────────────────────────────────────────────────────────────────

const REPORT_TYPE_CFG = {
  "post-incident": { label: "Post-incident",  color: "#FF3B3B", bg: "rgba(255,59,59,0.12)" },
  "rca":           { label: "RCA report",     color: "#FFB020", bg: "rgba(255,176,32,0.12)" },
  "sla-weekly":    { label: "SLA weekly",     color: "#4D9EFF", bg: "rgba(77,158,255,0.12)" },
  "accuracy":      { label: "Accuracy",       color: "#2DD4BF", bg: "rgba(45,212,191,0.12)" },
};

// ── Rating button ──────────────────────────────────────────────────────────────

function RatingBtn({ active, kind, onClick }: {
  active: boolean; kind: "accurate" | "partial" | "inaccurate"; onClick: () => void;
}) {
  const cfgs = {
    accurate:   { icon: ThumbsUp,   label: "Accurate",         color: "#2DD4BF", bg: "rgba(45,212,191,0.12)"  },
    partial:    { icon: Minus,       label: "Partial",          color: "#FFB020", bg: "rgba(255,176,32,0.12)"  },
    inaccurate: { icon: ThumbsDown,  label: "Inaccurate",       color: "#FF3B3B", bg: "rgba(255,59,59,0.12)"   },
  };
  const cfg = cfgs[kind];
  const Icon = cfg.icon;
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors"
      style={{
        backgroundColor: active ? cfg.bg : "rgba(255,255,255,0.04)",
        color:           active ? cfg.color : "var(--color-text-muted)",
        border:          active ? `1px solid ${cfg.color}35` : "1px solid var(--color-border)",
      }}>
      <Icon size={10} />{cfg.label}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VolteReports() {
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<Record<string, FeedbackEntry["userRating"]>>(() =>
    Object.fromEntries(FEEDBACK_ENTRIES.map((f) => [f.incidentId, f.userRating]))
  );
  const [acceptedPb, setAcceptedPb] = useState<Set<string>>(new Set());

  function handleFeedback(incidentId: string, rating: FeedbackEntry["userRating"]) {
    setFeedback((prev) => ({ ...prev, [incidentId]: prev[incidentId] === rating ? null : rating }));
  }

  return (
    <div className="flex flex-col gap-8 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Reports</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Volte · auto-generated RCA summaries &amp; learning feedback
          </p>
        </div>
        <div className="text-[11px] flex items-center gap-1.5 mt-1" style={{ color: "var(--color-text-muted)" }}>
          <RefreshCw size={11} />Updated just now
        </div>
      </div>

      {/* ── Auto-generated reports ──────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>
          Auto-generated reports
        </p>
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                {["Report", "Type", "MTTR / SLA", "Generated", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-2.5 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VOLTE_REPORTS.map((rpt, idx) => {
                const typeCfg = REPORT_TYPE_CFG[rpt.type];
                const isDl = downloaded.has(rpt.id);
                const isLast = idx === VOLTE_REPORTS.length - 1;
                return (
                  <tr key={rpt.id} className="hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: isLast ? "none" : "1px solid var(--color-border)" }}>

                    {/* Title + summary */}
                    <td className="px-5 py-4" style={{ maxWidth: 320 }}>
                      <p className="text-[12px] font-semibold" style={{ color: "var(--color-text-primary)" }}>{rpt.title}</p>
                      <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "var(--color-text-muted)" }}>{rpt.summary}</p>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold"
                        style={{ color: typeCfg.color, backgroundColor: typeCfg.bg }}>
                        {typeCfg.label}
                      </span>
                    </td>

                    {/* MTTR / SLA */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {rpt.mttr && <p className="text-[11px] font-mono font-semibold" style={{ color: "var(--color-text-primary)" }}>{rpt.mttr}</p>}
                      {rpt.slaOutcome && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{
                            color: rpt.slaOutcome === "met" ? "#2DD4BF" : "#FF3B3B",
                            backgroundColor: rpt.slaOutcome === "met" ? "rgba(45,212,191,0.12)" : "rgba(255,59,59,0.12)",
                          }}>
                          SLA {rpt.slaOutcome}
                        </span>
                      )}
                      {!rpt.mttr && !rpt.slaOutcome && (
                        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>—</span>
                      )}
                    </td>

                    {/* Generated at */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-[10px] font-mono" style={{ color: "var(--color-text-muted)" }}>{rpt.generatedAt}</p>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold"
                        style={{
                          color:           rpt.status === "ready" ? "#2DD4BF" : "#FFB020",
                          backgroundColor: rpt.status === "ready" ? "rgba(45,212,191,0.12)" : "rgba(255,176,32,0.12)",
                        }}>
                        {rpt.status === "ready" ? "Ready" : "Generating…"}
                      </span>
                    </td>

                    {/* Download */}
                    <td className="px-5 py-4">
                      <button
                        disabled={rpt.status !== "ready"}
                        onClick={() => setDownloaded((p) => new Set([...p, rpt.id]))}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors disabled:opacity-40"
                        style={{
                          backgroundColor: isDl ? "rgba(45,212,191,0.12)" : "rgba(255,255,255,0.06)",
                          color:           isDl ? "#2DD4BF" : "var(--color-text-muted)",
                          border:          isDl ? "1px solid rgba(45,212,191,0.25)" : "1px solid var(--color-border)",
                        }}>
                        <Download size={10} />{isDl ? "Downloaded" : "Download PDF"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Accuracy & Learning feedback ────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>
          Prediction &amp; RCA accuracy feedback
        </p>
        <p className="text-[11px] mb-4" style={{ color: "var(--color-text-muted)" }}>
          Your ratings inform MINDR model retraining and playbook confidence scores. Rate each RCA outcome below.
        </p>
        <div className="rounded-xl overflow-hidden divide-y" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderColor: "var(--color-border)" }}>
          {FEEDBACK_ENTRIES.map((entry) => {
            const current = feedback[entry.incidentId];
            return (
              <div key={entry.incidentId} className="px-5 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold" style={{ color: "var(--color-text-primary)" }}>{entry.title}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    RCA: <span style={{ color: "var(--color-text-primary)" }}>{entry.rcaSummary}</span>
                  </p>
                  {entry.comment && (
                    <p className="text-[10px] mt-1 italic" style={{ color: "rgba(255,176,32,0.8)" }}>Note: {entry.comment}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <RatingBtn active={current === "accurate"}   kind="accurate"   onClick={() => handleFeedback(entry.incidentId, "accurate")} />
                  <RatingBtn active={current === "partial"}    kind="partial"    onClick={() => handleFeedback(entry.incidentId, "partial")} />
                  <RatingBtn active={current === "inaccurate"} kind="inaccurate" onClick={() => handleFeedback(entry.incidentId, "inaccurate")} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Playbook recommendations ────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>
          Playbook update recommendations
        </p>
        <div className="flex flex-col gap-3">
          {PLAYBOOK_RECOMMENDATIONS.map((rec) => {
            const accepted = acceptedPb.has(rec.id);
            return (
              <div key={rec.id} className="flex items-start gap-4 px-5 py-4 rounded-xl"
                style={{ backgroundColor: "var(--color-bg-card)", border: accepted ? "1px solid rgba(45,212,191,0.3)" : "1px solid var(--color-border)" }}>
                <span className="inline-flex items-center shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold mt-0.5"
                  style={{
                    color:           rec.priority === "High" ? "#FF3B3B" : "#FFB020",
                    backgroundColor: rec.priority === "High" ? "rgba(255,59,59,0.12)" : "rgba(255,176,32,0.12)",
                  }}>
                  {rec.priority}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold" style={{ color: "var(--color-text-primary)" }}>{rec.title}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{rec.rationale}</p>
                </div>
                <button
                  onClick={() => setAcceptedPb((p) => { const n = new Set(p); accepted ? n.delete(rec.id) : n.add(rec.id); return n; })}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-colors"
                  style={{
                    backgroundColor: accepted ? "rgba(45,212,191,0.12)" : "rgba(255,255,255,0.05)",
                    color:           accepted ? "#2DD4BF" : "var(--color-text-muted)",
                    border:          accepted ? "1px solid rgba(45,212,191,0.3)" : "1px solid var(--color-border)",
                  }}>
                  {accepted ? "Accepted ✓" : "Accept recommendation"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
