import { useScenario } from "../contexts/scenario";
import { CxiTopology } from "../components/s2/CxiTopology";
import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { Link } from "react-router-dom";
import {
  GitFork,
  Maximize2,
  Monitor,
  Pause,
  RefreshCw,
  RotateCcw,
  Search,
  SkipBack,
  SkipForward,
  WifiOff,
  ZoomIn,
  ZoomOut,
  Zap,
} from "lucide-react";
import { loadColor } from "../lib/utils";
import { useTopology } from "../hooks/use-topology";
import { CURRENT_EVENT_PCT, TIMELINE_EVENTS } from "../data/topology";
import { NodeCard } from "../components/topology/NodeCard";
import { NodeDetailsPanel } from "../components/topology/NodeDetailsPanel";
import { NetworkLegend } from "../components/topology/NetworkLegend";
import type { TopologyNode, ViewMode } from "../types/topology";

const LAYERS = [
  {
    id: "orchestration", label: "ORCHESTRATION",
    yStart: 0,  yEnd: 27,
    bg: "rgba(77,158,255,0.08)",
    border: "rgba(77,158,255,0.30)",
    accent: "#4D9EFF",
    status: null,
  },
  {
    id: "core", label: "CORE NETWORK",
    yStart: 27, yEnd: 50,
    bg: "rgba(233,30,140,0.09)",
    border: "rgba(233,30,140,0.35)",
    accent: "#E91E8C",
    status: { label: "INCIDENT", color: "#fff", textBg: "var(--color-critical)" },
  },
  {
    id: "transport", label: "TRANSPORT",
    yStart: 50, yEnd: 72,
    bg: "rgba(255,176,32,0.08)",
    border: "rgba(255,176,32,0.35)",
    accent: "#FFB020",
    status: { label: "ELEVATED", color: "#0E0E12", textBg: "var(--color-warning)" },
  },
  {
    id: "edge", label: "EDGE / CDN",
    yStart: 72, yEnd: 100,
    bg: "rgba(255,59,59,0.07)",
    border: "rgba(255,59,59,0.30)",
    accent: "#FF3B3B",
    status: { label: "NODE OFFLINE", color: "#fff", textBg: "var(--color-critical)" },
  },
];

const LAYER_SEPARATORS = [27, 50, 72];

const EVENT_COLOR: Record<string, string> = {
  critical: "var(--color-critical)",
  warning:  "var(--color-warning)",
  ai:       "var(--color-brand)",
  info:     "var(--color-mitigating)",
};

