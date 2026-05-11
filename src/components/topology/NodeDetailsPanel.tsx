import { Link } from "react-router-dom";
import { Cloud, Network, Server, Wifi, WifiOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { loadColor } from "../../lib/utils";
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

export function NodeDetailsPanel({ node }: { node: TopologyNode | null }) {
  if (!node) {
    return (
      <div
        className="rounded-lg p-4 flex items-center justify-center"
        style={{
          backgroundColor: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          minHeight: 120,
        }}
      >
        <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
          Select a node to view details
        </p>
      </div>
    );
  }

  const isDown      = node.status === "down";
  const isWarning   = node.status === "warning";
  const statusColor = STATUS_COLOR[node.status];
  const badgeColor  = isDown ? "var(--color-critical)" : isWarning ? "var(--color-warning)" : "var(--color-resolved)";
  const badgeBg     = isDown ? "rgba(255,59,59,0.12)" : isWarning ? "rgba(255,176,32,0.12)" : "rgba(45,212,191,0.12)";
  const statusLabel = isDown ? "DOWN" : isWarning ? "WARNING" : "ACTIVE";
  const Icon        = isDown ? WifiOff : NODE_ICON[node.type];

  return (
    <div
      className="rounded-lg p-4 space-y-3"
      style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
          Node Details
        </p>
        <span
          className="text-[10px] font-semibold px-1.5 py-px rounded"
          style={{ color: badgeColor, backgroundColor: badgeBg }}
        >
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="rounded-lg flex items-center justify-center shrink-0"
          style={{
            width: 36,
            height: 36,
            backgroundColor: "var(--color-bg-elevated)",
            border: `1.5px solid ${statusColor}`,
          }}
        >
          <Icon size={15} style={{ color: statusColor }} />
        </div>
        <div>
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}
          >
            {node.label}
          </p>
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
            ID: {node.id.toUpperCase()}-X
          </p>
        </div>
      </div>

      {node.metrics && (
        <div className="space-y-2.5">
          {[
            { label: "CPU LOAD",           value: node.metrics.cpu },
            { label: "MEMORY UTILIZATION", value: node.metrics.memory },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                  {label}
                </span>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: loadColor(value) }}>
                  {value}%
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: loadColor(value) }} />
              </div>
            </div>
          ))}

          <div className="grid grid-cols-2 gap-2 pt-0.5">
            {[
              { label: "LATENCY", value: `${node.metrics.latency} ms` },
              { label: "UPTIME",  value: node.metrics.uptime },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-md p-2" style={{ backgroundColor: "var(--color-bg-elevated)" }}>
                <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {label}
                </p>
                <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {node.incident && (
        <Link
          to="/incidents"
          className="flex items-center justify-between rounded-md p-2.5 transition-opacity hover:opacity-80"
          style={{ backgroundColor: "rgba(255,59,59,0.07)", border: "1px solid rgba(255,59,59,0.2)" }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
              style={{ backgroundColor: "var(--color-critical)" }}
            />
            <span className="text-xs" style={{ color: "var(--color-critical)" }}>
              {node.incident.count} Active Incident
            </span>
          </div>
          <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>→</span>
        </Link>
      )}

      <button
        className="w-full py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
      >
        ↗ Manage Node
      </button>
    </div>
  );
}
