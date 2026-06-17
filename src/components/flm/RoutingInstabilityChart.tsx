import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  routingInstabilityData,
  routingKpi,
  computeBand,
  bandColor,
  bandBg,
} from '../../data/peering-store';
import { InfoTooltip } from './InfoTooltip';
import { PeeringChartTooltip } from './PeeringChartTooltip';

const band = computeBand(routingKpi.value, routingKpi.thresholds);
const color = bandColor(band);
const bg = bandBg(band);
const stateLabel = band === 'red' ? 'HIGH' : band === 'amber' ? 'MEDIUM' : 'LOW';

export function RoutingInstabilityChart() {
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
              Routing Instability
            </p>
            <InfoTooltip
              description={routingKpi.description}
              source={routingKpi.source}
              thresholdLabel={routingKpi.thresholdLabel}
            />
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Routing changes + BGP events per hour — REX
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
            data={routingInstabilityData}
            margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          >
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="t"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 40]}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              content={<PeeringChartTooltip unit=" events" />}
              cursor={{ stroke: 'rgba(255,255,255,0.07)', strokeWidth: 1 }}
            />
            {/* Low/medium boundary */}
            <ReferenceLine
              y={15}
              stroke="rgba(45,212,191,0.3)"
              strokeDasharray="4 3"
              label={{ value: 'LOW', position: 'insideTopRight', fill: 'rgba(45,212,191,0.55)', fontSize: 9 }}
            />
            {/* Medium/high boundary */}
            <ReferenceLine
              y={30}
              stroke="rgba(255,59,59,0.3)"
              strokeDasharray="4 3"
              label={{ value: 'HIGH', position: 'insideTopRight', fill: 'rgba(255,59,59,0.55)', fontSize: 9 }}
            />
            <Line
              type="monotone"
              dataKey="changes"
              name="Routing changes"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
