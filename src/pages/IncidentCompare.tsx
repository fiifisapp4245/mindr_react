import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useFLMIncidents } from "../contexts/flm-incidents";
import {
  computeBand,
  bandColor,
  bandBg,
  bandLabel,
  buildoutColor,
  buildoutBg,
  CONGESTED_IFACE_THRESHOLDS,
  TRAFFIC_SPIKE_THRESHOLDS,
  ROUTE_DEV_THRESHOLDS,
  CONFIDENCE_THRESHOLDS,
  type FLMIncident,
} from "../data/flm-incident-store";
import { Breadcrumb } from "../components/shared/Breadcrumb";

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  Open:         { color: "var(--color-critical)",   bg: "rgba(255,59,59,0.12)"   },
  "In Progress":{ color: "var(--color-warning)",    bg: "rgba(255,176,32,0.12)"  },
  Resolved:     { color: "var(--color-resolved)",   bg: "rgba(45,212,191,0.12)"  },
  Escalated:    { color: "var(--color-mitigating)", bg: "rgba(77,158,255,0.12)"  },
  Closed:       { color: "var(--color-text-muted)", bg: "rgba(255,255,255,0.06)" },
};

// ── Comparison row types ───────────────────────────────────────────────────────

interface CompareField {
  label: string;
  render: (inc: FLMIncident) => React.ReactNode;
}

// ── Small value cell with optional band color ──────────────────────────────────

