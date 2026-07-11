import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { VOLTE_INCIDENTS, type VolteSeverity, type IncidentStatus, type Segment } from "../../data/volte-data";
import { Badge } from "../../components/ui/badge";

// ── Tokens ─────────────────────────────────────────────────────────────────────

const SEV_COLOR: Record<VolteSeverity, string> = { Critical: "#FF3B3B", High: "#FFB020", Medium: "#4D9EFF", Low: "rgba(255,255,255,0.4)" };
const SEV_BG:   Record<VolteSeverity, string> = { Critical: "rgba(255,59,59,0.12)", High: "rgba(255,176,32,0.12)", Medium: "rgba(77,158,255,0.12)", Low: "rgba(255,255,255,0.06)" };

const STATUS_CFG: Record<IncidentStatus, { color: string; bg: string }> = {
  Open:          { color: "#FF3B3B", bg: "rgba(255,59,59,0.12)" },
  Investigating: { color: "#FFB020", bg: "rgba(255,176,32,0.12)" },
  Resolved:      { color: "#2DD4BF", bg: "rgba(45,212,191,0.12)" },
};

const SEG_COLOR: Record<Segment, string> = { RAN: "#4D9EFF", EPC: "#A78BFA", IMS: "#2DD4BF" };
const SEG_BG:   Record<Segment, string> = { RAN: "rgba(77,158,255,0.12)", EPC: "rgba(167,139,250,0.12)", IMS: "rgba(45,212,191,0.12)" };

// ── Filter pill ────────────────────────────────────────────────────────────────

function Pill({ active, color, bg, onClick, children }: {
  active: boolean; color: string; bg: string; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
      style={{
        backgroundColor: active ? bg : "transparent",
        color:           active ? color : "var(--color-text-muted)",
        border:          active ? `1px solid ${color}35` : "1px solid transparent",
      }}>
      {children}
    </button>
  );
}

// ── Impact score bar ───────────────────────────────────────────────────────────

function ImpactBar({ score }: { score: number }) {
  const color = score >= 80 ? "#FF3B3B" : score >= 60 ? "#FFB020" : "#4D9EFF";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 rounded-full flex-1" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums w-6 text-right" style={{ color }}>{score}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VolteIncidents() {
  const navigate  = useNavigate();
  const [sevFilter,    setSevFilter]    = useState<"all" | VolteSeverity>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | IncidentStatus>("all");

  const filtered = useMemo(() => {
    return VOLTE_INCIDENTS.filter((inc) => {
      if (sevFilter    !== "all" && inc.severity !== sevFilter)  return false;
      if (statusFilter !== "all" && inc.status   !== statusFilter) return false;
      return true;
    });
  }, [sevFilter, statusFilter]);

  return (
    <div className="flex flex-col gap-6 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Incidents</h1>
          <p className="text-sm mt-0.5 flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
            Volte · {VOLTE_INCIDENTS.length} total · MINDR-analyzed
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#2DD4BF", animation: "pulse-live 1.6s ease-in-out infinite" }} />
          </p>
        </div>
        <div className="text-[11px] flex items-center gap-1.5 mt-1" style={{ color: "var(--color-text-muted)" }}>
          <RefreshCw size={11} />Updated just now
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl"
        style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>

        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Severity</span>
        {(["all", "Critical", "High", "Medium"] as const).map((s) => (
          <Pill key={s} active={sevFilter === s}
            color={s === "all" ? "var(--color-text-primary)" : SEV_COLOR[s]}
            bg={s === "all" ? "rgba(255,255,255,0.08)" : SEV_BG[s]}
            onClick={() => setSevFilter(s)}>
            {s === "all" ? "All" : s}
          </Pill>
        ))}

        <div className="h-4 w-px" style={{ backgroundColor: "var(--color-border)" }} />

        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Status</span>
        {(["all", "Open", "Investigating", "Resolved"] as const).map((s) => {
          const cfg = s !== "all" ? STATUS_CFG[s] : null;
          return (
            <Pill key={s} active={statusFilter === s}
              color={cfg ? cfg.color : "var(--color-text-primary)"}
              bg={cfg ? cfg.bg : "rgba(255,255,255,0.08)"}
              onClick={() => setStatusFilter(s)}>
              {s === "all" ? "All" : s}
            </Pill>
          );
        })}
      </div>

      {/* Incidents table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        {filtered.length === 0 ? (
          <div className="py-14 flex items-center justify-center">
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No incidents match current filters</p>
          </div>
        ) : (
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                {["Incident", "Sev.", "Status", "Segments", "Subscribers", "Impact", "Confidence", "Opened", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap"
                    style={{ color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc, idx) => {
                const isLast = idx === filtered.length - 1;
                return (
                  <tr key={inc.id}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => navigate(`/volte/incidents/${inc.id}`)}
                    style={{ borderBottom: isLast ? "none" : "1px solid var(--color-border)" }}>

                    {/* Title + root node */}
                    <td className="px-4 py-3" style={{ maxWidth: 320 }}>
                      <p className="text-[12px] font-semibold leading-snug" style={{ color: "var(--color-text-primary)" }}>{inc.title}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        Root: <span style={{ color: "#2DD4BF" }}>{inc.rca.rootNodeLabel}</span>
                      </p>
                    </td>

                    {/* Severity */}
                    <td className="px-4 py-3">
                      <Badge className="px-2 py-0.5 text-[9px] font-bold"
                        style={{ color: SEV_COLOR[inc.severity], backgroundColor: SEV_BG[inc.severity] }}>
                        {inc.severity}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge className="px-2 py-0.5 text-[9px] font-bold"
                        style={{ color: STATUS_CFG[inc.status].color, backgroundColor: STATUS_CFG[inc.status].bg }}>
                        {inc.status}
                      </Badge>
                    </td>

                    {/* Segments */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {inc.affectedScope.segments.map((seg) => (
                          <Badge key={seg} className="px-1.5 py-0.5 text-[9px] font-bold"
                            style={{ color: SEG_COLOR[seg], backgroundColor: SEG_BG[seg] }}>
                            {seg}
                          </Badge>
                        ))}
                      </div>
                    </td>

                    {/* Subscribers */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-[12px] font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>
                        {inc.affectedSubscribers.toLocaleString()}
                      </p>
                    </td>

                    {/* Customer impact score */}
                    <td className="px-4 py-3" style={{ minWidth: 100 }}>
                      <ImpactBar score={inc.customerImpactScore} />
                    </td>

                    {/* RCA confidence */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-[12px] font-bold tabular-nums"
                        style={{ color: inc.rca.confidence >= 90 ? "#2DD4BF" : "#FFB020" }}>
                        {inc.rca.confidence}%
                      </p>
                      <p className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>confidence</p>
                    </td>

                    {/* Opened at */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-[10px] font-mono" style={{ color: "var(--color-text-muted)" }}>{inc.openedAt}</p>
                    </td>

                    {/* Arrow */}
                    <td className="px-4 py-3">
                      <ArrowUpRight size={14} style={{ color: "var(--color-text-muted)" }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <style>{`@keyframes pulse-live { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
