// Recharts tooltip payload shape differs between chart types:
// - Bar/Line: payload[i].color  (stroke/fill set on the series)
// - Pie/Cell: payload[i].fill   (set per Cell)
// We read both so dark-theme styling works across all chart types.

interface PayloadItem {
  dataKey?: string;
  value: number;
  color?: string;
  fill?: string;
  name?: string;
}

interface Props {
  active?: boolean;
  payload?: PayloadItem[];
  label?: string;
  unit?: string;
}

export function PeeringChartTooltip({ active, payload, label, unit = '' }: Props) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs space-y-1"
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: 'var(--color-text-primary)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      {label && <p style={{ color: 'var(--color-text-muted)' }}>{label}</p>}
      {payload.map((p, i) => {
        // prefer .fill (Pie/Cell), fallback to .color (Bar/Line), then brand
        const itemColor = p.fill ?? p.color ?? 'var(--color-brand)';
        const itemKey = p.name ?? p.dataKey ?? String(i);
        const displayName = p.name ?? p.dataKey ?? '';
        return (
          <p key={itemKey} style={{ color: itemColor }}>
            {displayName}:{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>
              {Number(p.value).toFixed(0)}
              {unit}
            </strong>
          </p>
        );
      })}
    </div>
  );
}
