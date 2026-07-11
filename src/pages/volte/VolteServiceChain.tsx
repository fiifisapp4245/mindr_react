import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ChevronRight, MessageSquare, Plus, Search,
  Upload, X, AlertTriangle,
} from "lucide-react";
import {
  VOLTE_NODES, VOLTE_EDGES, VOLTE_CONVERSATIONS, VOLTE_ALARMS,
  type ChainNode, type ConvStatus,
} from "../../data/volte-data";
import { Badge } from "../../components/ui/badge";

// ── Design tokens ──────────────────────────────────────────────────────────────

const HEALTH_COLOR: Record<string, string> = { healthy: "#2DD4BF", warning: "#FFB020", critical: "#FF3B3B" };
const HEALTH_BG:    Record<string, string> = { healthy: "rgba(45,212,191,0.12)", warning: "rgba(255,176,32,0.12)", critical: "rgba(255,59,59,0.12)" };
const SEG_COLOR:    Record<string, string> = { RAN: "#4D9EFF", EPC: "#A78BFA", IMS: "#2DD4BF" };
const SEG_BG:       Record<string, string> = { RAN: "rgba(77,158,255,0.12)", EPC: "rgba(167,139,250,0.12)", IMS: "rgba(45,212,191,0.12)" };
const CONV_STATUS_CFG: Record<ConvStatus, { color: string; bg: string }> = {
  Resolved: { color: "#2DD4BF", bg: "rgba(45,212,191,0.12)" },
  Pending:  { color: "#FFB020", bg: "rgba(255,176,32,0.12)" },
  Rejected: { color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.05)" },
};

// ── Node positions — matches SVG viewBox 0 0 800 380 ─────────────────────────

const NODE_POS: Record<string, [number, number]> = {
  "enb-west-01": [130, 100],
  "enb-west-02": [130, 260],
  "mme-01":      [370, 100],
  "sgw-01":      [370, 205],
  "pgw-01":      [370, 315],
  "p-cscf-01":   [630, 105],
  "s-cscf-01":   [630, 215],
  "bgcf-01":     [630, 325],
};

const R = 28; // node radius

