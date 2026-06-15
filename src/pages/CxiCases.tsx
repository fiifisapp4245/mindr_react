import { useState, useMemo, useEffect } from "react";
import { Search, X } from "lucide-react";
import { mockCases } from "../data/cxi-cases";
import { StatsBar } from "../components/cxi/StatsBar";
import { CaseRow } from "../components/cxi/CaseRow";
import type { CaseStatus } from "../types/cxi";

type FilterTab = CaseStatus | "all";

const TAB_ORDER: FilterTab[] = ["all", "pending", "approved", "rejected", "escalated", "corrected"];

const TAB_LABEL: Record<FilterTab, string> = {
  all:       "All",
  pending:   "Pending",
  approved:  "Approved",
  rejected:  "Rejected",
  escalated: "Escalated",
  corrected: "Corrected",
};

const TAB_COLOR: Partial<Record<FilterTab, string>> = {
  pending:   "var(--mindr-pending)",
  approved:  "var(--mindr-approved)",
  rejected:  "var(--mindr-rejected)",
  escalated: "var(--mindr-escalated)",
  corrected: "var(--mindr-corrected)",
};

function SkeletonRow() {
  return (
    <div
      className="flex items-center gap-4 px-5 py-3.5 animate-pulse"
      style={{ borderBottom: "1px solid var(--color-border)" }}
    >
      <div className="w-40 h-3 rounded" style={{ backgroundColor: "var(--color-bg-elevated)" }} />
      <div className="w-16 h-4 rounded-full" style={{ backgroundColor: "var(--color-bg-elevated)" }} />
      <div className="w-8 h-4 rounded-md" style={{ backgroundColor: "var(--color-bg-elevated)" }} />
      <div className="w-24 h-4 rounded-md" style={{ backgroundColor: "var(--color-bg-elevated)" }} />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 rounded w-3/4" style={{ backgroundColor: "var(--color-bg-elevated)" }} />
        <div className="h-2.5 rounded w-1/2" style={{ backgroundColor: "var(--color-bg-elevated)" }} />
      </div>
      <div className="w-20 h-3 rounded" style={{ backgroundColor: "var(--color-bg-elevated)" }} />
      <div className="w-16 h-3 rounded" style={{ backgroundColor: "var(--color-bg-elevated)" }} />
      <div className="w-36 h-3 rounded" style={{ backgroundColor: "var(--color-bg-elevated)" }} />
      <div className="w-16 h-3 rounded" style={{ backgroundColor: "var(--color-bg-elevated)" }} />
    </div>
  );
}

export default function CxiCases() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      // Simulate a 1-in-20 chance of error for demo purposes
      if (Math.random() < 0.05) {
        setError("Failed to load cases. Please try again.");
      }
      setLoading(false);
    }, 550);
    return () => clearTimeout(t);
  }, []);

  const counts = useMemo(() => {
    const c: Record<FilterTab, number> = { all: mockCases.length, pending: 0, approved: 0, rejected: 0, escalated: 0, corrected: 0 };
    mockCases.forEach((mc) => { c[mc.status] += 1; });
    return c;
  }, []);

  const filtered = useMemo(() => {
    let list = activeTab === "all" ? mockCases : mockCases.filter((c) => c.status === activeTab);
    if (search.trim().length > 1) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.caseId.toLowerCase().includes(q) ||
          c.affectedScope.cellName.toLowerCase().includes(q) ||
          c.affectedScope.siteName.toLowerCase().includes(q) ||
          c.affectedScope.region.toLowerCase().includes(q) ||
          c.classification.toLowerCase().includes(q) ||
          c.assignedAgent.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTab, search]);

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-base)" }}
    >
      <div className="flex-1 overflow-y-auto px-8 py-6">

        {/* ── Page header ── */}
        <div className="mb-6">
          <div>
            <h1
              className="text-2xl font-bold leading-none"
              style={{ color: "var(--color-text-primary)" }}
            >
              CXI Degradation Cases
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              MINDR-generated cases awaiting reviewer action
            </p>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <StatsBar cases={mockCases} />

        {/* ── Filter tabs + search ── */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-1">
            {TAB_ORDER.map((tab) => {
              const isActive = activeTab === tab;
              const underlineColor = TAB_COLOR[tab] ?? "var(--color-brand)";
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs transition-colors"
                  style={{
                    backgroundColor: "transparent",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive
                      ? TAB_COLOR[tab] ?? "var(--color-text-primary)"
                      : "var(--color-text-muted)",
                    borderBottom: isActive
                      ? `2px solid ${underlineColor}`
                      : "2px solid transparent",
                    borderRadius: 0,
                  }}
                >
                  {TAB_LABEL[tab]}
                  <span
                    className="text-[9px] font-bold px-1 py-px rounded-full leading-none"
                    style={{
                      backgroundColor: isActive
                        ? TAB_COLOR[tab]
                          ? `${TAB_COLOR[tab]}25`
                          : "rgba(255,255,255,0.1)"
                        : "var(--color-bg-elevated)",
                      color: isActive
                        ? TAB_COLOR[tab] ?? "var(--color-text-primary)"
                        : "var(--color-text-muted)",
                    }}
                  >
                    {counts[tab]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              width: 240,
            }}
          >
            <Search size={13} style={{ color: "var(--color-text-muted)" }} />
            <input
              type="text"
              placeholder="Search cases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-xs"
              style={{ color: "var(--color-text-primary)" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ color: "var(--color-text-muted)" }}>
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* ── Case list ── */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          {/* Column headers */}
          <div
            className="flex items-center gap-4 px-5 py-2"
            style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-elevated)" }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest w-36" style={{ color: "var(--color-text-muted)" }}>Case ID</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest w-20" style={{ color: "var(--color-text-muted)" }}>Status</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest w-8"  style={{ color: "var(--color-text-muted)" }}>Sev</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest w-20" style={{ color: "var(--color-text-muted)" }}>Type</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest flex-1" style={{ color: "var(--color-text-muted)" }}>Scope · Trigger · Signals</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest w-36 text-right" style={{ color: "var(--color-text-muted)" }}>CXI Score</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest w-14 text-right" style={{ color: "var(--color-text-muted)" }}>Open</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest w-24" style={{ color: "var(--color-text-muted)" }}>Pipeline</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest w-24" style={{ color: "var(--color-text-muted)" }}>Rec.</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest w-14 text-right" style={{ color: "var(--color-text-muted)" }}>Age</span>
            <span className="w-5" />
          </div>

          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          ) : error ? (
            <div className="px-5 py-16 text-center">
              <p className="text-sm font-medium" style={{ color: "var(--color-critical)" }}>{error}</p>
              <button
                onClick={() => { setError(null); setLoading(true); setTimeout(() => setLoading(false), 550); }}
                className="mt-3 text-xs px-4 py-1.5 rounded-lg"
                style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {search ? `No cases match "${search}"` : "No cases in this category."}
              </p>
            </div>
          ) : (
            filtered.map((c) => <CaseRow key={c.caseId} c={c} />)
          )}
        </div>

        {!loading && !error && (
          <p className="mt-3 text-xs text-right" style={{ color: "var(--color-text-muted)" }}>
            Showing {filtered.length} of {mockCases.length} cases
          </p>
        )}
      </div>
    </div>
  );
}
