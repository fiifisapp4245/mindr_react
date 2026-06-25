import type { DomainGraphData } from "../../data/network-model-data";
import { NODE_COLOR } from "../../data/network-model-data";

interface Props {
  data: DomainGraphData;
  domainId: string;
  onNodeSelect: (nodeId: string) => void;
  selectedNodeId?: string | null;
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

const EDGE_COLOR = {
  healthy: "rgba(255,255,255,0.18)",
  warning: "rgba(255,176,32,0.55)",
  down:    "rgba(255,59,59,0.65)",
} as const;

const EDGE_STROKE_WIDTH = {
  healthy: 1.2,
  warning: 1.8,
  down:    1.8,
} as const;

const LEGEND_ITEMS: { status: keyof typeof NODE_COLOR; label: string }[] = [
  { status: "core",     label: "Core / hub" },
  { status: "healthy",  label: "Healthy"    },
  { status: "warning",  label: "Warning"    },
  { status: "critical", label: "Critical"   },
];

export default function DomainGraphCanvas({ data, domainId, onNodeSelect, selectedNodeId }: Props) {
  const nodeMap = new Map(data.nodes.map(n => [n.id, n]));

  function handleNodeClick(nodeId: string) {
    onNodeSelect(nodeId);
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#080810" }}>
      {/* Pulsing keyframe */}
      <style>{`
        @keyframes nm-pulse {
          0%   { transform: translate(-50%,-50%) scale(1);   opacity: 0.4; }
          50%  { transform: translate(-50%,-50%) scale(1.45); opacity: 0.1; }
          100% { transform: translate(-50%,-50%) scale(1);   opacity: 0.4; }
        }
      `}</style>

      {/* SVG edge overlay */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {data.edges.map((edge, i) => {
          const fromNode = nodeMap.get(edge.from);
          const toNode   = nodeMap.get(edge.to);
          if (!fromNode || !toNode) return null;
          const isDashed = edge.status === "warning" || edge.status === "down";
          return (
            <path
              key={i}
              d={curvedPath(fromNode.x, fromNode.y, toNode.x, toNode.y)}
              stroke={EDGE_COLOR[edge.status]}
              strokeWidth={EDGE_STROKE_WIDTH[edge.status]}
              fill="none"
              vectorEffect="non-scaling-stroke"
              strokeDasharray={isDashed ? "4 3" : undefined}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {data.nodes.map(node => {
        const color = NODE_COLOR[node.status];
        const isCritical = node.status === "critical";
        const isSelected = node.id === selectedNodeId;
        return (
          <div
            key={node.id}
            style={{
              position:  "absolute",
              left:      `${node.x}%`,
              top:       `${node.y}%`,
              transform: "translate(-50%,-50%)",
              zIndex:    5,
              display:   "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Selection ring */}
            {isSelected && (
              <div
                style={{
                  position:     "absolute",
                  left:         "50%",
                  top:          "50%",
                  width:        46,
                  height:       46,
                  borderRadius: "50%",
                  border:       "2px solid #fff",
                  transform:    "translate(-50%,-50%)",
                  opacity:      0.9,
                  pointerEvents: "none",
                  boxShadow:    "0 0 12px rgba(255,255,255,0.4)",
                }}
              />
            )}

            {/* Pulse ring for critical nodes */}
            {isCritical && (
              <div
                style={{
                  position:     "absolute",
                  left:         "50%",
                  top:          "50%",
                  width:        40,
                  height:       40,
                  borderRadius: "50%",
                  border:       `2px solid ${color}`,
                  opacity:      0.4,
                  animation:    "nm-pulse 1.8s ease-in-out infinite",
                  pointerEvents: "none",
                }}
              />
            )}

            {/* Node circle */}
            <div
              onClick={() => handleNodeClick(node.id)}
              style={{
                width:        32,
                height:       32,
                borderRadius: "50%",
                background:   color,
                cursor:       "pointer",
                display:      "flex",
                alignItems:   "center",
                justifyContent: "center",
                flexShrink:   0,
                boxShadow:    `0 0 10px ${color}55`,
              }}
            />

            {/* Label */}
            <div
              style={{
                fontSize:    10,
                color:       "rgba(255,255,255,0.7)",
                textAlign:   "center",
                maxWidth:    80,
                marginTop:   4,
                lineHeight:  1.3,
                whiteSpace:  "normal",
                wordBreak:   "break-word",
                pointerEvents: "none",
              }}
            >
              {node.label}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div
        style={{
          position:        "absolute",
          bottom:          16,
          left:            16,
          zIndex:          10,
          background:      "rgba(10,10,20,0.82)",
          border:          "1px solid rgba(255,255,255,0.1)",
          borderRadius:    10,
          padding:         "10px 14px",
          backdropFilter:  "blur(8px)",
        }}
      >
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
          Node status
        </p>
        {LEGEND_ITEMS.map(item => (
          <div key={item.status} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: NODE_COLOR[item.status], flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
