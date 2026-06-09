import { useState } from "react";

type Severity = "Critical" | "High" | "Predicted";

interface Alarm {
  id: string;
  ref: string;
  name: string;
  severity: Severity;
  affected: string;
  region: string;
  metric: string;
  raised: string;
}

const ALARMS: Alarm[] = [
  { id: "1", ref: "ALM-0042", name: "BGP Peer Loss",               severity: "Critical",  affected: "Peering path to AS1299",               region: "EU-CORE-02", metric: "Packet loss 4.2%",             raised: "14m ago"         },
  { id: "2", ref: "ALM-0043", name: "Link Utilisation Alert",      severity: "Critical",  affected: "Peering link EU-WEST to LINX London",  region: "EU-WEST-01", metric: "Utilization 92%",              raised: "Predicted (5m)"  },
  { id: "3", ref: "ALM-0044", name: "Transit Saturation Forecast", severity: "Critical",  affected: "EU-CENTRAL-B4 transit link",           region: "EU-WEST-01", metric: "Predicted 98% in 15m",         raised: "42m ago"         },
  { id: "4", ref: "ALM-0045", name: "BGP Session Flap",            severity: "High",      affected: "AS6762 — Telecom Italia",              region: "EU-WEST-01", metric: "12 flaps / 5m",                raised: "12m ago"         },
  { id: "5", ref: "ALM-0046", name: "Latency Threshold Breach",    severity: "Critical",  affected: "AMS-IX Amsterdam — Frankfurt transit", region: "EU-WEST-01", metric: "Latency +34ms (baseline 8ms)", raised: "6m ago"          },
  { id: "6", ref: "ALM-0047", name: "SLA Breach Predicted",        severity: "Predicted", affected: "AS3215 — France Telecom",              region: "EU-WEST-01", metric: "SLA breach in 22m",            raised: "Predicted (20m)" },
  { id: "7", ref: "ALM-0048", name: "SLA Risk — High",             severity: "High",      affected: "AS3215 — France Telecom",              region: "EU-WEST-01", metric: "SLA breach in 22m",            raised: "Predicted (8m)"  },
  { id: "8", ref: "ALM-0049", name: "SLA Breach Predicted",        severity: "Predicted", affected: "AS3215 — France Telecom",              region: "EU-WEST-01", metric: "SLA breach in 22m",            raised: "Predicted (16m)" },
];

const SEVERITY_STYLE: Record<Severity, { bg: string; color: string }> = {
  Critical:  { bg: "rgba(255,59,59,0.15)",   color: "var(--color-critical)"   },
  High:      { bg: "rgba(255,176,32,0.15)",  color: "var(--color-warning)"    },
  Predicted: { bg: "rgba(77,158,255,0.15)",  color: "var(--color-mitigating)" },
};

const TABS = [
  { key: "critical",  label: "Critical",  count: 3,  dot: "var(--color-critical)"   },
  { key: "predicted", label: "Predicted", count: 3,  dot: "var(--color-mitigating)" },
  { key: "high",      label: "High",      count: 2,  dot: "var(--color-warning)"    },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function Alarms() {
  const [activeTab, setActiveTab] = useState<TabKey>("critical");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);

  const filtered = ALARMS.filter((a) => a.severity.toLowerCase() === activeTab);

  function toggleAll() {
    if (allChecked) { setChecked(new Set()); setAllChecked(false); }
    else { setChecked(new Set(filtered.map((a) => a.id))); setAllChecked(true); }
  }

  function toggleRow(id: string) {
    const next = new Set(checked);
    next.has(id) ? next.delete(id) : next.add(id);
    setChecked(next);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>Alarms</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          Live feed — IP Peering — ranked by severity + SLA risk
        </p>
      </div>

      {/* Table card */}
      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-0" style={{ borderBottom: "1px solid var(--color-border)" }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md transition-colors relative"
                style={{
                  color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  borderBottom: isActive ? "2px solid var(--color-brand)" : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {tab.dot && (
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tab.dot }} />
                )}
                {tab.label}
                <span
                  className="text-[10px] font-bold px-1.5 py-px rounded-full"
                  style={{
                    backgroundColor: isActive ? "rgba(233,30,140,0.12)" : "rgba(255,255,255,0.06)",
                    color: isActive ? "var(--color-brand)" : "var(--color-text-muted)",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Column headers */}
        <div
          className="grid items-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest"
          style={{
            gridTemplateColumns: "32px 1fr 120px 200px 120px 180px 140px",
            borderBottom: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-3.5 h-3.5 accent-pink-500" />
          <span>Alarm type</span>
          <span>Severity</span>
          <span>Affected</span>
          <span>Region</span>
          <span>Metric</span>
          <span>Raised</span>
        </div>

        {/* Rows */}
        {filtered.map((alarm, i) => {
          const style = SEVERITY_STYLE[alarm.severity];
          const isChecked = checked.has(alarm.id);
          return (
            <div
              key={alarm.id}
              className="grid items-center px-4 py-4 hover:bg-white/5 transition-colors cursor-pointer"
              style={{
                gridTemplateColumns: "32px 1fr 120px 200px 120px 180px 140px",
                borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border)" : undefined,
                backgroundColor: isChecked ? "rgba(255,255,255,0.03)" : undefined,
              }}
              onClick={() => toggleRow(alarm.id)}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleRow(alarm.id)}
                onClick={(e) => e.stopPropagation()}
                className="w-3.5 h-3.5 accent-pink-500"
              />
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {alarm.name}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {alarm.ref}
                </p>
              </div>
              <div>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold"
                  style={{ backgroundColor: style.bg, color: style.color }}
                >
                  {alarm.severity}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{alarm.affected}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{alarm.region}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{alarm.metric}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{alarm.raised}</p>
            </div>
          );
        })}

        {/* Pagination */}
        <div className="flex items-center justify-end gap-3 px-4 py-3" style={{ borderTop: "1px solid var(--color-border)" }}>
          <button className="text-xs px-3 py-1.5 rounded-md transition-colors hover:bg-white/5" style={{ color: "var(--color-text-muted)" }}>
            Previous
          </button>
          <button
            className="text-xs px-3 py-1.5 rounded-md font-semibold"
            style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
          >
            2
          </button>
          <button className="text-xs px-3 py-1.5 rounded-md transition-colors hover:bg-white/5" style={{ color: "var(--color-text-muted)" }}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
