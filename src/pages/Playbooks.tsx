import { useState } from "react";
import { Search } from "lucide-react";

type Category = "Routing" | "Traffic Management" | "Physical Layer" | "Security" | "Network Services" | "Performance";

interface Playbook {
  id: string;
  category: Category;
  triggers: [string, string];
  timeRange: string;
  steps: number;
}

const PLAYBOOKS: Playbook[] = [
  { id: "PB-001", category: "Routing",           triggers: ["BGP Session Down",          "BGP Session Flapping"          ], timeRange: "5–10 min",  steps: 8 },
  { id: "PB-002", category: "Routing",           triggers: ["OSPF Neighbor Lost",        "LSA Flooding Delay"            ], timeRange: "3–7 min",   steps: 6 },
  { id: "PB-003", category: "Physical Layer",    triggers: ["Interface Down",            "Cable or SFP Issue"            ], timeRange: "10–15 min", steps: 5 },
  { id: "PB-004", category: "Security",          triggers: ["Port Shutdown",             "Unauthorized Device Connected" ], timeRange: "2–5 min",   steps: 7 },
  { id: "PB-005", category: "Security",          triggers: ["Traffic Blocked Unexpectedly", "Rule Overlap or Conflict"   ], timeRange: "9–12 min",  steps: 9 },
  { id: "PB-006", category: "Network Services",  triggers: ["Clients Not Receiving IP",  "Server Down or Network Partition"], timeRange: "5–8 min", steps: 6 },
  { id: "PB-007", category: "Network Services",  triggers: ["Name Lookup Fails",         "DNS Server Configuration Error"], timeRange: "4–6 min",  steps: 7 },
  { id: "PB-008", category: "Performance",       triggers: ["Packet Processing Delay",   "Routing Loop or Flooding"      ], timeRange: "7–10 min",  steps: 8 },
];

const TAB_FILTERS = [
  { key: "routing",           label: "Routing",           count: 3 },
  { key: "traffic management",label: "Traffic Management",count: 3 },
  { key: "troubleshooting",   label: "Troubleshooting",   count: 2 },
] as const;

type TabKey = typeof TAB_FILTERS[number]["key"];

const TROUBLESHOOTING: Category[] = ["Physical Layer", "Security"];

function matchesTab(pb: Playbook, tab: TabKey): boolean {
  if (tab === "routing") return pb.category === "Routing";
  if (tab === "traffic management") return pb.category === "Network Services" || pb.category === "Performance";
  if (tab === "troubleshooting") return TROUBLESHOOTING.includes(pb.category);
  return false;
}

export default function Playbooks() {
  const [activeTab, setActiveTab] = useState<TabKey>("routing");
  const [search, setSearch] = useState("");

  const filtered = PLAYBOOKS.filter(
    (pb) =>
      matchesTab(pb, activeTab) &&
      (search === "" ||
        pb.id.toLowerCase().includes(search.toLowerCase()) ||
        pb.category.toLowerCase().includes(search.toLowerCase()) ||
        pb.triggers.some((t) => t.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>Playbooks</h1>

      {/* Search */}
      <div
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg"
        style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
      >
        <Search size={14} style={{ color: "var(--color-text-muted)" }} />
        <input
          type="text"
          placeholder="Search procedures..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "var(--color-text-primary)" }}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {TAB_FILTERS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: isActive ? "var(--color-brand)" : "var(--color-bg-card)",
                color: isActive ? "#fff" : "var(--color-text-muted)",
                border: `1px solid ${isActive ? "var(--color-brand)" : "var(--color-border)"}`,
              }}
            >
              {tab.label}
              <span
                className="text-[10px] font-bold px-1.5 py-px rounded-full"
                style={{
                  backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)",
                  color: isActive ? "#fff" : "var(--color-text-muted)",
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Playbook list */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        {filtered.map((pb, i) => (
          <div
            key={pb.id}
            className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer"
            style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border)" : undefined }}
          >
            {/* Left: ID + category */}
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold shrink-0 tracking-wide"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)" }}
              >
                {pb.id}
              </span>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{pb.category}</span>
            </div>

            {/* Centre: trigger tags */}
            <div className="flex items-center gap-2 mx-6">
              {pb.triggers.map((trigger) => (
                <span
                  key={trigger}
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium"
                  style={{ backgroundColor: "rgba(77,158,255,0.12)", color: "var(--color-mitigating)" }}
                >
                  {trigger}
                </span>
              ))}
            </div>

            {/* Right: time + steps */}
            <p className="text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>
              {pb.timeRange} · {pb.steps} steps
            </p>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="px-5 py-8 text-sm text-center" style={{ color: "var(--color-text-muted)" }}>
            No playbooks match "{search}"
          </p>
        )}
      </div>
    </div>
  );
}
