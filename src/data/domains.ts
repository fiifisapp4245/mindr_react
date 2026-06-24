// ── Domain config ─────────────────────────────────────────────────────────────
// Single source of truth for display labels. Internal scenario IDs (s1/s2/s3)
// must never appear in the UI — use domain labels exclusively in new components.

export type DomainId = "all" | "ip-core" | "cxi" | "volte";

export interface DomainConfig {
  label: string;
  scenarioId: string;
  defaultRoute: string;
  color: string;
  assignedRoles: string[];
}

export const DOMAINS: Record<Exclude<DomainId, "all">, DomainConfig> = {
  "ip-core": {
    label: "IP Core",
    scenarioId: "s1",
    defaultRoute: "/flm-dashboard",
    color: "#E9187C",
    assignedRoles: ["flm", "admin"],
  },
  "cxi": {
    label: "CXI",
    scenarioId: "s2",
    defaultRoute: "/cxi-cases",
    color: "#FFB020",
    assignedRoles: ["cxi", "admin"],
  },
  "volte": {
    label: "Volte",
    scenarioId: "s3",
    defaultRoute: "/volte/dashboard",
    color: "#2DD4BF",
    assignedRoles: ["admin"],
  },
};

// When true, non-assigned domains are greyed out in the selector.
export const RESTRICT_DRILLDOWN_BY_ASSIGNMENT = false;

export function canAccessDomain(domainId: Exclude<DomainId, "all">, role: string | null): boolean {
  if (!RESTRICT_DRILLDOWN_BY_ASSIGNMENT) return true;
  if (!role) return false;
  return DOMAINS[domainId].assignedRoles.includes(role);
}
