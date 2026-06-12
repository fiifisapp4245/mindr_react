import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckSquare,
  ChevronRight,
  Clock,
  ExternalLink,
  MessageSquare,
  Network,
  Server,
  ThumbsDown,
  ThumbsUp,
  X,
  Zap,
  Radio,
} from "lucide-react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { EVENTS_FULL } from "../data/events";
import type { EventFull, EventStatus } from "../data/events";

// ── Color helpers ────────────────────────────────────────────────────────────

function statusCfg(s: EventStatus) {
  if (s === "live")     return { label: "Live",     bg: "rgba(45,212,191,0.15)", color: "#2DD4BF" };
  if (s === "past")     return { label: "Past",     bg: "rgba(148,163,184,0.12)", color: "#94a3b8" };
  return                         { label: "Upcoming", bg: "rgba(77,158,255,0.15)",  color: "#4D9EFF" };
}

function severityCfg(s: string) {
  if (s === "critical") return { bg: "rgba(255,59,59,0.12)",  color: "#FF3B3B" };
  if (s === "high")     return { bg: "rgba(255,176,32,0.12)", color: "#FFB020" };
  if (s === "medium")   return { bg: "rgba(234,179,8,0.12)",  color: "#eab308" };
  return                         { bg: "rgba(45,212,191,0.12)", color: "#2DD4BF" };
}

function pathNodeIcon(type: EventFull["affectedPath"][0]["type"]) {
  if (type === "cdn")    return Network;
  if (type === "ixp")   return Radio;
  if (type === "router") return Server;
  return Network;
}

// ── Custom chart tooltip ────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs space-y-1"
      style={{
        backgroundColor: "#1E1E2A",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      }}
    >
      <div className="font-semibold mb-1" style={{ color: "#94a3b8" }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: p.color }} />
          <span style={{ color: "#c8c8d0" }}>{p.name}</span>
          <span className="font-bold tabular-nums ml-auto pl-3" style={{ color: p.color }}>{p.value}%</span>
        </div>
      ))}
    </div>
  );
}

// ── Forecast chart ───────────────────────────────────────────────────────────

