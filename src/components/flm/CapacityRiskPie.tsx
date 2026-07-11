import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { PeeringChartTooltip } from './PeeringChartTooltip';
import {
  capacityRiskSlices,
  capacityRiskKpi,
  computeBand,
  bandColor,
  bandBg,
} from '../../data/peering-store';
import { InfoTooltip } from './InfoTooltip';
import { Badge } from '../ui/badge';

const band = computeBand(capacityRiskKpi.value, capacityRiskKpi.thresholds);
const color = bandColor(band);
const bg = bandBg(band);
const stateLabel = band === 'red' ? 'CRITICAL' : band === 'amber' ? 'WATCH' : 'HEALTHY';

export function CapacityRiskPie() {
  const navigate = useNavigate();
  return (
    <div
      className="rounded-lg p-4 flex flex-col"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-start justify-between mb-1 gap-2">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Capacity Risk
          </p>
          <InfoTooltip
            description={capacityRiskKpi.description}
            source={capacityRiskKpi.source}
            thresholdLabel={capacityRiskKpi.thresholdLabel}
          />
        </div>
        <Badge className="text-[10px] shrink-0" style={{ color, backgroundColor: bg }}>
          {stateLabel}
        </Badge>
      </div>
      <p className="text-[11px] mb-2" style={{ color: 'var(--color-text-muted)' }}>
        % ports by build-out status — Border Planner
      </p>

      <div className="flex items-center gap-3 flex-1">
        <div style={{ width: 90, height: 90, flexShrink: 0, cursor: 'pointer' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={capacityRiskSlices}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={42}
                strokeWidth={0}
                onClick={() => navigate('/alerts')}
              >
                {capacityRiskSlices.map((s, i) => (
                  <Cell key={i} fill={s.color} />
                ))}
              </Pie>
              <Tooltip content={<PeeringChartTooltip unit="%" />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-1.5">
          {capacityRiskSlices.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                {s.name}{' '}
                <strong style={{ color: 'var(--color-text-primary)' }}>{s.value}%</strong>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
