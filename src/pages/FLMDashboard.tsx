import { useState } from "react";
import { Zap } from "lucide-react";

// Band 1 — What needs me now
import { PeeringKpiCard } from "../components/flm/PeeringKpiCard";
import { AttentionList } from "../components/flm/AttentionList";
// Band 2 — Is it getting worse?
import { TrafficTrendChart } from "../components/flm/TrafficTrendChart";
import { RoutingInstabilityChart } from "../components/flm/RoutingInstabilityChart";
// Band 3 — Where is it concentrated + what's the mix?
import { AlertsByASChart } from "../components/flm/AlertsByASChart";
import { CongestedRoutersChart } from "../components/flm/CongestedRoutersChart";
import { CapacityRiskPie } from "../components/flm/CapacityRiskPie";
import { CoordinationDonut } from "../components/flm/CoordinationDonut";
import { EventMatchPie } from "../components/flm/EventMatchPie";
// Band 4 — What's coming
import { LookingAhead } from "../components/flm/LookingAhead";

import { kpi } from "../data/peering-store";

// Band 1 card definitions — maps store key → display title → nav destination
const BAND1_CARDS: { key: keyof typeof kpi; title: string; to: string }[] = [
  { key: "activeSC1Alerts",       title: "Active Alerts",            to: "/alerts"   },
  { key: "highSeverityAlerts",    title: "High Severity Alerts",     to: "/alerts"   },
  { key: "congestedPorts",        title: "Congested Ports",          to: "/topology" },
  { key: "criticalBuildoutPorts", title: "Critical Build-out Ports", to: "/alerts"   },
  { key: "activeChangeTickets",   title: "Active Change Tickets",    to: "/alerts"   },
];

export default function FLMDashboard() {
  const [fabHovered, setFabHovered] = useState(false);

  return (
    <div className="space-y-8">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div>
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Dashboard
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          Live overview of IP Peering network health — alerts, traffic trends and capacity risk
        </p>
      </div>

      {/* ── Band 1 — KPI cards + Attention list ─────────────────────────────── */}
      <section>
        <div className="grid grid-cols-5 gap-4">
          {BAND1_CARDS.map(({ key, title, to }) => (
            <PeeringKpiCard key={key} title={title} entry={kpi[key]} to={to} />
          ))}
        </div>
        <AttentionList />
      </section>

      {/* ── Band 2 — Traffic trend + Routing instability ─────────────────────── */}
      <section>
        <div className="grid grid-cols-2 gap-4">
          <TrafficTrendChart />
          <RoutingInstabilityChart />
        </div>
      </section>

      {/* ── Band 3 — Distribution charts ─────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <AlertsByASChart />
          <CongestedRoutersChart />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <CapacityRiskPie />
          <CoordinationDonut />
          <EventMatchPie />
        </div>
      </section>

      {/* ── Band 4 — Looking ahead ───────────────────────────────────────────── */}
      <section>
        <LookingAhead />
      </section>

      {/* ── FAB: Quick Dispatch ──────────────────────────────────────────────── */}
      <div
        className="fixed bottom-6 right-6 z-50"
        onMouseEnter={() => setFabHovered(true)}
        onMouseLeave={() => setFabHovered(false)}
      >
        <button
          className="flex items-center gap-2 rounded-full transition-all duration-200"
          style={{
            backgroundColor: "var(--color-brand)",
            color: "#fff",
            padding: fabHovered ? "10px 18px" : "12px",
            boxShadow: "0 4px 24px rgba(233,30,140,0.4)",
          }}
        >
          <Zap size={16} strokeWidth={2.5} />
          {fabHovered && (
            <span className="text-xs font-semibold whitespace-nowrap">
              Quick Dispatch
            </span>
          )}
        </button>
      </div>

    </div>
  );
}