function ForecastChart({ event }: { event: EventFull }) {
  const isLive = event.status === "live";
  const isPast = event.status === "past";
  const showActual = isLive || isPast;
  const overloaded = !!event.overloadStart;

  return (
    <div>
      {/* Overload alert badge */}
      {overloaded && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3 text-xs font-semibold"
          style={{ backgroundColor: "rgba(255,59,59,0.12)", border: "1px solid rgba(255,59,59,0.3)", color: "#FF3B3B" }}
        >
          <AlertTriangle size={12} strokeWidth={2.5} />
          Overload predicted — interface utilization will exceed 85% capacity threshold
          {isPast && event.actualPeak && (
            <span className="ml-auto font-normal" style={{ color: "#94a3b8" }}>
              Actual peak: {event.actualPeak}%
            </span>
          )}
        </div>
      )}

      {/* Live exceeds forecast callout */}
      {isLive && event.actualPeak && event.actualPeak > event.predictedPeak && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3 text-xs font-semibold"
          style={{ backgroundColor: "rgba(255,176,32,0.10)", border: "1px solid rgba(255,176,32,0.3)", color: "#FFB020" }}
        >
          <AlertTriangle size={12} strokeWidth={2.5} />
          Actual exceeds forecast ({event.actualPeak}% vs {event.predictedPeak}% predicted)
          <Link
            to="/alarms"
            className="ml-auto flex items-center gap-1 font-semibold hover:opacity-80 transition-opacity"
            style={{ color: "#FFB020" }}
          >
            → Linked alarm <ExternalLink size={10} />
          </Link>
        </div>
      )}

      {/* Past accuracy summary */}
      {isPast && event.accuracy && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3 text-xs"
          style={{ backgroundColor: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)", color: "#2DD4BF" }}
        >
          <CheckSquare size={12} strokeWidth={2.5} />
          <span>Forecast accuracy: <strong>{event.accuracy}%</strong></span>
          <span style={{ color: "#94a3b8" }}>·</span>
          <span style={{ color: "#94a3b8" }}>Predicted {event.predictedPeak}% · Actual {event.actualPeak}%</span>
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={event.chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "#5c5c7a" }}
            axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#5c5c7a" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 10, paddingTop: 8, color: "#94a3b8" }}
            iconType="plainline"
            iconSize={16}
          />

          {/* Overload zone highlight */}
          {event.overloadStart && event.overloadEnd && (
            <ReferenceArea
              x1={event.overloadStart}
              x2={event.overloadEnd}
              fill="rgba(255,59,59,0.08)"
              stroke="rgba(255,59,59,0.2)"
              strokeWidth={1}
            />
          )}

          {/* Capacity threshold at 85% */}
          <ReferenceLine
            y={85}
            stroke="#FF3B3B"
            strokeDasharray="5 4"
            strokeWidth={1.5}
            label={{ value: "85% cap", position: "insideTopRight", fontSize: 10, fill: "#FF3B3B", dy: -4 }}
          />

          {/* Base load */}
          <Line
            type="monotone"
            dataKey="base"
            name="Base load"
            stroke="#4D9EFF"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 3"
            strokeOpacity={0.7}
          />

          {/* Predicted spike */}
          <Line
            type="monotone"
            dataKey="predicted"
            name={isPast ? "Predicted" : "Forecast (event spike)"}
            stroke="#FFB020"
            strokeWidth={2}
            dot={false}
          />

          {/* Actual — live or past */}
          {showActual && (
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#2DD4BF"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend supplement — capacity line */}
      <div className="flex items-center gap-4 mt-1 px-1">
        <div className="flex items-center gap-1.5">
          <svg width="20" height="8">
            <line x1="0" y1="4" x2="20" y2="4" stroke="#FF3B3B" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
          <span className="text-[10px]" style={{ color: "#94a3b8" }}>85% capacity threshold</span>
        </div>
        {event.overloadStart && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: "rgba(255,59,59,0.25)" }} />
            <span className="text-[10px]" style={{ color: "#94a3b8" }}>Overload zone</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Affected path strip ──────────────────────────────────────────────────────

function PathStrip({ nodes }: { nodes: EventFull["affectedPath"] }) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto">
      {nodes.map((node, i) => {
        const Icon = pathNodeIcon(node.type);
        const isLast = i === nodes.length - 1;
        return (
          <div key={i} className="flex items-center gap-0 shrink-0">
            <div
              className="flex flex-col items-center px-3 py-2.5 rounded-lg"
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border)",
                minWidth: 120,
              }}
            >
              <Icon size={13} style={{ color: "#4D9EFF" }} strokeWidth={1.8} />
              <div className="text-[11px] font-semibold mt-1 text-center leading-tight" style={{ color: "var(--color-text-primary)" }}>
                {node.label}
              </div>
              <div className="text-[9px] mt-0.5 text-center leading-tight" style={{ color: "var(--color-text-muted)" }}>
                {node.detail}
              </div>
            </div>
            {!isLast && (
              <div className="flex items-center px-1">
                <ArrowRight size={12} style={{ color: "#94a3b8" }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const event = EVENTS_FULL.find((e) => e.id === id);

  const [validation, setValidation] = useState<"confirmed" | "adjusted" | "dismissed" | null>(null);
  const [validationNote, setValidationNote] = useState("");

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertTriangle size={40} style={{ color: "var(--color-text-muted)" }} />
        <p className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Event not found
        </p>
        <Link to="/events" className="text-sm font-medium hover:opacity-80" style={{ color: "var(--color-brand)" }}>
          ← Back to Events
        </Link>
      </div>
    );
  }

  const TypeIcon = event.typeIcon;
  const status = statusCfg(event.status);
  const severity = severityCfg(event.severity);

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-base)", color: "var(--color-text-primary)" }}
    >
      {/* Top action bar */}
      <div
        className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
      >
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs">
          <Link
            to="/events"
            className="flex items-center gap-1 hover:opacity-80 transition-opacity font-medium"
            style={{ color: "var(--color-text-muted)" }}
          >
            Events
          </Link>
          <ChevronRight size={11} style={{ color: "var(--color-text-muted)", opacity: 0.5 }} />
          <span
            className="font-mono text-[10px] px-1.5 py-px rounded font-semibold"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)" }}
          >
            {event.id}
          </span>
          <ChevronRight size={11} style={{ color: "var(--color-text-muted)", opacity: 0.5 }} />
          <span className="font-medium truncate max-w-[280px]" style={{ color: "var(--color-text-primary)" }}>
            {event.name}
          </span>
        </nav>

        {/* CTA */}
        <button
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
        >
          <CheckSquare size={13} strokeWidth={2.2} />
          Acknowledge &amp; prepare
        </button>
      </div>

      {/* Body — two column */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main column */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4" style={{ minWidth: 0 }}>

          {/* Header card */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            {/* Status row */}
            <div className="flex items-center gap-2 mb-3">
              {/* Live pulse */}
              {event.status === "live" && (
                <span className="relative flex h-2 w-2">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ backgroundColor: "#2DD4BF" }}
                  />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "#2DD4BF" }} />
                </span>
              )}
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide"
                style={{ backgroundColor: status.bg, color: status.color }}
              >
                {status.label}
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide"
                style={{ backgroundColor: severity.bg, color: severity.color }}
              >
                {event.severity}
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded ml-auto"
                style={{ backgroundColor: "rgba(77,158,255,0.1)", color: "#4D9EFF" }}
              >
                {event.confidence}% confidence
              </span>
            </div>

            <h1 className="text-xl font-bold leading-tight mb-3" style={{ color: "var(--color-text-primary)" }}>
              {event.name}
            </h1>

            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Type",    value: event.type },
                { label: "Window",  value: event.windowUTC },
                { label: "Scope",   value: event.affectedScope },
                { label: "Source",  value: event.source },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p
                    className="text-[9px] font-semibold uppercase tracking-widest mb-0.5"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {label}
                  </p>
                  <p className="text-[12px] font-medium leading-snug" style={{ color: "var(--color-text-primary)" }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Event metadata */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: "var(--color-text-muted)" }}
            >
              Event metadata
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "var(--color-text-muted)" }}>Detection source</p>
                <p className="text-xs leading-snug" style={{ color: "var(--color-text-primary)" }}>{event.detectionSource}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "var(--color-text-muted)" }}>Historic occurrences</p>
                <p className="text-xs leading-snug" style={{ color: "var(--color-text-primary)" }}>{event.historicOccurrences}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "var(--color-text-muted)" }}>Predicted peak load</p>
                <p
                  className="text-base font-bold tabular-nums"
                  style={{ color: event.predictedPeak >= 85 ? "#FF3B3B" : event.predictedPeak >= 70 ? "#FFB020" : "#2DD4BF" }}
                >
                  {event.predictedPeak}%
                  {event.actualPeak && (
                    <span className="text-xs font-medium ml-2" style={{ color: "var(--color-text-muted)" }}>
                      actual {event.actualPeak}%
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Affected scope path */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: "var(--color-text-muted)" }}
            >
              Affected scope — traffic path
            </p>
            <PathStrip nodes={event.affectedPath} />
          </div>

          {/* Forecast chart */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Interface utilization forecast
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {event.status === "live"
                    ? "Live: actual vs predicted — updating every 2 min"
                    : event.status === "past"
                    ? "Post-event: predicted vs actual outcome"
                    : "Predicted load through event window · 85% capacity threshold"}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <TypeIcon size={13} style={{ color: "var(--color-text-muted)" }} />
                <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{event.type}</span>
              </div>
            </div>
            <ForecastChart event={event} />
          </div>

          {/* Recommended actions */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--color-text-muted)" }}
              >
                Recommended actions
              </p>
              <Link
                to="/playbooks"
                className="flex items-center gap-1 text-[11px] font-medium hover:opacity-80 transition-opacity"
                style={{ color: "var(--color-brand)" }}
              >
                <BookOpen size={11} />
                Matched playbook: Pre-event capacity prep
              </Link>
            </div>
            <div className="space-y-2">
              {[
                { label: "Pre-provision capacity on parallel path", tag: "Capacity", tagColor: "#4D9EFF" },
                { label: "Pre-stage policy-based reroute on AS1299 peering interface", tag: "Routing", tagColor: "#FFB020" },
                { label: "Notify CDN for load-balancing (raise CASM ticket)", tag: "Coordination", tagColor: "#2DD4BF" },
              ].map((action, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                  style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
                >
                  <span
                    className="text-[9px] font-bold px-1.5 py-px rounded shrink-0"
                    style={{ backgroundColor: `${action.tagColor}18`, color: action.tagColor }}
                  >
                    {action.tag}
                  </span>
                  <span className="text-[12px]" style={{ color: "var(--color-text-primary)" }}>
                    {action.label}
                  </span>
                  <button
                    className="ml-auto flex items-center gap-1 text-[10px] font-semibold shrink-0 hover:opacity-80"
                    style={{ color: "var(--color-brand)" }}
                  >
                    Open <ExternalLink size={9} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Validation controls */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest mb-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Event validation
                </p>
                <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                  Your input feeds the forecast model — First Line role can confirm, adjust, or dismiss.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setValidation(validation === "confirmed" ? null : "confirmed")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: validation === "confirmed" ? "rgba(45,212,191,0.15)" : "var(--color-bg-elevated)",
                    border: `1px solid ${validation === "confirmed" ? "#2DD4BF" : "var(--color-border)"}`,
                    color: validation === "confirmed" ? "#2DD4BF" : "var(--color-text-muted)",
                  }}
                >
                  <ThumbsUp size={12} strokeWidth={2} />
                  Confirm relevant
                </button>
                <button
                  onClick={() => setValidation(validation === "adjusted" ? null : "adjusted")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: validation === "adjusted" ? "rgba(255,176,32,0.12)" : "var(--color-bg-elevated)",
                    border: `1px solid ${validation === "adjusted" ? "#FFB020" : "var(--color-border)"}`,
                    color: validation === "adjusted" ? "#FFB020" : "var(--color-text-muted)",
                  }}
                >
                  <MessageSquare size={12} strokeWidth={2} />
                  Adjust impact
                </button>
                <button
                  onClick={() => setValidation(validation === "dismissed" ? null : "dismissed")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: validation === "dismissed" ? "rgba(255,59,59,0.10)" : "var(--color-bg-elevated)",
                    border: `1px solid ${validation === "dismissed" ? "#FF3B3B" : "var(--color-border)"}`,
                    color: validation === "dismissed" ? "#FF3B3B" : "var(--color-text-muted)",
                  }}
                >
                  <X size={12} strokeWidth={2} />
                  Dismiss
                </button>
              </div>
            </div>

            {/* Adjust note input */}
            {validation === "adjusted" && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={validationNote}
                  onChange={(e) => setValidationNote(e.target.value)}
                  placeholder="Describe the adjustment (e.g. peak may be 10% lower based on CDN pre-warming plan)…"
                  className="flex-1 rounded-lg px-3 py-2 text-xs"
                  style={{
                    backgroundColor: "var(--color-bg-elevated)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                    outline: "none",
                  }}
                />
                <button
                  className="px-3 py-2 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
                >
                  Submit
                </button>
              </div>
            )}

            {/* Confirmation feedback */}
            {validation && validation !== "adjusted" && (
              <div
                className="mt-3 px-3 py-2 rounded-lg text-xs flex items-center gap-2"
                style={{
                  backgroundColor: validation === "confirmed" ? "rgba(45,212,191,0.08)" : "rgba(255,59,59,0.08)",
                  border: `1px solid ${validation === "confirmed" ? "rgba(45,212,191,0.2)" : "rgba(255,59,59,0.2)"}`,
                  color: validation === "confirmed" ? "#2DD4BF" : "#FF3B3B",
                }}
              >
                {validation === "confirmed" ? (
                  <>
                    <ThumbsUp size={11} />
                    Event confirmed — forecast model updated. Thank you.
                  </>
                ) : (
                  <>
                    <X size={11} />
                    Marked as false positive — this event will be excluded from alerting.
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right rail */}
        <div
          className="shrink-0 overflow-y-auto py-5 px-4 space-y-4"
          style={{
            width: 296,
            borderLeft: "1px solid var(--color-border)",
            backgroundColor: "var(--color-bg-base)",
          }}
        >
          {/* MINDR AI banner */}
          <div
            className="rounded-xl p-4"
            style={{
              background: "linear-gradient(135deg, rgba(226,0,116,0.12), rgba(226,0,116,0.05))",
              border: "1px solid rgba(226,0,116,0.25)",
            }}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--color-brand)" }}
              >
                <Zap size={13} color="#fff" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>MINDR analysis</p>
                <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  {event.confidence}% confidence forecast
                </p>
              </div>
            </div>
            <button
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold mt-1 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
            >
              <MessageSquare size={12} />
              Discuss this event
            </button>
          </div>

          {/* Planned changes in window */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                Planned changes in window
              </p>
            </div>
            <div className="px-4 py-3">
              <div
                className="flex items-start gap-2.5 p-2.5 rounded-lg"
                style={{ backgroundColor: "rgba(255,176,32,0.06)", border: "1px solid rgba(255,176,32,0.2)" }}
              >
                <AlertTriangle size={12} className="mt-0.5 shrink-0" style={{ color: "#FFB020" }} />
                <div>
                  <p className="text-[11px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    CHG-9912 — AS3320 maintenance
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#FFB020" }}>
                    Overlap risk · 14:00–16:00 UTC
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    Maintenance window overlaps with event pre-load phase — capacity temporarily reduced
                  </p>
                </div>
              </div>
              <p className="text-[10px] mt-2 text-center" style={{ color: "var(--color-text-muted)" }}>
                No other changes scheduled in window
              </p>
            </div>
          </div>

          {/* Similar past events */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                Similar past events
              </p>
              <p className="text-[9px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                Learning loop — forecast model trained on these
              </p>
            </div>
            {[
              { id: "EVT-0045", name: "Nova Strike S2 launch", date: "02 May", predicted: 92, actual: 95, accuracy: 96 },
              { id: "EVT-0031", name: "Nova Strike S1 launch", date: "14 Jan", predicted: 84, actual: 88, accuracy: 94 },
            ].map((past, i, arr) => (
              <Link
                key={past.id}
                to={`/events/${past.id}`}
                className="block px-4 py-3 hover:bg-white/5 transition-colors"
                style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--color-border)" : "none" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                      {past.name}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{past.date}</p>
                  </div>
                  <ChevronRight size={11} style={{ color: "var(--color-text-muted)", marginTop: 2 }} />
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                    P: <span style={{ color: "#FFB020" }}>{past.predicted}%</span>
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                    A: <span style={{ color: "#2DD4BF" }}>{past.actual}%</span>
                  </div>
                  <div
                    className="ml-auto text-[10px] font-semibold px-1.5 py-px rounded"
                    style={{ backgroundColor: "rgba(45,212,191,0.1)", color: "#2DD4BF" }}
                  >
                    {past.accuracy}% acc
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Related alarms from past occurrences */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                Related alarms — past occurrences
              </p>
            </div>
            {[
              { ref: "ALM-4421", desc: "AMS-IX interface saturation", event: "Nova Strike S2", severity: "critical" },
              { ref: "ALM-4398", desc: "AS1299 BGP session flap", event: "Nova Strike S2", severity: "high" },
              { ref: "ALM-3817", desc: "EdgeCDN egress spike", event: "Nova Strike S1", severity: "high" },
            ].map((alarm, i, arr) => {
              const aColor = alarm.severity === "critical" ? "#FF3B3B" : "#FFB020";
              const aBg   = alarm.severity === "critical" ? "rgba(255,59,59,0.1)" : "rgba(255,176,32,0.1)";
              return (
                <Link
                  key={alarm.ref}
                  to="/alarms"
                  className="flex items-center gap-2.5 px-4 py-3 hover:bg-white/5 transition-colors"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--color-border)" : "none" }}
                >
                  <AlertTriangle size={11} style={{ color: aColor, shrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                      {alarm.desc}
                    </p>
                    <p className="text-[9px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      {alarm.ref} · {alarm.event}
                    </p>
                  </div>
                  <span
                    className="text-[9px] font-bold px-1.5 py-px rounded shrink-0"
                    style={{ backgroundColor: aBg, color: aColor }}
                  >
                    {alarm.severity}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Past accuracy (for Past events) */}
          {event.status === "past" && event.accuracy && (
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--color-text-muted)" }}
              >
                Forecast accuracy summary
              </p>
              <div className="flex items-end gap-3">
                <div>
                  <p className="text-3xl font-bold tabular-nums" style={{ color: "#2DD4BF" }}>{event.accuracy}%</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>model accuracy</p>
                </div>
                <div className="flex-1 space-y-1.5 pb-1">
                  <div>
                    <div className="flex justify-between text-[9px] mb-0.5">
                      <span style={{ color: "#FFB020" }}>Predicted</span>
                      <span style={{ color: "#FFB020" }}>{event.predictedPeak}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${event.predictedPeak}%`, backgroundColor: "#FFB020" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] mb-0.5">
                      <span style={{ color: "#2DD4BF" }}>Actual</span>
                      <span style={{ color: "#2DD4BF" }}>{event.actualPeak}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${event.actualPeak}%`, backgroundColor: "#2DD4BF" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timing */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: "var(--color-text-muted)" }}
            >
              Window
            </p>
            <div className="flex items-center gap-2">
              <Clock size={12} style={{ color: "var(--color-text-muted)" }} />
              <p className="text-[12px] font-medium" style={{ color: "var(--color-text-primary)" }}>{event.window}</p>
            </div>
            <p className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>{event.windowSub}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
