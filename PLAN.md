# Network Model rebuild + Dashboard fix-pass — PLAN

## Exploration findings
- Framework: React 18 + TypeScript + Vite; routes in App.tsx; dark CSS vars in index.css
- S2 scenario hijacks /topology via `activeScenario.id === "s2"` check in Topology.tsx → renders CxiTopology
- CxiTopology.tsx (515 lines): currently a Graph/List tree view; graph via CxiKnowledgeGraph; list via hand-built tree
- cxi-mock-store.ts: single source; computeKpis has two bugs (highSev counts all cases, baseline hardcoded 10)
- genLargeCases: uses "Generated Cell {i}" / "Generated Site {i}" names → fix to German
- Sidebar.tsx: "Topology" label appears in ROLE_NAV[cxi], SCENARIO_NAV[s1/s2/s3] — only s2/cxi need renaming
- CxiDashboard.tsx: scopeId is local state; need to lift to shared context for two-way sync with Network Model
- CxiLens context exists (smc|ran); design tokens: all CSS vars; Germany SVG path at 288×296 viewBox

## Change order

### 0 — Dashboard fix pass (cxi-mock-store.ts + CxiDashboard.tsx)
- 0a: computeKpis — highSev = active cases only where CXI<2 OR |drop|>2 (never exceeds active)
- 0b: baseline = total<=20 ? 10 : round(active * 0.7) — scales with volume
- 0c: TrendChart gets caseScale prop; CxiDashboard passes round(baseCases.length/15) in volume mode
- 0d: genLargeCases — use German city+direction+sector names (12 cities × 5 dirs × 8 sectors)
- 0e: High Severity card sub: "CXI < 2 OR drop > 2 pts · definition P1"

### 1 — Rename (Sidebar.tsx + CxiTopology header)
- Sidebar: ROLE_NAV[cxi] and SCENARIO_NAV[s2] "Topology" → "Network model"
- (Leave s1/s3 as Topology — they use the real S1 topology page)

### 2–5 — Network Model page (complete CxiTopology.tsx rewrite)
**Architecture:**
- New shared context: src/contexts/cxi-scope.tsx (lift scopeId from CxiDashboard local state)
- App.tsx: wrap with CxiScopeProvider (inside CxiLensProvider)
- CxiDashboard.tsx: use useCxiScope() instead of local useState("germany")
- CxiTopology.tsx: full rewrite as 3-column layout: left strip | map | detail panel

**Layout:**
```
┌──────────────────────────────────────────────────────────────────┐
│ Header: "Network model" · breadcrumb · time window · overlays    │
│ [Systemic banner — conditional]                                   │
├──────────┬──────────────────────────────────┬────────────────────┤
│ Top cells│        Germany SVG map           │   Site detail      │
│ strip    │  choropleth at country level     │   panel (360px)    │
│ (220px)  │  site dots at region/city level  │   opens on click   │
│          │  hotspot halos + overlay glyphs  │                    │
└──────────┴──────────────────────────────────┴────────────────────┘
```

**Map implementation:**
- Reuse GERMANY_PATH + siteColor scale from dashboard
- SVG viewBox changes per scope level (country/region/city) — pure SVG zoom
- Country: colored semi-transparent region blobs (choropleth) + site dots
- Region/City: zoomed viewBox + site labels
- Hotspots: dashed halo circles with SVG text badges
- Overlay glyphs: colored markers at site positions per overlay state
- Role defaults: SMC → cases+incidents on; RAN → cases+changes+clusters on

**Data additions to cxi-mock-store.ts:**
- REGION_ZONES: 5 regions with SVG center + radius + CXI score (for choropleth)
- SITES_DATA: 9 sites (2-3 per city) with cells, components, known causes, neighbors
- HOTSPOTS: 2 pre-defined clusters (Cologne center 4 cases, Munich Ost 2 cases)
- TOP_AFFECTED_CELLS: ranked list of 8 cells for left strip
- SCOPE_VIEWBOXES: SVG viewBox strings per scope node ID

**Site detail panel sections:**
- Header: name + CXI + trend + case count
- Cells list: each cell with RAT badge + CXI chip
- Component breakdown: 4 horizontal bars vs baseline
- Known-cause check: incident/change/ticket/area chips OR explicit "No known cause"
- Neighbor cells: 3-4 with interpretation line (local vs area issue)
- Active cases: top 3 with link-out to /cxi-cases?site=X
- Approx customers: "~N affected" only — never identities

**Volume mode (1,003 cases):** all aggregation, left strip cap at 10, no overflow
**Empty state:** map mostly teal, "No active hotspots"

## Files changed
1. src/data/cxi-mock-store.ts — bug fixes + new exports for map
2. src/contexts/cxi-scope.tsx — new shared scope context
3. src/App.tsx — add CxiScopeProvider
4. src/components/s2/CxiDashboard.tsx — use scope context + trend fix + card text
5. src/components/layout/Sidebar.tsx — rename label for s2/cxi
6. src/components/s2/CxiTopology.tsx — complete rewrite as Network Model
