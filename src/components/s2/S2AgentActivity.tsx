// Agent Activity — grouped by case with 7-stage pipeline tracker
// Primary view: case cards; secondary: flat event log (A4)
// "Needs Approval" section pinned at top (B1)
// No Scenario 2 badge (C1); real case IDs (C2); confidence only at RCA/RA (C3)
// Anti-loop flag on CXI-2026-0043 (D1)

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, BookOpen, Brain,
  ChevronDown, ChevronRight, Check,
  Inbox, LayoutGrid, Lightbulb, List,
  RefreshCw, RotateCcw, UserCheck, Zap,
} from "lucide-react";
import { mockCases } from "../../data/cxi-cases";
import type { MINDRCase } from "../../types/cxi";
import { statusColor, statusBg, severityColor, severityBg } from "../cxi/CaseRow";
import { Badge } from "../ui/badge";

// ── 7 canonical pipeline stages ───────────────────────────────────────────────

const AGENT_STAGES = [
  { id: "trigger",   short: "TRG",    label: "Trigger",            icon: Zap,       color: "#E2007A" },
  { id: "context",   short: "CCA",    label: "Context Collection",  icon: Inbox,     color: "#1A5A8A" },
  { id: "rca",       short: "CA/RCA", label: "Correlation & RCA",   icon: Brain,     color: "#6B2FA0" },
  { id: "recommend", short: "RA",     label: "Recommendation",      icon: Lightbulb, color: "#B45000" },
  { id: "human",     short: "HVA",    label: "Human Validation",    icon: UserCheck, color: "#1A7A4A" },
  { id: "execute",   short: "ExA",    label: "Execution",           icon: RefreshCw, color: "#E2007A" },
  { id: "docs",      short: "DRA",    label: "Documentation",       icon: BookOpen,  color: "#1A5A8A" },
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

interface StageEvent {
  agentName: string;
  summary: string;
  timestamp: string;
  confidence?: number;
  showConfidence: boolean; // only true for RCA (idx 2) and Recommendation (idx 3)
  inputs: { label: string; value: string }[];
  reasoning: string;
  output: string;
}

interface CaseActivity {
  caseId: string;
  currentStage: number; // active stage index, -1 = fully done
  stages: (StageEvent | null)[]; // one per AGENT_STAGES slot
  repeatFlag?: string; // D1: anti-loop transparency
}

// ── Rich stage events for featured cases ─────────────────────────────────────

const RICH: Record<string, (StageEvent | null)[]> = {

  // Sleeping cell reset — the hero "pending approval" case
  "CXI-2026-0040": [
    {
      agentName: "Trigger Agent", summary: "CXI drop −1.2 on Cologne Nord Sector 1 — P1 case opened, sleeping cell pattern detected",
      timestamp: "42m ago", showConfidence: false,
      inputs: [
        { label: "Cell",     value: "Cologne Nord Sector 1" },
        { label: "Site",     value: "Köln Hauptbahnhof" },
        { label: "CXI Drop", value: "−1.2 pts  (4.1 → 2.9)" },
        { label: "Pattern",  value: "Gradual 45-min decline — sleeping cell signature" },
        { label: "Cluster",  value: "COL-NORTH (3 cases active)" },
      ],
      reasoning: "CXI drop of −1.2 exceeded P1 threshold. Gradual decline profile consistent with sleeping cell. Cluster COL-NORTH has 2 additional concurrent cases — correlated event suspected.",
      output: "Case CXI-2026-0040 opened (P1). Sleeping cell investigation queued.",
    },
    {
      agentName: "Context Collection Agent", summary: "112 alarms retrieved, no recent changes — confirms sleeping cell over interference",
      timestamp: "40m ago", showConfidence: false,
      inputs: [
        { label: "Alarms retrieved", value: "112 (last 4h)" },
        { label: "Change tickets",   value: "0 linked in 72h window" },
        { label: "Known problems",   value: "None exact-matched" },
        { label: "Cluster flag",     value: "COL-NORTH — 3 cases within 15 min window" },
      ],
      reasoning: "Zero change records rule out change-induced regression. High alarm density without matching change ticket strongly supports sleeping cell hypothesis. Cluster flag passed to RCA.",
      output: "Context package with sleeping cell hypothesis forwarded to Correlation & RCA.",
    },
    {
      agentName: "Correlation & RCA Agent", summary: "RCA confidence 89% — sleeping cell confirmed on Cologne Nord Sector 1, one-click reset applicable",
      timestamp: "39m ago", confidence: 89, showConfidence: true,
      inputs: [
        { label: "CXI sub-metric",   value: "Voice MOS: −52%, Accessibility: −44%" },
        { label: "Alarm pattern",    value: "Low-level persistent errors — no burst (sleeping cell profile)" },
        { label: "Playbook match",   value: "PB-0044 — Sleeping Cell Reset (89% similarity)" },
        { label: "Change impact",    value: "None — change exclusion confirmed" },
      ],
      reasoning: "Voice MOS and Accessibility sub-metrics show the characteristic signature of a sleeping cell: gradual monotonic decline without alarm burst. PB-0044 matched at 89%. One-click SON reset is applicable and reversible.",
      output: "Root cause: sleeping cell on Cologne Nord Sector 1. One-click reset via SON interface. Forwarded to Recommendation Agent.",
    },
    {
      agentName: "Recommendation Agent", summary: "One-click sleeping cell reset proposed — PB-0044, SON interface, no service impact",
      timestamp: "38m ago", confidence: 87, showConfidence: true,
      inputs: [
        { label: "Root cause",    value: "Sleeping cell (confirmed, 89%)" },
        { label: "Playbook",      value: "PB-0044 — Sleeping Cell Reset" },
        { label: "One-click",     value: "Available via SON interface" },
        { label: "Target team",   value: "NOC — Cologne (for execution oversight)" },
        { label: "SLA remaining", value: "3h 18m (P1 4h SLA)" },
        { label: "Risk",          value: "Low — reversible, no subscriber impact during reset" },
      ],
      reasoning: "PB-0044 matched at 87%. One-click automation approved for this fault class. Human approval required before SON interface executes reset. Estimated recovery time: 4 minutes.",
      output: "Proposed: one-click sleeping cell reset via SON interface. Sent to Human Validation Agent.",
    },
    {
      agentName: "Human Validation Agent", summary: "Sleeping cell reset pending approval from Marcus Webb — one-click, low risk",
      timestamp: "37m ago", showConfidence: false,
      inputs: [
        { label: "Reviewer",        value: "Marcus Webb (CXI Specialist)" },
        { label: "Proposed action", value: "One-click sleeping cell reset — SON interface" },
        { label: "Risk level",      value: "Low (reversible, ~4 min, no subscriber outage)" },
        { label: "Approval mode",   value: "One-click via MINDR case view" },
        { label: "SLA pressure",    value: "3h 15m remaining on P1 SLA" },
      ],
      reasoning: "All required data compiled into reviewer-friendly summary. Automated execution is blocked until explicit approval is captured with timestamp. Rejection or correction also available.",
      output: "Awaiting approval from Marcus Webb. No automated action taken until approved.",
    },
    null, // Execution — not yet
    null, // Documentation — not yet
  ],

  // Berlin antenna regression — escalation pending
  "CXI-2026-0041": [
    {
      agentName: "Trigger Agent", summary: "CXI drop −1.7 on Berlin Süd Tower C — P2 case opened",
      timestamp: "38m ago", showConfidence: false,
      inputs: [
        { label: "Cell",     value: "Berlin Süd Tower C" },
        { label: "Site",     value: "Berlin Tempelhof" },
        { label: "CXI Drop", value: "−1.7 pts  (3.9 → 2.2)" },
        { label: "Users",    value: "842 affected subscribers" },
      ],
      reasoning: "CXI drop of −1.7 exceeded P2 threshold of −0.75. No duplicate case in suppression window. Case opened (P2).",
      output: "Case CXI-2026-0041 opened (P2). Context collection queued.",
    },
    {
      agentName: "Context Collection Agent", summary: "89 alarms, 1 change ticket retrieved — CHG-2026-0889 flagged for correlation",
      timestamp: "36m ago", showConfidence: false,
      inputs: [
        { label: "Alarms",         value: "89 retrieved (last 4h)" },
        { label: "Change tickets", value: "1 — CHG-2026-0889 (antenna tilt, adjacent cell)" },
        { label: "Open tickets",   value: "0 linked" },
        { label: "Region",         value: "Berlin Metropolitan, EU-CENTRAL" },
      ],
      reasoning: "Change ticket CHG-2026-0889 (scheduled antenna tilt on adjacent cell) flagged for temporal and spatial correlation with CXI drop. Forwarded to RCA.",
      output: "Context package forwarded. CHG-2026-0889 flagged as potential root cause.",
    },
    {
      agentName: "Correlation & RCA Agent", summary: "RCA confidence 73% — antenna tilt regression from CHG-2026-0889, moderate confidence",
      timestamp: "34m ago", confidence: 73, showConfidence: true,
      inputs: [
        { label: "CXI sub-metric",  value: "Retainability: −42%, Accessibility: −18%" },
        { label: "Change matched",  value: "CHG-2026-0889 — antenna tilt, same cluster" },
        { label: "Alarm pattern",   value: "Handover failure rate spike — 27 alarms" },
        { label: "Confidence note", value: "73% — moderate; escalation considered" },
      ],
      reasoning: "CHG-2026-0889 correlates spatially and temporally with the CXI drop. Retainability collapse consistent with degraded handover path from antenna tilt. Confidence 73% — below high-confidence threshold, escalation pathway activated.",
      output: "Root cause hypothesis: antenna tilt regression from CHG-2026-0889. Escalation recommended.",
    },
    {
      agentName: "Recommendation Agent", summary: "Escalation to RAN Ops Berlin proposed — manual antenna review required",
      timestamp: "33m ago", confidence: 71, showConfidence: true,
      inputs: [
        { label: "Root cause",    value: "Antenna tilt regression (change-induced, 73%)" },
        { label: "Playbook",      value: "PB-0031 — Change Rollback Request" },
        { label: "Target team",   value: "RAN Operations — Berlin" },
        { label: "SLA remaining", value: "6h 22m (P2 8h SLA)" },
        { label: "One-click",     value: "Not available — field investigation needed" },
      ],
      reasoning: "No automated fix available for change-induced antenna regression. CHG-2026-0889 must be reviewed by RAN Ops. Escalation ticket is the safe path. Human approval required.",
      output: "Proposed: escalation ticket to RAN Ops Berlin for CHG-2026-0889 review.",
    },
    {
      agentName: "Human Validation Agent", summary: "Escalation to RAN Ops Berlin awaiting approval",
      timestamp: "32m ago", showConfidence: false,
      inputs: [
        { label: "Reviewer",        value: "Marcus Webb (CXI Specialist)" },
        { label: "Proposed action", value: "Escalation ticket — RAN Ops Berlin" },
        { label: "Risk",            value: "Low (ticket only, no automated change)" },
        { label: "Approval mode",   value: "One-click via MINDR case view" },
      ],
      reasoning: "Awaiting reviewer. Automated action blocked until approval captured.",
      output: "Awaiting approval. No action taken until approved.",
    },
    null, null,
  ],

  // Munich — anti-loop case: recommendation was revised once
  "CXI-2026-0043": [
    {
      agentName: "Trigger Agent", summary: "CXI drop −1.4 on Munich Ost Sector 3 — P1 case opened",
      timestamp: "1h 12m ago", showConfidence: false,
      inputs: [
        { label: "Cell",     value: "Munich Ost Sector 3" },
        { label: "Site",     value: "München Ostbahnhof Roof" },
        { label: "CXI Drop", value: "−1.4 pts  (4.0 → 2.6)" },
      ],
      reasoning: "CXI drop exceeded P1 threshold. Case opened.",
      output: "Case CXI-2026-0043 opened (P1).",
    },
    {
      agentName: "Context Collection Agent", summary: "94 alarms, known problem KP-9031 active for 2 weeks",
      timestamp: "1h 10m ago", showConfidence: false,
      inputs: [
        { label: "Alarms",         value: "94 (last 4h)" },
        { label: "Known problems", value: "2 — KP-9031 (scheduling conflict, 2w active), KP-8991" },
        { label: "Change tickets", value: "1 — CHG-2026-0921 (different cluster)" },
      ],
      reasoning: "KP-9031 is a persistent Munich Ost scheduling conflict open for 2 weeks. Flagged as likely contributor.",
      output: "Context forwarded. KP-9031 age flagged for escalation consideration.",
    },
    {
      agentName: "Correlation & RCA Agent", summary: "RCA confidence 68% — scheduling conflict KP-9031, low confidence triggers escalation pathway",
      timestamp: "1h 8m ago", confidence: 68, showConfidence: true,
      inputs: [
        { label: "CXI sub-metric",  value: "Mobility: −37%, Data Throughput: −28%" },
        { label: "Known problem",   value: "KP-9031 (scheduling conflict, active 2w)" },
        { label: "Change impact",   value: "CHG-2026-0921 ruled out — different cluster" },
        { label: "Confidence note", value: "68% — below high-confidence; KP-9031 age increases uncertainty" },
      ],
      reasoning: "KP-9031 correlation is moderate at 68%. Mobility drop consistent with scheduling fault but not conclusive. Low confidence combined with KP-9031's 2-week age without L2 resolution activates escalation pathway.",
      output: "Hypothesis: scheduling conflict KP-9031. Low confidence — escalation pathway recommended.",
    },
    {
      agentName: "Recommendation Agent", summary: "⚠ Recommendation revised once — initial L2 ticket superseded by direct L3 escalation",
      timestamp: "1h 5m ago", confidence: 65, showConfidence: true,
      inputs: [
        { label: "Root cause",       value: "KP-9031 scheduling conflict (68%, low confidence)" },
        { label: "Initial action",   value: "Create L2 RAN ticket (superseded)" },
        { label: "Revised action",   value: "Escalate directly to L3 Engineering Munich" },
        { label: "Revision reason",  value: "KP-9031 active 2 weeks; L2 path previously attempted and unresolved" },
        { label: "Loop detection",   value: "1 reanalysis cycle detected — flagged for transparency" },
      ],
      reasoning: "Initial recommendation (L2 ticket) was generated, then superseded when KP-9031's age and L2 inaction history were factored in. Revised recommendation: direct L3 escalation. One reanalysis loop logged for audit trail transparency.",
      output: "Revised proposed action: escalate to L3 Engineering Munich. Previous L2 ticket recommendation superseded.",
    },
    {
      agentName: "Human Validation Agent", summary: "L3 escalation (revised recommendation) awaiting Priya Nair approval",
      timestamp: "1h 3m ago", showConfidence: false,
      inputs: [
        { label: "Reviewer",        value: "Priya Nair (Operations Manager)" },
        { label: "Proposed action", value: "L3 escalation — Munich Engineering" },
        { label: "Note",            value: "Recommendation was revised once — see stage 4 detail" },
      ],
      reasoning: "Revised escalation awaiting approval. Revision is flagged in audit trail and case card.",
      output: "Awaiting approval.",
    },
    null, null,
  ],

  // Stuttgart — sleeping cell RESOLVED (done case hero)
  "CXI-2026-0037": [
    {
      agentName: "Trigger Agent", summary: "CXI drop −1.3 on Stuttgart West Tower A — sleeping cell pattern, P3 case opened",
      timestamp: "3h 44m ago", showConfidence: false,
      inputs: [
        { label: "Cell",    value: "Stuttgart West Tower A" },
        { label: "CXI Drop", value: "−1.3 pts  (4.3 → 3.0)" },
        { label: "Pattern", value: "Gradual 45-min decline — sleeping cell signature" },
      ],
      reasoning: "CXI drop of −1.3 with gradual profile matches sleeping cell. Case opened (P3).",
      output: "Case CXI-2026-0037 opened (P3). Context queued.",
    },
    {
      agentName: "Context Collection Agent", summary: "31 alarms, no change records — sleeping cell signature confirmed",
      timestamp: "3h 42m ago", showConfidence: false,
      inputs: [
        { label: "Alarms",         value: "31 (last 4h) — low-level persistent" },
        { label: "Change tickets", value: "0 — no change in 72h window" },
        { label: "Playbook hint",  value: "PB-0044 pre-matched on alarm profile" },
      ],
      reasoning: "Low alarm count + zero change records + gradual CXI decline = strong sleeping cell indicator.",
      output: "Context forwarded. Sleeping cell hypothesis set.",
    },
    {
      agentName: "Correlation & RCA Agent", summary: "RCA confidence 94% — sleeping cell confirmed, PB-0044 match",
      timestamp: "3h 40m ago", confidence: 94, showConfidence: true,
      inputs: [
        { label: "Sub-metric",    value: "Voice MOS: −48%, Accessibility: −39%" },
        { label: "Playbook",      value: "PB-0044 — Sleeping Cell Reset (94%)" },
        { label: "Change impact", value: "None" },
      ],
      reasoning: "Sub-metric profile and alarm pattern match PB-0044 at 94%. One-click reset applicable.",
      output: "Root cause confirmed: sleeping cell. One-click reset via SON interface applicable.",
    },
    {
      agentName: "Recommendation Agent", summary: "One-click sleeping cell reset proposed — PB-0044, 92% confidence",
      timestamp: "3h 38m ago", confidence: 92, showConfidence: true,
      inputs: [
        { label: "Playbook",      value: "PB-0044 — Sleeping Cell Reset" },
        { label: "One-click",     value: "Available — SON interface" },
        { label: "SLA remaining", value: "22h 22m (P3 24h SLA)" },
        { label: "Risk",          value: "Low — reversible, no subscriber impact" },
      ],
      reasoning: "PB-0044 at 92%. One-click via SON interface. Reversible. Sent for human approval.",
      output: "Proposed: one-click sleeping cell reset via SON interface.",
    },
    {
      agentName: "Human Validation Agent", summary: "Approved by Marcus Webb — one-click reset authorized at 09:51 UTC",
      timestamp: "3h 26m ago", showConfidence: false,
      inputs: [
        { label: "Reviewer",   value: "Marcus Webb" },
        { label: "Decision",   value: "Approved" },
        { label: "Timestamp",  value: "09:51 UTC" },
      ],
      reasoning: "Approval captured. Execution authorized.",
      output: "Execution authorized.",
    },
    {
      agentName: "Execution Agent", summary: "Sleeping cell reset executed — CXI recovered +1.3 pts to 4.3, 38 seconds",
      timestamp: "3h 24m ago", showConfidence: false,
      inputs: [
        { label: "Approved by",    value: "Marcus Webb — 09:51 UTC" },
        { label: "Action",         value: "Sleeping Cell reset via SON interface" },
        { label: "Pre-reset CXI",  value: "3.0 pts" },
        { label: "Post-reset CXI", value: "4.3 pts (+1.3 recovery)" },
        { label: "Duration",       value: "38 seconds" },
      ],
      reasoning: "Executed after explicit human approval. SON interface confirmed reset. CXI recovery confirmed above threshold.",
      output: "Reset successful. CXI recovered to 4.3 pts. Case resolved.",
    },
    {
      agentName: "Documentation Agent", summary: "INC-89014 closed, PB-0044 feedback updated, audit trail complete",
      timestamp: "3h 18m ago", showConfidence: false,
      inputs: [
        { label: "Target ticket",   value: "INC-89014 (ServiceNow)" },
        { label: "Playbook update", value: "PB-0044 outcome feedback written" },
        { label: "Audit record",    value: "AUD-2026-4502 created" },
      ],
      reasoning: "Post-resolution documentation written. Playbook updated.",
      output: "INC-89014 closed. Audit trail complete.",
    },
  ],

  // Cologne — transient suppression RESOLVED
  "CXI-2026-0038": [
    {
      agentName: "Trigger Agent", summary: "CXI drop −0.9 on Cologne Ring Ost — P2 case opened",
      timestamp: "4h 12m ago", showConfidence: false,
      inputs: [
        { label: "Cell",     value: "Cologne Ring Ost Sector 2" },
        { label: "CXI Drop", value: "−0.9 pts  (3.8 → 2.9)" },
      ],
      reasoning: "CXI drop exceeded −0.75 threshold. Case opened (P2).",
      output: "Case CXI-2026-0038 opened (P2).",
    },
    {
      agentName: "Context Collection Agent", summary: "54 alarms, 0 changes — KP-8102 (transient interference) flagged",
      timestamp: "4h 10m ago", showConfidence: false,
      inputs: [
        { label: "Alarms",         value: "54 (last 4h)" },
        { label: "Change tickets", value: "0" },
        { label: "Known problems", value: "KP-8102 — external interference zone, recurring" },
      ],
      reasoning: "KP-8102 (transient interference) relevant to this area. Zero change records rule out change-induced cause.",
      output: "Context forwarded. KP-8102 flagged.",
    },
    {
      agentName: "Correlation & RCA Agent", summary: "RCA confidence 81% — transient interference from KP-8102, typically self-clears in 45–90 min",
      timestamp: "4h 8m ago", confidence: 81, showConfidence: true,
      inputs: [
        { label: "Sub-metric",     value: "Mobility: −22%, Retainability: −18%" },
        { label: "Known problem",  value: "KP-8102 — recurring, self-clearing avg 90 min" },
        { label: "Historical",     value: "94% of similar cases auto-resolved" },
      ],
      reasoning: "Pattern matches KP-8102 transient interference. Historical data: 94% auto-resolution within 90 min. Suppression proposed to avoid false positives.",
      output: "Root cause: transient interference (KP-8102). Suppression recommended.",
    },
    {
      agentName: "Recommendation Agent", summary: "Suppress case — transient interference, auto-resolution expected within 60 min",
      timestamp: "4h 6m ago", confidence: 80, showConfidence: true,
      inputs: [
        { label: "Playbook",      value: "PB-0008 — Suppress Transient Alarm" },
        { label: "Monitor window", value: "60 min CXI monitoring after suppression" },
        { label: "Risk",          value: "Low — KP-8102 historical resolution rate 94%" },
      ],
      reasoning: "Suppression safe given KP-8102 history. Human approval required.",
      output: "Proposed: suppress with 60-min monitoring window.",
    },
    {
      agentName: "Human Validation Agent", summary: "Approved by Priya Nair — suppression authorized at 10:09 UTC",
      timestamp: "3h 52m ago", showConfidence: false,
      inputs: [
        { label: "Reviewer",  value: "Priya Nair" },
        { label: "Decision",  value: "Approved" },
        { label: "Timestamp", value: "10:09 UTC" },
      ],
      reasoning: "Suppression approved. Execution authorized.",
      output: "Execution authorized.",
    },
    {
      agentName: "Execution Agent", summary: "Case suppressed — interference cleared at 52 min as predicted",
      timestamp: "3h 48m ago", showConfidence: false,
      inputs: [
        { label: "Action",   value: "Case suppressed — 60-min monitoring set" },
        { label: "Outcome",  value: "Interference cleared at 52 min (within expected window)" },
        { label: "CXI",      value: "Recovered passively to 3.6 pts" },
      ],
      reasoning: "Suppression executed after approval. CXI recovered passively.",
      output: "Case suppressed. CXI recovered. Case closed.",
    },
    {
      agentName: "Documentation Agent", summary: "NOC-2026-0038 log entry created, PB-0008 outcome archived",
      timestamp: "3h 40m ago", showConfidence: false,
      inputs: [
        { label: "NOC log",         value: "NOC-2026-0038 created" },
        { label: "Playbook update", value: "PB-0008 outcome confirmed" },
        { label: "Audit record",    value: "AUD-2026-4499 created" },
      ],
      reasoning: "Documentation complete.",
      output: "Case closed. Audit trail archived.",
    },
  ],
};

// ── Derive stage events from audit trail (fallback for non-featured cases) ────

function deriveStages(c: MINDRCase): (StageEvent | null)[] {
  const at = c.auditTrail;
  const fmtRel = (iso: string) => {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return h < 24 ? `${h}h ${m % 60}m ago` : `${Math.floor(h / 24)}d ago`;
  };

  return [
    at[0] ? {
      agentName: "Trigger Agent",
      summary: `CXI drop ${c.cxiDrop.toFixed(1)} on ${c.affectedScope.cellName} — ${c.severity} case opened`,
      timestamp: fmtRel(at[0].timestamp), showConfidence: false,
      inputs: [
        { label: "Cell",     value: c.affectedScope.cellName },
        { label: "Site",     value: c.affectedScope.siteName },
        { label: "CXI Drop", value: `${c.cxiDrop.toFixed(1)} pts  (${c.cxiBaseline.toFixed(1)} → ${c.cxiCurrent.toFixed(1)})` },
      ],
      reasoning: at[0].detail, output: `${c.caseId} opened (${c.severity}).`,
    } : null,
    at[1] ? {
      agentName: "Context Collection Agent",
      summary: `${c.evidence.alarms.length} alarms, ${c.evidence.changes.length} changes, ${c.evidence.tickets.length} tickets retrieved`,
      timestamp: fmtRel(at[1].timestamp), showConfidence: false,
      inputs: [
        { label: "Alarms",   value: `${c.evidence.alarms.length} retrieved` },
        { label: "Changes",  value: `${c.evidence.changes.length} records` },
        { label: "Tickets",  value: `${c.evidence.tickets.length} open` },
      ],
      reasoning: at[1].detail, output: "Context package forwarded.",
    } : null,
    at[4] ? {
      agentName: "Correlation & RCA Agent",
      summary: c.hypothesis.text.length > 80 ? c.hypothesis.text.slice(0, 80) + "…" : c.hypothesis.text,
      timestamp: fmtRel(at[4].timestamp), confidence: c.hypothesis.confidence, showConfidence: true,
      inputs: [
        { label: "Confidence", value: `${c.hypothesis.confidence}%` },
        { label: "Signals",    value: `${c.hypothesis.signals.length} supporting` },
      ],
      reasoning: c.hypothesis.text, output: "Root cause hypothesis generated.",
    } : null,
    at[5] ? {
      agentName: "Recommendation Agent",
      summary: `${c.recommendation.actionType.replace(/_/g, " ")} → ${c.recommendation.targetTeam}`,
      timestamp: fmtRel(at[5].timestamp), confidence: Math.max(50, c.hypothesis.confidence - 8), showConfidence: true,
      inputs: [
        { label: "Action",      value: c.recommendation.actionType.replace(/_/g, " ") },
        { label: "Target team", value: c.recommendation.targetTeam },
        { label: "One-click",   value: c.recommendation.oneClickAvailable ? "Available" : "Not available" },
      ],
      reasoning: c.recommendation.rationale,
      output: c.recommendation.proposedAction ?? "Action plan produced.",
    } : null,
    at[6] ? {
      agentName: "Human Validation Agent",
      summary: c.status === "pending"
        ? "Awaiting reviewer approval"
        : `${c.status.charAt(0).toUpperCase() + c.status.slice(1)}${c.reviewedBy ? ` by ${c.reviewedBy}` : ""}`,
      timestamp: fmtRel(at[6].timestamp), showConfidence: false,
      inputs: [
        { label: "Reviewer", value: c.reviewedBy ?? "Pending" },
        { label: "Status",   value: c.status },
      ],
      reasoning: c.status === "pending" ? "Awaiting human review." : `Case ${c.status}.`,
      output: c.status === "pending" ? "Awaiting approval." : `Case ${c.status}.`,
    } : null,
    // Execution — only for approved cases
    c.status === "approved" ? {
      agentName: "Execution Agent", summary: "Action executed after human approval",
      timestamp: c.reviewedAt ? (() => { const m = Math.floor((Date.now() - new Date(c.reviewedAt!).getTime()) / 60000); return m < 60 ? `${m}m ago` : `${Math.floor(m/60)}h ago`; })() : "recent",
      showConfidence: false,
      inputs: [
        { label: "Approved by", value: c.reviewedBy ?? "reviewer" },
        { label: "Action",      value: c.recommendation.actionType.replace(/_/g, " ") },
      ],
      reasoning: "Action executed only after human approval was captured with timestamp.",
      output: "Action executed.",
    } : null,
    c.status === "approved" ? {
      agentName: "Documentation Agent", summary: "Case documentation and audit trail updated",
      timestamp: "recent", showConfidence: false, inputs: [],
      reasoning: "Post-resolution documentation written.", output: "Case closed.",
    } : null,
  ];
}

// ── Build all case activities from mockCases ──────────────────────────────────

function buildActivities(): CaseActivity[] {
  const sorted = [...mockCases].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    const s = { P1: 0, P2: 1, P3: 2 } as Record<string, number>;
    return (s[a.severity] ?? 2) - (s[b.severity] ?? 2);
  });

  return sorted.map((c) => {
    const currentStage =
      c.status === "pending" ? 4
      : c.status === "approved" ? -1
      : 4; // rejected/escalated/corrected all ended at HVA

    return {
      caseId: c.caseId,
      currentStage,
      stages: RICH[c.caseId] ?? deriveStages(c),
      repeatFlag: c.caseId === "CXI-2026-0043"
        ? "Recommendation revised — initial action superseded after reanalysis"
        : undefined,
    };
  });
}

