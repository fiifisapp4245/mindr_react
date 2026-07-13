import { useState, useRef, useEffect, Fragment } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Send, X, MapPin, Users, Network, Mic, Paperclip, Pencil } from "lucide-react";
import { useScenario } from "../contexts/scenario";
import { DOMAINS } from "../data/domains";
import {
  GRAPH_DATA,
  NODE_DETAILS,
  NODE_COLOR,
  INITIAL_CONVERSATIONS,
  SUGGESTION_CHIPS,
  matchIntent,
  type DomainGraphData,
  type GraphNode,
  type EdgeStatus,
  type ChatMsg,
  type ConvEntry,
} from "../data/network-model-data";
import DomainGraphCanvas from "../components/network-model/DomainGraphCanvas";
import NetworkModelLeftPanel from "../components/network-model/NetworkModelLeftPanel";

// ─── Types / validation ───────────────────────────────────────────────────────

type ValidDomain = "ip-core" | "cxi" | "volte";
const VALID_DOMAINS: ValidDomain[] = ["ip-core", "cxi", "volte"];

function isValidDomain(id: string | undefined): id is ValidDomain {
  return VALID_DOMAINS.includes(id as ValidDomain);
}

// ─── KPI / alarm color configs (node detail panel) ───────────────────────────

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

// ─── Node detail panel ────────────────────────────────────────────────────────

