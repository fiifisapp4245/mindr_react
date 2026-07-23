import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  ChevronRight,
  Clock,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  ALERTS,
  ALERT_KPIS,
  ALERT_SEV,
  ALERT_STATUS,
  PREDICTED_BADGE,
  hasChangeTicket,
  getAlertsByAS,
  type Alert,
  type AlertSeverity,
  type AlertStatus,
} from "../data/alert-store";
import { Badge } from "../components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";

// ── Types ─────────────────────────────────────────────────────────────────────

type SevFilter    = "all" | AlertSeverity;
type StatusFilter = "all" | AlertStatus;
type TicketFilter = "all" | "with" | "without";
type AsFilter     = "all" | string;

const SEVERITIES: AlertSeverity[] = ["critical", "high", "medium", "low"];
const STATUSES:   AlertStatus[]   = ["open", "acted-upon", "resolved", "closed"];

// Same query that backs the "Alerts by Handover AS" dashboard chart, so a bar's
// height always equals this page's filtered row count for that AS.
const ALERTS_BY_AS = getAlertsByAS(ALERTS);
const KNOWN_AS = new Set(ALERTS_BY_AS.map(a => a.as));

// Deep-link query params are read once on mount (?severity=high&status=open&predicted=true&changeTicket=true&affectedAS=AS6453),
// case-insensitively, so cards/links elsewhere in the app can pre-apply a filter.
function parseSevParam(v: string | null): SevFilter {
  const lower = v?.toLowerCase() ?? "";
  return (SEVERITIES as string[]).includes(lower) ? (lower as AlertSeverity) : "all";
}

function parseStatusParam(v: string | null): StatusFilter {
  const lower = v?.toLowerCase() ?? "";
  return (STATUSES as string[]).includes(lower) ? (lower as AlertStatus) : "all";
}

// Predicted is a separate TYPE filter, not a status value — its own boolean param.
function parsePredictedParam(v: string | null): boolean {
  return v?.toLowerCase() === "true";
}

function parseTicketParam(v: string | null): TicketFilter {
  return v?.toLowerCase() === "true" ? "with" : "all";
}

function parseAsParam(v: string | null): AsFilter {
  const upper = v?.toUpperCase() ?? "";
  return KNOWN_AS.has(upper) ? upper : "all";
}

// ── Sub-components ────────────────────────────────────────────────────────────

const SEV_VARIANT: Record<AlertSeverity, "destructive" | "warning" | "info" | "success"> = {
  critical: "destructive",
  high:     "warning",
  medium:   "info",
  low:      "success",
};

const STATUS_VARIANT: Record<AlertStatus, "destructive" | "warning" | "info" | "success" | "secondary"> = {
  open:         "destructive",
  "acted-upon": "info",
  resolved:     "success",
  closed:       "secondary",
};

