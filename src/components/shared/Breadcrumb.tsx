import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  badge?: { text: string; color: string; bg: string };
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs flex-wrap">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight size={11} style={{ color: "var(--color-border)", flexShrink: 0, opacity: 0.7 }} />}

            {item.badge ? (
              <span
                className="text-[10px] font-semibold px-1.5 py-px rounded uppercase tracking-wide shrink-0"
                style={{ color: item.badge.color, backgroundColor: item.badge.bg }}
              >
                {item.badge.text}
              </span>
            ) : item.href && !isLast ? (
              <Link
                to={item.href}
                className="font-medium hover:opacity-80 transition-opacity shrink-0"
                style={{ color: "var(--color-text-muted)" }}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="font-medium truncate max-w-[200px]"
                style={{ color: isLast ? "var(--color-text-primary)" : "var(--color-text-muted)" }}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