function NodeDetailPanel({
  nodeId,
  data,
  onClose,
  onAskAbout,
}: {
  nodeId:    string;
  data:      DomainGraphData;
  onClose:   () => void;
  onAskAbout:(text: string) => void;
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
      return peer ? { peer, edgeStatus: e.status as EdgeStatus } : null;
    })
    .filter((x): x is { peer: GraphNode; edgeStatus: EdgeStatus } => x !== null);

  return (
    <div style={{
      position:      "absolute",
      right:         0,
      top:           0,
      bottom:        0,
      width:         320,
      zIndex:        20,
      background:    "var(--color-bg-card)",
      borderLeft:    "1px solid var(--color-border)",
      display:       "flex",
      flexDirection: "column",
      overflow:      "hidden",
    }}>
      {/* Header */}
      <div style={{
        display:      "flex",
        alignItems:   "center",
        gap:          10,
        padding:      "14px 16px 12px",
        borderBottom: "1px solid var(--color-border)",
        flexShrink:   0,
      }}>
        <span style={{
          width:        10,
          height:       10,
          borderRadius: "50%",
          background:   color,
          flexShrink:   0,
          boxShadow:    `0 0 6px ${color}88`,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize:     13,
            fontWeight:   700,
            color:        "var(--color-text-primary)",
            whiteSpace:   "nowrap",
            overflow:     "hidden",
            textOverflow: "ellipsis",
          }}>
            {node.label}
          </p>
          <p style={{
            fontSize:      10,
            color:         color,
            fontWeight:    600,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginTop:     1,
          }}>
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

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.5, marginBottom: 14 }}>
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
        <p style={{
          fontSize:      9,
          fontWeight:    700,
          textTransform: "uppercase",
          letterSpacing: "0.09em",
          color:         "var(--color-text-muted)",
          marginBottom:  8,
        }}>
          Key metrics
        </p>
        <div style={{
          display:             "grid",
          gridTemplateColumns: "1fr 1fr",
          gap:                 8,
          marginBottom:        18,
        }}>
          {detail.kpis.map(kpi => {
            const c = KPI_COLOR[kpi.status];
            return (
              <div key={kpi.label} style={{
                background:   "var(--color-bg-elevated)",
                border:       "1px solid var(--color-border)",
                borderRadius: 8,
                padding:      "8px 10px",
              }}>
                <p style={{
                  fontSize:      9,
                  color:         "var(--color-text-muted)",
                  fontWeight:    500,
                  marginBottom:  4,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}>
                  {kpi.label}
                </p>
                <p style={{
                  fontSize:     13,
                  fontWeight:   700,
                  color:        c.text,
                  background:   c.bg,
                  borderRadius: 4,
                  padding:      "1px 5px",
                  display:      "inline-block",
                }}>
                  {kpi.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Alarms */}
        <p style={{
          fontSize:      9,
          fontWeight:    700,
          textTransform: "uppercase",
          letterSpacing: "0.09em",
          color:         "var(--color-text-muted)",
          marginBottom:  8,
        }}>
          Active alarms ({detail.alarms.length})
        </p>
        {detail.alarms.length === 0 ? (
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 18, fontStyle: "italic" }}>
            No active alarms
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
            {detail.alarms.map((alarm, i) => {
              const ac = ALARM_CFG[alarm.severity];
              return (
                <div key={i} style={{
                  background:   ac.bg,
                  border:       `1px solid ${ac.dot}33`,
                  borderRadius: 8,
                  padding:      "8px 10px",
                  display:      "flex",
                  gap:          8,
                  alignItems:   "flex-start",
                }}>
                  <span style={{
                    width:        6,
                    height:       6,
                    borderRadius: "50%",
                    background:   ac.dot,
                    flexShrink:   0,
                    marginTop:    3,
                  }} />
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
        <p style={{
          fontSize:      9,
          fontWeight:    700,
          textTransform: "uppercase",
          letterSpacing: "0.09em",
          color:         "var(--color-text-muted)",
          marginBottom:  8,
        }}>
          Connections ({neighbours.length})
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 16 }}>
          {neighbours.map(({ peer, edgeStatus }) => (
            <div key={peer.id} style={{
              display:      "flex",
              alignItems:   "center",
              gap:          8,
              background:   "var(--color-bg-elevated)",
              border:       "1px solid var(--color-border)",
              borderRadius: 7,
              padding:      "6px 10px",
            }}>
              <span style={{
                width:        7,
                height:       7,
                borderRadius: "50%",
                background:   NODE_COLOR[peer.status],
                flexShrink:   0,
              }} />
              <span style={{ fontSize: 11, color: "var(--color-text-primary)", flex: 1 }}>
                {peer.label}
              </span>
              <span style={{
                fontSize:      9,
                fontWeight:    600,
                color:         EDGE_STATUS_COLOR[edgeStatus] ?? "#9CA3AF",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}>
                {edgeStatus}
              </span>
            </div>
          ))}
        </div>

        {/* Ask follow-up */}
        <button
          onClick={() => onAskAbout(`Tell me about ${node.label}`)}
          style={{
            width:          "100%",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            gap:            6,
            background:     "rgba(226,0,122,0.10)",
            border:         "1px solid rgba(226,0,122,0.22)",
            borderRadius:   8,
            padding:        "8px 12px",
            cursor:         "pointer",
            fontSize:       11,
            fontWeight:     600,
            color:          "var(--color-brand)",
          }}
        >
          <Network size={11} />
          Ask about {node.label}
        </button>
      </div>
    </div>
  );
}

// ─── Entity-linked text renderer ─────────────────────────────────────────────
// Scans assistant response text for node labels and wraps them in
// clickable spans that highlight the corresponding node in the graph.

function renderEntityText(
  text: string,
  nodes: GraphNode[],
  onEntityClick: (nodeId: string) => void
): React.ReactNode {
  // Sort longest first to avoid partial matches ("EU-CORE-02" before "EU")
  const sorted = [...nodes].sort((a, b) => b.label.length - a.label.length);
  const pattern = sorted
    .map(n => n.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  if (!pattern) {
    return text.split("\n").map((line, i) => (
      <Fragment key={i}>{line}{i < text.split("\n").length - 1 ? <br /> : null}</Fragment>
    ));
  }

  const regex = new RegExp(`(${pattern})`, "gi");
  // Process line by line so we can render <br> for newlines
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    const parts = line.split(regex);
    parts.forEach((part, partIdx) => {
      const matchedNode = sorted.find(n => n.label.toLowerCase() === part.toLowerCase());
      if (matchedNode) {
        result.push(
          <span
            key={`${lineIdx}-${partIdx}`}
            onClick={() => onEntityClick(matchedNode.id)}
            style={{
              color:         NODE_COLOR[matchedNode.status],
              cursor:        "pointer",
              borderBottom:  `1px dotted ${NODE_COLOR[matchedNode.status]}`,
              fontWeight:    700,
            }}
          >
            {part}
          </span>
        );
      } else {
        result.push(<Fragment key={`${lineIdx}-${partIdx}`}>{part}</Fragment>);
      }
    });
    if (lineIdx < lines.length - 1) {
      result.push(<br key={`br-${lineIdx}`} />);
    }
  });

  return result;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NetworkModelGraph() {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { activeUser } = useScenario();

  // Redirect on invalid domain
  useEffect(() => {
    if (!isValidDomain(domainId)) navigate("/network-model");
  }, [domainId, navigate]);

  // ── Conversation state ────────────────────────────────────────────────────

  const [conversations,  setConversations]  = useState<ConvEntry[]>(INITIAL_CONVERSATIONS);
  const [messages,       setMessages]       = useState<ChatMsg[]>([]);
  const [activeConvId,   setActiveConvId]   = useState<string | null>(null);
  const [isTyping,       setIsTyping]       = useState(false);
  const [inputVal,       setInputVal]       = useState("");
  // True from "New Conversation" click until the first message is sent —
  // shows the full-page greeting in place of the graph.
  const [isComposing,    setIsComposing]    = useState(false);
  const [pendingFocus,   setPendingFocus]   = useState(false);

  // ── Graph state ───────────────────────────────────────────────────────────

  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const [selectedNodeId,     setSelectedNodeId]     = useState<string | null>(null);

  const inputRef  = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoQueryFired = useRef(false);

  // Reset state when domain changes
  useEffect(() => {
    setMessages([]);
    setActiveConvId(null);
    setHighlightedNodeIds([]);
    setSelectedNodeId(null);
    setInputVal("");
    setIsComposing(false);
  }, [domainId]);

  // Auto-submit a query passed via route state (e.g. an FLM Dashboard KPI card
  // deep-linking here with a pre-defined question) so the user lands on a
  // streaming answer instead of an empty prompt.
  useEffect(() => {
    const autoQuery = (location.state as { autoQuery?: string } | null)?.autoQuery;
    if (!autoQuery || autoQueryFired.current) return;
    autoQueryFired.current = true;
    handleSend(autoQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus whichever input (greeting or thread) is mounted after a node click
  useEffect(() => {
    if (pendingFocus) {
      inputRef.current?.focus();
      setPendingFocus(false);
    }
  }, [pendingFocus, isComposing, messages.length]);

  if (!isValidDomain(domainId)) return null;

  // Re-narrowed const: TS control-flow narrowing from the guard above doesn't
  // persist into the nested closures below (handleSend, setTimeout).
  const domain    = DOMAINS[domainId];
  const dId: ValidDomain = domainId;
  const graphData = GRAPH_DATA[domainId] as DomainGraphData;
  const showGreeting = isComposing && messages.length === 0;
  const sidebarMode: "history" | "thread" = messages.length > 0 ? "thread" : "history";
  const firstName = activeUser.name.split(" ")[0];

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    setInputVal("");
    setIsComposing(false);

    const userMsg: ChatMsg = { role: "user", text: trimmed };
    const newMessages      = [...messages, userMsg];
    setMessages(newMessages);
    setIsTyping(true);

    // If this is the first message, create a history entry now
    let convId = activeConvId;
    if (!convId) {
      convId = `conv-${Date.now()}`;
      const title = trimmed.length > 58 ? trimmed.slice(0, 55) + "…" : trimmed;
      const newConv: ConvEntry = {
        id:        convId,
        title,
        timestamp: new Date().toISOString(),
        domainId:  dId,
        messages:  newMessages,
      };
      setConversations(prev => [newConv, ...prev.filter(c => c.domainId === dId || c.domainId !== dId)]);
      setActiveConvId(convId);
    }

    const fConvId = convId;

    setTimeout(() => {
      const answer       = matchIntent(trimmed, dId);
      const assistantMsg: ChatMsg = {
        role:             "assistant",
        text:             answer.text,
        highlightNodeIds: answer.highlightNodeIds,
        focusNodeId:      answer.focusNodeId,
      };
      const finalMessages = [...newMessages, assistantMsg];

      setMessages(finalMessages);
      setHighlightedNodeIds(answer.highlightNodeIds);
      setIsTyping(false);

      // Persist updated messages back into the conversation history entry
      setConversations(prev =>
        prev.map(c => c.id === fConvId ? { ...c, messages: finalMessages } : c)
      );
    }, 1200);
  }

  function handleNewConversation() {
    setMessages([]);
    setActiveConvId(null);
    setHighlightedNodeIds([]);
    setSelectedNodeId(null);
    setInputVal("");
    setIsComposing(true);
  }

  function handleSelectConversation(convId: string) {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;
    setActiveConvId(convId);
    setMessages(conv.messages);
    setSelectedNodeId(null);
    setIsComposing(false);
    // Restore highlighted nodes from the last assistant message
    const lastAssistant = [...conv.messages].reverse().find(m => m.role === "assistant");
    setHighlightedNodeIds(lastAssistant?.highlightNodeIds ?? []);
  }

  // Node click: open detail panel + inject follow-up text into whichever input is visible
  function handleNodeSelect(nodeId: string) {
    const node = graphData.nodes.find(n => n.id === nodeId);
    if (!node) return;
    setSelectedNodeId(prev => (prev === nodeId ? null : nodeId));
    setInputVal(`Tell me about ${node.label}`);
    if (messages.length === 0 && !isComposing) setIsComposing(true);
    setPendingFocus(true);
  }

  // Entity click (from text): highlight that node in graph
  function handleEntityClick(nodeId: string) {
    setSelectedNodeId(nodeId);
    if (!highlightedNodeIds.includes(nodeId)) {
      setHighlightedNodeIds(prev => [...prev, nodeId]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputVal);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{
      display:       "flex",
      flexDirection: "row",
      height:        "calc(100vh - 116px)",
      margin:        "-16px -24px",
      overflow:      "hidden",
    }}>

      {/* ── Left: history / conversation sidebar ────────────────────────────── */}
      <NetworkModelLeftPanel
        domainId={domainId}
        activeConvId={activeConvId}
        conversations={conversations}
        onBack={() => navigate("/network-model")}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        thread={sidebarMode === "thread" ? {
          messages,
          isTyping,
          inputVal,
          onInputChange:       setInputVal,
          onKeyDown:           handleKeyDown,
          onSend:              () => handleSend(inputVal),
          inputRef,
          bottomRef,
          renderAssistantText: text => renderEntityText(text, graphData.nodes, handleEntityClick),
        } : null}
      />

      {/* ── Right: main pane — greeting or graph ─────────────────────────────── */}
      <div style={{
        flex:          1,
        display:       "flex",
        flexDirection: "column",
        minWidth:      0,
        position:      "relative",
        borderLeft:    "1px solid var(--color-border)",
      }}>
        {showGreeting ? (
          /* ── Full-page greeting / empty state ── */
          <div style={{
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            flex:           1,
            gap:            18,
            padding:        "24px 20px",
            overflowY:      "auto",
          }}>
            <p style={{ fontSize: 26, fontWeight: 700, color: "var(--color-text-primary)", textAlign: "center" }}>
              Hello, {firstName}!<br />How can I assist you today?
            </p>

            <div style={{
              display:      "flex",
              alignItems:   "center",
              gap:          8,
              width:        "100%",
              maxWidth:     640,
              background:   "var(--color-bg-elevated)",
              border:       "1px solid var(--color-border)",
              borderRadius: 9999,
              padding:      "8px 8px 8px 18px",
            }}>
              <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--color-text-muted)", display: "flex" }}>
                <Paperclip size={16} />
              </button>
              <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--color-text-muted)", display: "flex" }}>
                <Mic size={16} />
              </button>
              <input
                ref={inputRef}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your data…"
                style={{
                  flex:       1,
                  background: "none",
                  border:     "none",
                  outline:    "none",
                  fontSize:   13,
                  color:      "var(--color-text-primary)",
                }}
              />
              <button
                onClick={() => handleSend(inputVal)}
                disabled={!inputVal.trim() || isTyping}
                style={{
                  width:          36,
                  height:         36,
                  borderRadius:   "50%",
                  background:     inputVal.trim() && !isTyping ? "var(--color-brand)" : "var(--color-bg-base)",
                  border:         "none",
                  cursor:         inputVal.trim() && !isTyping ? "pointer" : "default",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  flexShrink:     0,
                }}
              >
                <Send size={15} color={inputVal.trim() && !isTyping ? "#ffffff" : "var(--color-text-muted)"} />
              </button>
            </div>

            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 12 }}>
                Suggestions:-
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                {SUGGESTION_CHIPS[domainId].map(chip => (
                  <button
                    key={chip}
                    onClick={() => handleSend(chip)}
                    style={{
                      background:   "var(--color-bg-elevated)",
                      border:       "1px solid var(--color-border)",
                      borderRadius: 8,
                      padding:      "10px 16px",
                      cursor:       "pointer",
                      fontSize:     12,
                      color:        "var(--color-text-primary)",
                      maxWidth:     220,
                      textAlign:    "left",
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ── Graph view ── */
          <>
            <div style={{
              flexShrink: 0,
              padding:    "20px 24px 12px",
              display:    "flex",
              alignItems: "center",
              gap:        10,
            }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
                Overall Network Architecture
              </h1>
              <Pencil size={15} color="var(--color-text-muted)" />
              <div style={{ flex: 1 }} />
              {highlightedNodeIds.length > 0 && (
                <button
                  onClick={() => { setHighlightedNodeIds([]); setSelectedNodeId(null); }}
                  style={{
                    display:      "flex",
                    alignItems:   "center",
                    gap:          5,
                    background:   "none",
                    border:       "1px solid var(--color-border)",
                    borderRadius: 6,
                    padding:      "4px 10px",
                    cursor:       "pointer",
                    fontSize:     11,
                    color:        "var(--color-text-muted)",
                  }}
                >
                  <X size={11} />
                  Show all
                </button>
              )}
            </div>

            {/* Graph canvas + node detail overlay */}
            <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
              <DomainGraphCanvas
                data={graphData}
                domainId={domainId}
                onNodeSelect={handleNodeSelect}
                selectedNodeId={selectedNodeId}
                highlightedNodeIds={highlightedNodeIds}
              />

              {selectedNodeId && (
                <NodeDetailPanel
                  nodeId={selectedNodeId}
                  data={graphData}
                  onClose={() => setSelectedNodeId(null)}
                  onAskAbout={text => {
                    setSelectedNodeId(null);
                    setInputVal(text);
                    if (messages.length === 0 && !isComposing) setIsComposing(true);
                    setPendingFocus(true);
                  }}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
