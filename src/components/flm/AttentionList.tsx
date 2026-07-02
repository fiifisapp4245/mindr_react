import { attentionItems, type AttentionItem } from '../../data/peering-store';
import { Link } from 'react-router-dom';

const SEV_CFG: Record<
  AttentionItem['severity'],
  { color: string; bg: string; dot: string }
> = {
  CRITICAL:  { color: 'var(--color-critical)',   bg: 'rgba(255,59,59,0.12)',   dot: '#FF3B3B' },
  HIGH:      { color: 'var(--color-warning)',    bg: 'rgba(255,176,32,0.12)',  dot: '#FFB020' },
  WATCH:     { color: 'var(--color-mitigating)', bg: 'rgba(77,158,255,0.12)', dot: '#4D9EFF' },
  PREDICTED: { color: 'var(--color-neutral)',    bg: 'rgba(107,114,128,0.12)', dot: '#6B7280' },
};

export function AttentionList() {
  return (
    <div
      className="rounded-lg mt-3"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2.5">
        <p
          className="text-xs font-medium uppercase tracking-widest"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Needs attention now
        </p>
        <Link
          to="/alerts"
          className="text-xs font-medium transition-opacity hover:opacity-80"
          style={{ color: 'var(--color-brand)' }}
        >
          View all alerts →
        </Link>
      </div>

      <div className="px-2 pb-2">
        {attentionItems.map((item, i) => {
          const cfg = SEV_CFG[item.severity];
          const isLast = i === attentionItems.length - 1;
          const dest = item.id.startsWith('INC-') || item.id.startsWith('CHG-')
            ? '/alerts'
            : '/events';
          return (
            <Link
              key={item.id}
              to={dest}
              className="px-3 py-3 flex items-center gap-3 rounded hover:bg-white/5 transition-colors"
              style={{
                borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
                textDecoration: 'none',
              }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0 mt-0.5"
                style={{ backgroundColor: cfg.dot }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {item.title}
                  </span>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-px rounded shrink-0"
                    style={{ color: cfg.color, backgroundColor: cfg.bg }}
                  >
                    {item.severity}
                  </span>
                </div>
                <p
                  className="text-[11px] mt-0.5"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {item.source}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p
                  className="text-[10px] font-medium"
                  style={{
                    color: 'var(--color-text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {item.id}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  {item.age}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
