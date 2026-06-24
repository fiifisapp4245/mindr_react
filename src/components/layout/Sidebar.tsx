import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Bell,
  Bot,
  Calendar,
  LayoutDashboard,
  MessageSquare,
  Network,
  Zap,
} from "lucide-react";
import { useScenario } from "../../contexts/scenario";
import { useDomain } from "../../contexts/domain";
import { mockCases } from "../../data/cxi-cases";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const S2_PENDING = String(mockCases.filter((c) => c.status === "pending").length);

// Domain-keyed nav — drives the sidebar when a specific domain is active in the dropdown.
const DOMAIN_NAV: Record<string, NavItem[]> = {
  "ip-core": [
    { label: "Dashboard",  href: "/flm-dashboard", icon: LayoutDashboard },
    { label: "Events",     href: "/events",         icon: Calendar },
    { label: "Alarms",     href: "/alarms",         icon: Bell, badge: "6" },
    { label: "Incidents",  href: "/incidents",      icon: AlertTriangle, badge: "3" },
    { label: "Topology",   href: "/topology",       icon: Network },
    { label: "Reports",    href: "/flm-reports",    icon: BarChart2 },
    { label: "Assistant",  href: "/assistant",      icon: MessageSquare },
  ],
  "cxi": [
    { label: "Dashboard",      href: "/dashboard",  icon: LayoutDashboard },
    { label: "Network Model",  href: "/topology",   icon: Network },
    { label: "CXI Cases",      href: "/cxi-cases",  icon: Activity, badge: S2_PENDING },
    { label: "Agent activity", href: "/agents",     icon: Bot },
    { label: "Reports",        href: "/reports",    icon: BarChart2 },
    { label: "Assistant",      href: "/assistant",  icon: MessageSquare },
  ],
  "volte": [
    { label: "Dashboard",     href: "/volte/dashboard",     icon: LayoutDashboard },
    { label: "Events",        href: "/volte/events",        icon: Calendar },
    { label: "Alarms",        href: "/volte/alarms",        icon: Bell },
    { label: "Network model", href: "/volte/network-model", icon: Network },
    { label: "Incidents",     href: "/volte/incidents",     icon: AlertTriangle },
    { label: "Reports",       href: "/volte/reports",       icon: BarChart2 },
    { label: "Assistant",     href: "/assistant",           icon: MessageSquare },
  ],
};

// Fallback nav used only when activeDomain is "all" (shouldn't normally be
// reached since GlobalSidebar renders instead, but kept as a safety net).
const SCENARIO_NAV: Record<string, NavItem[]> = {
  s1: [
    { label: "Dashboard",      href: "/flm-dashboard", icon: LayoutDashboard },
    { label: "Events",         href: "/events",         icon: Calendar },
    { label: "Alarms",         href: "/alarms",         icon: Bell, badge: "6" },
    { label: "Incidents",      href: "/incidents",      icon: AlertTriangle, badge: "3" },
    { label: "Topology",       href: "/topology",       icon: Network },
    { label: "Reports",        href: "/flm-reports",    icon: BarChart2 },
    { label: "Assistant",      href: "/assistant",      icon: MessageSquare },
  ],
  s2: [
    { label: "Dashboard",      href: "/dashboard",  icon: LayoutDashboard },
    { label: "Network Model",  href: "/topology",   icon: Network },
    { label: "CXI Cases",      href: "/cxi-cases",  icon: Activity, badge: S2_PENDING },
    { label: "Agent activity", href: "/agents",     icon: Bot },
    { label: "Reports",        href: "/reports",    icon: BarChart2 },
    { label: "Assistant",      href: "/assistant",  icon: MessageSquare },
  ],
  s3: [
    { label: "Dashboard",      href: "/dashboard",  icon: LayoutDashboard },
    { label: "Topology",       href: "/topology",   icon: Network },
    { label: "Agent activity", href: "/agents",     icon: Bot },
    { label: "Reports",        href: "/reports",    icon: BarChart2 },
    { label: "Assistant",      href: "/assistant",  icon: MessageSquare },
  ],
};

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const { activeScenario } = useScenario();
  const { activeDomain } = useDomain();

  // Domain-keyed nav takes priority when a specific domain is active.
  const navItems: NavItem[] =
    activeDomain !== "all" && DOMAIN_NAV[activeDomain]
      ? DOMAIN_NAV[activeDomain]
      : SCENARIO_NAV[activeScenario.id] ?? SCENARIO_NAV.s1;

  return (
    <aside
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        width: collapsed ? 64 : 220,
        transition: "width 0.25s ease",
        backgroundColor: "var(--color-bg-card)",
        borderRight: "1px solid var(--color-border)",
        height: "100%",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-4 shrink-0 overflow-hidden"
        style={{ height: 56, borderBottom: "1px solid var(--color-border)" }}
      >
        <div
          className="w-7 h-7 rounded flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--color-brand)" }}
        >
          <Zap size={14} strokeWidth={2.5} color="#fff" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none whitespace-nowrap">
            <span className="text-sm font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
              MINDR
            </span>
            <span
              className="text-[9px] font-medium tracking-widest uppercase"
              style={{ color: "var(--color-text-muted)", marginTop: 1 }}
            >
              Network Ops Center
            </span>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-hidden">
        {navItems.map(({ label, href, icon: Icon, badge }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              to={href}
              title={collapsed ? label : undefined}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap"
              style={{
                color: isActive ? "var(--color-brand)" : "var(--color-text-muted)",
                backgroundColor: isActive ? "rgba(233,30,140,0.08)" : "transparent",
              }}
            >
              <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} className="shrink-0" />
              {!collapsed && <span className="flex-1">{label}</span>}
              {badge && !collapsed && (
                <span
                  className="text-[10px] font-bold px-1.5 py-px rounded-full leading-none"
                  style={{
                    backgroundColor: "var(--color-critical)",
                    color: "#fff",
                    minWidth: 18,
                    textAlign: "center",
                  }}
                >
                  {badge}
                </span>
              )}
              {badge && collapsed && (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{ backgroundColor: "var(--color-critical)" }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
