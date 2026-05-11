import { useState } from "react";
import { Link } from "react-router-dom";
import { loadColor } from "../../lib/utils";

export function AgentRow({ name, load }: { name: string; load: number }) {
  const [hovered, setHovered] = useState(false);
  const barColor = loadColor(load);
  const isIdle = load < 15;

  return (
    <Link
      to="/agents"
      className="block rounded-lg px-2 py-2 -mx-2 transition-colors"
      style={{
        backgroundColor: hovered ? "var(--color-bg-elevated)" : "transparent",
        textDecoration: "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-xs font-medium"
          style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}
        >
          {name}
        </span>
        <div className="flex items-center gap-1.5">
          {isIdle && (
            <span
              className="text-[9px] font-semibold px-1.5 py-px rounded"
              style={{
                color: "var(--color-neutral)",
                backgroundColor: "rgba(107,114,128,0.15)",
                letterSpacing: "0.04em",
              }}
            >
              IDLE
            </span>
          )}
          <span className="text-xs font-bold tabular-nums" style={{ color: barColor }}>
            {load}%
          </span>
        </div>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="h-full rounded-full" style={{ width: `${load}%`, backgroundColor: barColor }} />
      </div>
    </Link>
  );
}
