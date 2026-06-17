import { useState } from "react";
import { Download } from "lucide-react";

type Status   = "Resolved" | "Escalated";
type Severity = "Critical" | "High" | "Medium";

interface ShiftIncident {
  id: string;
  ref: string;
  title: string;
  region: string;
  affected: string;
  status: Status;
  severity: Severity;
  resolved: string;
  duration: string;
}

const INCIDENTS: ShiftIncident[] = [
  { id: "1", ref: "#INC-4921", title: "Core Network Overload – EU-West",          region: "EU-WEST-01 (Frankfurt)",  affected: "EU-WEST-01 → LINX",       status: "Resolved",  severity: "Critical", resolved: "06:41",    duration: "14m" },
  { id: "2", ref: "#INC-4925", title: "5G Slice SLA Breach Risk",                  region: "EU-Central (Berlin)",     affected: "AS5413 peer DE-CIX",       status: "Resolved",  severity: "Critical", resolved: "07:14",    duration: "5m"  },
  { id: "3", ref: "#INC-4918", title: "CDN Cache Miss Rate Spike",                 region: "Global CDN",              affected: "EU-CORE-02 → AS1299",      status: "Resolved",  severity: "Critical", resolved: "07:52",    duration: "42m" },
  { id: "4", ref: "#INC-4930", title: "5G NR Core Slice Failure – APAC-south",    region: "APAC-SOUTH (Singapore)",  affected: "AMS-IX transit",           status: "Resolved",  severity: "High",     resolved: "08:31",    duration: "12m" },
  { id: "5", ref: "#INC-4927", title: "BGP Session Collapse – US-East-1 Peering", region: "US-EAST-1 (Virginia)",    affected: "AS6762 → Telecom Italia",  status: "Escalated", severity: "Critical", resolved: "09:22",    duration: "6m"  },
  { id: "6", ref: "#INC-4933", title: "Storage Node Capacity Breach – EU-Central",region: "EU-CENTRAL (Frankfurt)",  affected: "AS3215 France Telecom",    status: "Resolved",  severity: "Medium",   resolved: "10:05",    duration: "20m" },
  { id: "7", ref: "#INC-4935", title: "Backhaul Link Saturation Forecast – LATAM-02", region: "LATAM-02 (Sao Paulo)",affected: "EU-CENTRAL-A2",            status: "Escalated", severity: "High",     resolved: "11:38",    duration: "8m"  },
  { id: "8", ref: "#INC-4920", title: "DNS Resolution Latency – Global CDN Tier", region: "Global CDN",              affected: "AS3215 France Telecom",    status: "Resolved",  severity: "Medium",   resolved: "58m 02s",  duration: "16m" },
  { id: "9", ref: "#INC-4919", title: "Core Network Overload – EU-East",          region: "EU-EAST-01 (Frankfurt)",  affected: "EU-CENTRAL-A2",            status: "Escalated", severity: "Critical", resolved: "16m 03s",  duration: "58m" },
];

const STATUS_STYLE: Record<Status, { bg: string; color: string }> = {
  Resolved: { bg: "rgba(34,197,94,0.12)",  color: "#22c55e" },
  Escalated:{ bg: "rgba(77,158,255,0.12)", color: "var(--color-mitigating)" },
};

const SEVERITY_STYLE: Record<Severity, { bg: string; color: string }> = {
  Critical: { bg: "rgba(255,59,59,0.12)",  color: "var(--color-critical)" },
  High:     { bg: "rgba(255,176,32,0.12)", color: "var(--color-warning)"  },
  Medium:   { bg: "rgba(77,158,255,0.12)", color: "var(--color-mitigating)" },
};

function Badge({ label, style }: { label: string; style: { bg: string; color: string } }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {label}
    </span>
  );
}

export default function FLMReports() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);

  function toggleAll() {
    if (allChecked) { setChecked(new Set()); setAllChecked(false); }
    else { setChecked(new Set(INCIDENTS.map((i) => i.id))); setAllChecked(true); }
  }

  function toggleRow(id: string) {
    const next = new Set(checked);
    next.has(id) ? next.delete(id) : next.add(id);
    setChecked(next);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Shift Report
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Shift B handover summary — IP Peering · 2026-06-04 06:00–14:00 UTC
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
        >
          <Download size={14} />
          Export Handover PDF
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div
          className="rounded-lg p-5 space-y-2"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Incidents Resolved</p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>6</p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>This shift (06:00–14:00 UTC)</p>
        </div>

        <div
          className="rounded-lg p-5 space-y-2"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Avg Resolution Time</p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>14m 22s</p>
          <p className="text-xs font-medium" style={{ color: "#22c55e" }}>vs 18m 05s shift target</p>
        </div>

        <div
          className="rounded-lg p-5 space-y-2"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>SLA Compliance</p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>94.3%</p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>7/7 incidents within SLA</p>
        </div>

        <div
          className="rounded-lg p-5 space-y-2"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Escalations</p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>1</p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>1 to L2 · 0 to L3</p>
        </div>
      </div>

      {/* Incident table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
      >
        {/* Column headers */}
        <div
          className="grid items-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest"
          style={{
            gridTemplateColumns: "32px 100px 1fr 180px 110px 100px 90px 80px",
            borderBottom: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-3.5 h-3.5 accent-pink-500" />
          <span>Ref</span>
          <span>Title / Region</span>
          <span>Affected</span>
          <span>Status</span>
          <span>Severity</span>
          <span>Resolved</span>
          <span>Duration</span>
        </div>

        {/* Rows */}
        {INCIDENTS.map((inc, i) => {
          const isChecked = checked.has(inc.id);
          return (
            <div
              key={inc.id}
              className="grid items-center px-4 py-3.5 hover:bg-white/5 transition-colors cursor-pointer"
              style={{
                gridTemplateColumns: "32px 100px 1fr 180px 110px 100px 90px 80px",
                borderBottom: i < INCIDENTS.length - 1 ? "1px solid var(--color-border)" : undefined,
                backgroundColor: isChecked ? "rgba(255,255,255,0.03)" : undefined,
              }}
              onClick={() => toggleRow(inc.id)}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleRow(inc.id)}
                onClick={(e) => e.stopPropagation()}
                className="w-3.5 h-3.5 accent-pink-500"
              />
              <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{inc.ref}</p>
              <div className="min-w-0 pr-4">
                <p className="text-xs font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{inc.title}</p>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>{inc.region}</p>
              </div>
              <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{inc.affected}</p>
              <Badge label={inc.status}   style={STATUS_STYLE[inc.status]}     />
              <Badge label={inc.severity} style={SEVERITY_STYLE[inc.severity]} />
              <p className="text-xs tabular-nums" style={{ color: "var(--color-text-muted)" }}>{inc.resolved}</p>
              <p className="text-xs tabular-nums" style={{ color: "var(--color-text-muted)" }}>{inc.duration}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
