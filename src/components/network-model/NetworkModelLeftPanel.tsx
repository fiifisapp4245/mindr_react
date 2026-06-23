import { useState } from "react";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { CONVERSATIONS, DOMAIN_META_ROWS, CONV_STATUS } from "../../data/network-model-data";
import { DOMAINS } from "../../data/domains";

interface Props {
  domainId: "ip-core" | "cxi" | "volte";
  activeConvId?: string;
  onBack: () => void;
  onNewConversation: () => void;
  onSelectConversation: (convId: string) => void;
}

export default function NetworkModelLeftPanel({
  domainId,
  activeConvId,
  onBack,
  onNewConversation,
  onSelectConversation,
}: Props) {
  const [query, setQuery] = useState("");

  const domain   = DOMAINS[domainId];
  const metaRow  = DOMAIN_META_ROWS.find(r => r.domainId === domainId);
  const fullLabel = metaRow?.fullLabel ?? domain.label;

  const filtered = CONVERSATIONS.filter(c => {
    if (c.domainId !== domainId) return false;
    if (!query) return true;
    return c.title.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div style={{
      width:       260,
      flexShrink:  0,
      display:     "flex",
      flexDirection: "column",
      background:  "var(--color-bg-card)",
      borderRight: "1px solid var(--color-border)",
      overflow:    "hidden",
      height:      "100%",
    }}>
      {/* Header */}
      <div style={{
        padding:      "16px 16px 12px",
        borderBottom: "1px solid var(--color-border)",
      }}>
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            display:    "flex",
            alignItems: "center",
            gap:        6,
            background: "none",
            border:     "none",
            cursor:     "pointer",
            padding:    0,
            marginBottom: 12,
            color:      "var(--color-text-muted)",
            fontSize:   11,
          }}
        >
          <ArrowLeft size={13} />
          Network model
        </button>

        {/* Domain label row */}
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
            {domain.label}
          </span>
        </div>

        {/* Full label */}
        <p style={{
          fontSize:   11,
          color:      "var(--color-text-muted)",
          marginTop:  4,
          marginLeft: 16,
          lineHeight: 1.3,
        }}>
          {fullLabel}
        </p>
      </div>

      {/* Actions */}
      <div style={{
        padding:      "8px 12px",
        borderBottom: "1px solid var(--color-border)",
      }}>
        <button
          onClick={onNewConversation}
          style={{
            width:          "100%",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            gap:            6,
            background:     "rgba(226,0,122,0.12)",
            border:         "1px solid rgba(226,0,122,0.25)",
            borderRadius:   8,
            padding:        "7px 12px",
            cursor:         "pointer",
            fontSize:       12,
            fontWeight:     600,
            color:          "var(--color-brand)",
          }}
        >
          <Plus size={13} />
          New conversation
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: "8px 12px" }}>
        <div style={{
          display:     "flex",
          alignItems:  "center",
          gap:         6,
          background:  "var(--color-bg-elevated)",
          border:      "1px solid var(--color-border)",
          borderRadius: 8,
          padding:     "5px 10px",
        }}>
          <Search size={12} color="var(--color-text-muted)" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search conversations..."
            style={{
              flex:       1,
              background: "none",
              border:     "none",
              outline:    "none",
              fontSize:   11,
              color:      "var(--color-text-primary)",
            }}
          />
        </div>
      </div>

      {/* Conversation list */}
      <div style={{
        flex:       1,
        overflowY:  "auto",
        padding:    "4px 8px 8px",
      }}>
        {filtered.map(conv => {
          const isActive  = conv.id === activeConvId;
          const statusCfg = CONV_STATUS[conv.status];
          return (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              style={{
                width:       "100%",
                display:     "block",
                textAlign:   "left",
                background:  isActive ? "var(--color-bg-elevated)" : "none",
                border:      isActive ? `1px solid var(--color-brand)` : "1px solid transparent",
                borderRadius: 8,
                padding:     "10px 10px 8px",
                cursor:      "pointer",
                marginBottom: 2,
              }}
            >
              {/* Row 1: title + status */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 4 }}>
                <span style={{
                  fontSize:  11,
                  fontWeight: 600,
                  color:     "var(--color-text-primary)",
                  overflow:  "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex:      1,
                  minWidth:  0,
                }}>
                  {conv.title}
                </span>
                <span style={{
                  display:       "inline-flex",
                  alignItems:    "center",
                  fontSize:      9,
                  fontWeight:    700,
                  padding:       "2px 6px",
                  borderRadius:  4,
                  color:         statusCfg.color,
                  background:    statusCfg.bg,
                  whiteSpace:    "nowrap",
                  flexShrink:    0,
                }}>
                  {conv.status}
                </span>
              </div>

              {/* Row 2: preview */}
              <p style={{
                fontSize:     10,
                color:        "var(--color-text-muted)",
                marginTop:    3,
                overflow:     "hidden",
                textOverflow: "ellipsis",
                whiteSpace:   "nowrap",
              }}>
                {conv.preview}
              </p>

              {/* Row 3: age */}
              <p style={{
                fontSize:  9,
                color:     "var(--color-text-muted)",
                marginTop: 4,
              }}>
                {conv.age}
              </p>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", marginTop: 24 }}>
            No conversations found
          </p>
        )}
      </div>
    </div>
  );
}
