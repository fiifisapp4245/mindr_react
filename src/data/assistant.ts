import type { Message, Session, UserMsg } from "../types/assistant";

export const INITIAL_SESSIONS: Session[] = [
  {
    id: "eu-west",
    status: "active",
    title: "Analyze EU-West incident",
    preview: "Status check on core router cluster...",
    age: "2m ago",
    messages: [
      {
        kind: "user",
        text: "What's the status of the EU-West core router cluster?",
        time: "10:42 AM",
      },
      {
        kind: "analysis",
        time: "10:42 AM",
        duration: "1.4s",
        rootCause:
          "Internal telemetry identifies a **Sudden traffic surge** originating from CDN edge nodes in the Berlin sector, overwhelming the ingress buffers of the EU-W-01 router group.",
        impact: [
          "Latency increased by 140ms across all Frankfurt-originating requests.",
          "Packet loss peak at 4.2% on interface Gi0/0/1.",
          "Estimated 12,000 users affected by degraded performance.",
        ],
        recommendation:
          "Redistribute load to EU-North secondary cluster and enable aggressive rate limiting on the Berlin edge pool.",
      },
    ],
  },
  {
    id: "perf-summary",
    status: "completed",
    title: "Network performance summary",
    preview: "Monthly throughput report generation...",
    age: "1h ago",
    messages: [
      {
        kind: "user",
        text: "Generate a network performance summary for this month.",
        time: "09:31 AM",
      },
      {
        kind: "text",
        text: "Monthly performance summary generated. Overall system health improved by 2.1% vs last month. MTTR reduced from 22 to 18 minutes. SLA compliance at 99.4%, above the 99.0% Tier-4 target. Full report is available in the Reports section.",
        time: "09:31 AM",
      },
    ],
  },
  {
    id: "bgp-analysis",
    status: "completed",
    title: "BGP Route Analysis",
    preview: "Checking for route flapping in AS-342...",
    age: "Yesterday",
    messages: [
      {
        kind: "user",
        text: "Check for BGP route flapping in AS-342 and downstream peers.",
        time: "Yesterday, 14:18",
      },
      {
        kind: "analysis",
        time: "Yesterday, 14:18",
        duration: "2.1s",
        rootCause:
          "BGP session instability detected on peer **AS-342-PEER-B** due to keepalive timer misconfiguration. 14 route flaps recorded in a 30-minute window.",
        impact: [
          "Transient packet loss on 3 downstream routes during flap events.",
          "Route convergence delay of 4.2s per flap event.",
          "No end-user service interruption — failover paths remained active.",
        ],
        recommendation:
          "Adjust BGP keepalive timer from 30s to 60s on AS-342-PEER-B. Implement BFD for faster failure detection without route instability.",
      },
    ],
  },
];

