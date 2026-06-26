import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ChevronRight,
  History,
  Lock,
  Maximize2,
  Mic,
  Paperclip,
  RefreshCw,
  Send,
  Shield,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import { useAssistant } from "../hooks/use-assistant";
import { ChatMessage } from "../components/assistant/ChatMessage";
import { TypingIndicator } from "../components/assistant/TypingIndicator";
import { VisualizationCanvas } from "../components/assistant/VisualizationCanvas";
import type { AnalMsg, ChartCard } from "../types/assistant";

const CONTEXT_CHIPS = [
  { label: "3 Active Incidents", dot: "var(--color-critical)" },
  { label: "5/6 Agents",         dot: "var(--color-resolved)" },
  { label: "87.2% Health",       dot: "var(--color-resolved)" },
];

const QUICK_PROMPTS = [
  "Analyze current incidents",
  "Show network health summary",
];

export default function Assistant() {
  const { sessions, activeId, setActiveId, activeSession, isTyping, sendMessage } = useAssistant();
  const location = useLocation();

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const prevChartCount = useRef(0);
  const eventContextFired = useRef(false);

  // If navigated here from an event detail page, auto-send one focused opening
  // message so the conversation starts with context on that specific event.
  useEffect(() => {
    const ctx = (location.state as { eventContext?: { id: string; name: string; type: string; severity: string; status: string; confidence: number } } | null)?.eventContext;
    if (!ctx || eventContextFired.current) return;
    eventContextFired.current = true;
    const prompt =
      `Summarise event ${ctx.id} — "${ctx.name}". ` +
      `Type: ${ctx.type}. Severity: ${ctx.severity}. Status: ${ctx.status}. ` +
      `Forecast confidence: ${ctx.confidence}%. ` +
      `What is the current network impact, likely root cause, and recommended next steps?`;
    sendMessage(prompt);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const activeCharts: ChartCard[] = activeSession.messages
    .filter((m): m is AnalMsg => m.kind === "analysis" && Boolean(m.charts?.length))
    .flatMap((m) => m.charts!);

  const [canvasOpen, setCanvasOpen] = useState(activeCharts.length > 0);

  useEffect(() => {
    if (activeCharts.length > prevChartCount.current) {
      setCanvasOpen(true);
    }
    prevChartCount.current = activeCharts.length;
  }, [activeCharts.length]);

  useEffect(() => {
    prevChartCount.current = 0;
    setCanvasOpen(activeCharts.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession.messages, isTyping]);

  function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.focus();
  }

  return (
    <div style={{ display: "flex", height: "calc(100vh - 116px)", gap: 16 }}>

      {/* Left panel: sessions */}
      <div
        className="flex flex-col rounded-xl overflow-hidden shrink-0"
        style={{
          width: 260,
          backgroundColor: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div className="px-5 pt-5 pb-4 shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--color-brand)" }}
              >
                <Zap size={18} color="#fff" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight" style={{ color: "var(--color-text-primary)" }}>
                  MINDR Core v.4.0
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--color-resolved)" }}>
                  AI-Powered Network Operations
                </p>
              </div>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors shrink-0" style={{ color: "var(--color-text-muted)" }}>
              <SlidersHorizontal size={13} />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CONTEXT_CHIPS.map(({ label, dot }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium"
                style={{
                  backgroundColor: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dot }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ height: 1, backgroundColor: "var(--color-border)" }} />

        <div className="px-5 pt-3 pb-2 shrink-0">
          <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
            Previous Sessions
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-1" style={{ scrollbarWidth: "thin" }}>
          {sessions.map((session) => {
            const isSel     = session.id === activeId;
            const isRunning = session.status === "active";
            return (
              <button
                key={session.id}
                onClick={() => setActiveId(session.id)}
                className="w-full text-left rounded-xl p-3 transition-colors"
                style={{
                  backgroundColor: isSel ? "var(--color-bg-elevated)" : "transparent",
                  border: isSel ? "1px solid var(--color-border)" : "1px solid transparent",
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: isRunning ? "var(--color-brand)" : "var(--color-text-muted)" }}>
                    {isRunning ? "Active Session" : "Completed"}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{session.age}</span>
                </div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--color-text-primary)" }}>{session.title}</p>
                <p className="text-[10px] truncate" style={{ color: "var(--color-text-muted)" }}>{session.preview}</p>
              </button>
            );
          })}
        </div>

        <div style={{ height: 1, backgroundColor: "var(--color-border)" }} />

        <div className="px-4 py-3 shrink-0">
          <button
            className="w-full flex items-center justify-center gap-2 py-2 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          >
            <History size={12} />
            View Full History
          </button>
        </div>

        <div className="mx-3 mb-4 rounded-xl overflow-hidden shrink-0" style={{ border: "1px solid var(--color-border)" }}>
          <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ backgroundColor: "var(--color-bg-elevated)", borderBottom: "1px solid var(--color-border)" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--color-brand)" }}>
              <Zap size={13} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-primary)" }}>AI Insights</p>
              <p className="text-[9px]" style={{ color: "var(--color-resolved)" }}>94.2% Confidence Score</p>
            </div>
          </div>
          {["Export Technical Log", "Request Human Review"].map((label, i) => (
            <button
              key={label}
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium transition-colors hover:bg-white/5"
              style={{ color: "var(--color-text-primary)", borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}
            >
              {label}
              <ChevronRight size={12} style={{ color: "var(--color-text-muted)" }} />
            </button>
          ))}
        </div>
      </div>

      {/* Chat panel */}
      <div
        className="flex flex-col rounded-xl overflow-hidden"
        style={{
          flex: canvasOpen ? "0 0 440px" : "1 1 0%",
          backgroundColor: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          minWidth: 0,
          transition: "flex-basis 250ms ease-in-out",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div>
            <p className="text-sm font-semibold leading-tight" style={{ color: "var(--color-text-primary)" }}>
              {activeSession.title}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {activeSession.messages.length} message{activeSession.messages.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {activeCharts.length > 0 && (
              <button
                onClick={() => setCanvasOpen((o) => !o)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors hover:bg-white/5"
                style={{
                  color: canvasOpen ? "var(--color-brand)" : "var(--color-text-muted)",
                  border: `1px solid ${canvasOpen ? "var(--color-brand)" : "var(--color-border)"}`,
                  backgroundColor: canvasOpen ? "rgba(233,30,140,0.08)" : "transparent",
                }}
              >
                Canvas
                <span className="px-1 rounded-full text-[9px]" style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}>
                  {activeCharts.length}
                </span>
              </button>
            )}
            <button className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "var(--color-text-muted)" }}>
              <RefreshCw size={14} />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "var(--color-text-muted)" }}>
              <Maximize2 size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4" style={{ scrollbarWidth: "thin" }}>
          {activeSession.messages.map((msg, i) => (
            <ChatMessage key={i} msg={msg} />
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <TypingIndicator />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-5 py-4 shrink-0" style={{ borderTop: "1px solid var(--color-border)" }}>
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                disabled={isTyping}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors hover:bg-white/10 disabled:opacity-40"
                style={{
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)",
                  backgroundColor: "var(--color-bg-elevated)",
                }}
              >
                <Zap size={10} style={{ color: "var(--color-brand)" }} strokeWidth={2.5} />
                {prompt}
              </button>
            ))}
          </div>

          <div
            className="flex items-center gap-2 px-4 py-2"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: 9999,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask MINDR anything about your network..."
              defaultValue=""
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend((e.target as HTMLInputElement).value);
                }
              }}
              disabled={isTyping}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "var(--color-text-primary)" }}
            />
            <button className="p-1.5 rounded-full hover:bg-white/5 transition-colors shrink-0" style={{ color: "var(--color-text-muted)" }}>
              <Paperclip size={14} />
            </button>
            <button className="p-1.5 rounded-full hover:bg-white/5 transition-colors shrink-0" style={{ color: "var(--color-text-muted)" }}>
              <Mic size={14} />
            </button>
            <button
              onClick={() => {
                const el = inputRef.current;
                if (el) handleSend(el.value);
              }}
              disabled={isTyping}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all"
              style={{
                backgroundColor: !isTyping ? "var(--color-brand)" : "rgba(233,30,140,0.25)",
                color: "#fff",
              }}
            >
              <Send size={13} />
            </button>
          </div>

          <div className="flex items-center justify-between mt-2.5 px-1">
            <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
              Press{" "}
              <kbd
                className="px-1 py-px rounded text-[9px]"
                style={{
                  backgroundColor: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Enter
              </kbd>{" "}
              to send
            </p>
            <div className="flex items-center gap-4">
              {[{ Icon: Lock, label: "Encrypted Session" }, { Icon: Shield, label: "Policy Compliant" }].map(({ Icon, label }) => (
                <span key={label} className="flex items-center gap-1 text-[9px] uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                  <Icon size={9} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {canvasOpen && (
        <VisualizationCanvas
          charts={activeCharts}
          onClose={() => setCanvasOpen(false)}
        />
      )}
    </div>
  );
}
