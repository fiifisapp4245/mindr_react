import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ChevronRight, Lock, Star, Zap } from "lucide-react";
import {
  ALERTS, ALERT_SEV, ALERT_STATUS, confirmAction, isConfirmed,
  FEEDBACK_QUESTIONS, FEEDBACK_SCALE_HELP, setFeedbackRating, getFeedbackRating,
  type Alert, type AlertAction, type AlarmRecord, type TicketRecord, type BuildoutFlag, type FeedbackQuestionKey,
} from "../data/alert-store";
import { Breadcrumb } from "../components/shared/Breadcrumb";
import { ConfirmModal } from "../components/shared/ConfirmModal";
import { DetailModal } from "../components/shared/DetailModal";
import { Badge } from "../components/ui/badge";

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

type BadgeVariant = "destructive" | "warning" | "info" | "success";

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
  active:     "destructive",
  predicted:  "warning",
  mitigating: "info",
  resolved:   "success",
};

const SEV_DOT_COLOR: Record<string, string> = {
  critical: "#FF3B3B",
  high:     "#FFB020",
  medium:   "#4D9EFF",
  low:      "#2DD4BF",
};

const TICKET_STATUS_LABEL: Record<TicketRecord["status"], string> = {
  open:        "OPEN",
  in_progress: "IN PROGRESS",
  resolved:    "RESOLVED",
};

// ── List drill-down modal (Alarms / Tickets) ──────────────────────────────────

function AlarmListModal({ alarms, onClose }: { alarms: AlarmRecord[]; onClose: () => void }) {
  return (
    <DetailModal title={`Linked alarms (${alarms.length})`} onClose={onClose} maxWidth={512}>
      {alarms.map(a => (
        <div key={a.ref} className="rounded-lg p-3 flex items-start gap-3" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)" }}>
          <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: SEV_DOT_COLOR[a.severity] }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <Badge variant="warning" className="font-mono" style={{ backgroundColor: "rgba(255,176,32,0.10)", color: "#FFB020" }}>{a.ref}</Badge>
              <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: SEV_DOT_COLOR[a.severity] }}>{a.severity}</span>
            </div>
            <p className="text-[12px] leading-snug" style={{ color: "var(--color-text-primary)" }}>{a.message}</p>
            <p className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>{a.raised}</p>
          </div>
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
          <div className="flex items-center justify-between gap-2 mb-1">
            <Badge variant="info" className="font-bold uppercase tracking-wide" style={{ color: "#4D9EFF", backgroundColor: "rgba(77,158,255,0.12)" }}>
              {TICKET_STATUS_LABEL[t.status]}
            </Badge>
            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{t.raised}</span>
          </div>
          <p className="text-[12px] leading-snug" style={{ color: "var(--color-text-primary)" }}>{t.description}</p>
        </div>
      ))}
      <p className="text-[9px] italic pt-1" style={{ color: "var(--color-text-muted)", opacity: 0.6 }}>
        Ticket IDs hidden — external CASM system
      </p>
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

