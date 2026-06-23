import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  MoreHorizontal,
  Share2,
  Zap,
} from "lucide-react";
import type { Incident, LogType, Severity } from "../../types/incident";
import { PropagationTimeline } from "./PropagationTimeline";
import { MetricCard } from "./MetricCard";
import { HighlightedText } from "./HighlightedText";

const SEVERITY_CFG: Record<Severity, { label: string; color: string }> = {
  critical: { label: "CRITICAL",  color: "var(--color-critical)"   },
  high:     { label: "HIGH RISK", color: "var(--color-warning)"    },
  medium:   { label: "MEDIUM",    color: "var(--color-mitigating)" },
  low:      { label: "LOW",       color: "var(--color-resolved)"   },
};

const LOG_BADGE: Record<LogType, { color: string; bg: string }> = {
  CRIT: { color: "#fff", bg: "var(--color-critical)"   },
  AI:   { color: "#fff", bg: "var(--color-brand)"      },
  WARN: { color: "#0E0E12", bg: "var(--color-warning)" },
  INFO: { color: "#fff", bg: "var(--color-mitigating)" },
};

const MORE_ACTIONS = [
  { label: "Download Report",        icon: ExternalLink },
  { label: "Export System Logs",     icon: ExternalLink },
  { label: "Assign to Team",         icon: ExternalLink },
  { label: "Flag as False Positive", icon: ExternalLink },
  { label: "Archive Incident",       icon: ExternalLink },
];

export function IncidentDetail({ incident }: { incident: Incident }) {
  const navigate = useNavigate();
  const sev = SEVERITY_CFG[incident.severity];

  const [copied,    setCopied]    = useState(false);
  const [showMore,  setShowMore]  = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close More dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleShare() {
    const url = `${window.location.origin}/incidents?incident=${incident.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleInvestigate() {
    navigate(`/assistant?incident=${encodeURIComponent(incident.ref)}`);
  }

  return (
    <div className="space-y-4">
      {/* Investigate with MINDR — sticky banner */}
      <div
        className="rounded-xl p-4 flex items-center justify-between gap-4"
        style={{
          background: "linear-gradient(135deg, rgba(233,30,140,0.12), rgba(233,30,140,0.06))",
          border: "1px solid rgba(233,30,140,0.25)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--color-brand)" }}
          >
            <Zap size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
              MINDR Analysis Available
            </p>
            <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
              {incident.insights.confidence}% confidence · Root cause identified
            </p>
          </div>
        </div>
        <button
          onClick={handleInvestigate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
        >
          <MessageSquare size={13} />
          Investigate this issue
        </button>
      </div>

      {/* Header card */}
      <div
        className="rounded-lg p-5"
        style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide"
              style={{ backgroundColor: "var(--color-critical)", color: "#fff" }}
            >
              Active Incident
            </span>
            <span
              className="text-[10px]"
              style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
            >
              {incident.ref.replace("#", "")}-EU-WEST
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-white/5 transition-colors text-[10px] font-medium"
              style={{ color: copied ? "var(--color-resolved)" : "var(--color-text-muted)" }}
              title="Copy incident link"
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
              {copied && <span>Copied!</span>}
            </button>

            {/* More */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setShowMore((o) => !o)}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                style={{ color: "var(--color-text-muted)" }}
                title="More options"
              >
                <MoreHorizontal size={14} />
              </button>
              {showMore && (
                <div
                  className="absolute right-0 rounded-xl overflow-hidden"
                  style={{
                    top: "calc(100% + 6px)",
                    width: 210,
                    backgroundColor: "var(--color-bg-elevated)",
                    border: "1px solid var(--color-border)",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
                    zIndex: 50,
                  }}
                >
                  <p
                    className="px-4 pt-3 pb-1 text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Actions
                  </p>
                  {MORE_ACTIONS.map(({ label }) => (
                    <button
                      key={label}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs hover:bg-white/5 transition-colors"
                      style={{ color: label === "Archive Incident" ? "var(--color-warning)" : "var(--color-text-primary)" }}
                      onClick={() => setShowMore(false)}
                    >
                      {label}
                      <ChevronRight size={12} style={{ color: "var(--color-text-muted)" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold leading-tight mb-4" style={{ color: "var(--color-text-primary)" }}>
          {incident.title}
        </h2>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Severity",       value: incident.severity.toUpperCase(), accent: sev.color },
            { label: "Region",         value: incident.region },
            { label: "Affected Users", value: incident.affectedUsers },
            { label: "Duration",       value: incident.duration },
          ].map(({ label, value, accent }) => (
            <div key={label}>
              <p
                className="text-[9px] font-medium uppercase tracking-widest mb-0.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                {label}
              </p>
              <p className="text-sm font-semibold" style={{ color: accent ?? "var(--color-text-primary)" }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Propagation timeline */}
      <PropagationTimeline stages={incident.timeline} />

      {/* Live metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {incident.metrics.map((m) => (
          <MetricCard key={m.label} metric={m} />
        ))}
      </div>

      {/* AI Insight summary (condensed) + System Logs */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "3fr 2fr" }}>
        {/* Condensed root cause */}
        <div
          className="rounded-lg p-5"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <p
            className="text-[10px] font-medium uppercase tracking-widest mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            Root Cause Analysis
          </p>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--color-text-primary)" }}>
            <HighlightedText text={incident.insights.text} highlights={incident.insights.highlights} />
          </p>
          <div
            className="flex items-center gap-2 pt-3"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <span
              className="text-[10px] font-bold px-2 py-1 rounded"
              style={{ backgroundColor: "rgba(45,212,191,0.12)", color: "var(--color-resolved)" }}
            >
              {incident.insights.confidence}% CONFIDENCE
            </span>
            <button
              onClick={handleInvestigate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
            >
              <Zap size={11} />
              Deep Analysis in Assistant
            </button>
          </div>
        </div>

        {/* System Logs */}
        <div
          className="rounded-lg flex flex-col"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <p
              className="text-[10px] font-medium uppercase tracking-widest"
              style={{ color: "var(--color-text-muted)" }}
            >
              System Logs
            </p>
            <button className="p-1 rounded hover:bg-white/5 transition-colors" style={{ color: "var(--color-text-muted)" }}>
              <ExternalLink size={12} />
            </button>
          </div>
          <div className="overflow-y-auto flex-1" style={{ maxHeight: 240 }}>
            {incident.logs.map((log, i) => {
              const badge = LOG_BADGE[log.type];
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-2.5"
                  style={{ borderBottom: i < incident.logs.length - 1 ? "1px solid var(--color-border)" : "none" }}
                >
                  <span
                    className="text-[10px] tabular-nums shrink-0 mt-px"
                    style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
                  >
                    {log.time}
                  </span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-px rounded shrink-0 mt-px"
                    style={{ color: badge.color, backgroundColor: badge.bg, letterSpacing: "0.03em" }}
                  >
                    {log.type}
                  </span>
                  <span className="text-[11px] leading-snug" style={{ color: "var(--color-text-primary)" }}>
                    {log.message}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
