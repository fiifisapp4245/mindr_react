import { createContext, useContext, useState, ReactNode } from 'react';
import { FLM_INCIDENTS, type FLMIncident, type FLMStatus } from '../data/flm-incident-store';

// ── Types ───────────────────────────────────────────────────────────────────────

interface FLMIncidentsContextValue {
  incidents: FLMIncident[];
  resolve: (id: string) => void;
  escalate: (id: string) => void;
  close: (id: string) => void;
  toggleStep: (id: string, stepIndex: number, checked: boolean) => void;
  checkedSteps: Record<string, Set<number>>;
}

// ── Context ─────────────────────────────────────────────────────────────────────

const FLMIncidentsContext = createContext<FLMIncidentsContextValue | null>(null);

function nowUtc(): string {
  const d = new Date();
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
}

function mutateStatus(
  prev: FLMIncident[],
  id: string,
  status: FLMStatus,
  actorAction: string,
  kpiFlip = false,
): FLMIncident[] {
  return prev.map((inc) => {
    if (inc.id !== id) return inc;
    const updated: FLMIncident = {
      ...inc,
      status,
      activityLog: [
        ...inc.activityLog,
        { time: nowUtc(), actor: 'M. Weber', action: actorAction },
      ],
    };
    if (kpiFlip) {
      return {
        ...updated,
        portUtilizationMax: 62,
        congestedInterfaces: 0,
        trafficSpikePercent: 4,
        routeDeviationPercent: 1,
        altPathHeadroom: 78,
        linkUtilization: 62,
      };
    }
    return updated;
  });
}

// ── Provider ────────────────────────────────────────────────────────────────────

export function FLMIncidentsProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<FLMIncident[]>(FLM_INCIDENTS);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, Set<number>>>({});

  function resolve(id: string) {
    setIncidents((prev) => mutateStatus(prev, id, 'Resolved', 'Incident resolved — SLA met. KPIs stable.', true));
  }

  function escalate(id: string) {
    setIncidents((prev) => mutateStatus(prev, id, 'Escalated', 'Escalated to L2 — additional triage required.'));
  }

  function close(id: string) {
    setIncidents((prev) => mutateStatus(prev, id, 'Closed', 'Incident closed.'));
  }

  function toggleStep(id: string, stepIndex: number, checked: boolean) {
    setCheckedSteps((prev) => {
      const current = new Set(prev[id] ?? []);
      if (checked) current.add(stepIndex); else current.delete(stepIndex);
      return { ...prev, [id]: current };
    });
    // Mirror playbook step completion to activity log
    setIncidents((prevIncs) =>
      prevIncs.map((inc) => {
        if (inc.id !== id) return inc;
        const step = inc.rootCause.steps[stepIndex];
        if (!step) return inc;
        return {
          ...inc,
          activityLog: [
            ...inc.activityLog,
            { time: nowUtc(), actor: 'M. Weber', action: checked ? `Completed: "${step}"` : `Unchecked: "${step}"` },
          ],
        };
      })
    );
  }

  return (
    <FLMIncidentsContext.Provider value={{ incidents, resolve, escalate, close, toggleStep, checkedSteps }}>
      {children}
    </FLMIncidentsContext.Provider>
  );
}

export function useFLMIncidents() {
  const ctx = useContext(FLMIncidentsContext);
  if (!ctx) throw new Error('useFLMIncidents must be used inside FLMIncidentsProvider');
  return ctx;
}
