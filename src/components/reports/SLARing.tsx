export function SLARing({ value }: { value: number }) {
  const r    = 68;
  const sw   = 10;
  const cx   = 84;
  const cy   = 84;
  const circ = 2 * Math.PI * r;
  const gap  = circ * (1 - value / 100);

  return (
    <svg width={168} height={168} style={{ display: "block", margin: "0 auto" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={gap}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ filter: "drop-shadow(0 0 8px rgba(233,30,140,0.5))" }}
      />
      <text
        x={cx} y={cy - 6}
        textAnchor="middle"
        fill="#F4F4F5"
        fontSize={26}
        fontWeight="bold"
        fontFamily="IBM Plex Sans, sans-serif"
      >
        {value.toFixed(1)}
      </text>
      <text
        x={cx} y={cy + 14}
        textAnchor="middle"
        fill="#F4F4F5"
        fontSize={10}
        fontFamily="IBM Plex Sans, sans-serif"
        letterSpacing="0.08em"
      >
        PERCENT
      </text>
    </svg>
  );
}
