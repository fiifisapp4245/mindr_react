import { useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush, ResponsiveContainer,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import {
  STAGES,
  type StageKey,
  type FlowFilters,
  type FlowRecord,
  buildTimeSeries,
  buildSnmpSeries,
  activeAsFilters,
} from "../../../data/flow-analytics-data";

const PALETTE = ["#4D9EFF", "#2DD4BF", "#FFB020", "#E9187C", "#9B59B6", "#FF3B3B", "#eab308", "#22c55e", "#94a3b8", "#f97316"];

const STAGE_LABEL: Record<StageKey, string> = Object.fromEntries(STAGES.map((s) => [s.key, s.label])) as Record<StageKey, string>;

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")} ${String(d.getUTCHours()).padStart(2, "0")}:00`;
}

function toTbps(bps: number): number {
  return bps / 1e12;
}

interface Props {
  records: FlowRecord[];
  filters: FlowFilters;
  breakdownStage: StageKey;
  onBreakdownStageChange: (stage: StageKey) => void;
}

export function FlowTimeSeries({ records, filters, breakdownStage, onBreakdownStageChange }: Props) {
  const [relative, setRelative] = useState(false);
  const [showSnmp, setShowSnmp] = useState(false);

  const rawSeries = useMemo(() => buildTimeSeries(records, breakdownStage), [records, breakdownStage]);

  const entityKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const point of rawSeries) {
      for (const k of Object.keys(point)) {
        if (k !== "time") keys.add(k);
      }
    }
    // Sort by total descending so the biggest series renders first (bottom of stack).
    const totals = new Map<string, number>();
    keys.forEach((k) => totals.set(k, rawSeries.reduce((s, p) => s + (p[k] ?? 0), 0)));
    return Array.from(keys).sort((a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0));
  }, [rawSeries]);

  const disablingStages = activeAsFilters(filters);
  const snmpAllowed = disablingStages.length === 0;

  const snmpSeries = useMemo(() => (showSnmp && snmpAllowed ? buildSnmpSeries(filters) : []), [showSnmp, snmpAllowed, filters]);
  const snmpByTime = useMemo(() => new Map(snmpSeries.map((p) => [p.time, p.snmpTotalBps])), [snmpSeries]);

  const chartData = useMemo(() => {
    return rawSeries.map((point) => {
      const total = entityKeys.reduce((s, k) => s + (point[k] ?? 0), 0) || 1;
      const row: Record<string, number> = { time: point.time };
      for (const k of entityKeys) {
        const v = point[k] ?? 0;
        row[k] = relative ? (v / total) * 100 : toTbps(v);
      }
      if (showSnmp && snmpAllowed) {
        row.snmpTotalBps = toTbps(snmpByTime.get(point.time) ?? 0);
      }
      return row;
    });
  }, [rawSeries, entityKeys, relative, showSnmp, snmpAllowed, snmpByTime]);

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
      {/* Stage breakdown tabs */}
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        {STAGES.map((s) => {
          const active = s.key === breakdownStage;
          return (
            <button
              key={s.key}
              onClick={() => onBreakdownStageChange(s.key)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
              style={{
                backgroundColor: active ? "var(--color-brand)" : "transparent",
                color: active ? "#fff" : "var(--color-text-muted)",
              }}
            >
              Volume Share for {s.label}
            </button>
          );
        })}
      </div>

      {/* Toggles */}
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <label className="flex items-center gap-2 text-[11px] font-medium cursor-pointer" style={{ color: "var(--color-text-primary)" }}>
          <input type="checkbox" checked={relative} onChange={(e) => setRelative(e.target.checked)} />
          Relative (% share)
        </label>
        <label
          className="flex items-center gap-2 text-[11px] font-medium"
          style={{ color: snmpAllowed ? "var(--color-text-primary)" : "var(--color-text-muted)", cursor: snmpAllowed ? "pointer" : "not-allowed", opacity: snmpAllowed ? 1 : 0.5 }}
        >
          <input type="checkbox" checked={showSnmp && snmpAllowed} disabled={!snmpAllowed} onChange={(e) => setShowSnmp(e.target.checked)} />
          Show SNMP Total Traffic
        </label>
      </div>

      {!snmpAllowed && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3 text-[11px]" style={{ backgroundColor: "rgba(255,176,32,0.08)", border: "1px solid rgba(255,176,32,0.25)", color: "#FFB020" }}>
          <AlertTriangle size={12} className="shrink-0" />
          Cannot display SNMP for filter(s): {disablingStages.map((s) => STAGE_LABEL[s]).join(", ")}. Please clear this filter to view SNMP.
        </div>
      )}

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="time" tickFormatter={formatTime} tick={{ fontSize: 9, fill: "#5c5c7a" }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} minTickGap={40} />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 9, fill: "#5c5c7a" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (relative ? `${v}%` : `${v.toFixed(1)}T`)}
            width={40}
          />
          {showSnmp && snmpAllowed && (
            <YAxis
              yAxisId="snmp"
              orientation="right"
              tick={{ fontSize: 9, fill: "#5c5c7a" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v.toFixed(1)}T`}
              width={40}
            />
          )}
          <Tooltip
            contentStyle={{ backgroundColor: "#1E1E2A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
            labelFormatter={(v) => formatTime(v as number)}
            formatter={(value: number, name: string) => [relative && name !== "SNMP Total" ? `${value.toFixed(1)}%` : `${value.toFixed(2)} Tbps`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
          {entityKeys.map((key, i) => (
            <Area
              key={key}
              yAxisId="left"
              type="monotone"
              dataKey={key}
              name={key}
              stackId="stack"
              stroke={PALETTE[i % PALETTE.length]}
              fill={PALETTE[i % PALETTE.length]}
              fillOpacity={0.55}
            />
          ))}
          {showSnmp && snmpAllowed && (
            <Area
              yAxisId="snmp"
              type="monotone"
              dataKey="snmpTotalBps"
              name="SNMP Total"
              stroke="#ffffff"
              strokeWidth={2}
              strokeDasharray="4 3"
              fill="none"
            />
          )}
          <Brush dataKey="time" height={22} tickFormatter={formatTime} stroke="var(--color-brand)" travellerWidth={8} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