function EvidenceCard({ number, title, sourceTag, children }: {
  number: string;
  title: string;
  sourceTag: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span
            className="text-[11px] font-bold w-5 h-5 rounded flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
          >
            {number}
          </span>
          <span className="text-[13px] font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</span>
        </div>
        <span className="text-[10px] font-mono shrink-0" style={{ color: "var(--color-text-muted)" }}>{sourceTag}</span>
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

function UtilBar({ label, value, threshold }: { label: string; value: number; threshold: number }) {
  const color = value >= threshold ? "#FF3B3B" : value >= threshold - 10 ? "#FFB020" : "#2DD4BF";
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium" style={{ color: "var(--color-text-primary)" }}>{label} utilization</span>
        <span className="text-[12px] font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ── Evidence tab ───────────────────────────────────────────────────────────────
// Shows 7 of the alert's 9 data sources (matches the design brief). `benocsRca`
// moved to the Root Cause Analysis tab; `eventScout` isn't part of this pass —
// both are still in alert-store.ts and easy to re-surface if wanted.

function EvidenceTab({ alert }: { alert: Alert }) {
  const { anodot, networkLoadMonitor, benocs, snmp, borderPlanner, caemCasm, rex } = alert.sources;
  const flagColor = BUILDOUT_COLOR[borderPlanner.buildoutFlag];
  const [openList, setOpenList] = useState<"alarms" | "tickets" | null>(null);

  return (
    <div className="space-y-4">
      <EvidenceCard number="1" title="Anodot — Alert Trigger" sourceTag={`anomaly feed / peering-AS-${anodot.handoverAS}`}>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <StatBlock label="Severity" value={anodot.severity} color="#FF3B3B" />
          <StatBlock label="Handover AS" value={anodot.handoverAS} />
          <StatBlock label="Anomaly Score" value={anodot.score} color="#FF3B3B" />
          <StatBlock label="Router" value={anodot.router} />
          <StatBlock label="IXP" value={anodot.ixp} />
        </div>
      </EvidenceCard>

      <EvidenceCard number="2" title="Network Load Monitor — Triage" sourceTag={`ingress-monitor / threshold=${networkLoadMonitor.thresholdGbps} Gbps`}>
        <p className="text-[12px] leading-relaxed mb-3" style={{ color: "var(--color-text-muted)" }}>
          {networkLoadMonitor.reason}
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <StatBlock label="Current" value={`${networkLoadMonitor.currentGbps} Gbps`} color="#FF3B3B" />
          <StatBlock label="Threshold" value={`${networkLoadMonitor.thresholdGbps} Gbps`} />
        </div>
      </EvidenceCard>

      <EvidenceCard number="3" title="Bendos RCA — Traffic Flows" sourceTag={`traffic-flow-api / source-AS-${benocs.sourceAS}`}>
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

      <EvidenceCard number="4" title="SNMP — Port Utilization" sourceTag={`snmp-agent / ${snmp.router} / ${snmp.iface}`}>
        <UtilBar label={snmp.iface} value={snmp.utilization} threshold={snmp.threshold} />
        <div className="grid grid-cols-3 gap-2.5">
          <StatBlock label="Threshold" value={`${snmp.threshold}%`} />
          <StatBlock label="Capacity" value={snmp.capacity} />
          <StatBlock label="Route" value={snmp.router} />
        </div>
      </EvidenceCard>

      <EvidenceCard number="5" title="Border Planner — Capacity & ASN Mix" sourceTag="border-planner-api / all-peering-ports">
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

      <EvidenceCard number="6" title="CAEM / CASM — Alarms & Tickets" sourceTag="caem-api + casm-api / scope=this-alert">
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

      <EvidenceCard number="7" title="Rex — Routing Analysis" sourceTag="rex-routing-api / full-path">
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

function RcaTab({ alert }: { alert: Alert }) {
  const { predict, sources } = alert;
  const { benocsRca } = sources;
  const matchedClass = benocsRca.classifications.find(c => c.matches);

  return (
    <div className="space-y-4">
      <EvidenceCard number="1" title="Root Cause" sourceTag="anomaly feed / peering-AS-analysis">
        <p className="text-[12px] leading-relaxed" style={{ color: "var(--color-text-primary)" }}>{predict.narrative}</p>
      </EvidenceCard>

      {predict.changeInFlight && (
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: "linear-gradient(135deg, rgba(255,176,32,0.10), rgba(255,176,32,0.04))", border: "1px solid rgba(255,176,32,0.3)" }}
        >
          <Zap size={13} style={{ color: "#FFB020", flexShrink: 0, marginTop: 1 }} strokeWidth={2.5} />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#FFB020" }}>Change already in flight</p>
            <p className="text-[12px] leading-snug" style={{ color: "var(--color-text-primary)" }}>{predict.changeInFlight}</p>
          </div>
        </div>
      )}

      <div
        className="rounded-xl p-4"
        style={{ background: "linear-gradient(135deg, rgba(255,59,59,0.08), rgba(255,59,59,0.03))", border: "1px solid rgba(255,59,59,0.25)" }}
      >
        <p className="text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#FF3B3B" }}>If unmitigated</p>
        <p className="text-[12px] leading-snug" style={{ color: "var(--color-text-primary)" }}>{predict.ifUnmitigated}</p>
      </div>

      <EvidenceCard number="2" title="Bendos RCA — Independent Classification" sourceTag="bendos-rca-api / radio-independent">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-3">
          {benocsRca.classifications.map(cls => (
            <StatBlock
              key={cls.name}
              label={cls.name}
              value={cls.matches ? "ON" : "No"}
              color={cls.matches ? "#2DD4BF" : "var(--color-text-muted)"}
              badge={cls.matches}
            />
          ))}
        </div>
        {matchedClass?.confirms && (
          <p className="text-[11px] leading-relaxed" style={{ color: "#2DD4BF" }}>{matchedClass.confirms}</p>
        )}
      </EvidenceCard>

      <EvidenceCard number="3" title="Evidence chain" sourceTag="rex-routing-api / full-path">
        <div className="space-y-2">
          {predict.evidenceChain.map((e, i) => (
            <div key={i} className="rounded-lg px-3 py-2.5" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)" }}>
              <p className="text-[11px] leading-snug" style={{ color: "var(--color-text-primary)" }}>{e}</p>
            </div>
          ))}
        </div>
      </EvidenceCard>
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
      {actions.map((action, i) => {
        const done  = isConfirmed(alertId, action.id);
        const color = RISK_COLOR[action.risk];
        const bg    = RISK_BG[action.risk];

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
                      <CheckCircle2 size={8} /> CONFIRMED
                    </Badge>
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

function FeedbackTab({ alertId }: { alertId: string }) {
  return (
    <div className="space-y-4">
      {FEEDBACK_QUESTIONS.map(q => (
        <StarRating key={q.key} alertId={alertId} qkey={q.key} question={q.question} />
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AlertDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const alert = ALERTS.find(a => a.id === id);

  const [activeTab, setActiveTab]     = useState<TabKey>("evidence");
  const [actionVersion, bumpVersion]  = useState(0);
  const [headerAction, setHeaderAction] = useState<AlertAction | null>(null);

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
  const notifyAction = alert.actions.find(a => a.id.includes("notify"));

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
            { label: "Confidence", value: `${alert.confidence}%`, color: alert.confidence >= 90 ? "#2DD4BF" : "#FFB020" },
            { label: "Impact",     value: `${alert.impact.baseline} → ${alert.impact.peak} ${alert.impact.unit}`, color: "#FF3B3B" },
            { label: "Affected",   value: alert.affected, color: "var(--color-text-primary)", mono: true },
            { label: "ETA",        value: alert.eta, color: "#FF6B4A" },
          ].map(({ label, value, color, mono }) => (
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

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate("/network-model/ip-core")}
              className="text-[12px] font-semibold px-4 py-2 rounded-lg transition-colors hover:bg-white/5"
              style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
            >
              View in Network Model
            </button>
            {notifyAction && (
              <button
                onClick={() => setHeaderAction(notifyAction)}
                className="text-[12px] font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
              >
                Notify CDN
              </button>
            )}
          </div>
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

      {/* Header "Notify CDN" confirmation modal */}
      {headerAction && (
        <ConfirmModal
          title={headerAction.modalTitle}
          body={headerAction.modalBody}
          confirmLabel={headerAction.confirmLabel}
          confirmColor={headerAction.confirmColor}
          onConfirm={() => {
            confirmAction(alert.id, headerAction.id);
            setHeaderAction(null);
            bumpVersion(v => v + 1);
          }}
          onClose={() => setHeaderAction(null)}
        />
      )}
    </div>
  );
}
