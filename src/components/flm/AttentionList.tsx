import { Link } from 'react-router-dom';
import {
  getAttentionAlerts,
  ALERT_SEV,
  ALERT_STATUS,
  PREDICTED_BADGE,
  type AlertSeverity,
  type AlertStatus,
} from '../../data/alert-store';
import { Badge } from '../ui/badge';

// Mirrors the Alerts page's SevBadge/StatusBadge variant mapping so colours
// never drift between the two surfaces.
const SEV_VARIANT: Record<AlertSeverity, "destructive" | "warning" | "info" | "success"> = {
  critical: "destructive",
  high:     "warning",
  medium:   "info",
  low:      "success",
};

const STATUS_VARIANT: Record<AlertStatus, "destructive" | "warning" | "info" | "success" | "secondary"> = {
  open:         "destructive",
  "acted-upon": "info",
  resolved:     "success",
  closed:       "secondary",
};

function SevBadge({ severity }: { severity: AlertSeverity }) {
  const cfg = ALERT_SEV[severity];
  return (
    <Badge
      variant={SEV_VARIANT[severity]}
      className="text-[10px] shrink-0 uppercase tracking-wide"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: AlertStatus }) {
  const cfg = ALERT_STATUS[status];
  return (
    <Badge
      variant={STATUS_VARIANT[status]}
      className="text-[10px] shrink-0 uppercase tracking-wide"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </Badge>
  );
}

function PredictedChip() {
  return (
    <Badge
      className="text-[10px] shrink-0 uppercase tracking-wide"
      style={{ color: PREDICTED_BADGE.color, backgroundColor: PREDICTED_BADGE.bg }}
    >
      {PREDICTED_BADGE.label}
    </Badge>
  );
}

export function AttentionList() {
  const attentionAlerts = getAttentionAlerts();

  return (
    <div
      className="rounded-lg mt-3"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2.5">
        <p
          className="text-xs font-medium uppercase tracking-widest"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Open Alerts
        </p>
        <Link
          to="/alerts"
          className="text-xs font-medium transition-opacity hover:opacity-80"
          style={{ color: 'var(--color-brand)' }}
        >
          View all alerts →
        </Link>
      </div>

      <div className="px-2 pb-2">
        {attentionAlerts.map((alert, i) => {
          const isLast = i === attentionAlerts.length - 1;
          return (
            <Link
              key={alert.id}
              to={`/alerts/${alert.id}`}
              className="px-3 py-3 flex items-center gap-3 rounded hover:bg-white/5 transition-colors"
              style={{
                borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
                textDecoration: 'none',
              }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0 mt-0.5"
                style={{ backgroundColor: ALERT_SEV[alert.severity].color }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {alert.title}
                  </span>
                  <SevBadge severity={alert.severity} />
                  <StatusBadge status={alert.status} />
                  {alert.isPredicted && <PredictedChip />}
                </div>
                <p
                  className="text-[11px] mt-0.5"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Anodot
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p
                  className="text-[10px] font-medium"
                  style={{
                    color: 'var(--color-text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {alert.id}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  {alert.age} ago
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
