import { useState } from "react";
import { ChevronRight, ChevronDown, ChevronUp, History as HistoryIcon, Plus, Network, Send } from "lucide-react";
import type { ConvEntry, ChatMsg } from "../../data/network-model-data";
import { DOMAIN_META_ROWS } from "../../data/network-model-data";
import { DOMAINS } from "../../data/domains";

export interface ThreadPanelProps {
  messages:             ChatMsg[];
  isTyping:             boolean;
  inputVal:             string;
  onInputChange:        (val: string) => void;
  onKeyDown:            (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSend:               () => void;
  inputRef:             React.RefObject<HTMLInputElement>;
  bottomRef:            React.RefObject<HTMLDivElement>;
  renderAssistantText:  (text: string) => React.ReactNode;
}

interface Props {
  domainId:             "ip-core" | "cxi" | "volte";
  activeConvId?:        string | null;
  conversations:        ConvEntry[];
  onBack:               () => void;
  onNewConversation:    () => void;
  onSelectConversation: (convId: string) => void;
  /** When set, the panel shows the live conversation thread instead of the history list. */
  thread?:              ThreadPanelProps | null;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now  = new Date("2026-07-08T15:00:00Z"); // fixed "now" for mock data
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)   return "just now";
  if (diffMin < 60)  return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24)   return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return diffDay === 1 ? "yesterday" : `${diffDay}d ago`;
}

function isRecent(iso: string): boolean {
  const date   = new Date(iso);
  const cutoff = new Date("2026-07-08T00:00:00Z"); // start of today
  return date >= cutoff;
}

