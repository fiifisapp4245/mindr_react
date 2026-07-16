import { useMemo } from "react";
import { sankey, sankeyLinkHorizontal, type SankeyNodeMinimal, type SankeyLinkMinimal } from "d3-sankey";
import { RotateCcw } from "lucide-react";
import {
  STAGES,
  type StageKey,
  type FlowFilters,
  type SankeyAgg,
  stageEntityOptions,
} from "../../../data/flow-analytics-data";
import { FlowMultiSelect } from "./FlowMultiSelect";

const STAGE_INDEX: Record<StageKey, number> = {
  sourceAS: 0, handoverAS: 1, ingressRouter: 2, egressRouter: 3, nexthopAS: 4, destinationAS: 5,
};

const STAGE_COLOR: Record<StageKey, string> = {
  sourceAS: "#4D9EFF",
  handoverAS: "#2DD4BF",
  ingressRouter: "#FFB020",
  egressRouter: "#E9187C",
  nexthopAS: "#9B59B6",
  destinationAS: "#FF3B3B",
};

const MAJOR_SHARE_THRESHOLD = 0.08; // show a [%] badge on nodes above this share of their column

interface NodeDatum { key: string; stage: StageKey; label: string; value: number; }
interface LinkDatum { source: string; target: string; value: number; }

type SNode = SankeyNodeMinimal<NodeDatum, LinkDatum> & NodeDatum;
type SLink = SankeyLinkMinimal<NodeDatum, LinkDatum> & LinkDatum;

const WIDTH = 1180;
const HEIGHT = 480;

function formatBps(bps: number): string {
  if (bps >= 1e9) return `${(bps / 1e9).toFixed(1)} Gbps`;
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(1)} Mbps`;
  return `${Math.round(bps)} bps`;
}

interface Props {
  agg: SankeyAgg;
  draftFilters: FlowFilters;
  onDraftFilterChange: (stage: StageKey, next: Set<string>) => void;
  onDateChange: (field: "beginDate" | "endDate", value: string) => void;
  onApply: () => void;
  onClear: () => void;
  onNodeClick: (stage: StageKey, label: string) => void;
  appliedCount: number;
}

export function FlowSankeyDiagram({
  agg, draftFilters, onDraftFilterChange, onDateChange, onApply, onClear, onNodeClick, appliedCount,
}: Props) {
  const layout = useMemo(() => {
    if (agg.nodes.length === 0) return null;

    const columnTotals = new Map<StageKey, number>();
    for (const n of agg.nodes) columnTotals.set(n.stage, (columnTotals.get(n.stage) ?? 0) + n.value);

    const generator = sankey<NodeDatum, LinkDatum>()
      .nodeId((d) => d.key)
      .nodeAlign((d) => STAGE_INDEX[(d as SNode).stage])
      .nodeWidth(16)
      .nodePadding(6)
      .extent([[1, 30], [WIDTH - 1, HEIGHT - 1]]);

    const graph = generator({
      nodes: agg.nodes.map((n) => ({ ...n })),
      links: agg.links.map((l) => ({ ...l })),
    });

    return { graph, columnTotals };
  }, [agg]);

  const linkPath = sankeyLinkHorizontal<NodeDatum, LinkDatum>();

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
      {/* Header row: 6 column filters + date range + apply/clear */}
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div className="grid grid-cols-6 gap-2" style={{ flex: 1, minWidth: 560 }}>
          {STAGES.map((s) => (
            <FlowMultiSelect
              key={s.key}
              label={s.label}
              options={stageEntityOptions(s.key)}
              selected={draftFilters[s.key]}
              onChange={(next) => onDraftFilterChange(s.key, next)}
            />
          ))}
        </div>

        <div className="flex items-end gap-2 shrink-0">
          <div>
            <label className="block text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>Begin</label>
            <input
              type="date"
              value={draftFilters.beginDate}
              onChange={(e) => onDateChange("beginDate", e.target.value)}
              className="px-2 py-1.5 rounded-lg text-[11px]"
              style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
            />
          </div>
          <div>
            <label className="block text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>End</label>
            <input
              type="date"
              value={draftFilters.endDate}
              onChange={(e) => onDateChange("endDate", e.target.value)}
              className="px-2 py-1.5 rounded-lg text-[11px]"
              style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
            />
          </div>
          <button
            onClick={onApply}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
          >
            Apply filters
          </button>
          <button
            onClick={onClear}
            title="Clear all filters"
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      <p className="text-[11px] mb-2" style={{ color: "var(--color-text-muted)" }}>
        {appliedCount > 0 ? `${appliedCount} filter${appliedCount !== 1 ? "s" : ""} applied` : "No filters applied — showing all flows"}
      </p>

      {/* Column labels */}
      <div className="grid grid-cols-6 mb-1">
        {STAGES.map((s) => (
          <p key={s.key} className="text-[10px] font-semibold uppercase tracking-widest text-center" style={{ color: "var(--color-text-muted)" }}>
            {s.label}
          </p>
        ))}
      </div>

      {/* Sankey SVG */}
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: "100%", height: "auto", minWidth: 900 }}>
          {layout && (
            <>
              <g>
                {layout.graph.links.map((link, i) => {
                  const source = link.source as unknown as SNode;
                  const color = STAGE_COLOR[source.stage];
                  return (
                    <path
                      key={i}
                      d={linkPath(link) ?? undefined}
                      fill="none"
                      stroke={color}
                      strokeOpacity={0.28}
                      strokeWidth={Math.max(1, link.width ?? 1)}
                    />
                  );
                })}
              </g>
              <g>
                {layout.graph.nodes.map((node) => {
                  const n = node as SNode;
                  const color = STAGE_COLOR[n.stage];
                  const columnTotal = layout.columnTotals.get(n.stage) ?? 1;
                  const share = n.value! / columnTotal;
                  const x0 = n.x0 ?? 0, x1 = n.x1 ?? 0, y0 = n.y0 ?? 0, y1 = n.y1 ?? 0;
                  const isLeftHalf = STAGE_INDEX[n.stage] < 3;
                  return (
                    <g key={n.key} onClick={() => onNodeClick(n.stage, n.label)} style={{ cursor: "pointer" }}>
                      <rect x={x0} y={y0} width={x1 - x0} height={Math.max(1, y1 - y0)} fill={color} fillOpacity={0.85} rx={2} />
                      <title>{`${n.label} — ${formatBps(n.value ?? 0)} (${(share * 100).toFixed(1)}%)`}</title>
                      <text
                        x={isLeftHalf ? x0 - 6 : x1 + 6}
                        y={(y0 + y1) / 2}
                        dy="0.32em"
                        textAnchor={isLeftHalf ? "end" : "start"}
                        fontSize={10}
                        fill="var(--color-text-primary)"
                      >
                        {n.label}
                        {share >= MAJOR_SHARE_THRESHOLD ? ` [${Math.round(share * 100)}%]` : ""}
                      </text>
                    </g>
                  );
                })}
              </g>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
