import { Link, useLocation } from "react-router-dom";
import {
  AlertTriangle,
  BarChart2,
  Bot,
  LayoutDashboard,
  MessageSquare,
  Network,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",     href: "/dashboard", icon: LayoutDashboard                  },
  { label: "Topology",      href: "/topology",  icon: Network                           },
  { label: "Agent Runtime", href: "/agents",    icon: Bot                               },
  { label: "Incidents",     href: "/incidents", icon: AlertTriangle, badge: "3"         },
  { label: "Reports",       href: "/reports",   icon: BarChart2                         },
  { label: "Assistant",     href: "/assistant", icon: MessageSquare                     },
];

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;

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
              MINDR AI
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
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-hidden">
        {NAV_ITEMS.map(({ label, href, icon: Icon, badge }) => {
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
