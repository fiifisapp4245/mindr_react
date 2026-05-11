import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function loadColor(pct: number): string {
  if (pct > 90) return "var(--color-critical)";
  if (pct > 70) return "var(--color-warning)";
  return "var(--color-resolved)";
}
