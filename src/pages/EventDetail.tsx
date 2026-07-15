import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  ChevronRight,
  MessageSquare,
  Network,
  Server,
  ThumbsUp,
  X,
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
import { ALERTS, ALERT_SEV } from "../data/alert-store";
import { EVENTS_FULL } from "../data/events";
import type { EventFull, EventStatus } from "../data/events";
import { Breadcrumb } from "../components/shared/Breadcrumb";
import { ConfirmModal } from "../components/shared/ConfirmModal";
import { Toast, TOAST_DURATION_MS } from "../components/shared/Toast";
import { Badge } from "@/components/ui/badge";

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
  if (type === "ixp")    return Radio;
  if (type === "router") return Server;
  return Network;
}

// CDN operator name derived from the event's own path data (e.g. "EdgeCDN-EU"),
// used in the Notify CDN confirm dialog and success toast.
function cdnNameOf(event: EventFull): string {
  const cdnNode = event.affectedPath.find((p) => p.type === "cdn");
  return cdnNode ? cdnNode.label.replace(/ egress$/i, "") : "the CDN operator";
}

// Short "DD Mon" date extracted from windowUTC (e.g. "02 May 18:00–23:00 UTC" → "02 May").
function shortDate(event: EventFull): string {
  return event.windowUTC.split(" ").slice(0, 2).join(" ");
}

