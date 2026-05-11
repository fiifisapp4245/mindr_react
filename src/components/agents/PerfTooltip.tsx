export function PerfTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs space-y-0.5"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
        color: "var(--color-text-primary)",
      }}
    >
      <p style={{ color: "var(--color-text-muted)" }}>{label}</p>
      <p style={{ color: "var(--color-brand)" }}>
        <strong>{payload[0].value} ms</strong>
      </p>
    </div>
  );
}
