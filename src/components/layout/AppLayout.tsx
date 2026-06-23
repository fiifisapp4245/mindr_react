import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { GlobalSidebar } from "./GlobalSidebar";
import { ChatBubble } from "../shared/ChatBubble";
import { useAuth } from "../../contexts/auth";
import { useScenario } from "../../contexts/scenario";
import { useDomain } from "../../contexts/domain";

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { role } = useAuth();
  const { setScenario } = useScenario();
  const { activeDomain, setDomain } = useDomain();
  const location = useLocation();

  useEffect(() => {
    if (role === "cxi") setScenario("s2");
  }, [role]);

  // Keep domain in sync with the overview route (e.g. browser back, sidebar link)
  useEffect(() => {
    if (location.pathname === "/overview") setDomain("all");
  }, [location.pathname]);

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: "var(--color-bg-base)" }}>
      {activeDomain === "all"
        ? <GlobalSidebar collapsed={sidebarCollapsed} />
        : <Sidebar collapsed={sidebarCollapsed} />
      }
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
