import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Upload, X, MapPin, Users } from "lucide-react";
import { DOMAINS } from "../data/domains";
import {
  GRAPH_DATA,
  NODE_DETAILS,
  NODE_COLOR,
  type DomainGraphData,
  type GraphNode,
} from "../data/network-model-data";
import DomainGraphCanvas from "../components/network-model/DomainGraphCanvas";
import NetworkModelLeftPanel from "../components/network-model/NetworkModelLeftPanel";

type ValidDomain = "ip-core" | "cxi" | "volte";
const VALID_DOMAINS: ValidDomain[] = ["ip-core", "cxi", "volte"];

function isValidDomain(id: string | undefined): id is ValidDomain {
  return VALID_DOMAINS.includes(id as ValidDomain);
}

const KPI_COLOR = {
  ok:   { text: "#2DD4BF", bg: "rgba(45,212,191,0.10)"  },
  warn: { text: "#FFB020", bg: "rgba(255,176,32,0.10)"  },
  crit: { text: "#FF3B3B", bg: "rgba(255,59,59,0.10)"   },
};

const ALARM_CFG = {
  critical: { dot: "#FF3B3B", bg: "rgba(255,59,59,0.08)",  label: "CRITICAL" },
  warning:  { dot: "#FFB020", bg: "rgba(255,176,32,0.08)", label: "WARNING"  },
};

const EDGE_STATUS_COLOR: Record<string, string> = {
  down:    "#FF3B3B",
  warning: "#FFB020",
  healthy: "#2DD4BF",
};

