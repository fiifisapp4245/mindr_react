import type { TopoRegion, TopoSite, TopoCell, TopoCluster, TopoIncident } from '../types/topology';

// ── Raw data types (cluster CXI is source of truth; everything else derived) ──

interface RawCluster { id: string; name: string; cxi: number; incidents?: TopoIncident[] }
interface RawCell    { id: string; name: string; clusters: RawCluster[] }
interface RawSite    { id: string; name: string; lat: number; lng: number; cells: RawCell[] }
interface RawRegion  { id: string; name: string; lat: number; lng: number; sites: RawSite[] }

function isActive(status: TopoIncident['status']) { return status === 'OPEN' || status === 'IN_PROGRESS'; }

function buildCluster(r: RawCluster): TopoCluster {
  return { id: r.id, name: r.name, cxi: r.cxi, incidents: r.incidents ?? [] };
}

function buildCell(r: RawCell): TopoCell {
  const clusters = r.clusters.map(buildCluster);
  const cxi = clusters.reduce((s, c) => s + c.cxi, 0) / clusters.length;
  const hasActiveIncident = clusters.some((c) => c.incidents.some((i) => isActive(i.status)));
  return { id: r.id, name: r.name, cxi, clusters, hasActiveIncident };
}

function buildSite(r: RawSite): TopoSite {
  const cells = r.cells.map(buildCell);
  const cxi = cells.reduce((s, c) => s + c.cxi, 0) / cells.length;
  const hasActiveIncident = cells.some((c) => c.hasActiveIncident);
  return { id: r.id, name: r.name, lat: r.lat, lng: r.lng, cxi, cells, hasActiveIncident };
}

function buildRegion(r: RawRegion): TopoRegion {
  const sites = r.sites.map(buildSite);
  const cxi = sites.reduce((s, st) => s + st.cxi, 0) / sites.length;
  const hasActiveIncident = sites.some((s) => s.hasActiveIncident);
  return { id: r.id, name: r.name, lat: r.lat, lng: r.lng, cxi, sites, hasActiveIncident };
}

// ── Raw data ──────────────────────────────────────────────────────────────────

