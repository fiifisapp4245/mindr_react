import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, ChevronRight, GitBranch, Network, Shield, X } from "lucide-react";
import {
  VOLTE_INCIDENTS, VOLTE_ALARMS,
  type VolteSeverity, type IncidentStatus, type Segment, type RemediationRisk, type RemediationStatus,
} from "../../data/volte-data";

// ── Tokens ─────────────────────────────────────────────────────────────────────

const SEV_COLOR: Record<VolteSeverity, string> = { Critical: "#FF3B3B", High: "#FFB020", Medium: "#4D9EFF", Low: "rgba(255,255,255,0.4)" };
const SEV_BG:   Record<VolteSeverity, string> = { Critical: "rgba(255,59,59,0.12)", High: "rgba(255,176,32,0.12)", Medium: "rgba(77,158,255,0.12)", Low: "rgba(255,255,255,0.06)" };

const STATUS_CFG: Record<IncidentStatus, { color: string; bg: string }> = {
  Open:          { color: "#FF3B3B", bg: "rgba(255,59,59,0.12)" },
  Investigating: { color: "#FFB020", bg: "rgba(255,176,32,0.12)" },
  Resolved:      { color: "#2DD4BF", bg: "rgba(45,212,191,0.12)" },
};

const RISK_CFG: Record<RemediationRisk, { color: string; bg: string; label: string }> = {
  low:    { color: "#2DD4BF", bg: "rgba(45,212,191,0.12)",  label: "Low risk"    },
  medium: { color: "#FFB020", bg: "rgba(255,176,32,0.12)",  label: "Medium risk" },
  high:   { color: "#FF3B3B", bg: "rgba(255,59,59,0.12)",   label: "High risk"   },
};

const REM_STATUS_CFG: Record<RemediationStatus, { color: string; bg: string; label: string }> = {
  "auto-applied":     { color: "#2DD4BF", bg: "rgba(45,212,191,0.12)", label: "Auto-applied" },
  "pending-approval": { color: "#FFB020", bg: "rgba(255,176,32,0.12)", label: "Pending approval" },
  "approved":         { color: "#2DD4BF", bg: "rgba(45,212,191,0.12)", label: "Approved" },
  "rejected":         { color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.05)", label: "Rejected" },
};

const SEG_COLOR: Record<Segment, string> = { RAN: "#4D9EFF", EPC: "#A78BFA", IMS: "#2DD4BF" };
const SEG_BG:   Record<Segment, string> = { RAN: "rgba(77,158,255,0.12)", EPC: "rgba(167,139,250,0.12)", IMS: "rgba(45,212,191,0.12)" };

// ── Section heading ────────────────────────────────────────────────────────────

