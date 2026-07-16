import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { TrafficFlowAnalytics } from "../components/flm/flow-analytics/TrafficFlowAnalytics";

export default function FlowAnalyticsPage() {
  return (
    <div className="space-y-4">
      <Link
        to="/flm-dashboard"
        className="inline-flex items-center gap-1 text-xs font-medium hover:opacity-80"
        style={{ color: "var(--color-text-muted)" }}
      >
        <ChevronLeft size={13} />
        Back to Dashboard
      </Link>
      <TrafficFlowAnalytics fullPage />
    </div>
  );
}
