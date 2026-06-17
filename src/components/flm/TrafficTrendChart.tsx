import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  trafficTrendData,
  trafficKpi,
  computeBand,
  bandColor,
  bandBg,
} from '../../data/peering-store';
import { InfoTooltip } from './InfoTooltip';
import { PeeringChartTooltip } from './PeeringChartTooltip';

const band = computeBand(trafficKpi.value, trafficKpi.thresholds);
const color = bandColor(band);
const bg = bandBg(band);
const stateLabel = band === 'red' ? 'SPIKING' : band === 'amber' ? 'INCREASING' : 'STABLE';

export function TrafficTrendChart() {
  return (
    <div
      className="rounded-lg p-4 flex flex-col"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Traffic Trend
            </p>
            <InfoTooltip
              description={trafficKpi.description}
              source={trafficKpi.source}
              thresholdLabel={trafficKpi.thresholdLabel}
            />
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Total traffic (Gbps) — BENOCS
          </p>
        </div>
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
          style={{ color, backgroundColor: bg }}
        >
          {stateLabel}
        </span>
      </div>

      <div style={{ height: 190 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={trafficTrendData}
            margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e20074" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#e20074" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="t"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[300, 520]}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              width={34}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              content={<PeeringChartTooltip unit=" Gbps" />}
              cursor={{ stroke: 'rgba(255,255,255,0.07)', strokeWidth: 1 }}
            />
            {/* Watch threshold reference line */}
            <ReferenceLine
              y={400}
              stroke="rgba(255,176,32,0.35)"
              strokeDasharray="4 3"
              label={{ value: 'WATCH', position: 'insideTopRight', fill: 'rgba(255,176,32,0.55)', fontSize: 9 }}
            />
            <Area
              type="monotone"
              dataKey="gbps"
              name="Traffic"
              stroke="var(--color-brand)"
              strokeWidth={2}
              fill="url(#trafficGrad)"
              dot={false}
              activeDot={{ r: 3, fill: 'var(--color-brand)', strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
