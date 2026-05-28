export type CaseStatus = "pending" | "approved" | "rejected" | "escalated" | "corrected";
export type CaseClassification = "incident" | "optimization" | "known_problem" | "unknown";
export type CaseSeverity = "P1" | "P2" | "P3";
export type TriggerType = "cell_based" | "customer_based";
export type ActionType = "create_ticket" | "escalate" | "one_click_reset" | "suppress";

export interface AffectedScope {
  cellId: string;
  cellName: string;
  siteId: string;
  siteName: string;
  cluster: string;
  region: string;
  geoLat: number;
  geoLng: number;
  customerId?: string;
}

export interface CXIDataPoint {
  t: string;
  voiceMOS: number;
  dataThroughput: number;
  accessibility: number;
  retainability: number;
  mobility: number;
}

export interface Hypothesis {
  text: string;
  confidence: number;
  signals: string[];
  agentVersion: string;
}

export interface Recommendation {
  actionType: ActionType;
  targetTeam: string;
  ticketType: string;
  rationale: string;
  oneClickAvailable: boolean;
}

export interface CaseAlarm {
  alarmId: string;
  type: string;
  severity: CaseSeverity;
  startTime: string;
  status: string;
}

export interface CaseChange {
  changeId: string;
  description: string;
  initiatedBy: string;
  time: string;
  status: string;
}

export interface CaseTicket {
  ticketId: string;
  title: string;
  team: string;
  priority: CaseSeverity;
  created: string;
}

export interface Evidence {
  alarms: CaseAlarm[];
  changes: CaseChange[];
  tickets: CaseTicket[];
}

export interface AuditEntry {
  timestamp: string;
  actor: string;
  actorType: "system" | "reviewer" | "mindr";
  action: string;
  detail: string;
  diff?: { before: string; after: string };
}

export interface RejectionReason {
  category: string;
  note: string;
}

export interface Correction {
  originalHypothesis: string;
  correctedClassification: CaseClassification;
  correctedHypothesis: string;
  correctedAction?: ActionType;
}

export interface MINDRCase {
  caseId: string;
  status: CaseStatus;
  classification: CaseClassification;
  severity: CaseSeverity;
  triggerType: TriggerType;
  affectedScope: AffectedScope;
  cxiBaseline: number;
  cxiCurrent: number;
  cxiDrop: number;
  cxiTimeseries: CXIDataPoint[];
  hypothesis: Hypothesis;
  recommendation: Recommendation;
  evidence: Evidence;
  auditTrail: AuditEntry[];
  createdAt: string;
  updatedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: RejectionReason | null;
  correction: Correction | null;
  duration: string;
  assignedAgent: string;
}