function edgeEndpoints(from: string, to: string) {
  const [fx, fy] = NODE_POS[from];
  const [tx, ty] = NODE_POS[to];
  const dx = tx - fx, dy = ty - fy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / dist, ny = dy / dist;
  return {
    x1: fx + nx * (R + 1),
    y1: fy + ny * (R + 1),
    x2: tx - nx * (R + 8),
    y2: ty - ny * (R + 8),
  };
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function spark(values: number[], w = 56, h = 20): string {
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  return values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

// ── Node detail panel ─────────────────────────────────────────────────────────

function NodeDetail({ node, onClose }: { node: ChainNode; onClose: () => void }) {
  const navigate  = useNavigate();
  const alarms    = VOLTE_ALARMS.filter((a) => node.detail.alarmIds.includes(a.id));
  const hColor    = HEALTH_COLOR[node.health];

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: "var(--color-bg-card)" }}>
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold" style={{ color: hColor }}>{node.health.toUpperCase()}</span>
            <Badge className="px-1.5 py-0.5 text-[9px] font-bold"
              style={{ color: SEG_COLOR[node.segment], backgroundColor: SEG_BG[node.segment] }}>
              {node.segment} · {node.type}
            </Badge>
          </div>
          <p className="text-[14px] font-bold mt-1 leading-tight" style={{ color: "var(--color-text-primary)" }}>{node.label}</p>
          <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "var(--color-text-muted)" }}>{node.tagline}</p>
        </div>
        <button onClick={onClose} className="ml-3 shrink-0 p-1 rounded hover:bg-white/10 transition-colors">
          <X size={14} style={{ color: "var(--color-text-muted)" }} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

        {/* KPIs */}
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "var(--color-text-muted)" }}>KPIs</p>
          <div className="space-y-3">
            {node.detail.kpis.map((kpi) => (
              <div key={kpi.label} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium truncate" style={{ color: "var(--color-text-muted)" }}>{kpi.label}</p>
                  <p className="text-[13px] font-bold tabular-nums"
                    style={{ color: kpi.healthy ? "var(--color-text-primary)" : "#FFB020" }}>
                    {kpi.value}{kpi.unit}
                    {kpi.target !== undefined && (
                      <span className="text-[9px] font-normal ml-1" style={{ color: "var(--color-text-muted)" }}>
                        / {kpi.target}{kpi.unit}
                      </span>
                    )}
                  </p>
                </div>
                <svg viewBox={`0 0 56 20`} width={56} height={20} style={{ overflow: "visible", flexShrink: 0 }}>
                  <polyline points={spark(kpi.trend, 56, 20)} fill="none" strokeWidth="1.5"
                    stroke={kpi.healthy ? "#2DD4BF" : "#FFB020"} strokeLinejoin="round" />
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* Alarms */}
        {alarms.length > 0 && (
          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 16 }}>
            <p className="text-[9px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "var(--color-text-muted)" }}>Active alarms</p>
            <div className="space-y-2">
              {alarms.map((alarm) => (
                <div key={alarm.id} className="flex items-start gap-2 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "rgba(255,59,59,0.06)", border: "1px solid rgba(255,59,59,0.15)" }}>
                  <AlertTriangle size={11} className="shrink-0 mt-0.5" style={{ color: "#FF3B3B" }} />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold leading-snug" style={{ color: "var(--color-text-primary)" }}>{alarm.name}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      {alarm.metricValue}{alarm.metricUnit} · limit {alarm.threshold}{alarm.metricUnit} · raised {alarm.raisedAt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Traces */}
        {node.detail.traces.length > 0 && (
          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 16 }}>
            <p className="text-[9px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "var(--color-text-muted)" }}>Traces</p>
            <div className="space-y-2">
              {node.detail.traces.map((trace) => (
                <div key={trace.id} className="px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold" style={{ color: "#4D9EFF" }}>{trace.id}</span>
                    <span className="text-[9px] font-semibold" style={{ color: "var(--color-text-muted)" }}>{trace.protocol}</span>
                    <span className="text-[9px] ml-auto" style={{ color: "var(--color-text-muted)" }}>{trace.timestamp}</span>
                  </div>
                  <p className="text-[10px] mt-1 leading-snug" style={{ color: "var(--color-text-muted)" }}>{trace.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dependencies */}
        {(node.detail.upstream.length > 0 || node.detail.downstream.length > 0) && (
          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 16 }}>
            <p className="text-[9px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "var(--color-text-muted)" }}>Dependencies</p>
            {node.detail.upstream.length > 0 && (
              <div className="mb-2">
                <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>Upstream: </span>
                {node.detail.upstream.map((id) => {
                  const n = VOLTE_NODES.find((x) => x.id === id);
                  return n ? (
                    <Badge key={id} className="px-1.5 py-0.5 text-[9px] font-bold mr-1"
                      style={{ color: HEALTH_COLOR[n.health], backgroundColor: HEALTH_BG[n.health] }}>
                      {n.label}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
            {node.detail.downstream.length > 0 && (
              <div>
                <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>Downstream: </span>
                {node.detail.downstream.map((id) => {
                  const n = VOLTE_NODES.find((x) => x.id === id);
                  return n ? (
                    <Badge key={id} className="px-1.5 py-0.5 text-[9px] font-bold mr-1"
                      style={{ color: HEALTH_COLOR[n.health], backgroundColor: HEALTH_BG[n.health] }}>
                      {n.label}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>
        )}

        {/* Team */}
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 16 }}>
          <p className="text-[9px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Responsible team</p>
          <p className="text-[11px] font-semibold" style={{ color: "var(--color-text-primary)" }}>{node.detail.team.name}</p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Lead: {node.detail.team.lead} · {node.detail.team.email}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>On-call: {node.detail.team.oncall}</p>
        </div>
      </div>

      {/* Footer */}
      {alarms.length > 0 && (
        <div className="px-5 py-3 shrink-0" style={{ borderTop: "1px solid var(--color-border)" }}>
          <button onClick={() => navigate("/volte/alarms")}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-colors hover:opacity-80"
            style={{ backgroundColor: "rgba(255,59,59,0.08)", color: "#FF3B3B", border: "1px solid rgba(255,59,59,0.2)" }}>
            <AlertTriangle size={11} />View alarms for this node
          </button>
        </div>
      )}
    </div>
  );
}

// ── Scoped chat panel ─────────────────────────────────────────────────────────

const MOCK_THREAD: Record<string, Array<{ role: "user" | "agent"; text: string }>> = {
  c1: [
    { role: "user",  text: "What is causing the P-CSCF-01 response timeout?" },
    { role: "agent", text: "The root cause is a stalled HSS Diameter Cx lookup. P-CSCF-01 is waiting on HSS responses that exceed 1600ms (threshold 50ms), causing SIP REGISTER timeouts. This is correlated with change CHG-4821 (HSS v8.2→v8.3 upgrade at 08:00 UTC)." },
  ],
  c2: [
    { role: "user",  text: "Show the dependency path from MME-01 to P-CSCF-01." },
    { role: "agent", text: "There is no direct edge from MME-01 to P-CSCF-01. The path flows: eNB-WEST → MME-01 → SGW-01 → PGW-01 → P-CSCF-01. The fault edge is on PGW-01 → P-CSCF-01, indicating the EPC-to-IMS handoff is where failures propagate." },
  ],
};

function ScopedChat() {
  const [search,    setSearch]    = useState("");
  const [activeId,  setActiveId]  = useState<string | null>(null);
  const [input,     setInput]     = useState("");

  const activeConv = VOLTE_CONVERSATIONS.find((c) => c.id === activeId);
  const thread     = activeId ? (MOCK_THREAD[activeId] ?? []) : [];

  const filtered = VOLTE_CONVERSATIONS.filter(
    (c) => !search || c.title.toLowerCase().includes(search.toLowerCase())
  );

  if (activeConv) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 px-3 py-3 shrink-0" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <button onClick={() => setActiveId(null)} className="p-1 rounded hover:bg-white/10 transition-colors">
            <ArrowLeft size={13} style={{ color: "var(--color-text-muted)" }} />
          </button>
          <p className="text-[11px] font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{activeConv.title}</p>
          <Badge className="ml-auto shrink-0 px-1.5 py-0.5 text-[9px] font-bold"
            style={{ color: CONV_STATUS_CFG[activeConv.status].color, backgroundColor: CONV_STATUS_CFG[activeConv.status].bg }}>
            {activeConv.status}
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {thread.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[90%] px-3 py-2 rounded-xl text-[11px] leading-snug"
                style={{
                  backgroundColor: msg.role === "user" ? "rgba(45,212,191,0.14)" : "rgba(255,255,255,0.05)",
                  color: "var(--color-text-primary)", border: "1px solid",
                  borderColor: msg.role === "user" ? "rgba(45,212,191,0.2)" : "var(--color-border)",
                }}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="px-3 py-3 shrink-0" style={{ borderTop: "1px solid var(--color-border)" }}>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid var(--color-border)" }}>
            <input value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the Volte model…"
              className="flex-1 bg-transparent text-[11px] outline-none"
              style={{ color: "var(--color-text-primary)" }} />
            <ChevronRight size={13} style={{ color: "#2DD4BF", flexShrink: 0 }} />
          </div>
          <p className="text-[9px] mt-1.5 text-center" style={{ color: "var(--color-text-muted)" }}>
            Volte-scoped · reads this graph only
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 shrink-0" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div className="flex items-center gap-2">
          <MessageSquare size={13} style={{ color: "#2DD4BF" }} />
          <p className="text-[12px] font-semibold" style={{ color: "var(--color-text-primary)" }}>Volte · Scoped Chat</p>
        </div>
        <p className="text-[9px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>Reads this service chain graph only</p>
      </div>

      {/* New conversation button */}
      <div className="px-3 pt-3 shrink-0">
        <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold transition-colors hover:opacity-80"
          style={{ backgroundColor: "rgba(45,212,191,0.12)", color: "#2DD4BF", border: "1px solid rgba(45,212,191,0.25)" }}>
          <Plus size={12} />New conversation
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid var(--color-border)" }}>
          <Search size={11} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations"
            className="flex-1 bg-transparent text-[11px] outline-none"
            style={{ color: "var(--color-text-primary)" }} />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-1">
        {filtered.map((conv) => (
          <button key={conv.id} onClick={() => setActiveId(conv.id)}
            className="w-full flex flex-col gap-1 px-3 py-3 rounded-xl text-left hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold truncate leading-tight" style={{ color: "var(--color-text-primary)" }}>{conv.title}</p>
              <Badge className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold"
                style={{ color: CONV_STATUS_CFG[conv.status].color, backgroundColor: CONV_STATUS_CFG[conv.status].bg }}>
                {conv.status}
              </Badge>
            </div>
            <p className="text-[10px] truncate leading-snug" style={{ color: "var(--color-text-muted)" }}>{conv.preview}</p>
            <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>{conv.updatedAt}</p>
          </button>
        ))}
      </div>

      {/* Upload documents */}
      <div className="px-3 pb-4 pt-2 shrink-0" style={{ borderTop: "1px solid var(--color-border)" }}>
        <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-semibold transition-colors hover:opacity-80"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}>
          <Upload size={11} />Upload documents (Volte-scoped)
        </button>
      </div>
    </div>
  );
}

// ── Service chain SVG graph ───────────────────────────────────────────────────

function ServiceChainGraph({ selectedId, onSelect }: {
  selectedId: string | null; onSelect: (id: string | null) => void;
}) {
  const [hoverId, setHoverId] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-hidden relative">
      {/* Graph header */}
      <div className="absolute top-0 left-0 right-0 px-5 py-3 flex items-center justify-between z-10"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-elevated)" }}>
        <div>
          <p className="text-[13px] font-semibold" style={{ color: "var(--color-text-primary)" }}>Volte service chain</p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>Click any node to inspect · red edges = fault path</p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          {(["healthy", "warning", "critical"] as const).map((h) => (
            <div key={h} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: HEALTH_COLOR[h] }} />
              <span className="capitalize">{h}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-0.5" style={{ backgroundColor: "#FF3B3B" }} />
            <span>Fault path</span>
          </div>
        </div>
      </div>

      {/* SVG canvas */}
      <svg
        viewBox="0 0 800 380"
        preserveAspectRatio="xMidYMid meet"
        className="w-full"
        style={{ height: "calc(100% - 52px)", marginTop: 52, display: "block" }}
        onClick={() => onSelect(null)}
      >
        <defs>
          <marker id="arr-n" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M 0 0 L 7 3.5 L 0 7 Z" fill="rgba(255,255,255,0.2)" />
          </marker>
          <marker id="arr-f" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M 0 0 L 7 3.5 L 0 7 Z" fill="#FF3B3B" />
          </marker>
          <marker id="arr-sel" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M 0 0 L 7 3.5 L 0 7 Z" fill="#4D9EFF" />
          </marker>
          {/* Glow filter for critical nodes */}
          <filter id="glow-crit">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Column separator lines */}
        {[250, 500].map((x) => (
          <line key={x} x1={x} y1={30} x2={x} y2={340}
            stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
        ))}

        {/* Column labels */}
        {(["RAN", "EPC", "IMS"] as const).map((seg, i) => (
          <g key={seg}>
            <text x={[130, 370, 630][i]} y={20} textAnchor="middle"
              fontSize="10" fontWeight="700" letterSpacing="2"
              fill={SEG_COLOR[seg]} opacity={0.8}>
              {seg}
            </text>
          </g>
        ))}

        {/* Edges */}
        {VOLTE_EDGES.map((edge) => {
          const ep    = edgeEndpoints(edge.from, edge.to);
          const isFault = edge.fault;
          const isInvolved = selectedId && (edge.from === selectedId || edge.to === selectedId);
          return (
            <line key={`${edge.from}-${edge.to}`}
              x1={ep.x1} y1={ep.y1} x2={ep.x2} y2={ep.y2}
              stroke={isFault ? "#FF3B3B" : isInvolved ? "#4D9EFF" : "rgba(255,255,255,0.18)"}
              strokeWidth={isFault ? 2.5 : isInvolved ? 2 : 1.5}
              markerEnd={isFault ? "url(#arr-f)" : isInvolved ? "url(#arr-sel)" : "url(#arr-n)"}
              opacity={selectedId && !isInvolved && !isFault ? 0.4 : 1}
              style={{ transition: "stroke 0.15s, opacity 0.15s" }}
            />
          );
        })}

        {/* Nodes */}
        {VOLTE_NODES.map((node) => {
          const [cx, cy] = NODE_POS[node.id];
          const hc       = HEALTH_COLOR[node.health];
          const isSelected = selectedId === node.id;
          const isHovered  = hoverId === node.id;
          const isCritical = node.health === "critical";

          const shortLabel = node.label.split("-").pop()!;
          const fullLabel  = node.label;

          return (
            <g key={node.id}
              onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
              onMouseEnter={() => setHoverId(node.id)}
              onMouseLeave={() => setHoverId(null)}
              style={{ cursor: "pointer" }}>

              {/* Selection ring */}
              {(isSelected || isHovered) && (
                <circle cx={cx} cy={cy} r={R + 8} fill="none"
                  stroke={hc} strokeWidth={1.5} opacity={0.4}
                  style={{ transition: "opacity 0.15s" }} />
              )}

              {/* Node circle */}
              <circle cx={cx} cy={cy} r={R}
                fill={`rgba(${isCritical ? "255,59,59" : node.health === "warning" ? "255,176,32" : "45,212,191"},0.10)`}
                stroke={hc} strokeWidth={isSelected ? 3 : 2}
                filter={isCritical ? "url(#glow-crit)" : undefined} />

              {/* Short label inside */}
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                fontSize="9" fontWeight="700" fill={hc}>
                {shortLabel}
              </text>

              {/* Full label below */}
              <text x={cx} y={cy + R + 13} textAnchor="middle"
                fontSize="9.5" fontWeight="600" fill="rgba(255,255,255,0.75)">
                {fullLabel}
              </text>

              {/* Health dot */}
              <circle cx={cx + R - 5} cy={cy - R + 5} r={4.5} fill={hc} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VolteServiceChain() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = VOLTE_NODES.find((n) => n.id === selectedNodeId) ?? null;

  return (
    <div
      style={{
        margin: "-16px -24px",
        height: "calc(100vh - 56px)",
        display: "flex",
        overflow: "hidden",
        backgroundColor: "var(--color-bg-elevated)",
      }}>

      {/* Left: Scoped chat — 264px */}
      <div style={{ width: 264, borderRight: "1px solid var(--color-border)", flexShrink: 0 }}>
        <ScopedChat />
      </div>

      {/* Center: Service chain graph */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <ServiceChainGraph selectedId={selectedNodeId} onSelect={setSelectedNodeId} />
      </div>

      {/* Right: Node detail panel — 340px, conditional */}
      {selectedNode && (
        <div style={{ width: 340, borderLeft: "1px solid var(--color-border)", flexShrink: 0, overflow: "hidden" }}>
          <NodeDetail node={selectedNode} onClose={() => setSelectedNodeId(null)} />
        </div>
      )}
    </div>
  );
}
