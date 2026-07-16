import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { VOLTE_EVENTS, type Segment, type EventType, type EventState } from "../../data/volte-data";
import { Badge } from "../../components/ui/badge";

// ── Tokens ─────────────────────────────────────────────────────────────────────

const SEGMENT_COLOR: Record<string, string> = { RAN: "#4D9EFF", EPC: "#A78BFA", IMS: "#2DD4BF" };
const SEGMENT_BG:    Record<string, string> = { RAN: "rgba(77,158,255,0.12)", EPC: "rgba(167,139,250,0.12)", IMS: "rgba(45,212,191,0.12)" };

const TYPE_CFG: Record<EventType, { label: string; color: string; bg: string }> = {
  "anomaly":             { label: "Anomaly",             color: "#FF3B3B", bg: "rgba(255,59,59,0.12)" },
  "threshold":           { label: "Threshold",           color: "#FFB020", bg: "rgba(255,176,32,0.12)" },
  "silent-degradation":  { label: "Silent degradation",  color: "#A78BFA", bg: "rgba(167,139,250,0.12)" },
};

const STATE_CFG: Record<EventState, { color: string; bg: string; border?: string }> = {
  New:           { color: "#FF3B3B", bg: "rgba(255,59,59,0.12)" },
  Investigating: { color: "#FFB020", bg: "rgba(255,176,32,0.12)" },
  Resolved:      { color: "#2DD4BF", bg: "rgba(45,212,191,0.12)" },
};

// ── KPI type labels ────────────────────────────────────────────────────────────

const KPI_TYPES = ["All KPIs", "Call Drop Rate", "Response Time", "Session Success", "Handover Success", "CPU Load", "CSSR"];
const STATE_OPTS: Array<"all" | EventState> = ["all", "New", "Investigating", "Resolved"];

// ── Filter pill ────────────────────────────────────────────────────────────────