// Mocked action: in the real system this sends an outage/surge notification
// email to the CDN operator's on-call contact. No real email is dispatched
// here — this only simulates the send so the confirm → toast flow is wired
// end-to-end ahead of the real integration.
function mockNotifyCdn(_event: EventFull): void {
  // no-op — real send would POST to the CDN notification API here
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
        </div>
      )}

      {/* Past accuracy summary */}
      {isPast && event.accuracy && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3 text-xs"
          style={{ backgroundColor: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)", color: "#2DD4BF" }}
        >
          <span>Forecast accuracy: <strong>{event.accuracy}%</strong></span>
          <span style={{ color: "#94a3b8" }}>·</span>
          <span style={{ color: "#94a3b8" }}>Predicted {event.predictedPeak}% · Actual {event.actualPeak}%</span>
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={event.chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
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
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8, color: "#94a3b8" }} iconType="plainline" iconSize={16} />

          {event.overloadStart && event.overloadEnd && (
            <ReferenceArea
              x1={event.overloadStart}
              x2={event.overloadEnd}
              fill="rgba(255,59,59,0.08)"
              stroke="rgba(255,59,59,0.2)"
              strokeWidth={1}
            />
          )}

          <ReferenceLine
            y={85}
            stroke="#FF3B3B"
            strokeDasharray="5 4"
            strokeWidth={1.5}
            label={{ value: "85% cap", position: "insideTopRight", fontSize: 10, fill: "#FF3B3B", dy: -4 }}
          />

          <Line type="monotone" dataKey="base" name="Base load" stroke="#4D9EFF" strokeWidth={1.5} dot={false} strokeDasharray="4 3" strokeOpacity={0.7} />
          <Line type="monotone" dataKey="predicted" name={isPast ? "Predicted" : "Forecast (event spike)"} stroke="#FFB020" strokeWidth={2} dot={false} />
          {showActual && (
            <Line type="monotone" dataKey="actual" name="Actual" stroke="#2DD4BF" strokeWidth={2} dot={false} connectNulls={false} />
          )}
        </ComposedChart>
      </ResponsiveContainer>

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
              style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", minWidth: 120 }}
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

// ── Tab bar ───────────────────────────────────────────────────────────────────
// Same visual language as AlertDetail's tab bar.

type TabKey = "evidence" | "rca" | "remediation" | "feedback";

const TABS: { key: TabKey; label: string }[] = [
  { key: "evidence",    label: "Evidence" },
  { key: "rca",         label: "Root Cause Analysis" },
  { key: "remediation", label: "Remediation" },
  { key: "feedback",    label: "Feedback" },
];

function EventTabBar({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <div className="flex items-center gap-6" style={{ borderBottom: "1px solid var(--color-border)" }}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="pb-3 text-[13px] font-semibold transition-colors relative"
            style={{ color: isActive ? "var(--color-brand)" : "var(--color-text-muted)" }}
          >
            {tab.label}
            {isActive && (
              <span className="absolute left-0 right-0 rounded-full" style={{ bottom: -1, height: 2, backgroundColor: "var(--color-brand)" }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Shared card primitive ─────────────────────────────────────────────────────

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
        {title}
      </p>
      {sub && (
        <p className="text-[11px] mt-0.5 mb-3" style={{ color: "var(--color-text-muted)" }}>{sub}</p>
      )}
      <div className={sub ? "" : "mt-3"}>{children}</div>
    </div>
  );
}

// ── Evidence tab — the forecast and its basis ─────────────────────────────────

function EvidenceTab({ event }: { event: EventFull }) {
  return (
    <div className="space-y-4">
      <Card title="Event metadata">
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
      </Card>

      <Card title="Affected scope — traffic path">
        <PathStrip nodes={event.affectedPath} />
      </Card>

      <div className="rounded-xl p-5" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
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
        </div>
        <ForecastChart event={event} />
      </div>
    </div>
  );
}

// ── Root Cause Analysis tab — why this event threatens the network ───────────

function RcaTab({ event }: { event: EventFull }) {
  return (
    <div className="space-y-4">
      <Card title="MINDR analysis" sub={`${event.confidence}% confidence forecast`}>
        <p className="text-[12px] leading-relaxed" style={{ color: "var(--color-text-primary)" }}>{event.rcaSummary}</p>
      </Card>

      <Card title="Planned changes in window">
        {event.plannedChanges.length > 0 && (
          <div className="space-y-2 mb-2">
            {event.plannedChanges.map((chg) => (
              <div
                key={chg.ref}
                className="flex items-start gap-2.5 p-2.5 rounded-lg"
                style={{ backgroundColor: "rgba(255,176,32,0.06)", border: "1px solid rgba(255,176,32,0.2)" }}
              >
                <AlertTriangle size={12} className="mt-0.5 shrink-0" style={{ color: "#FFB020" }} />
                <div>
                  <p className="text-[11px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    {chg.ref} — {chg.description}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#FFB020" }}>Overlap risk · {chg.window}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{chg.overlapNote}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-center" style={{ color: "var(--color-text-muted)" }}>
          No other changes scheduled in window
        </p>
      </Card>

      <Card title="Similar past events" sub="Learning loop — forecast model trained on these">
        {event.similarEventIds.length === 0 ? (
          <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>No similar past events on record.</p>
        ) : (
          <div className="space-y-2">
            {event.similarEventIds.map((id) => {
              const past = EVENTS_FULL.find((e) => e.id === id);
              if (!past) return null;
              return (
                <Link
                  key={id}
                  to={`/events/${past.id}`}
                  className="block rounded-lg px-3 py-2.5 hover:bg-white/5 transition-colors"
                  style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{past.name}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{shortDate(past)}</p>
                    </div>
                    <ChevronRight size={11} style={{ color: "var(--color-text-muted)", marginTop: 2, flexShrink: 0 }} />
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                      P: <span style={{ color: "#FFB020" }}>{past.predictedPeak}%</span>
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                      A: <span style={{ color: "#2DD4BF" }}>{past.actualPeak ?? "—"}%</span>
                    </div>
                    <div className="ml-auto text-[10px] font-semibold px-1.5 py-px rounded" style={{ backgroundColor: "rgba(45,212,191,0.1)", color: "#2DD4BF" }}>
                      {past.accuracy ?? "—"}% acc
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="Related alarms — past occurrences">
        {event.relatedAlarms.length === 0 ? (
          <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>No related alarms on record.</p>
        ) : (
          <div className="space-y-2">
            {event.relatedAlarms.map((entry) => {
              const alert = ALERTS.find((a) => a.id === entry.alertId);
              const detail = alert?.sources.caemCasm.alarmDetails.find((d) => d.ref === entry.ref);
              if (!alert || !detail) return null;
              const cfg = ALERT_SEV[detail.severity];
              return (
                <Link
                  key={entry.ref}
                  to={`/alerts/${alert.id}`}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-white/5 transition-colors"
                  style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
                >
                  <AlertTriangle size={11} style={{ color: cfg.color, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{detail.message}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{entry.ref} · {entry.eventLabel}</p>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-px rounded shrink-0" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                    {detail.severity}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Remediation tab — how to prepare ──────────────────────────────────────────

function RemediationTab({ event, notifyCdnSent, onNotifyCdn }: {
  event: EventFull;
  notifyCdnSent: boolean;
  onNotifyCdn: () => void;
}) {
  const rows = [
    { tag: "Capacity", tagColor: "#4D9EFF", label: "Pre-provision capacity on parallel path" },
    { tag: "Routing",  tagColor: "#FFB020", label: `Pre-stage policy-based reroute on ${event.affectedScope.match(/AS\d+/)?.[0] ?? "peering"} peering interface` },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-5" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
            Recommended actions
          </p>
          <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "var(--color-text-muted)" }}>
            <BookOpen size={11} />
            Matched playbook: Pre-event capacity prep
          </span>
        </div>
        <div className="space-y-2">
          {rows.map((action, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
              style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
            >
              <Badge className="text-[9px] font-bold px-1.5 py-px shrink-0" style={{ backgroundColor: `${action.tagColor}18`, color: action.tagColor }}>
                {action.tag}
              </Badge>
              <span className="text-[12px]" style={{ color: "var(--color-text-primary)" }}>{action.label}</span>
              <Badge className="ml-auto text-[9px] font-semibold shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)" }}>
                Open
              </Badge>
            </div>
          ))}

          {/* Coordination — shares state/action with the header's Notify CDN button */}
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
          >
            <Badge className="text-[9px] font-bold px-1.5 py-px shrink-0" style={{ backgroundColor: "rgba(45,212,191,0.10)", color: "#2DD4BF" }}>
              Coordination
            </Badge>
            <span className="text-[12px]" style={{ color: "var(--color-text-primary)" }}>
              Notify CDN for load-balancing (raise CASM ticket)
            </span>
            {notifyCdnSent ? (
              <Badge className="ml-auto text-[9px] font-semibold shrink-0" style={{ backgroundColor: "rgba(45,212,191,0.12)", color: "#2DD4BF" }}>
                Notified
              </Badge>
            ) : (
              <button
                onClick={onNotifyCdn}
                className="ml-auto flex items-center gap-1 text-[10px] font-semibold shrink-0 hover:opacity-80"
                style={{ color: "var(--color-brand)" }}
              >
                Notify CDN
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Feedback tab — was the forecast right (learning loop) ─────────────────────

function FeedbackTab() {
  const [validation, setValidation] = useState<"confirmed" | "adjusted" | "dismissed" | null>(null);
  const [validationNote, setValidationNote] = useState("");

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "var(--color-text-muted)" }}>
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

      {validation === "adjusted" && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={validationNote}
            onChange={(e) => setValidationNote(e.target.value)}
            placeholder="Describe the adjustment (e.g. peak may be 10% lower based on CDN pre-warming plan)…"
            className="flex-1 rounded-lg px-3 py-2 text-xs"
            style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", outline: "none" }}
          />
          <button className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}>
            Submit
          </button>
        </div>
      )}

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
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const event = EVENTS_FULL.find((e) => e.id === id);

  const [activeTab, setActiveTab] = useState<TabKey>("evidence");
  const [confirmingNotify, setConfirmingNotify] = useState(false);
  const [notifyCdnSent, setNotifyCdnSent] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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

  const status = statusCfg(event.status);
  const severity = severityCfg(event.severity);
  const cdnName = cdnNameOf(event);

  function handleNotifyConfirm() {
    mockNotifyCdn(event!);
    setNotifyCdnSent(true);
    setConfirmingNotify(false);
    setToastMsg(`Notification sent to ${cdnName}`);
    setTimeout(() => setToastMsg(null), TOAST_DURATION_MS);
  }

  return (
    <div className="space-y-5 pb-8 mx-auto" style={{ maxWidth: "78%", minWidth: 0 }}>

      {/* ── Breadcrumb ───────────────────────────────────────────────────────── */}
      <Breadcrumb
        items={[
          { label: "Events", href: "/events" },
          { label: event.id, badge: { text: event.id, color: "var(--color-text-muted)", bg: "rgba(255,255,255,0.06)" } },
          { label: event.name },
        ]}
      />

      {/* ── Header card (persistent across tabs) ─────────────────────────────── */}
      <div className="rounded-xl p-5" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {event.status === "live" && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "#2DD4BF" }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "#2DD4BF" }} />
            </span>
          )}
          <Badge className="text-[10px] font-bold uppercase tracking-wide" style={{ backgroundColor: status.bg, color: status.color }}>
            {status.label}
          </Badge>
          <Badge className="text-[10px] font-bold uppercase tracking-wide" style={{ backgroundColor: severity.bg, color: severity.color }}>
            {event.severity}
          </Badge>
          <span className="text-[10px] font-mono" style={{ color: "var(--color-text-muted)" }}>
            {event.id}
          </span>
          <Badge className="text-[10px] font-semibold ml-auto" style={{ backgroundColor: "rgba(77,158,255,0.1)", color: "#4D9EFF" }}>
            {event.confidence}% confidence
          </Badge>
        </div>

        <h1 className="text-xl font-bold leading-tight mb-4" style={{ color: "var(--color-text-primary)" }}>
          {event.name}
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {[
            { label: "Type",                 value: event.type },
            { label: "Window",                value: event.windowUTC },
            { label: "Scope",                 value: event.affectedScope, mono: true },
            { label: "Predicted peak load",   value: `${event.predictedPeak}%`, color: event.predictedPeak >= 85 ? "#FF3B3B" : event.predictedPeak >= 70 ? "#FFB020" : "#2DD4BF" },
          ].map(({ label, value, color, mono }) => (
            <div key={label}>
              <p className="text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>
                {label}
              </p>
              <p className={`text-sm font-bold leading-tight ${mono ? "font-mono text-[11px]" : ""}`} style={{ color: color ?? "var(--color-text-primary)" }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        <div
          className="flex items-center justify-between gap-3 flex-wrap pt-3"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>{event.windowSub}</p>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate(`/assistant?context=event:${event.id}`)}
              className="text-[12px] font-semibold px-4 py-2 rounded-lg transition-colors hover:bg-white/5"
              style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
            >
              Discuss with MINDR
            </button>
            <button
              onClick={() => !notifyCdnSent && setConfirmingNotify(true)}
              disabled={notifyCdnSent}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--color-brand)", color: "#fff", opacity: notifyCdnSent ? 0.6 : 1 }}
            >
              <Bell size={12} />
              {notifyCdnSent ? "Notification Sent" : "Notify CDN"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <EventTabBar active={activeTab} onChange={setActiveTab} />

      <div>
        {activeTab === "evidence"    && <EvidenceTab event={event} />}
        {activeTab === "rca"         && <RcaTab event={event} />}
        {activeTab === "remediation" && (
          <RemediationTab event={event} notifyCdnSent={notifyCdnSent} onNotifyCdn={() => !notifyCdnSent && setConfirmingNotify(true)} />
        )}
        {activeTab === "feedback"    && <FeedbackTab />}
      </div>

      {/* Notify CDN confirmation */}
      {confirmingNotify && (
        <ConfirmModal
          title="Notify CDN"
          body={`Send outage/surge notification to ${cdnName}?`}
          confirmLabel="Send notification"
          confirmColor="var(--color-brand)"
          onConfirm={handleNotifyConfirm}
          onClose={() => setConfirmingNotify(false)}
        />
      )}

      {/* Success toast */}
      {toastMsg && <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />}
    </div>
  );
}
