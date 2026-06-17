import { createContext, useContext, useState, ReactNode } from 'react';
import { FLM_INCIDENTS, type FLMIncident } from '../data/flm-incident-store';
import { useScenario } from './scenario';

// ── Types ───────────────────────────────────────────────────────────────────────

interface FLMIncidentsContextValue {
  incidents: FLMIncident[];
  notifyCdn: (id: string) => void;
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

function addActivity(
  prev: FLMIncident[],
  id: string,
  actor: string,
  action: string,
): FLMIncident[] {
  return prev.map((inc) =>
    inc.id !== id
      ? inc
      : { ...inc, activityLog: [...inc.activityLog, { time: nowUtc(), actor, action }] },
  );
}

// ── Provider ────────────────────────────────────────────────────────────────────

export function FLMIncidentsProvider({ children }: { children: ReactNode }) {
  const { activeUser } = useScenario();
  const [incidents, setIncidents] = useState<FLMIncident[]>(FLM_INCIDENTS);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, Set<number>>>({});

  function notifyCdn(id: string) {
    setIncidents((prev) =>
      addActivity(prev, id, activeUser.name, 'CDN notified — load-balance/reroute traffic per recommended action.'),
    );
  }

  function close(id: string) {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id !== id) return inc;
        return {
          ...inc,
          status: 'Closed',
          // Scenario-1 happy path: flip KPIs to stable/green
          portUtilizationMax: 62,
          congestedInterfaces: 0,
          trafficSpikePercent: 4,
          routeDeviationPercent: 1,
          altPathHeadroom: 78,
          linkUtilization: 62,
          activityLog: [
            ...inc.activityLog,
            { time: nowUtc(), actor: activeUser.name, action: 'Incident closed — KPIs stable. Scenario-1 happy path applied.' },
          ],
        };
      }),
    );
  }

  function toggleStep(id: string, stepIndex: number, checked: boolean) {
    setCheckedSteps((prev) => {
      const current = new Set(prev[id] ?? []);
      if (checked) current.add(stepIndex); else current.delete(stepIndex);
      return { ...prev, [id]: current };
    });
    setIncidents((prevIncs) =>
      prevIncs.map((inc) => {
        if (inc.id !== id) return inc;
        const step = inc.rootCause.steps[stepIndex];
        if (!step) return inc;
        return {
          ...inc,
          activityLog: [
            ...inc.activityLog,
            {
              time: nowUtc(),
              actor: activeUser.name,
              action: checked ? `Completed: "${step}"` : `Unchecked: "${step}"`,
            },
          ],
        };
      }),
    );
  }

  return (
    <FLMIncidentsContext.Provider value={{ incidents, notifyCdn, close, toggleStep, checkedSteps }}>
      {children}
    </FLMIncidentsContext.Provider>
  );
}

export function useFLMIncidents() {
  const ctx = useContext(FLMIncidentsContext);
  if (!ctx) throw new Error('useFLMIncidents must be used inside FLMIncidentsProvider');
  return ctx;
}
