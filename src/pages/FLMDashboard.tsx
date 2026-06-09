import { Link } from "react-router-dom";

const WHATS_NEEDED = [
  {
    id: "INC-8422",
    label: "[INC-2853] AS3320 peer at DE-IX Frankfurt",
    severity: "Critical",
    sla: "SLA: 19m remaining",
    age: "2m ago",
  },
  {
    id: "INC-8423",
    label: "[INC-2847] Peering link EU-CORE-01 → AS5413",
    severity: "Critical",
    sla: "SLA: 22m remaining",
    age: "15m ago",
  },
  {
    id: "INC-8424",
    label: "Packet Loss Threshold Exceeded",
    severity: "Critical",
    sla: "Peering path to AS1299",
    age: "5m ago",
  },
];

const LOOKING_AHEAD = [
  { label: "95% SLA breach predicted", severity: "Critical", eta: "15m", node: "EU-CENTRAL-B4" },
  { label: "AS3215 SLA breach risk",   severity: "Critical", eta: "22m", node: "EU-WEST-02"    },
  { label: "Transit saturation risk",  severity: "Critical", eta: "38m", node: "EU-CORE-01"    },
];

const REGION_HEALTH = [
  { region: "EU-CORE",  status: "1 active incident"    },
  { region: "EU-WEST",  status: "1 alarm active"       },
  { region: "EU-WEST",  status: "Saturation predicted" },
  { region: "EU-SOUTH", status: "Route flap detected"  },
];

function SeverityBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold"
      style={{ backgroundColor: "rgba(255,59,59,0.12)", color: "var(--color-critical)" }}
    >
      {label}
    </span>
  );
}

export default function FLMDashboard() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            IP Peering — Shift B — M. Weber — 09:24 UTC
          </p>
        </div>
        <Link
          to="/incidents"
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
        >
          View all alarms
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Active Alarms",
            value: "6",
            sub: "1 critical",
            subColor: "var(--color-critical)",
            icon: "⏰",
          },
          {
            label: "Incidents",
            value: "2",
            sub: "2 open critical",
            subColor: "var(--color-critical)",
            icon: "⚡",
          },
          {
            label: "SLA At Risk",
            value: "2",
            sub: "< 30 min remaining",
            subColor: "var(--color-text-muted)",
            icon: "⏱",
          },
          {
            label: "Avg Resolution Time",
            value: "14m",
            sub: "vs 18m shift avg",
            subColor: "var(--color-text-muted)",
            icon: "↗",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg p-5 flex flex-col gap-2"
            style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>{card.icon}</span>
              <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{card.label}</p>
            </div>
            <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>
              {card.value}
            </p>
            <p className="text-xs font-medium" style={{ color: card.subColor }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* What's needed */}
      <div
        className="rounded-lg"
        style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>What's needed</p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Ranked by severity + SLA risk</p>
        </div>
        {WHATS_NEEDED.map((inc, i) => (
          <Link
            key={inc.id}
            to="/incidents"
            className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
            style={{ borderBottom: i < WHATS_NEEDED.length - 1 ? "1px solid var(--color-border)" : undefined }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{inc.label}</p>
                  <SeverityBadge label={inc.severity} />
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{inc.sla}</p>
              </div>
            </div>
            <div className="text-right shrink-0 ml-8">
              <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{inc.id}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{inc.age}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Looking ahead + Region Health */}
      <div className="grid grid-cols-2 gap-4">
        {/* Looking ahead */}
        <div
          className="rounded-lg"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Looking ahead</p>
          </div>
          {LOOKING_AHEAD.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: i < LOOKING_AHEAD.length - 1 ? "1px solid var(--color-border)" : undefined }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{item.label}</p>
                  <SeverityBadge label={item.severity} />
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{item.node}</p>
              </div>
              <p className="text-sm font-semibold tabular-nums shrink-0 ml-6" style={{ color: "var(--color-text-muted)" }}>
                {item.eta}
              </p>
            </div>
          ))}
        </div>

        {/* Region Health */}
        <div
          className="rounded-lg"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Region Health</p>
          </div>
          {REGION_HEALTH.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: i < REGION_HEALTH.length - 1 ? "1px solid var(--color-border)" : undefined }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{item.region}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{item.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
