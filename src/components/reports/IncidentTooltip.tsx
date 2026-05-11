export function IncidentTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + p.value, 0);
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs space-y-1"
      style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
    >
      <p style={{ color: "var(--color-text-muted)" }}>{label} — {total} total</p>
      {[...payload].reverse().map((p) => (
        <p key={p.dataKey} style={{ color: "var(--color-text-primary)" }}>
          {p.dataKey.charAt(0).toUpperCase() + p.dataKey.slice(1)}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}
