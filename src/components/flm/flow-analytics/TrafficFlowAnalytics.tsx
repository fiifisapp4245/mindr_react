import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Maximize2 } from "lucide-react";
import {
  STAGES,
  type StageKey,
  type FlowFilters,
  emptyFilters,
  filterRecords,
  buildSankeyAgg,
  buildTableRows,
} from "../../../data/flow-analytics-data";
import { FlowSankeyDiagram } from "./FlowSankeyDiagram";
import { FlowTimeSeries } from "./FlowTimeSeries";
import { FlowTable } from "./FlowTable";

// MOCK DATA — the flow + SNMP datasets backing this component are synthetic
// (src/data/flow-analytics-data.ts), pending real flow-data integration from
// stakeholders. All filtering/aggregation logic is real; only the underlying
// records are generated.

interface Props {
  fullPage?: boolean;
}

export function TrafficFlowAnalytics({ fullPage = false }: Props) {
  const navigate = useNavigate();

  const [draftFilters, setDraftFilters] = useState<FlowFilters>(() => emptyFilters());
  const [appliedFilters, setAppliedFilters] = useState<FlowFilters>(() => emptyFilters());
  const [breakdownStage, setBreakdownStage] = useState<StageKey>("sourceAS");
  const [selectedTableKeys, setSelectedTableKeys] = useState<Set<string>>(new Set());

  const filteredRecords = useMemo(() => filterRecords(appliedFilters), [appliedFilters]);
  const sankeyAgg = useMemo(() => buildSankeyAgg(filteredRecords), [filteredRecords]);
  const tableRows = useMemo(() => buildTableRows(filteredRecords, breakdownStage), [filteredRecords, breakdownStage]);
  const appliedCount = useMemo(() => STAGES.filter((s) => appliedFilters[s.key].size > 0).length, [appliedFilters]);

  // Cross-link 1: Apply commits every column's draft selection + date range at once.
  function handleDraftFilterChange(stage: StageKey, next: Set<string>) {
    setDraftFilters((prev) => ({ ...prev, [stage]: next }));
  }

  // Cross-link 3: Begin/End date range is part of the same applied filter state.
  function handleDateChange(field: "beginDate" | "endDate", value: string) {
    setDraftFilters((prev) => ({ ...prev, [field]: value }));
  }

  function handleApply() {
    setAppliedFilters(draftFilters);
    setSelectedTableKeys(new Set());
  }

  function handleClear() {
    const next = emptyFilters();
    setDraftFilters(next);
    setAppliedFilters(next);
    setSelectedTableKeys(new Set());
  }

  // Cross-link 2: clicking a Sankey node drills every component down to it.
  function handleNodeClick(stage: StageKey, label: string) {
    const next: FlowFilters = { ...emptyFilters(), beginDate: appliedFilters.beginDate, endDate: appliedFilters.endDate };
    next[stage] = new Set([label]);
    setAppliedFilters(next);
    setDraftFilters(next);
    setSelectedTableKeys(new Set());
  }

  // Cross-link 4: the stage tabs also drive which dimension the table breaks down by,
  // keeping the time-series and table always looking at the same dimension.
  function handleBreakdownStageChange(stage: StageKey) {
    setBreakdownStage(stage);
    setSelectedTableKeys(new Set());
  }

  // Cross-link 5: selecting table rows narrows/highlights the Sankey + time-series
  // to those specific entities (same underlying filter mechanism as cross-link 2).
  function handleToggleTableRow(key: string) {
    const next = new Set(selectedTableKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedTableKeys(next);

    const labels = new Set(Array.from(next).map((k) => k.slice(k.indexOf("::") + 2)));
    setAppliedFilters((prev) => ({ ...prev, [breakdownStage]: labels }));
    setDraftFilters((prev) => ({ ...prev, [breakdownStage]: labels }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>Traffic Flow Analytics</h2>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            BENOCS-style flow analysis, 01–06 Nov — mock data, pending real flow-data integration from stakeholders
          </p>
        </div>
        {!fullPage && (
          <button
            onClick={() => navigate("/flow-analytics")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold shrink-0 transition-colors hover:bg-white/5"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          >
            <Maximize2 size={12} />
            Open in full view
          </button>
        )}
      </div>

      <FlowSankeyDiagram
        agg={sankeyAgg}
        draftFilters={draftFilters}
        onDraftFilterChange={handleDraftFilterChange}
        onDateChange={handleDateChange}
        onApply={handleApply}
        onClear={handleClear}
        onNodeClick={handleNodeClick}
        appliedCount={appliedCount}
      />

      <FlowTimeSeries
        records={filteredRecords}
        filters={appliedFilters}
        breakdownStage={breakdownStage}
        onBreakdownStageChange={handleBreakdownStageChange}
      />

      <FlowTable
        rows={tableRows}
        stage={breakdownStage}
        selectedKeys={selectedTableKeys}
        onToggleRow={handleToggleTableRow}
      />
    </div>
  );
}
