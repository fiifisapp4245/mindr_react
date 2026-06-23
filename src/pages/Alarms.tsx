import { createPortal } from "react-dom";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Filter,
  GitCompareArrows,
  Layers,
  List,
  Radio,
  RefreshCw,
  Search,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useAlarms } from "../contexts/alarms";
import {
  SEV,
  CORR_GROUPS,
  REGIONS,
  type AlarmRow,
  type AlarmSeverity,
  type AlarmStatus,
  type AlarmType,
  type MetricDescriptor,
} from "../data/alarm-store";

// ── Types ──────────────────────────────────────────────────────────────────────

type ViewMode  = "list" | "grouped";
type SevFilter   = "all" | AlarmSeverity;
type StateFilter = "all" | AlarmStatus;

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<AlarmType, React.ElementType> = {
  bgp: Radio,
  utilization: TrendingUp,
  latency: Zap,
  prediction: Bell,
  flap: RefreshCw,
  sla: AlertTriangle,
};

// 8 columns: checkbox | Alarm | ID | Severity | Affected+Region | Metric | Raised/ETA | Actions
const GRID = "32px minmax(200px,2fr) 72px 96px minmax(170px,1.8fr) minmax(130px,1.2fr) 110px 80px";

// ── Tooltip text builder (driven by MetricDescriptor) ─────────────────────────

function buildTooltip(d: MetricDescriptor): string {
  const src = d.source === "live" ? "live telemetry" : "AI forecast";
  if (d.unit === "percent") {
    const pct = Math.round((d.measured / d.threshold) * 100);
    const base = d.baseLabel ?? "capacity";
    return `${d.label} — share of ${base} in use. ${d.measured}% means ${d.measured}% of ${base}. Alarm threshold ${d.threshold}% (currently ${pct}% of limit). Source: ${src}.`;
  }
  if (d.unit === "ms") {
    const baseline = d.baselineMs ?? 0;
    const delta = Math.round(d.measured - baseline);
    const thDelta = d.thresholdDeltaMs ?? Math.max(d.threshold - baseline, 1);
    return `${d.label} — round-trip latency. ${d.measured}ms now vs ${baseline}ms baseline (+${delta}ms). Threshold +${thDelta}ms. Source: ${src}.`;
  }
  if (d.unit === "rate") {
    return `${d.label} — ${d.measured} ${d.rateLabel ?? "events"} in the last ${d.rateWindow ?? "window"}. Threshold ${d.threshold} per ${d.rateWindow ?? "window"}. Source: ${src}.`;
  }
  return "";
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SevBadge({ severity, forecast }: { severity: AlarmSeverity; forecast?: boolean }) {
  const s = SEV[severity];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        width: "fit-content",
        whiteSpace: "nowrap",
        backgroundColor: s.bg,
        color: s.color,
        fontSize: 10,
        fontWeight: 600,
        padding: "2px 7px",
        borderRadius: 4,
      }}
    >
      {s.label}
      {forecast && (
        <span style={{ fontSize: 8, opacity: 0.55, fontWeight: 400 }}>~</span>
      )}
    </span>
  );
}

function StateBadge({ status }: { status: AlarmStatus }) {
  const labels: Record<AlarmStatus, string> = {
    active: "Active", predicted: "Predicted", acknowledged: "Ack'd", snoozed: "Snoozed",
  };
  const icons: Record<AlarmStatus, React.ElementType | null> = {
    active: null, predicted: Clock, acknowledged: CheckCheck, snoozed: BellOff,
  };
  const Icon = icons[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        width: "fit-content",
        whiteSpace: "nowrap",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "var(--color-text-muted)",
        backgroundColor: "rgba(255,255,255,0.04)",
        fontSize: 9,
        fontWeight: 600,
        padding: "1px 5px",
        borderRadius: 4,
      }}
    >
      {Icon && <Icon size={8} />}
      {labels[status]}
    </span>
  );
}

