import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { useAlarms } from "../contexts/alarms";
import {
  SEV,
  STATUS,
  makeChartData,
  metricColor,
  type AlarmRow,
} from "../data/alarm-store";

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionRow({ title, cols }: { title: string; cols: number }) {
  return (
    <div
      className="col-span-full grid"
      style={{ gridColumn: `1 / ${cols + 2}` }}
    >
      <div
        className="px-4 py-2"
        style={{
          backgroundColor: "var(--color-bg-elevated)",
          borderBottom: "1px solid var(--color-border)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <p className="text-[9px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--color-text-muted)" }}>
          {title}
        </p>
      </div>
    </div>
  );
}

interface CellProps { children: React.ReactNode; muted?: boolean }
function LabelCell({ children }: CellProps) {
  return (
    <div
      className="px-4 py-3 flex items-center"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        backgroundColor: "var(--color-bg-elevated)",
        color: "var(--color-text-muted)",
        fontSize: 11,
        fontWeight: 500,
      }}
    >
      {children}
    </div>
  );
}
function ValueCell({ children }: CellProps) {
  return (
    <div
      className="px-4 py-3 flex items-center"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        borderLeft: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {children}
    </div>
  );
}

function MiniSparkline({ alarm }: { alarm: AlarmRow }) {
  const data = makeChartData(alarm);
  const color = metricColor(alarm.metricValue, alarm.metricMax);
  return (
    <div style={{ height: 56, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <XAxis dataKey="t" hide />
          <YAxis hide domain={[0, alarm.metricMax]} />
          {alarm.threshold > 0 && (
            <ReferenceLine y={alarm.threshold} stroke="#FF3B3B" strokeDasharray="3 2" strokeOpacity={0.5} />
          )}
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AlarmCompare() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { alarms } = useAlarms();

  const ids = (searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const compared = ids
    .map((id) => alarms.find((a) => a.id === id))
    .filter(Boolean) as AlarmRow[];

  if (compared.length < 2) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full gap-4"
        style={{ backgroundColor: "var(--color-bg-base)", color: "var(--color-text-muted)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Select at least 2 alarms to compare
        </p>
        <button
          onClick={() => navigate("/alarms")}
          className="text-xs hover:opacity-80 transition-opacity flex items-center gap-1.5"
          style={{ color: "var(--color-brand)" }}
        >
          <ArrowLeft size={12} />
          Back to Alarms
        </button>
      </div>
    );
  }

  const cols = compared.length;
  // gridTemplateColumns: label col + one col per alarm
  const gridCols = `200px ${compared.map(() => "1fr").join(" ")}`;

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-base)", color: "var(--color-text-primary)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-3.5 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
      >
        <button
          onClick={() => navigate("/alarms")}
          className="flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity shrink-0"
          style={{ color: "var(--color-text-muted)" }}
        >
          <ArrowLeft size={13} />
          Alarms
        </button>
        <span style={{ color: "var(--color-border)" }}>/</span>
        <h1 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
          Compare Alarms
        </h1>
        <span
          className="px-2 py-0.5 rounded text-[10px] font-semibold"
          style={{ backgroundColor: "rgba(226,0,116,0.1)", color: "var(--color-brand)" }}
        >
          {cols}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <div
          className="min-w-max"
          style={{ display: "grid", gridTemplateColumns: gridCols }}
        >
          {/* Column headers */}
          <div
            className="px-4 py-3"
            style={{
              backgroundColor: "var(--color-bg-card)",
              borderBottom: "1px solid var(--color-border)",
            }}
          />
          {compared.map((alarm) => {
            const sev = SEV[alarm.severity];
            return (
              <div
                key={alarm.id}
                className="px-4 py-3"
                style={{
                  backgroundColor: "var(--color-bg-card)",
                  borderBottom: "1px solid var(--color-border)",
                  borderLeft: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <Link
                  to={`/alarms/${alarm.id}`}
                  className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-80 transition-opacity mb-1"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {alarm.ref}
                  <ExternalLink size={10} style={{ color: "var(--color-text-muted)" }} />
                </Link>
                <p className="text-[10px] truncate mb-1.5" style={{ color: "var(--color-text-muted)", maxWidth: 220 }}>
                  {alarm.name}
                </p>
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
                  style={{ backgroundColor: sev.bg, color: sev.color }}
                >
                  {sev.label}
                </span>
              </div>
            );
          })}

          {/* ── IDENTITY ── */}
          <SectionRow title="Identity" cols={cols} />

          <LabelCell>Name</LabelCell>
          {compared.map((a) => (
            <ValueCell key={a.id}>
              <span className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
                {a.name}
              </span>
            </ValueCell>
          ))}

          <LabelCell>Status</LabelCell>
          {compared.map((a) => {
            const stat = STATUS[a.status];
            return (
              <ValueCell key={a.id}>
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
                  style={{ backgroundColor: stat.bg, color: stat.color }}
                >
                  {stat.label}
                </span>
              </ValueCell>
            );
          })}

          <LabelCell>IXP</LabelCell>
          {compared.map((a) => (
            <ValueCell key={a.id}>
              <span className="text-xs" style={{ color: "var(--color-text-primary)" }}>{a.ixp}</span>
            </ValueCell>
          ))}

          <LabelCell>Region</LabelCell>
          {compared.map((a) => (
            <ValueCell key={a.id}>
              <span className="text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>{a.region}</span>
            </ValueCell>
          ))}

          <LabelCell>Affected</LabelCell>
          {compared.map((a) => (
            <ValueCell key={a.id}>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{a.affected}</span>
            </ValueCell>
          ))}

          <LabelCell>Interface</LabelCell>
          {compared.map((a) => (
            <ValueCell key={a.id}>
              <span className="text-[11px] font-mono" style={{ color: "var(--color-text-muted)" }}>
                {a.iface ?? "—"}
              </span>
            </ValueCell>
          ))}

          <LabelCell>Raised / ETA</LabelCell>
          {compared.map((a) => (
            <ValueCell key={a.id}>
              <span
                className="text-xs font-semibold"
                style={{ color: a.isETA ? "#4D9EFF" : "var(--color-text-muted)" }}
              >
                {a.raised}
              </span>
            </ValueCell>
          ))}

          {/* ── METRIC ── */}
          <SectionRow title="Metric" cols={cols} />

          <LabelCell>Current value</LabelCell>
          {compared.map((a) => (
            <ValueCell key={a.id}>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: metricColor(a.metricValue, a.metricMax) }}
              >
                {a.metricValue}{a.metricUnit}
              </span>
            </ValueCell>
          ))}

          <LabelCell>Threshold</LabelCell>
          {compared.map((a) => (
            <ValueCell key={a.id}>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {a.threshold > 0 ? `${a.threshold}${a.metricUnit}` : "—"}
              </span>
            </ValueCell>
          ))}

          <LabelCell>Metric bar</LabelCell>
          {compared.map((a) => (
            <ValueCell key={a.id}>
              <div style={{ width: "100%" }}>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", maxWidth: 160 }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((a.metricValue / a.metricMax) * 100, 100)}%`,
                      backgroundColor: metricColor(a.metricValue, a.metricMax),
                    }}
                  />
                </div>
              </div>
            </ValueCell>
          ))}

          <LabelCell>Trend (55m)</LabelCell>
          {compared.map((a) => (
            <ValueCell key={a.id}>
              <MiniSparkline alarm={a} />
            </ValueCell>
          ))}

          {/* ── CORRELATION ── */}
          <SectionRow title="Correlation" cols={cols} />

          <LabelCell>Linked incident</LabelCell>
          {compared.map((a) => (
            <ValueCell key={a.id}>
              {a.linkedIncident ? (
                <Link
                  to={`/incidents/${a.linkedIncidentId}`}
                  className="flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition-opacity"
                  style={{ color: "var(--color-brand)" }}
                >
                  <ExternalLink size={9} />
                  {a.linkedIncident}
                </Link>
              ) : (
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>—</span>
              )}
            </ValueCell>
          ))}

          <LabelCell>Assigned to</LabelCell>
          {compared.map((a) => (
            <ValueCell key={a.id}>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {a.assignedTo ?? "Unassigned"}
              </span>
            </ValueCell>
          ))}

          {/* Spacer row */}
          <div className="col-span-full" style={{ height: 32 }} />
        </div>
      </div>

      {/* Footer links */}
      <div
        className="flex items-center gap-4 px-6 py-3 shrink-0"
        style={{ borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--color-text-muted)" }}>
          Open detail
        </span>
        {compared.map((a) => (
          <Link
            key={a.id}
            to={`/alarms/${a.id}`}
            className="flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition-opacity"
            style={{ color: "var(--color-brand)" }}
          >
            <ExternalLink size={10} />
            {a.ref}
          </Link>
        ))}
      </div>
    </div>
  );
}
