import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { type FlowTableRow, type StageKey, asnForEntity } from "../../../data/flow-analytics-data";

type SortKey = "average" | "max" | "p95" | "total";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "average", label: "Flow Average" },
  { key: "max",     label: "Flow Max" },
  { key: "p95",     label: "Flow 95th" },
  { key: "total",   label: "Flow Total" },
];

function formatBps(bps: number): string {
  if (bps >= 1e9) return `${(bps / 1e9).toFixed(2)} Gbps`;
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(1)} Mbps`;
  return `${Math.round(bps)} bps`;
}

interface Props {
  rows: FlowTableRow[];
  stage: StageKey;
  selectedKeys: Set<string>;
  onToggleRow: (key: string) => void;
}

export function FlowTable({ rows, stage, selectedKeys, onToggleRow }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => (sortDir === "asc" ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]));
    return copy;
  }, [rows, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              <th className="px-3 py-2.5 w-8" />
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>AS</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Name</th>
              {COLUMNS.map((c) => {
                const active = sortKey === c.key;
                return (
                  <th
                    key={c.key}
                    onClick={() => handleSort(c.key)}
                    className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest cursor-pointer select-none hover:opacity-80"
                    style={{ color: active ? "var(--color-brand)" : "var(--color-text-muted)" }}
                  >
                    <span className="inline-flex items-center gap-1 justify-end">
                      {c.label}
                      {active && (sortDir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                  No flows match the current filters
                </td>
              </tr>
            ) : (
              sorted.map((row) => {
                const asn = asnForEntity(stage, row.label);
                const checked = selectedKeys.has(row.key);
                return (
                  <tr
                    key={row.key}
                    onClick={() => onToggleRow(row.key)}
                    className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                    style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: checked ? "rgba(233,24,124,0.06)" : undefined }}
                  >
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={checked} onChange={() => onToggleRow(row.key)} onClick={(e) => e.stopPropagation()} />
                    </td>
                    <td className="px-3 py-2 font-mono" style={{ color: "var(--color-text-muted)" }}>{asn ?? "—"}</td>
                    <td className="px-3 py-2" style={{ color: "var(--color-text-primary)" }}>{row.label}</td>
                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--color-text-primary)" }}>{formatBps(row.average)}</td>
                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--color-text-primary)" }}>{formatBps(row.max)}</td>
                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--color-text-primary)" }}>{formatBps(row.p95)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold" style={{ color: "var(--color-text-primary)" }}>{formatBps(row.total)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
