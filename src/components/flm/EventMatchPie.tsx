import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { PeeringChartTooltip } from './PeeringChartTooltip';
import {
  eventMatchSlices,
  eventMatchKpi,
  computeBand,
  bandColor,
  bandBg,
} from '../../data/peering-store';
import { InfoTooltip } from './InfoTooltip';

const band = computeBand(eventMatchKpi.value, eventMatchKpi.thresholds);
const color = bandColor(band);
const bg = bandBg(band);
// higher-better: green=good coverage, amber=partial, red=low
const stateLabel = band === 'green' ? 'HIGH' : band === 'amber' ? 'PARTIAL' : 'LOW';

export function EventMatchPie() {
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
            Event Match Coverage
          </p>
          <InfoTooltip
            description={eventMatchKpi.description}
            source={eventMatchKpi.source}
            thresholdLabel={eventMatchKpi.thresholdLabel}
          />
        </div>
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
          style={{ color, backgroundColor: bg }}
        >
          {stateLabel}
        </span>
      </div>
      <p className="text-[11px] mb-2" style={{ color: 'var(--color-text-muted)' }}>
        % incidents matched to known events — Event Scout
      </p>

      <div className="flex items-center gap-3 flex-1">
        <div className="relative shrink-0" style={{ width: 90, height: 90, cursor: 'pointer' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={eventMatchSlices}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={42}
                strokeWidth={0}
                onClick={() => navigate('/events')}
              >
                {eventMatchSlices.map((s, i) => (
                  <Cell key={i} fill={s.color} />
                ))}
              </Pie>
              <Tooltip content={<PeeringChartTooltip unit="%" />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-sm font-bold tabular-nums" style={{ color }}>
              {eventMatchKpi.value}%
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {eventMatchSlices.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ backgroundColor: s.color === 'rgba(255,255,255,0.08)' ? 'rgba(255,255,255,0.2)' : s.color }}
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
