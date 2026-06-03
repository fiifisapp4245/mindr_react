import React, { useState, useRef, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { TopoRegion, TopoSite, MapFilter } from "../../types/topology";
import { getCXIColor, getCXIStatus } from "../../types/topology";
import { topologyData } from "../../data/topologyData";
import { TopologyBreadcrumb } from "./TopologyBreadcrumb";
import { TopologyPanel } from "./TopologyPanel";

// ── DivIcon factories ─────────────────────────────────────────────────────────

function regionIcon(r: TopoRegion): L.DivIcon {
  const col  = getCXIColor(r.cxi);
  const name = r.name.split(' ')[0];
  const ring = r.hasActiveIncident
    ? `<div style="position:absolute;inset:-9px;border-radius:50%;border:1.5px dashed #ef4444;animation:incidentRing 2s ease-in-out infinite;pointer-events:none;"></div>`
    : '';
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:64px;height:64px;">
        ${ring}
        <div style="width:64px;height:64px;border-radius:50%;background:${col};border:3px solid #fff;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,0.8),0 0 0 2px ${col}66;cursor:pointer;gap:2px;">
          <span style="font-size:10px;font-weight:800;color:#fff;text-align:center;line-height:1.2;padding:0 4px;font-family:'IBM Plex Sans',sans-serif;text-shadow:0 1px 4px rgba(0,0,0,0.9);">${name}</span>
          <span style="font-size:12px;font-weight:800;color:#fff;font-family:'IBM Plex Mono',monospace;text-shadow:0 1px 4px rgba(0,0,0,0.9);">${r.cxi.toFixed(1)}</span>
        </div>
      </div>
    `,
    iconSize:   [64, 64],
    iconAnchor: [32, 32],
  });
}

function siteIcon(s: TopoSite, selected: boolean): L.DivIcon {
  const col  = getCXIColor(s.cxi);
  const ring = s.hasActiveIncident
    ? `<div style="position:absolute;inset:-7px;border-radius:50%;border:1.5px dashed #ef4444;animation:incidentRing 2s ease-in-out infinite;pointer-events:none;"></div>`
    : '';
  const glow = selected ? `box-shadow:0 0 0 3px ${col}55,0 3px 16px rgba(0,0,0,0.65);` : 'box-shadow:0 3px 12px rgba(0,0,0,0.55);';
  const shortName = s.name.length > 14 ? s.name.slice(0, 12) + '…' : s.name;
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:48px;height:48px;">
        ${ring}
        <div style="width:48px;height:48px;border-radius:50%;background:${col};border:${selected ? `3px solid #fff` : `2px solid rgba(255,255,255,0.7)`};display:flex;flex-direction:column;align-items:center;justify-content:center;${glow}cursor:pointer;gap:2px;">
          <span style="font-size:8px;font-weight:800;color:#fff;text-align:center;line-height:1.2;padding:0 3px;font-family:'IBM Plex Sans',sans-serif;text-shadow:0 1px 3px rgba(0,0,0,0.9);">${shortName}</span>
          <span style="font-size:10px;font-weight:800;color:#fff;font-family:'IBM Plex Mono',monospace;text-shadow:0 1px 3px rgba(0,0,0,0.9);">${s.cxi.toFixed(1)}</span>
        </div>
      </div>
    `,
    iconSize:   [48, 48],
    iconAnchor: [24, 24],
  });
}

// ── Fly controller (must live inside MapContainer) ────────────────────────────

type FlyTarget = [number, number, number]; // [lat, lng, zoom]

function FlyController({ target }: { target: FlyTarget | null }) {
  const map     = useMap();
  const prevRef = useRef<FlyTarget | null>(null);
  useEffect(() => {
    if (!target || target === prevRef.current) return;
    prevRef.current = target;
    map.flyTo([target[0], target[1]], target[2], { duration: 1.2 });
  }, [target, map]);
  return null;
}

function MapClickHandler({ onClick }: { onClick: () => void }) {
  useMapEvents({ click: onClick });
  return null;
}

// ── Marker components ─────────────────────────────────────────────────────────

function RegionMarker({ region, onClick }: { region: TopoRegion; onClick: (r: TopoRegion) => void }) {
  const icon = useMemo(() => regionIcon(region), [region]);
  const col  = getCXIColor(region.cxi);
  return (
    <Marker
      position={[region.lat, region.lng]}
      icon={icon}
      eventHandlers={{ click: (e) => { L.DomEvent.stop(e); onClick(region); } }}
    >
      <Tooltip direction="top" offset={[0, -34]} opacity={1}>
        <div style={{ backgroundColor: "#1e1e2a", border: `1px solid ${col}44`, borderRadius: 8, padding: "8px 12px", fontFamily: "'IBM Plex Sans',sans-serif", minWidth: 140 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#F4F4F5", marginBottom: 3 }}>{region.name}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: col, fontFamily: "'IBM Plex Mono',monospace" }}>{region.cxi.toFixed(1)}</span>
            <span style={{ fontSize: 10, color: "#F4F4F5" }}>·</span>
            <span style={{ fontSize: 10, color: col }}>{getCXIStatus(region.cxi)}</span>
          </div>
          <p style={{ fontSize: 10, color: "#F4F4F5", marginTop: 3 }}>{region.sites.length} sites · click to drill down</p>
        </div>
      </Tooltip>
    </Marker>
  );
}

function SiteMarker({ site, selected, onClick }: { site: TopoSite; selected: boolean; onClick: (s: TopoSite) => void }) {
  const icon = useMemo(() => siteIcon(site, selected), [site, selected]);
  const col  = getCXIColor(site.cxi);
  return (
    <Marker
      position={[site.lat, site.lng]}
      icon={icon}
      eventHandlers={{ click: (e) => { L.DomEvent.stop(e); onClick(site); } }}
    >
      <Tooltip direction="top" offset={[0, -26]} opacity={1}>
        <div style={{ backgroundColor: "#1e1e2a", border: `1px solid ${col}44`, borderRadius: 8, padding: "8px 12px", fontFamily: "'IBM Plex Sans',sans-serif", minWidth: 140 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#F4F4F5", marginBottom: 3 }}>{site.name}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: col, fontFamily: "'IBM Plex Mono',monospace" }}>{site.cxi.toFixed(1)}</span>
            <span style={{ fontSize: 10, color: "#F4F4F5" }}>·</span>
            <span style={{ fontSize: 10, color: col }}>{getCXIStatus(site.cxi)}</span>
          </div>
          <p style={{ fontSize: 10, color: "#F4F4F5", marginTop: 3 }}>{site.cells.length} cells · click for detail</p>
        </div>
      </Tooltip>
    </Marker>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

const FILTERS: { id: MapFilter; label: string; color?: string }[] = [
  { id: "all",      label: "All" },
  { id: "critical", label: "Critical", color: "#ef4444" },
  { id: "degraded", label: "Degraded", color: "#f59e0b" },
  { id: "healthy",  label: "Healthy",  color: "#22c55e" },
];

function FilterBar({ filter, onChange }: { filter: MapFilter; onChange: (f: MapFilter) => void }) {
  return (
    <div style={{ position: "absolute", top: 96, left: 12, zIndex: 500, display: "flex", gap: 4 }}>
      {FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          style={{
            padding: "4px 11px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer",
            fontFamily: "'IBM Plex Sans', sans-serif",
            backgroundColor: filter === f.id ? (f.color ? `${f.color}22` : "rgba(255,255,255,0.08)") : "rgba(14,14,18,0.88)",
            border: `1px solid ${filter === f.id ? (f.color ?? "rgba(255,255,255,0.2)") : "rgba(255,255,255,0.08)"}`,
            color: filter === f.id ? (f.color ?? "#F4F4F5") : "#F4F4F5",
            backdropFilter: "blur(8px)",
          }}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function TopologyMap() {
  const [level, setLevel]   = useState<'region' | 'site'>('region');
  const [region, setRegion] = useState<TopoRegion | null>(null);
  const [site, setSite]     = useState<TopoSite   | null>(null);
  const [filter, setFilter] = useState<MapFilter>('all');
  const [flyTo, setFlyTo]   = useState<FlyTarget | null>(null);
  const markerHit           = useRef(false);

  const handleRegionClick = (r: TopoRegion) => {
    markerHit.current = true;
    setRegion(r);
    setSite(null);
    setLevel('site');
    setFlyTo([r.lat, r.lng, 9]);
  };

  const handleSiteClick = (s: TopoSite) => {
    markerHit.current = true;
    setSite(s);
  };

  const handleMapClick = () => {
    if (markerHit.current) { markerHit.current = false; return; }
    if (site) setSite(null);
  };

  const goGermany = () => {
    setLevel('region');
    setRegion(null);
    setSite(null);
    setFlyTo([51.1657, 10.4515, 6]);
  };

  const goRegionLevel = () => {
    if (!region) return;
    setSite(null);
    setFlyTo([region.lat, region.lng, 9]);
  };

  const visibleRegions = useMemo(() => {
    if (filter === 'all') return topologyData;
    return topologyData.filter((r) => getCXIStatus(r.cxi).toLowerCase() === filter);
  }, [filter]);

  return (
    <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
      <MapContainer
        center={[51.1657, 10.4515]}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
        maxBounds={[[47.2, 5.8], [55.1, 15.1]]}
        minZoom={5}
        maxZoom={14}
        zoomControl={false}
      >
        <ZoomControl position="topright" />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
        <FlyController target={flyTo} />
        <MapClickHandler onClick={handleMapClick} />

        {level === 'region' && visibleRegions.map((r) => (
          <RegionMarker key={r.id} region={r} onClick={handleRegionClick} />
        ))}

        {level === 'site' && region && region.sites.map((s) => (
          <SiteMarker key={s.id} site={s} selected={site?.id === s.id} onClick={handleSiteClick} />
        ))}
      </MapContainer>

      <TopologyBreadcrumb region={region} site={site} onGoGermany={goGermany} onGoRegion={goRegionLevel} />
      <FilterBar filter={filter} onChange={(f) => { setFilter(f); setSite(null); }} />
      {site && <TopologyPanel site={site} onClose={() => setSite(null)} />}
    </div>
  );
}
