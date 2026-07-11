import { useState, useMemo } from "react";
import { Bell, Check, RefreshCw } from "lucide-react";
import { VOLTE_ALARMS, type VolteSeverity, type AlarmState } from "../../data/volte-data";
import { Badge } from "../../components/ui/badge";

// ── Tokens ─────────────────────────────────────────────────────────────────────

const SEV_COLOR: Record<VolteSeverity, string> = { Critical: "#FF3B3B", High: "#FFB020", Medium: "#4D9EFF", Low: "rgba(255,255,255,0.4)" };
const SEV_BG:   Record<VolteSeverity, string> = { Critical: "rgba(255,59,59,0.12)", High: "rgba(255,176,32,0.12)", Medium: "rgba(77,158,255,0.12)", Low: "rgba(255,255,255,0.06)" };

const SEGMENT_COLOR: Record<string, string> = { RAN: "#4D9EFF", EPC: "#A78BFA", IMS: "#2DD4BF" };
const SEGMENT_BG:    Record<string, string> = { RAN: "rgba(77,158,255,0.12)", EPC: "rgba(167,139,250,0.12)", IMS: "rgba(45,212,191,0.12)" };

const STATE_CFG: Record<AlarmState, { color: string; bg: string; border?: string }> = {
  Active:       { color: "#FF3B3B", bg: "rgba(255,59,59,0.12)" },
  Predicted:    { color: "#FFB020", bg: "rgba(255,176,32,0.12)" },
  Acknowledged: { color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" },
};

// ── Metric bar — shows deviation from threshold ────────────────────────────────

function MetricBar({ value, threshold, unit, severity }: {
  value: number; threshold: number; unit: string; severity: VolteSeverity;
}) {
  const deviation = Math.abs(value - threshold) / Math.max(threshold, 1) * 100;
  const barW = Math.min(100, 20 + deviation * 4.5);
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-bold font-mono" style={{ color: SEV_COLOR[severity] }}>
        {value}{unit}
        <span className="text-[9px] font-normal ml-1" style={{ color: "var(--color-text-muted)" }}>
          limit {threshold}{unit}
        </span>
      </p>
      <div className="h-1 rounded-full w-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full" style={{ width: `${barW}%`, backgroundColor: SEV_COLOR[severity] }} />
      </div>
    </div>
  );
}

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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VolteAlarms() {
  const [sevFilter,   setSevFilter]   = useState<"all" | VolteSeverity>("all");
  const [stateFilter, setStateFilter] = useState<"all" | AlarmState>("all");

  // Local state for per-alarm actions
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [notified,     setNotified]     = useState<Set<string>>(new Set());

  const alarms = useMemo(() => {
    return VOLTE_ALARMS.filter((a) => {
      if (sevFilter   !== "all" && a.severity !== sevFilter) return false;
      if (stateFilter !== "all") {
        const effectiveState = acknowledged.has(a.id) ? "Acknowledged" : a.state;
        if (effectiveState !== stateFilter) return false;
      }
      return true;
    });
  }, [sevFilter, stateFilter, acknowledged]);

  const totalGrouped = VOLTE_ALARMS.reduce((s, a) => s + (a.groupedCount ?? 1), 0);
  const totalDeduped = VOLTE_ALARMS.length;

  return (
    <div className="flex flex-col gap-6 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Alarms</h1>
          <p className="text-sm mt-0.5 flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
            Volte · pre-filtered &amp; deduplicated · live
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#2DD4BF", animation: "pulse-live 1.6s ease-in-out infinite" }} />
          </p>
        </div>
        <div className="text-[11px] flex items-center gap-1.5 mt-1" style={{ color: "var(--color-text-muted)" }}>
          <RefreshCw size={11} />Updated just now
        </div>
      </div>

      {/* Dedup indicator */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
        style={{ backgroundColor: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.2)" }}>
        <Bell size={13} style={{ color: "#2DD4BF" }} />
        <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
          <span className="font-bold" style={{ color: "#2DD4BF" }}>{totalGrouped} raw alarms</span> pre-filtered &amp; deduplicated to{" "}
          <span className="font-bold" style={{ color: "var(--color-text-primary)" }}>{totalDeduped} unique alarms</span> · segment-tagged RAN / EPC / IMS
        </p>
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

        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>State</span>
        {(["all", "Active", "Predicted", "Acknowledged"] as const).map((s) => {
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
      </div>

      {/* Alarms table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        {alarms.length === 0 ? (
          <div className="py-14 flex items-center justify-center">
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No alarms match current filters</p>
          </div>
        ) : (
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                {["Alarm · ID", "Sev.", "State", "Affected", "Seg.", "Metric", "Raised / ETA", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap"
                    style={{ color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alarms.map((alarm, idx) => {
                const isAck  = acknowledged.has(alarm.id);
                const isNot  = notified.has(alarm.id);
                const effectiveState: AlarmState = isAck ? "Acknowledged" : alarm.state;
                const stateCfg = STATE_CFG[effectiveState];
                const isLast = idx === alarms.length - 1;

                return (
                  <tr key={alarm.id}
                    className="transition-colors"
                    style={{
                      borderBottom: isLast ? "none" : "1px solid var(--color-border)",
                      opacity: isAck ? 0.6 : 1,
                    }}>

                    {/* Name + ID + grouped */}
                    <td className="px-4 py-3">
                      <p className="text-[12px] font-semibold" style={{ color: "var(--color-text-primary)" }}>{alarm.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono" style={{ color: "var(--color-brand)" }}>{alarm.id.toUpperCase()}</span>
                        {alarm.groupedCount && (
                          <span className="text-[9px] font-bold px-1 py-0.5 rounded"
                            style={{ backgroundColor: "rgba(45,212,191,0.10)", color: "#2DD4BF" }}>
                            +{alarm.groupedCount - 1} grouped
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Severity pill */}
                    <td className="px-4 py-3">
                      <Badge className="px-2 py-0.5 text-[9px] font-bold"
                        style={{ color: SEV_COLOR[alarm.severity], backgroundColor: SEV_BG[alarm.severity] }}>
                        {alarm.severity}
                      </Badge>
                    </td>

                    {/* State pill */}
                    <td className="px-4 py-3">
                      <Badge className="px-2 py-0.5 text-[9px] font-bold"
                        style={{ color: stateCfg.color, backgroundColor: stateCfg.bg, border: stateCfg.border }}>
                        {effectiveState}
                      </Badge>
                    </td>

                    {/* Affected */}
                    <td className="px-4 py-3" style={{ maxWidth: 180 }}>
                      <p className="text-[11px] leading-snug" style={{ color: "var(--color-text-muted)" }}>{alarm.affected}</p>
                    </td>

                    {/* Segment */}
                    <td className="px-4 py-3">
                      <Badge className="px-2 py-0.5 text-[9px] font-bold"
                        style={{ color: SEGMENT_COLOR[alarm.segment], backgroundColor: SEGMENT_BG[alarm.segment] }}>
                        {alarm.segment}
                      </Badge>
                    </td>

                    {/* Metric + bar */}
                    <td className="px-4 py-3" style={{ minWidth: 160 }}>
                      <MetricBar value={alarm.metricValue} threshold={alarm.threshold}
                        unit={alarm.metricUnit} severity={alarm.severity} />
                    </td>

                    {/* Raised / ETA */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-[10px] font-mono" style={{ color: "var(--color-text-muted)" }}>{alarm.raisedAt}</p>
                      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>ETA {alarm.eta}</p>
                    </td>

                    {/* Actions — always visible */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <button
                          disabled={isAck}
                          onClick={() => setAcknowledged((prev) => new Set([...prev, alarm.id]))}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors disabled:opacity-50"
                          style={{
                            backgroundColor: isAck ? "rgba(45,212,191,0.08)" : "rgba(45,212,191,0.12)",
                            color: "#2DD4BF",
                            border: "1px solid rgba(45,212,191,0.25)",
                          }}>
                          <Check size={9} />{isAck ? "Acknowledged" : "Acknowledge"}
                        </button>
                        <button
                          onClick={() => setNotified((prev) => new Set([...prev, alarm.id]))}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors"
                          style={{
                            backgroundColor: isNot ? "rgba(77,158,255,0.12)" : "rgba(255,255,255,0.05)",
                            color: isNot ? "#4D9EFF" : "var(--color-text-muted)",
                            border: isNot ? "1px solid rgba(77,158,255,0.25)" : "1px solid var(--color-border)",
                          }}>
                          {isNot ? "Notified ✓" : "Notify in 30m"}
                        </button>
                      </div>
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
