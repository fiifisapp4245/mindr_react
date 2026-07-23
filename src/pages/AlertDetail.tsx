import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, Lock, Network, Radio, Server, Star,
} from "lucide-react";
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ReferenceArea, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  ALERTS, ALERT_SEV, ALERT_STATUS, confirmAction, isConfirmed, getTakenAt,
  alertInterfacesWorstFirst, alertPeakUtilization,
  FEEDBACK_QUESTIONS, FEEDBACK_SCALE_HELP, setFeedbackRating, getFeedbackRating,
  setFeedbackComment, getFeedbackComment,
  type Alert, type AlertAction, type AlarmRecord, type TicketRecord, type BuildoutFlag, type FeedbackQuestionKey,
  type AlertInterface, type PathNode, type SeriesPoint, type SnmpPort,
} from "../data/alert-store";
import { Breadcrumb } from "../components/shared/Breadcrumb";
import { ConfirmModal } from "../components/shared/ConfirmModal";
import { DetailModal } from "../components/shared/DetailModal";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

// ── Design helpers ────────────────────────────────────────────────────────────

const BUILDOUT_COLOR: Record<BuildoutFlag, string> = {
  CRITICAL: "#FF3B3B",
  SOON:     "#FFB020",
  OK:       "#2DD4BF",
};
const BUILDOUT_BG: Record<BuildoutFlag, string> = {
  CRITICAL: "rgba(255,59,59,0.12)",
  SOON:     "rgba(255,176,32,0.12)",
  OK:       "rgba(45,212,191,0.12)",
};

const RISK_COLOR: Record<string, string> = {
  LOW:    "#2DD4BF",
  MEDIUM: "#FFB020",
  HIGH:   "#FF3B3B",
};
const RISK_BG: Record<string, string> = {
  LOW:    "rgba(45,212,191,0.12)",
  MEDIUM: "rgba(255,176,32,0.12)",
  HIGH:   "rgba(255,59,59,0.12)",
};

type BadgeVariant = "destructive" | "warning" | "info" | "success" | "secondary";

const BUILDOUT_VARIANT: Record<BuildoutFlag, BadgeVariant> = {
  CRITICAL: "destructive",
  SOON:     "warning",
  OK:       "success",
};

const RISK_VARIANT: Record<string, BadgeVariant> = {
  LOW:    "success",
  MEDIUM: "warning",
  HIGH:   "destructive",
};

const SEV_VARIANT: Record<string, BadgeVariant> = {
  critical: "destructive",
  high:     "warning",
  medium:   "info",
  low:      "success",
};

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  open:         "destructive",
  "acted-upon": "info",
  resolved:     "success",
  closed:       "secondary",
};