function NodeDetailPanel({
  nodeId,
  data,
  onClose,
}: {
  nodeId: string;
  data: DomainGraphData;
  onClose: () => void;
}) {
  const node   = data.nodes.find(n => n.id === nodeId);
  const detail = NODE_DETAILS[nodeId];
  if (!node || !detail) return null;

  const color       = NODE_COLOR[node.status];
  const statusLabel = node.status.charAt(0).toUpperCase() + node.status.slice(1);

  const neighbours = data.edges
    .filter(e => e.from === nodeId || e.to === nodeId)
    .map(e => {
      const peerId = e.from === nodeId ? e.to : e.from;
      const peer   = data.nodes.find(n => n.id === peerId) as GraphNode | undefined;
      return peer ? { peer, edgeStatus: e.status } : null;
    })
    .filter((x): x is { peer: GraphNode; edgeStatus: string } => x !== null);

  return (
    <div
      style={{
        position:      "absolute",
        right:         0,
        top:           0,
        bottom:        0,
        width:         340,
        zIndex:        20,
        background:    "var(--color-bg-card)",
        borderLeft:    "1px solid var(--color-border)",
        display:       "flex",
        flexDirection: "column",
        overflow:      "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display:      "flex",
          alignItems:   "center",
          gap:          10,
          padding:      "14px 16px 12px",
          borderBottom: "1px solid var(--color-border)",
          flexShrink:   0,
        }}
      >
        <span
          style={{
            width:        10,
            height:       10,
            borderRadius: "50%",
            background:   color,
            flexShrink:   0,
            boxShadow:    `0 0 6px ${color}88`,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize:     13,
              fontWeight:   700,
              color:        "var(--color-text-primary)",
              whiteSpace:   "nowrap",
              overflow:     "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {node.label}
          </p>
          <p
            style={{
              fontSize:      10,
              color:         color,
              fontWeight:    600,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginTop:     1,
            }}
          >
            {statusLabel}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background:   "none",
            border:       "none",
            padding:      4,
            cursor:       "pointer",
            color:        "var(--color-text-muted)",
            display:      "flex",
            alignItems:   "center",
            borderRadius: 6,
          }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>

        {/* Description */}
        <p
          style={{
            fontSize:     12,
            color:        "var(--color-text-muted)",
            lineHeight:   1.5,
            marginBottom: 14,
          }}
        >
          {detail.description}
        </p>

        {/* Meta */}
        <div style={{ display: "flex", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <MapPin size={11} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{detail.location}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Users size={11} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{detail.team}</span>
          </div>
        </div>

        {/* KPIs */}
        <p
          style={{
            fontSize:      9,
            fontWeight:    700,
            textTransform: "uppercase",
            letterSpacing: "0.09em",
            color:         "var(--color-text-muted)",
            marginBottom:  8,
          }}
        >
          Key metrics
        </p>
        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "1fr 1fr",
            gap:                 8,
            marginBottom:        18,
          }}
        >
          {detail.kpis.map(kpi => {
            const c = KPI_COLOR[kpi.status];
            return (
              <div
                key={kpi.label}
                style={{
                  background:   "var(--color-bg-elevated)",
                  border:       "1px solid var(--color-border)",
                  borderRadius: 8,
                  padding:      "8px 10px",
                }}
              >
                <p
                  style={{
                    fontSize:      9,
                    color:         "var(--color-text-muted)",
                    fontWeight:    500,
                    marginBottom:  4,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {kpi.label}
                </p>
                <p
                  style={{
                    fontSize:     13,
                    fontWeight:   700,
                    color:        c.text,
                    background:   c.bg,
                    borderRadius: 4,
                    padding:      "1px 5px",
                    display:      "inline-block",
                  }}
                >
                  {kpi.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Alarms */}
        <p
          style={{
            fontSize:      9,
            fontWeight:    700,
            textTransform: "uppercase",
            letterSpacing: "0.09em",
            color:         "var(--color-text-muted)",
            marginBottom:  8,
          }}
        >
          Active alarms ({detail.alarms.length})
        </p>
        {detail.alarms.length === 0 ? (
          <p
            style={{
              fontSize:     11,
              color:        "var(--color-text-muted)",
              marginBottom: 18,
              fontStyle:    "italic",
            }}
          >
            No active alarms
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
            {detail.alarms.map((alarm, i) => {
              const ac = ALARM_CFG[alarm.severity];
              return (
                <div
                  key={i}
                  style={{
                    background:   ac.bg,
                    border:       `1px solid ${ac.dot}33`,
                    borderRadius: 8,
                    padding:      "8px 10px",
                    display:      "flex",
                    gap:          8,
                    alignItems:   "flex-start",
                  }}
                >
                  <span
                    style={{
                      width:        6,
                      height:       6,
                      borderRadius: "50%",
                      background:   ac.dot,
                      flexShrink:   0,
                      marginTop:    3,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, color: "var(--color-text-primary)", lineHeight: 1.4 }}>
                      {alarm.message}
                    </p>
                    <p style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: 2 }}>
                      {ac.label} · {alarm.age}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Connections */}
        <p
          style={{
            fontSize:      9,
            fontWeight:    700,
            textTransform: "uppercase",
            letterSpacing: "0.09em",
            color:         "var(--color-text-muted)",
            marginBottom:  8,
          }}
        >
          Connections ({neighbours.length})
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {neighbours.map(({ peer, edgeStatus }) => (
            <div
              key={peer.id}
              style={{
                display:      "flex",
                alignItems:   "center",
                gap:          8,
                background:   "var(--color-bg-elevated)",
                border:       "1px solid var(--color-border)",
                borderRadius: 7,
                padding:      "6px 10px",
              }}
            >
              <span
                style={{
                  width:        7,
                  height:       7,
                  borderRadius: "50%",
                  background:   NODE_COLOR[peer.status],
                  flexShrink:   0,
                }}
              />
              <span style={{ fontSize: 11, color: "var(--color-text-primary)", flex: 1 }}>
                {peer.label}
              </span>
              <span
                style={{
                  fontSize:      9,
                  fontWeight:    600,
                  color:         EDGE_STATUS_COLOR[edgeStatus] ?? "#9CA3AF",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {edgeStatus}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NetworkModelGraph() {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate     = useNavigate();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (!isValidDomain(domainId)) {
      navigate("/network-model");
    }
  }, [domainId, navigate]);

  useEffect(() => {
    setSelectedNodeId(null);
  }, [domainId]);

  if (!isValidDomain(domainId)) return null;

  const domain = DOMAINS[domainId];
  const data   = GRAPH_DATA[domainId] as DomainGraphData;

  function handleNodeSelect(nodeId: string) {
    setSelectedNodeId(prev => (prev === nodeId ? null : nodeId));
  }

  return (
    <div
      style={{
        display:       "flex",
        flexDirection: "row",
        height:        "calc(100vh - 116px)",
        margin:        "-16px -24px",
        overflow:      "hidden",
      }}
    >
      <NetworkModelLeftPanel
        domainId={domainId}
        onBack={() => navigate("/network-model")}
        onNewConversation={() => navigate(`/network-model/${domainId}/chat`)}
        onSelectConversation={convId => navigate(`/network-model/${domainId}/chat/${convId}`)}
      />

      <div
        style={{
          display:       "flex",
          flexDirection: "column",
          flex:          1,
          minWidth:      0,
          position:      "relative",
          borderLeft:    "1px solid var(--color-border)",
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            height:       48,
            flexShrink:   0,
            background:   "var(--color-bg-card)",
            borderBottom: "1px solid var(--color-border)",
            display:      "flex",
            alignItems:   "center",
            gap:          8,
            padding:      "0 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1 }}>
            <span
              style={{
                width:        8,
                height:       8,
                borderRadius: "50%",
                background:   domain.color,
                flexShrink:   0,
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
              {domain.label}
            </span>
          </div>
          <button
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          6,
              background:   "none",
              border:       "1px solid var(--color-border)",
              borderRadius: 8,
              padding:      "5px 12px",
              cursor:       "pointer",
              fontSize:     11,
              fontWeight:   500,
              color:        "var(--color-text-muted)",
              flexShrink:   0,
            }}
          >
            <Upload size={13} />
            Upload documents
          </button>
        </div>

        {/* Graph + detail panel overlay */}
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          <DomainGraphCanvas
            data={data}
            domainId={domainId}
            onNodeSelect={handleNodeSelect}
            selectedNodeId={selectedNodeId}
          />

          {selectedNodeId && (
            <NodeDetailPanel
              nodeId={selectedNodeId}
              data={data}
              onClose={() => setSelectedNodeId(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