function SevBadge({ severity }: { severity: AlertSeverity }) {
  const cfg = ALERT_SEV[severity];
  return (
    <Badge
      variant={SEV_VARIANT[severity]}
      className="font-bold uppercase tracking-wide whitespace-nowrap"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: AlertStatus }) {
  const cfg = ALERT_STATUS[status];
  return (
    <Badge
      variant={STATUS_VARIANT[status]}
      className="gap-1 uppercase tracking-wide whitespace-nowrap"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </Badge>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

function KpiCard({ label, value, sub, icon: Icon, color, bg }: KpiCardProps) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
          {label}
        </p>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg }}>
          <Icon size={13} style={{ color }} strokeWidth={2.2} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold leading-none" style={{ color }}>
          {value}
        </p>
        {sub && (
          <p className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Table row ─────────────────────────────────────────────────────────────────

function AlertRow({ alert, onClick }: { alert: Alert; onClick: () => void }) {
  return (
    <tr
      onClick={onClick}
      className="cursor-pointer transition-colors hover:bg-white/[0.03] group"
      style={{ borderBottom: "1px solid var(--color-border)" }}
    >
      {/* Alert title / ID */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span
            className="text-[11px] font-mono"
            style={{ color: "var(--color-text-muted)" }}
          >
            {alert.id}
          </span>
          <span
            className="text-sm font-medium leading-snug group-hover:opacity-90 transition-opacity"
            style={{ color: "var(--color-text-primary)" }}
          >
            {alert.title}
          </span>
        </div>
      </td>

      {/* Affected */}
      <td className="px-4 py-3">
        <span className="text-[12px] font-mono" style={{ color: "var(--color-text-muted)" }}>
          {alert.affected}
        </span>
      </td>

      {/* Linked */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
          {alert.linkedAlarms} alarms · {alert.linkedTickets} tickets
        </span>
      </td>

      {/* Severity */}
      <td className="px-4 py-3">
        <SevBadge severity={alert.severity} />
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge status={alert.status} />
      </td>

      {/* Chevron */}
      <td className="px-3 py-3">
        <ChevronRight
          size={14}
          className="opacity-0 group-hover:opacity-60 transition-opacity"
          style={{ color: "var(--color-text-muted)" }}
        />
      </td>
    </tr>
  );
}

// ── Generic filter dropdown — condenses a small fixed-option filter (Severity,
// Status, Type, Change Ticket) into the same Popover-button pattern as the
// Handover AS dropdown below, instead of a pill row. Clearable via the "All"
// row or the inline × button. ─────────────────────────────────────────────────

function FilterDropdown<V extends string>({ label, value, allValue, allLabel, options, onChange }: {
  label: string;
  value: V;
  allValue: V;
  allLabel: string;
  options: { value: V; label: string; color?: string }[];
  onChange: (v: V) => void;
}) {
  const [open, setOpen] = useState(false);
  const isActive = value !== allValue;
  const selected = options.find((o) => o.value === value);
  const activeColor = selected?.color ?? "var(--color-brand)";

  function select(v: V) {
    onChange(v);
    setOpen(false);
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </span>
      <div className="flex items-center gap-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
              style={{
                backgroundColor: isActive ? `${activeColor}20` : "transparent",
                color: isActive ? activeColor : "var(--color-text-muted)",
                border: `1px solid ${isActive ? activeColor : "var(--color-border)"}`,
              }}
            >
              {selected ? selected.label : allLabel}
              <ChevronDown size={11} style={{ opacity: 0.7 }} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1.5">
            <div className="space-y-0.5">
              <button
                onClick={() => select(allValue)}
                className="w-full flex items-center px-2 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors hover:bg-white/5"
                style={{ color: value === allValue ? "var(--color-brand)" : "var(--color-text-primary)" }}
              >
                {allLabel}
              </button>
              {options.map((o) => (
                <button
                  key={o.value}
                  onClick={() => select(o.value)}
                  className="w-full flex items-center px-2 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors hover:bg-white/5"
                  style={{ color: value === o.value ? (o.color ?? "var(--color-brand)") : "var(--color-text-primary)" }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        {isActive && (
          <button
            onClick={() => select(allValue)}
            className="p-1 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: "var(--color-text-muted)" }}
            aria-label={`Clear ${label} filter`}
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Handover AS dropdown — searchable/scrollable, since there can be 50s–100s
// of AS values (a plain pill row doesn't scale). Clearable via the "All AS"
// row or the inline × button. ─────────────────────────────────────────────────

function HandoverAsDropdown({ value, onChange, options }: {
  value: AsFilter;
  onChange: (v: AsFilter) => void;
  options: { as: string; count: number }[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const isActive = value !== "all";
  const filteredOptions = options.filter((o) => o.as.toLowerCase().includes(query.toLowerCase()));

  function select(as: AsFilter) {
    onChange(as);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold font-mono transition-colors"
            style={{
              backgroundColor: isActive ? "rgba(233,24,124,0.12)" : "transparent",
              color: isActive ? "var(--color-brand)" : "var(--color-text-muted)",
              border: `1px solid ${isActive ? "var(--color-brand)" : "var(--color-border)"}`,
            }}
          >
            {value === "all" ? "All AS" : value}
            <ChevronDown size={11} style={{ opacity: 0.7 }} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search AS…"
            autoFocus
            className="w-full mb-2 rounded-lg px-2.5 py-1.5 text-xs"
            style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", outline: "none" }}
          />
          <div className="max-h-56 overflow-y-auto space-y-0.5">
            <button
              onClick={() => select("all")}
              className="w-full flex items-center px-2 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors hover:bg-white/5"
              style={{ color: value === "all" ? "var(--color-brand)" : "var(--color-text-primary)" }}
            >
              All AS
            </button>
            {filteredOptions.map(({ as, count }) => (
              <button
                key={as}
                onClick={() => select(as)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-mono font-semibold text-left transition-colors hover:bg-white/5"
                style={{ color: value === as ? "var(--color-brand)" : "var(--color-text-primary)" }}
              >
                {as}
                <span className="text-[10px] font-sans opacity-70">{count}</span>
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <p className="text-[11px] text-center py-3" style={{ color: "var(--color-text-muted)" }}>
                No matching AS
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {isActive && (
        <button
          onClick={() => select("all")}
          className="p-1 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: "var(--color-text-muted)" }}
          aria-label="Clear Handover AS filter"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Alerts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sevFilter,      setSevFilter]      = useState<SevFilter>(() => parseSevParam(searchParams.get("severity")));
  const [statusFilter,   setStatusFilter]   = useState<StatusFilter>(() => parseStatusParam(searchParams.get("status")));
  const [predictedOnly,  setPredictedOnly]  = useState<boolean>(() => parsePredictedParam(searchParams.get("predicted")));
  const [ticketFilter,   setTicketFilter]   = useState<TicketFilter>(() => parseTicketParam(searchParams.get("changeTicket")));
  const [asFilter,       setAsFilter]       = useState<AsFilter>(() => parseAsParam(searchParams.get("affectedAS")));

  const filtered = ALERTS.filter((a) => {
    if (sevFilter    !== "all" && a.severity   !== sevFilter)    return false;
    if (statusFilter !== "all" && a.status     !== statusFilter) return false;
    if (predictedOnly && !a.isPredicted)                         return false;
    if (ticketFilter === "with" && !hasChangeTicket(a))          return false;
    if (asFilter     !== "all" && a.affectedAS !== asFilter)     return false;
    return true;
  });

  const sevCounts: Record<SevFilter, number> = {
    all:      ALERTS.length,
    critical: ALERTS.filter(a => a.severity === "critical").length,
    high:     ALERTS.filter(a => a.severity === "high").length,
    medium:   ALERTS.filter(a => a.severity === "medium").length,
    low:      ALERTS.filter(a => a.severity === "low").length,
  };

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Alerts
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          Unified anomaly feed — Anodot-detected signals linking alarms, tickets, and RCA
        </p>
      </div>

      {/* ── KPI cards ───────────────────────────────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        <KpiCard
          label="Open Alerts"
          value={ALERT_KPIS.open}
          sub="reactive, currently open"
          icon={Bell}
          color="#FF3B3B"
          bg="rgba(255,59,59,0.12)"
        />
        <KpiCard
          label="Critical"
          value={ALERT_KPIS.critical}
          sub="requiring immediate action"
          icon={AlertTriangle}
          color="#FF3B3B"
          bg="rgba(255,59,59,0.12)"
        />
        <KpiCard
          label="Predicted / Forecast"
          value={ALERT_KPIS.predicted}
          sub="breach forecast active"
          icon={TrendingUp}
          color="#FFB020"
          bg="rgba(255,176,32,0.12)"
        />
        <KpiCard
          label="Avg Confidence"
          value={`${ALERT_KPIS.avgConfidence}%`}
          sub="across all open alerts"
          icon={Zap}
          color="#2DD4BF"
          bg="rgba(45,212,191,0.12)"
        />
        <KpiCard
          label="Needs Operator Review"
          value={ALERT_KPIS.needsReview}
          sub="critical or high — open"
          icon={Users}
          color="#4D9EFF"
          bg="rgba(77,158,255,0.12)"
        />
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-6 flex-wrap"
        style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
      >
        {/* Severity filter */}
        <FilterDropdown
          label="Severity"
          value={sevFilter}
          allValue="all"
          allLabel={`All (${sevCounts.all})`}
          onChange={setSevFilter}
          options={SEVERITIES.map((s) => ({ value: s, label: `${ALERT_SEV[s].label} (${sevCounts[s]})`, color: ALERT_SEV[s].color }))}
        />

        {/* Divider */}
        <div className="w-px h-5 shrink-0" style={{ backgroundColor: "var(--color-border)" }} />

        {/* Status filter */}
        <FilterDropdown
          label="Status"
          value={statusFilter}
          allValue="all"
          allLabel="All"
          onChange={setStatusFilter}
          options={STATUSES.map((s) => ({ value: s, label: ALERT_STATUS[s].label, color: ALERT_STATUS[s].color }))}
        />

        {/* Divider */}
        <div className="w-px h-5 shrink-0" style={{ backgroundColor: "var(--color-border)" }} />

        {/* Predicted filter — a separate TYPE flag, not a status chip. Filtering
            Predicted works independently of whatever Status is selected. */}
        <FilterDropdown
          label="Type"
          value={predictedOnly ? "predicted" : "all"}
          allValue="all"
          allLabel="All"
          onChange={(v) => setPredictedOnly(v === "predicted")}
          options={[{ value: "predicted", label: `Predicted (${ALERT_KPIS.predicted})`, color: PREDICTED_BADGE.color }]}
        />

        {/* Divider */}
        <div className="w-px h-5 shrink-0" style={{ backgroundColor: "var(--color-border)" }} />

        {/* Change ticket filter */}
        <FilterDropdown
          label="Change Ticket"
          value={ticketFilter}
          allValue="all"
          allLabel="All"
          onChange={setTicketFilter}
          options={[{ value: "with", label: "With Ticket" }]}
        />

        {/* Divider */}
        <div className="w-px h-5 shrink-0" style={{ backgroundColor: "var(--color-border)" }} />

        {/* Handover AS filter — searchable/scrollable dropdown (50s–100s of AS
            possible), reusing the same affectedAS param the dashboard's
            "Alerts by Handover AS" chart drill-down navigates to. */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest mr-1" style={{ color: "var(--color-text-muted)" }}>
            Handover AS
          </span>
          <HandoverAsDropdown value={asFilter} onChange={setAsFilter} options={ALERTS_BY_AS} />
        </div>

        {/* Result count */}
        <div className="ml-auto">
          <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
            {filtered.length} alert{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              {["Alert", "Affected", "Linked", "Severity", "Status", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Bell size={24} style={{ color: "var(--color-text-muted)", opacity: 0.4 }} />
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      No alerts match the current filters
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  onClick={() => navigate(`/alerts/${alert.id}`)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer context ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
        <Clock size={11} />
        <span>Last refreshed just now · Reactive flow only — predictive/Events feed is separate</span>
      </div>
    </div>
  );
}
