import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageSquare, Send, X, Zap } from "lucide-react";

const QUICK_PROMPTS = [
  "Analyze current incidents",
  "Show network health summary",
  "Check agent runtime status",
];

export function ChatBubble() {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const [open, setOpen]   = useState(false);
  const [input, setInput] = useState("");

  // Hidden on assistant page and network model (which has its own in-page assistant)
  if (pathname === "/assistant" || pathname.startsWith("/assistant/")) return null;
  if (pathname === "/network-model" || pathname.startsWith("/network-model/")) return null;

  function handleSend(text: string) {
    const q = text.trim();
    if (!q) return;
    navigate(`/assistant?q=${encodeURIComponent(q)}`);
    setOpen(false);
    setInput("");
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Popup panel */}
      {open && (
        <div
          className="rounded-2xl overflow-hidden flex flex-col"
          style={{
            width: 308,
            backgroundColor: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ backgroundColor: "var(--color-brand)" }}
          >
            <div className="flex items-center gap-2">
              <Zap size={14} color="#fff" strokeWidth={2.5} />
              <span className="text-sm font-bold text-white">Ask MINDR</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-0.5 rounded hover:opacity-70 transition-opacity"
            >
              <X size={14} color="#fff" />
            </button>
          </div>

          {/* Quick prompts */}
          <div className="px-3 pt-3 space-y-1.5">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => handleSend(p)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-white/5"
                style={{
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)",
                }}
              >
                <span style={{ color: "var(--color-brand)", marginRight: 6 }}>⚡</span>
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-2">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-full"
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border)",
              }}
            >
              <input
                type="text"
                placeholder="Ask anything about your network…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                autoFocus
                className="flex-1 bg-transparent outline-none text-xs"
                style={{ color: "var(--color-text-primary)" }}
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim()}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity disabled:opacity-30"
                style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
              >
                <Send size={12} />
              </button>
            </div>
            <p className="text-center mt-1.5 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
              Opens in MINDR Assistant
            </p>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{
          backgroundColor: "var(--color-brand)",
          color: "#fff",
          boxShadow: "0 4px 24px rgba(233,30,140,0.45)",
        }}
        aria-label="Open MINDR Assistant"
      >
        {open ? <X size={22} /> : <MessageSquare size={22} />}
      </button>
    </div>
  );
}
