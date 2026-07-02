import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  GitBranch,
  Info,
  Link2,
  Lock,
  Radio,
  Search,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";
import { ALERTS, ALERT_SEV, ALERT_STATUS, confirmAction, isConfirmed, type Alert, type AlertAction, type BuildoutFlag, type RcaClass } from "../data/alert-store";
import { Breadcrumb } from "../components/shared/Breadcrumb";
import { ConfirmModal } from "../components/shared/ConfirmModal";

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

// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionLabel({ step, title, icon: Icon }: { step: string; title: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span
        className="text-[10px] font-bold px-2 py-0.5 rounded tabular-nums"
        style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
      >
        {step}
      </span>
      <Icon size={14} style={{ color: "var(--color-brand)" }} strokeWidth={2} />
      <span className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--color-text-primary)" }}>
        {title}
      </span>
    </div>
  );
}

function SourceCard({ number, label, icon: Icon, children, defaultOpen = true }: {
  number: string;
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
    >
      {/* Header — clickable toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-3 transition-colors hover:bg-white/[0.025]"
        style={{
          borderBottom: open ? "1px solid var(--color-border)" : "none",
          backgroundColor: "rgba(255,255,255,0.02)",
        }}
      >
        <span
          className="text-[10px] font-mono font-bold shrink-0"
          style={{ color: "var(--color-text-muted)" }}
        >
          {number}
        </span>
        <Icon size={13} style={{ color: "var(--color-brand)" }} strokeWidth={2} />
        <span className="flex-1 text-left text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-primary)" }}>
          {label}
        </span>
        {open
          ? <ChevronUp size={13} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          : <ChevronDown size={13} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
        }
      </button>

      {/* Body — collapsible */}
      {open && (
        <div className="px-4 py-3">
          {children}
        </div>
      )}
    </div>
  );
}

function QueriedLine({ text }: { text: string }) {
  return (
    <p className="text-[10px] font-mono mb-3 flex items-center gap-1.5" style={{ color: "var(--color-text-muted)" }}>
      <span
        className="text-[9px] font-bold px-1.5 py-px rounded uppercase"
        style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
      >
        QUERIED
      </span>
      {text}
    </p>
  );
}

function DataRow({ label, value, valueColor }: { label: string; value: React.ReactNode; valueColor?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span className="text-[11px] shrink-0" style={{ color: "var(--color-text-muted)" }}>{label}</span>
      <span className="text-[11px] font-medium text-right" style={{ color: valueColor ?? "var(--color-text-primary)" }}>{value}</span>
    </div>
  );
}

function SubCard({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div
      className="rounded-lg p-3 my-1"
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        border: `1px solid ${accent ? `${accent}33` : "rgba(255,255,255,0.06)"}`,
      }}
    >
      {children}
    </div>
  );
}

// ── OBSERVE source blocks ──────────────────────────────────────────────────────

function ObserveAnodot({ s }: { s: Alert["sources"]["anodot"] }) {
  return (
    <SourceCard number="01" label="Anodot — alert trigger" icon={Radio}>
      <QueriedLine text={`anomaly feed / peering-AS=${s.handoverAS}`} />
      <div className="space-y-px">
        <DataRow label="Severity"    value={<span style={{ color: BUILDOUT_COLOR["CRITICAL"] }}>{s.severity}</span>} />
        <DataRow label="Handover AS" value={<span className="font-mono">{s.handoverAS}</span>} />
        <DataRow label="Anomaly score" value={<span style={{ color: "#FF3B3B" }}>{s.score}</span>} />
        <DataRow label="Router"      value={<span className="font-mono">{s.router}</span>} />
        <DataRow label="IXP"         value={s.ixp} />
      </div>
    </SourceCard>
  );
}

