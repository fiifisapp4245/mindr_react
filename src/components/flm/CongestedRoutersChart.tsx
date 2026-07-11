import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import {
  congestedRouters,
  congestedRoutersKpi,
  computeBand,
  bandColor,
  bandBg,
} from '../../data/peering-store';
import { InfoTooltip } from './InfoTooltip';
import { PeeringChartTooltip } from './PeeringChartTooltip';
import { Badge } from '../ui/badge';

// Color each bar based on per-router port count threshold
function routerBarColor(ports: number): string {
  if (ports > 3) return '#FF3B3B';
  if (ports >= 2) return '#FFB020';
  return '#2DD4BF';
}

const band = computeBand(congestedRoutersKpi.value, congestedRoutersKpi.thresholds);
const stateColor = bandColor(band);
const stateBg = bandBg(band);
const stateLabel = band === 'red' ? 'HOTSPOT' : band === 'amber' ? 'MODERATE' : 'LOW';

export function CongestedRoutersChart() {
  const navigate = useNavigate();
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
            <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Top Congested Routers
            </p>
            <InfoTooltip
              description={congestedRoutersKpi.description}
              source={congestedRoutersKpi.source}
              thresholdLabel={congestedRoutersKpi.thresholdLabel}
            />
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Congested ports per router (≥90% util) — SNMP
          </p>
        </div>
        <Badge className="text-[10px] shrink-0" style={{ color: stateColor, backgroundColor: stateBg }}>
          {stateLabel}
        </Badge>
      </div>

      <div style={{ height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={congestedRouters}
            margin={{ top: 2, right: 4, bottom: 0, left: 0 }}
            barCategoryGap="30%"
          >
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="router"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 8 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              width={16}
              domain={[0, 4]}
            />
            <Tooltip
              content={<PeeringChartTooltip unit=" ports" />}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar
              dataKey="ports"
              name="Congested ports"
              radius={[3, 3, 0, 0]}
              onClick={() => navigate('/topology')}
              style={{ cursor: 'pointer' }}
            >
              {congestedRouters.map((r, i) => (
                <Cell key={i} fill={routerBarColor(r.ports)} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
