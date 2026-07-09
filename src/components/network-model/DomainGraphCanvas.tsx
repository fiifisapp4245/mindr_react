import { Clock } from "lucide-react";
import type { DomainGraphData } from "../../data/network-model-data";
import { NODE_COLOR } from "../../data/network-model-data";

interface Props {
  data: DomainGraphData;
  domainId: string;
  onNodeSelect: (nodeId: string) => void;
  selectedNodeId?: string | null;
  highlightedNodeIds?: string[];
  asOfLabel?: string; // "as of <time>" label — defaults to "Now"
}

function curvedPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.5) return `M ${x1} ${y1}`;
  const scale = Math.min(len * 0.22, 7);
  const cx = mx + (-dy / len) * scale;
  const cy = my + (dx / len) * scale;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

const EDGE_BASE_COLOR = {
  healthy: "rgba(45,212,191,0.55)",
  warning: "rgba(255,176,32,0.65)",
  down:    "rgba(255,59,59,0.75)",
} as const;

const EDGE_STROKE_WIDTH = {
  healthy: 1.2,
  warning: 1.8,
  down:    1.8,
} as const;

const NODE_STATUS_LABEL: Record<string, string> = {
  core:     "Core / hub",
  healthy:  "Healthy",
  warning:  "Warning",
  critical: "Critical",
};

