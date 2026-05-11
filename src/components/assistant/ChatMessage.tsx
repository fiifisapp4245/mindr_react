import { AlertCircle, Search, Target } from "lucide-react";
import type { Message } from "../../types/assistant";
import { BoldText } from "../shared/BoldText";

export function ChatMessage({ msg }: { msg: Message }) {
  if (msg.kind === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-sm">
          <div
            className="rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed"
            style={{ backgroundColor: "var(--color-bg-elevated)", color: "var(--color-text-primary)" }}
          >
            {msg.text}
          </div>
          <p className="text-[10px] mt-1 text-right" style={{ color: "var(--color-text-muted)" }}>
            {msg.time}
          </p>
        </div>
      </div>
    );
  }

  if (msg.kind === "text") {
    return (
      <div className="flex justify-start">
        <div className="max-w-lg">
          <div
            className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed"
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          >
            {msg.text}
          </div>
          <p className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>{msg.time}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start w-full">
      <div
        className="rounded-xl w-full overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
      >
        <div
          className="px-5 py-2.5"
          style={{ borderBottom: "1px solid var(--color-border)", borderLeft: "3px solid var(--color-brand)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-brand)" }}>
            Analysis Result
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Search size={11} style={{ color: "var(--color-brand)" }} />
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--color-text-primary)" }}>
                Root Cause
              </p>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)", paddingLeft: 19 }}>
              <BoldText text={msg.rootCause} />
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={11} style={{ color: "var(--color-critical)" }} />
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--color-text-primary)" }}>
                Impact
              </p>
            </div>
            <ul className="space-y-1.5" style={{ paddingLeft: 19 }}>
              {msg.impact.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-snug" style={{ color: "var(--color-text-muted)" }}>
                  <span className="mt-2 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: "var(--color-text-muted)" }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target size={11} style={{ color: "var(--color-warning)" }} />
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--color-text-primary)" }}>
                Recommendation
              </p>
            </div>
            <div
              className="rounded-lg px-4 py-3 text-sm leading-relaxed"
              style={{
                backgroundColor: "rgba(45,212,191,0.06)",
                border: "1px solid rgba(45,212,191,0.18)",
                color: "var(--color-text-primary)",
                marginLeft: 19,
              }}
            >
              <span style={{ color: "var(--color-resolved)", fontWeight: 600 }}>Action: </span>
              {msg.recommendation}
            </div>
          </div>
        </div>

        <div className="px-5 py-2" style={{ borderTop: "1px solid var(--color-border)" }}>
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
            {msg.time} &bull; Analysis completed in {msg.duration}
          </p>
        </div>
      </div>
    </div>
  );
}
