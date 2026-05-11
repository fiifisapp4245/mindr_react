export function TrendTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs space-y-1"
      style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
    >
      <p style={{ color: "var(--color-text-muted)" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey === "throughput" ? "Throughput" : p.dataKey === "latency" ? "Latency" : "Volume"}:{" "}
          <strong>
            {p.dataKey === "latency" ? `${p.value}ms` : p.dataKey === "volume" ? `${p.value} Gbps` : `${p.value} Tbps`}
          </strong>
        </p>
      ))}
    </div>
  );
}
