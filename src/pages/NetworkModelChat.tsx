import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mic, Paperclip, Send, Upload, Zap, Network } from "lucide-react";
import { useScenario } from "../contexts/scenario";
import {
  SUGGESTION_CHIPS,
  MOCK_RESPONSES,
  CONVERSATIONS,
  GRAPH_DATA,
} from "../data/network-model-data";
import { DOMAINS } from "../data/domains";
import NetworkModelLeftPanel from "../components/network-model/NetworkModelLeftPanel";
import DomainGraphCanvas from "../components/network-model/DomainGraphCanvas";

type ValidDomain = "ip-core" | "cxi" | "volte";
const VALID_DOMAINS: ValidDomain[] = ["ip-core", "cxi", "volte"];

function isValidDomain(id: string | undefined): id is ValidDomain {
  return VALID_DOMAINS.includes(id as ValidDomain);
}

type ChatMsg = { role: "user" | "assistant"; text: string };

export default function NetworkModelChat() {
  const { domainId, convId } = useParams<{ domainId: string; convId?: string }>();
  const navigate             = useNavigate();
  const { activeUser }       = useScenario();

  const [messages,  setMessages]  = useState<ChatMsg[]>([]);
  const [isTyping,  setIsTyping]  = useState(false);
  const [inputVal,  setInputVal]  = useState("");
  const inputRef  = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Redirect if domain is invalid
  useEffect(() => {
    if (!isValidDomain(domainId)) {
      navigate("/network-model");
    }
  }, [domainId, navigate]);

  // Load conversation if convId present
  useEffect(() => {
    if (convId) {
      const conv = CONVERSATIONS.find(c => c.id === convId);
      if (conv) {
        setMessages([{
          role: "assistant",
          text: conv.preview + "\n\nThis is the summary from the previous session. Feel free to continue the conversation.",
        }]);
      }
    } else {
      setMessages([]);
    }
  }, [convId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  if (!isValidDomain(domainId)) return null;

  const domain = DOMAINS[domainId];

  function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    setInputVal("");
    if (inputRef.current) inputRef.current.value = "";
    setMessages(prev => [...prev, { role: "user", text: trimmed }]);
    setIsTyping(true);
    setTimeout(() => {
      const responses = MOCK_RESPONSES[domainId as ValidDomain];
      const reply = responses[Math.floor(messages.length / 2) % responses.length];
      setMessages(prev => [...prev, { role: "assistant", text: reply }]);
      setIsTyping(false);
    }, 1400);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputVal);
    }
  }

  function handleNodeSelect(nodeId: string) {
    console.log("[NetworkModelChat] node selected:", nodeId);
  }

  const showGreeting = messages.length === 0 && !isTyping;

  // Derive domain color with rgba bg for scope badge
  const domainColorBg = domain.color
    .replace("#", "")
    .match(/.{2}/g)
    ?.map(h => parseInt(h, 16))
    .join(",") ?? "226,0,122";

  return (
    <div style={{
      display:       "flex",
      flexDirection: "row",
      height:        "calc(100vh - 116px)",
      margin:        "-16px -24px",
      overflow:      "hidden",
    }}>
      {/* Left panel */}
      <NetworkModelLeftPanel
        domainId={domainId}
        activeConvId={convId}
        onBack={() => navigate("/network-model")}
        onNewConversation={() => navigate(`/network-model/${domainId}/chat`)}
        onSelectConversation={id => navigate(`/network-model/${domainId}/chat/${id}`)}
      />

      {/* Right: chat column */}
      <div style={{
        display:       "flex",
        flexDirection: "column",
        flex:          1,
        minWidth:      0,
        borderLeft:    "1px solid var(--color-border)",
        background:    "var(--color-bg-base)",
      }}>
        {/* Chat header */}
        <div style={{
          height:       56,
          flexShrink:   0,
          padding:      "0 20px",
          display:      "flex",
          alignItems:   "center",
          gap:          10,
          borderBottom: "1px solid var(--color-border)",
          background:   "var(--color-bg-card)",
        }}>
          <Network size={14} color={domain.color} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
            {domain.label}
          </span>

          {/* Scope badge */}
          <span style={{
            fontSize:      10,
            fontWeight:    600,
            padding:       "3px 10px",
            borderRadius:  9999,
            color:         domain.color,
            background:    `rgba(${domainColorBg},0.14)`,
            border:        `1px solid rgba(${domainColorBg},0.28)`,
            whiteSpace:    "nowrap",
          }}>
            {domain.label} knowledge graph only
          </span>

          <div style={{ flex: 1 }} />

          {/* Upload */}
          <button style={{
            display:    "flex",
            alignItems: "center",
            gap:        6,
            background: "none",
            border:     "1px solid var(--color-border)",
            borderRadius: 8,
            padding:    "5px 12px",
            cursor:     "pointer",
            fontSize:   11,
            fontWeight: 500,
            color:      "var(--color-text-muted)",
            flexShrink: 0,
          }}>
            <Upload size={12} />
            Upload
          </button>
        </div>

        {/* Main area: greeting or messages */}
        {showGreeting ? (
          <div style={{
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            flex:           1,
            gap:            12,
            padding:        32,
            overflowY:      "auto",
          }}>
            {/* Icon */}
            <div style={{
              width:          48,
              height:         48,
              borderRadius:   "50%",
              background:     "rgba(226,0,122,0.14)",
              border:         "1px solid rgba(226,0,122,0.3)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
            }}>
              <Zap size={20} color="var(--color-brand)" />
            </div>

            <p style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)" }}>
              Hello, {activeUser.name}
            </p>

            <p style={{
              fontSize:  13,
              color:     "var(--color-text-muted)",
              textAlign: "center",
              maxWidth:  340,
              lineHeight: 1.5,
            }}>
              Ask me anything about the {domain.label} knowledge graph. I can only see {domain.label} data — for cross-domain queries, use the global Assistant.
            </p>

            {/* Suggestion chips */}
            <div style={{
              display:         "flex",
              flexWrap:        "wrap",
              gap:             8,
              justifyContent:  "center",
              marginTop:       8,
            }}>
              {SUGGESTION_CHIPS[domainId].map(chip => (
                <button
                  key={chip}
                  onClick={() => handleSend(chip)}
                  style={{
                    display:     "flex",
                    alignItems:  "center",
                    gap:         6,
                    background:  "var(--color-bg-elevated)",
                    border:      "1px solid var(--color-border)",
                    borderRadius: 9999,
                    padding:     "6px 12px",
                    cursor:      "pointer",
                    fontSize:    11,
                    color:       "var(--color-text-muted)",
                  }}
                >
                  <Zap size={10} color="var(--color-brand)" />
                  {chip}
                </button>
              ))}
            </div>

            {/* Mini graph preview */}
            <div style={{
              width:        "100%",
              maxWidth:     480,
              height:       200,
              borderRadius: 12,
              overflow:     "hidden",
              border:       "1px solid var(--color-border)",
              marginTop:    8,
              position:     "relative",
            }}>
              <DomainGraphCanvas
                data={GRAPH_DATA[domainId]}
                domainId={domainId}
                onNodeSelect={handleNodeSelect}
              />
            </div>
          </div>
        ) : (
          <div style={{
            flex:      1,
            overflowY: "auto",
            padding:   "16px 20px",
            display:   "flex",
            flexDirection: "column",
            gap:       16,
          }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display:        "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  gap:            8,
                }}
              >
                {msg.role === "assistant" && (
                  <div style={{
                    width:          28,
                    height:         28,
                    borderRadius:   "50%",
                    background:     "rgba(226,0,122,0.14)",
                    border:         "1px solid rgba(226,0,122,0.3)",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    flexShrink:     0,
                    marginTop:      2,
                  }}>
                    <Network size={12} color="var(--color-brand)" />
                  </div>
                )}
                <div style={{
                  maxWidth:     "72%",
                  background:   msg.role === "user"
                    ? "var(--color-brand)"
                    : "var(--color-bg-card)",
                  border:       msg.role === "assistant"
                    ? "1px solid var(--color-border)"
                    : "none",
                  borderRadius: msg.role === "user"
                    ? "16px 16px 4px 16px"
                    : "16px 16px 16px 4px",
                  padding:      "10px 14px",
                  fontSize:     13,
                  lineHeight:   1.55,
                  color:        msg.role === "user"
                    ? "#ffffff"
                    : "var(--color-text-primary)",
                  whiteSpace:   "pre-line",
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <div style={{
                  width:          28,
                  height:         28,
                  borderRadius:   "50%",
                  background:     "rgba(226,0,122,0.14)",
                  border:         "1px solid rgba(226,0,122,0.3)",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  flexShrink:     0,
                  marginTop:      2,
                }}>
                  <Network size={12} color="var(--color-brand)" />
                </div>
                <div style={{
                  background:   "var(--color-bg-card)",
                  border:       "1px solid var(--color-border)",
                  borderRadius: "16px 16px 16px 4px",
                  padding:      "12px 16px",
                  display:      "flex",
                  gap:          5,
                  alignItems:   "center",
                }}>
                  {[0, 1, 2].map(j => (
                    <span
                      key={j}
                      style={{
                        width:     6,
                        height:    6,
                        borderRadius: "50%",
                        background: "var(--color-text-muted)",
                        display:   "block",
                        animation: `nm-dot-bounce 1.1s ${j * 0.18}s ease-in-out infinite`,
                      }}
                    />
                  ))}
                  <style>{`
                    @keyframes nm-dot-bounce {
                      0%, 80%, 100% { transform: translateY(0);   opacity: 0.4; }
                      40%           { transform: translateY(-5px); opacity: 1;   }
                    }
                  `}</style>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}

        {/* Input area */}
        <div style={{
          padding:      "12px 16px",
          borderTop:    "1px solid var(--color-border)",
          background:   "var(--color-bg-card)",
          flexShrink:   0,
        }}>
          <div style={{
            display:      "flex",
            alignItems:   "center",
            gap:          4,
            background:   "var(--color-bg-elevated)",
            border:       "1px solid var(--color-border)",
            borderRadius: 9999,
            padding:      "6px 6px 6px 16px",
          }}>
            <input
              ref={inputRef}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask me anything about ${domain.label} data...`}
              style={{
                flex:       1,
                background: "none",
                border:     "none",
                outline:    "none",
                fontSize:   13,
                color:      "var(--color-text-primary)",
              }}
            />
            <button style={{
              background: "none",
              border:     "none",
              cursor:     "pointer",
              padding:    "4px 6px",
              color:      "var(--color-text-muted)",
              display:    "flex",
              alignItems: "center",
            }}>
              <Paperclip size={15} />
            </button>
            <button style={{
              background: "none",
              border:     "none",
              cursor:     "pointer",
              padding:    "4px 6px",
              color:      "var(--color-text-muted)",
              display:    "flex",
              alignItems: "center",
            }}>
              <Mic size={15} />
            </button>
            <button
              onClick={() => handleSend(inputVal)}
              style={{
                width:          32,
                height:         32,
                borderRadius:   "50%",
                background:     "var(--color-brand)",
                border:         "none",
                cursor:         "pointer",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                flexShrink:     0,
              }}
            >
              <Send size={14} color="#ffffff" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