function Pill({ active, color, bg, border, onClick, children }: {
  active: boolean; color: string; bg: string; border?: string;
  onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
      style={{
        backgroundColor: active ? bg : "transparent",
        color:           active ? color : "var(--color-text-muted)",
        border:          active ? (border ?? `1px solid ${color}35`) : "1px solid transparent",
      }}>
      {children}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VolteEvents() {
  const navigate = useNavigate();
  const [segFilter, setSegFilter]   = useState<"all" | Segment>("all");
  const [kpiFilter, setKpiFilter]   = useState("All KPIs");
  const [stateFilter, setStateFilter] = useState<"all" | EventState>("all");

  const filtered = useMemo(() => {
    return VOLTE_EVENTS.filter((e) => {
      if (segFilter !== "all" && e.segment !== segFilter) return false;
      if (kpiFilter !== "All KPIs" && !e.affectedKPI.includes(kpiFilter.replace(" Rate","").replace(" Success",""))) return false;
      if (stateFilter !== "all" && e.state !== stateFilter) return false;
      return true;
    });
  }, [segFilter, kpiFilter, stateFilter]);

  const selectStyle: React.CSSProperties = {
    backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)",
    color: "var(--color-text-primary)", borderRadius: 8, padding: "5px 10px", fontSize: 12, outline: "none",
  };

  return (
    <div className="flex flex-col gap-6 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Events</h1>
          <p className="text-sm mt-0.5 flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
            Volte · anomaly detection &amp; KPI thresholds · <span className="font-mono">{VOLTE_EVENTS.length}</span> detected
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

        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Segment</span>
        {(["all", "RAN", "EPC", "IMS"] as const).map((s) => (
          <Pill key={s} active={segFilter === s}
            color={s === "all" ? "var(--color-text-primary)" : SEGMENT_COLOR[s]}
            bg={s === "all" ? "rgba(255,255,255,0.08)" : SEGMENT_BG[s]}
            onClick={() => setSegFilter(s)}>
            {s === "all" ? "All" : s}
          </Pill>
        ))}

        <div className="h-4 w-px" style={{ backgroundColor: "var(--color-border)" }} />

        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>KPI type</span>
        <select value={kpiFilter} onChange={(e) => setKpiFilter(e.target.value)} style={selectStyle}>
          {KPI_TYPES.map((k) => <option key={k} value={k} style={{ backgroundColor: "var(--color-bg-elevated)" }}>{k}</option>)}
        </select>

        <div className="h-4 w-px" style={{ backgroundColor: "var(--color-border)" }} />

        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>State</span>
        {STATE_OPTS.map((s) => {
          const cfg = s !== "all" ? STATE_CFG[s] : null;
          return (
            <Pill key={s} active={stateFilter === s}
              color={cfg ? cfg.color : "var(--color-text-primary)"}
              bg={cfg ? cfg.bg : "rgba(255,255,255,0.08)"}
              onClick={() => setStateFilter(s)}>
              {s === "all" ? "All" : s}
            </Pill>
          );
        })}

        {(segFilter !== "all" || kpiFilter !== "All KPIs" || stateFilter !== "all") && (
          <>
            <div className="flex-1" />
            <button onClick={() => { setSegFilter("all"); setKpiFilter("All KPIs"); setStateFilter("all"); }}
              className="text-[11px] font-semibold underline underline-offset-2"
              style={{ color: "var(--color-text-muted)" }}>
              Reset
            </button>
          </>
        )}
      </div>

      {/* Events table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        {filtered.length === 0 ? (
          <div className="py-14 flex items-center justify-center">
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No events match the current filters</p>
          </div>
        ) : (
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                {["Type", "Segment", "Affected KPI", "Value vs Threshold", "Summary", "State", "Time", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap"
                    style={{ color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((evt, idx) => {
                const typeCfg  = TYPE_CFG[evt.type];
                const stateCfg = STATE_CFG[evt.state];
                const isLast = idx === filtered.length - 1;
                return (
                  <tr key={evt.id} className="hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: isLast ? "none" : "1px solid var(--color-border)" }}>

                    {/* Type badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className="px-2 py-0.5 text-[9px] font-bold"
                        style={{ color: typeCfg.color, backgroundColor: typeCfg.bg }}>
                        {typeCfg.label}
                      </Badge>
                    </td>

                    {/* Segment chip */}
                    <td className="px-4 py-3">
                      <Badge className="px-2 py-0.5 text-[9px] font-bold"
                        style={{ color: SEGMENT_COLOR[evt.segment], backgroundColor: SEGMENT_BG[evt.segment] }}>
                        {evt.segment}
                      </Badge>
                    </td>

                    {/* Affected KPI */}
                    <td className="px-4 py-3">
                      <p className="text-[11px] font-semibold whitespace-nowrap" style={{ color: "var(--color-text-primary)" }}>
                        {evt.affectedKPI}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{evt.nodeId.toUpperCase()}</p>
                    </td>

                    {/* Value vs threshold */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-[12px] font-bold font-mono" style={{ color: typeCfg.color }}>{evt.value}</p>
                      <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>limit {evt.threshold}</p>
                    </td>

                    {/* Summary */}
                    <td className="px-4 py-3" style={{ maxWidth: 280 }}>
                      <p className="text-[11px] leading-snug line-clamp-2" style={{ color: "var(--color-text-muted)" }}>{evt.summary}</p>
                    </td>

                    {/* State pill */}
                    <td className="px-4 py-3">
                      <Badge className="px-2 py-0.5 text-[9px] font-bold"
                        style={{ color: stateCfg.color, backgroundColor: stateCfg.bg }}>
                        {evt.state}
                      </Badge>
                    </td>

                    {/* Time */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-[10px] font-mono" style={{ color: "var(--color-text-muted)" }}>{evt.timestamp}</p>
                    </td>

                    {/* Link */}
                    <td className="px-4 py-3">
                      {evt.relatedIncidentId && (
                        <button onClick={() => navigate(`/volte/incidents/${evt.relatedIncidentId}`)}
                          className="flex items-center gap-1 text-[10px] font-semibold hover:opacity-70 transition-opacity"
                          style={{ color: "#2DD4BF" }}>
                          Incident <ArrowUpRight size={10} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
        Events are pre-correlated across RAN / EPC / IMS. Segment tagging is consistent with Alarms and the Knowledge Graph.
      </p>

      <style>{`@keyframes pulse-live { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
