import { useMemo, useState } from "react";
import { Clock, Download, Search, X } from "lucide-react";
import {
  SHIFT_INCIDENTS, SHIFT_WINDOW,
  type ShiftIncident, type ShiftIncidentStatus, type ShiftIncidentSeverity,
} from "../data/flm-reports";
import { DetailModal } from "../components/shared/DetailModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Badge, type BadgeProps } from "../components/ui/badge";

const STATUS_VARIANT: Record<ShiftIncidentStatus, NonNullable<BadgeProps["variant"]>> = {
  Resolved:  "success",
  Escalated: "info",
};

const SEVERITY_VARIANT: Record<ShiftIncidentSeverity, NonNullable<BadgeProps["variant"]>> = {
  Critical: "destructive",
  High:     "warning",
  Medium:   "info",
};

interface Filters {
  status:   ShiftIncidentStatus | "all";
  severity: ShiftIncidentSeverity | "all";
  query:    string;
  from:     string; // "HH:MM" or ""
  to:       string; // "HH:MM" or ""
}

const EMPTY_FILTERS: Filters = { status: "all", severity: "all", query: "", from: "", to: "" };

function FilterSelect<T extends string>({ value, onChange, options }: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  const isActive = value !== "all";
  return (
    <Select value={value} onValueChange={v => onChange(v as T)}>
      <SelectTrigger
        className="w-auto min-w-[9rem]"
        style={{
          backgroundColor: isActive ? "rgba(233,24,124,0.10)" : undefined,
          color:            isActive ? "var(--color-brand)"    : undefined,
          borderColor:      isActive ? "var(--color-brand)"    : undefined,
        }}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

/** Custom hour/minute picker — replaces the native <input type="time"> so it renders
 *  via the same Radix popover system as the Select filters, instead of OS chrome. */
function TimePickerField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [hour, minute] = value ? value.split(":") : ["", ""];
  const isActive = value !== "";

  function setHour(h: string)   { onChange(`${h}:${minute || "00"}`); }
  function setMinute(m: string) { onChange(`${hour || "00"}:${m}`); }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-2 outline-none"
          style={{
            backgroundColor: isActive ? "rgba(233,24,124,0.10)" : "var(--color-bg-card)",
            color:           isActive ? "var(--color-brand)"    : "var(--color-text-primary)",
            border:          `1px solid ${isActive ? "var(--color-brand)" : "var(--color-border)"}`,
          }}
        >
          <Clock size={12} style={{ opacity: 0.7 }} />
          {value ? `${label} ${value}` : label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto">
        <div className="flex items-center gap-2">
          <Select value={hour || undefined} onValueChange={setHour}>
            <SelectTrigger className="w-16"><SelectValue placeholder="HH" /></SelectTrigger>
            <SelectContent>{HOURS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
          </Select>
          <span style={{ color: "var(--color-text-muted)" }}>:</span>
          <Select value={minute || undefined} onValueChange={setMinute}>
            <SelectTrigger className="w-16"><SelectValue placeholder="MM" /></SelectTrigger>
            <SelectContent>{MINUTES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
          {isActive && (
            <button
              onClick={() => onChange("")}
              className="text-xs font-medium px-2 py-1 rounded transition-colors hover:bg-white/5"
              style={{ color: "var(--color-text-muted)" }}
            >
              Clear
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function FLMReports() {
  const [checked, setChecked]         = useState<Set<string>>(new Set());
  const [filters, setFilters]         = useState<Filters>(EMPTY_FILTERS);
  const [selectedIncident, setSelectedIncident] = useState<ShiftIncident | null>(null);

  const hasFilters = filters.status !== "all" || filters.severity !== "all" || filters.query.trim() !== "" || filters.from !== "" || filters.to !== "";

  const filtered = useMemo(() => {
    return SHIFT_INCIDENTS.filter(inc => {
      if (filters.status !== "all" && inc.status !== filters.status) return false;
      if (filters.severity !== "all" && inc.severity !== filters.severity) return false;
      if (filters.from && inc.resolvedAt < filters.from) return false;
      if (filters.to && inc.resolvedAt > filters.to) return false;
      if (filters.query.trim()) {
        const q = filters.query.trim().toLowerCase();
        const haystack = `${inc.ref} ${inc.title} ${inc.affected} ${inc.region}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [filters]);

  const allChecked = filtered.length > 0 && filtered.every(inc => checked.has(inc.id));

  function toggleAll() {
    if (allChecked) {
      const next = new Set(checked);
      filtered.forEach(inc => next.delete(inc.id));
      setChecked(next);
    } else {
      setChecked(new Set([...checked, ...filtered.map(inc => inc.id)]));
    }
  }

  function toggleRow(id: string) {
    const next = new Set(checked);
    next.has(id) ? next.delete(id) : next.add(id);
    setChecked(next);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Shift Report
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {SHIFT_WINDOW.label}
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
        >
          <Download size={14} />
          Export Handover PDF
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg p-5 space-y-2" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Incidents Resolved</p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>6</p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>This shift (06:00–14:00 UTC)</p>
        </div>
        <div className="rounded-lg p-5 space-y-2" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Avg Resolution Time</p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>14m 22s</p>
          <p className="text-xs font-medium" style={{ color: "#22c55e" }}>vs 18m 05s shift target</p>
        </div>
        <div className="rounded-lg p-5 space-y-2" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>SLA Compliance</p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>94.3%</p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>7/7 incidents within SLA</p>
        </div>
        <div className="rounded-lg p-5 space-y-2" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Escalations</p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>1</p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>1 to L2 · 0 to L3</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 min-w-[220px]"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <Search size={13} style={{ color: "var(--color-text-muted)" }} />
          <input
            value={filters.query}
            onChange={e => setFilters(f => ({ ...f, query: e.target.value }))}
            placeholder="Search by ref, incident, or affected link…"
            className="flex-1 bg-transparent outline-none text-xs"
            style={{ color: "var(--color-text-primary)" }}
          />
        </div>

        <FilterSelect
          value={filters.status}
          onChange={v => setFilters(f => ({ ...f, status: v }))}
          options={[
            { value: "all",       label: "All statuses" },
            { value: "Resolved",  label: "Resolved" },
            { value: "Escalated", label: "Escalated" },
          ]}
        />
        <FilterSelect
          value={filters.severity}
          onChange={v => setFilters(f => ({ ...f, severity: v }))}
          options={[
            { value: "all",      label: "All severities" },
            { value: "Critical", label: "Critical" },
            { value: "High",     label: "High" },
            { value: "Medium",   label: "Medium" },
          ]}
        />

        <div className="flex items-center gap-1.5">
          <TimePickerField label="From" value={filters.from} onChange={v => setFilters(f => ({ ...f, from: v }))} />
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>–</span>
          <TimePickerField label="To" value={filters.to} onChange={v => setFilters(f => ({ ...f, to: v }))} />
        </div>

        {hasFilters && (
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Incident table */}
      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <div
          className="grid items-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest"
          style={{
            gridTemplateColumns: "32px 100px 1fr 180px 110px 100px 90px 80px",
            borderBottom: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-3.5 h-3.5 accent-pink-500" />
          <span>Ref</span>
          <span>Title / Region</span>
          <span>Affected</span>
          <span>Status</span>
          <span>Severity</span>
          <span>Resolved</span>
          <span>Duration</span>
        </div>

        {filtered.map((inc, i) => {
          const isChecked = checked.has(inc.id);
          return (
            <div
              key={inc.id}
              className="grid items-center px-4 py-3.5 hover:bg-white/5 transition-colors cursor-pointer"
              style={{
                gridTemplateColumns: "32px 100px 1fr 180px 110px 100px 90px 80px",
                borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border)" : undefined,
                backgroundColor: isChecked ? "rgba(255,255,255,0.03)" : undefined,
              }}
              onClick={() => setSelectedIncident(inc)}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleRow(inc.id)}
                onClick={e => e.stopPropagation()}
                className="w-3.5 h-3.5 accent-pink-500"
              />
              <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{inc.ref}</p>
              <div className="min-w-0 pr-4">
                <p className="text-xs font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{inc.title}</p>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>{inc.region}</p>
              </div>
              <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{inc.affected}</p>
              <Badge variant={STATUS_VARIANT[inc.status]}>{inc.status}</Badge>
              <Badge variant={SEVERITY_VARIANT[inc.severity]}>{inc.severity}</Badge>
              <p className="text-xs tabular-nums" style={{ color: "var(--color-text-muted)" }}>{inc.resolvedAt}</p>
              <p className="text-xs tabular-nums" style={{ color: "var(--color-text-muted)" }}>{inc.duration}</p>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              No incidents match these filters
            </p>
          </div>
        )}
      </div>

      {/* Row detail window */}
      {selectedIncident && (
        <DetailModal
          title={`${selectedIncident.ref} — ${selectedIncident.title}`}
          onClose={() => setSelectedIncident(null)}
          maxWidth={560}
        >
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant={STATUS_VARIANT[selectedIncident.status]}>{selectedIncident.status}</Badge>
            <Badge variant={SEVERITY_VARIANT[selectedIncident.severity]}>{selectedIncident.severity}</Badge>
            <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
              Resolved {selectedIncident.resolvedAt} UTC · {selectedIncident.duration}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 py-2">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>Region</p>
              <p className="text-[12px]" style={{ color: "var(--color-text-primary)" }}>{selectedIncident.region}</p>
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>Affected</p>
              <p className="text-[12px] font-mono" style={{ color: "var(--color-text-primary)" }}>{selectedIncident.affected}</p>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-text-muted)" }}>Summary</p>
            <p className="text-[12px] leading-relaxed" style={{ color: "var(--color-text-primary)" }}>{selectedIncident.summary}</p>
          </div>

          <div className="pt-2">
            <p className="text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-text-muted)" }}>Root cause</p>
            <p className="text-[12px] leading-relaxed" style={{ color: "var(--color-text-primary)" }}>{selectedIncident.rootCause}</p>
          </div>

          <div className="pt-2">
            <p className="text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-text-muted)" }}>
              Linked alarms ({selectedIncident.linkedAlarms.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selectedIncident.linkedAlarms.map(ref => (
                <span key={ref} className="text-[10px] font-mono px-2 py-1 rounded" style={{ backgroundColor: "rgba(255,176,32,0.10)", color: "#FFB020" }}>
                  {ref}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <p className="text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-text-muted)" }}>Actions taken</p>
            <div className="space-y-1.5">
              {selectedIncident.actionsTaken.map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[9px] font-bold tabular-nums px-1.5 py-px rounded shrink-0 mt-0.5" style={{ backgroundColor: "rgba(233,24,124,0.12)", color: "var(--color-brand)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[12px] leading-snug" style={{ color: "var(--color-text-primary)" }}>{a}</p>
                </div>
              ))}
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
