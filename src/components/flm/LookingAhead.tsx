import { Zap, Calendar } from 'lucide-react';
import { lookingAheadItems, type LookingAheadItem } from '../../data/peering-store';

const SEV_CFG: Record<LookingAheadItem['severity'], { color: string; bg: string }> = {
  CRITICAL: { color: 'var(--color-critical)',   bg: 'rgba(255,59,59,0.12)' },
  WARNING:  { color: 'var(--color-warning)',    bg: 'rgba(255,176,32,0.12)' },
  INFO:     { color: 'var(--color-mitigating)', bg: 'rgba(77,158,255,0.12)' },
};

export function LookingAhead() {
  return (
    <div
      className="rounded-lg p-5"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      <p
        className="text-sm font-semibold mb-4"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Looking ahead
      </p>

      <div className="grid grid-cols-3 gap-3">
        {lookingAheadItems.map((item) => {
          const cfg = SEV_CFG[item.severity];
          const Icon = item.type === 'breach' ? Zap : Calendar;
          return (
            <div
              key={item.id}
              className="rounded-lg p-4 flex flex-col gap-3"
              style={{ backgroundColor: 'var(--color-bg-elevated)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className="rounded-lg p-2 shrink-0"
                  style={{ backgroundColor: cfg.bg }}
                >
                  <Icon size={14} style={{ color: cfg.color }} />
                </div>
                <div
                  className="flex flex-col items-end"
                  style={{ color: cfg.color }}
                >
                  <span className="text-2xl font-bold tabular-nums leading-none">
                    {item.timeLabel}
                  </span>
                  <span className="text-[9px] font-medium mt-0.5">
                    {item.timeUnit}
                  </span>
                </div>
              </div>

              <div>
                <p
                  className="text-sm font-medium leading-snug"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {item.label}
                </p>
                <p
                  className="text-xs mt-1 leading-snug"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {item.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
