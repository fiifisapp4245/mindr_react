import type { MINDRCase, CXIDataPoint } from "../types/cxi";

// ── Timeseries generator ──────────────────────────────────────────────────────

function genTimeseries(
  hoursBack = 24,
  degradeAtHour = 8,
  dropMagnitude = 2.0
): CXIDataPoint[] {
  const now = Date.now();
  const points: CXIDataPoint[] = [];
  const totalPoints = hoursBack * 2; // 1 point per 30 min
  const degradeIndex = (hoursBack - degradeAtHour) * 2;

  for (let i = 0; i < totalPoints; i++) {
    const ts = new Date(now - (totalPoints - i) * 30 * 60 * 1000).toISOString();
    const progress = i >= degradeIndex
      ? Math.min(1, (i - degradeIndex) / 6)
      : 0;
    const jitter = () => +(Math.random() * 0.3 - 0.15).toFixed(2);

    points.push({
      t: ts,
      voiceMOS:        +(8.5 - dropMagnitude * 0.9 * progress + jitter()).toFixed(2),
      dataThroughput:  +(8.2 - dropMagnitude * 1.0 * progress + jitter()).toFixed(2),
      accessibility:   +(8.7 - dropMagnitude * 0.8 * progress + jitter()).toFixed(2),
      retainability:   +(8.4 - dropMagnitude * 0.7 * progress + jitter()).toFixed(2),
      mobility:        +(8.0 - dropMagnitude * 0.6 * progress + jitter()).toFixed(2),
    });
  }
  return points;
}

// ── Audit trail helpers ───────────────────────────────────────────────────────

function agentPipeline(caseId: string, createdAt: string): MINDRCase["auditTrail"] {
  const base = new Date(createdAt).getTime();
  return [
    { timestamp: new Date(base +  0).toISOString(), actor: "CXI System",              actorType: "mindr",    action: "Case created",                  detail: `${caseId} triggered by CXI threshold breach` },
    { timestamp: new Date(base +  45000).toISOString(), actor: "CCA — Context Collection", actorType: "system",   action: "Agent completed",               detail: "Scope resolved: cell, site, cluster, geo" },
    { timestamp: new Date(base +  90000).toISOString(), actor: "DRA — Data Retrieval",     actorType: "system",   action: "Agent completed",               detail: "Retrieved 24h CXI timeseries + alarms + change log" },
    { timestamp: new Date(base + 135000).toISOString(), actor: "CA — Correlation",         actorType: "system",   action: "Agent completed",               detail: "Linked 3 alarms, 1 change record, 1 open ticket" },
    { timestamp: new Date(base + 180000).toISOString(), actor: "RCA — Root Cause",         actorType: "system",   action: "Agent completed",               detail: "Root cause hypothesis generated" },
    { timestamp: new Date(base + 225000).toISOString(), actor: "RA — Recommendation",      actorType: "system",   action: "Agent completed",               detail: "Action plan produced" },
    { timestamp: new Date(base + 270000).toISOString(), actor: "HVA — Human Validation",   actorType: "system",   action: "Awaiting human review",         detail: "Case queued for reviewer" },
  ];
}

// ── Mock cases ────────────────────────────────────────────────────────────────