function SectionHead({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: "rgba(45,212,191,0.10)" }}>
        <Icon size={12} style={{ color: "#2DD4BF" }} />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>{title}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VolteIncidentDetail() {
  const navigate  = useNavigate();
  const { id }    = useParams<{ id: string }>();
  const incident  = VOLTE_INCIDENTS.find((inc) => inc.id === id);

  // Per-remediation local action state
  const [remState, setRemState] = useState<Record<string, RemediationStatus>>(() => {
    const out: Record<string, RemediationStatus> = {};
    incident?.remediations.forEach((r) => { out[r.id] = r.status; });
    return out;
  });

  if (!incident) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Incident not found.</p>
      </div>
    );
  }

  const alarms = VOLTE_ALARMS.filter((a) => incident.evidence.alarmIds.includes(a.id));

  function approve(remId: string) {
    setRemState((p) => ({ ...p, [remId]: "approved" }));
  }
  function reject(remId: string) {
    setRemState((p) => ({ ...p, [remId]: "rejected" }));
  }

  return (
    <div className="flex flex-col gap-8 pb-12">

      {/* Breadcrumb + back */}
      <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
        <button onClick={() => navigate("/volte/incidents")}
          className="flex items-center gap-1 hover:opacity-70 transition-opacity">
          <ArrowLeft size={11} />Incidents
        </button>
        <ChevronRight size={11} />
        <span style={{ color: "var(--color-text-primary)" }} className="truncate max-w-xs">{incident.title}</span>
      </div>

      {/* ── Title + status strip ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold"
              style={{ color: SEV_COLOR[incident.severity], backgroundColor: SEV_BG[incident.severity] }}>
              {incident.severity}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold"
              style={{ color: STATUS_CFG[incident.status].color, backgroundColor: STATUS_CFG[incident.status].bg }}>
              {incident.status}
            </span>
            <span className="text-[10px] font-mono" style={{ color: "var(--color-text-muted)" }}>{incident.id.toUpperCase()}</span>
          </div>
          <h1 className="text-[20px] font-bold leading-tight" style={{ color: "var(--color-text-primary)" }}>{incident.title}</h1>
        </div>
        <button onClick={() => navigate("/volte/network-model")}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold hover:opacity-80 transition-opacity"
          style={{ backgroundColor: "rgba(45,212,191,0.10)", color: "#2DD4BF", border: "1px solid rgba(45,212,191,0.25)" }}>
          <Network size={12} />View network model
        </button>
      </div>

      {/* ── Impact strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Affected subscribers", value: incident.affectedSubscribers.toLocaleString(), color: "#FF3B3B" },
          { label: "Customer impact score", value: `${incident.customerImpactScore}/100`, color: incident.customerImpactScore >= 80 ? "#FF3B3B" : "#FFB020" },
          { label: "Opened at", value: incident.openedAt, color: "var(--color-text-primary)" },
          { label: "MTTR", value: incident.mttr ?? "In progress", color: incident.mttr ? "#2DD4BF" : "#FFB020" },
        ].map((item) => (
          <div key={item.label} className="px-4 py-3 rounded-xl"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--color-text-muted)" }}>{item.label}</p>
            <p className="text-[16px] font-bold mt-1 tabular-nums" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Segment chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Affected segments:</span>
        {incident.affectedScope.segments.map((seg) => (
          <span key={seg} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold"
            style={{ color: SEG_COLOR[seg], backgroundColor: SEG_BG[seg] }}>
            {seg}
          </span>
        ))}
      </div>

      {/* ── RCA panel ────────────────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid rgba(45,212,191,0.2)" }}>
        <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <SectionHead icon={GitBranch} title="Root cause analysis (MINDR)" />
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--color-text-primary)" }}>{incident.rca.summary}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] font-semibold" style={{ color: "var(--color-text-muted)" }}>Root node:</span>
                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold"
                  style={{ backgroundColor: "rgba(45,212,191,0.12)", color: "#2DD4BF" }}>
                  {incident.rca.rootNodeLabel}
                </span>
              </div>
            </div>
            {/* Confidence gauge */}
            <div className="shrink-0 flex flex-col items-center gap-1">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: `conic-gradient(${incident.rca.confidence >= 90 ? "#2DD4BF" : "#FFB020"} ${incident.rca.confidence * 3.6}deg, rgba(255,255,255,0.08) 0deg)` }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--color-bg-card)" }}>
                  <span className="text-[12px] font-bold" style={{ color: incident.rca.confidence >= 90 ? "#2DD4BF" : "#FFB020" }}>
                    {incident.rca.confidence}%
                  </span>
                </div>
              </div>
              <p className="text-[9px] text-center" style={{ color: "var(--color-text-muted)" }}>RCA confidence</p>
            </div>
          </div>
        </div>

        {/* Causal chain */}
        <div className="px-6 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--color-text-muted)" }}>Causal chain</p>
          <div className="flex flex-col gap-0">
            {incident.rca.chain.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center shrink-0" style={{ paddingTop: 2 }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{ backgroundColor: "rgba(45,212,191,0.15)", color: "#2DD4BF", flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  {i < incident.rca.chain.length - 1 && (
                    <div className="w-px flex-1 mt-1 mb-1" style={{ height: 20, backgroundColor: "rgba(45,212,191,0.2)" }} />
                  )}
                </div>
                <p className="text-[11px] leading-snug pb-3" style={{ color: "var(--color-text-muted)" }}>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Remediations ─────────────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <div className="px-6 pt-5 pb-2">
          <SectionHead icon={Shield} title="Ranked remediations" />
        </div>
        <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
          {incident.remediations.map((rem) => {
            const status   = remState[rem.id];
            const riskCfg  = RISK_CFG[rem.risk];
            const remCfg   = REM_STATUS_CFG[status];
            const isPending = status === "pending-approval";
            const isApproved = status === "approved";
            const isRejected = status === "rejected";
            const isAuto    = status === "auto-applied";

            return (
              <div key={rem.id} className="px-6 py-4 flex items-start gap-4">
                {/* Rank */}
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)" }}>
                  #{rem.rank}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold leading-snug" style={{ color: "var(--color-text-primary)" }}>{rem.action}</p>
                  <p className="text-[11px] mt-1 leading-snug" style={{ color: "var(--color-text-muted)" }}>{rem.rationale}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold"
                      style={{ color: riskCfg.color, backgroundColor: riskCfg.bg }}>
                      {riskCfg.label}
                    </span>
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold"
                      style={{ color: remCfg.color, backgroundColor: remCfg.bg }}>
                      {remCfg.label}
                    </span>
                    {isAuto && rem.appliedBy && (
                      <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>
                        by {rem.appliedBy} · {rem.appliedAt}
                      </span>
                    )}
                    {isApproved && (
                      <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>Approved</span>
                    )}
                  </div>
                </div>

                {/* Action buttons for pending */}
                {isPending && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => approve(rem.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors"
                      style={{ backgroundColor: "rgba(45,212,191,0.12)", color: "#2DD4BF", border: "1px solid rgba(45,212,191,0.25)" }}>
                      <Check size={10} />Approve
                    </button>
                    <button onClick={() => reject(rem.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors"
                      style={{ backgroundColor: "rgba(255,59,59,0.08)", color: "#FF3B3B", border: "1px solid rgba(255,59,59,0.2)" }}>
                      <X size={10} />Reject
                    </button>
                  </div>
                )}
                {(isApproved || isRejected) && !isPending && !isAuto && (
                  <div className="flex items-center shrink-0">
                    <span className="text-[10px] font-semibold" style={{ color: isApproved ? "#2DD4BF" : "rgba(255,255,255,0.3)" }}>
                      {isApproved ? "Approved ✓" : "Rejected"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Evidence panel ───────────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <div className="px-6 pt-5 pb-2">
          <SectionHead icon={GitBranch} title="Correlated evidence" />
        </div>

        <div className="px-6 pb-6 grid grid-cols-2 gap-6">

          {/* KPI breaches */}
          <div>
            <p className="text-[10px] font-semibold mb-3 uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>KPI breaches</p>
            <div className="space-y-2">
              {incident.evidence.kpiBreaches.map((breach, i) => (
                <div key={i} className="flex items-start justify-between gap-3 px-3 py-2.5 rounded-lg"
                  style={{ backgroundColor: "rgba(255,59,59,0.05)", border: "1px solid rgba(255,59,59,0.12)" }}>
                  <div>
                    <p className="text-[11px] font-semibold" style={{ color: "var(--color-text-primary)" }}>{breach.kpi}</p>
                    <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                      {breach.nodeId.toUpperCase()} ·&nbsp;
                      <span className="inline-flex items-center px-1 py-0 rounded text-[9px] font-bold"
                        style={{ color: SEG_COLOR[breach.segment], backgroundColor: SEG_BG[breach.segment] }}>
                        {breach.segment}
                      </span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-bold font-mono" style={{ color: "#FF3B3B" }}>{breach.value}</p>
                    <p className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>limit {breach.threshold}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Correlated alarms */}
          <div>
            <p className="text-[10px] font-semibold mb-3 uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Correlated alarms</p>
            <div className="space-y-2">
              {alarms.map((alarm) => (
                <div key={alarm.id} className="flex items-start justify-between gap-3 px-3 py-2.5 rounded-lg"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)" }}>
                  <div>
                    <p className="text-[11px] font-semibold" style={{ color: "var(--color-text-primary)" }}>{alarm.name}</p>
                    <p className="text-[10px] font-mono" style={{ color: "var(--color-brand)" }}>{alarm.id.toUpperCase()}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center px-1.5 py-0.5 rounded text-[9px] font-bold mt-0.5"
                    style={{ color: "#FF3B3B", backgroundColor: "rgba(255,59,59,0.12)" }}>
                    {alarm.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Traces */}
          <div>
            <p className="text-[10px] font-semibold mb-3 uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Protocol traces</p>
            <div className="space-y-2">
              {incident.evidence.traces.map((trace) => (
                <div key={trace.id} className="px-3 py-2.5 rounded-lg"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold" style={{ color: "#4D9EFF" }}>{trace.id}</span>
                    <span className="text-[9px] font-semibold" style={{ color: "var(--color-text-muted)" }}>{trace.protocol}</span>
                  </div>
                  <p className="text-[10px] mt-1 leading-snug" style={{ color: "var(--color-text-muted)" }}>{trace.summary}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Change refs + ticket refs */}
          <div className="space-y-5">
            {incident.evidence.changeRefs.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold mb-3 uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Change history</p>
                <div className="space-y-2">
                  {incident.evidence.changeRefs.map((chg) => (
                    <div key={chg.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg"
                      style={{ backgroundColor: "rgba(255,176,32,0.05)", border: "1px solid rgba(255,176,32,0.15)" }}>
                      <div>
                        <span className="text-[9px] font-mono font-bold" style={{ color: "#FFB020" }}>{chg.id}</span>
                        <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "var(--color-text-muted)" }}>{chg.summary}</p>
                        <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{chg.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {incident.evidence.ticketRefs.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold mb-3 uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Related tickets</p>
                <div className="space-y-2">
                  {incident.evidence.ticketRefs.map((tkt) => (
                    <div key={tkt.id} className="flex items-start justify-between gap-3 px-3 py-2.5 rounded-lg"
                      style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)" }}>
                      <div>
                        <span className="text-[9px] font-mono font-bold" style={{ color: "var(--color-brand)" }}>{tkt.id}</span>
                        <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "var(--color-text-muted)" }}>{tkt.summary}</p>
                      </div>
                      <span className="text-[9px] font-semibold shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>{tkt.team}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsible team */}
      <div className="flex items-start gap-4 px-5 py-4 rounded-xl"
        style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(45,212,191,0.10)" }}>
          <Shield size={14} style={{ color: "#2DD4BF" }} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Responsible team</p>
          <p className="text-[13px] font-semibold mt-0.5" style={{ color: "var(--color-text-primary)" }}>{incident.responsibleTeam.name}</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Lead: {incident.responsibleTeam.lead} · <a href={`mailto:${incident.responsibleTeam.email}`}
              style={{ color: "#2DD4BF" }}>{incident.responsibleTeam.email}</a>
          </p>
        </div>
      </div>

    </div>
  );
}
