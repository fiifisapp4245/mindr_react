import { useState } from "react";
import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { ChatBubble } from "../shared/ChatBubble";

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: "var(--color-bg-base)" }}>
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          status="critical"
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((o) => !o)}
        />
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="w-full h-full px-6 py-4">
            <Outlet />
          </div>
        </main>
        <ChatBubble />
      </div>
    </div>
  );
}
