import type { UserRole } from "../contexts/auth";

const ROLE_ROUTES: Record<string, string> = {
  flm:   "/flm-dashboard",
  cxi:   "/cxi-cases",
  slm:   "/overview",
  noc:   "/overview",
  exec:  "/overview",
  admin: "/overview",
};

const DEFAULT_ROUTE = "/overview";

export function getRouteForRole(role: UserRole | null): string {
  if (!role) return DEFAULT_ROUTE;
  return ROLE_ROUTES[role] ?? DEFAULT_ROUTE;
}
