import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";
import { ChatBubble } from "../shared/ChatBubble";

export function AppLayout() {
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: "var(--color-bg-base)" }}>
      <TopBar status="critical" />
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="w-full px-6 py-4">
          <Outlet />
        </div>
      </main>
      <ChatBubble />
    </div>
  );
}