function ObserveNetworkLoad({ s }: { s: Alert["sources"]["networkLoadMonitor"] }) {
  const isEscalate = s.decision === "escalate";
  return (
    <SourceCard number="02" label="Network Load Monitor — triage" icon={TrendingUp}>
      <QueriedLine text={`ingress-monitor / threshold=${s.thresholdGbps} Gbps`} />
      <SubCard accent={isEscalate ? "#FF3B3B" : "#2DD4BF"}>
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide"
            style={{
              color: isEscalate ? "#FF3B3B" : "#2DD4BF",
              backgroundColor: isEscalate ? "rgba(255,59,59,0.15)" : "rgba(45,212,191,0.15)",
            }}
          >
            {isEscalate ? "ESCALATE" : "RESOLVE"}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          {s.reason}
        </p>
      </SubCard>
      <div className="space-y-px mt-2">
        <DataRow label="Current" value={`${s.currentGbps} Gbps`} valueColor="#FF3B3B" />
        <DataRow label="Threshold" value={`${s.thresholdGbps} Gbps`} />
      </div>
    </SourceCard>
  );
}

function ObserveBenocs({ s }: { s: Alert["sources"]["benocs"] }) {
  return (
    <SourceCard number="03" label="BENOCS — traffic flows" icon={GitBranch}>
      <QueriedLine text={`traffic-flow-api / source-AS=${s.sourceAS}`} />
      <div className="space-y-px">
        <DataRow label="Source AS"  value={<span className="font-mono">{s.sourceAS}</span>} />
        <DataRow label="Baseline"   value={`${s.baseline} Gbps`} />
        <DataRow label="Peak"       value={`${s.peak} Gbps`} valueColor="#FF3B3B" />
        <DataRow label="Spike"      value={`+${s.spikePercent}%`} valueColor="#FFB020" />
        <DataRow label="Direction"  value={<span className="font-mono text-[10px]">{s.direction}</span>} />
      </div>
    </SourceCard>
  );
}

function ObserveSnmp({ s }: { s: Alert["sources"]["snmp"] }) {
  const overThreshold = s.utilization >= s.threshold;
  return (
    <SourceCard number="04" label="SNMP — port utilisation" icon={Activity}>
      <QueriedLine text={`snmp-poller / router=${s.router} iface=${s.iface}`} />
      <div className="space-y-px">
        <DataRow
          label="Utilisation"
          value={`${s.utilization}%`}
          valueColor={overThreshold ? "#FF3B3B" : "#FFB020"}
        />
        <DataRow label="Threshold" value={`${s.threshold}%`} />
        <DataRow label="Capacity"  value={s.capacity} />
        <DataRow label="Router"    value={<span className="font-mono text-[10px]">{s.router}</span>} />
        <DataRow label="Interface" value={<span className="font-mono text-[10px]">{s.iface}</span>} />
      </div>
    </SourceCard>
  );
}

