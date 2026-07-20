import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  Wifi,
} from "lucide-react";
import { EVENTS_FULL, eventPredictedPeak, eventActualPeak, eventScopeSummary } from "../data/events";
import type { EventStatus, EventSeverity } from "../data/events";
import { Badge } from "@/components/ui/badge";

// ── Color helpers ────────────────────────────────────────────────────────────

function peakColor(pct: number) {
  if (pct >= 90) return "#FF3B3B";
  if (pct >= 70) return "#FFB020";
  if (pct >= 50) return "#eab308";
  return "#2DD4BF";
}

const SEVERITY_CFG: Record<EventSeverity, { bg: string; text: string }> = {
  critical: { bg: "rgba(255,59,59,0.12)",  text: "#FF3B3B" },
  high:     { bg: "rgba(255,176,32,0.12)", text: "#FFB020" },
  medium:   { bg: "rgba(234,179,8,0.12)",  text: "#eab308" },
  low:      { bg: "rgba(45,212,191,0.12)", text: "#2DD4BF" },
};

function StatusBadge({ status }: { status: EventStatus }) {
  if (status === "live") {
    return (
      <Badge
        className="gap-1.5 text-[10px] font-bold uppercase tracking-wide"
        style={{ backgroundColor: "rgba(45,212,191,0.15)", color: "#2DD4BF" }}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: "#2DD4BF" }}
          />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: "#2DD4BF" }} />
        </span>
        Live
      </Badge>
    );
  }
  if (status === "past") {
    return (
      <Badge
        className="text-[10px] font-semibold uppercase tracking-wide"
        style={{ backgroundColor: "rgba(148,163,184,0.12)", color: "#94a3b8" }}
      >
        Past
      </Badge>
    );
  }
  return (
    <Badge
      className="text-[10px] font-semibold uppercase tracking-wide"
      style={{ backgroundColor: "rgba(77,158,255,0.12)", color: "#4D9EFF" }}
    >
      Upcoming
    </Badge>
  );
}

// ── Timeline positions (day-based) ───────────────────────────────────────────
// dayOffset is relative to today. 0 = today, 27 = day 28.
// We only show upcoming (0–27) events on the timeline.

const WEEKS = [
  { label: "Week 1", sublabel: "Jun 9–15" },
  { label: "Week 2", sublabel: "Jun 16–22" },
  { label: "Week 3", sublabel: "Jun 23–29" },
  { label: "Week 4", sublabel: "Jun 30–Jul 6" },
];

type FilterTab = "upcoming" | "live" | "historic";

// Deep-link query params are read once on mount (?status=live&severity=high),
// case-insensitively, so cards/links elsewhere in the app can pre-apply a filter.
function parseStatusParam(v: string | null): FilterTab {
  if (v?.toLowerCase() === "live") return "live";
  if (v?.toLowerCase() === "past" || v?.toLowerCase() === "historic") return "historic";
  return "upcoming";
}

function parseSeverityParam(v: string | null): string {
  const valid = ["critical", "high", "medium", "low"];
  const lower = v?.toLowerCase() ?? "";
  return valid.includes(lower) ? lower : "all";
}

