import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { ChatBubble } from "../shared/ChatBubble";
import { useAuth } from "../../contexts/auth";
import { useScenario } from "../../contexts/scenario";

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { role } = useAuth();
  const { setScenario } = useScenario();

  useEffect(() => {
    if (role === "cxi") setScenario("s2");
  }, [role]);

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
