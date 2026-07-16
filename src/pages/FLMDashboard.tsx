import { useState } from "react";
import { Zap } from "lucide-react";

// Band 1 — What needs me now
import { PeeringKpiCard } from "../components/flm/PeeringKpiCard";
import { AttentionList } from "../components/flm/AttentionList";
// Band 3 — Where is it concentrated + what's the mix?
import { AlertsByASChart } from "../components/flm/AlertsByASChart";
import { CongestedRoutersChart } from "../components/flm/CongestedRoutersChart";
import { CapacityRiskPie } from "../components/flm/CapacityRiskPie";
import { CoordinationDonut } from "../components/flm/CoordinationDonut";
import { EventMatchPie } from "../components/flm/EventMatchPie";
// Band 2 — Traffic flow analytics
import { TrafficFlowAnalytics } from "../components/flm/flow-analytics/TrafficFlowAnalytics";

import { kpi } from "../data/peering-store";

// Fixed, auto-submitted Network Model queries — parameterised (not free-form) so
// results stay reproducible and match each card's definition.
const NM_QUERY_CONGESTED_PORTS =
  "What are the currently congested ports on the IP Peering network?";
const NM_QUERY_CRITICAL_BUILDOUT =
  "Which ports are at Critical build-out status on the IP Peering network?";

// Band 1 card definitions — maps store key → display title → nav destination.
// Alerts cards deep-link with a pre-applied, editable filter (Pattern 1);
// port cards deep-link into the Network Model chat with an auto-submitted
// query (Pattern 2) since ports aren't alerts and have no Alerts-page filter.
const BAND1_CARDS: {
  key: keyof typeof kpi;
  title: string;
  to: string;
  navState?: { autoQuery: string };
}[] = [
  { key: "activeSC1Alerts",       title: "Active Alerts",            to: "/alerts?status=active" },
  { key: "highSeverityAlerts",    title: "High Severity Alerts",     to: "/alerts?severity=high" },
  { key: "congestedPorts",        title: "Congested Ports",          to: "/network-model/ip-core", navState: { autoQuery: NM_QUERY_CONGESTED_PORTS } },
  { key: "criticalBuildoutPorts", title: "Critical Build-out Ports", to: "/network-model/ip-core", navState: { autoQuery: NM_QUERY_CRITICAL_BUILDOUT } },
  { key: "upcomingEvents",        title: "Upcoming Events",          to: "/events?status=upcoming" },
  { key: "highSeverityEvents",    title: "High Severity Events",     to: "/events?status=live&severity=high" },
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
          Live overview of IP Peering network health — alerts, events and capacity risk
        </p>
      </div>

      {/* ── Band 1 — KPI cards + Attention list ─────────────────────────────── */}
      <section>
        <div className="grid grid-cols-3 gap-4">
          {BAND1_CARDS.map(({ key, title, to, navState }) => (
            <PeeringKpiCard key={key} title={title} entry={kpi[key]} to={to} navState={navState} />
          ))}
        </div>
        <AttentionList />
      </section>

      {/* ── Band 2 — Traffic Flow Analytics (replaces Traffic Trend / Routing
          Instability) ────────────────────────────────────────────────────── */}
      <section>
        <TrafficFlowAnalytics />
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
