import { useState } from "react";
import { Download, Maximize2, Pin, X } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartCard } from "../../types/assistant";

// ── Mini chart renderer ───────────────────────────────────────────────────────

function MiniChart({ card }: { card: ChartCard }) {
  const gradId = `canvas-grad-${card.id}`;

  if (card.type === "area") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={card.data} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
          <defs>
            {card.keys.map(({ key, color }) => (
              <linearGradient key={key} id={`${gradId}-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={color} stopOpacity={0}    />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey={card.xKey}
            tick={{ fill: "var(--color-text-muted)", fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "var(--color-text-muted)", fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            width={26}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 10,
              color: "var(--color-text-primary)",
            }}
            cursor={{ stroke: "rgba(255,255,255,0.07)", strokeWidth: 1 }}
          />
          {card.keys.map(({ key, color }) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              strokeWidth={1.8}
              fill={`url(#${gradId}-${key})`}
              dot={false}
              activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={card.data} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey={card.xKey}
          tick={{ fill: "var(--color-text-muted)", fontSize: 9 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--color-text-muted)", fontSize: 9 }}
          axisLine={false}
          tickLine={false}
          width={26}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 10,
            color: "var(--color-text-primary)",
          }}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        {card.keys.map(({ key, color }) => (
          <Bar
            key={key}
            dataKey={key}
            fill={color}
            radius={[3, 3, 0, 0]}
            fillOpacity={0.9}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Individual chart card ─────────────────────────────────────────────────────

function ChartCardItem({
  card,
  onRemove,
}: {
  card: ChartCard;
  onRemove: () => void;
}) {
  const [pinned, setPinned] = useState(false);

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <p
          className="text-xs font-semibold truncate flex-1 mr-2"
          style={{ color: "var(--color-text-primary)" }}
          title={card.title}
        >
          {card.title}
        </p>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => setPinned((p) => !p)}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: pinned ? "var(--color-brand)" : "var(--color-text-muted)" }}
            title="Pin to dashboard"
          >
            <Pin size={11} fill={pinned ? "currentColor" : "none"} />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "var(--color-text-muted)" }}
            title="Remove chart"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {/* Chart area — fixed px height so ResponsiveContainer has a concrete dimension */}
      <div style={{ height: 160, padding: "8px 8px 4px" }}>
        <MiniChart card={card} />
      </div>

      {/* Card footer */}
      <div
        className="flex items-center justify-between px-3.5 py-2 shrink-0"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          {card.timestamp}
        </span>
        <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--color-resolved)" }}>
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: "var(--color-resolved)" }}
          />
          {card.confidence}%
        </span>
      </div>
    </div>
  );
}

// ── VisualizationCanvas ───────────────────────────────────────────────────────

export function VisualizationCanvas({
  charts,
  onClose,
}: {
  charts: ChartCard[];
  onClose: () => void;
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = charts.filter((c) => !dismissed.has(c.id));

  function removeChart(id: string) {
    setDismissed((prev) => new Set([...prev, id]));
  }

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden flex-1 min-w-0"
      style={{
        backgroundColor: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      {/* Canvas header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-2">
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Visualization Canvas
          </p>
          {visible.length > 0 && (
            <span
              className="text-[10px] font-semibold px-1.5 py-px rounded-full"
              style={{
                backgroundColor: "rgba(233,30,140,0.12)",
                color: "var(--color-brand)",
              }}
            >
              {visible.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "var(--color-text-muted)" }}
            title="Download all"
          >
            <Download size={13} />
          </button>
          <button
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "var(--color-text-muted)" }}
            title="Expand canvas"
          >
            <Maximize2 size={13} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors ml-1"
            style={{ color: "var(--color-text-muted)" }}
            title="Close canvas"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Chart grid */}
      <div
        className="flex-1 overflow-y-auto p-3 grid gap-3 content-start"
        style={{ scrollbarWidth: "thin", gridTemplateColumns: "repeat(2, 1fr)" }}
      >
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <p
              className="text-sm font-medium mb-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              No Visualizations Yet
            </p>
            <p
              className="text-[11px]"
              style={{ color: "var(--color-text-muted)", opacity: 0.6 }}
            >
              Ask a question to generate charts
            </p>
          </div>
        ) : (
          visible.map((card) => (
            <ChartCardItem
              key={card.id}
              card={card}
              onRemove={() => removeChart(card.id)}
            />
          ))
        )}
      </div>

      {/* Footer hint */}
      {visible.length > 0 && (
        <div
          className="px-4 py-2.5 shrink-0 flex items-center justify-center gap-1.5"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <span style={{ fontSize: 11 }}>💡</span>
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
            Pin charts to keep them on your dashboard
          </p>
        </div>
      )}
    </div>
  );
}
