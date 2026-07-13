import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  Clock,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import {
  ALERTS,
  ALERT_KPIS,
  ALERT_SEV,
  ALERT_STATUS,
  hasChangeTicket,
  type Alert,
  type AlertSeverity,
  type AlertStatus,
} from "../data/alert-store";
import { Badge } from "../components/ui/badge";

// ── Types ─────────────────────────────────────────────────────────────────────

type SevFilter    = "all" | AlertSeverity;
type StatusFilter = "all" | AlertStatus;
type TicketFilter = "all" | "with" | "without";

const SEVERITIES: AlertSeverity[] = ["critical", "high", "medium", "low"];
const STATUSES:   AlertStatus[]   = ["active", "predicted", "mitigating", "resolved"];

// Deep-link query params are read once on mount (?severity=high&status=active&changeTicket=true),
// case-insensitively, so cards/links elsewhere in the app can pre-apply a filter.
function parseSevParam(v: string | null): SevFilter {
  const lower = v?.toLowerCase() ?? "";
  return (SEVERITIES as string[]).includes(lower) ? (lower as AlertSeverity) : "all";
}

function parseStatusParam(v: string | null): StatusFilter {
  const lower = v?.toLowerCase() ?? "";
  return (STATUSES as string[]).includes(lower) ? (lower as AlertStatus) : "all";
}

function parseTicketParam(v: string | null): TicketFilter {
  return v?.toLowerCase() === "true" ? "with" : "all";
}

// ── Sub-components ────────────────────────────────────────────────────────────

const SEV_VARIANT: Record<AlertSeverity, "destructive" | "warning" | "info" | "success"> = {
  critical: "destructive",
  high:     "warning",
  medium:   "info",
  low:      "success",
};

const STATUS_VARIANT: Record<AlertStatus, "destructive" | "warning" | "info" | "success"> = {
  active:     "destructive",
  predicted:  "warning",
  mitigating: "info",
  resolved:   "success",
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

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 90 ? "#2DD4BF" : value >= 75 ? "#FFB020" : "#4D9EFF";
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ width: 48, backgroundColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] tabular-nums font-medium" style={{ color }}>
        {value}%
      </span>
    </div>
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

      {/* Severity */}
      <td className="px-4 py-3">
        <SevBadge severity={alert.severity} />
      </td>

      {/* Confidence */}
      <td className="px-4 py-3">
        <ConfidenceBar value={alert.confidence} />
      </td>

      {/* Impact */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-sm tabular-nums" style={{ color: "var(--color-text-primary)" }}>
          {alert.impact.baseline} → {alert.impact.peak}{" "}
          <span style={{ color: "var(--color-text-muted)" }}>{alert.impact.unit}</span>
        </span>
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

      {/* ETA / Age */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-medium" style={{ color: "var(--color-text-primary)" }}>
            {alert.eta}
          </span>
          <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
            {alert.age} ago
          </span>
        </div>
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Alerts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sevFilter,    setSevFilter]    = useState<SevFilter>(() => parseSevParam(searchParams.get("severity")));
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => parseStatusParam(searchParams.get("status")));
  const [ticketFilter, setTicketFilter] = useState<TicketFilter>(() => parseTicketParam(searchParams.get("changeTicket")));

  const filtered = ALERTS.filter((a) => {
    if (sevFilter    !== "all" && a.severity !== sevFilter)    return false;
    if (statusFilter !== "all" && a.status   !== statusFilter) return false;
    if (ticketFilter === "with" && !hasChangeTicket(a))        return false;
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
          label="Active Alerts"
          value={ALERT_KPIS.total}
          sub="across IP Peering estate"
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
          sub="critical or high — active"
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
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest mr-1" style={{ color: "var(--color-text-muted)" }}>
            Severity
          </span>
          {(["all", "critical", "high", "medium", "low"] as SevFilter[]).map((s) => {
            const active = sevFilter === s;
            const color  = s === "all" ? "var(--color-text-muted)" : ALERT_SEV[s].color;
            return (
              <button
                key={s}
                onClick={() => setSevFilter(s)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors capitalize"
                style={{
                  backgroundColor: active ? (s === "all" ? "rgba(255,255,255,0.08)" : ALERT_SEV[s as AlertSeverity]?.bg ?? "rgba(255,255,255,0.08)") : "transparent",
                  color: active ? (s === "all" ? "var(--color-text-primary)" : color) : "var(--color-text-muted)",
                  border: active ? `1px solid ${s === "all" ? "var(--color-border)" : color}` : "1px solid transparent",
                }}
              >
                {s === "all" ? "All" : s}
                <span className="text-[10px] opacity-70">
                  ({sevCounts[s]})
                </span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px h-5 shrink-0" style={{ backgroundColor: "var(--color-border)" }} />

        {/* Status filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest mr-1" style={{ color: "var(--color-text-muted)" }}>
            Status
          </span>
          {(["all", "active", "predicted", "mitigating"] as (StatusFilter)[]).map((s) => {
            const active = statusFilter === s;
            const cfg    = s !== "all" ? ALERT_STATUS[s as AlertStatus] : null;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s as StatusFilter)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors capitalize"
                style={{
                  backgroundColor: active ? (cfg ? cfg.bg : "rgba(255,255,255,0.08)") : "transparent",
                  color: active ? (cfg ? cfg.color : "var(--color-text-primary)") : "var(--color-text-muted)",
                  border: active ? `1px solid ${cfg ? cfg.color : "var(--color-border)"}` : "1px solid transparent",
                }}
              >
                {s === "all" ? "All" : s}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px h-5 shrink-0" style={{ backgroundColor: "var(--color-border)" }} />

        {/* Change ticket filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest mr-1" style={{ color: "var(--color-text-muted)" }}>
            Change Ticket
          </span>
          {([
            { key: "all",  label: "All" },
            { key: "with", label: "With Ticket" },
          ] as { key: TicketFilter; label: string }[]).map(({ key, label }) => {
            const active = ticketFilter === key;
            return (
              <button
                key={key}
                onClick={() => setTicketFilter(key)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                style={{
                  backgroundColor: active ? "rgba(255,255,255,0.08)" : "transparent",
                  color: active ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  border: active ? "1px solid var(--color-border)" : "1px solid transparent",
                }}
              >
                {label}
              </button>
            );
          })}
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
              {["Alert", "Severity", "Confidence", "Impact", "Affected", "Linked", "ETA / Age", "Status", ""].map((h) => (
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
                <td colSpan={9} className="px-4 py-12 text-center">
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
