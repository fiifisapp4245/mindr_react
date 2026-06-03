import { ChevronRight } from "lucide-react";
import type { TopoRegion, TopoSite } from "../../types/topology";

interface Props {
  region:     TopoRegion | null;
  site:       TopoSite   | null;
  onGoGermany: () => void;
  onGoRegion:  () => void;
}

export function TopologyBreadcrumb({ region, site, onGoGermany, onGoRegion }: Props) {
  const crumbs: { label: string; onClick?: () => void }[] = [
    { label: "Germany", onClick: region ? onGoGermany : undefined },
  ];

  if (region) {
    const shortName = region.name.length > 24 ? region.name.slice(0, 22) + "…" : region.name;
    crumbs.push({ label: shortName, onClick: site ? onGoRegion : undefined });
  }

  if (site) {
    const shortName = site.name.length > 22 ? site.name.slice(0, 20) + "…" : site.name;
    crumbs.push({ label: shortName });
  }

  return (
    <div
      style={{
        position: "absolute", top: 12, left: 12, zIndex: 500,
        display: "flex", alignItems: "center", gap: 4,
        backgroundColor: "rgba(14,14,18,0.88)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8, padding: "5px 10px",
        backdropFilter: "blur(8px)",
        fontFamily: "'IBM Plex Sans', sans-serif",
      }}
    >
      {crumbs.map((c, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {i > 0 && <ChevronRight size={10} style={{ color: "#F4F4F5", flexShrink: 0 }} />}
          {c.onClick ? (
            <button
              onClick={c.onClick}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 11, fontWeight: 500, color: "#F4F4F5",
                fontFamily: "inherit", padding: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#F4F4F5")}
            >
              {c.label}
            </button>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 600, color: "#D4D4D8" }}>{c.label}</span>
          )}
        </div>
      ))}
    </div>
  );
}
