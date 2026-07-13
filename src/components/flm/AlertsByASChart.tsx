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
  alertsByAS,
  alertsByASKpi,
  computeBand,
  bandColor,
  bandBg,
} from '../../data/peering-store';
import { InfoTooltip } from './InfoTooltip';
import { PeeringChartTooltip } from './PeeringChartTooltip';
import { Badge } from '../ui/badge';

const band = computeBand(alertsByASKpi.value, alertsByASKpi.thresholds);
const stateColor = bandColor(band);
const stateBg = bandBg(band);
const stateLabel = band === 'red' ? 'CONCENTRATED' : band === 'amber' ? 'SKEWED' : 'BALANCED';

export function AlertsByASChart() {
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
              Alerts by Handover AS
            </p>
            <InfoTooltip
              description={alertsByASKpi.description}
              source={alertsByASKpi.source}
              thresholdLabel={alertsByASKpi.thresholdLabel}
            />
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Alert count per autonomous system — Anodot
          </p>
        </div>
        <Badge className="text-[10px] shrink-0" style={{ color: stateColor, backgroundColor: stateBg }}>
          {stateLabel}
        </Badge>
      </div>

      <div style={{ height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={alertsByAS}
            margin={{ top: 2, right: 4, bottom: 0, left: 0 }}
            barCategoryGap="30%"
          >
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="as"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              width={20}
            />
            <Tooltip
              content={<PeeringChartTooltip unit=" alerts" />}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar
              dataKey="count"
              name="Alerts"
              radius={[3, 3, 0, 0]}
              onClick={(data: any) => {
                const as = data?.as ?? data?.payload?.as;
                if (as) navigate(`/alerts?affectedAS=${as}`);
              }}
              style={{ cursor: 'pointer' }}
            >
              {alertsByAS.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === 0 ? 'var(--color-critical)' : 'var(--color-brand)'}
                  fillOpacity={i === 0 ? 0.85 : 0.6}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
