import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle2,
  ExternalLink,
  GitMerge,
  PlusCircle,
  Radio,
  RefreshCw,
  TrendingUp,
  UserPlus,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAlarms } from "../contexts/alarms";
import {
  SEV,
  STATUS,
  makeChartData,
  metricColor,
  type AlarmType,
} from "../data/alarm-store";
import { ConfirmModal } from "../components/shared/ConfirmModal";

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<AlarmType, React.ElementType> = {
  bgp: Radio,
  utilization: TrendingUp,
  latency: Zap,
  prediction: Bell,
  flap: RefreshCw,
  sla: AlertTriangle,
};

const ACTION_META: Record<string, { label: string; body: string; confirmLabel: string; confirmColor: string }> = {
  acknowledge:    {
    label: "Acknowledge Alarm",
    body: "Mark this alarm as acknowledged. It stays in the list with an Ack'd status so the team knows it's been seen.",
    confirmLabel: "Acknowledge",
    confirmColor: "#2DD4BF",
  },
  snooze:         {
    label: "Snooze 30 Minutes",
    body: "Suppress this alarm for 30 minutes. It will resume alerting after the snooze period if the condition persists.",
    confirmLabel: "Snooze",
    confirmColor: "rgba(255,255,255,0.2)",
  },
  createIncident: {
    label: "Create Incident",
    body: "Open a new FLM incident from this alarm. The alarm will be linked to the new incident and show its reference number.",
    confirmLabel: "Create Incident",
    confirmColor: "#FFB020",
  },
  addToGroup:     {
    label: "Add to Correlation Group",
    body: "Add this alarm to correlation group g1. It will be grouped with related alarms for joint investigation.",
    confirmLabel: "Add to Group",
    confirmColor: "var(--color-mitigating)",
  },
  assign:         {
    label: "Assign to Engineer",
    body: "Assign this alarm to Jamie Rodriguez. They will be notified and the alarm will show as assigned.",
    confirmLabel: "Assign",
    confirmColor: "var(--color-brand)",
  },
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function AlarmDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { alarms, acknowledge, snooze, createIncident, addToGroup, assignTo } = useAlarms();

  const alarm = alarms.find((a) => a.id === id);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  if (!alarm) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full gap-4"
        style={{ backgroundColor: "var(--color-bg-base)", color: "var(--color-text-muted)" }}
      >
        <AlertTriangle size={32} style={{ color: "#FFB020" }} />
        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Alarm not found
        </p>
        <button
          onClick={() => navigate("/alarms")}
          className="text-xs hover:opacity-80 transition-opacity"
          style={{ color: "var(--color-brand)" }}
        >
          ← Back to Alarms
        </button>
      </div>
    );
  }

  const sev = SEV[alarm.severity];
  const stat = STATUS[alarm.status];
  const TypeIcon = TYPE_ICON[alarm.type];
  const chartData = makeChartData(alarm);

  const displayIncident = alarm.linkedIncident;
  const routeIncidentId = alarm.linkedIncidentId;
  const isCreatedIncident = !!alarm.createdIncidentId;
  const hasIncident = !!displayIncident;
  const isAcknowledged = alarm.status === "acknowledged";
  const isSnoozed = alarm.status === "snoozed";

  function executeAction(action: string) {
    if (!alarm) return;
    switch (action) {
      case "acknowledge":    acknowledge(alarm.id); break;
      case "snooze":         snooze(alarm.id); break;
      case "createIncident": createIncident(alarm.id); break;
      case "addToGroup":     addToGroup(alarm.id, "g1"); break;
      case "assign":         assignTo(alarm.id, "Jamie Rodriguez"); break;
    }
    setPendingAction(null);
  }

  const actions = [
    {
      key: "acknowledge",
      label: isAcknowledged ? "Acknowledged" : "Acknowledge",
      Icon: CheckCheck,
      bg: "rgba(45,212,191,0.1)", color: "#2DD4BF", border: "rgba(45,212,191,0.2)",
      disabled: isAcknowledged,
    },
    {
      key: "snooze",
      label: isSnoozed ? `Snoozed ${alarm.snoozeUntil ?? "30m"}` : "Snooze 30m",
      Icon: BellOff,
      bg: "rgba(255,255,255,0.05)", color: "var(--color-text-muted)", border: "var(--color-border)",
      disabled: isSnoozed,
    },
    {
      key: "createIncident",
      label: hasIncident ? `→ ${displayIncident}` : "Create Incident",
      Icon: PlusCircle,
      bg: "rgba(255,176,32,0.1)", color: "#FFB020", border: "rgba(255,176,32,0.2)",
      disabled: hasIncident,
    },
    {
      key: "addToGroup",
      label: alarm.addedToGroupId ? `In group ${alarm.addedToGroupId}` : "Add to Group",
      Icon: GitMerge,
      bg: "rgba(255,255,255,0.07)", color: "var(--color-text-primary)", border: "var(--color-border)",
      disabled: !!alarm.addedToGroupId,
    },
    {
      key: "assign",
      label: alarm.assignedTo ? `Assigned: ${alarm.assignedTo}` : "Assign to Engineer",
      Icon: UserPlus,
      bg: "rgba(255,255,255,0.05)", color: "var(--color-text-muted)", border: "var(--color-border)",
      disabled: !!alarm.assignedTo,
    },
  ];

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-base)", color: "var(--color-text-primary)" }}
    >
      {/* Breadcrumb header */}
      <div
        className="flex items-center gap-3 px-6 py-3.5 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
      >
        <button
          onClick={() => navigate("/alarms")}
          className="flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity shrink-0"
          style={{ color: "var(--color-text-muted)" }}
        >
          <ArrowLeft size={13} />
          Alarms
        </button>
        <span style={{ color: "var(--color-border)" }}>/</span>
        <span className="font-mono text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>
          {alarm.ref}
        </span>
        <span className="text-xs font-semibold flex-1 truncate" style={{ color: "var(--color-text-primary)" }}>
          {alarm.name}
        </span>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold shrink-0"
          style={{ backgroundColor: sev.bg, color: sev.color }}
        >
          {sev.label}
        </span>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold shrink-0"
          style={{ backgroundColor: stat.bg, color: stat.color }}
        >
          {stat.label}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Description */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <p className="text-[9px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: "var(--color-text-muted)" }}>
              Description
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
              {alarm.description}
            </p>
          </div>

          {/* Metadata grid */}
          <div
            className="rounded-xl p-4 grid grid-cols-3 gap-x-6 gap-y-3"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            {[
              { label: "Affected",  value: alarm.affected },
              { label: "Interface", value: alarm.iface ?? "—" },
              { label: "IXP",       value: alarm.ixp },
              { label: "Region",    value: alarm.region },
              { label: alarm.isETA ? "ETA" : "Raised", value: alarm.raised },
              { label: "Type",      value: alarm.type.charAt(0).toUpperCase() + alarm.type.slice(1) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] font-semibold uppercase tracking-widest mb-0.5"
                  style={{ color: "var(--color-text-muted)" }}>
                  {label}
                </p>
                <p className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Metric sparkline */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--color-text-muted)" }}>
                {alarm.type === "sla" ? "SLA time remaining" : alarm.metric} — last 55 min
              </p>
              <div className="flex items-center gap-3">
                <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  Threshold: {alarm.threshold}{alarm.metricUnit}
                </span>
                <span
                  className="text-base font-bold tabular-nums"
                  style={{ color: metricColor(alarm.metricValue, alarm.metricMax) }}
                >
                  {alarm.metricValue}{alarm.metricUnit}
                </span>
              </div>
            </div>
            <div style={{ height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="t"
                    tick={{ fontSize: 9, fill: "rgba(255,255,255,0.28)" }}
                    interval={2}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "rgba(255,255,255,0.28)" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, alarm.metricMax]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1f28",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 6,
                      fontSize: 11,
                      color: "#f0f2f5",
                    }}
                    formatter={(v: number) => [`${v}${alarm.metricUnit}`, alarm.metric]}
                  />
                  {alarm.threshold > 0 && (
                    <ReferenceLine
                      y={alarm.threshold}
                      stroke="#FF3B3B"
                      strokeDasharray="4 2"
                      strokeOpacity={0.65}
                      label={{ value: "threshold", position: "insideTopRight", fill: "rgba(255,59,59,0.6)", fontSize: 8 }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={metricColor(alarm.metricValue, alarm.metricMax)}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Predicted source banner */}
          {alarm.sourceLink && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{ backgroundColor: "rgba(77,158,255,0.08)", border: "1px solid rgba(77,158,255,0.2)" }}
            >
              <Bell size={12} style={{ color: "#4D9EFF" }} />
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Forecast source:</span>
              <Link
                to={alarm.sourceLink.href}
                className="text-xs font-semibold hover:opacity-80 transition-opacity flex items-center gap-1"
                style={{ color: "#4D9EFF" }}
              >
                {alarm.sourceLink.label}
                <ExternalLink size={10} />
              </Link>
            </div>
          )}

          {/* Correlation */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <p className="text-[9px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: "var(--color-text-muted)" }}>
              Correlation
            </p>
            {hasIncident ? (
              <div className="space-y-1.5">
                <p className="text-xs" style={{ color: "var(--color-text-primary)" }}>
                  {isCreatedIncident ? "Incident created from this alarm" : "Part of active incident cluster"}
                </p>
                <Link
                  to={`/incidents/${routeIncidentId}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold hover:opacity-80 transition-opacity"
                  style={{ color: "var(--color-brand)" }}
                >
                  <ExternalLink size={10} />
                  {displayIncident}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle2 size={12} style={{ color: "#2DD4BF" }} />
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  No correlated alarm cluster detected
                </p>
              </div>
            )}
            {alarm.addedToGroupId && (
              <div className="mt-2 flex items-center gap-2">
                <GitMerge size={12} style={{ color: "#4D9EFF" }} />
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Added to group {alarm.addedToGroupId}
                </p>
              </div>
            )}
            {alarm.assignedTo && (
              <div className="mt-2 flex items-center gap-2">
                <UserPlus size={12} style={{ color: "#2DD4BF" }} />
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Assigned to {alarm.assignedTo}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right pane */}
        <div
          className="w-[400px] shrink-0 flex flex-col"
          style={{ borderLeft: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
        >
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            {/* Alarm identity */}
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-widest mb-2.5"
                style={{ color: "var(--color-text-muted)" }}>
                Alarm
              </p>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${sev.color}18`, border: `1px solid ${sev.color}35` }}
                >
                  <TypeIcon size={13} style={{ color: sev.color }} strokeWidth={2} />
                </div>
                <span className="font-mono text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  {alarm.ref}
                </span>
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
                  style={{ backgroundColor: sev.bg, color: sev.color }}
                >
                  {sev.label}
                </span>
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
                  style={{ backgroundColor: stat.bg, color: stat.color }}
                >
                  {stat.label}
                </span>
              </div>
              <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                {alarm.isETA ? "ETA" : "Raised"}: <span style={{ color: "var(--color-text-primary)" }}>{alarm.raised}</span>
              </p>
              {alarm.snoozeUntil && (
                <p className="text-[10px] mt-1" style={{ color: "#6B7280" }}>
                  Snoozed for {alarm.snoozeUntil}
                </p>
              )}
            </div>

            <div style={{ borderTop: "1px solid var(--color-border)" }} />

            {/* Actions */}
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-widest mb-2.5"
                style={{ color: "var(--color-text-muted)" }}>
                Actions
              </p>
              <div className="space-y-2">
                {actions.map(({ key, label, Icon, bg, color, border, disabled }) => (
                  <button
                    key={key}
                    onClick={() => !disabled && setPendingAction(key)}
                    disabled={disabled}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-opacity"
                    style={{
                      backgroundColor: bg,
                      color,
                      border: `1px solid ${border}`,
                      opacity: disabled ? 0.4 : 1,
                      cursor: disabled ? "not-allowed" : "pointer",
                    }}
                  >
                    <Icon size={11} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Centered confirmation modal (portal, z-50) ─────────────────────── */}
      {pendingAction && ACTION_META[pendingAction] && (
        <ConfirmModal
          title={ACTION_META[pendingAction].label}
          body={ACTION_META[pendingAction].body}
          confirmLabel={ACTION_META[pendingAction].confirmLabel}
          confirmColor={ACTION_META[pendingAction].confirmColor}
          onConfirm={() => executeAction(pendingAction)}
          onClose={() => setPendingAction(null)}
        />
      )}
    </div>
  );
}