export function generateResponse(text: string, time: string): Message {
  const q = text.toLowerCase();

  if (q.includes("incident") || q.includes("alert") || q.includes("critical")) {
    return {
      kind: "analysis",
      time,
      duration: "1.8s",
      rootCause:
        "Three active incidents tracked. **INC-8422** (Core Network Overload, EU-West) is the highest priority — CRITICAL severity, 120,450 users affected.",
      impact: [
        "INC-8422: Latency +142% vs baseline, critical threshold breached.",
        "PRE-2019: VoLTE SLA breach predicted within 15 minutes.",
        "INC-8416: CDN cache miss at 94.2%, Auto Resolver mitigating.",
      ],
      recommendation:
        "Prioritize INC-8422 immediately. Auto Resolver is deployed — approve EU-North load redistribution to accelerate recovery and prevent SLA cascade.",
      charts: [
        {
          id: `incident-severity-${time}`,
          title: "Active Incidents by Severity",
          type: "bar",
          data: [
            { severity: "Critical",   count: 1 },
            { severity: "Predicted",  count: 1 },
            { severity: "Mitigating", count: 1 },
          ],
          keys: [{ key: "count", color: "#E91E8C" }],
          xKey: "severity",
          confidence: 91.5,
          timestamp: time,
        },
        {
          id: `incident-trend-${time}`,
          title: "Incident Volume — 7D Trend",
          type: "area",
          data: [
            { day: "Mon", incidents: 3 },
            { day: "Tue", incidents: 5 },
            { day: "Wed", incidents: 7 },
            { day: "Thu", incidents: 9 },
            { day: "Fri", incidents: 5 },
            { day: "Sat", incidents: 4 },
            { day: "Sun", incidents: 3 },
          ],
          keys: [{ key: "incidents", color: "#FF3B3B" }],
          xKey: "day",
          confidence: 88.4,
          timestamp: time,
        },
      ],
    };
  }

  if (q.includes("health") || q.includes("status") || q.includes("summary")) {
    return {
      kind: "analysis",
      time,
      duration: "1.2s",
      rootCause:
        "Overall system health is at **87.2%**, up 0.4% from the previous hour. 3 active incidents are suppressing the score from a 99.4% clean baseline.",
      impact: [
        "EU-West cluster contributing −8.1% to global health score.",
        "LATAM-LINK-DOWN node offline — isolated from routing table.",
        "All other regions nominal — no degradation detected.",
      ],
      recommendation:
        "Resolving INC-8422 alone would recover ~7% of the health score. LATAM link replacement is scheduled for the next maintenance window.",
      charts: [
        {
          id: `health-trend-${time}`,
          title: "System Health Trend (24H)",
          type: "area",
          data: [
            { t: "06:00", health: 72.3, target: 90 },
            { t: "09:00", health: 85.2, target: 90 },
            { t: "12:00", health: 83.0, target: 90 },
            { t: "15:00", health: 80.5, target: 90 },
            { t: "18:00", health: 89.1, target: 90 },
            { t: "21:00", health: 87.5, target: 90 },
            { t: "Now",   health: 87.2, target: 90 },
          ],
          keys: [
            { key: "health", color: "#E91E8C" },
            { key: "target", color: "rgba(255,255,255,0.25)" },
          ],
          xKey: "t",
          confidence: 94.2,
          timestamp: time,
        },
        {
          id: `health-region-${time}`,
          title: "Health Score by Region",
          type: "bar",
          data: [
            { region: "EU-W",  health: 79 },
            { region: "US-E",  health: 94 },
            { region: "APAC",  health: 88 },
            { region: "LATAM", health: 0  },
          ],
          keys: [{ key: "health", color: "#E91E8C" }],
          xKey: "region",
          confidence: 94.2,
          timestamp: time,
        },
      ],
    };
  }

  if (q.includes("agent") || q.includes("runtime")) {
    return {
      kind: "analysis",
      time,
      duration: "0.9s",
      rootCause:
        "**5 of 6 agents** are currently active. VERIFY-GAMMA is running at 91% capacity — approaching overload threshold.",
      impact: [
        "RELAY-OMEGA idle at 12% — available for task offloading.",
        "Orchestrator confidence at 99.9% — primary coordinator stable.",
        "No agent failures recorded in the last 24 hours.",
      ],
      recommendation:
        "Recommend reassigning 30% of VERIFY-GAMMA load to RELAY-OMEGA. Monitor SCAN-ALPHA at 82% — second candidate for load balancing.",
      charts: [
        {
          id: `agent-load-${time}`,
          title: "Agent Load Distribution",
          type: "bar",
          data: [
            { agent: "SCAN-α",   load: 82 },
            { agent: "FIX-δ",    load: 45 },
            { agent: "VFY-γ",    load: 91 },
            { agent: "RLY-ω",    load: 12 },
            { agent: "ORCH",     load: 67 },
            { agent: "GUARD",    load: 55 },
          ],
          keys: [{ key: "load", color: "#E91E8C" }],
          xKey: "agent",
          confidence: 99.9,
          timestamp: time,
        },
        {
          id: `agent-latency-${time}`,
          title: "Global Latency Trend (6H)",
          type: "area",
          data: [
            { t: "12:00", ms: 18 },
            { t: "13:00", ms: 25 },
            { t: "14:00", ms: 32 },
            { t: "15:00", ms: 40 },
            { t: "16:00", ms: 28 },
            { t: "17:00", ms: 18 },
          ],
          keys: [{ key: "ms", color: "#4D9EFF" }],
          xKey: "t",
          confidence: 99.9,
          timestamp: time,
        },
      ],
    };
  }

  if (q.includes("topology") || q.includes("node") || q.includes("router")) {
    return {
      kind: "text",
      text: "Network topology: 5 nodes active. EU-CORE-01 is the central hub with 3 healthy connections and 1 active incident (INC-8422). LATAM-LINK-DOWN is offline (INC-8421). EDGE-NYC-02 shows elevated latency (WARNING). CDN-WEST and DC-ALPHA fully operational.",
      time,
    };
  }

  return {
    kind: "text",
    text: `MINDR has received your query. Current network state: 3 active incidents, system health at 87.2%, 5/6 agents running. Use specific queries like "analyze current incidents", "show network health summary", or "check agent runtime" for detailed diagnostics.`,
    time,
  };
}

export function nowTime(): string {
  const d  = new Date();
  const h  = d.getHours() % 12 || 12;
  const m  = d.getMinutes().toString().padStart(2, "0");
  const ap = d.getHours() >= 12 ? "PM" : "AM";
  return `${h}:${m} ${ap}`;
}

// Needed for use-assistant.ts
export { type UserMsg };