export default function Events() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<FilterTab>(() => parseStatusParam(searchParams.get("status")));
  const [typeFilter, setTypeFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState<string>(() => parseSeverityParam(searchParams.get("severity")));

  const timelineEvents = EVENTS_FULL.filter(
    (e) => e.dayOffset >= 0 && e.dayOffset <= 27
  );

  const filtered = EVENTS_FULL.filter((e) => {
    if (activeTab === "upcoming" && e.status !== "upcoming") return false;
    if (activeTab === "live" && e.status !== "live") return false;
    if (activeTab === "historic" && e.status !== "past") return false;
    if (riskFilter !== "all" && e.severity !== riskFilter) return false;
    if (typeFilter !== "all" && e.typeKey !== typeFilter) return false;
    return true;
  });

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-base)", color: "var(--color-text-primary)" }}
    >
      {/* Page header */}
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Events
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          Upcoming mass events — forecast impact on IP peering, up to 4 weeks ahead
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pb-6">

        {/* 4-week timeline */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <Calendar size={13} style={{ color: "var(--color-text-muted)" }} />
            <span
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-text-muted)" }}
            >
              4-week forecast timeline
            </span>
            <span
              className="ml-auto text-[10px] font-medium px-2 py-px rounded"
              style={{ backgroundColor: "rgba(77,158,255,0.1)", color: "#4D9EFF" }}
            >
              Today: Jun 12
            </span>
          </div>

          {/* Week headers */}
          <div className="grid grid-cols-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
            {WEEKS.map((w, i) => (
              <div
                key={w.label}
                className="px-3 py-2"
                style={{ borderRight: i < 3 ? "1px solid var(--color-border)" : "none" }}
              >
                <div className="text-[11px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {w.label}
                </div>
                <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  {w.sublabel}
                </div>
              </div>
            ))}
          </div>

          {/* Event bars + "now" marker */}
          <div className="relative p-3" style={{ minHeight: 128 }}>
            {/* "Now" line */}
            <div
              className="absolute top-0 bottom-0"
              style={{
                left: "calc(3/28 * 100% + 12px)",
                width: 1,
                backgroundColor: "rgba(77,158,255,0.5)",
                zIndex: 2,
              }}
            >
              <span
                className="absolute top-1 left-1 text-[9px] font-semibold px-1 rounded"
                style={{ backgroundColor: "rgba(77,158,255,0.15)", color: "#4D9EFF", whiteSpace: "nowrap" }}
              >
                now
              </span>
            </div>

            {/* Event markers */}
            {timelineEvents.map((evt, idx) => {
              const startFrac = evt.dayOffset / 28;
              const widthFrac = (evt.weekSpan * 7) / 28;
              const peak = eventPredictedPeak(evt);
              const color = evt.status === "live" ? "#2DD4BF" : peakColor(peak);
              const row = idx % 3;
              return (
                <button
                  key={evt.id}
                  onClick={() => navigate(`/events/${evt.id}`)}
                  className="absolute rounded px-2 py-1 text-[11px] font-medium truncate text-left transition-opacity hover:opacity-80"
                  style={{
                    left: `calc(${startFrac * 100}% + 4px)`,
                    width: `calc(${widthFrac * 100}% - 8px)`,
                    minWidth: 80,
                    backgroundColor: `${color}20`,
                    border: `1px solid ${color}55`,
                    color: color,
                    top: `${row * 36 + 24}px`,
                    zIndex: 1,
                  }}
                >
                  <span className="font-bold">
                    {evt.status === "live" ? `↑${eventActualPeak(evt)}%` : `${peak}%`}
                  </span>{" "}
                  {evt.shortName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Tab filters */}
          <div
            className="flex rounded-lg overflow-hidden shrink-0"
            style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
          >
            {(["upcoming", "live", "historic"] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-3 py-1.5 text-xs font-semibold capitalize transition-colors"
                style={{
                  backgroundColor: activeTab === tab ? "var(--color-brand)" : "transparent",
                  color: activeTab === tab ? "#fff" : "var(--color-text-muted)",
                }}
              >
                {tab === "historic" ? "Historic" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Type dropdown */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
              style={{
                backgroundColor: "var(--color-bg-card)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            >
              <option value="all">All types</option>
              <option value="game-release">Game release</option>
              <option value="streaming-event">Streaming event</option>
              <option value="software-update">Software update</option>
              <option value="live-sports">Live sports</option>
              <option value="commerce">Commerce</option>
            </select>
            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-text-muted)" }} />
          </div>

          {/* Risk dropdown */}
          <div className="relative">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
              style={{
                backgroundColor: "var(--color-bg-card)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            >
              <option value="all">All risk</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-text-muted)" }} />
          </div>

          <span className="ml-auto text-[11px]" style={{ color: "var(--color-text-muted)" }}>
            {filtered.length} event{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Events table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          {/* Sticky header */}
          <div
            className="grid text-[10px] font-semibold uppercase tracking-widest px-4 py-2.5 sticky top-0"
            style={{
              gridTemplateColumns: "minmax(160px,2fr) 1.1fr minmax(140px,1.4fr) minmax(180px,2fr) 80px 76px 70px 80px",
              color: "var(--color-text-muted)",
              borderBottom: "1px solid var(--color-border)",
              backgroundColor: "var(--color-bg-card)",
              zIndex: 1,
            }}
          >
            <span>Event</span>
            <span>Type</span>
            <span>Window</span>
            <span>Affected scope</span>
            <span>Peak</span>
            <span>Conf.</span>
            <span>Status</span>
            <span>Severity</span>
          </div>

          {/* Rows */}
          {filtered.map((evt, i) => {
            const sev = SEVERITY_CFG[evt.severity];
            const TypeIcon = evt.typeIcon;
            const peak = eventPredictedPeak(evt);
            const actualPeak = eventActualPeak(evt);
            const isOverload = peak >= 85;
            return (
              <button
                key={evt.id}
                onClick={() => navigate(`/events/${evt.id}`)}
                className="grid items-center w-full px-4 py-3 text-left hover:bg-white/5 transition-colors"
                style={{
                  gridTemplateColumns: "minmax(160px,2fr) 1.1fr minmax(140px,1.4fr) minmax(180px,2fr) 80px 76px 70px 80px",
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border)" : "none",
                }}
              >
                {/* Event name + ID */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      {evt.name}
                    </span>
                    {evt.status === "live" && (
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span
                          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                          style={{ backgroundColor: "#2DD4BF" }}
                        />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: "#2DD4BF" }} />
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {evt.id}
                  </div>
                </div>

                {/* Type */}
                <div className="flex items-center gap-1.5">
                  <TypeIcon size={11} style={{ color: "var(--color-text-muted)" }} />
                  <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                    {evt.type}
                  </span>
                </div>

                {/* Window */}
                <div>
                  <div className="text-[12px]" style={{ color: "var(--color-text-primary)" }}>{evt.window}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{evt.windowSub}</div>
                </div>

                {/* Affected scope */}
                <div className="flex items-start gap-1.5">
                  <Wifi size={11} className="mt-0.5 shrink-0" style={{ color: "var(--color-text-muted)" }} />
                  <span className="text-[12px] leading-snug" style={{ color: "var(--color-text-muted)" }}>
                    {eventScopeSummary(evt)}
                  </span>
                </div>

                {/* Peak % */}
                <div>
                  <div className="flex items-center gap-1">
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: evt.status === "live" ? "#2DD4BF" : peakColor(peak) }}
                    >
                      {evt.status === "live" && actualPeak ? `${actualPeak}%` : `${peak}%`}
                    </span>
                    {isOverload && evt.status !== "past" && (
                      <AlertTriangle size={10} style={{ color: "#FF3B3B" }} />
                    )}
                  </div>
                  {evt.status === "live" && (
                    <div className="text-[9px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      pred {peak}%
                    </div>
                  )}
                  {evt.status === "past" && actualPeak && (
                    <div className="text-[9px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      act {actualPeak}%
                    </div>
                  )}
                  {evt.status === "upcoming" && (
                    <div className="h-1 rounded-full overflow-hidden mt-1" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${peak}%`, backgroundColor: peakColor(peak) }}
                      />
                    </div>
                  )}
                </div>

                {/* Confidence */}
                <div>
                  <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--color-text-primary)" }}>
                    {evt.confidence}%
                  </span>
                  {evt.accuracy && (
                    <div className="text-[9px] mt-0.5" style={{ color: "#2DD4BF" }}>
                      {evt.accuracy}% acc
                    </div>
                  )}
                </div>

                {/* Status */}
                <StatusBadge status={evt.status} />

                {/* Severity */}
                <div>
                  <Badge
                    className="px-1.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ backgroundColor: sev.bg, color: sev.text }}
                  >
                    {evt.severity}
                  </Badge>
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertTriangle size={24} className="mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  No events match the current filters
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
