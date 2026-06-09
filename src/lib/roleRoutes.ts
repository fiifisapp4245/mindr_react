import type { UserRole } from "../contexts/auth";

const ROLE_ROUTES: Record<string, string> = {
  flm:   "/flm-dashboard",
  slm:   "/dashboard", // update when SLM dashboard route is defined
  noc:   "/dashboard", // update when NOC dashboard route is defined
  exec:  "/dashboard", // update when Exec dashboard route is defined
  admin: "/dashboard",
};

const DEFAULT_ROUTE = "/dashboard";

export function getRouteForRole(role: UserRole | null): string {
  if (!role) return DEFAULT_ROUTE;
  return ROLE_ROUTES[role] ?? DEFAULT_ROUTE;
}
