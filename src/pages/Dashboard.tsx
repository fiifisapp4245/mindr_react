import { useState } from "react";
import { motion } from "framer-motion";
import { Link, Navigate } from "react-router-dom";
import { useDomain } from "../contexts/domain";
import { kpiCard, kpiValue } from "../lib/animations";
import { Activity, TrendingDown, Zap } from "lucide-react";
import { useDashboard } from "../hooks/use-dashboard";
import { Badge } from "../components/ui/badge";
import { HealthTrendChart } from "../components/dashboard/HealthTrendChart";
import { AgentActivity } from "../components/dashboard/AgentActivity";
import { IncidentRow } from "../components/dashboard/IncidentRow";
import { useScenario } from "../contexts/scenario";
import { CxiDashboard } from "../components/s2/CxiDashboard";

function AdminDashboardView() {
  const { recentIncidents } = useDashboard();
  const [fabHovered, setFabHovered] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Multi-Intelligent Network Diagnosis &amp; Remediation
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-6 gap-4">
        <motion.div
          initial="rest" whileHover="hover" variants={kpiCard}
          className="kpi-card rounded-lg p-5 flex flex-col gap-2"
          style={{ backgroundColor: "var(--color-bg-card)", borderWidth: 1, borderStyle: "solid" }}
        >
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
            System Health
          </p>
          <motion.p className="text-3xl font-bold tabular-nums" variants={kpiValue}>87.2%</motion.p>
          <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full" style={{ width: "87.2%", backgroundColor: "var(--color-resolved)" }} />
          </div>
          <p className="text-xs flex items-center gap-1" style={{ color: "var(--color-resolved)" }}>
            <Activity size={10} />
            +0.4% in last 1H
          </p>
        </motion.div>

        <motion.div
          initial="rest" whileHover="hover" variants={kpiCard}
          className="kpi-card rounded-lg p-5 flex flex-col gap-2"
          style={{ backgroundColor: "var(--color-bg-card)", borderWidth: 1, borderStyle: "solid" }}
        >
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
            Active Incidents
          </p>
          <motion.p className="text-3xl font-bold tabular-nums" variants={kpiValue}>3</motion.p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge className="text-[10px]" style={{ color: "var(--color-critical)", backgroundColor: "rgba(255,59,59,0.12)" }}>1 CRITICAL</Badge>
            <Badge className="text-[10px]" style={{ color: "var(--color-warning)", backgroundColor: "rgba(255,176,32,0.12)" }}>1 PREDICTED</Badge>
            <Badge className="text-[10px]" style={{ color: "var(--color-mitigating)", backgroundColor: "rgba(77,158,255,0.12)" }}>1 MITIGATING</Badge>
          </div>
        </motion.div>

        <motion.div
          initial="rest" whileHover="hover" variants={kpiCard}
          className="kpi-card rounded-lg p-5 flex flex-col gap-2"
          style={{ backgroundColor: "var(--color-bg-card)", borderWidth: 1, borderStyle: "solid" }}
        >
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
            MINDR Resolutions
          </p>
          <motion.p className="text-3xl font-bold tabular-nums" variants={kpiValue}>14</motion.p>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Last 24 hours</p>
        </motion.div>

        <motion.div
          initial="rest" whileHover="hover" variants={kpiCard}
          className="kpi-card rounded-lg p-5 flex flex-col gap-2"
          style={{ backgroundColor: "var(--color-bg-card)", borderWidth: 1, borderStyle: "solid" }}
        >
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
            Affected Users
          </p>
          <motion.p className="text-3xl font-bold tabular-nums" variants={kpiValue}>352K</motion.p>
          <p className="text-xs flex items-center gap-1" style={{ color: "var(--color-resolved)" }}>
            <TrendingDown size={10} />
            ↓ 12K fewer affected (last 1H)
          </p>
        </motion.div>

        <motion.div
          initial="rest" whileHover="hover" variants={kpiCard}
          className="kpi-card rounded-lg p-5 flex flex-col gap-2"
          style={{ backgroundColor: "var(--color-bg-card)", borderWidth: 1, borderStyle: "solid" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
              AI Confidence
            </p>
            <Badge className="text-[10px]" style={{ color: "var(--color-mitigating)", backgroundColor: "rgba(77,158,255,0.12)" }}>
              STABLE
            </Badge>
          </div>
          <motion.p className="text-3xl font-bold tabular-nums" variants={kpiValue}>94.2%</motion.p>
          <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full" style={{ width: "94.2%", backgroundColor: "var(--color-mitigating)" }} />
          </div>
        </motion.div>

        <motion.div
          initial="rest" whileHover="hover" variants={kpiCard}
          className="kpi-card rounded-lg p-5 flex flex-col gap-2"
          style={{ backgroundColor: "var(--color-bg-card)", borderWidth: 1, borderStyle: "solid" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
              MTTR Reduction
            </p>
            <Badge className="text-[10px]" style={{ color: "var(--color-text-muted)", border: "1px solid var(--color-border)", backgroundColor: "transparent" }}>
              BENCHMARK
            </Badge>
          </div>
          <motion.p className="text-3xl font-bold tabular-nums" variants={kpiValue}>68%</motion.p>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Against baseline</p>
        </motion.div>
      </div>

      {/* Chart + agent load */}
      <div className="flex gap-4" style={{ height: 340 }}>
        <HealthTrendChart />
        <AgentActivity />
      </div>

      {/* Recent Incidents */}
      <div className="rounded-lg" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
            Recent Incidents
          </p>
          <Link to="/alerts" className="text-xs font-medium transition-opacity hover:opacity-80" style={{ color: "var(--color-brand)" }}>
            View All Records →
          </Link>
        </div>
        <div className="px-2 pb-2">
          {recentIncidents.map((inc, i) => (
            <IncidentRow key={inc.id} incident={inc} isLast={i === recentIncidents.length - 1} />
          ))}
        </div>
      </div>

      {/* FAB */}
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
          {fabHovered && <span className="text-xs font-semibold whitespace-nowrap">Quick Dispatch</span>}
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { activeDomain } = useDomain();
  const { activeScenario } = useScenario();
  if (activeDomain === "all") return <Navigate to="/overview" replace />;
  if (activeScenario.id === "s2") return <CxiDashboard />;
  return <AdminDashboardView />;
}