function ObserveBorderPlanner({ s }: { s: Alert["sources"]["borderPlanner"] }) {
  const flagColor = BUILDOUT_COLOR[s.buildoutFlag];
  const flagBg    = BUILDOUT_BG[s.buildoutFlag];
  return (
    <SourceCard number="05" label="Border Planner — capacity & ASN mix" icon={Shield}>
      <QueriedLine text={`border-planner-api / scope=all-peering-ports`} />

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Congested ports", value: s.congestedPorts, color: "#FF3B3B" },
          { label: "Build-out flag",  value: s.buildoutFlag, color: flagColor },
          { label: "Worst port",      value: s.worstPort,  color: "var(--color-text-primary)" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-lg p-2.5"
            style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)" }}
          >
            <p className="text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>
              {label}
            </p>
            <p
              className={`text-sm font-bold ${label === "Worst port" ? "font-mono text-[10px]" : ""}`}
              style={{ color }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Build-out flag badge */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide"
          style={{ color: flagColor, backgroundColor: flagBg, border: `1px solid ${flagColor}44` }}
        >
          BUILD-OUT: {s.buildoutFlag}
        </span>
      </div>

      {/* Port table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: "1px solid var(--color-border)" }}
      >
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
            {s.ports.map((p, i) => (
              <tr
                key={p.port}
                style={{ borderBottom: i < s.ports.length - 1 ? "1px solid var(--color-border)" : "none" }}
              >
                <td className="px-3 py-2 font-mono" style={{ color: "var(--color-text-muted)" }}>{p.port}</td>
                <td className="px-3 py-2 tabular-nums font-medium" style={{ color: p.ingressUtil >= 90 ? "#FF3B3B" : p.ingressUtil >= 80 ? "#FFB020" : "var(--color-text-primary)" }}>
                  {p.ingressUtil}%
                </td>
                <td className="px-3 py-2" style={{ color: "var(--color-text-muted)" }}>{p.capacity}</td>
                <td className="px-3 py-2 font-mono" style={{ color: "var(--color-text-muted)" }}>{p.transitAS}</td>
                <td className="px-3 py-2">
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                    style={{ color: BUILDOUT_COLOR[p.flag], backgroundColor: BUILDOUT_BG[p.flag] }}
                  >
                    {p.flag}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SourceCard>
  );
}

function ObserveCaemCasm({ s }: { s: Alert["sources"]["caemCasm"] }) {
  return (
    <SourceCard number="06" label="CAEM / CASM — alarms & tickets" icon={Bell}>
      <QueriedLine text={`caem-api + casm-api / scope=this-alert`} />
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Alarms — refs are OK to show and link per D3 */}
        <SubCard>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Alarms</p>
            <Link
              to="/alerts"
              className="text-[10px] font-medium transition-opacity hover:opacity-80"
              style={{ color: "var(--color-brand)" }}
            >
              View all →
            </Link>
          </div>
          <p className="text-2xl font-bold" style={{ color: "#FFB020" }}>{s.alarmCount}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {s.alarmRefs.map(ref => (
              <Link
                key={ref}
                to="/alerts"
                className="text-[9px] font-mono px-1.5 py-px rounded transition-opacity hover:opacity-75"
                style={{ backgroundColor: "rgba(255,176,32,0.10)", color: "#FFB020", textDecoration: "none" }}
              >
                {ref}
              </Link>
            ))}
          </div>
        </SubCard>

        {/* Tickets — description + count only, no IDs per D3 */}
        <SubCard>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Tickets</p>
            <Link
              to="/alerts"
              className="text-[10px] font-medium transition-opacity hover:opacity-80"
              style={{ color: "var(--color-brand)" }}
            >
              View alerts →
            </Link>
          </div>
          <p className="text-2xl font-bold" style={{ color: "#4D9EFF" }}>{s.ticketCount}</p>
          <p className="text-[10px] mt-2 leading-snug" style={{ color: "var(--color-text-muted)" }}>
            {s.ticketDesc}
          </p>
          <p className="text-[9px] mt-1.5 italic" style={{ color: "var(--color-text-muted)", opacity: 0.6 }}>
            Ticket IDs hidden — external CASM system
          </p>
        </SubCard>
      </div>
    </SourceCard>
  );
}

function ObserveBenocsRca({ s }: { s: Alert["sources"]["benocsRca"] }) {
  return (
    <SourceCard number="07" label="BENOCS RCA — independent classification" icon={Search}>
      <QueriedLine text={`benocs-rca-api / mode=independent`} />
      <div className="space-y-2 mb-3">
        {s.classifications.map((cls) => (
          <div
            key={cls.name}
            className="flex items-start gap-3 py-2 px-3 rounded-lg"
            style={{ backgroundColor: cls.matches ? "rgba(45,212,191,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${cls.matches ? "rgba(45,212,191,0.2)" : "var(--color-border)"}` }}
          >
            {cls.matches
              ? <CheckCircle2 size={13} style={{ color: "#2DD4BF", marginTop: 1, flexShrink: 0 }} />
              : <span className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 flex items-center justify-center" style={{ border: "1px solid var(--color-border)" }}>
                  <span className="w-1 h-px" style={{ backgroundColor: "var(--color-text-muted)", display: "block" }} />
                </span>
            }
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold" style={{ color: cls.matches ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                  {cls.name}
                </span>
                <span
                  className="text-[9px] font-bold px-1.5 py-px rounded uppercase"
                  style={{
                    color: cls.matches ? "#2DD4BF" : "var(--color-text-muted)",
                    backgroundColor: cls.matches ? "rgba(45,212,191,0.12)" : "rgba(255,255,255,0.04)",
                  }}
                >
                  {cls.matches ? "YES" : "NO"}
                </span>
              </div>
              {cls.confirms && (
                <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "#2DD4BF" }}>
                  {cls.confirms}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <SubCard>
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          {s.summary}
        </p>
      </SubCard>
    </SourceCard>
  );
}

function ObserveRex({ s }: { s: Alert["sources"]["rex"] }) {
  return (
    <SourceCard number="08" label="REX — routing analysis" icon={GitBranch}>
      <QueriedLine text={`rex-routing-api / mode=full-path`} />
      <div className="space-y-px">
        <DataRow label="Link flap"        value={s.linkFlap ? <span style={{ color: "#FF3B3B" }}>YES</span> : <span style={{ color: "#2DD4BF" }}>None detected</span>} />
        <DataRow label="IGP metric change" value={<span className="font-mono text-[10px]">{s.igpMetricChange}</span>} />
        <DataRow label="Reroute path"     value={<span className="font-mono text-[10px]">{s.reroutePath}</span>} />
        <DataRow label="Local-pref"       value={s.localPref} />
      </div>
      {s.notes && (
        <SubCard>
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            {s.notes}
          </p>
        </SubCard>
      )}
    </SourceCard>
  );
}

function ObserveEventScout({ s }: { s: Alert["sources"]["eventScout"] }) {
  return (
    <SourceCard number="09" label="Event Scout — event memory" icon={Clock}>
      <QueriedLine text={`event-scout-api / mode=proactive-match`} />
      {s.matchCount === 0 ? (
        <SubCard>
          <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
            No proactive event match — this alert pattern has no prior occurrence in the event memory.
          </p>
        </SubCard>
      ) : (
        <>
          <p className="text-[11px] mb-2" style={{ color: "var(--color-text-muted)" }}>
            {s.matchCount} proactive match{s.matchCount !== 1 ? "es" : ""} found:
          </p>
          <div className="space-y-2">
            {s.matches.map((m, i) => (
              <SubCard key={i} accent="#4D9EFF">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium" style={{ color: "var(--color-text-primary)" }}>{m.event}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{m.date}</p>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0"
                    style={{ color: "#4D9EFF", backgroundColor: "rgba(77,158,255,0.12)" }}
                  >
                    {Math.round(m.similarity * 100)}% match
                  </span>
                </div>
              </SubCard>
            ))}
          </div>
        </>
      )}
    </SourceCard>
  );
}

// ── PREDICT rail ──────────────────────────────────────────────────────────────

function PredictRail({ predict }: { predict: Alert["predict"] }) {
  return (
    <div className="space-y-4">
      <SectionLabel step="02" title="Predict" icon={TrendingUp} />

      {/* RCA narrative */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>
          Root Cause
        </p>
        <p className="text-[12px] leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
          {predict.narrative}
        </p>
      </div>

      {/* Change in flight callout */}
      {predict.changeInFlight && (
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{
            background: "linear-gradient(135deg, rgba(255,176,32,0.08), rgba(255,176,32,0.04))",
            border: "1px solid rgba(255,176,32,0.25)",
          }}
        >
          <Zap size={13} style={{ color: "#FFB020", flexShrink: 0, marginTop: 1 }} strokeWidth={2.5} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#FFB020" }}>
              Change already in flight
            </p>
            <p className="text-[11px] leading-snug" style={{ color: "var(--color-text-primary)" }}>
              {predict.changeInFlight}
            </p>
          </div>
        </div>
      )}

      {/* Evidence chain */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>
          Evidence chain
        </p>
        <div className="space-y-2.5">
          {predict.evidenceChain.map((e, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span
                className="text-[9px] font-bold tabular-nums px-1.5 py-px rounded shrink-0 mt-0.5"
                style={{ backgroundColor: "rgba(233,24,124,0.12)", color: "var(--color-brand)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-[11px] leading-snug" style={{ color: "var(--color-text-primary)" }}>
                {e}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* If unmitigated */}
      <div
        className="rounded-xl p-4"
        style={{
          background: "linear-gradient(135deg, rgba(255,59,59,0.06), rgba(255,59,59,0.03))",
          border: "1px solid rgba(255,59,59,0.2)",
        }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#FF3B3B" }}>
          If unmitigated
        </p>
        <p className="text-[11px] leading-snug" style={{ color: "var(--color-text-primary)" }}>
          {predict.ifUnmitigated}
        </p>
      </div>

      {/* Confidence */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
            Confidence
          </p>
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color: predict.confidence >= 90 ? "#2DD4BF" : predict.confidence >= 75 ? "#FFB020" : "#4D9EFF" }}
          >
            {predict.confidence}%
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${predict.confidence}%`,
              backgroundColor: predict.confidence >= 90 ? "#2DD4BF" : predict.confidence >= 75 ? "#FFB020" : "#4D9EFF",
            }}
          />
        </div>
        <p className="text-[10px] mt-2" style={{ color: "var(--color-text-muted)" }}>
          Based on {predict.evidenceChain.length} corroborating signals across {9} data sources
        </p>
      </div>
    </div>
  );
}

// ── ACT rail ──────────────────────────────────────────────────────────────────

function ActRail({ alertId, actions }: { alertId: string; actions: AlertAction[] }) {
  const [pendingAction, setPendingAction] = useState<AlertAction | null>(null);
  const [, forceRender] = useState(0);

  function handleConfirm(action: AlertAction) {
    confirmAction(alertId, action.id);
    setPendingAction(null);
    forceRender(n => n + 1);
  }

  return (
    <div className="space-y-4">
      <SectionLabel step="03" title="Act" icon={Zap} />

      <div className="space-y-2">
        {actions.map((action, i) => {
          const done = isConfirmed(alertId, action.id);
          const color = RISK_COLOR[action.risk];
          const bg    = RISK_BG[action.risk];

          return (
            <div
              key={action.id}
              className="rounded-xl p-3.5"
              style={{
                backgroundColor: done ? "rgba(45,212,191,0.04)" : "var(--color-bg-card)",
                border: `1px solid ${done ? "rgba(45,212,191,0.2)" : action.hold ? "rgba(255,176,32,0.2)" : "var(--color-border)"}`,
                opacity: action.hold ? 0.7 : 1,
              }}
            >
              <div className="flex items-start gap-2.5">
                {/* Rank number */}
                <span
                  className="text-[10px] font-bold tabular-nums px-1.5 py-px rounded shrink-0 mt-0.5"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="flex-1 min-w-0">
                  {/* Label + badges */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                    <span className="text-[12px] font-medium leading-snug" style={{ color: done ? "#2DD4BF" : "var(--color-text-primary)" }}>
                      {action.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="text-[9px] font-bold px-1.5 py-px rounded uppercase"
                      style={{ color, backgroundColor: bg }}
                    >
                      {action.risk} RISK
                    </span>
                    {action.hold && (
                      <span
                        className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-px rounded uppercase"
                        style={{ color: "#FFB020", backgroundColor: "rgba(255,176,32,0.12)" }}
                      >
                        <Lock size={8} />
                        HOLD
                      </span>
                    )}
                    {done && (
                      <span
                        className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-px rounded uppercase"
                        style={{ color: "#2DD4BF", backgroundColor: "rgba(45,212,191,0.12)" }}
                      >
                        <CheckCircle2 size={8} />
                        CONFIRMED
                      </span>
                    )}
                  </div>

                  {/* Hold reason */}
                  {action.hold && action.holdReason && (
                    <p className="text-[10px] mt-1.5 leading-snug" style={{ color: "#FFB020" }}>
                      {action.holdReason}
                    </p>
                  )}
                </div>

                {/* Approve button */}
                {!done && !action.hold && (
                  <button
                    onClick={() => setPendingAction(action)}
                    className="shrink-0 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                    style={{ backgroundColor: bg, color, border: `1px solid ${color}44` }}
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="flex gap-2 pt-1">
        <button
          className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
          onClick={() => {
            const notifyAction = actions.find(a => a.id.includes("notify"));
            if (notifyAction) setPendingAction(notifyAction);
          }}
        >
          Notify partner
        </button>
        <button
          className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition-colors hover:bg-white/5"
          style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
        >
          Full report
        </button>
      </div>

      {/* Confirmation modal */}
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

// ── Progress indicator ────────────────────────────────────────────────────────

function ProgressIndicator({ active }: { active: "observe" | "predict" | "act" }) {
  const steps = [
    { id: "observe", label: "Observe" },
    { id: "predict", label: "Predict" },
    { id: "act",     label: "Act"     },
  ] as const;

  const activeIdx = steps.findIndex(s => s.id === active);

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => {
        const isDone   = i < activeIdx;
        const isCurrent = i === activeIdx;
        return (
          <div key={step.id} className="flex items-center gap-1">
            {i > 0 && (
              <div className="w-6 h-px" style={{ backgroundColor: isDone ? "var(--color-brand)" : "var(--color-border)" }} />
            )}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: isCurrent ? "rgba(233,24,124,0.12)" : isDone ? "rgba(45,212,191,0.08)" : "transparent",
                border: `1px solid ${isCurrent ? "var(--color-brand)" : isDone ? "rgba(45,212,191,0.3)" : "var(--color-border)"}`,
              }}
            >
              {isDone && <CheckCircle2 size={10} style={{ color: "#2DD4BF" }} />}
              <span
                className="text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: isCurrent ? "var(--color-brand)" : isDone ? "#2DD4BF" : "var(--color-text-muted)" }}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Raw evidence expander ─────────────────────────────────────────────────────

function RawEvidenceExpander({ alert }: { alert: Alert }) {
  const [open, setOpen] = useState(false);
  const sourceCount = 9;
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--color-border)" }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
        style={{ backgroundColor: "var(--color-bg-card)" }}
      >
        <span className="text-[12px] font-medium" style={{ color: "var(--color-text-muted)" }}>
          All raw evidence ({sourceCount} sources)
        </span>
        {open ? <ChevronUp size={14} style={{ color: "var(--color-text-muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--color-text-muted)" }} />}
      </button>
      {open && (
        <div className="px-4 py-3 space-y-1" style={{ borderTop: "1px solid var(--color-border)", backgroundColor: "rgba(255,255,255,0.01)" }}>
          {[
            `ANODOT: score=${alert.sources.anodot.score}, AS=${alert.sources.anodot.handoverAS}, router=${alert.sources.anodot.router}`,
            `NETWORK_LOAD: current=${alert.sources.networkLoadMonitor.currentGbps}G, threshold=${alert.sources.networkLoadMonitor.thresholdGbps}G, decision=${alert.sources.networkLoadMonitor.decision}`,
            `BENOCS: baseline=${alert.sources.benocs.baseline}G, peak=${alert.sources.benocs.peak}G, spike=+${alert.sources.benocs.spikePercent}%`,
            `SNMP: util=${alert.sources.snmp.utilization}%, threshold=${alert.sources.snmp.threshold}%, iface=${alert.sources.snmp.iface}`,
            `BORDER_PLANNER: congested=${alert.sources.borderPlanner.congestedPorts} ports, flag=${alert.sources.borderPlanner.buildoutFlag}`,
            `CAEM/CASM: alarms=${alert.sources.caemCasm.alarmCount}, tickets=${alert.sources.caemCasm.ticketCount}`,
            `BENOCS_RCA: match=${alert.sources.benocsRca.classifications.find(c => c.matches)?.name ?? "none"}`,
            `REX: flap=${alert.sources.rex.linkFlap}, igp_change=${alert.sources.rex.igpMetricChange}, local_pref=${alert.sources.rex.localPref}`,
            `EVENT_SCOUT: matches=${alert.sources.eventScout.matchCount}`,
          ].map((line, i) => (
            <p key={i} className="text-[10px] font-mono leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AlertDetail() {
  const { id } = useParams<{ id: string }>();
  const alert = ALERTS.find(a => a.id === id);

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
    <div className="space-y-5 pb-8">

      {/* ── Breadcrumb ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Breadcrumb
          items={[
            { label: "Alerts", href: "/alerts" },
            {
              label: alert.id,
              badge: { text: alert.id, color: "#fff", bg: "rgba(233,24,124,0.20)" },
            },
            { label: alert.title },
          ]}
        />
        <ProgressIndicator active="observe" />
      </div>

      {/* ── Alert header card ────────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
      >
        {/* Top row: severity + status + age */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide"
            style={{ color: sev.color, backgroundColor: sev.bg, border: `1px solid ${sev.color}44` }}
          >
            {sev.label}
          </span>
          <span
            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide"
            style={{ color: status.color, backgroundColor: status.bg }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
            {status.label}
          </span>
          <span className="text-[10px] font-mono" style={{ color: "var(--color-text-muted)" }}>
            {alert.id} · raised {alert.raised}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold leading-tight mb-4" style={{ color: "var(--color-text-primary)" }}>
          {alert.title}
        </h1>

        {/* Key metrics row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Confidence",
              value: `${alert.confidence}%`,
              color: alert.confidence >= 90 ? "#2DD4BF" : "#FFB020",
            },
            {
              label: "Impact",
              value: `${alert.impact.baseline} → ${alert.impact.peak} ${alert.impact.unit}`,
              color: "#FF3B3B",
            },
            {
              label: "Affected",
              value: alert.affected,
              color: "var(--color-text-primary)",
              mono: true,
            },
            {
              label: "ETA",
              value: alert.eta,
              color: "#FFB020",
            },
          ].map(({ label, value, color, mono }) => (
            <div key={label}>
              <p className="text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>
                {label}
              </p>
              <p className={`text-sm font-semibold leading-tight ${mono ? "font-mono text-[11px]" : ""}`} style={{ color }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Linked counts */}
        <div
          className="flex items-center gap-4 mt-4 pt-3 flex-wrap"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <Link
            to="/alerts"
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            style={{ textDecoration: "none" }}
          >
            <Bell size={11} style={{ color: "#FFB020" }} />
            <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
              <span style={{ color: "#FFB020", fontWeight: 600 }}>{alert.linkedAlarms}</span> alarms linked
            </span>
            <ChevronRight size={10} style={{ color: "var(--color-text-muted)", opacity: 0.5 }} />
          </Link>
          <div className="flex items-center gap-1.5">
            <Link2 size={11} style={{ color: "#4D9EFF" }} />
            <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
              <span style={{ color: "#4D9EFF", fontWeight: 600 }}>{alert.linkedTickets}</span> tickets — {alert.ticketDesc}
            </span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <Info size={11} style={{ color: "var(--color-text-muted)" }} />
            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
              Region: {alert.region}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main layout: OBSERVE (left) + PREDICT/ACT rail (right) ──────────── */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 340px", alignItems: "start" }}>

        {/* ── OBSERVE — main column ──────────────────────────────────────────── */}
        <div className="space-y-4">
          <SectionLabel step="01" title="Observe — evidence, source by source" icon={Search} />

          <ObserveAnodot       s={alert.sources.anodot} />
          <ObserveNetworkLoad  s={alert.sources.networkLoadMonitor} />
          <ObserveBenocs       s={alert.sources.benocs} />
          <ObserveSnmp         s={alert.sources.snmp} />
          <ObserveBorderPlanner s={alert.sources.borderPlanner} />
          <ObserveCaemCasm     s={alert.sources.caemCasm} />
          <ObserveBenocsRca    s={alert.sources.benocsRca} />
          <ObserveRex          s={alert.sources.rex} />
          <ObserveEventScout   s={alert.sources.eventScout} />

          <RawEvidenceExpander alert={alert} />
        </div>

        {/* ── Right rail: PREDICT + ACT ──────────────────────────────────────── */}
        <div className="space-y-6 sticky top-4">
          <PredictRail predict={alert.predict} />
          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
            <ActRail alertId={alert.id} actions={alert.actions} />
          </div>
        </div>
      </div>
    </div>
  );
}
