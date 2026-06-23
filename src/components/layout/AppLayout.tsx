import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { GlobalSidebar } from "./GlobalSidebar";
import { ChatBubble } from "../shared/ChatBubble";
import { useAuth } from "../../contexts/auth";
import { useScenario } from "../../contexts/scenario";
import { useDomain } from "../../contexts/domain";
import { DOMAINS, type DomainId } from "../../data/domains";

// Routes that belong exclusively to a domain — used to re-sync after a cold
// browser load or history restoration (when React state resets to "all" but
// the URL is already a domain-specific page).
const ROUTE_DOMAIN: Array<[string, Exclude<DomainId, "all">]> = [
  ["/flm-dashboard", "ip-core"],
  ["/events",        "ip-core"],
  ["/alarms",        "ip-core"],
  ["/flm-reports",   "ip-core"],
  ["/cxi-cases",     "cxi"],
  ["/volte",         "volte"],
];

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { role } = useAuth();
  const { setScenario } = useScenario();
  const { activeDomain, setDomain } = useDomain();
  const location = useLocation();

  useEffect(() => {
    if (role === "cxi") setScenario("s2");
  }, [role]);

  // Sync domain ↔ URL so browser restores, history navigations, and direct
  // URL entry always show the correct sidebar.
  useEffect(() => {
    const path = location.pathname;
    if (path === "/overview") {
      setDomain("all");
      return;
    }
    // Only auto-correct when domain context has drifted back to "all"
    // (e.g. fresh page load, machine sleep-resume).
    if (activeDomain === "all") {
      const match = ROUTE_DOMAIN.find(([route]) => path === route || path.startsWith(route + "/"));
      if (match) {
        const domainId = match[1];
        setDomain(domainId);
        setScenario(DOMAINS[domainId].scenarioId);
      }
    }
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
