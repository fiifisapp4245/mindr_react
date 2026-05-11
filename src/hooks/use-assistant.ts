import { useState } from "react";
import { generateResponse, INITIAL_SESSIONS, nowTime } from "../data/assistant";
import type { Session, UserMsg } from "../types/assistant";

export function useAssistant() {
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [activeId, setActiveId] = useState("eu-west");
  const [isTyping, setIsTyping] = useState(false);

  const activeSession = sessions.find((s) => s.id === activeId)!;

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const time    = nowTime();
    const userMsg: UserMsg = { kind: "user", text: trimmed, time };

    setSessions((prev) =>
      prev.map((s) => s.id === activeId ? { ...s, messages: [...s.messages, userMsg] } : s)
    );
    setIsTyping(true);

    setTimeout(() => {
      const response = generateResponse(trimmed, nowTime());
      setSessions((prev) =>
        prev.map((s) => s.id === activeId ? { ...s, messages: [...s.messages, response] } : s)
      );
      setIsTyping(false);
    }, 1600);
  }

  return { sessions, activeId, setActiveId, activeSession, isTyping, sendMessage };
}
