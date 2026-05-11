import { motion } from "framer-motion";
import { transFast } from "../../lib/animations";
import type { LiveMetric, MetricSeverity } from "../../types/incident";

const METRIC_BAR: Record<MetricSeverity, string> = {
  critical: "var(--color-critical)",
  warning:  "var(--color-warning)",
  info:     "var(--color-mitigating)",
};

export function MetricCard({ metric }: { metric: LiveMetric }) {
  const barColor = METRIC_BAR[metric.severity];
  const Icon     = metric.icon;

  return (
    <motion.div
      whileHover={{
        scale: 1.025,
        borderColor: barColor,
        transition: transFast,
      }}
      className="rounded-lg flex flex-col overflow-hidden cursor-default"
      style={{
        backgroundColor: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between">
          <p
            className="text-[10px] font-medium uppercase tracking-widest leading-snug"
            style={{ color: "var(--color-text-muted)" }}
          >
            {metric.label}
          </p>
          <Icon size={13} className="shrink-0" style={{ color: barColor }} />
        </div>
        <motion.p
          className="text-2xl font-bold tabular-nums leading-none"
          whileHover={{ color: barColor }}
          transition={transFast}
          style={{ color: "var(--color-text-primary)" }}
        >
          {metric.value}
          <span className="text-base font-semibold ml-1">{metric.unit}</span>
        </motion.p>
        <p className="text-[10px]" style={{ color: barColor }}>{metric.sub}</p>
      </div>
      <div style={{ height: 2, backgroundColor: barColor }} />
    </motion.div>
  );
}
