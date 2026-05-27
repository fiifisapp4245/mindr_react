import { useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { healthData } from "../../data/dashboard";
import type { Range } from "../../types/dashboard";
import { ChartTooltip } from "./ChartTooltip";

export function HealthTrendChart() {
  const [range, setRange] = useState<Range>("24H");
  const data = healthData[range];

  return (
    <div
      className="rounded-lg p-5 flex flex-col"
      style={{
        flex: "65 1 0%",
        backgroundColor: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        minHeight: 280,
      }}
    >
      <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <div>
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            System Health Trend
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--color-text-primary)" }}
          >
            Global network throughput &amp; stability index
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div
            className="flex items-center gap-3 text-[10px] mr-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-4 h-0.5 rounded"
                style={{ backgroundColor: "var(--color-brand)" }}
              />
              CURRENT
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-4"
                style={{ borderTop: "1.5px dashed rgba(255,255,255,0.3)" }}
              />
              TARGET
            </span>
          </div>
          <div
            className="flex items-center rounded-md overflow-hidden"
            style={{ border: "1px solid var(--color-border)" }}
          >
            {(["1H", "6H", "24H", "7D"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className="px-2.5 py-1 text-[10px] font-medium transition-colors"
                style={{
                  color: range === r ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  backgroundColor: range === r ? "var(--color-bg-elevated)" : "transparent",
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E91E8C" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#E91E8C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="t"
              tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[60, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={36}
              ticks={[60, 70, 80, 90, 100]}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: "rgba(255,255,255,0.07)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="health"
              stroke="var(--color-brand)"
              strokeWidth={2}
              fill="url(#healthGrad)"
              dot={false}
              activeDot={{ r: 3, fill: "var(--color-brand)", strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
