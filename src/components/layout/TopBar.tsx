import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FileText,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Shield,
  Sun,
  User,
  X,
  Zap,
} from "lucide-react";
import { useTheme } from "../../contexts/theme";
import { Badge } from "../ui/badge";

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

const SETTINGS_ITEMS = [
  { label: "General Settings",  icon: Settings  },
  { label: "API Configuration", icon: Shield    },
  { label: "Team Management",   icon: User      },
  { label: "Audit Log",         icon: FileText  },
];

const PROFILE = {
  initials: "KA",
  name:     "Kwame Asante",
  email:    "k.asante@mindr.network",
  role:     "Level 4 Clearance",
};

const PROFILE_MENU = [
  { label: "Profile",        icon: User,      href: "#" },
  { label: "Settings",       icon: Settings,  href: "#" },
  { label: "Knowledge Base", icon: BookOpen,  href: "#" },
  { label: "Documentation",  icon: FileText,  href: "#" },
];

const DEPLOY_INCIDENTS = [
  { id: "INC-8422", label: "Core Network Overload — EU-West" },
  { id: "INC-8416", label: "232 Degraded CXI Scores"         },
];

const FIX_TYPES = [
  "Rate Limiting",
  "Traffic Redirect",
  "Patch Deployment",
  "Load Redistribution",
  "Node Restart",
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
  const { theme, toggle: toggleTheme } = useTheme();

  const [searchValue,  setSearchValue]  = useState("");
  const [showSearch,   setShowSearch]   = useState(false);
  const [showNotif,    setShowNotif]    = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);
  const [showDeploy,   setShowDeploy]   = useState(false);

  // Deploy Fix form state
  const [deployIncident, setDeployIncident] = useState(DEPLOY_INCIDENTS[0].id);
  const [deployFixType,  setDeployFixType]  = useState(FIX_TYPES[0]);
  const [deployLoading,  setDeployLoading]  = useState(false);
  const [deployDone,     setDeployDone]     = useState(false);

  const searchRef   = useRef<HTMLDivElement>(null);
  const notifRef    = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const profileRef  = useRef<HTMLDivElement>(null);

  useClickOutside(searchRef,   () => setShowSearch(false));
  useClickOutside(notifRef,    () => setShowNotif(false));
  useClickOutside(settingsRef, () => setShowSettings(false));
  useClickOutside(profileRef,  () => setShowProfile(false));

  const searchResults = searchValue.trim().length > 1
    ? SEARCH_DATA.filter(
        (d) =>
          d.label.toLowerCase().includes(searchValue.toLowerCase()) ||
          d.id.toLowerCase().includes(searchValue.toLowerCase())
      )
    : [];

  function handleDeploy() {
    setDeployLoading(true);
    setTimeout(() => {
      setDeployLoading(false);
      setDeployDone(true);
      setTimeout(() => { setDeployDone(false); setShowDeploy(false); }, 1800);
    }, 1600);
  }

  // Shared dropdown styles
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
    <>
      <header
        className="shrink-0 flex flex-col"
        style={{ backgroundColor: "var(--color-bg-card)", borderBottom: "1px solid var(--color-border)" }}
      >
        {/* ── Row 1: App bar ── */}
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
            {sidebarCollapsed
              ? <PanelLeftOpen size={18} />
              : <PanelLeftClose size={18} />
            }
          </button>

          <div className="w-px h-6 shrink-0" style={{ backgroundColor: "var(--color-border)" }} />

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

            {/* Search results */}
            {showSearch && searchResults.length > 0 && (
              <div
                className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden"
                style={{ ...dropdownBase, position: "absolute", top: "calc(100% + 6px)", boxShadow: "0 12px 32px rgba(0,0,0,0.5)" }}
              >
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
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: TYPE_COLOR[item.type] }}
                    />
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
              <div
                className="absolute top-full left-0 right-0 mt-1 rounded-xl px-4 py-5 text-center"
                style={{ ...dropdownBase, position: "absolute", top: "calc(100% + 6px)" }}
              >
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>No results for "{searchValue}"</p>
              </div>
            )}
          </div>

          <div className="flex-1" />
          <GlobalStatusBadge status={status} />

          {/* Deploy Fix */}
          <button
            onClick={() => { setShowDeploy(true); setDeployDone(false); }}
            className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-opacity hover:opacity-90 shrink-0"
            style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
          >
            Deploy Fix
          </button>

          {/* Icon actions */}
          <div className="flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>

            {/* ── Notifications ── */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setShowNotif((o) => !o); setShowSettings(false); setShowProfile(false); }}
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

            {/* ── Settings ── */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => { setShowSettings((o) => !o); setShowNotif(false); setShowProfile(false); }}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <Settings size={16} />
              </button>

              {showSettings && (
                <div style={{ ...dropdownBase, right: 0, width: 220 }}>
                  <p className="px-4 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Settings</p>
                  {SETTINGS_ITEMS.map(({ label, icon: Icon }) => (
                    <button
                      key={label}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                      style={{ color: "var(--color-text-primary)" }}
                      onClick={() => setShowSettings(false)}
                    >
                      <Icon size={14} style={{ color: "var(--color-text-muted)" }} />
                      {label}
                    </button>
                  ))}
                  <div style={{ height: 1, margin: "4px 0", backgroundColor: "var(--color-border)" }} />
                  {/* Theme toggle */}
                  <div className="flex items-center justify-between px-4 py-2.5 mb-1">
                    <div className="flex items-center gap-3 text-sm" style={{ color: "var(--color-text-primary)" }}>
                      {theme === "dark" ? <Moon size={14} style={{ color: "var(--color-text-muted)" }} /> : <Sun size={14} style={{ color: "var(--color-text-muted)" }} />}
                      {theme === "dark" ? "Dark Mode" : "Light Mode"}
                    </div>
                    <button
                      onClick={toggleTheme}
                      className="relative w-10 h-5 rounded-full transition-colors shrink-0"
                      style={{ backgroundColor: theme === "light" ? "var(--color-brand)" : "rgba(255,255,255,0.15)" }}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                        style={{ left: theme === "light" ? "calc(100% - 18px)" : "2px" }}
                      />
                    </button>
                  </div>
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
                onClick={() => { setShowProfile((o) => !o); setShowNotif(false); setShowSettings(false); }}
                className="flex items-center gap-2.5"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
                >
                  {PROFILE.initials}
                </div>
                <div className="flex flex-col leading-tight text-left">
                  <span className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>{PROFILE.name}</span>
                  <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{PROFILE.role}</span>
                </div>
              </button>

              {showProfile && (
                <div style={{ ...dropdownBase, right: 0, width: 260 }}>
                  {/* Profile header */}
                  <div className="px-4 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
                    >
                      {PROFILE.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{PROFILE.name}</p>
                      <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{PROFILE.email}</p>
                      <span
                        className="text-[9px] font-semibold px-1.5 py-px rounded-full uppercase tracking-wider"
                        style={{ backgroundColor: "rgba(233,30,140,0.12)", color: "var(--color-brand)" }}
                      >
                        {PROFILE.role}
                      </span>
                    </div>
                  </div>

                  {/* Menu items */}
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
                      onClick={() => { setShowProfile(false); navigate("/login"); }}
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

      {/* ── Deploy Fix modal ──────────────────────────────────────────────────── */}
      {showDeploy && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeploy(false); }}
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              width: 480,
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
            }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(233,30,140,0.12)" }}>
                  <Zap size={16} style={{ color: "var(--color-brand)" }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>Deploy Automated Fix</p>
                  <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>Dispatch a resolution agent to the selected incident</p>
                </div>
              </div>
              <button onClick={() => setShowDeploy(false)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "var(--color-text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            {deployDone ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(45,212,191,0.12)" }}>
                  <CheckCircle2 size={24} style={{ color: "var(--color-resolved)" }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-resolved)" }}>Fix Deployed Successfully</p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Agent dispatched and resolution underway</p>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-5">
                {/* Incident selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>
                    Target Incident
                  </label>
                  <select
                    value={deployIncident}
                    onChange={(e) => setDeployIncident(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: "var(--color-bg-card)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {DEPLOY_INCIDENTS.map((inc) => (
                      <option key={inc.id} value={inc.id} style={{ backgroundColor: "var(--color-bg-elevated)" }}>
                        {inc.id} — {inc.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fix type */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>
                    Fix Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {FIX_TYPES.map((fix) => (
                      <button
                        key={fix}
                        onClick={() => setDeployFixType(fix)}
                        className="px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors"
                        style={{
                          backgroundColor: deployFixType === fix ? "rgba(233,30,140,0.1)" : "var(--color-bg-card)",
                          border: `1px solid ${deployFixType === fix ? "var(--color-brand)" : "var(--color-border)"}`,
                          color: deployFixType === fix ? "var(--color-brand)" : "var(--color-text-muted)",
                        }}
                      >
                        {fix}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div
                  className="rounded-lg px-4 py-3 text-xs"
                  style={{ backgroundColor: "rgba(233,30,140,0.06)", border: "1px solid rgba(233,30,140,0.15)" }}
                >
                  <p className="font-medium mb-0.5" style={{ color: "var(--color-text-primary)" }}>
                    Auto Resolver will apply <span style={{ color: "var(--color-brand)" }}>{deployFixType}</span> to <span style={{ color: "var(--color-brand)" }}>{deployIncident}</span>
                  </p>
                  <p style={{ color: "var(--color-text-muted)" }}>Agent will be dispatched immediately. Estimated resolution: 4–8 minutes.</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeploy(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
                    style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeploy}
                    disabled={deployLoading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
                  >
                    {deployLoading ? "Deploying…" : "Deploy Fix"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
