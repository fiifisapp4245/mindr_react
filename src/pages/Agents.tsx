import { useScenario } from "../contexts/scenario";
import { S2AgentRuntime } from "../components/s2/AgentRuntime";
import { useState } from "react";
import { motion } from "framer-motion";
import { kpiCard, kpiValue, transFast } from "../lib/animations";
import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Bot, CheckCircle2, Gauge, Plus, Rocket, Target,
  TrendingDown, X, Zap,
} from "lucide-react";
import { useAgents } from "../hooks/use-agents";
import { AgentCard } from "../components/agents/AgentCard";
import { PerfTooltip } from "../components/agents/PerfTooltip";

const LAYERS = [
  "Surveillance Layer",
  "Diagnostic Layer",
  "Execution Layer",
  "Forecasting Layer",
  "Management Layer",
  "Ethics & Governance",
];

const AGENT_TYPES = [
  "Anomaly Detection",
  "Root Cause Analysis",
  "Auto Resolution",
  "Predictive Forecasting",
  "Load Orchestration",
  "Policy Enforcement",
];

const ZONES = ["EU-WEST", "EU-CENTRAL", "US-EAST", "US-WEST", "APAC", "LATAM", "GLOBAL"];

export default function Agents() {
  const { activeScenario } = useScenario();
  if (activeScenario.id === "s2") return <S2AgentRuntime />;

  const { agents, perfData } = useAgents();

  const [showDeploy,   setShowDeploy]   = useState(false);
  const [deployName,   setDeployName]   = useState("");
  const [deployLayer,  setDeployLayer]  = useState(LAYERS[0]);
  const [deployType,   setDeployType]   = useState(AGENT_TYPES[0]);
  const [deployZones,  setDeployZones]  = useState<string[]>(["EU-WEST"]);
  const [deployConf,   setDeployConf]   = useState(90);
  const [deployTasks,  setDeployTasks]  = useState(50);
  const [deployAuto,   setDeployAuto]   = useState(true);
  const [deployPolicy, setDeployPolicy] = useState(true);
  const [deploying,    setDeploying]    = useState(false);
  const [deployDone,   setDeployDone]   = useState(false);

  function toggleZone(z: string) {
    setDeployZones((prev) =>
      prev.includes(z) ? prev.filter((x) => x !== z) : [...prev, z]
    );
  }

  function handleDeploy() {
    if (!deployName.trim()) return;
    setDeploying(true);
    setTimeout(() => {
      setDeploying(false);
      setDeployDone(true);
      setTimeout(() => { setDeployDone(false); setShowDeploy(false); setDeployName(""); }, 2000);
    }, 1800);
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Agent Runtime
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Multi-agent AI layer monitoring and performance.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div initial="rest" whileHover="hover" variants={kpiCard} className="kpi-card rounded-lg p-5 flex flex-col gap-2" style={{ backgroundColor: "var(--color-bg-card)", borderWidth: 1, borderStyle: "solid" }}>
            <div className="flex items-center justify-between">
              <Bot size={14} style={{ color: "var(--color-brand)" }} />
              <span className="text-[10px] font-semibold" style={{ color: "var(--color-resolved)" }}>+2.4%</span>
            </div>
            <motion.p className="text-3xl font-bold tabular-nums" variants={kpiValue}>5/6</motion.p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Active Agents</p>
          </motion.div>

          <motion.div initial="rest" whileHover="hover" variants={kpiCard} className="kpi-card rounded-lg p-5 flex flex-col gap-2" style={{ backgroundColor: "var(--color-bg-card)", borderWidth: 1, borderStyle: "solid" }}>
            <div className="flex items-center justify-between">
              <Zap size={14} style={{ color: "var(--color-brand)" }} />
              <span className="text-[10px] font-semibold" style={{ color: "var(--color-resolved)" }}>+12%</span>
            </div>
            <motion.p className="text-3xl font-bold tabular-nums" variants={kpiValue}>71</motion.p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Total Tasks</p>
          </motion.div>

          <motion.div initial="rest" whileHover="hover" variants={kpiCard} className="kpi-card rounded-lg p-5 flex flex-col gap-2" style={{ backgroundColor: "var(--color-bg-card)", borderWidth: 1, borderStyle: "solid" }}>
            <div className="flex items-center justify-between">
              <Target size={14} style={{ color: "var(--color-brand)" }} />
              <span className="text-[10px] font-semibold px-1.5 py-px rounded" style={{ color: "var(--color-mitigating)", backgroundColor: "rgba(77,158,255,0.12)" }}>Stable</span>
            </div>
            <motion.p className="text-3xl font-bold tabular-nums" variants={kpiValue}>94%</motion.p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Avg Confidence</p>
          </motion.div>

          <motion.div initial="rest" whileHover="hover" variants={kpiCard} className="kpi-card rounded-lg p-5 flex flex-col gap-2" style={{ backgroundColor: "var(--color-bg-card)", borderWidth: 1, borderStyle: "solid" }}>
            <div className="flex items-center justify-between">
              <Gauge size={14} style={{ color: "var(--color-brand)" }} />
              <span className="flex items-center gap-0.5 text-[10px] font-semibold" style={{ color: "var(--color-resolved)" }}>
                <TrendingDown size={9} />−14ms
              </span>
            </div>
            <motion.p className="text-3xl font-bold tabular-nums" variants={kpiValue}>190ms</motion.p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Avg Latency</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.015, borderColor: "rgba(233,30,140,0.35)", backgroundColor: "rgba(233,30,140,0.04)" }}
            transition={transFast}
            onClick={() => { setShowDeploy(true); setDeployDone(false); }}
            className="rounded-lg p-5 flex flex-col items-center justify-center gap-2 cursor-pointer"
            style={{ borderWidth: 1.5, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.14)" }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ border: "1.5px solid rgba(233,30,140,0.35)", backgroundColor: "rgba(233,30,140,0.08)" }}
            >
              <Plus size={16} style={{ color: "var(--color-brand)" }} />
            </div>
            <p className="text-xs font-semibold" style={{ color: "var(--color-brand)" }}>Deploy New</p>
            <p className="text-[9px] text-center" style={{ color: "var(--color-text-muted)" }}>Launch a new agent</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>

        <div className="rounded-lg p-5" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Agent Performance (Latency ms)
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                Cross-layer response time telemetry — drag the range bar to zoom.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-brand)" }} />
                GLOBAL LATENCY
              </div>
              <button
                className="px-2.5 py-1 rounded-md text-[10px] font-medium"
                style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
              >
                Last 6 Hours
              </button>
            </div>
          </div>

          <div style={{ position: "relative", height: 270 }}>
            <ResponsiveContainer width="100%" height={270}>
              <AreaChart data={perfData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E91E8C" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#E91E8C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="t"
                  tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 50]}
                  ticks={[0, 10, 20, 30, 40, 50]}
                  tickFormatter={(v) => `${v}ms`}
                  tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  content={<PerfTooltip />}
                  cursor={{ stroke: "rgba(255,255,255,0.07)", strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="ms"
                  stroke="var(--color-brand)"
                  strokeWidth={2}
                  fill="url(#perfGrad)"
                  dot={false}
                  activeDot={{ r: 3, fill: "var(--color-brand)", strokeWidth: 0 }}
                />
                <Brush
                  dataKey="t"
                  height={28}
                  travellerWidth={8}
                  stroke="rgba(255,255,255,0.12)"
                  fill="var(--color-bg-elevated)"
                  gap={1}
                />
              </AreaChart>
            </ResponsiveContainer>

            <div
              style={{ position: "absolute", left: "60%", top: 4, transform: "translateX(-50%)", pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <div className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
                <p className="uppercase tracking-widest mb-0.5" style={{ fontSize: 9, color: "var(--color-text-muted)" }}>Peak Load</p>
                <p className="font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>40ms / 2.4k req</p>
              </div>
              <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)" }} />
            </div>
          </div>
        </div>
      </div>

      {showDeploy && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeploy(false); }}
        >
          <div
            className="rounded-2xl overflow-hidden flex flex-col"
            style={{
              width: 540,
              maxHeight: "90vh",
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
            }}
          >
            <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(233,30,140,0.12)" }}>
                  <Rocket size={18} style={{ color: "var(--color-brand)" }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>Deploy New Agent</p>
                  <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>Configure and launch a new autonomous agent</p>
                </div>
              </div>
              <button onClick={() => setShowDeploy(false)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "var(--color-text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5" style={{ scrollbarWidth: "thin" }}>
              {deployDone ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(45,212,191,0.12)" }}>
                    <CheckCircle2 size={28} style={{ color: "var(--color-resolved)" }} />
                  </div>
                  <p className="text-base font-bold" style={{ color: "var(--color-resolved)" }}>Agent Deployed</p>
                  <p className="text-sm text-center" style={{ color: "var(--color-text-muted)" }}>
                    <strong style={{ color: "var(--color-text-primary)" }}>{deployName}</strong> is initialising and will be online within 30s.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                      Agent Name <span style={{ color: "var(--color-critical)" }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. EU-MONITOR-07"
                      value={deployName}
                      onChange={(e) => setDeployName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                      style={{
                        backgroundColor: "var(--color-bg-card)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-primary)",
                        fontFamily: "var(--font-mono)",
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-text-muted)" }}>Layer</label>
                      <select
                        value={deployLayer}
                        onChange={(e) => setDeployLayer(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                        style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
                      >
                        {LAYERS.map((l) => <option key={l} value={l} style={{ backgroundColor: "var(--color-bg-elevated)" }}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-text-muted)" }}>Agent Type</label>
                      <select
                        value={deployType}
                        onChange={(e) => setDeployType(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                        style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
                      >
                        {AGENT_TYPES.map((t) => <option key={t} value={t} style={{ backgroundColor: "var(--color-bg-elevated)" }}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-text-muted)" }}>Deployment Zones</label>
                    <div className="flex flex-wrap gap-2">
                      {ZONES.map((z) => {
                        const active = deployZones.includes(z);
                        return (
                          <button
                            key={z}
                            onClick={() => toggleZone(z)}
                            className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                            style={{
                              backgroundColor: active ? "rgba(233,30,140,0.12)" : "var(--color-bg-card)",
                              border: `1px solid ${active ? "var(--color-brand)" : "var(--color-border)"}`,
                              color: active ? "var(--color-brand)" : "var(--color-text-muted)",
                            }}
                          >
                            {z}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                        Confidence Threshold: {deployConf}%
                      </label>
                      <input
                        type="range"
                        min={50} max={99} step={1}
                        value={deployConf}
                        onChange={(e) => setDeployConf(Number(e.target.value))}
                        className="w-full"
                        style={{ accentColor: "var(--color-brand)" }}
                      />
                      <div className="flex justify-between mt-0.5">
                        <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>50%</span>
                        <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>99%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-text-muted)" }}>Max Concurrent Tasks</label>
                      <input
                        type="number"
                        min={1} max={200}
                        value={deployTasks}
                        onChange={(e) => setDeployTasks(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                        style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: "Auto-restart on failure", sub: "Agent restarts automatically if it crashes", val: deployAuto, set: setDeployAuto },
                      { label: "Policy validation enabled", sub: "All actions pass through Safety Guardian", val: deployPolicy, set: setDeployPolicy },
                    ].map(({ label, sub, val, set }) => (
                      <div key={label} className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</p>
                          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{sub}</p>
                        </div>
                        <button
                          onClick={() => set((v) => !v)}
                          className="relative w-10 h-5 rounded-full transition-colors shrink-0"
                          style={{ backgroundColor: val ? "var(--color-brand)" : "rgba(255,255,255,0.12)" }}
                        >
                          <span
                            className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                            style={{ left: val ? "calc(100% - 18px)" : "2px" }}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {!deployDone && (
              <div className="flex gap-3 px-6 py-4 shrink-0" style={{ borderTop: "1px solid var(--color-border)" }}>
                <button
                  onClick={() => setShowDeploy(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
                  style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeploy}
                  disabled={!deployName.trim() || deploying}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
                >
                  <Rocket size={14} />
                  {deploying ? "Deploying…" : "Deploy Agent"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