export default function DomainGraphCanvas({
  data,
  onNodeSelect,
  selectedNodeId,
  highlightedNodeIds = [],
  asOfLabel = "Now",
}: Props) {
  const nodeMap       = new Map(data.nodes.map(n => [n.id, n]));
  const isFocusMode   = highlightedNodeIds.length > 0;

  function nodeOpacity(nodeId: string): number {
    if (!isFocusMode) return 1;
    return highlightedNodeIds.includes(nodeId) ? 1 : 0.18;
  }

  function edgeOpacity(fromId: string, toId: string): number {
    if (!isFocusMode) return 1;
    const fromH = highlightedNodeIds.includes(fromId);
    const toH   = highlightedNodeIds.includes(toId);
    if (fromH && toH)       return 1;
    if (fromH || toH)       return 0.35;
    return 0.08;
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#080810" }}>
      {/* Keyframes */}
      <style>{`
        @keyframes nm-pulse {
          0%   { transform: translate(-50%,-50%) scale(1);    opacity: 0.4; }
          50%  { transform: translate(-50%,-50%) scale(1.45); opacity: 0.1; }
          100% { transform: translate(-50%,-50%) scale(1);    opacity: 0.4; }
        }
      `}</style>

      {/* "As of" control — top right */}
      <div
        style={{
          position:       "absolute",
          top:            12,
          right:          12,
          zIndex:         10,
          display:        "flex",
          alignItems:     "center",
          gap:            5,
          background:     "rgba(10,10,20,0.80)",
          border:         "1px solid rgba(255,255,255,0.10)",
          borderRadius:   8,
          padding:        "5px 10px",
          backdropFilter: "blur(8px)",
          cursor:         "default",
        }}
        title="Historical graph replay — coming soon"
      >
        <Clock size={11} color="rgba(255,255,255,0.45)" />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>
          as of
        </span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
          {asOfLabel}
        </span>
      </div>

      {/* SVG edge overlay */}
      <svg
        style={{
          position:      "absolute",
          inset:         0,
          zIndex:        2,
          width:         "100%",
          height:        "100%",
          pointerEvents: "none",
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {data.edges.map((edge, i) => {
          const fromNode = nodeMap.get(edge.from);
          const toNode   = nodeMap.get(edge.to);
          if (!fromNode || !toNode) return null;

          const isDashed  = edge.status === "warning" || edge.status === "down";
          const opacity   = edgeOpacity(edge.from, edge.to);
          const baseColor = EDGE_BASE_COLOR[edge.status];

          return (
            <path
              key={i}
              d={curvedPath(fromNode.x, fromNode.y, toNode.x, toNode.y)}
              stroke={baseColor}
              strokeWidth={EDGE_STROKE_WIDTH[edge.status]}
              fill="none"
              vectorEffect="non-scaling-stroke"
              strokeDasharray={isDashed ? "4 3" : undefined}
              opacity={opacity}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {data.nodes.map(node => {
        const color      = NODE_COLOR[node.status];
        const isCritical = node.status === "critical";
        const isSelected = node.id === selectedNodeId;
        const isHighlighted = !isFocusMode || highlightedNodeIds.includes(node.id);
        const opacity    = nodeOpacity(node.id);

        return (
          <div
            key={node.id}
            style={{
              position:      "absolute",
              left:          `${node.x}%`,
              top:           `${node.y}%`,
              transform:     "translate(-50%,-50%)",
              zIndex:        5,
              display:       "flex",
              flexDirection: "column",
              alignItems:    "center",
              opacity,
              transition:    "opacity 0.3s ease",
            }}
          >
            {/* Selection ring */}
            {isSelected && (
              <div
                style={{
                  position:      "absolute",
                  left:          "50%",
                  top:           "50%",
                  width:         46,
                  height:        46,
                  borderRadius:  "50%",
                  border:        "2px solid #fff",
                  transform:     "translate(-50%,-50%)",
                  opacity:       0.9,
                  pointerEvents: "none",
                  boxShadow:     "0 0 12px rgba(255,255,255,0.4)",
                }}
              />
            )}

            {/* Pulse ring for critical nodes */}
            {isCritical && isHighlighted && (
              <div
                style={{
                  position:      "absolute",
                  left:          "50%",
                  top:           "50%",
                  width:         40,
                  height:        40,
                  borderRadius:  "50%",
                  border:        `2px solid ${color}`,
                  opacity:       0.4,
                  animation:     "nm-pulse 1.8s ease-in-out infinite",
                  pointerEvents: "none",
                }}
              />
            )}

            {/* Node circle */}
            <div
              onClick={() => onNodeSelect(node.id)}
              style={{
                width:          32,
                height:         32,
                borderRadius:   "50%",
                background:     color,
                cursor:         "pointer",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                flexShrink:     0,
                boxShadow:      isHighlighted ? `0 0 10px ${color}55` : "none",
              }}
            />

            {/* Label */}
            <div
              style={{
                fontSize:      10,
                color:         isHighlighted
                  ? "rgba(255,255,255,0.9)"
                  : "rgba(255,255,255,0.35)",
                textAlign:     "center",
                maxWidth:      80,
                marginTop:     4,
                lineHeight:    1.3,
                whiteSpace:    "normal",
                wordBreak:     "break-word",
                pointerEvents: "none",
                fontWeight:    isHighlighted ? 600 : 400,
                transition:    "color 0.3s ease",
              }}
            >
              {node.label}
            </div>
          </div>
        );
      })}

      {/* Legend — bottom left */}
      <div
        style={{
          position:       "absolute",
          bottom:         16,
          left:           16,
          zIndex:         10,
          background:     "rgba(10,10,20,0.82)",
          border:         "1px solid rgba(255,255,255,0.1)",
          borderRadius:   10,
          padding:        "10px 14px",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Node status */}
        <p style={{
          fontSize:      9,
          fontWeight:    700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color:         "rgba(255,255,255,0.35)",
          marginBottom:  6,
        }}>
          Node status
        </p>
        {(Object.keys(NODE_COLOR) as Array<keyof typeof NODE_COLOR>).map(status => (
          <div key={status} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <span style={{
              width:        8,
              height:       8,
              borderRadius: "50%",
              background:   NODE_COLOR[status],
              flexShrink:   0,
            }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>
              {NODE_STATUS_LABEL[status]}
            </span>
          </div>
        ))}

        {/* Divider */}
        <div style={{
          height:     1,
          background: "rgba(255,255,255,0.08)",
          margin:     "8px 0",
        }} />

        {/* Link status */}
        <p style={{
          fontSize:      9,
          fontWeight:    700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color:         "rgba(255,255,255,0.35)",
          marginBottom:  6,
        }}>
          Link status
        </p>
        {[
          { label: "Healthy",  color: "rgba(45,212,191,0.8)",   dashed: false },
          { label: "Warning",  color: "rgba(255,176,32,0.8)",   dashed: true  },
          { label: "Down",     color: "rgba(255,59,59,0.8)",    dashed: true  },
        ].map(({ label, color, dashed }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <svg width={20} height={8} style={{ flexShrink: 0 }}>
              <line
                x1={0} y1={4} x2={20} y2={4}
                stroke={color}
                strokeWidth={1.8}
                strokeDasharray={dashed ? "4 3" : undefined}
              />
            </svg>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Focus mode indicator */}
      {isFocusMode && (
        <div
          style={{
            position:       "absolute",
            top:            12,
            left:           "50%",
            transform:      "translateX(-50%)",
            zIndex:         10,
            background:     "rgba(10,10,20,0.80)",
            border:         "1px solid rgba(255,255,255,0.12)",
            borderRadius:   8,
            padding:        "4px 10px",
            backdropFilter: "blur(8px)",
            fontSize:       10,
            color:          "rgba(255,255,255,0.50)",
            whiteSpace:     "nowrap",
          }}
        >
          Showing {highlightedNodeIds.length} relevant node{highlightedNodeIds.length !== 1 ? "s" : ""} · click any node to explore
        </div>
      )}
    </div>
  );
}
