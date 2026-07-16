import { useNavigate, useSearchParams } from "react-router-dom";
import { DOMAIN_META_ROWS, SEV_CFG } from "../data/network-model-data";
import { Badge } from "../components/ui/badge";
import { AlertProposalGraph } from "../components/network-model/AlertProposalGraph";

export default function NetworkModelList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const alertId = searchParams.get("alert");

  // Deep-linked from an Alert Detail page's "Send Proposal" button — renders
  // the alert-scoped subgraph/proposal view instead of the domain list.
  if (alertId) {
    return <AlertProposalGraph alertId={alertId} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
          Knowledge Graph
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          Knowledge graphs and domain-scoped conversation for each operational domain
        </p>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
        {/* Column headers */}
        <div
          className="grid px-5 py-2.5 text-[10px] font-semibold uppercase tracking-widest"
          style={{
            gridTemplateColumns: "8px 1fr 100px 1fr 80px 100px",
            gap:             16,
            borderBottom:    "1px solid var(--color-border)",
            backgroundColor: "var(--color-bg-card)",
            color:           "var(--color-text-muted)",
          }}
        >
          <div />
          <div>Scenario</div>
          <div>Severity</div>
          <div>Description</div>
          <div>Cases</div>
          <div>Last updated</div>
        </div>

        {/* Domain rows */}
        {DOMAIN_META_ROWS.map((row, i) => {
          const sev = SEV_CFG[row.severity];
          return (
            <button
              key={row.domainId}
              onClick={() => navigate(`/network-model/${row.domainId}`)}
              className="w-full grid px-5 py-4 text-left hover:bg-white/[0.025] transition-colors items-center"
              style={{
                gridTemplateColumns: "8px 1fr 100px 1fr 80px 100px",
                gap:             16,
                borderTop:       i > 0 ? "1px solid var(--color-border)" : "none",
                backgroundColor: "var(--color-bg-card)",
              }}
            >
              {/* Status dot */}
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: sev.color }}
              />

              {/* Name */}
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {row.label}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {row.fullLabel}
                </p>
              </div>

              {/* Severity pill */}
              <div style={{ display: "inline-flex", alignSelf: "start", marginTop: 2 }}>
                <Badge
                  className="text-[10px] font-bold whitespace-nowrap"
                  style={{ color: sev.color, backgroundColor: sev.bg }}
                >
                  {row.severity}
                </Badge>
              </div>

              {/* Description */}
              <p className="text-[12px] leading-snug" style={{ color: "var(--color-text-muted)" }}>
                {row.description}
              </p>

              {/* Active cases */}
              <p className="text-sm font-semibold tabular-nums" style={{ color: "var(--color-text-primary)" }}>
                {row.activeCases}
              </p>

              {/* Last updated */}
              <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                {row.lastUpdated}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