export const mockCases: MINDRCase[] = [

  // ── Pending × 3 ────────────────────────────────────────────────────────────

  {
    caseId: "CXI-2026-0042",
    status: "pending",
    classification: "incident",
    severity: "P1",
    triggerType: "cell_based",
    duration: "1h 47m",
    assignedAgent: "CCA-DRA-CA-RCA-RA-HVA/20260527-014",
    affectedScope: {
      cellId: "DEU-BER-NORD-042",
      cellName: "Berlin Nord Tower A",
      siteId: "BER-NORD-07",
      siteName: "Berlin Nordbahnhof",
      cluster: "BER-NORTH-CLUSTER",
      region: "Berlin Metropolitan",
      geoLat: 52.5328,
      geoLng: 13.3884,
    },
    cxiBaseline: 8.4,
    cxiCurrent: 6.1,
    cxiDrop: -2.3,
    cxiTimeseries: genTimeseries(24, 8, 2.3),
    hypothesis: {
      text: "Analysis indicates a sustained radio interference pattern originating from the DEU-BER-NORD-042 sector. Correlation with recent scheduled maintenance on adjacent cell DEU-BER-NORD-041 suggests a configuration drift in the antenna tilt parameters caused cross-sector interference. Voice MOS and Accessibility Rate are the primary degraded sub-metrics, consistent with uplink noise elevation.",
      confidence: 87,
      signals: [
        "Voice MOS dropped 2.1 pts below 7-day rolling baseline at 03:14 UTC",
        "Accessibility Rate fell to 6.8 (-1.9 pts) coinciding with ALM-BER-7731 alarm",
        "Change CHG-2026-0891 executed on adjacent cell 4h prior to degradation onset",
        "No correlated degradation on site BER-SUD-03 — isolates fault to this cluster",
        "Historical pattern matches Interference Case CXI-2025-0318 (resolved via tilt reset)",
      ],
      agentVersion: "CXI-RCA-v2.4.1",
    },
    recommendation: {
      actionType: "create_ticket",
      targetTeam: "Network Optimization Team",
      ticketType: "Incident",
      rationale: "Radio interference from antenna configuration drift — requires field engineer review and tilt parameter correction.",
      oneClickAvailable: false,
    },
    evidence: {
      alarms: [
        { alarmId: "ALM-BER-7731", type: "Radio Interface Degradation", severity: "P1", startTime: new Date(Date.now() - 6480000).toISOString(), status: "Active" },
        { alarmId: "ALM-BER-7698", type: "Uplink SINR Threshold Breach", severity: "P2", startTime: new Date(Date.now() - 5940000).toISOString(), status: "Active" },
        { alarmId: "ALM-BER-7712", type: "Cell Handover Failure Rate Elevated", severity: "P2", startTime: new Date(Date.now() - 4320000).toISOString(), status: "Active" },
      ],
      changes: [
        { changeId: "CHG-2026-0891", description: "Antenna tilt adjustment on DEU-BER-NORD-041 — scheduled maintenance", initiatedBy: "NOC-AUTO", time: new Date(Date.now() - 28800000).toISOString(), status: "Completed" },
      ],
      tickets: [
        { ticketId: "TKT-2026-4421", title: "Berlin Nord — Elevated handover failure reports from field", team: "Field Ops", priority: "P2", created: new Date(Date.now() - 3600000).toISOString() },
      ],
    },
    auditTrail: agentPipeline("CXI-2026-0042", new Date(Date.now() - 6300000).toISOString()),
    createdAt: new Date(Date.now() - 6300000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
    correction: null,
  },

  {
    caseId: "CXI-2026-0043",
    status: "pending",
    classification: "unknown",
    severity: "P1",
    triggerType: "cell_based",
    duration: "2h 04m",
    assignedAgent: "CCA-DRA-CA-RCA-RA-HVA/20260527-013",
    affectedScope: {
      cellId: "DEU-MUC-OST-087",
      cellName: "Munich Ost Sector 3",
      siteId: "MUC-OST-12",
      siteName: "München Ostbahnhof Roof",
      cluster: "MUC-EAST-CLUSTER",
      region: "Munich Metropolitan",
      geoLat: 48.1277,
      geoLng: 11.6050,
    },
    cxiBaseline: 8.1,
    cxiCurrent: 5.7,
    cxiDrop: -2.4,
    cxiTimeseries: genTimeseries(24, 10, 2.4),
    hypothesis: {
      text: "The CXI pipeline was unable to identify a high-confidence root cause for this degradation event. CXI sub-metrics show a broad degradation pattern across all five indicators without a clear correlated alarm or change event. Possible causes include unreported hardware fault, external interference source, or a novel failure mode not represented in the training corpus.",
      confidence: 34,
      signals: [
        "All 5 CXI sub-metrics degraded simultaneously — unusual multi-vector pattern",
        "No correlated change records found in 48h window",
        "No active alarms from adjacent cells in same cluster",
        "Weather data shows no RF-impacting precipitation events",
      ],
      agentVersion: "CXI-RCA-v2.4.1",
    },
    recommendation: {
      actionType: "escalate",
      targetTeam: "Level 3 Network Engineering",
      ticketType: "Problem",
      rationale: "Low confidence (34%) — insufficient evidence for automated classification. Escalate for manual deep-dive investigation.",
      oneClickAvailable: false,
    },
    evidence: {
      alarms: [
        { alarmId: "ALM-MUC-4421", type: "CXI Composite Score Breach", severity: "P1", startTime: new Date(Date.now() - 7440000).toISOString(), status: "Active" },
      ],
      changes: [],
      tickets: [],
    },
    auditTrail: agentPipeline("CXI-2026-0043", new Date(Date.now() - 7440000).toISOString()),
    createdAt: new Date(Date.now() - 7440000).toISOString(),
    updatedAt: new Date(Date.now() - 5400000).toISOString(),
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
    correction: null,
  },

  {
    caseId: "CXI-2026-0044",
    status: "pending",
    classification: "optimization",
    severity: "P2",
    triggerType: "customer_based",
    duration: "3h 12m",
    assignedAgent: "CCA-DRA-CA-RCA-RA-HVA/20260527-012",
    affectedScope: {
      cellId: "DEU-HAM-MITTE-031",
      cellName: "Hamburg Mitte Central",
      siteId: "HAM-MITTE-04",
      siteName: "Hamburg Hauptbahnhof",
      cluster: "HAM-CENTRAL-CLUSTER",
      region: "Hamburg Metropolitan",
      geoLat: 53.5531,
      geoLng: 10.0068,
      customerId: "DT-ENT-00231",
    },
    cxiBaseline: 7.6,
    cxiCurrent: 6.0,
    cxiDrop: -1.6,
    cxiTimeseries: genTimeseries(24, 12, 1.6),
    hypothesis: {
      text: "Customer DT-ENT-00231 is experiencing a gradual CXI decline primarily driven by Data Throughput and Retainability degradation on cell DEU-HAM-MITTE-031. The pattern is consistent with capacity saturation during peak hours. No hardware fault is indicated. Load-balancing optimisation or capacity expansion is the recommended corrective path.",
      confidence: 72,
      signals: [
        "Data Throughput sub-metric declined 1.8 pts over 72h — gradual saturation pattern",
        "Retainability Rate correlates with peak traffic hours (08:00–10:00, 17:00–19:00 UTC)",
        "Adjacent cell DEU-HAM-MITTE-032 shows 18% available capacity",
        "No alarm events — purely performance-based trigger",
      ],
      agentVersion: "CXI-RCA-v2.4.1",
    },
    recommendation: {
      actionType: "create_ticket",
      targetTeam: "Capacity Planning Team",
      ticketType: "Optimization",
      rationale: "Capacity saturation pattern — recommend load-balancing configuration review and possible offload to DEU-HAM-MITTE-032.",
      oneClickAvailable: false,
    },
    evidence: {
      alarms: [],
      changes: [
        { changeId: "CHG-2026-0874", description: "Capacity threshold policy update — Hamburg cluster", initiatedBy: "Capacity-Ops", time: new Date(Date.now() - 259200000).toISOString(), status: "Completed" },
      ],
      tickets: [
        { ticketId: "TKT-2026-4398", title: "DT-ENT-00231 — Customer SLA degradation report", team: "Customer Success", priority: "P2", created: new Date(Date.now() - 7200000).toISOString() },
      ],
    },
    auditTrail: agentPipeline("CXI-2026-0044", new Date(Date.now() - 11520000).toISOString()),
    createdAt: new Date(Date.now() - 11520000).toISOString(),
    updatedAt: new Date(Date.now() - 9000000).toISOString(),
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
    correction: null,
  },

  // ── Approved × 3 ───────────────────────────────────────────────────────────

  {
    caseId: "CXI-2026-0039",
    status: "approved",
    classification: "incident",
    severity: "P1",
    triggerType: "cell_based",
    duration: "5h 33m",
    assignedAgent: "CCA-DRA-CA-RCA-RA-HVA/20260527-009",
    affectedScope: {
      cellId: "DEU-FRA-WEST-019",
      cellName: "Frankfurt West Tower B",
      siteId: "FRA-WEST-02",
      siteName: "Frankfurt Galluswarte",
      cluster: "FRA-WEST-CLUSTER",
      region: "Frankfurt Rhine-Main",
      geoLat: 50.1069,
      geoLng: 8.6421,
    },
    cxiBaseline: 8.6,
    cxiCurrent: 5.9,
    cxiDrop: -2.7,
    cxiTimeseries: genTimeseries(24, 6, 2.7),
    hypothesis: {
      text: "Hardware fault detected on the primary radio unit of cell DEU-FRA-WEST-019. Power amplifier output is degraded by approximately 40% as indicated by uplink/downlink asymmetry in the sub-metric data. Alarm ALM-FRA-2219 confirms hardware fault categorisation.",
      confidence: 91,
      signals: [
        "Voice MOS dropped abruptly 2.5 pts at 22:41 UTC — characteristic hardware fault onset",
        "Uplink/downlink asymmetry detected — power amplifier signature",
        "ALM-FRA-2219: Radio Unit Hardware Fault — active",
        "No recent changes within 72h — rules out configuration drift",
      ],
      agentVersion: "CXI-RCA-v2.4.1",
    },
    recommendation: {
      actionType: "create_ticket",
      targetTeam: "Field Engineering Team",
      ticketType: "Incident",
      rationale: "Hardware radio unit fault — field replacement required. Priority dispatch to site FRA-WEST-02.",
      oneClickAvailable: false,
    },
    evidence: {
      alarms: [
        { alarmId: "ALM-FRA-2219", type: "Radio Unit Hardware Fault", severity: "P1", startTime: new Date(Date.now() - 19800000).toISOString(), status: "Active" },
        { alarmId: "ALM-FRA-2201", type: "Power Amplifier Output Degraded", severity: "P1", startTime: new Date(Date.now() - 19620000).toISOString(), status: "Active" },
      ],
      changes: [],
      tickets: [
        { ticketId: "TKT-2026-4389", title: "FRA-WEST-019 RU hardware fault — field dispatch", team: "Field Engineering", priority: "P1", created: new Date(Date.now() - 15000000).toISOString() },
      ],
    },
    auditTrail: [
      ...agentPipeline("CXI-2026-0039", new Date(Date.now() - 19800000).toISOString()),
      { timestamp: new Date(Date.now() - 14400000).toISOString(), actor: "Marcus Webb", actorType: "reviewer", action: "Case approved", detail: "CXI recommendation approved. Ticket TKT-2026-4389 created and dispatched to Field Engineering." },
    ],
    createdAt: new Date(Date.now() - 19800000).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString(),
    reviewedBy: "Marcus Webb",
    reviewedAt: new Date(Date.now() - 14400000).toISOString(),
    rejectionReason: null,
    correction: null,
  },

  {
    caseId: "CXI-2026-0038",
    status: "approved",
    classification: "known_problem",
    severity: "P2",
    triggerType: "cell_based",
    duration: "8h 11m",
    assignedAgent: "CCA-DRA-CA-RCA-RA-HVA/20260526-041",
    affectedScope: {
      cellId: "DEU-COL-SUD-055",
      cellName: "Cologne South Sector 2",
      siteId: "COL-SUD-08",
      siteName: "Köln Rodenkirchen",
      cluster: "COL-SOUTH-CLUSTER",
      region: "Cologne/Bonn",
      geoLat: 50.8906,
      geoLng: 6.9617,
    },
    cxiBaseline: 7.9,
    cxiCurrent: 6.4,
    cxiDrop: -1.5,
    cxiTimeseries: genTimeseries(24, 14, 1.5),
    hypothesis: {
      text: "This degradation event matches a known recurring interference pattern on the COL-SOUTH-CLUSTER documented in problem record PRB-2025-0194. The degradation correlates with seasonal atmospheric ducting events common to the Rhine valley corridor. The pattern is non-actionable at the radio layer and is managed through problem record monitoring.",
      confidence: 83,
      signals: [
        "Degradation pattern matches PRB-2025-0194 seasonal atmospheric ducting signature",
        "Mobility Rate sub-metric predominantly affected — consistent with ducting pattern",
        "Atmospheric ducting advisory issued by DWD for Rhine valley (2026-05-26)",
        "Same degradation profile observed on 3 adjacent cells in COL-SOUTH-CLUSTER",
      ],
      agentVersion: "CXI-RCA-v2.4.1",
    },
    recommendation: {
      actionType: "suppress",
      targetTeam: "Problem Management Team",
      ticketType: "Problem",
      rationale: "Known recurring pattern PRB-2025-0194. Link to existing problem record and suppress ticket creation.",
      oneClickAvailable: false,
    },
    evidence: {
      alarms: [
        { alarmId: "ALM-COL-3318", type: "CXI Mobility Rate Degraded", severity: "P2", startTime: new Date(Date.now() - 29196000).toISOString(), status: "Active" },
      ],
      changes: [],
      tickets: [
        { ticketId: "PRB-2025-0194", title: "Seasonal atmospheric ducting — Rhine valley cluster degradation", team: "Problem Management", priority: "P2", created: "2025-08-14T09:00:00.000Z" },
      ],
    },
    auditTrail: [
      ...agentPipeline("CXI-2026-0038", new Date(Date.now() - 29196000).toISOString()),
      { timestamp: new Date(Date.now() - 21600000).toISOString(), actor: "Priya Nair", actorType: "reviewer", action: "Case approved", detail: "Confirmed match with PRB-2025-0194. Suppressed ticket creation. Problem record updated." },
    ],
    createdAt: new Date(Date.now() - 29196000).toISOString(),
    updatedAt: new Date(Date.now() - 21600000).toISOString(),
    reviewedBy: "Priya Nair",
    reviewedAt: new Date(Date.now() - 21600000).toISOString(),
    rejectionReason: null,
    correction: null,
  },

  {
    caseId: "CXI-2026-0037",
    status: "approved",
    classification: "optimization",
    severity: "P3",
    triggerType: "cell_based",
    duration: "6h 45m",
    assignedAgent: "CCA-DRA-CA-RCA-RA-HVA/20260526-038",
    affectedScope: {
      cellId: "DEU-STU-NORD-011",
      cellName: "Stuttgart Nord Sector 1",
      siteId: "STU-NORD-03",
      siteName: "Stuttgart Hauptbahnhof North",
      cluster: "STU-NORTH-CLUSTER",
      region: "Stuttgart Baden-Württemberg",
      geoLat: 48.7842,
      geoLng: 9.1814,
    },
    cxiBaseline: 7.4,
    cxiCurrent: 6.2,
    cxiDrop: -1.2,
    cxiTimeseries: genTimeseries(24, 16, 1.2),
    hypothesis: {
      text: "Cell DEU-STU-NORD-011 is exhibiting a sleeping cell pattern — transmitting but not actively serving users. Retainability Rate has fallen to near-zero while the cell remains operationally active. This is consistent with a radio scheduler lock requiring a soft reset.",
      confidence: 94,
      signals: [
        "Retainability Rate: 0.3 pts (near zero) — sleeping cell signature",
        "Cell still transmitting on network inventory but serving 0 active users",
        "Historical resolution: sleeping cell reset resolved identical pattern in CXI-2026-0021",
        "No hardware alarms — software/scheduler state issue",
      ],
      agentVersion: "CXI-RCA-v2.4.1",
    },
    recommendation: {
      actionType: "one_click_reset",
      targetTeam: "NOC Automation",
      ticketType: "Incident",
      rationale: "Sleeping cell confirmed at 94% confidence. One-click remote reset available and safe to execute.",
      oneClickAvailable: true,
    },
    evidence: {
      alarms: [
        { alarmId: "ALM-STU-0891", type: "Sleeping Cell Detected", severity: "P3", startTime: new Date(Date.now() - 24300000).toISOString(), status: "Active" },
      ],
      changes: [],
      tickets: [],
    },
    auditTrail: [
      ...agentPipeline("CXI-2026-0037", new Date(Date.now() - 24300000).toISOString()),
      { timestamp: new Date(Date.now() - 18000000).toISOString(), actor: "Marcus Webb", actorType: "reviewer", action: "Case approved + one-click reset triggered", detail: "Sleeping cell reset executed remotely via NOC Automation. Cell recovery confirmed within 4 minutes." },
    ],
    createdAt: new Date(Date.now() - 24300000).toISOString(),
    updatedAt: new Date(Date.now() - 18000000).toISOString(),
    reviewedBy: "Marcus Webb",
    reviewedAt: new Date(Date.now() - 18000000).toISOString(),
    rejectionReason: null,
    correction: null,
  },

  // ── Rejected × 2 ───────────────────────────────────────────────────────────

  {
    caseId: "CXI-2026-0035",
    status: "rejected",
    classification: "unknown",
    severity: "P2",
    triggerType: "cell_based",
    duration: "4h 22m",
    assignedAgent: "CCA-DRA-CA-RCA-RA-HVA/20260526-031",
    affectedScope: {
      cellId: "DEU-DUS-OST-028",
      cellName: "Düsseldorf Ost Tower C",
      siteId: "DUS-OST-05",
      siteName: "Düsseldorf Oberbilk",
      cluster: "DUS-EAST-CLUSTER",
      region: "Düsseldorf Rhine-Ruhr",
      geoLat: 51.2093,
      geoLng: 6.8198,
    },
    cxiBaseline: 8.0,
    cxiCurrent: 6.6,
    cxiDrop: -1.4,
    cxiTimeseries: genTimeseries(24, 10, 1.4),
    hypothesis: {
      text: "Insufficient correlated evidence to determine root cause with confidence. The degradation pattern does not match known incident signatures in the CXI corpus. Possible temporary measurement artefact or probe collection issue.",
      confidence: 41,
      signals: [
        "CXI drop of 1.4 pts — borderline threshold trigger",
        "No correlated alarms or change events",
        "Adjacent cells in DUS-EAST-CLUSTER show no degradation",
      ],
      agentVersion: "CXI-RCA-v2.4.1",
    },
    recommendation: {
      actionType: "create_ticket",
      targetTeam: "NOC Level 2",
      ticketType: "Incident",
      rationale: "Unknown classification — recommend investigation ticket for manual review.",
      oneClickAvailable: false,
    },
    evidence: {
      alarms: [
        { alarmId: "ALM-DUS-1109", type: "CXI Score Below Threshold", severity: "P2", startTime: new Date(Date.now() - 50400000).toISOString(), status: "Cleared" },
      ],
      changes: [],
      tickets: [],
    },
    auditTrail: [
      ...agentPipeline("CXI-2026-0035", new Date(Date.now() - 50400000).toISOString()),
      { timestamp: new Date(Date.now() - 43200000).toISOString(), actor: "Priya Nair", actorType: "reviewer", action: "Case rejected", detail: "Insufficient evidence. Alarm self-cleared. Likely measurement artefact — no ticket created." },
    ],
    createdAt: new Date(Date.now() - 50400000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
    reviewedBy: "Priya Nair",
    reviewedAt: new Date(Date.now() - 43200000).toISOString(),
    rejectionReason: { category: "Insufficient evidence", note: "Alarm self-cleared before review. Pattern does not warrant a ticket. Monitoring only." },
    correction: null,
  },

  {
    caseId: "CXI-2026-0034",
    status: "rejected",
    classification: "optimization",
    severity: "P3",
    triggerType: "customer_based",
    duration: "2h 55m",
    assignedAgent: "CCA-DRA-CA-RCA-RA-HVA/20260526-028",
    affectedScope: {
      cellId: "DEU-NUR-MITTE-044",
      cellName: "Nuremberg Mitte Sector 4",
      siteId: "NUR-MITTE-06",
      siteName: "Nürnberg Hauptmarkt",
      cluster: "NUR-CENTRAL-CLUSTER",
      region: "Nuremberg Bavaria",
      geoLat: 49.4539,
      geoLng: 11.0773,
      customerId: "DT-SMB-04812",
    },
    cxiBaseline: 7.3,
    cxiCurrent: 6.1,
    cxiDrop: -1.2,
    cxiTimeseries: genTimeseries(24, 6, 1.2),
    hypothesis: {
      text: "Customer DT-SMB-04812 shows a CXI decline attributed to Data Throughput optimisation opportunity. The CXI agent classified this as an optimisation case requiring capacity rebalancing.",
      confidence: 58,
      signals: [
        "Data Throughput degraded 1.3 pts during business hours only",
        "Customer ticket TKT-2026-4371 already raised by customer success team",
      ],
      agentVersion: "CXI-RCA-v2.4.1",
    },
    recommendation: {
      actionType: "create_ticket",
      targetTeam: "Capacity Planning Team",
      ticketType: "Optimization",
      rationale: "Capacity rebalancing opportunity for customer DT-SMB-04812.",
      oneClickAvailable: false,
    },
    evidence: {
      alarms: [],
      changes: [],
      tickets: [
        { ticketId: "TKT-2026-4371", title: "DT-SMB-04812 — Customer-reported throughput issue", team: "Customer Success", priority: "P3", created: new Date(Date.now() - 54000000).toISOString() },
      ],
    },
    auditTrail: [
      ...agentPipeline("CXI-2026-0034", new Date(Date.now() - 57600000).toISOString()),
      { timestamp: new Date(Date.now() - 50400000).toISOString(), actor: "Marcus Webb", actorType: "reviewer", action: "Case rejected", detail: "Wrong classification — TKT-2026-4371 already handles this. Duplicate ticket creation would occur. Out of scope for CXI pipeline." },
    ],
    createdAt: new Date(Date.now() - 57600000).toISOString(),
    updatedAt: new Date(Date.now() - 50400000).toISOString(),
    reviewedBy: "Marcus Webb",
    reviewedAt: new Date(Date.now() - 50400000).toISOString(),
    rejectionReason: { category: "Wrong classification", note: "Existing ticket TKT-2026-4371 already covers this. CXI pipeline generated a duplicate action. Out of scope." },
    correction: null,
  },

  // ── Corrected × 2 ──────────────────────────────────────────────────────────

  {
    caseId: "CXI-2026-0031",
    status: "corrected",
    classification: "known_problem",
    severity: "P1",
    triggerType: "cell_based",
    duration: "7h 18m",
    assignedAgent: "CCA-DRA-CA-RCA-RA-HVA/20260526-021",
    affectedScope: {
      cellId: "DEU-BRE-NORD-009",
      cellName: "Bremen Nord Sector 1",
      siteId: "BRE-NORD-02",
      siteName: "Bremen Airport Periphery",
      cluster: "BRE-NORTH-CLUSTER",
      region: "Bremen Northern",
      geoLat: 53.0481,
      geoLng: 8.7880,
    },
    cxiBaseline: 8.3,
    cxiCurrent: 5.8,
    cxiDrop: -2.5,
    cxiTimeseries: genTimeseries(24, 12, 2.5),
    hypothesis: {
      text: "CXI original hypothesis: Radio interference pattern from adjacent site. Reviewer correction: This degradation is a recurrence of the known problem PRB-2026-0011 (airport radar interference on L-band frequency band during specific flight approach corridors). The original hypothesis misclassified this as a novel incident rather than recognising the known problem signature.",
      confidence: 79,
      signals: [
        "Pattern matches PRB-2026-0011 airport radar interference fingerprint",
        "Degradation onset at 06:15 UTC coincides with morning peak approach corridor activity",
        "L-band frequency utilisation elevated on DEU-BRE-NORD-009 — radar signature",
        "Adjacent cells BRE-NORD-007, BRE-NORD-008 show minor correlated degradation",
      ],
      agentVersion: "CXI-RCA-v2.4.1",
    },
    recommendation: {
      actionType: "suppress",
      targetTeam: "Problem Management Team",
      ticketType: "Problem",
      rationale: "Known airport radar interference — link to PRB-2026-0011 and suppress new ticket.",
      oneClickAvailable: false,
    },
    evidence: {
      alarms: [
        { alarmId: "ALM-BRE-0441", type: "Radio Interference — External Source", severity: "P1", startTime: new Date(Date.now() - 72000000).toISOString(), status: "Cleared" },
      ],
      changes: [],
      tickets: [
        { ticketId: "PRB-2026-0011", title: "Bremen Airport — Recurring L-band radar interference", team: "Problem Management", priority: "P1", created: "2026-03-01T08:00:00.000Z" },
      ],
    },
    auditTrail: [
      ...agentPipeline("CXI-2026-0031", new Date(Date.now() - 72000000).toISOString()),
      {
        timestamp: new Date(Date.now() - 64800000).toISOString(),
        actor: "Priya Nair",
        actorType: "reviewer",
        action: "Case corrected",
        detail: "Reclassified from Incident → Known Problem. Hypothesis corrected to match PRB-2026-0011 pattern.",
        diff: {
          before: "Radio interference from adjacent site antenna configuration drift.",
          after: "Recurrence of PRB-2026-0011 — airport radar interference on L-band during morning approach corridor. No corrective action needed; link to problem record.",
        },
      },
      { timestamp: new Date(Date.now() - 64200000).toISOString(), actor: "CXI System", actorType: "mindr", action: "RCA Agent re-run", detail: "Re-analysis complete with reviewer correction applied. Case updated to Known Problem." },
    ],
    createdAt: new Date(Date.now() - 72000000).toISOString(),
    updatedAt: new Date(Date.now() - 64200000).toISOString(),
    reviewedBy: "Priya Nair",
    reviewedAt: new Date(Date.now() - 64800000).toISOString(),
    rejectionReason: null,
    correction: {
      originalHypothesis: "Radio interference pattern from adjacent site antenna configuration drift.",
      correctedClassification: "known_problem",
      correctedHypothesis: "Recurrence of PRB-2026-0011 — airport radar interference on L-band during morning approach corridor. No corrective action needed; link to problem record.",
      correctedAction: "suppress",
    },
  },

  {
    caseId: "CXI-2026-0030",
    status: "corrected",
    classification: "incident",
    severity: "P2",
    triggerType: "cell_based",
    duration: "9h 02m",
    assignedAgent: "CCA-DRA-CA-RCA-RA-HVA/20260526-019",
    affectedScope: {
      cellId: "DEU-HAN-SUD-022",
      cellName: "Hannover Süd Tower A",
      siteId: "HAN-SUD-04",
      siteName: "Hannover Südstadt",
      cluster: "HAN-SOUTH-CLUSTER",
      region: "Hannover Lower Saxony",
      geoLat: 52.3551,
      geoLng: 9.7387,
    },
    cxiBaseline: 7.8,
    cxiCurrent: 6.5,
    cxiDrop: -1.3,
    cxiTimeseries: genTimeseries(24, 14, 1.3),
    hypothesis: {
      text: "CXI classified as Known Problem (scheduled maintenance window). Reviewer corrected: maintenance window was completed and verified. Degradation persisted post-maintenance — this is a new incident caused by residual configuration error from the maintenance activity.",
      confidence: 76,
      signals: [
        "Degradation persisted 4h after maintenance window closure — post-maintenance residual",
        "Change CHG-2026-0861 closed at 14:00 UTC but degradation continues at 18:00 UTC",
        "Accessibility Rate specifically degraded — consistent with parameter misconfiguration",
      ],
      agentVersion: "CXI-RCA-v2.4.1",
    },
    recommendation: {
      actionType: "create_ticket",
      targetTeam: "Network Configuration Team",
      ticketType: "Incident",
      rationale: "Post-maintenance configuration error — requires parameter rollback or re-verification.",
      oneClickAvailable: false,
    },
    evidence: {
      alarms: [
        { alarmId: "ALM-HAN-2201", type: "Accessibility Rate Below SLA", severity: "P2", startTime: new Date(Date.now() - 82800000).toISOString(), status: "Active" },
      ],
      changes: [
        { changeId: "CHG-2026-0861", description: "Scheduled maintenance — Hannover Süd cluster parameter update", initiatedBy: "Config-Ops", time: new Date(Date.now() - 93600000).toISOString(), status: "Completed" },
      ],
      tickets: [],
    },
    auditTrail: [
      ...agentPipeline("CXI-2026-0030", new Date(Date.now() - 82800000).toISOString()),
      {
        timestamp: new Date(Date.now() - 72000000).toISOString(),
        actor: "Marcus Webb",
        actorType: "reviewer",
        action: "Case corrected",
        detail: "Reclassified from Known Problem → Incident. Maintenance window closed but degradation persisted — this is post-maintenance residual, not the maintenance itself.",
        diff: {
          before: "Degradation within scheduled maintenance window CHG-2026-0861. Expected and self-resolving.",
          after: "Post-maintenance residual degradation — maintenance completed but Accessibility Rate remains below SLA threshold 4h after close. Likely parameter rollback required.",
        },
      },
      { timestamp: new Date(Date.now() - 71400000).toISOString(), actor: "CXI System", actorType: "mindr", action: "RCA Agent re-run", detail: "Re-analysis with reviewer correction. Case reclassified to Incident. New ticket TKT-2026-4341 queued." },
    ],
    createdAt: new Date(Date.now() - 82800000).toISOString(),
    updatedAt: new Date(Date.now() - 71400000).toISOString(),
    reviewedBy: "Marcus Webb",
    reviewedAt: new Date(Date.now() - 72000000).toISOString(),
    rejectionReason: null,
    correction: {
      originalHypothesis: "Degradation within scheduled maintenance window CHG-2026-0861. Expected and self-resolving.",
      correctedClassification: "incident",
      correctedHypothesis: "Post-maintenance residual degradation — maintenance completed but Accessibility Rate remains below SLA 4h after close. Parameter rollback required.",
      correctedAction: "create_ticket",
    },
  },

  // ── Escalated × 2 ──────────────────────────────────────────────────────────

  {
    caseId: "CXI-2026-0028",
    status: "escalated",
    classification: "unknown",
    severity: "P1",
    triggerType: "cell_based",
    duration: "11h 14m",
    assignedAgent: "CCA-DRA-CA-RCA-RA-HVA/20260526-014",
    affectedScope: {
      cellId: "DEU-LEI-MITTE-003",
      cellName: "Leipzig Mitte Sector 3",
      siteId: "LEI-MITTE-01",
      siteName: "Leipzig Hauptbahnhof",
      cluster: "LEI-CENTRAL-CLUSTER",
      region: "Leipzig Saxony",
      geoLat: 51.3464,
      geoLng: 12.3818,
    },
    cxiBaseline: 8.5,
    cxiCurrent: 5.2,
    cxiDrop: -3.3,
    cxiTimeseries: genTimeseries(24, 6, 3.3),
    hypothesis: {
      text: "Severe multi-metric CXI collapse detected on DEU-LEI-MITTE-003 with no identifiable root cause within the CXI agent corpus. The magnitude of degradation (−3.3 pts) and simultaneous collapse of all 5 sub-metrics is anomalous. CXI confidence is critically low. Immediate human escalation required.",
      confidence: 22,
      signals: [
        "All 5 sub-metrics dropped simultaneously to critical levels — anomalous multi-vector collapse",
        "CXI drop of 3.3 pts — highest in current shift across all active cases",
        "No correlated alarm events matching this severity pattern",
        "No recent change records — excludes configuration change as primary cause",
      ],
      agentVersion: "CXI-RCA-v2.4.1",
    },
    recommendation: {
      actionType: "escalate",
      targetTeam: "Level 3 Network Engineering + NOC Manager",
      ticketType: "Problem",
      rationale: "Critical anomalous collapse at 22% confidence — mandatory escalation for immediate manual investigation.",
      oneClickAvailable: false,
    },
    evidence: {
      alarms: [
        { alarmId: "ALM-LEI-0041", type: "CXI Critical Collapse — All Sub-metrics", severity: "P1", startTime: new Date(Date.now() - 122400000).toISOString(), status: "Active" },
        { alarmId: "ALM-LEI-0039", type: "Cell Outage Risk — Traffic Bleed Detected", severity: "P1", startTime: new Date(Date.now() - 121800000).toISOString(), status: "Active" },
      ],
      changes: [],
      tickets: [],
    },
    auditTrail: [
      ...agentPipeline("CXI-2026-0028", new Date(Date.now() - 122400000).toISOString()),
      { timestamp: new Date(Date.now() - 108000000).toISOString(), actor: "CXI System", actorType: "mindr", action: "Auto-escalated", detail: "Confidence below 30% threshold with P1 severity. Auto-escalated to NOC Manager queue per escalation policy." },
    ],
    createdAt: new Date(Date.now() - 122400000).toISOString(),
    updatedAt: new Date(Date.now() - 108000000).toISOString(),
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
    correction: null,
  },

  {
    caseId: "CXI-2026-0027",
    status: "escalated",
    classification: "unknown",
    severity: "P1",
    triggerType: "customer_based",
    duration: "12h 39m",
    assignedAgent: "CCA-DRA-CA-RCA-RA-HVA/20260526-011",
    affectedScope: {
      cellId: "DEU-DRE-NORD-017",
      cellName: "Dresden Nord Tower D",
      siteId: "DRE-NORD-03",
      siteName: "Dresden Neustadt",
      cluster: "DRE-NORTH-CLUSTER",
      region: "Dresden Saxony",
      geoLat: 51.0671,
      geoLng: 13.7419,
      customerId: "DT-ENT-00089",
    },
    cxiBaseline: 8.2,
    cxiCurrent: 5.5,
    cxiDrop: -2.7,
    cxiTimeseries: genTimeseries(24, 8, 2.7),
    hypothesis: {
      text: "Enterprise customer DT-ENT-00089 is experiencing a severe CXI degradation that the CXI pipeline cannot classify with sufficient confidence. The customer has a platinum SLA. The degradation has been sustained for over 12 hours without auto-recovery. Escalation to L3 and account management is mandatory.",
      confidence: 31,
      signals: [
        "Platinum SLA customer — 12h+ degradation without resolution is a breach risk",
        "Data Throughput and Retainability showing steepest decline curves",
        "No change records, no alarms from adjacent cells — isolated and unexplained",
      ],
      agentVersion: "CXI-RCA-v2.4.1",
    },
    recommendation: {
      actionType: "escalate",
      targetTeam: "Level 3 Engineering + Enterprise Account Management",
      ticketType: "Incident",
      rationale: "Platinum SLA customer with 12h+ unexplained degradation — immediate escalation and account engagement required.",
      oneClickAvailable: false,
    },
    evidence: {
      alarms: [
        { alarmId: "ALM-DRE-1881", type: "Enterprise SLA Breach Risk", severity: "P1", startTime: new Date(Date.now() - 129600000).toISOString(), status: "Active" },
      ],
      changes: [],
      tickets: [
        { ticketId: "TKT-2026-4301", title: "DT-ENT-00089 — Platinum SLA degradation report", team: "Enterprise Account Management", priority: "P1", created: new Date(Date.now() - 118800000).toISOString() },
      ],
    },
    auditTrail: [
      ...agentPipeline("CXI-2026-0027", new Date(Date.now() - 129600000).toISOString()),
      { timestamp: new Date(Date.now() - 115200000).toISOString(), actor: "CXI System", actorType: "mindr", action: "Auto-escalated", detail: "Platinum SLA + confidence below 35% threshold. Auto-escalated per enterprise SLA policy." },
    ],
    createdAt: new Date(Date.now() - 129600000).toISOString(),
    updatedAt: new Date(Date.now() - 115200000).toISOString(),
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
    correction: null,
  },
];
