import { Cloud, Network, Server, Wifi, WifiOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NodeStatus, NodeType, TopologyNode } from "../../types/topology";

const STATUS_COLOR: Record<NodeStatus, string> = {
  healthy: "var(--color-resolved)",
  warning: "var(--color-warning)",
  down:    "var(--color-critical)",
};

const NODE_ICON: Record<NodeType, LucideIcon> = {
  router:     Wifi,
  datacenter: Server,
  edge:       Network,
  cdn:        Cloud,
};

export function NodeCard({
  node,
  selected,
  highlighted,
  onClick,
}: {
  node: TopologyNode;
  selected: boolean;
  highlighted: boolean;
  onClick: () => void;
}) {
  const isDown    = node.status === "down";
  const isWarning = node.status === "warning";
  const statusColor = STATUS_COLOR[node.status];
  const Icon = isDown ? WifiOff : NODE_ICON[node.type];

  const ringColor = selected
    ? "var(--color-mitigating)"
    : highlighted
    ? "rgba(255,255,255,0.65)"
    : statusColor;

  const glow = selected
    ? "0 0 0 4px rgba(77,158,255,0.18), 0 4px 24px rgba(77,158,255,0.2)"
    : isDown
    ? "0 0 28px rgba(255,59,59,0.45)"
    : isWarning
    ? "0 0 20px rgba(255,176,32,0.25)"
    : "none";

  return (
    <div
      style={{
        position: "absolute",
        left: `${node.x}%`,
        top: `${node.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: selected ? 10 : isDown ? 8 : 5,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Pulsing ring for DOWN nodes */}
      {isDown && (
        <div
          className="absolute animate-ping pointer-events-none"
          style={{
            width: 84, height: 84,
            borderRadius: "50%",
            border: "1.5px solid rgba(255,59,59,0.4)",
            backgroundColor: "rgba(255,59,59,0.05)",
            top: 0, left: "50%",
            transform: "translate(-50%, 0)",
          }}
        />
      )}

      <button
        onClick={onClick}
        style={{
          background: "none", border: "none",
          cursor: "pointer", padding: 0,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        }}
      >
        {/* Circular node */}
        <div
          style={{
            width: 64, height: 64,
            borderRadius: "50%",
            backgroundColor: "var(--color-bg-elevated)",
            border: `2.5px solid ${ringColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxShadow: glow,
            transition: "box-shadow 0.2s, border-color 0.2s",
          }}
        >
          <Icon
            size={24}
            style={{ color: selected ? "var(--color-mitigating)" : statusColor }}
          />

          {/* Incident badge */}
          {node.incident && (
            <span
              style={{
                position: "absolute",
                top: -4, left: -4,
                fontSize: 8, fontWeight: 700,
                padding: "2px 4px",
                borderRadius: 4,
                backgroundColor: "var(--color-critical)",
                color: "#fff",
                letterSpacing: "0.02em",
                whiteSpace: "nowrap",
              }}
            >
              {node.incident.count} INC
            </span>
          )}

          {/* Warning dot */}
          {isWarning && (
            <span
              style={{
                position: "absolute",
                top: 2, right: 2,
                width: 11, height: 11,
                borderRadius: "50%",
                backgroundColor: "var(--color-warning)",
                border: "2px solid var(--color-bg-base)",
              }}
            />
          )}
        </div>

        {/* Label */}
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              fontWeight: isDown ? 700 : 600,
              color: isDown ? statusColor : "var(--color-text-primary)",
              whiteSpace: "nowrap",
            }}
          >
            {node.label}
          </p>
          <p
            style={{
              fontSize: 8,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginTop: 1,
            }}
          >
            {node.type}
          </p>
        </div>
      </button>
    </div>
  );
}