function formatTakenAt(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function pathNodeIcon(type: PathNode["type"]) {
  if (type === "cdn")    return Network;
  if (type === "ixp")    return Radio;
  if (type === "router") return Server;
  return Network;
}

// ── Affected path strip — identical component to the Event detail page's,
// reused here so multi-router path chains render the same way in both places. ─

function PathStrip({ nodes }: { nodes: PathNode[] }) {
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

// ── Interface utilization chart — same summary-list + stacked-full-size-chart
// pattern as the Event detail page's Evidence tab, adapted for OBSERVED (not
// forecast) data: base load (dotted), current utilization (solid), 85% cap
// line + overload shading, and a combined line + concurrent-alert callout
// only where another alert overlaps this interface. ──────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs space-y-1"
      style={{ backgroundColor: "#1E1E2A", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
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

function computeOverloadWindow(series: SeriesPoint[], threshold = 85): { start: string; end: string } | null {
  const over = series.filter((p) => p.value >= threshold);
  if (over.length === 0) return null;
  return { start: over[0].time, end: over[over.length - 1].time };
}

function buildInterfaceChartData(iface: AlertInterface) {
  const hasOverlap = iface.overlappingAlerts.length > 0;
  return iface.baseLoad.map((basePt, i) => ({
    time: basePt.time,
    base: basePt.value,
    current: iface.currentUtilization[i]?.value,
    combined: hasOverlap ? iface.combinedUtilization[i]?.value : undefined,
  }));
}

function AlertInterfaceChart({ iface }: { iface: AlertInterface }) {
  const [expanded, setExpanded] = useState(true);
  const hasOverlap = iface.overlappingAlerts.length > 0;
  const referenceSeries = hasOverlap ? iface.combinedUtilization : iface.currentUtilization;
  const overloadWindow = computeOverloadWindow(referenceSeries);
  const chartData = buildInterfaceChartData(iface);
  const seriesMax = Math.max(100, ...referenceSeries.map((p) => p.value), ...iface.baseLoad.map((p) => p.value));
  const yMax = Math.ceil((seriesMax * 1.08) / 5) * 5;
  const peakColor = iface.peakUtilization >= 85 ? "#FF3B3B" : iface.peakUtilization >= 70 ? "#FFB020" : "#2DD4BF";

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
      <button onClick={() => setExpanded((e) => !e)} className="flex items-start justify-between gap-2 w-full text-left" style={{ marginBottom: expanded ? 12 : 0 }}>
        <div className="flex items-start gap-2 min-w-0">
          <ChevronRight
            size={14}
            className="shrink-0 mt-0.5 transition-transform"
            style={{ color: "var(--color-text-muted)", transform: expanded ? "rotate(90deg)" : "none" }}
          />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{iface.name}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {hasOverlap ? "Combined" : "Current"} peak{" "}
              <span className="font-bold" style={{ color: peakColor }}>{iface.peakUtilization}%</span>
              {hasOverlap && (
                <span style={{ color: "#FF3B3B" }}> · {iface.overlappingAlerts.length} concurrent alert{iface.overlappingAlerts.length !== 1 ? "s" : ""}</span>
              )}
            </p>
          </div>
        </div>
        {overloadWindow && (
          <Badge className="text-[9px] font-bold uppercase shrink-0" style={{ backgroundColor: "rgba(255,59,59,0.12)", color: "#FF3B3B" }}>
            Overload
          </Badge>
        )}
      </button>

      {expanded && (
        <>
          {hasOverlap && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg mb-3 text-[11px]"
              style={{ backgroundColor: "rgba(255,59,59,0.06)", border: "1px solid rgba(255,59,59,0.2)", color: "#FF3B3B" }}
            >
              <AlertTriangle size={11} className="shrink-0" />
              {iface.overlappingAlerts.length} concurrent alert{iface.overlappingAlerts.length !== 1 ? "s" : ""} stacking on this interface
            </div>
          )}

          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#5c5c7a" }} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} tickLine={false} />
              <YAxis domain={[0, yMax]} tick={{ fontSize: 11, fill: "#5c5c7a" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={40} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8, color: "#94a3b8" }} iconType="plainline" iconSize={16} />

              {overloadWindow && (
                <ReferenceArea x1={overloadWindow.start} x2={overloadWindow.end} fill="rgba(255,59,59,0.08)" stroke="rgba(255,59,59,0.2)" strokeWidth={1} />
              )}
              <ReferenceLine y={85} stroke="#FF3B3B" strokeDasharray="5 4" strokeWidth={1.5} label={{ value: "85% cap", position: "insideTopRight", fontSize: 10, fill: "#FF3B3B", dy: -4 }} />

              <Line type="monotone" dataKey="base" name="Base load" stroke="#4D9EFF" strokeWidth={1.5} dot={false} strokeDasharray="4 3" strokeOpacity={0.7} />
              <Line type="monotone" dataKey="current" name="Current utilization" stroke="#FFB020" strokeWidth={2} dot={false} />
              {hasOverlap && (
                <Line type="monotone" dataKey="combined" name="Combined (concurrent alerts)" stroke="#FF3B3B" strokeWidth={2.4} strokeDasharray="2 2" dot={false} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

// ── List drill-down modal (Alarms / Tickets) ──────────────────────────────────
// Trimmed to the minimum vendor data can actually support: vendor alarm
// severity/type cannot be shown, so Alarms keep only ID/Description/Time; the
// Tickets popup keeps only a description of the routing change and its time.

function AlarmListModal({ alarms, onClose }: { alarms: AlarmRecord[]; onClose: () => void }) {
  return (
    <DetailModal title={`Linked alarms (${alarms.length})`} onClose={onClose} maxWidth={512}>
      {alarms.map(a => (
        <div key={a.ref} className="rounded-lg p-3" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)" }}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <Badge variant="warning" className="font-mono" style={{ backgroundColor: "rgba(255,176,32,0.10)", color: "#FFB020" }}>{a.ref}</Badge>
            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{a.raised}</span>
          </div>
          <p className="text-[12px] leading-snug" style={{ color: "var(--color-text-primary)" }}>{a.message}</p>
        </div>
      ))}
    </DetailModal>
  );
}

function TicketListModal({ tickets, onClose }: { tickets: TicketRecord[]; onClose: () => void }) {
  return (
    <DetailModal title={`Linked tickets (${tickets.length})`} onClose={onClose} maxWidth={512}>
      {tickets.map((t, i) => (
        <div key={i} className="rounded-lg p-3" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)" }}>
          <p className="text-[12px] leading-snug mb-1" style={{ color: "var(--color-text-primary)" }}>{t.description}</p>
          <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{t.raised}</span>
        </div>
      ))}
    </DetailModal>
  );
}

// ── Tab bar ────────────────────────────────────────────────────────────────────

type TabKey = "evidence" | "rca" | "remediation" | "feedback";

const TABS: { key: TabKey; label: string }[] = [
  { key: "evidence",    label: "Evidence" },
  { key: "rca",         label: "Root Cause Analysis" },
  { key: "remediation", label: "Remediation" },
  { key: "feedback",    label: "Feedback" },
];

function AlertTabBar({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <div className="flex items-center gap-6" style={{ borderBottom: "1px solid var(--color-border)" }}>
      {TABS.map(tab => {
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
              <span
                className="absolute left-0 right-0 rounded-full"
                style={{ bottom: -1, height: 2, backgroundColor: "var(--color-brand)" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Shared card primitives ────────────────────────────────────────────────────

function EvidenceCard({ number, title, children }: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
      <div className="flex items-center gap-2.5 mb-3">
        <span
          className="text-[11px] font-bold w-5 h-5 rounded flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
        >
          {number}
        </span>
        <span className="text-[13px] font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function StatBlock({ label, value, color, badge }: {
  label: string;
  value: React.ReactNode;
  color?: string;
  badge?: boolean;
}) {
  return (
    <div className="rounded-lg p-2.5" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)" }}>
      <p className="text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </p>
      {badge ? (
        <Badge
          variant="success"
          className="font-bold"
          style={{ color: color ?? "#2DD4BF", backgroundColor: `${color ?? "#2DD4BF"}22` }}
        >
          {value}
        </Badge>
      ) : (
        <p className="text-sm font-bold" style={{ color: color ?? "var(--color-text-primary)" }}>{value}</p>
      )}
    </div>
  );
}

// ── Anodot widget — restructured: a "Critical" tab (absorbing the escalation
// narrative that used to live in the now-removed Network Load Monitor widget),
// the 4 KPIs (handover AS / anomaly score / router / IXP) always visible in a
// bottom grid regardless of tab, and severity shown ONLY as a corner tag —
// never as loose inline text. ─────────────────────────────────────────────────

function AnodotWidget({ alert }: { alert: Alert }) {
  const { anodot, networkLoadMonitor } = alert.sources;
  const [tab, setTab] = useState<"overview" | "critical">("overview");
  const sev = ALERT_SEV[alert.severity];

  return (
    <div className="rounded-xl p-4 relative" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
      <Badge
        variant={SEV_VARIANT[alert.severity]}
        className="absolute top-4 right-4 font-bold uppercase tracking-wide"
        style={{ color: sev.color, backgroundColor: sev.bg }}
      >
        {sev.label}
      </Badge>

      <div className="flex items-center gap-2.5 mb-3 pr-20">
        <span
          className="text-[11px] font-bold w-5 h-5 rounded flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
        >
          1
        </span>
        <span className="text-[13px] font-semibold" style={{ color: "var(--color-text-primary)" }}>Anodot — Alert Trigger</span>
      </div>

      <div className="flex items-center gap-4 mb-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
        {(["overview", "critical"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="pb-2 text-[12px] font-semibold transition-colors"
            style={{
              color: tab === t ? "var(--color-brand)" : "var(--color-text-muted)",
              borderBottom: tab === t ? "2px solid var(--color-brand)" : "2px solid transparent",
            }}
          >
            {t === "overview" ? "Overview" : "Critical"}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <p className="text-[12px] leading-relaxed mb-3" style={{ color: "var(--color-text-muted)" }}>
          Anomaly detected on {anodot.router} ({anodot.ixp}) — handover {anodot.handoverAS}.
        </p>
      ) : (
        <p className="text-[12px] leading-relaxed mb-3" style={{ color: "var(--color-text-muted)" }}>
          {networkLoadMonitor.reason} Current {networkLoadMonitor.currentGbps} Gbps vs {networkLoadMonitor.thresholdGbps} Gbps threshold.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatBlock label="Handover AS" value={anodot.handoverAS} />
        <StatBlock label="Anomaly Score" value={anodot.score} color="#FF3B3B" />
        <StatBlock label="Router" value={anodot.router} />
        <StatBlock label="IXP" value={anodot.ixp} />
      </div>
    </div>
  );
}

// ── SNMP widget — restructured for 3-4 ports with a select-to-drill-down
// dropdown (instead of scrolling through every port's row); shows only
// Utilization %, Capacity, and Router for the selected port. Threshold is a
// fixed 90% default baked into the color logic, never displayed. ────────────

function SnmpWidget({ ports }: { ports: SnmpPort[] }) {
  const [selected, setSelected] = useState(ports[0].port);
  const port = ports.find(p => p.port === selected) ?? ports[0];
  const color = port.utilization >= 90 ? "#FF3B3B" : port.utilization >= 80 ? "#FFB020" : "#2DD4BF";

  return (
    <EvidenceCard number="3" title="SNMP — Port Utilization">
      <div className="mb-3">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ports.map(p => (
              <SelectItem key={p.port} value={p.port}>
                <span className="font-mono">{p.port}</span> — {p.utilization}%
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        <StatBlock label="Utilization" value={`${port.utilization}%`} color={color} />
        <StatBlock label="Capacity" value={port.capacity} />
        <StatBlock label="Router" value={port.router} />
      </div>
    </EvidenceCard>
  );
}

// ── Evidence tab ───────────────────────────────────────────────────────────────
// Shows 6 of the alert's 9 OBSERVE-phase data sources as numbered cards
// (matches the design brief). `benocsRca` moved to the Root Cause Analysis
// tab; `eventScout` and `networkLoadMonitor` aren't surfaced as standalone
// cards in this pass — networkLoadMonitor's escalation narrative now lives in
// the Anodot widget's "Critical" tab instead. Both remain in alert-store.ts
// and are easy to re-surface if wanted.

function EvidenceTab({ alert }: { alert: Alert }) {
  const { benocs, snmp, borderPlanner, caemCasm, rex } = alert.sources;
  const flagColor = BUILDOUT_COLOR[borderPlanner.buildoutFlag];
  const [openList, setOpenList] = useState<"alarms" | "tickets" | null>(null);
  const interfaces = alertInterfacesWorstFirst(alert);
  const peak = alertPeakUtilization(alert);
  const peakColor = peak >= 85 ? "#FF3B3B" : peak >= 70 ? "#FFB020" : "#2DD4BF";

  return (
    <div className="space-y-4">
      <AnodotWidget alert={alert} />

      <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <span className="text-[13px] font-semibold" style={{ color: "var(--color-text-primary)" }}>Affected Scope — traffic paths</span>
          <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
            {interfaces.length} interfaces · worst peak first
          </span>
        </div>
        <div className="space-y-4">
          {interfaces.map((iface) => {
            const ifacePeakColor = iface.peakUtilization >= 85 ? "#FF3B3B" : iface.peakUtilization >= 70 ? "#FFB020" : "#2DD4BF";
            return (
              <div key={iface.name}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold" style={{ color: "var(--color-text-primary)" }}>{iface.name}</p>
                  <span className="text-[10px] font-bold" style={{ color: ifacePeakColor }}>{iface.peakUtilization}% peak</span>
                </div>
                <PathStrip nodes={iface.pathChain} />
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-[13px] font-semibold" style={{ color: "var(--color-text-primary)" }}>Interface Utilization</p>
          <span className="text-[11px] font-bold" style={{ color: peakColor }}>{peak}% worst peak</span>
        </div>
        <p className="text-[11px] mb-3" style={{ color: "var(--color-text-muted)" }}>
          Observed utilization per congested interface, worst peak first · 85% capacity threshold · click a chart to collapse it
        </p>
        <div className="space-y-4">
          {interfaces.map((iface) => (
            <AlertInterfaceChart key={iface.name} iface={iface} />
          ))}
        </div>
      </div>

      <EvidenceCard number="2" title="Bendos RCA — Traffic Flows">
        <p className="text-[11px] font-mono mb-3" style={{ color: "var(--color-text-muted)" }}>
          Direction: {benocs.direction}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <StatBlock label="Source AS" value={benocs.sourceAS} />
          <StatBlock label="Baseline" value={`${benocs.baseline} Gbps`} />
          <StatBlock label="Peak" value={`${benocs.peak} Gbps`} color="#FF3B3B" />
          <StatBlock label="Spike" value={`+${benocs.spikePercent}%`} color="#FFB020" />
        </div>
      </EvidenceCard>

      <SnmpWidget ports={snmp.ports} />

      <EvidenceCard number="4" title="Border Planner — Capacity & ASN Mix">
        <div className="grid grid-cols-3 gap-2.5 mb-3">
          <StatBlock label="Congested Ports" value={borderPlanner.congestedPorts} color="#FF3B3B" />
          <StatBlock label="Build-out Flag" value={borderPlanner.buildoutFlag} color={flagColor} badge />
          <StatBlock label="Worst Port" value={<span className="font-mono text-[10px]">{borderPlanner.worstPort}</span>} />
        </div>
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
          <table className="w-full text-[11px]">
            <thead>
              <tr style={{ backgroundColor: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--color-border)" }}>
                {["Port", "Ingress util %", "Capacity", "Transit AS", "Flag"].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {borderPlanner.ports.map((p, i) => (
                <tr key={p.port} style={{ borderBottom: i < borderPlanner.ports.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                  <td className="px-3 py-2 font-mono" style={{ color: "var(--color-text-muted)" }}>{p.port}</td>
                  <td className="px-3 py-2 tabular-nums font-medium" style={{ color: p.ingressUtil >= 90 ? "#FF3B3B" : p.ingressUtil >= 80 ? "#FFB020" : "var(--color-text-primary)" }}>
                    {p.ingressUtil}%
                  </td>
                  <td className="px-3 py-2" style={{ color: "var(--color-text-muted)" }}>{p.capacity}</td>
                  <td className="px-3 py-2 font-mono" style={{ color: "var(--color-text-muted)" }}>{p.transitAS}</td>
                  <td className="px-3 py-2">
                    <Badge
                      variant={BUILDOUT_VARIANT[p.flag]}
                      className="font-bold uppercase"
                      style={{ color: BUILDOUT_COLOR[p.flag], backgroundColor: BUILDOUT_BG[p.flag] }}
                    >
                      {p.flag}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EvidenceCard>

      <EvidenceCard number="5" title="CAEM / CASM — Alarms & Tickets">
        <button
          onClick={() => setOpenList("alarms")}
          className="w-full flex items-center justify-between mb-2 group"
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest transition-colors group-hover:opacity-80" style={{ color: "var(--color-text-muted)" }}>
            Alarms ({caemCasm.alarmCount})
          </span>
          <ChevronRight size={13} style={{ color: "var(--color-brand)" }} />
        </button>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {caemCasm.alarmRefs.map(ref => (
            <button
              key={ref}
              onClick={() => setOpenList("alarms")}
              className="text-[10px] font-mono px-2 py-1 rounded transition-opacity hover:opacity-75"
              style={{ backgroundColor: "rgba(255,176,32,0.10)", color: "#FFB020" }}
            >
              {ref}
            </button>
          ))}
        </div>
        <button
          onClick={() => setOpenList("tickets")}
          className="w-full flex items-center justify-between mb-2 group"
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest transition-colors group-hover:opacity-80" style={{ color: "var(--color-text-muted)" }}>
            Tickets ({caemCasm.ticketCount})
          </span>
          <ChevronRight size={13} style={{ color: "var(--color-brand)" }} />
        </button>
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
          {caemCasm.ticketDesc}
        </p>
        <p className="text-[9px] mt-1.5 italic" style={{ color: "var(--color-text-muted)", opacity: 0.6 }}>
          Ticket IDs hidden — external CASM system
        </p>
      </EvidenceCard>

      {openList === "alarms" && <AlarmListModal alarms={caemCasm.alarmDetails} onClose={() => setOpenList(null)} />}
      {openList === "tickets" && <TicketListModal tickets={caemCasm.ticketDetails} onClose={() => setOpenList(null)} />}

      <EvidenceCard number="6" title="Rex — Routing Analysis">
        <div className="grid grid-cols-3 gap-2.5 mb-3">
          <StatBlock label="Link Flap" value={rex.linkFlap ? "Detected" : "None detected"} color={rex.linkFlap ? "#FF3B3B" : "#2DD4BF"} />
          <StatBlock label="IGP Metric Change" value={rex.igpMetricChange} />
          <StatBlock label="Local Pref" value={rex.localPref} />
        </div>
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{rex.notes}</p>
      </EvidenceCard>
    </div>
  );
}

// ── Root Cause Analysis tab ───────────────────────────────────────────────────
// Stripped down to exactly one thing: the agent's storyline — what happened,
// where, and why. No evidence chain, no classification grid, no change/impact
// callouts — those live on the Evidence tab or aren't shown at all.

function RcaTab({ alert }: { alert: Alert }) {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>
        Root cause hypothesis
      </p>
      <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: "var(--color-text-primary)" }}>
        {alert.predict.narrative}
      </p>
    </div>
  );
}

// ── Remediation tab ────────────────────────────────────────────────────────────

function RemediationTab({ alertId, actions, onConfirmed }: {
  alertId: string;
  actions: AlertAction[];
  onConfirmed: () => void;
}) {
  const [pendingAction, setPendingAction] = useState<AlertAction | null>(null);

  function handleConfirm(action: AlertAction) {
    confirmAction(alertId, action.id);
    setPendingAction(null);
    onConfirmed();
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
        Take actions one at a time — if the network hasn't stabilised after the first, take the next.
        Each action you take is recorded with its own timestamp.
      </p>

      {actions.map((action, i) => {
        const done    = isConfirmed(alertId, action.id);
        const takenAt = getTakenAt(alertId, action.id);
        const color   = RISK_COLOR[action.risk];
        const bg      = RISK_BG[action.risk];

        return (
          <div
            key={action.id}
            className="rounded-xl p-4"
            style={{
              backgroundColor: done ? "rgba(45,212,191,0.04)" : "var(--color-bg-card)",
              border: `1px solid ${done ? "rgba(45,212,191,0.2)" : action.hold ? "rgba(255,176,32,0.25)" : "var(--color-border)"}`,
            }}
          >
            <div className="flex items-start gap-3">
              <span
                className="text-[11px] font-bold tabular-nums w-6 h-6 rounded flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium leading-snug mb-1.5" style={{ color: done ? "#2DD4BF" : "var(--color-text-primary)" }}>
                  {action.label}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant={RISK_VARIANT[action.risk]} className="font-bold uppercase" style={{ color, backgroundColor: bg }}>
                    {action.risk} RISK
                  </Badge>
                  {action.hold && (
                    <Badge variant="warning" className="gap-1 font-bold uppercase" style={{ color: "#FFB020", backgroundColor: "rgba(255,176,32,0.12)" }}>
                      <Lock size={8} /> HOLD
                    </Badge>
                  )}
                  {done && (
                    <Badge variant="success" className="gap-1 font-bold uppercase" style={{ color: "#2DD4BF", backgroundColor: "rgba(45,212,191,0.12)" }}>
                      <CheckCircle2 size={8} /> TAKEN
                    </Badge>
                  )}
                  {done && takenAt && (
                    <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                      at {formatTakenAt(takenAt)}
                    </span>
                  )}
                </div>
                {action.hold && action.holdReason && (
                  <p className="text-[11px] mt-1.5 leading-snug" style={{ color: "#FFB020" }}>{action.holdReason}</p>
                )}
              </div>

              {!done && !action.hold && (
                <button
                  onClick={() => setPendingAction(action)}
                  className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                  style={{ backgroundColor: bg, color, border: `1px solid ${color}44` }}
                >
                  Approve
                </button>
              )}
            </div>
          </div>
        );
      })}

      {pendingAction && (
        <ConfirmModal
          title={pendingAction.modalTitle}
          body={pendingAction.modalBody}
          confirmLabel={pendingAction.confirmLabel}
          confirmColor={pendingAction.confirmColor}
          onConfirm={() => handleConfirm(pendingAction)}
          onClose={() => setPendingAction(null)}
        />
      )}
    </div>
  );
}

// ── Feedback tab ───────────────────────────────────────────────────────────────

function StarRating({ alertId, qkey, question }: { alertId: string; qkey: FeedbackQuestionKey; question: string }) {
  const [, forceRender] = useState(0);
  const rating = getFeedbackRating(alertId, qkey);

  function handleRate(n: number) {
    setFeedbackRating(alertId, qkey, n);
    forceRender(x => x + 1);
  }

  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[13px] font-semibold" style={{ color: "var(--color-text-primary)" }}>{question}</p>
        <span className="text-[11px] font-semibold shrink-0" style={{ color: "var(--color-text-muted)" }}>{rating}/5</span>
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => handleRate(n)}
            className="p-1 rounded transition-transform hover:scale-110"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              size={20}
              fill={n <= rating ? "var(--color-brand)" : "none"}
              style={{ color: n <= rating ? "var(--color-brand)" : "var(--color-text-muted)" }}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
      <p className="text-[10px] leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{FEEDBACK_SCALE_HELP}</p>
    </div>
  );
}

function FeedbackComment({ alertId }: { alertId: string }) {
  const [comment, setComment] = useState(() => getFeedbackComment(alertId));
  const [saved, setSaved] = useState(() => getFeedbackComment(alertId).length > 0);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setComment(e.target.value);
    setSaved(false);
  }

  function handleSave() {
    setFeedbackComment(alertId, comment.trim());
    setSaved(true);
  }

  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
      <p className="text-[13px] font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
        Add context for MINDR's knowledge base
      </p>
      <p className="text-[11px] mb-3 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
        Elaborate on what resolution actually worked and your problem-solving approach — this
        enriches MINDR's history for similar future alerts.
      </p>
      <textarea
        value={comment}
        onChange={handleChange}
        rows={5}
        placeholder="e.g. Rebalancing via the DE-CIX secondary path resolved this within 10 minutes; root cause was a stale BGP local-pref left over from last week's maintenance window..."
        className="w-full rounded-lg px-3 py-2.5 text-[12px] leading-relaxed resize-y"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", outline: "none" }}
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px]" style={{ color: saved ? "#2DD4BF" : "var(--color-text-muted)" }}>
          {saved ? "Saved to MINDR history" : "Not yet saved"}
        </span>
        <button
          onClick={handleSave}
          disabled={comment.trim().length === 0}
          className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
        >
          Save comment
        </button>
      </div>
    </div>
  );
}

function FeedbackTab({ alertId }: { alertId: string }) {
  return (
    <div className="space-y-4">
      {FEEDBACK_QUESTIONS.map(q => (
        <StarRating key={q.key} alertId={alertId} qkey={q.key} question={q.question} />
      ))}
      <FeedbackComment alertId={alertId} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AlertDetail() {
  const { id } = useParams<{ id: string }>();
  const alert = ALERTS.find(a => a.id === id);

  const [activeTab, setActiveTab]     = useState<TabKey>("evidence");
  const [actionVersion, bumpVersion]  = useState(0);

  if (!alert) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertTriangle size={28} style={{ color: "var(--color-critical)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
          Alert not found
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          No alert with ID "{id}" exists in this session.
        </p>
      </div>
    );
  }

  const sev    = ALERT_SEV[alert.severity];
  const status = ALERT_STATUS[alert.status];

  return (
    <div className="space-y-5 pb-8 mx-auto" style={{ maxWidth: "78%", minWidth: 0 }}>

      {/* ── Breadcrumb ───────────────────────────────────────────────────────── */}
      <Breadcrumb
        items={[
          { label: "Alerts", href: "/alerts" },
          { label: alert.id, badge: { text: alert.id, color: "#fff", bg: "rgba(233,24,124,0.20)" } },
          { label: alert.title },
        ]}
      />

      {/* ── Alert header card ────────────────────────────────────────────────── */}
      <div className="rounded-xl p-5" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge
            variant={SEV_VARIANT[alert.severity]}
            className="font-bold uppercase tracking-wide"
            style={{ color: sev.color, backgroundColor: sev.bg, border: `1px solid ${sev.color}44` }}
          >
            {sev.label}
          </Badge>
          <Badge
            variant={STATUS_VARIANT[alert.status]}
            className="gap-1 uppercase tracking-wide"
            style={{ color: status.color, backgroundColor: status.bg }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
            {status.label}
          </Badge>
          <span className="text-[10px] font-mono" style={{ color: "var(--color-text-muted)" }}>
            {alert.id} · Raised {alert.age} ago
          </span>
        </div>

        <h1 className="text-xl font-bold leading-tight mb-4" style={{ color: "var(--color-text-primary)" }}>
          {alert.title}
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {[
            // Confidence only for Resolved — before that, the alert hasn't
            // been confirmed against an outcome yet.
            alert.status === "resolved" &&
              { label: "Confidence", value: `${alert.confidence}%`, color: alert.confidence >= 90 ? "#2DD4BF" : "#FFB020" },
            // Impact stays hidden while Open — the lifecycle hasn't progressed
            // far enough to know the real impact yet; shown from Acted upon onward.
            alert.status !== "open" &&
              { label: "Impact", value: `${alert.impact.baseline} → ${alert.impact.peak} ${alert.impact.unit}`, color: "#FF3B3B" },
            { label: "Affected", value: alert.affected, color: "var(--color-text-primary)", mono: true },
            // ETA only while unresolved — nothing left to estimate once acted upon completes.
            (alert.status === "open" || alert.status === "acted-upon") &&
              { label: "ETA", value: alert.eta, color: "#FF6B4A" },
          ].filter((s): s is { label: string; value: string; color: string; mono?: boolean } => !!s)
            .map(({ label, value, color, mono }) => (
            <div key={label}>
              <p className="text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>
                {label}
              </p>
              <p className={`text-sm font-bold leading-tight ${mono ? "font-mono text-[11px]" : ""}`} style={{ color }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        <div
          className="flex items-center justify-between gap-3 flex-wrap pt-3"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            Linked:{" "}
            <span style={{ color: "var(--color-text-primary)", fontWeight: 700 }}>{alert.linkedAlarms}</span> Alarms ·{" "}
            <span style={{ color: "var(--color-text-primary)", fontWeight: 700 }}>{alert.linkedTeams}</span> Teams ·{" "}
            <span style={{ color: "var(--color-text-primary)", fontWeight: 700 }}>{alert.linkedTickets}</span> Tickets
            {alert.voiceChannel && (
              <> · <span style={{ color: "#4D9EFF", fontWeight: 600 }}>Voice channel designated</span></>
            )}
          </p>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <AlertTabBar active={activeTab} onChange={setActiveTab} />

      <div key={`${activeTab}-${actionVersion}`}>
        {activeTab === "evidence"    && <EvidenceTab alert={alert} />}
        {activeTab === "rca"         && <RcaTab alert={alert} />}
        {activeTab === "remediation" && (
          <RemediationTab alertId={alert.id} actions={alert.actions} onConfirmed={() => bumpVersion(v => v + 1)} />
        )}
        {activeTab === "feedback"    && <FeedbackTab alertId={alert.id} />}
      </div>
    </div>
  );
}
