import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  ChevronRight,
  FileText,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  User,
  X,
  Zap,
} from "lucide-react";
import { useScenario } from "../../contexts/scenario";
import { useAuth } from "../../contexts/auth";
import { Badge } from "../ui/badge";
import { useCxiLens, LENS_LABEL, type CxiLens } from "../../contexts/cxi-lens";
import { DomainSelector } from "./DomainSelector";

// ── Types ─────────────────────────────────────────────────────────────────────

type SystemStatus = "operational" | "degraded" | "critical" | "outage";

// ── Static data ───────────────────────────────────────────────────────────────

const SEARCH_DATA = [
  { type: "incident", id: "INC-8422", label: "Core Network Overload — EU-West",     href: "/incidents" },
  { type: "incident", id: "PRE-2019", label: "VoLTE SLA Breach Risk",               href: "/incidents" },
  { type: "incident", id: "INC-8416", label: "232 Degraded CXI Scores",             href: "/incidents" },
  { type: "node",     id: "EU-CORE-01", label: "EU-CORE-01 — Router",               href: "/topology"  },
  { type: "node",     id: "DC-ALPHA",   label: "DC-ALPHA — Data Center",            href: "/topology"  },
  { type: "node",     id: "CDN-WEST",   label: "CDN-WEST — Content Delivery",       href: "/topology"  },
  { type: "node",     id: "LATAM-DOWN", label: "LATAM-DOWN — Router (Offline)",     href: "/topology"  },
  { type: "agent",    id: "SCAN-ALPHA", label: "SCAN-ALPHA — Surveillance Layer",   href: "/agents"    },
  { type: "agent",    id: "FIX-DELTA",  label: "FIX-DELTA — Execution Layer",       href: "/agents"    },
  { type: "agent",    id: "VFY-GAMMA",  label: "VERIFY-GAMMA — Diagnostic Layer",  href: "/agents"    },
];

const TYPE_COLOR: Record<string, string> = {
  incident: "var(--color-critical)",
  node:     "var(--color-mitigating)",
  agent:    "var(--color-brand)",
};

const NOTIFICATIONS = [
  { id: "INC-8422", title: "Core Network Overload — EU-West", severity: "CRITICAL",   age: "2m ago",  dot: "var(--color-critical)"   },
  { id: "PRE-2019", title: "VoLTE SLA Breach Risk",           severity: "PREDICTED",  age: "12m ago", dot: "var(--color-warning)"    },
  { id: "INC-8416", title: "232 Degraded CXI Scores",         severity: "MITIGATING", age: "34m ago", dot: "var(--color-mitigating)" },
];

