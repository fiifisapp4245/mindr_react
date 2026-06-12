import type { UserRole } from "../contexts/auth";

const ROLE_ROUTES: Record<string, string> = {
  flm:   "/flm-dashboard",
  cxi:   "/cxi-cases",
  slm:   "/dashboard",
  noc:   "/dashboard",
  exec:  "/dashboard",
  admin: "/dashboard",
};

const DEFAULT_ROUTE = "/dashboard";

export function getRouteForRole(role: UserRole | null): string {
  if (!role) return DEFAULT_ROUTE;
  return ROLE_ROUTES[role] ?? DEFAULT_ROUTE;
}