const RAW: RawRegion[] = [
  {
    id: 'berlin', name: 'Berlin Metropolitan', lat: 52.52, lng: 13.405,
    sites: [
      {
        id: 'site-berlin-nord', name: 'Berlin Nordbahnhof', lat: 52.533, lng: 13.388,
        cells: [
          { id: 'cell-bn-tower-a', name: 'Berlin Nord Tower A', clusters: [
            { id: 'cl-bn-a1', name: 'Cluster-A1', cxi: 3.2 },
            { id: 'cl-bn-a2', name: 'Cluster-A2', cxi: 3.5 },
          ]},
          { id: 'cell-bn-sector-b', name: 'Berlin Nord Sector B', clusters: [
            { id: 'cl-bn-b1', name: 'Cluster-B1', cxi: 3.3 },
            { id: 'cl-bn-b2', name: 'Cluster-B2', cxi: 3.6 },
          ]},
        ],
      },
      {
        id: 'site-berlin-mitte', name: 'Berlin Mitte Central', lat: 52.519, lng: 13.422,
        cells: [
          { id: 'cell-bm-west', name: 'Berlin Mitte West', clusters: [
            { id: 'cl-bm-w1', name: 'Cluster-W1', cxi: 3.4 },
            { id: 'cl-bm-w2', name: 'Cluster-W2', cxi: 3.5 },
          ]},
          { id: 'cell-bm-east', name: 'Berlin Mitte East', clusters: [
            { id: 'cl-bm-e1', name: 'Cluster-E1', cxi: 3.3 },
            { id: 'cl-bm-e2', name: 'Cluster-E2', cxi: 3.4 },
          ]},
        ],
      },
    ],
  },

  {
    id: 'munich', name: 'Munich Metropolitan', lat: 48.135, lng: 11.582,
    sites: [
      {
        id: 'site-muc-ost', name: 'München Ostbahnhof Roof', lat: 48.128, lng: 11.600,
        cells: [
          { id: 'cell-muc-ost-s3', name: 'Munich Ost Sector 3', clusters: [
            { id: 'cl-mos-3a', name: 'Cluster-3A', cxi: 4.2 },
            { id: 'cl-mos-3b', name: 'Cluster-3B', cxi: 4.3 },
          ]},
          { id: 'cell-muc-ost-s4', name: 'Munich Ost Sector 4', clusters: [
            { id: 'cl-mos-4a', name: 'Cluster-4A', cxi: 4.1 },
            { id: 'cl-mos-4b', name: 'Cluster-4B', cxi: 4.2 },
          ]},
        ],
      },
      {
        id: 'site-muc-hbf', name: 'München Hauptbahnhof North', lat: 48.141, lng: 11.563,
        cells: [
          { id: 'cell-muc-hbf-e', name: 'Munich Hbf East', clusters: [
            { id: 'cl-mhe-1', name: 'Cluster-HE1', cxi: 4.0 },
            { id: 'cl-mhe-2', name: 'Cluster-HE2', cxi: 4.3 },
          ]},
          { id: 'cell-muc-hbf-w', name: 'Munich Hbf West', clusters: [
            { id: 'cl-mhw-1', name: 'Cluster-HW1', cxi: 4.2 },
            { id: 'cl-mhw-2', name: 'Cluster-HW2', cxi: 4.4 },
          ]},
        ],
      },
    ],
  },

  {
    id: 'hamburg', name: 'Hamburg Metropolitan', lat: 53.551, lng: 10.000,
    sites: [
      {
        id: 'site-ham-hbf', name: 'Hamburg Hauptbahnhof', lat: 53.553, lng: 10.006,
        cells: [
          { id: 'cell-ham-mitte', name: 'Hamburg Mitte Central', clusters: [
            { id: 'cl-hmc-1', name: 'Cluster-MC1', cxi: 3.4 },
            { id: 'cl-hmc-2', name: 'Cluster-MC2', cxi: 3.7 },
          ]},
          { id: 'cell-ham-nord', name: 'Hamburg Mitte North', clusters: [
            { id: 'cl-hmn-1', name: 'Cluster-MN1', cxi: 3.3 },
            { id: 'cl-hmn-2', name: 'Cluster-MN2', cxi: 3.6 },
          ]},
        ],
      },
      {
        id: 'site-ham-altona', name: 'Hamburg Altona', lat: 53.549, lng: 9.975,
        cells: [
          { id: 'cell-ham-alt-a', name: 'Hamburg West A', clusters: [
            { id: 'cl-hwa-1', name: 'Cluster-WA1', cxi: 3.5 },
            { id: 'cl-hwa-2', name: 'Cluster-WA2', cxi: 3.6 },
          ]},
          { id: 'cell-ham-alt-b', name: 'Hamburg West B', clusters: [
            { id: 'cl-hwb-1', name: 'Cluster-WB1', cxi: 3.3 },
            { id: 'cl-hwb-2', name: 'Cluster-WB2', cxi: 3.5 },
          ]},
        ],
      },
    ],
  },

  {
    id: 'frankfurt', name: 'Frankfurt Rhine-Main', lat: 50.110, lng: 8.682,
    sites: [
      {
        id: 'site-fra-gallus', name: 'Frankfurt Galluswarte', lat: 50.112, lng: 8.668,
        cells: [
          { id: 'cell-fra-west-b', name: 'Frankfurt West Tower B', clusters: [
            { id: 'cl-fwb-1', name: 'Cluster-B1', cxi: 1.8, incidents: [
              { id: 'MINDR-2026-0041', description: 'CXI collapse — Frankfurt West tower interference', cxiDrop: -2.7, status: 'OPEN' },
            ]},
            { id: 'cl-fwb-2', name: 'Cluster-B2', cxi: 2.5, incidents: [
              { id: 'MINDR-2026-0042', description: 'Handover failure — West sector A/B boundary', cxiDrop: -2.0, status: 'IN_PROGRESS' },
            ]},
          ]},
          { id: 'cell-fra-west-a', name: 'Frankfurt West Sector A', clusters: [
            { id: 'cl-fwa-1', name: 'Cluster-A1', cxi: 2.3 },
            { id: 'cl-fwa-2', name: 'Cluster-A2', cxi: 2.7 },
          ]},
        ],
      },
      {
        id: 'site-fra-sachsen', name: 'Frankfurt Sachsenhausen', lat: 50.100, lng: 8.693,
        cells: [
          { id: 'cell-fra-ost-1', name: 'Frankfurt Ost Sector 1', clusters: [
            { id: 'cl-fos-1a', name: 'Cluster-1A', cxi: 2.4 },
            { id: 'cl-fos-1b', name: 'Cluster-1B', cxi: 2.8 },
          ]},
          { id: 'cell-fra-ost-2', name: 'Frankfurt Ost Sector 2', clusters: [
            { id: 'cl-fos-2a', name: 'Cluster-2A', cxi: 2.1 },
            { id: 'cl-fos-2b', name: 'Cluster-2B', cxi: 2.6 },
          ]},
        ],
      },
    ],
  },

  {
    id: 'cologne', name: 'Cologne/Bonn', lat: 50.938, lng: 6.960,
    sites: [
      {
        id: 'site-koe-roden', name: 'Köln Rodenkirchen', lat: 50.897, lng: 6.970,
        cells: [
          { id: 'cell-koe-s2', name: 'Cologne South Sector 2', clusters: [
            { id: 'cl-ks2-a', name: 'Cluster-S2A', cxi: 3.1 },
            { id: 'cl-ks2-b', name: 'Cluster-S2B', cxi: 3.4 },
          ]},
          { id: 'cell-koe-s3', name: 'Cologne South Sector 3', clusters: [
            { id: 'cl-ks3-a', name: 'Cluster-S3A', cxi: 3.3 },
            { id: 'cl-ks3-b', name: 'Cluster-S3B', cxi: 3.5 },
          ]},
        ],
      },
      {
        id: 'site-koe-muelheim', name: 'Köln Mülheim', lat: 50.961, lng: 6.996,
        cells: [
          { id: 'cell-koe-east-a', name: 'Cologne East A', clusters: [
            { id: 'cl-kea-1', name: 'Cluster-EA1', cxi: 3.2 },
            { id: 'cl-kea-2', name: 'Cluster-EA2', cxi: 3.3 },
          ]},
          { id: 'cell-koe-east-b', name: 'Cologne East B', clusters: [
            { id: 'cl-keb-1', name: 'Cluster-EB1', cxi: 3.3 },
            { id: 'cl-keb-2', name: 'Cluster-EB2', cxi: 3.4 },
          ]},
        ],
      },
    ],
  },

  {
    id: 'stuttgart', name: 'Stuttgart Baden-Württemberg', lat: 48.775, lng: 9.182,
    sites: [
      {
        id: 'site-stu-hbf', name: 'Stuttgart Hauptbahnhof North', lat: 48.784, lng: 9.182,
        cells: [
          { id: 'cell-stu-n1', name: 'Stuttgart Nord Sector 1', clusters: [
            { id: 'cl-sn1-a', name: 'Cluster-N1A', cxi: 4.0 },
            { id: 'cl-sn1-b', name: 'Cluster-N1B', cxi: 4.2 },
          ]},
          { id: 'cell-stu-n2', name: 'Stuttgart Nord Sector 2', clusters: [
            { id: 'cl-sn2-a', name: 'Cluster-N2A', cxi: 4.1 },
            { id: 'cl-sn2-b', name: 'Cluster-N2B', cxi: 4.3 },
          ]},
        ],
      },
      {
        id: 'site-stu-vaih', name: 'Stuttgart Vaihingen', lat: 48.738, lng: 9.111,
        cells: [
          { id: 'cell-stu-s-a', name: 'Stuttgart Süd A', clusters: [
            { id: 'cl-ssa-1', name: 'Cluster-SA1', cxi: 3.9 },
            { id: 'cl-ssa-2', name: 'Cluster-SA2', cxi: 4.2 },
          ]},
          { id: 'cell-stu-s-b', name: 'Stuttgart Süd B', clusters: [
            { id: 'cl-ssb-1', name: 'Cluster-SB1', cxi: 4.0 },
            { id: 'cl-ssb-2', name: 'Cluster-SB2', cxi: 4.1 },
          ]},
        ],
      },
    ],
  },

  {
    id: 'duesseldorf', name: 'Düsseldorf Rhine-Ruhr', lat: 51.227, lng: 6.773,
    sites: [
      {
        id: 'site-dus-oberbilk', name: 'Düsseldorf Oberbilk', lat: 51.216, lng: 6.786,
        cells: [
          { id: 'cell-dus-ost-c', name: 'Düsseldorf Ost Tower C', clusters: [
            { id: 'cl-doc-1', name: 'Cluster-C1', cxi: 2.0, incidents: [
              { id: 'MINDR-2026-0038', description: 'Interference from adjacent cell — Oberbilk sector', cxiDrop: -2.5, status: 'IN_PROGRESS' },
            ]},
            { id: 'cl-doc-2', name: 'Cluster-C2', cxi: 2.5 },
          ]},
          { id: 'cell-dus-ost-a', name: 'Düsseldorf Ost Sector A', clusters: [
            { id: 'cl-doa-1', name: 'Cluster-OA1', cxi: 2.7 },
            { id: 'cl-doa-2', name: 'Cluster-OA2', cxi: 3.0 },
          ]},
        ],
      },
      {
        id: 'site-dus-innen', name: 'Düsseldorf Innenstadt', lat: 51.232, lng: 6.775,
        cells: [
          { id: 'cell-dus-mitte-w', name: 'Düsseldorf Mitte West', clusters: [
            { id: 'cl-dmw-1', name: 'Cluster-MW1', cxi: 2.8 },
            { id: 'cl-dmw-2', name: 'Cluster-MW2', cxi: 3.1 },
          ]},
          { id: 'cell-dus-mitte-e', name: 'Düsseldorf Mitte East', clusters: [
            { id: 'cl-dme-1', name: 'Cluster-ME1', cxi: 2.6 },
            { id: 'cl-dme-2', name: 'Cluster-ME2', cxi: 2.9 },
          ]},
        ],
      },
    ],
  },

  {
    id: 'nuremberg', name: 'Nuremberg Bavaria', lat: 49.453, lng: 11.077,
    sites: [
      {
        id: 'site-nur-mitte', name: 'Nürnberg Mitte', lat: 49.455, lng: 11.079,
        cells: [
          { id: 'cell-nur-s4', name: 'Nuremberg Mitte Sector 4', clusters: [
            { id: 'cl-ns4-a', name: 'Cluster-S4A', cxi: 3.9 },
            { id: 'cl-ns4-b', name: 'Cluster-S4B', cxi: 4.1 },
          ]},
          { id: 'cell-nur-s5', name: 'Nuremberg Mitte Sector 5', clusters: [
            { id: 'cl-ns5-a', name: 'Cluster-S5A', cxi: 4.0 },
            { id: 'cl-ns5-b', name: 'Cluster-S5B', cxi: 4.2 },
          ]},
        ],
      },
      {
        id: 'site-nur-sued', name: 'Nürnberg Südost', lat: 49.440, lng: 11.090,
        cells: [
          { id: 'cell-nur-s-a', name: 'Nuremberg Süd A', clusters: [
            { id: 'cl-nsa-1', name: 'Cluster-SA1', cxi: 3.8 },
            { id: 'cl-nsa-2', name: 'Cluster-SA2', cxi: 4.0 },
          ]},
          { id: 'cell-nur-s-b', name: 'Nuremberg Süd B', clusters: [
            { id: 'cl-nsb-1', name: 'Cluster-SB1', cxi: 4.0 },
            { id: 'cl-nsb-2', name: 'Cluster-SB2', cxi: 4.1 },
          ]},
        ],
      },
    ],
  },

  {
    id: 'bremen', name: 'Bremen Northern', lat: 53.079, lng: 8.801,
    sites: [
      {
        id: 'site-bre-hbf', name: 'Bremen Hauptbahnhof', lat: 53.083, lng: 8.814,
        cells: [
          { id: 'cell-bre-mitte-a', name: 'Bremen Mitte A', clusters: [
            { id: 'cl-bma-1', name: 'Cluster-MA1', cxi: 3.5 },
            { id: 'cl-bma-2', name: 'Cluster-MA2', cxi: 3.7 },
          ]},
          { id: 'cell-bre-mitte-b', name: 'Bremen Mitte B', clusters: [
            { id: 'cl-bmb-1', name: 'Cluster-MB1', cxi: 3.6 },
            { id: 'cl-bmb-2', name: 'Cluster-MB2', cxi: 3.8 },
          ]},
        ],
      },
      {
        id: 'site-bre-neustadt', name: 'Bremen Neustadt', lat: 53.070, lng: 8.797,
        cells: [
          { id: 'cell-bre-sued-a', name: 'Bremen Süd A', clusters: [
            { id: 'cl-bsa-1', name: 'Cluster-SA1', cxi: 3.4 },
            { id: 'cl-bsa-2', name: 'Cluster-SA2', cxi: 3.6 },
          ]},
          { id: 'cell-bre-sued-b', name: 'Bremen Süd B', clusters: [
            { id: 'cl-bsb-1', name: 'Cluster-SB1', cxi: 3.5 },
            { id: 'cl-bsb-2', name: 'Cluster-SB2', cxi: 3.7 },
          ]},
        ],
      },
    ],
  },

  {
    id: 'hannover', name: 'Hannover Lower Saxony', lat: 52.375, lng: 9.732,
    sites: [
      {
        id: 'site-han-hbf', name: 'Hannover Hauptbahnhof', lat: 52.377, lng: 9.741,
        cells: [
          { id: 'cell-han-mitte-a', name: 'Hannover Mitte A', clusters: [
            { id: 'cl-hna-1', name: 'Cluster-MA1', cxi: 4.2 },
            { id: 'cl-hna-2', name: 'Cluster-MA2', cxi: 4.4 },
          ]},
          { id: 'cell-han-mitte-b', name: 'Hannover Mitte B', clusters: [
            { id: 'cl-hnb-1', name: 'Cluster-MB1', cxi: 4.3 },
            { id: 'cl-hnb-2', name: 'Cluster-MB2', cxi: 4.5 },
          ]},
        ],
      },
      {
        id: 'site-han-nord', name: 'Hannover Nord', lat: 52.389, lng: 9.728,
        cells: [
          { id: 'cell-han-nord-a', name: 'Hannover Nord A', clusters: [
            { id: 'cl-hnn-a1', name: 'Cluster-NA1', cxi: 4.1 },
            { id: 'cl-hnn-a2', name: 'Cluster-NA2', cxi: 4.3 },
          ]},
          { id: 'cell-han-nord-b', name: 'Hannover Nord B', clusters: [
            { id: 'cl-hnn-b1', name: 'Cluster-NB1', cxi: 4.2 },
            { id: 'cl-hnn-b2', name: 'Cluster-NB2', cxi: 4.4 },
          ]},
        ],
      },
    ],
  },

  {
    id: 'leipzig', name: 'Leipzig Saxony', lat: 51.340, lng: 12.375,
    sites: [
      {
        id: 'site-lei-hbf', name: 'Leipzig Hauptbahnhof', lat: 51.347, lng: 12.382,
        cells: [
          { id: 'cell-lei-mitte-a', name: 'Leipzig Mitte A', clusters: [
            { id: 'cl-lma-1', name: 'Cluster-MA1', cxi: 1.5, incidents: [
              { id: 'MINDR-2026-0045', description: 'Critical CXI collapse — Leipzig Mitte sector failure', cxiDrop: -3.0, status: 'OPEN' },
            ]},
            { id: 'cl-lma-2', name: 'Cluster-MA2', cxi: 2.2, incidents: [
              { id: 'MINDR-2026-0046', description: 'Backhaul congestion — secondary cluster impact', cxiDrop: -2.3, status: 'APPROVED' },
            ]},
          ]},
          { id: 'cell-lei-mitte-b', name: 'Leipzig Mitte B', clusters: [
            { id: 'cl-lmb-1', name: 'Cluster-MB1', cxi: 2.3 },
            { id: 'cl-lmb-2', name: 'Cluster-MB2', cxi: 2.7 },
          ]},
        ],
      },
      {
        id: 'site-lei-connewitz', name: 'Leipzig Connewitz', lat: 51.316, lng: 12.368,
        cells: [
          { id: 'cell-lei-sued-a', name: 'Leipzig Süd A', clusters: [
            { id: 'cl-lsa-1', name: 'Cluster-SA1', cxi: 2.4 },
            { id: 'cl-lsa-2', name: 'Cluster-SA2', cxi: 2.8 },
          ]},
          { id: 'cell-lei-sued-b', name: 'Leipzig Süd B', clusters: [
            { id: 'cl-lsb-1', name: 'Cluster-SB1', cxi: 2.6 },
            { id: 'cl-lsb-2', name: 'Cluster-SB2', cxi: 3.0 },
          ]},
        ],
      },
    ],
  },

  {
    id: 'dresden', name: 'Dresden Saxony', lat: 51.050, lng: 13.738,
    sites: [
      {
        id: 'site-dre-hbf', name: 'Dresden Hauptbahnhof', lat: 51.040, lng: 13.732,
        cells: [
          { id: 'cell-dre-mitte-a', name: 'Dresden Mitte A', clusters: [
            { id: 'cl-dma-1', name: 'Cluster-MA1', cxi: 3.6 },
            { id: 'cl-dma-2', name: 'Cluster-MA2', cxi: 3.8 },
          ]},
          { id: 'cell-dre-mitte-b', name: 'Dresden Mitte B', clusters: [
            { id: 'cl-dmb-1', name: 'Cluster-MB1', cxi: 3.7 },
            { id: 'cl-dmb-2', name: 'Cluster-MB2', cxi: 3.9 },
          ]},
        ],
      },
      {
        id: 'site-dre-neustadt', name: 'Dresden Neustadt', lat: 51.062, lng: 13.745,
        cells: [
          { id: 'cell-dre-nord-a', name: 'Dresden Nord A', clusters: [
            { id: 'cl-dna-1', name: 'Cluster-NA1', cxi: 3.5 },
            { id: 'cl-dna-2', name: 'Cluster-NA2', cxi: 3.7 },
          ]},
          { id: 'cell-dre-nord-b', name: 'Dresden Nord B', clusters: [
            { id: 'cl-dnb-1', name: 'Cluster-NB1', cxi: 3.6 },
            { id: 'cl-dnb-2', name: 'Cluster-NB2', cxi: 3.8 },
          ]},
        ],
      },
    ],
  },
];

export const topologyData: TopoRegion[] = RAW.map(buildRegion);