function ValueCell({
  value,
  unit,
  color,
  bg,
  badge,
}: {
  value: string | number;
  unit?: string;
  color?: string;
  bg?: string;
  badge?: string;
}) {
  return (
    <div className="py-3 px-4">
      <div className="flex items-end gap-1 flex-wrap">
        <span
          className="text-xl font-bold tabular-nums"
          style={{ color: color ?? "var(--color-text-primary)" }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs pb-0.5" style={{ color: "var(--color-text-muted)" }}>
            {unit}
          </span>
        )}
      </div>
      {badge && (
        <span
          className="mt-1 inline-block text-[10px] font-semibold px-1.5 py-px rounded"
          style={{ color: color, backgroundColor: bg }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

// ── Comparison row ─────────────────────────────────────────────────────────────

function CompareRow({
  label,
  incidents,
  render,
  isLast = false,
}: {
  label: string;
  incidents: FLMIncident[];
  render: (inc: FLMIncident) => React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <tr style={{ borderBottom: isLast ? "none" : "1px solid var(--color-border)" }}>
      <td
        className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider w-40 align-middle"
        style={{ color: "var(--color-text-muted)", backgroundColor: "var(--color-bg-elevated)", borderRight: "1px solid var(--color-border)" }}
      >
        {label}
      </td>
      {incidents.map((inc) => (
        <td
          key={inc.id}
          className="align-middle"
          style={{ borderRight: "1px solid var(--color-border)" }}
        >
          {render(inc)}
        </td>
      ))}
    </tr>
  );
}

// ── Section header row ─────────────────────────────────────────────────────────

function SectionRow({ label, colCount }: { label: string; colCount: number }) {
  return (
    <tr style={{ backgroundColor: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--color-border)" }}>
      <td
        colSpan={colCount + 1}
        className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </td>
    </tr>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function IncidentCompare() {
  const [searchParams] = useSearchParams();
  const { incidents: allIncidents } = useFLMIncidents();

  const rawIds = searchParams.get("ids") ?? "";
  const ids = rawIds.split(",").filter(Boolean);

  const incidents = ids
    .map((id) => allIncidents.find((i) => i.id === id))
    .filter((i): i is FLMIncident => !!i)
    .slice(0, 3);

  if (incidents.length < 2) {
    return (
      <div className="space-y-5">
        <Breadcrumb items={[
          { label: "Incidents", href: "/incidents" },
          { label: "Compare" },
        ]} />
        <div className="py-24 flex flex-col items-center gap-3">
          <p className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Select 2–3 incidents to compare
          </p>
          <Link
            to="/incidents"
            className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ color: "var(--color-brand)" }}
          >
            <ArrowLeft size={14} />
            Back to incidents list
          </Link>
        </div>
      </div>
    );
  }

  const colCount = incidents.length;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "Incidents", href: "/incidents" },
        { label: "Compare" },
      ]} />

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Incident Comparison
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Comparing {incidents.length} incidents · IP Peering
          </p>
        </div>
        <Link
          to="/incidents"
          className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ color: "var(--color-text-muted)" }}
        >
          <ArrowLeft size={14} />
          Back to list
        </Link>
      </div>

      {/* Comparison table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
      >
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--color-bg-elevated)", borderBottom: "1px solid var(--color-border)" }}>
              {/* Row label column */}
              <th className="px-4 py-3 w-40" style={{ borderRight: "1px solid var(--color-border)" }} />
              {/* Incident column headers */}
              {incidents.map((inc) => {
                const sevColor = inc.severity === "Critical" ? "var(--color-critical)" : "var(--color-warning)";
                return (
                  <th
                    key={inc.id}
                    className="px-4 py-3 text-left"
                    style={{ borderRight: "1px solid var(--color-border)" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span
                            className="text-xs font-bold"
                            style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
                          >
                            {inc.ref}
                          </span>
                          <span
                            className="text-[9px] font-semibold px-1.5 py-px rounded"
                            style={{ color: sevColor, backgroundColor: `${sevColor}20` }}
                          >
                            {inc.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs font-semibold leading-snug" style={{ color: "var(--color-text-primary)", maxWidth: 200 }}>
                          {inc.title}
                        </p>
                      </div>
                      <Link
                        to={`/incidents/${inc.id}`}
                        className="shrink-0 p-1 rounded transition-opacity hover:opacity-70"
                        style={{ color: "var(--color-brand)" }}
                        title={`Open ${inc.ref} detail`}
                      >
                        <ExternalLink size={13} />
                      </Link>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {/* ── Identity ───────────────────────────────────────────────── */}
            <SectionRow label="Identity" colCount={colCount} />

            <CompareRow
              label="Status"
              incidents={incidents}
              render={(inc) => {
                const cfg = STATUS_CFG[inc.status] ?? { color: "var(--color-text-muted)", bg: "transparent" };
                return (
                  <div className="py-3 px-4">
                    <span className="text-[11px] font-semibold px-2 py-1 rounded" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                      {inc.status.toUpperCase()}
                    </span>
                  </div>
                );
              }}
            />

            <CompareRow
              label="SLA"
              incidents={incidents}
              render={(inc) => {
                const color =
                  inc.slaPercent === 0 ? "var(--color-resolved)"
                  : inc.slaPercent >= 80 ? "var(--color-warning)"
                  : "var(--color-critical)";
                return (
                  <div className="py-3 px-4">
                    <p className="text-xs font-semibold" style={{ color }}>
                      {inc.slaMinutes > 0 ? `${inc.slaRemaining} remaining` : "Met"}
                    </p>
                    {inc.slaMinutes > 0 && (
                      <div className="mt-1 h-1 rounded-full overflow-hidden w-24" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                        <div className="h-full rounded-full" style={{ width: `${inc.slaPercent}%`, backgroundColor: color }} />
                      </div>
                    )}
                  </div>
                );
              }}
            />

            <CompareRow
              label="Alarm Ref"
              incidents={incidents}
              render={(inc) => (
                <div className="py-3 px-4">
                  <span className="text-xs" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>{inc.alarmRef}</span>
                </div>
              )}
            />

            <CompareRow
              label="Affected Peer"
              incidents={incidents}
              render={(inc) => (
                <div className="py-3 px-4">
                  <span className="text-xs" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>{inc.affectedPeer}</span>
                </div>
              )}
            />

            {/* ── Band 1: Impact KPIs ────────────────────────────────────── */}
            <SectionRow label="Band 1 — Impact" colCount={colCount} />

            <CompareRow
              label="Port Util (Max)"
              incidents={incidents}
              render={(inc) => {
                const band = computeBand(inc.portUtilizationMax, inc.portUtilThresholds);
                return <ValueCell value={`${inc.portUtilizationMax}%`} color={bandColor(band)} bg={bandBg(band)} badge={bandLabel(band)} />;
              }}
            />

            <CompareRow
              label="Congested Ifaces"
              incidents={incidents}
              render={(inc) => {
                const band = computeBand(inc.congestedInterfaces, CONGESTED_IFACE_THRESHOLDS);
                return <ValueCell value={inc.congestedInterfaces} unit="interfaces" color={bandColor(band)} bg={bandBg(band)} badge={bandLabel(band)} />;
              }}
            />

            <CompareRow
              label="Traffic Spike"
              incidents={incidents}
              render={(inc) => {
                const band = computeBand(inc.trafficSpikePercent, TRAFFIC_SPIKE_THRESHOLDS);
                return <ValueCell value={`${inc.trafficSpikePercent}%`} unit="above normal" color={bandColor(band)} bg={bandBg(band)} badge={bandLabel(band)} />;
              }}
            />

            {/* ── Band 2: Structural ─────────────────────────────────────── */}
            <SectionRow label="Band 2 — Structural" colCount={colCount} />

            <CompareRow
              label="Build-out Flag"
              incidents={incidents}
              render={(inc) => (
                <div className="py-3 px-4">
                  <span
                    className="text-xs font-bold px-2 py-1 rounded"
                    style={{ color: buildoutColor(inc.buildoutFlag), backgroundColor: buildoutBg(inc.buildoutFlag) }}
                  >
                    {inc.buildoutFlag}
                  </span>
                </div>
              )}
            />

            <CompareRow
              label="Change Ticket"
              incidents={incidents}
              render={(inc) => (
                <div className="py-3 px-4">
                  {inc.activeChangeTicket ? (
                    <span
                      className="text-[11px] font-semibold px-1.5 py-px rounded"
                      style={{ color: "var(--color-warning)", backgroundColor: "rgba(255,176,32,0.12)", fontFamily: "var(--font-mono)" }}
                    >
                      {inc.activeChangeTicket}
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>None</span>
                  )}
                </div>
              )}
            />

            {/* ── Agent hypothesis ───────────────────────────────────────── */}
            <SectionRow label="Agent Hypothesis" colCount={colCount} />

            <CompareRow
              label="Root Cause"
              incidents={incidents}
              render={(inc) => (
                <div className="py-3 px-4">
                  <p className="text-xs leading-snug" style={{ color: "var(--color-text-primary)" }}>
                    {inc.rootCause.summary}
                  </p>
                  <span
                    className="inline-block mt-1.5 text-[10px] font-semibold px-1.5 py-px rounded"
                    style={{ backgroundColor: "rgba(255,176,32,0.12)", color: "var(--color-warning)" }}
                  >
                    {inc.rootCause.category}
                  </span>
                </div>
              )}
            />

            <CompareRow
              label="RCA Confidence"
              incidents={incidents}
              render={(inc) => {
                const band = computeBand(inc.rootCause.confidence, CONFIDENCE_THRESHOLDS);
                return (
                  <div className="py-3 px-4">
                    <p className="text-xl font-bold" style={{ color: bandColor(band) }}>{inc.rootCause.confidence}%</p>
                    <div className="mt-1 h-1 rounded-full overflow-hidden w-20" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                      <div className="h-full rounded-full" style={{ width: `${inc.rootCause.confidence}%`, backgroundColor: bandColor(band) }} />
                    </div>
                    <span
                      className="inline-block mt-1 text-[10px] font-semibold px-1.5 py-px rounded"
                      style={{ color: bandColor(band), backgroundColor: bandBg(band) }}
                    >
                      {bandLabel(band)}
                    </span>
                  </div>
                );
              }}
            />

            <CompareRow
              label="Alt Path Headroom"
              incidents={incidents}
              isLast
              render={(inc) => {
                const band = computeBand(inc.altPathHeadroom, inc.altPathThresholds);
                return <ValueCell value={`${inc.altPathHeadroom}%`} color={bandColor(band)} bg={bandBg(band)} badge={bandLabel(band)} />;
              }}
            />
          </tbody>
        </table>
      </div>

      {/* Per-incident links */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Open full detail:</span>
        {incidents.map((inc) => (
          <Link
            key={inc.id}
            to={`/incidents/${inc.id}`}
            className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ color: "var(--color-brand)" }}
          >
            {inc.ref}
            <ExternalLink size={11} />
          </Link>
        ))}
      </div>
    </div>
  );
}
