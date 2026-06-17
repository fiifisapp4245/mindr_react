import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { kpiCard, kpiValueScale } from '../../lib/animations';
import {
  computeBand,
  bandColor,
  bandBg,
  bandLabel,
  type KpiEntry,
} from '../../data/peering-store';
import { InfoTooltip } from './InfoTooltip';

interface Props {
  title: string;
  entry: KpiEntry;
  to?: string;
}

export function PeeringKpiCard({ title, entry, to }: Props) {
  const band = computeBand(entry.value, entry.thresholds);
  const color = bandColor(band);
  const bg = bandBg(band);
  const label = bandLabel(band);
  const navigate = useNavigate();

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
      onClick={to ? () => navigate(to) : undefined}
      onKeyDown={
        to
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(to);
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

      {/* Band badge + support text */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className="text-[10px] font-semibold px-1.5 py-px rounded shrink-0"
          style={{ color, backgroundColor: bg }}
        >
          {label}
        </span>
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
