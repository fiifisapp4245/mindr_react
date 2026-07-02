import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Globe, LayoutGrid } from "lucide-react";
import { DOMAINS, canAccessDomain, type DomainId, type DomainConfig } from "../../data/domains";
import { useDomain } from "../../contexts/domain";
import { useAuth } from "../../contexts/auth";
import { useScenario } from "../../contexts/scenario";

// ── Site-map data ──────────────────────────────────────────────────────────────

const SITE_MAP: {
  sectionLabel: string;
  domainId: DomainId;
  color: string;
  pages: { label: string; href: string }[];
}[] = [
  {
    sectionLabel: "All Modules",
    domainId: "all",
    color: "var(--color-text-muted)",
    pages: [
      { label: "Dashboard",       href: "/overview"       },
      { label: "Alerts",          href: "/alerts"         },
      { label: "Events",          href: "/events"         },
      { label: "Network Model",   href: "/network-model"  },
      { label: "MINDR Assistant", href: "/assistant"      },
    ],
  },
  {
    sectionLabel: "IP Peering",
    domainId: "ip-core",
    color: "#E9187C",
    pages: [
      { label: "FLM Dashboard", href: "/flm-dashboard" },
      { label: "Alerts",        href: "/alerts"        },
      { label: "Events",        href: "/events"        },
      { label: "Reports",       href: "/flm-reports"   },
    ],
  },
  {
    sectionLabel: "CXI",
    domainId: "cxi",
    color: "#FFB020",
    pages: [
      { label: "Cases",   href: "/cxi-cases" },
      { label: "Reports", href: "/reports"   },
    ],
  },
  {
    sectionLabel: "Volte",
    domainId: "volte",
    color: "#2DD4BF",
    pages: [
      { label: "Dashboard",     href: "/volte/dashboard"     },
      { label: "Incidents",     href: "/volte/incidents"     },
      { label: "Alarms",        href: "/volte/alarms"        },
      { label: "Events",        href: "/volte/events"        },
      { label: "Reports",       href: "/volte/reports"       },
      { label: "Service Chain", href: "/volte/network-model" },
    ],
  },
];

export function DomainSelector() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { activeDomain, setDomain } = useDomain();
  const { role } = useAuth();
  const { setScenario } = useScenario();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLabel =
    activeDomain === "all"
      ? "All modules"
      : (DOMAINS[activeDomain as Exclude<DomainId, "all">]?.label ?? "All modules");

  function handleSelect(id: DomainId) {
    setOpen(false);
    setDomain(id);
    if (id === "all") {
      navigate("/overview");
    } else {
      const domain: DomainConfig = DOMAINS[id as Exclude<DomainId, "all">];
      setScenario(domain.scenarioId);
      navigate(domain.defaultRoute);
    }
  }

  function handleSiteMapNav(href: string, domainId: DomainId) {
    setOpen(false);
    setDomain(domainId);
    if (domainId !== "all") {
      const domain: DomainConfig = DOMAINS[domainId as Exclude<DomainId, "all">];
      setScenario(domain.scenarioId);
    }
    navigate(href);
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold hover:bg-white/5 transition-colors shrink-0"
        style={{
          backgroundColor: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-primary)",
        }}
      >
        <Globe size={13} style={{ color: "var(--color-text-muted)" }} />
        {currentLabel}
        <ChevronDown
          size={12}
          style={{
            color: "var(--color-text-muted)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 200,
            borderRadius: 10,
            overflow: "hidden",
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
            display: "flex",
          }}
        >
          {/* Left: domain switcher */}
          <div style={{ minWidth: 210, borderRight: "1px solid var(--color-border)" }}>
            {/* All modules */}
            <button
              onClick={() => handleSelect("all")}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
              style={{
                borderBottom: "1px solid var(--color-border)",
                color: activeDomain === "all" ? "var(--color-brand)" : "var(--color-text-primary)",
                fontWeight: activeDomain === "all" ? 600 : 400,
              }}
            >
              <Globe
                size={13}
                style={{ color: activeDomain === "all" ? "var(--color-brand)" : "var(--color-text-muted)" }}
              />
              <span className="text-[12px] flex-1">All modules</span>
              {activeDomain === "all" && (
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--color-brand)" }} />
              )}
            </button>

            {/* Per-domain */}
            {(Object.entries(DOMAINS) as [Exclude<DomainId, "all">, DomainConfig][]).map(([id, domain]) => {
              const accessible = canAccessDomain(id, role);
              const isActive = activeDomain === id;
              return (
                <button
                  key={id}
                  disabled={!accessible}
                  onClick={() => accessible && handleSelect(id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                  style={{
                    color: !accessible
                      ? "rgba(255,255,255,0.2)"
                      : isActive
                      ? "var(--color-brand)"
                      : "var(--color-text-primary)",
                    fontWeight: isActive ? 600 : 400,
                    cursor: accessible ? "pointer" : "not-allowed",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (accessible)
                      (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: accessible ? domain.color : "rgba(255,255,255,0.15)" }}
                  />
                  <span className="text-[12px] flex-1">{domain.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--color-brand)" }} />
                  )}
                  {!accessible && (
                    <span className="text-[9px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>
                      No access
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: site-map quick nav */}
          <div
            style={{
              width: 296,
              padding: "12px 14px 16px",
              overflowY: "auto",
              maxHeight: 360,
              scrollbarWidth: "none",
            }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <LayoutGrid size={10} style={{ color: "var(--color-text-muted)" }} />
              <p
                className="text-[9px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--color-text-muted)" }}
              >
                Quick navigation
              </p>
            </div>

            <div className="space-y-4">
              {SITE_MAP.map((section) => (
                <div key={section.sectionLabel}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: section.color }}
                    />
                    <p
                      className="text-[9px] font-semibold uppercase tracking-widest"
                      style={{ color: section.color }}
                    >
                      {section.sectionLabel}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                    {section.pages.map((page) => (
                      <button
                        key={page.href + section.sectionLabel}
                        onClick={() => handleSiteMapNav(page.href, section.domainId)}
                        className="text-left text-[11px] py-1 px-1.5 rounded hover:bg-white/5 transition-colors truncate"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {page.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
