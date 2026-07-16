import { Link, useLocation } from "react-router-dom";
import {
  BarChart2,
  Bell,
  Bot,
  LayoutDashboard,
  Network,
  Zap,
} from "lucide-react";

// A4 — placeholder for the forthcoming multi-agent product name.
export const APP_SUBTITLE = "TODO: multi-agent name";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const GLOBAL_NAV: NavItem[] = [
  { label: "Overview",      href: "/overview",       icon: LayoutDashboard },
  { label: "Knowledge Graph", href: "/network-model",  icon: Network },
  { label: "Alerts",        href: "/alerts",         icon: Bell },
  { label: "Agent activity",href: "/agents",         icon: Bot },
  { label: "Reports",       href: "/reports",        icon: BarChart2 },
];

interface GlobalSidebarProps {
  collapsed: boolean;
}

export function GlobalSidebar({ collapsed }: GlobalSidebarProps) {
  const { pathname } = useLocation();

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

      {/* Scope pill */}
      {!collapsed && (
        <div
          className="mx-3 mt-3 mb-1 px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-widest truncate"
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            color: "var(--color-text-muted)",
            border: "1px solid var(--color-border)",
          }}
        >
          All modules
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-hidden">
        {GLOBAL_NAV.map(({ label, href, icon: Icon }) => {
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
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