// ── Helper: get the MINDRCase for a caseId ────────────────────────────────────

const caseMap = new Map(mockCases.map((c) => [c.caseId, c]));

// ── Sub-components ────────────────────────────────────────────────────────────

function ConfidenceBadge({ value, label }: { value: number; label?: string }) {
  const color = value >= 85 ? "var(--color-resolved)" : value >= 70 ? "var(--color-warning)" : "var(--color-critical)";
  return (
    <Badge className="font-bold px-1.5 py-px"
      style={{ backgroundColor: `${color}20`, color }}>
      {label ? `${label} ` : ""}{value}%
    </Badge>
  );
}

// ── 7-stage horizontal pipeline tracker ──────────────────────────────────────

function PipelineTracker({
  currentStage, stages, expandedStage, onToggleStage,
}: {
  currentStage: number;
  stages: (StageEvent | null)[];
  expandedStage: number | null;
  onToggleStage: (i: number) => void;
}) {
  return (
    <div className="flex items-start gap-0 overflow-x-auto py-1" style={{ scrollbarWidth: "none" }}>
      {AGENT_STAGES.map((s, i) => {
        const done   = currentStage === -1 || i < currentStage;
        const active = currentStage !== -1 && i === currentStage;
        const hasEvent = stages[i] !== null;
        const isExpanded = expandedStage === i;

        const dotColor = done
          ? "var(--color-resolved)"
          : active
            ? s.color
            : "rgba(255,255,255,0.10)";
        const labelColor = done || active
          ? "var(--color-text-secondary)"
          : "var(--color-text-muted)";

        return (
          <div key={s.id} className="flex items-center">
            {/* Stage node */}
            <button
              onClick={() => hasEvent && onToggleStage(i)}
              disabled={!hasEvent}
              title={s.label}
              className="flex flex-col items-center gap-1 px-2"
              style={{ cursor: hasEvent ? "pointer" : "default", minWidth: 56 }}
            >
              {/* Dot */}
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center relative"
                style={{
                  backgroundColor: done ? dotColor + "22" : active ? dotColor + "18" : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${dotColor}`,
                  boxShadow: active ? `0 0 8px ${dotColor}60` : "none",
                }}
              >
                {done
                  ? <Check size={10} style={{ color: dotColor }} />
                  : active
                    ? <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: dotColor }} />
                    : <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                }
                {isExpanded && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: s.color }} />
                )}
              </div>
              {/* Label */}
              <span className="text-[9px] font-medium text-center leading-tight"
                style={{ color: labelColor, fontFamily: "var(--font-ui)" }}>
                {s.short}
              </span>
            </button>

            {/* Connector line */}
            {i < AGENT_STAGES.length - 1 && (
              <div className="h-px flex-shrink-0" style={{
                width: 16,
                backgroundColor: (currentStage === -1 || i < currentStage)
                  ? "rgba(45,212,191,0.3)"
                  : "rgba(255,255,255,0.06)",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Stage detail panel (3-column) ─────────────────────────────────────────────

function StageDetailPanel({ event, stageIdx }: { event: StageEvent; stageIdx: number }) {
  const stage = AGENT_STAGES[stageIdx];
  return (
    <div className="rounded-b-xl overflow-hidden mt-1"
      style={{ backgroundColor: "var(--color-bg-elevated)", border: `1px solid ${stage.color}30` }}>
      {/* Stage label bar */}
      <div className="flex items-center gap-2 px-5 py-2"
        style={{ borderBottom: `1px solid ${stage.color}25`, backgroundColor: `${stage.color}08` }}>
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: stage.color }}>
          {stage.label}
        </span>
        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          · {event.agentName}
        </span>
        <span className="text-[10px] ml-auto" style={{ color: "var(--color-text-muted)" }}>
          {event.timestamp}
        </span>
        {event.showConfidence && event.confidence !== undefined && (
          <ConfidenceBadge value={event.confidence} label={stageIdx === 2 ? "RCA confidence" : "Confidence"} />
        )}
      </div>
      {/* 3-column body */}
      <div className="grid grid-cols-3 divide-x" style={{ borderColor: "var(--color-border)" }}>
        <div className="px-4 py-4">
          <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>Inputs</p>
          <div className="space-y-2">
            {event.inputs.length === 0
              ? <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>—</p>
              : event.inputs.map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[9px] uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>{label}</p>
                  <p className="text-[11px] font-medium mt-px" style={{ color: "var(--color-text-primary)" }}>{value}</p>
                </div>
              ))
            }
          </div>
        </div>
        <div className="px-4 py-4" style={{ borderLeft: "1px solid var(--color-border)" }}>
          <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>Agent Reasoning</p>
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{event.reasoning}</p>
        </div>
        <div className="px-4 py-4 flex flex-col gap-3" style={{ borderLeft: "1px solid var(--color-border)" }}>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>Output</p>
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{event.output}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Case card ─────────────────────────────────────────────────────────────────

function CaseCard({ activity, featured }: { activity: CaseActivity; featured?: boolean }) {
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const c = caseMap.get(activity.caseId);
  if (!c) return null;

  const isPending = c.status === "pending";

  function toggleStage(i: number) {
    setExpandedStage((prev) => (prev === i ? null : i));
  }

  const borderColor = isPending
    ? featured ? "rgba(180,80,0,0.5)" : "rgba(180,80,0,0.25)"
    : "var(--color-border)";
  const bgColor = isPending && featured
    ? "rgba(180,80,0,0.04)"
    : "var(--color-bg-card)";

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>

      {/* Card header */}
      <div className="flex items-start justify-between gap-3 px-5 py-3"
        style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Case ID — clickable */}
          <Link to={`/cxi-cases/${c.caseId}`}
            className="text-sm font-bold hover:underline"
            style={{ color: "var(--color-brand)", fontFamily: "var(--font-mono)" }}>
            {c.caseId}
          </Link>
          {/* Status */}
          <Badge className="font-bold px-2 py-px uppercase tracking-wider"
            style={{ color: statusColor(c.status), backgroundColor: statusBg(c.status) }}>
            {c.status}
          </Badge>
          {/* Severity */}
          <Badge className="font-bold px-1.5 py-px"
            style={{ color: severityColor(c.severity), backgroundColor: severityBg(c.severity) }}>
            {c.severity}
          </Badge>
          {/* Anti-loop flag (D1) */}
          {activity.repeatFlag && (
            <Badge className="gap-1 px-2 py-px"
              style={{ backgroundColor: "rgba(255,176,32,0.12)", color: "var(--color-warning)", border: "1px solid rgba(255,176,32,0.25)" }}>
              <AlertTriangle size={9} />
              {activity.repeatFlag}
            </Badge>
          )}
        </div>
        {/* Scope */}
        <div className="text-right text-[10px] shrink-0">
          <p style={{ color: "var(--color-text-primary)" }}>{c.affectedScope.cellName}</p>
          <p style={{ color: "var(--color-text-muted)" }}>
            {c.affectedScope.siteName} · {c.affectedScope.region}
          </p>
        </div>
      </div>

      {/* Pipeline stage tracker */}
      <div className="px-4 py-2">
        <PipelineTracker
          currentStage={activity.currentStage}
          stages={activity.stages}
          expandedStage={expandedStage}
          onToggleStage={toggleStage}
        />
      </div>

      {/* Proposed action summary (pending cards only) */}
      {isPending && (
        <div className="flex items-center justify-between px-5 py-2.5 gap-3"
          style={{ borderTop: "1px solid var(--color-border)", backgroundColor: "rgba(180,80,0,0.04)" }}>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-widest mb-0.5"
              style={{ color: "var(--color-text-muted)" }}>Proposed action</p>
            <p className="text-xs truncate" style={{ color: "var(--color-text-primary)" }}>
              {c.recommendation.proposedAction
                ?? c.recommendation.actionType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
              {" → "}{c.recommendation.targetTeam}
            </p>
          </div>
          <Link to={`/cxi-cases/${c.caseId}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "var(--mindr-pending)", color: "#fff" }}>
            Review
            <ArrowRight size={11} />
          </Link>
        </div>
      )}

      {/* Expanded stage detail */}
      {expandedStage !== null && activity.stages[expandedStage] && (
        <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--color-border)" }}>
          <StageDetailPanel event={activity.stages[expandedStage]!} stageIdx={expandedStage} />
        </div>
      )}
    </div>
  );
}

// ── Flat event log (secondary A4 view) ────────────────────────────────────────

function FlatEventLog({ activities }: { activities: CaseActivity[] }) {
  return (
    <div className="space-y-6">
      {activities.map((act) => {
        const c = caseMap.get(act.caseId);
        if (!c) return null;
        const events = act.stages
          .map((ev, i) => ev ? { ev, i } : null)
          .filter(Boolean) as { ev: StageEvent; i: number }[];

        return (
          <div key={act.caseId}>
            {/* Case group header */}
            <div className="flex items-center gap-2 mb-2">
              <Link to={`/cxi-cases/${act.caseId}`}
                className="text-xs font-bold hover:underline"
                style={{ color: "var(--color-brand)", fontFamily: "var(--font-mono)" }}>
                {act.caseId}
              </Link>
              <Badge className="font-bold px-1.5 py-px"
                style={{ color: statusColor(c.status), backgroundColor: statusBg(c.status) }}>
                {c.status}
              </Badge>
              <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>
                {c.affectedScope.cellName} · {c.affectedScope.region}
              </span>
            </div>
            {/* Events oldest→newest */}
            <div className="space-y-2 pl-3"
              style={{ borderLeft: "1px solid var(--color-border)" }}>
              {events.map(({ ev, i }) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${AGENT_STAGES[i].color}18`, border: `1px solid ${AGENT_STAGES[i].color}40` }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: AGENT_STAGES[i].color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        {ev.agentName}
                      </span>
                      {ev.showConfidence && ev.confidence !== undefined && (
                        <ConfidenceBadge value={ev.confidence}
                          label={i === 2 ? "RCA" : "Confidence"} />
                      )}
                      <span className="ml-auto text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                        {ev.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{ev.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

type FilterTab = "all" | "awaiting" | "done";

function FilterBar({ active, onChange, counts }: {
  active: FilterTab;
  onChange: (f: FilterTab) => void;
  counts: Record<FilterTab, number>;
}) {
  const opts: { id: FilterTab; label: string }[] = [
    { id: "all",      label: "All" },
    { id: "awaiting", label: "Awaiting" },
    { id: "done",     label: "Done" },
  ];
  return (
    <div className="flex items-center gap-1">
      {opts.map(({ id, label }) => (
        <button key={id} onClick={() => onChange(id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            backgroundColor: active === id ? "rgba(255,255,255,0.06)" : "transparent",
            color: active === id ? "var(--color-text-primary)" : "var(--color-text-muted)",
            border: `1px solid ${active === id ? "var(--color-border)" : "transparent"}`,
          }}>
          {label}
          <span className="text-[9px] font-bold px-1 py-px rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "var(--color-text-muted)" }}>
            {counts[id]}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function S2AgentActivity() {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [viewMode, setViewMode] = useState<"cases" | "log">("cases");
  const [showAllDone, setShowAllDone] = useState(false);

  const activities = useMemo(() => buildActivities(), []);

  const awaitingCount = mockCases.filter((c) => c.status === "pending").length;
  const doneCount     = mockCases.filter((c) => c.status !== "pending").length;
  const totalCount    = mockCases.length;

  const counts: Record<FilterTab, number> = {
    all:      totalCount,
    awaiting: awaitingCount,
    done:     doneCount,
  };

  const pendingActivities = activities.filter((a) => {
    const c = caseMap.get(a.caseId);
    return c?.status === "pending";
  });

  const doneActivities = activities.filter((a) => {
    const c = caseMap.get(a.caseId);
    return c && c.status !== "pending";
  });

  const visibleDone = showAllDone ? doneActivities : doneActivities.slice(0, 5);

  // Activities to show in flat log
  const logActivities = filter === "awaiting"
    ? pendingActivities
    : filter === "done"
      ? doneActivities
      : activities;

  return (
    <div className="flex flex-col overflow-hidden"
      style={{
        margin: "-1rem -1.5rem",
        width: "calc(100% + 3rem)",
        height: "calc(100% + 2rem)",
        backgroundColor: "var(--color-bg-base)",
        fontFamily: "var(--font-ui)",
      }}>

      {/* ── Page header ── */}
      <div className="flex items-center justify-between px-8 py-5 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div>
          <h1 className="text-2xl font-bold leading-none" style={{ color: "var(--color-text-primary)" }}>
            Agent Activity
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Multi-agent pipeline transparency — grouped by case
          </p>
        </div>
        <div className="flex items-center gap-3">
          {awaitingCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: "rgba(180,80,0,0.15)", color: "var(--mindr-pending)", border: "1px solid rgba(180,80,0,0.25)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--mindr-pending)" }} />
              {awaitingCount} awaiting approval
            </span>
          )}
          {/* View toggle */}
          <div className="flex items-center rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--color-border)" }}>
            <button onClick={() => setViewMode("cases")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors"
              style={{
                backgroundColor: viewMode === "cases" ? "var(--color-bg-elevated)" : "transparent",
                color: viewMode === "cases" ? "var(--color-text-primary)" : "var(--color-text-muted)",
              }}>
              <LayoutGrid size={12} />
              Case view
            </button>
            <button onClick={() => setViewMode("log")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors"
              style={{
                backgroundColor: viewMode === "log" ? "var(--color-bg-elevated)" : "transparent",
                color: viewMode === "log" ? "var(--color-text-primary)" : "var(--color-text-muted)",
                borderLeft: "1px solid var(--color-border)",
              }}>
              <List size={12} />
              Event log
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex items-center justify-between px-8 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)" }}>
        <FilterBar active={filter} onChange={setFilter} counts={counts} />
        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          {viewMode === "cases"
            ? `${filter === "awaiting" ? awaitingCount : filter === "done" ? doneCount : totalCount} case${totalCount !== 1 ? "s" : ""}`
            : `${logActivities.length} case${logActivities.length !== 1 ? "s" : ""} · ${logActivities.reduce((n, a) => n + a.stages.filter(Boolean).length, 0)} events`
          }
        </span>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-8 py-5" style={{ scrollbarWidth: "thin" }}>

        {/* ━━━ FLAT EVENT LOG (secondary view A4) ━━━ */}
        {viewMode === "log" && (
          <FlatEventLog activities={logActivities} />
        )}

        {/* ━━━ CASE VIEW (default) ━━━ */}
        {viewMode === "cases" && (
          <div className="space-y-6">

            {/* ── NEEDS YOUR APPROVAL (B1) — always visible unless filter=done ── */}
            {filter !== "done" && pendingActivities.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: "var(--mindr-pending)" }} />
                  <h2 className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "var(--mindr-pending)" }}>
                    Needs Your Approval
                  </h2>
                  <span className="text-[9px] font-bold px-1.5 py-px rounded-full"
                    style={{ backgroundColor: "rgba(180,80,0,0.15)", color: "var(--mindr-pending)" }}>
                    {pendingActivities.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {pendingActivities.map((act, idx) => (
                    <CaseCard key={act.caseId} activity={act} featured={idx === 0} />
                  ))}
                </div>
              </section>
            )}

            {/* ── COMPLETED / ACTIONED cases ── */}
            {filter !== "awaiting" && doneActivities.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "var(--color-text-muted)" }}>
                    Actioned
                  </h2>
                  <span className="text-[9px] font-bold px-1.5 py-px rounded-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)" }}>
                    {doneActivities.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {visibleDone.map((act) => (
                    <CaseCard key={act.caseId} activity={act} />
                  ))}
                </div>
                {!showAllDone && doneActivities.length > 5 && (
                  <button onClick={() => setShowAllDone(true)}
                    className="mt-3 w-full py-2 rounded-xl text-xs font-medium hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                    Show all {doneActivities.length} actioned cases
                  </button>
                )}
                {showAllDone && doneActivities.length > 5 && (
                  <button onClick={() => setShowAllDone(false)}
                    className="mt-3 w-full py-2 rounded-xl text-xs font-medium hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                    Collapse
                  </button>
                )}
              </section>
            )}

            {/* Empty state */}
            {filter === "awaiting" && pendingActivities.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(45,212,191,0.1)" }}>
                  <Check size={20} style={{ color: "var(--color-resolved)" }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  All caught up
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  No cases awaiting approval right now.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
