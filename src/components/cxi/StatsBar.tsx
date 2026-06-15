import type { MINDRCase } from "../../types/cxi";

interface StatsBarProps {
  cases: MINDRCase[];
}

interface Tile {
  label: string;
  value: string | number;
  sub: string;
  accentColor: string;
}

export function StatsBar({ cases }: StatsBarProps) {
  const total = cases.length;
  const pending = cases.filter((c) => c.status === "pending").length;
  const approved = cases.filter((c) => c.status === "approved").length;
  const rejected = cases.filter((c) => c.status === "rejected").length;
  const corrected = cases.filter((c) => c.status === "corrected").length;
  const reviewed = approved + rejected + corrected;
  const approvalRate = reviewed > 0 ? Math.round(((approved + corrected) / reviewed) * 100) : 0;

  // Compute average duration from "Xh Ym" strings
  function parseMins(dur: string): number {
    const h = dur.match(/(\d+)h/)?.[1] ?? "0";
    const m = dur.match(/(\d+)m/)?.[1] ?? "0";
    return parseInt(h) * 60 + parseInt(m);
  }
  const totalMins = cases.reduce((acc, c) => acc + parseMins(c.duration), 0);
  const avgMins = total > 0 ? Math.round(totalMins / total) : 0;
  const avgDuration = avgMins >= 60
    ? `${Math.floor(avgMins / 60)}h ${avgMins % 60}m`
    : `${avgMins}m`;

  const tiles: Tile[] = [
    {
      label: "Total Cases",
      value: total,
      sub: "Last 7 days",
      accentColor: "var(--color-text-primary)",
    },
    {
      label: "Pending Review",
      value: pending,
      sub: `${total - pending} resolved`,
      accentColor: "var(--mindr-pending)",
    },
    {
      label: "Approval Rate",
      value: `${approvalRate}%`,
      sub: `${approved + corrected} of ${reviewed} reviews actioned`,
      accentColor: "var(--color-resolved)",
    },
    {
      label: "Avg Response",
      value: avgDuration,
      sub: "Case open duration",
      accentColor: "var(--color-mitigating)",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="kpi-card rounded-xl p-4 flex flex-col gap-1"
          style={{
            backgroundColor: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          <p
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {tile.label}
          </p>
          <p
            className="text-3xl font-bold leading-none mt-1"
            style={{ color: tile.accentColor, fontFamily: "var(--font-mono)" }}
          >
            {tile.value}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {tile.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
