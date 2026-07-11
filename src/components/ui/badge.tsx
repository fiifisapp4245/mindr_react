import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // w-fit: badges are often placed directly as CSS Grid items (e.g. table
  // columns); grid blockifies + stretches direct children by default, which
  // would otherwise stretch the pill to the full column width instead of
  // hugging its text.
  "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:     "border-transparent bg-primary text-primary-foreground",
        secondary:   "border-transparent bg-secondary text-secondary-foreground",
        outline:     "text-foreground border border-border",
        // Semantic status/severity variants — colors match this app's existing
        // dark-theme tokens (src/index.css), reused across Alerts/Reports tables.
        destructive: "border-transparent",
        warning:     "border-transparent",
        info:        "border-transparent",
        success:     "border-transparent",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const VARIANT_STYLE: Partial<Record<NonNullable<VariantProps<typeof badgeVariants>["variant"]>, React.CSSProperties>> = {
  destructive: { backgroundColor: "rgba(255,59,59,0.12)",  color: "var(--color-critical)"    },
  warning:     { backgroundColor: "rgba(255,176,32,0.12)", color: "var(--color-warning)"      },
  info:        { backgroundColor: "rgba(77,158,255,0.12)", color: "var(--color-mitigating)"   },
  success:     { backgroundColor: "rgba(34,197,94,0.12)",  color: "#22c55e"                   },
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, style, ...props }: BadgeProps) {
  const variantStyle = variant ? VARIANT_STYLE[variant] : undefined;
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      style={{ ...variantStyle, ...style }}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