// Metric cell: formatted display + normalized threshold bar + portal tooltip
function MetricCell({ alarm }: { alarm: AlarmRow }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const tipId = `metric-tip-${alarm.id}`;
  const d = alarm.metricDescriptor;

  // Compute display text and normalized bar
  let displayLine = "";
  let normalizedPct = 0;

  if (d) {
    if (d.unit === "percent") {
      displayLine = `${d.measured}% ${d.percentLabel ?? ""} · limit ${d.threshold}%`.trim();
      normalizedPct = (d.measured / d.threshold) * 100;
    } else if (d.unit === "ms") {
      const delta = Math.round(d.measured - (d.baselineMs ?? 0));
      const thDelta = d.thresholdDeltaMs ?? Math.max(d.threshold - (d.baselineMs ?? 0), 1);
      displayLine = `${d.measured}ms · +${delta}ms vs baseline`;
      normalizedPct = (delta / thDelta) * 100;
    } else if (d.unit === "rate") {
      displayLine = `${d.measured} ${d.rateLabel ?? "events"} / ${d.rateWindow} · limit ${d.threshold}`;
      normalizedPct = (d.measured / d.threshold) * 100;
    }
  } else {
    displayLine = `${alarm.metricValue}${alarm.metricUnit}`;
    normalizedPct = (alarm.metricValue / alarm.metricMax) * 100;
  }

  const barFill   = Math.min(normalizedPct, 100);
  const pctOfLim  = Math.round(normalizedPct);
  const barColor  = normalizedPct >= 100 ? "#FF3B3B" : normalizedPct >= 80 ? "#FFB020" : "#2DD4BF";
  const isForecast = d?.source === "forecast";

  function openTip() {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setPos({ top: r.top - 8, left: r.left });
    }
    setVisible(true);
  }

  return (
    <>
      <div
        ref={ref}
        tabIndex={0}
        role="button"
        aria-describedby={d ? tipId : undefined}
        className="focus:outline-none rounded"
        style={{ cursor: "default" }}
        onMouseEnter={openTip}
        onMouseLeave={() => setVisible(false)}
        onFocus={openTip}
        onBlur={() => setVisible(false)}
        onKeyDown={(e) => { if (e.key === "Escape") setVisible(false); }}
        onClick={(e) => e.stopPropagation()}
      >
        <p
          className="text-[12px] font-semibold tabular-nums leading-tight"
          style={{ color: barColor }}
        >
          {displayLine}
          {isForecast && (
            <span style={{ fontSize: 9, color: "rgba(77,158,255,0.65)", marginLeft: 3 }}>~</span>
          )}
        </p>
        {/* Normalized threshold bar */}
        <div
          className="rounded-full overflow-hidden mt-1"
          style={{ height: 3, maxWidth: 88, backgroundColor: "rgba(255,255,255,0.07)" }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${barFill}%`, backgroundColor: barColor }}
          />
        </div>
        <p className="text-[9px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {pctOfLim}% of threshold
        </p>
      </div>

      {visible && d && createPortal(
        <div
          id={tipId}
          role="tooltip"
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            transform: "translateY(-100%) translateY(-6px)",
            zIndex: 9999,
            width: 288,
            padding: "11px 13px",
            borderRadius: 8,
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
            fontSize: 11,
            lineHeight: 1.65,
            boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
            whiteSpace: "normal",
          }}
        >
          {buildTooltip(d)}
        </div>,
        document.body
      )}
    </>
  );
}

// Toast notification
function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return createPortal(
    <div
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
      style={{
        position: "fixed",
        bottom: 80,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9998,
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
        color: "var(--color-text-primary)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      <BellOff size={13} style={{ color: "#4D9EFF" }} />
      {message}
      <button
        onClick={onDismiss}
        style={{ color: "var(--color-text-muted)", marginLeft: 4 }}
        aria-label="Dismiss notification"
      >
        <X size={11} />
      </button>
    </div>,
    document.body
  );
}

// Grouped view card
function GroupCard({
  group,
  defaultExpanded = false,
}: {
  group: typeof CORR_GROUPS[0];
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const sev = SEV[group.highestSeverity];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderLeft: `3px solid ${sev.color}`,
      }}
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className="w-5 h-5 rounded flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        >
          {expanded
            ? <ChevronDown size={11} style={{ color: "var(--color-text-muted)" }} />
            : <ChevronRight size={11} style={{ color: "var(--color-text-muted)" }} />
          }
        </div>

        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {group.summary}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Correlation agent · {group.confidence}% confidence
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)" }}
          >
            {group.memberCount} alarms
          </span>
          <SevBadge severity={group.highestSeverity} />
          <span className="text-[10px] font-mono hidden sm:block" style={{ color: "var(--color-text-muted)" }}>
            {group.region}
          </span>
          {group.linkedIncident ? (
            <Link
              to={`/incidents/${group.linkedIncidentId}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[11px] font-semibold hover:opacity-80 transition-opacity"
              style={{ color: "var(--color-brand)" }}
            >
              {group.linkedIncident}
              <ExternalLink size={9} />
            </Link>
          ) : (
            <button
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] font-semibold px-2 py-0.5 rounded hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: "rgba(255,176,32,0.1)",
                color: "#FFB020",
                border: "1px solid rgba(255,176,32,0.2)",
              }}
            >
              Create incident
            </button>
          )}
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: "1px solid var(--color-border)" }}>
          {group.members.map((m, i) => {
            const msev = SEV[m.severity];
            return (
              <div
                key={m.ref}
                className="flex items-center gap-4 pl-12 pr-4 py-2.5"
                style={{
                  borderBottom: i < group.members.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
              >
                <span className="font-mono text-[10px] shrink-0" style={{ color: "var(--color-text-muted)", minWidth: 72 }}>
                  {m.ref}
                </span>
                <span className="text-xs font-medium flex-1 truncate" style={{ color: "var(--color-text-primary)" }}>
                  {m.name}
                </span>
                <span
                  className="text-[11px] tabular-nums font-semibold shrink-0"
                  style={{ color: msev.color, minWidth: 64, textAlign: "right" }}
                >
                  {m.metric}
                </span>
                <span className="text-[10px] truncate shrink-0" style={{ color: "var(--color-text-muted)", minWidth: 160, maxWidth: 200 }}>
                  {m.iface}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Alarms() {
  const navigate = useNavigate();
  const { alarms, acknowledge, snooze } = useAlarms();

  const [sevFilter,   setSevFilter]   = useState<SevFilter>("all");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [view,        setView]        = useState<ViewMode>("list");
  const [region,      setRegion]      = useState("All regions");
  const [search,      setSearch]      = useState("");
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [selectHint,  setSelectHint]  = useState("");
  const [toast,       setToast]       = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  const filtered = alarms.filter((a) => {
    if (sevFilter   !== "all" && a.severity !== sevFilter)   return false;
    if (stateFilter !== "all" && a.status   !== stateFilter) return false;
    if (region      !== "All regions" && a.region !== region) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.ref.toLowerCase().includes(q)  ||
        a.affected.toLowerCase().includes(q) ||
        a.ixp.toLowerCase().includes(q)  ||
        a.region.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    all:          alarms.length,
    critical:     alarms.filter((a) => a.severity === "critical").length,
    high:         alarms.filter((a) => a.severity === "high").length,
    medium:       alarms.filter((a) => a.severity === "medium").length,
    active:       alarms.filter((a) => a.status   === "active").length,
    predicted:    alarms.filter((a) => a.status   === "predicted").length,
    acknowledged: alarms.filter((a) => a.status   === "acknowledged").length,
    snoozed:      alarms.filter((a) => a.status   === "snoozed").length,
  };

  function toggleSelect(id: string) {
    setSelectHint("");
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      if (next.size >= 3) {
        setSelectHint("Max 3 alarms for comparison");
        return;
      }
      next.add(id);
    }
    setSelected(next);
  }

  function handleCompare() {
    navigate(`/alarms/compare?ids=${[...selected].join(",")}`);
  }

  function handleRowClick(alarm: AlarmRow) {
    navigate(`/alarms/${alarm.id}`);
  }

  return (
    <>
      {toast && (
        <Toast message={toast} onDismiss={() => setToast(null)} />
      )}

      <div
        className="flex flex-col h-full overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-base)", color: "var(--color-text-primary)" }}
      >
        {/* ── Page header ──────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
        >
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
              Alarms
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              Live feed — IP peering, ranked by severity + SLA risk
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "#2DD4BF", animation: "alarm-pulse 1.6s ease-in-out infinite" }}
            />
            <span className="text-[11px] font-semibold" style={{ color: "#2DD4BF" }}>Live · streaming</span>
            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Updated just now</span>
          </div>
        </div>

        {/* ── KPI strip ────────────────────────────────────────────────── */}
        <div
          className="grid grid-cols-3 gap-3 px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          {([
            {
              label: "Critical", sub: "requires immediate action",
              bg: "rgba(255,59,59,0.06)", border: "rgba(255,59,59,0.2)", color: "#FF3B3B",
              isActive: sevFilter === "critical",
              onClick: () => { setSevFilter(sevFilter === "critical" ? "all" : "critical"); setStateFilter("all"); },
              count: counts.critical,
            },
            {
              label: "High", sub: "monitor closely",
              bg: "rgba(255,176,32,0.06)", border: "rgba(255,176,32,0.2)", color: "#FFB020",
              isActive: sevFilter === "high",
              onClick: () => { setSevFilter(sevFilter === "high" ? "all" : "high"); setStateFilter("all"); },
              count: counts.high,
            },
            {
              label: "Predicted", sub: "AI-forecast breaches",
              bg: "rgba(77,158,255,0.06)", border: "rgba(77,158,255,0.2)", color: "#4D9EFF",
              isActive: stateFilter === "predicted",
              onClick: () => { setStateFilter(stateFilter === "predicted" ? "all" : "predicted"); setSevFilter("all"); },
              count: counts.predicted,
            },
          ]).map((card) => (
            <button
              key={card.label}
              onClick={card.onClick}
              className="flex items-center gap-4 px-4 py-3 rounded-xl text-left hover:opacity-90 transition-opacity w-full"
              style={{
                backgroundColor: card.isActive ? card.bg : "var(--color-bg-card)",
                border: `1px solid ${card.isActive ? card.border : "var(--color-border)"}`,
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: card.bg, border: `1px solid ${card.border}` }}
              >
                <AlertTriangle size={16} style={{ color: card.color }} strokeWidth={2} />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>
                    {card.count}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: card.color }}>{card.label}</span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{card.sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ── Controls row ─────────────────────────────────────────────── */}
        <div
          className="flex items-center px-6 py-0 shrink-0 gap-3"
          style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
        >
          {/* Filter tab groups */}
          <div className="flex items-center gap-0 flex-1 overflow-x-auto">

            {/* All reset */}
            <button
              onClick={() => { setSevFilter("all"); setStateFilter("all"); }}
              className="flex items-center gap-1.5 px-4 py-3 text-xs font-semibold transition-colors relative whitespace-nowrap"
              style={{
                color: sevFilter === "all" && stateFilter === "all" ? "var(--color-text-primary)" : "var(--color-text-muted)",
                borderBottom: sevFilter === "all" && stateFilter === "all" ? "2px solid var(--color-brand)" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              All
              <span
                className="text-[10px] font-bold px-1.5 py-px rounded-full tabular-nums"
                style={{
                  backgroundColor: sevFilter === "all" && stateFilter === "all" ? "rgba(226,0,116,0.12)" : "rgba(255,255,255,0.06)",
                  color: sevFilter === "all" && stateFilter === "all" ? "var(--color-brand)" : "var(--color-text-muted)",
                }}
              >
                {counts.all}
              </span>
            </button>

            {/* Severity group */}
            {([
              { key: "critical" as const, color: "#FF3B3B" },
              { key: "high"     as const, color: "#FFB020" },
              { key: "medium"   as const, color: "#D97706" },
            ]).map((tab) => {
              const isActive = sevFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => { setSevFilter(isActive ? "all" : tab.key); setStateFilter("all"); }}
                  className="flex items-center gap-1.5 px-3 py-3 text-xs font-semibold transition-colors relative whitespace-nowrap"
                  style={{
                    color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
                    borderBottom: isActive ? "2px solid var(--color-brand)" : "2px solid transparent",
                    marginBottom: -1,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tab.color }} />
                  {tab.key.charAt(0).toUpperCase() + tab.key.slice(1)}
                  <span
                    className="text-[10px] font-bold px-1.5 py-px rounded-full tabular-nums"
                    style={{
                      backgroundColor: isActive ? "rgba(226,0,116,0.12)" : "rgba(255,255,255,0.06)",
                      color: isActive ? "var(--color-brand)" : "var(--color-text-muted)",
                    }}
                  >
                    {counts[tab.key]}
                  </span>
                </button>
              );
            })}

            {/* Divider */}
            <div className="w-px mx-2 self-stretch shrink-0" style={{ backgroundColor: "var(--color-border)" }} />

            {/* State group */}
            {([
              { key: "active"       as const, label: "Active" },
              { key: "predicted"    as const, label: "Predicted" },
              { key: "acknowledged" as const, label: "Ack'd" },
            ]).map((tab) => {
              const isActive = stateFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => { setStateFilter(isActive ? "all" : tab.key); setSevFilter("all"); }}
                  className="flex items-center gap-1.5 px-3 py-3 text-xs font-semibold transition-colors relative whitespace-nowrap"
                  style={{
                    color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
                    borderBottom: isActive ? "2px solid var(--color-brand)" : "2px solid transparent",
                    marginBottom: -1,
                  }}
                >
                  {tab.label}
                  <span
                    className="text-[10px] font-bold px-1.5 py-px rounded-full tabular-nums"
                    style={{
                      backgroundColor: isActive ? "rgba(226,0,116,0.12)" : "rgba(255,255,255,0.06)",
                      color: isActive ? "var(--color-brand)" : "var(--color-text-muted)",
                    }}
                  >
                    {counts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View toggle */}
          <div
            className="flex items-center rounded-lg p-0.5 shrink-0"
            style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
          >
            {([
              { key: "list"    as const, Icon: List,   label: "List"    },
              { key: "grouped" as const, Icon: Layers, label: "Grouped" },
            ] as const).map(({ key, Icon, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors"
                style={{
                  backgroundColor: view === key ? "rgba(255,255,255,0.1)" : "transparent",
                  color: view === key ? "var(--color-text-primary)" : "var(--color-text-muted)",
                }}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>

          {/* Search + Region */}
          <div className="flex items-center gap-2 py-2 shrink-0">
            <div className="relative">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-text-muted)" }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search alarms…"
                className="pl-7 pr-3 py-1.5 rounded-lg text-xs"
                style={{
                  backgroundColor: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                  width: 160,
                  outline: "none",
                }}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }}>
                  <X size={10} />
                </button>
              )}
            </div>
            <div className="relative">
              <Filter size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-text-muted)" }} />
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="appearance-none pl-7 pr-6 py-1.5 rounded-lg text-xs cursor-pointer"
                style={{
                  backgroundColor: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                }}
              >
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown size={9} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-text-muted)" }} />
            </div>
          </div>
        </div>

        {/* ── Content area ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto relative">
          <style>{`
            @keyframes alarm-pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
          `}</style>

          {/* ── LIST VIEW ──────────────────────────────────────────── */}
          {view === "list" && (
            <div style={{ backgroundColor: "var(--color-bg-card)" }}>

              {/* Sticky table header */}
              <div
                className="grid items-center px-6 py-2.5 text-[10px] font-semibold uppercase tracking-widest sticky top-0 z-10"
                style={{
                  gridTemplateColumns: GRID,
                  borderBottom: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)",
                  backgroundColor: "var(--color-bg-card)",
                }}
              >
                <span />
                <span>Alarm</span>
                <span>ID</span>
                <span>Severity</span>
                <span>Affected</span>
                <span>Metric</span>
                <span>Raised / ETA</span>
                <span>Actions</span>
              </div>

              {/* Empty state */}
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)" }}
                  >
                    <CheckCircle2 size={22} style={{ color: "#2DD4BF" }} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>All clear</p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>No alarms match the current filters</p>
                </div>
              )}

              {/* Rows */}
              {filtered.map((alarm, i) => {
                const sev        = SEV[alarm.severity];
                const TypeIcon   = TYPE_ICON[alarm.type];
                const isSelected = selected.has(alarm.id);
                const isPredicted = alarm.status === "predicted";
                const isAcked     = alarm.status === "acknowledged";

                return (
                  <div
                    key={alarm.id}
                    className="grid items-center px-6 py-3.5 hover:bg-white/[0.025] transition-colors cursor-pointer"
                    style={{
                      gridTemplateColumns: GRID,
                      borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border)" : "none",
                      backgroundColor: isSelected ? "rgba(226,0,116,0.04)" : "transparent",
                      borderLeft: isPredicted ? "3px solid rgba(77,158,255,0.4)" : "3px solid transparent",
                    }}
                    onClick={() => handleRowClick(alarm)}
                  >
                    {/* Checkbox */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(alarm.id)}
                        className="w-3.5 h-3.5 accent-pink-500"
                      />
                    </div>

                    {/* Alarm name + type icon + state badge */}
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <TypeIcon size={12} style={{ color: sev.color }} strokeWidth={2} className="shrink-0" />
                        <p className="text-[13px] font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                          {alarm.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 ml-5">
                        <p className="text-[10px] truncate" style={{ color: "var(--color-text-muted)" }}>
                          {alarm.ixp}
                        </p>
                        <StateBadge status={alarm.status} />
                      </div>
                    </div>

                    {/* ALM ID */}
                    <span className="font-mono text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                      {alarm.ref}
                    </span>

                    {/* Severity pill — real severity only, with forecast "~" for predicted state */}
                    <SevBadge severity={alarm.severity} forecast={isPredicted} />

                    {/* Affected + Region (sub-line) */}
                    <div className="min-w-0 pr-2">
                      <p className="text-[12px] truncate" style={{ color: "var(--color-text-muted)" }}>
                        {alarm.affected}
                      </p>
                      <p className="text-[10px] font-mono mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.25)" }}>
                        {alarm.region}
                      </p>
                    </div>

                    {/* Metric — value + threshold context + normalized bar + tooltip */}
                    <MetricCell alarm={alarm} />

                    {/* Raised / ETA — countdowns live here, never in Metric */}
                    <div>
                      {isPredicted ? (
                        <>
                          <div className="flex items-center gap-1">
                            <Clock size={10} style={{ color: "#4D9EFF" }} />
                            <span className="text-[11px] font-semibold tabular-nums" style={{ color: "#4D9EFF" }}>
                              {alarm.raised}
                            </span>
                          </div>
                          {alarm.sourceLink && (
                            <Link
                              to={alarm.sourceLink.href}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-0.5 text-[10px] mt-0.5 hover:opacity-80 transition-opacity"
                              style={{ color: "rgba(77,158,255,0.75)" }}
                            >
                              {alarm.sourceLink.label}
                              <ExternalLink size={8} />
                            </Link>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                          {alarm.raised}
                        </span>
                      )}
                    </div>

                    {/* Actions — always visible icon buttons, never hover-gated */}
                    <div
                      className="flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isAcked ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCheck size={13} style={{ color: "#2DD4BF" }} />
                          <span className="text-[10px] font-mono" style={{ color: "var(--color-text-muted)" }}>
                            {alarm.acknowledgedAt ?? "Ack'd"}
                          </span>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => acknowledge(alarm.id)}
                            aria-label={`Acknowledge alarm ${alarm.ref}`}
                            title="Acknowledge"
                            className="w-7 h-7 flex items-center justify-center rounded hover:opacity-80 transition-opacity"
                            style={{
                              backgroundColor: "rgba(45,212,191,0.12)",
                              color: "#2DD4BF",
                              border: "1px solid rgba(45,212,191,0.25)",
                              flexShrink: 0,
                            }}
                          >
                            <CheckCheck size={12} />
                          </button>
                          {alarm.status !== "snoozed" ? (
                            <button
                              onClick={() => { snooze(alarm.id); showToast("Snoozed — re-notifies in 30 min"); }}
                              aria-label={`Notify me about alarm ${alarm.ref} in 30 minutes`}
                              title="Notify me in 30 min"
                              className="w-7 h-7 flex items-center justify-center rounded hover:opacity-80 transition-opacity"
                              style={{
                                backgroundColor: "rgba(255,255,255,0.06)",
                                color: "var(--color-text-muted)",
                                border: "1px solid var(--color-border)",
                                flexShrink: 0,
                              }}
                            >
                              <BellOff size={12} />
                            </button>
                          ) : (
                            <span className="text-[9px] font-mono" style={{ color: "#6B7280" }}>30m</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Footer */}
              <div
                className="flex items-center justify-between px-6 py-3"
                style={{ borderTop: "1px solid var(--color-border)" }}
              >
                <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                  Showing {filtered.length} of {alarms.length} alarms
                </p>
                <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  Data refreshes in real time — no manual reload required
                </p>
              </div>
            </div>
          )}

          {/* ── GROUPED VIEW ─────────────────────────────────────────── */}
          {view === "grouped" && (
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>
                  Correlated groups — {CORR_GROUPS.length} clusters identified
                </p>
                <div className="space-y-3">
                  {CORR_GROUPS.map((g, i) => (
                    <GroupCard key={g.id} group={g} defaultExpanded={i === 0} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-3 mt-2" style={{ color: "var(--color-text-muted)" }}>
                  Uncorrelated alarms — {alarms.length} individual signals
                </p>
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
                >
                  {alarms.map((alarm, i) => {
                    const sev = SEV[alarm.severity];
                    const TypeIcon  = TYPE_ICON[alarm.type];
                    const isPredicted = alarm.status === "predicted";

                    return (
                      <div
                        key={alarm.id}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.025] transition-colors cursor-pointer"
                        style={{
                          borderBottom: i < alarms.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                          borderLeft: `3px solid ${isPredicted ? "rgba(77,158,255,0.35)" : sev.color + "35"}`,
                        }}
                        onClick={() => handleRowClick(alarm)}
                      >
                        <TypeIcon size={13} style={{ color: sev.color }} strokeWidth={2} className="shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                            {alarm.name}
                          </p>
                          <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>
                            {alarm.affected} · {alarm.ixp}
                          </p>
                        </div>
                        <span className="font-mono text-[10px] shrink-0" style={{ color: "var(--color-text-muted)" }}>
                          {alarm.ref}
                        </span>
                        <SevBadge severity={alarm.severity} forecast={isPredicted} />
                        <StateBadge status={alarm.status} />
                        <span
                          className="text-[11px] shrink-0"
                          style={{ color: isPredicted ? "#4D9EFF" : "var(--color-text-muted)" }}
                        >
                          {alarm.raised}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Floating compare bar ──────────────────────────────────────── */}
        {selected.size > 0 && (
          <div
            className="shrink-0 flex items-center gap-4 px-6 py-3"
            style={{
              borderTop: "1px solid rgba(226,0,116,0.2)",
              backgroundColor: "rgba(226,0,116,0.06)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(226,0,116,0.15)", color: "var(--color-brand)" }}
              >
                {selected.size}
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
                alarm{selected.size > 1 ? "s" : ""} selected
              </span>
              {selectHint && (
                <span className="text-[10px]" style={{ color: "#FFB020" }}>{selectHint}</span>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => {
                  const ids = [...selected];
                  alarms.filter((a) => ids.includes(a.id)).forEach((a) => acknowledge(a.id));
                  setSelected(new Set());
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold hover:opacity-80 transition-opacity"
                style={{ backgroundColor: "rgba(45,212,191,0.1)", color: "#2DD4BF", border: "1px solid rgba(45,212,191,0.2)" }}
              >
                <CheckCheck size={11} />
                Acknowledge all
              </button>
              <button
                onClick={handleCompare}
                disabled={selected.size < 2}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-semibold hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: selected.size >= 2 ? "var(--color-brand)" : "rgba(255,255,255,0.08)",
                  color: selected.size >= 2 ? "#fff" : "var(--color-text-muted)",
                  cursor: selected.size < 2 ? "not-allowed" : "pointer",
                }}
              >
                <GitCompareArrows size={12} />
                Compare {selected.size >= 2 ? `(${selected.size})` : ""}
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="p-1 hover:opacity-60 transition-opacity"
                style={{ color: "var(--color-text-muted)" }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
