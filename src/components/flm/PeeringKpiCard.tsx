import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { kpiCard, kpiValueScale } from '../../lib/animations';
import {
  computeBand,
  bandColor,
  type KpiEntry,
} from '../../data/peering-store';
import { InfoTooltip } from './InfoTooltip';

interface Props {
  title: string;
  entry: KpiEntry;
  to?: string;
  /** Route state to pass along with `to` (e.g. an auto-submitted Network Model query). */
  navState?: Record<string, unknown>;
}

export function PeeringKpiCard({ title, entry, to, navState }: Props) {
  const band = computeBand(entry.value, entry.thresholds);
  const color = bandColor(band);
  const navigate = useNavigate();

  const go = () => to && navigate(to, navState ? { state: navState } : undefined);

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      variants={kpiCard}
      className="kpi-card rounded-lg flex flex-col gap-2.5 relative"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderWidth: 1,
        borderStyle: 'solid',
        padding: '16px',
        cursor: to ? 'pointer' : 'default',
      }}
      onClick={to ? go : undefined}
      onKeyDown={
        to
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                go();
              }
            }
          : undefined
      }
      tabIndex={to ? 0 : undefined}
      role={to ? 'button' : undefined}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <p
          className="text-[11px] font-medium uppercase tracking-widest leading-tight"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {title}
        </p>
        <InfoTooltip
          description={entry.description}
          source={entry.source}
          thresholdLabel={entry.thresholdLabel}
        />
      </div>

      {/* Value + unit */}
      <div className="flex items-end gap-1">
        <motion.p
          variants={kpiValueScale}
          className="text-3xl font-bold tabular-nums leading-none"
          style={{ color }}
        >
          {entry.value}
        </motion.p>
        <span
          className="text-xs pb-0.5"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {entry.unit}
        </span>
      </div>

      {/* Support text */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <p
          className="text-[11px] truncate"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {entry.supportText}
        </p>
      </div>
    </motion.div>
  );
}
