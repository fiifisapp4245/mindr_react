import { createContext, useContext, useState, ReactNode } from 'react';
import { INITIAL_ALARMS, nextIncidentId, type AlarmRow } from '../data/alarm-store';

// ── Context value ──────────────────────────────────────────────────────────────

interface AlarmsContextValue {
  alarms: AlarmRow[];
  acknowledge: (id: string) => void;
  snooze: (id: string) => void;
  createIncident: (id: string) => string;
  addToGroup: (id: string, groupId: string) => void;
  assignTo: (id: string, engineer: string) => void;
}

const AlarmsContext = createContext<AlarmsContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

function patchAlarm(prev: AlarmRow[], id: string, patch: Partial<AlarmRow>): AlarmRow[] {
  return prev.map((a) => (a.id === id ? { ...a, ...patch } : a));
}

export function AlarmsProvider({ children }: { children: ReactNode }) {
  const [alarms, setAlarms] = useState<AlarmRow[]>(INITIAL_ALARMS);

  function acknowledge(id: string) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAlarms((prev) =>
      patchAlarm(prev, id, {
        status: 'acknowledged',
        acknowledgedAt: timeStr,
        acknowledgedBy: 'You',
      })
    );
  }

  function snooze(id: string) {
    setAlarms((prev) => patchAlarm(prev, id, { status: 'snoozed', snoozeUntil: '30m' }));
  }

  function createIncident(id: string): string {
    const incId = nextIncidentId();
    setAlarms((prev) =>
      patchAlarm(prev, id, {
        createdIncidentId: incId,
        linkedIncident: incId,
        linkedIncidentId: incId.toLowerCase().replace('inc-', 'inc-'),
      })
    );
    return incId;
  }

  function addToGroup(id: string, groupId: string) {
    setAlarms((prev) => patchAlarm(prev, id, { addedToGroupId: groupId }));
  }

  function assignTo(id: string, engineer: string) {
    setAlarms((prev) => patchAlarm(prev, id, { assignedTo: engineer }));
  }

  return (
    <AlarmsContext.Provider value={{ alarms, acknowledge, snooze, createIncident, addToGroup, assignTo }}>
      {children}
    </AlarmsContext.Provider>
  );
}

export function useAlarms() {
  const ctx = useContext(AlarmsContext);
  if (!ctx) throw new Error('useAlarms must be used inside AlarmsProvider');
  return ctx;
}