const PROFILE_MENU = [
  { label: "Profile",        icon: User,      href: "#" },
  { label: "Settings",       icon: Settings,  href: "#" },
  { label: "Knowledge Base", icon: BookOpen,  href: "#" },
  { label: "Documentation",  icon: FileText,  href: "#" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

function GlobalStatusBadge({ status }: { status: SystemStatus }) {
  if (status === "outage") {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide uppercase shrink-0"
        style={{ backgroundColor: "var(--color-critical)", color: "#fff" }}
      >
        SERVICE OUTAGE
      </div>
    );
  }
  const config = {
    operational: { dot: "var(--color-resolved)", label: "ALL SYSTEMS OPERATIONAL", pulse: false },
    degraded:    { dot: "var(--color-warning)",  label: "SYSTEM DEGRADED",          pulse: false },
    critical:    { dot: "var(--color-critical)", label: "CRITICAL — 1 ACTIVE P1",   pulse: true  },
  }[status];
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide uppercase shrink-0"
      style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
    >
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${config.pulse ? "animate-pulse-dot" : ""}`}
        style={{ backgroundColor: config.dot }}
      />
      {config.label}
    </div>
  );
}

// ── TopBar ────────────────────────────────────────────────────────────────────

interface TopBarProps {
  status?: SystemStatus;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function TopBar({ status = "critical", sidebarCollapsed = false, onToggleSidebar }: TopBarProps) {
  const navigate = useNavigate();
  const { activeScenario, activeUser, setUser } = useScenario();
  const { signOut } = useAuth();
  const { lens, setLens } = useCxiLens();
  const isCxi = activeScenario.id === "s2";

  const [searchValue, setSearchValue] = useState("");
  const [showSearch,  setShowSearch]  = useState(false);
  const [showNotif,   setShowNotif]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const searchRef  = useRef<HTMLDivElement>(null);
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useClickOutside(searchRef,  () => setShowSearch(false));
  useClickOutside(notifRef,   () => setShowNotif(false));
  useClickOutside(profileRef, () => setShowProfile(false));

  const searchResults = searchValue.trim().length > 1
    ? SEARCH_DATA.filter(
        (d) =>
          d.label.toLowerCase().includes(searchValue.toLowerCase()) ||
          d.id.toLowerCase().includes(searchValue.toLowerCase())
      )
    : [];

  const dropdownBase: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 8px)",
    zIndex: 100,
    backgroundColor: "var(--color-bg-elevated)",
    border: "1px solid var(--color-border)",
    borderRadius: 12,
    boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
    overflow: "hidden",
  };

  return (
    <header
      className="shrink-0 flex flex-col"
      style={{ backgroundColor: "var(--color-bg-card)", borderBottom: "1px solid var(--color-border)" }}
    >
      <div
        className="flex items-center gap-4 px-5 shrink-0"
        style={{ height: 56, borderBottom: "1px solid var(--color-border)" }}
      >
        {/* ── Sidebar toggle ── */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors shrink-0"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{ color: "var(--color-text-muted)" }}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        <div className="w-px h-6 shrink-0" style={{ backgroundColor: "var(--color-border)" }} />

        {/* ── Domain selector ── */}
        <DomainSelector />

        {/* ── Search ── */}
        <div className="relative flex-1 max-w-sm" ref={searchRef}>
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm"
            style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
          >
            <Search size={14} style={{ color: "var(--color-text-muted)" }} />
            <input
              type="text"
              placeholder="Search incidents, nodes, agents..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setShowSearch(true)}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "var(--color-text-primary)" }}
            />
            {searchValue && (
              <button onClick={() => { setSearchValue(""); setShowSearch(false); }} style={{ color: "var(--color-text-muted)" }}>
                <X size={12} />
              </button>
            )}
          </div>

          {showSearch && searchResults.length > 0 && (
            <div style={{ ...dropdownBase, position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, boxShadow: "0 12px 32px rgba(0,0,0,0.5)" }}>
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                Results
              </p>
              {searchResults.map((item) => (
                <Link
                  key={item.id}
                  to={item.href}
                  onClick={() => { setShowSearch(false); setSearchValue(""); }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLOR[item.type] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{item.label}</p>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: TYPE_COLOR[item.type] }}>{item.type} · {item.id}</p>
                  </div>
                  <ChevronRight size={12} style={{ color: "var(--color-text-muted)" }} />
                </Link>
              ))}
            </div>
          )}
          {showSearch && searchValue.trim().length > 1 && searchResults.length === 0 && (
            <div style={{ ...dropdownBase, position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0 }}>
              <p className="px-4 py-5 text-xs text-center" style={{ color: "var(--color-text-muted)" }}>No results for "{searchValue}"</p>
            </div>
          )}
        </div>

        <div className="flex-1" />
        <GlobalStatusBadge status={status} />

        {/* ── CXI lens switcher (S2 only) ── */}
        {isCxi && (
          <div
            className="flex items-center gap-px rounded-lg p-px shrink-0"
            style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest px-2" style={{ color: "var(--color-text-muted)" }}>
              View as
            </span>
            {(["smc", "ran"] as CxiLens[]).map((l) => (
              <button
                key={l}
                onClick={() => setLens(l)}
                className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors"
                style={{
                  backgroundColor: lens === l ? "rgba(255,255,255,0.10)" : "transparent",
                  color: lens === l ? "var(--color-text-primary)" : "var(--color-text-muted)",
                }}
              >
                {l === "smc" ? "SMC" : "RAN"}
              </button>
            ))}
          </div>
        )}

        {/* ── Icon actions ── */}
        <div className="flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>

          {/* ── Notifications ── */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotif((o) => !o); setShowProfile(false); }}
              className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Bell size={16} />
              <Badge
                className="absolute -top-0.5 -right-0.5 text-[9px] px-1 py-0 min-w-[16px] h-4 flex items-center justify-center rounded-full border-0"
                style={{ backgroundColor: "var(--color-critical)", color: "#fff" }}
              >
                3
              </Badge>
            </button>

            {showNotif && (
              <div style={{ ...dropdownBase, right: 0, width: 340 }}>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Notifications</p>
                  <span className="text-[10px] font-semibold px-1.5 py-px rounded-full" style={{ backgroundColor: "rgba(255,59,59,0.15)", color: "var(--color-critical)" }}>3 active</span>
                </div>
                {NOTIFICATIONS.map((n) => (
                  <Link
                    key={n.id}
                    to="/incidents"
                    onClick={() => setShowNotif(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <span className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: n.dot }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-snug" style={{ color: "var(--color-text-primary)" }}>{n.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-semibold" style={{ color: n.dot }}>{n.severity}</span>
                        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{n.age}</span>
                      </div>
                    </div>
                    <ChevronRight size={12} className="shrink-0 mt-1" style={{ color: "var(--color-text-muted)" }} />
                  </Link>
                ))}
                <Link
                  to="/incidents"
                  onClick={() => setShowNotif(false)}
                  className="block px-4 py-2.5 text-xs font-medium text-center hover:bg-white/5 transition-colors"
                  style={{ color: "var(--color-brand)" }}
                >
                  View all incidents →
                </Link>
              </div>
            )}
          </div>

          {/* ── Profile ── */}
          <div
            className="flex items-center gap-2.5 ml-2 pl-3 cursor-pointer relative"
            style={{ borderLeft: "1px solid var(--color-border)" }}
            ref={profileRef}
          >
            <button
              onClick={() => { setShowProfile((o) => !o); setShowNotif(false); }}
              className="flex items-center gap-2.5"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ backgroundColor: activeScenario.color, color: "#fff" }}
              >
                {activeUser.initials}
              </div>
              <div className="flex flex-col leading-tight text-left">
                <span className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>{activeUser.name}</span>
                <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{activeUser.role}</span>
              </div>
            </button>

            {showProfile && (
              <div style={{ ...dropdownBase, right: 0, width: 280 }}>
                {/* Active user header */}
                <div className="px-4 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ backgroundColor: activeScenario.color, color: "#fff" }}
                  >
                    {activeUser.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{activeUser.name}</p>
                    <p className="text-[11px] truncate" style={{ color: "var(--color-text-muted)" }}>{activeUser.email}</p>
                    <span
                      className="inline-block text-[9px] font-semibold px-1.5 py-px rounded-full uppercase tracking-wider mt-0.5"
                      style={{ backgroundColor: "rgba(255,255,255,0.08)", color: activeScenario.color }}
                    >
                      {activeUser.role}
                    </span>
                  </div>
                </div>

                {/* Scenario users switcher */}
                <div className="px-4 pt-3 pb-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>
                    {activeScenario.tag} · Switch User
                  </p>
                  <div className="space-y-1">
                    {activeScenario.users.map((u) => {
                      const isCurrent = u.id === activeUser.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => { setUser(u.id); setShowProfile(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                          style={{
                            backgroundColor: isCurrent ? "rgba(255,255,255,0.04)" : "transparent",
                            border: `1px solid ${isCurrent ? activeScenario.color : "transparent"}`,
                          }}
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                            style={{
                              backgroundColor: isCurrent ? activeScenario.color : "var(--color-bg-elevated)",
                              color: isCurrent ? "#fff" : "var(--color-text-muted)",
                            }}
                          >
                            {u.initials}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>{u.name}</p>
                            <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{u.role}</p>
                          </div>
                          {isCurrent && (
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: activeScenario.color }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ height: 1, margin: "8px 0", backgroundColor: "var(--color-border)" }} />

                <div className="py-1">
                  {PROFILE_MENU.map(({ label, icon: Icon, href }) => (
                    <Link
                      key={label}
                      to={href}
                      onClick={() => setShowProfile(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      <Icon size={14} style={{ color: "var(--color-text-muted)" }} />
                      {label}
                    </Link>
                  ))}
                </div>

                <div style={{ height: 1, backgroundColor: "var(--color-border)" }} />

                <div className="py-1">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                    style={{ color: "var(--color-critical)" }}
                    onClick={async () => { setShowProfile(false); await signOut(); navigate("/login", { replace: true }); }}
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