export default function Topology() {
  const { activeScenario } = useScenario();
  if (activeScenario.id === "s2") return <CxiTopology />;

  const { nodes, edges } = useTopology();

  const [selectedId, setSelectedId]   = useState<string | null>("eu-core-01");
  const [isLive, setIsLive]           = useState(true);
  const [zoom, setZoom]               = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode]       = useState<ViewMode>("scope");

  const svgRef = useRef<SVGSVGElement>(null);

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;
  const searchMatch  = searchQuery.trim().toLowerCase();

  const healthyCount = nodes.filter((n) => n.status === "healthy").length;
  const warningCount = nodes.filter((n) => n.status === "warning").length;
  const downCount    = nodes.filter((n) => n.status === "down").length;

  const currentEvent = TIMELINE_EVENTS.find((e) => e.pct === CURRENT_EVENT_PCT)
    ?? TIMELINE_EVENTS[TIMELINE_EVENTS.length - 1];

  useEffect(() => {
    if (!svgRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to("[data-edge='down']", {
        strokeDashoffset: -6, duration: 0.4, ease: "none", repeat: -1,
      });
      if (isLive) {
        gsap.to("[data-edge='healthy']", {
          strokeDashoffset: -16, duration: 2.5, ease: "none", repeat: -1,
        });
      }
    }, svgRef);
    return () => ctx.revert();
  }, [isLive, viewMode]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 116px)",
        gap: 0,
      }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-3 px-4 shrink-0"
        style={{
          height: 48,
          backgroundColor: "var(--color-bg-card)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div
          className="flex items-center rounded-lg overflow-hidden shrink-0"
          style={{ border: "1px solid var(--color-border)" }}
        >
          {(
            [
              { id: "scope",   label: "Model Scope", Icon: GitFork    },
              { id: "replay",  label: "Replay",      Icon: RotateCcw  },
              { id: "present", label: "Present",     Icon: Monitor     },
            ] as { id: ViewMode; label: string; Icon: typeof GitFork }[]
          ).map(({ id, label, Icon }) => {
            const active = viewMode === id;
            return (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: active ? "rgba(233,30,140,0.1)" : "transparent",
                  color: active ? "var(--color-brand)" : "var(--color-text-muted)",
                  borderRight: "1px solid var(--color-border)",
                }}
              >
                <Icon size={12} />
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        <div
          className="flex items-center rounded-md overflow-hidden shrink-0"
          style={{ border: "1px solid var(--color-border)" }}
        >
          <button
            onClick={() => setIsLive(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold transition-colors"
            style={{
              backgroundColor: isLive ? "var(--color-resolved)" : "transparent",
              color: isLive ? "#0E0E12" : "var(--color-text-muted)",
            }}
          >
            {isLive && (
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse-dot shrink-0"
                style={{ backgroundColor: "#0E0E12" }}
              />
            )}
            LIVE
          </button>
          <button
            onClick={() => setIsLive(false)}
            className="px-2.5 py-1 text-[10px] font-semibold transition-colors"
            style={{
              backgroundColor: !isLive ? "var(--color-bg-elevated)" : "transparent",
              color: !isLive ? "var(--color-text-primary)" : "var(--color-text-muted)",
            }}
          >
            STATIC
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] shrink-0" style={{ color: "var(--color-text-muted)" }}>
          <span>{nodes.length} nodes</span>
          <span>·</span>
          <span style={{ color: "var(--color-resolved)" }}>{healthyCount} healthy</span>
          <span>·</span>
          <span style={{ color: "var(--color-warning)" }}>{warningCount} warning</span>
          <span>·</span>
          <span style={{ color: "var(--color-critical)" }}>{downCount} critical</span>
        </div>

        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md shrink-0"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", width: 140 }}
        >
          <Search size={11} style={{ color: "var(--color-text-muted)" }} />
          <input
            type="text"
            placeholder="Find node…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none w-full"
            style={{ fontSize: 10, color: "var(--color-text-primary)" }}
          />
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="p-1.5 rounded hover:bg-white/5 transition-colors" style={{ color: "var(--color-text-muted)" }}><ZoomOut size={13} /></button>
          <span className="text-[10px] tabular-nums text-center" style={{ color: "var(--color-text-muted)", width: 30 }}>{zoom}%</span>
          <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="p-1.5 rounded hover:bg-white/5 transition-colors" style={{ color: "var(--color-text-muted)" }}><ZoomIn size={13} /></button>
        </div>

        <button className="p-1.5 rounded hover:bg-white/5 transition-colors" style={{ color: "var(--color-text-muted)" }}><RefreshCw size={13} /></button>
        <button className="p-1.5 rounded hover:bg-white/5 transition-colors" style={{ color: "var(--color-text-muted)" }}><Maximize2 size={13} /></button>
      </div>

      {/* Metadata bar */}
      <div
        className="flex items-stretch shrink-0"
        style={{
          height: 52,
          backgroundColor: "var(--color-bg-card)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        {[
          { label: "TIME",          value: "14:14 UTC",                  accent: undefined                    },
          { label: "FAULT",         value: "Core Network Overload",       accent: "var(--color-critical)"      },
          { label: "WORST DOMAIN",  value: "EU-WEST-01 · Elevated",       accent: "var(--color-warning)"       },
          { label: "IMPACTED NODE", value: "EU-CORE-01 · INC-8422",       accent: "var(--color-critical)"      },
        ].map(({ label, value, accent }, i) => (
          <div
            key={label}
            className="flex flex-col justify-center px-5"
            style={{
              flex: 1,
              borderLeft: i > 0 ? "1px solid var(--color-border)" : "none",
            }}
          >
            <p className="text-[9px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "var(--color-text-muted)" }}>
              {label}
            </p>
            <p className="text-sm font-semibold" style={{ color: accent ?? "var(--color-text-primary)" }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Main: canvas + right panel */}
      <div className="flex flex-1 min-h-0 gap-0">

        {/* Graph canvas */}
        <div className="flex-1 relative min-w-0" style={{ backgroundColor: "#0a0a0f", overflow: "hidden" }}>

          {LAYERS.map((layer, i) => (
            <div
              key={layer.id}
              className="absolute pointer-events-none select-none"
              style={{
                left: 0, right: 0,
                top: `${layer.yStart}%`,
                height: `${layer.yEnd - layer.yStart}%`,
                backgroundColor: layer.bg,
                borderBottom: i < LAYERS.length - 1
                  ? `1px solid ${layer.border}`
                  : "none",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0, top: 0, bottom: 0,
                  width: 4,
                  backgroundColor: layer.accent,
                  opacity: 0.8,
                }}
              />

              <div
                style={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: layer.accent,
                    opacity: 0.75,
                    whiteSpace: "nowrap",
                  }}
                >
                  {layer.label}
                </p>
                {layer.status && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      padding: "2px 8px",
                      borderRadius: 4,
                      color: layer.status.color,
                      backgroundColor: layer.status.textBg,
                      textTransform: "uppercase",
                    }}
                  >
                    {layer.status.label}
                  </span>
                )}
              </div>
            </div>
          ))}

          <svg
            ref={svgRef}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 3,
            }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {LAYER_SEPARATORS.map((y, i) => (
              <line
                key={y}
                x1="0" y1={y} x2="100" y2={y}
                stroke={LAYERS[i].border}
                strokeWidth="0.6"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {edges.map((edge) => {
              const from = nodes.find((n) => n.id === edge.from);
              const to   = nodes.find((n) => n.id === edge.to);
              if (!from || !to) return null;
              const isDown = edge.status === "down";
              return (
                <line
                  key={`${edge.from}-${edge.to}`}
                  data-edge={isDown ? "down" : "healthy"}
                  x1={from.x} y1={from.y}
                  x2={to.x}   y2={to.y}
                  stroke={isDown ? "var(--color-critical)" : "rgba(255,255,255,0.12)"}
                  strokeWidth={isDown ? 1.8 : 1.5}
                  strokeDasharray={isDown ? "3 3" : isLive ? "10 4" : undefined}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>

          <div style={{ position: "absolute", inset: 0, zIndex: 5 }}>
            {nodes.map((node) => {
              const isHighlighted =
                searchMatch.length > 0 &&
                node.label.toLowerCase().includes(searchMatch);
              return (
                <NodeCard
                  key={node.id}
                  node={node}
                  selected={selectedId === node.id}
                  highlighted={isHighlighted}
                  onClick={() => setSelectedId(selectedId === node.id ? null : node.id)}
                />
              );
            })}
          </div>

          <div
            className="absolute bottom-3 left-3 px-2.5 py-1.5 rounded-md"
            style={{
              backgroundColor: "rgba(10,10,15,0.85)",
              border: "1px solid var(--color-border)",
              backdropFilter: "blur(4px)",
            }}
          >
            <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 6 }}>
              Node Location
            </span>
            <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>
              51.5074° N | 0.1278° W
            </span>
          </div>
        </div>

        {/* Right panel */}
        <div
          className="flex flex-col gap-3 overflow-y-auto shrink-0 p-3"
          style={{
            width: 244,
            borderLeft: "1px solid var(--color-border)",
            backgroundColor: "var(--color-bg-card)",
            scrollbarWidth: "thin",
          }}
        >
          <NodeDetailsPanel node={selectedNode} />
          <NetworkLegend />
        </div>
      </div>

      {/* Timeline bar */}
      <div
        className="flex items-center gap-4 px-4 shrink-0"
        style={{
          height: 58,
          backgroundColor: "var(--color-bg-card)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <div className="shrink-0" style={{ width: 220 }}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Zap size={9} style={{ color: "var(--color-brand)" }} />
            <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: "var(--color-brand)" }}>
              Slice Impact
            </span>
          </div>
          <p className="text-[11px] leading-snug truncate" style={{ color: "var(--color-text-primary)" }}>
            {currentEvent.label}
          </p>
        </div>

        <div className="flex-1 relative">
          <div className="relative rounded-full" style={{ height: 4, backgroundColor: "rgba(255,255,255,0.08)" }}>
            <div
              className="absolute left-0 top-0 bottom-0 rounded-full"
              style={{ width: `${CURRENT_EVENT_PCT}%`, backgroundColor: "var(--color-brand)" }}
            />

            {TIMELINE_EVENTS.map((ev) => {
              const color = EVENT_COLOR[ev.type];
              const isCurrent = ev.pct === CURRENT_EVENT_PCT;
              return (
                <div
                  key={ev.t}
                  title={`${ev.t} — ${ev.label}`}
                  style={{
                    position: "absolute",
                    left: `${ev.pct}%`,
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: isCurrent ? 14 : 10,
                    height: isCurrent ? 14 : 10,
                    borderRadius: "50%",
                    backgroundColor: color,
                    border: `2px solid ${isCurrent ? "var(--color-bg-base)" : "var(--color-bg-card)"}`,
                    boxShadow: isCurrent ? `0 0 10px ${color}` : "none",
                    cursor: "pointer",
                    zIndex: isCurrent ? 2 : 1,
                  }}
                />
              );
            })}
          </div>

          <div className="flex justify-between mt-1.5">
            <span className="text-[9px]" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>14:02</span>
            <span className="text-[9px]" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>14:20 UTC</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
            <SkipBack size={13} />
          </button>
          <button className="p-2 rounded-lg" style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}>
            <Pause size={14} />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
            <SkipForward size={13} />
          </button>
          <button className="px-2 py-1 rounded-md text-[10px] font-bold hover:bg-white/5 transition-colors" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
            1×
          </button>
          <span className="text-[11px] tabular-nums" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
            14:14 / 20:00
          </span>
        </div>

        <Link
          to={selectedNode ? "/incidents" : "#"}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-opacity hover:opacity-90 shrink-0"
          style={{
            backgroundColor: "var(--color-brand)",
            color: "#fff",
            boxShadow: "0 4px 16px rgba(233,30,140,0.35)",
          }}
        >
          <Zap size={13} strokeWidth={2.5} />
          {selectedNode ? `Dispatch to ${selectedNode.label}` : "Quick Dispatch"}
        </Link>
      </div>
    </div>
  );
}