function ThreadView({
  messages,
  isTyping,
  inputVal,
  onInputChange,
  onKeyDown,
  onSend,
  inputRef,
  bottomRef,
  renderAssistantText,
}: ThreadPanelProps) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{
        flex:          1,
        overflowY:     "auto",
        padding:       "12px 12px",
        display:       "flex",
        flexDirection: "column",
        gap:           12,
      }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display:        "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              gap:            7,
            }}
          >
            {msg.role === "assistant" && (
              <div style={{
                width:          24,
                height:         24,
                borderRadius:   "50%",
                background:     "rgba(226,0,122,0.12)",
                border:         "1px solid rgba(226,0,122,0.28)",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                flexShrink:     0,
                marginTop:      2,
              }}>
                <Network size={10} color="var(--color-brand)" />
              </div>
            )}
            <div style={{
              maxWidth:     "85%",
              background:   msg.role === "user"
                ? "var(--color-brand)"
                : "var(--color-bg-elevated)",
              border:       msg.role === "assistant"
                ? "1px solid var(--color-border)"
                : "none",
              borderRadius: msg.role === "user"
                ? "12px 12px 3px 12px"
                : "12px 12px 12px 3px",
              padding:      "8px 11px",
              fontSize:     11,
              lineHeight:   1.55,
              color:        msg.role === "user" ? "#ffffff" : "var(--color-text-primary)",
              whiteSpace:   "pre-line",
            }}>
              {msg.role === "assistant" ? renderAssistantText(msg.text) : msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
            <div style={{
              width:          24,
              height:         24,
              borderRadius:   "50%",
              background:     "rgba(226,0,122,0.12)",
              border:         "1px solid rgba(226,0,122,0.28)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              flexShrink:     0,
              marginTop:      2,
            }}>
              <Network size={10} color="var(--color-brand)" />
            </div>
            <div style={{
              background:   "var(--color-bg-elevated)",
              border:       "1px solid var(--color-border)",
              borderRadius: "12px 12px 12px 3px",
              padding:      "9px 12px",
              display:      "flex",
              gap:          5,
              alignItems:   "center",
            }}>
              {[0, 1, 2].map(j => (
                <span
                  key={j}
                  style={{
                    width:        5,
                    height:       5,
                    borderRadius: "50%",
                    background:   "var(--color-text-muted)",
                    display:      "block",
                    animation:    `nm-dot ${j * 0.18}s ease-in-out infinite`,
                  }}
                />
              ))}
              <style>{`
                @keyframes nm-dot {
                  0%, 80%, 100% { transform: translateY(0);   opacity: 0.4; }
                  40%           { transform: translateY(-4px); opacity: 1;   }
                }
              `}</style>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding:    "10px 12px",
        borderTop:  "1px solid var(--color-border)",
        flexShrink: 0,
      }}>
        <div style={{
          display:      "flex",
          alignItems:   "center",
          gap:          4,
          background:   "var(--color-bg-elevated)",
          border:       "1px solid var(--color-border)",
          borderRadius: 9999,
          padding:      "4px 4px 4px 12px",
        }}>
          <input
            ref={inputRef}
            value={inputVal}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask a follow-up…"
            style={{
              flex:       1,
              background: "none",
              border:     "none",
              outline:    "none",
              fontSize:   11,
              color:      "var(--color-text-primary)",
            }}
          />
          <button
            onClick={onSend}
            disabled={!inputVal.trim() || isTyping}
            style={{
              width:          26,
              height:         26,
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
            <Send size={11} color={inputVal.trim() && !isTyping ? "#ffffff" : "var(--color-text-muted)"} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NetworkModelLeftPanel({
  domainId,
  activeConvId,
  conversations,
  onBack,
  onNewConversation,
  onSelectConversation,
  thread,
}: Props) {
  const [historyOpen, setHistoryOpen] = useState(true);

  const domain    = DOMAINS[domainId];
  const metaRow   = DOMAIN_META_ROWS.find(r => r.domainId === domainId);
  const fullLabel = metaRow?.fullLabel ?? domain.label;

  const filtered = conversations.filter(c => c.domainId === domainId);
  const recent   = filtered.filter(c => isRecent(c.timestamp));
  const earlier  = filtered.filter(c => !isRecent(c.timestamp));

  function renderConvItem(conv: ConvEntry) {
    const isActive = conv.id === activeConvId;
    return (
      <button
        key={conv.id}
        onClick={() => onSelectConversation(conv.id)}
        style={{
          width:        "100%",
          display:      "block",
          textAlign:    "left",
          background:   isActive ? "var(--color-bg-elevated)" : "none",
          border:       isActive ? "1px solid var(--color-brand)" : "1px solid transparent",
          borderRadius: 8,
          padding:      "9px 10px 7px",
          cursor:       "pointer",
          marginBottom: 2,
        }}
      >
        <span style={{
          display:      "block",
          fontSize:     11,
          fontWeight:   600,
          color:        "var(--color-text-primary)",
          overflow:     "hidden",
          textOverflow: "ellipsis",
          whiteSpace:   "nowrap",
        }}>
          {conv.title}
        </span>
        <span style={{
          display:   "block",
          fontSize:  10,
          color:     "var(--color-text-muted)",
          marginTop: 3,
        }}>
          {formatTimestamp(conv.timestamp)}
        </span>
      </button>
    );
  }

  function renderGroup(label: string, items: ConvEntry[]) {
    if (items.length === 0) return null;
    return (
      <>
        <p style={{
          fontSize:      9,
          fontWeight:    700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color:         "var(--color-text-muted)",
          padding:       "8px 10px 4px",
        }}>
          {label}
        </p>
        {items.map(renderConvItem)}
      </>
    );
  }

  return (
    <div style={{
      width:         340,
      flexShrink:    0,
      display:       "flex",
      flexDirection: "column",
      background:    "var(--color-bg-card)",
      borderRight:   "1px solid var(--color-border)",
      overflow:      "hidden",
      height:        "100%",
    }}>
      {/* Header */}
      <div style={{
        padding:      "16px 16px 12px",
        borderBottom: "1px solid var(--color-border)",
        flexShrink:   0,
      }}>
        <button
          onClick={onBack}
          style={{
            display:      "flex",
            alignItems:   "center",
            gap:          4,
            background:   "none",
            border:       "none",
            cursor:       "pointer",
            padding:      0,
            marginBottom: 12,
            color:        "var(--color-text-muted)",
            fontSize:     11,
          }}
        >
          <ChevronRight size={13} />
          Network Model
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            width:        8,
            height:       8,
            borderRadius: "50%",
            background:   domain.color,
            flexShrink:   0,
          }} />
          <span style={{
            fontSize:   16,
            fontWeight: 700,
            color:      "var(--color-text-primary)",
            lineHeight: 1.2,
          }}>
            {fullLabel}
          </span>
        </div>
      </div>

      {/* New conversation button */}
      <div style={{
        padding:      "8px 12px",
        borderBottom: "1px solid var(--color-border)",
        flexShrink:   0,
      }}>
        <button
          onClick={onNewConversation}
          style={{
            width:          "100%",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            gap:            6,
            background:     "var(--color-brand)",
            border:         "none",
            borderRadius:   8,
            padding:        "8px 12px",
            cursor:         "pointer",
            fontSize:       12,
            fontWeight:     600,
            color:          "#ffffff",
          }}
        >
          <Plus size={13} />
          New Conversation
        </button>
      </div>

      {thread ? (
        <ThreadView {...thread} />
      ) : (
        <>
          {/* History header */}
          <button
            onClick={() => setHistoryOpen(o => !o)}
            style={{
              display:        "flex",
              alignItems:     "center",
              gap:            8,
              width:          "100%",
              background:     "none",
              border:         "none",
              cursor:         "pointer",
              padding:        "10px 12px",
              flexShrink:     0,
            }}
          >
            <HistoryIcon size={13} color="var(--color-text-muted)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)" }}>
              History
            </span>
            <div style={{ flex: 1 }} />
            {historyOpen
              ? <ChevronUp size={14} color="var(--color-text-muted)" />
              : <ChevronDown size={14} color="var(--color-text-muted)" />}
          </button>

          {historyOpen && (
            <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}>
              {renderGroup("Recent", recent)}
              {renderGroup("Earlier", earlier)}

              {filtered.length === 0 && (
                <p style={{
                  fontSize:  11,
                  color:     "var(--color-text-muted)",
                  textAlign: "center",
                  marginTop: 24,
                }}>
                  No conversations yet
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
