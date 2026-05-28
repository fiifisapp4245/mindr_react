import { createContext, useContext, useState, type ReactNode } from "react";

export interface ScenarioUser {
  id: string;
  name: string;
  initials: string;
  role: string;
  email: string;
}

export interface Scenario {
  id: string;
  tag: string;
  label: string;
  color: string;
  defaultRoute: string;
  users: ScenarioUser[];
}

const SCENARIOS: Scenario[] = [
  {
    id: "s1",
    tag: "Scenario 1",
    label: "Prediction & Reaction",
    color: "var(--color-brand)",
    defaultRoute: "/dashboard",
    users: [
      { id: "u1", name: "Kwame Asante",  initials: "KA", role: "Level 4 Clearance",  email: "k.asante@mindr.network"  },
      { id: "u2", name: "Sara Chen",     initials: "SC", role: "Senior NOC Engineer", email: "s.chen@mindr.network"    },
    ],
  },
  {
    id: "s2",
    tag: "Scenario 2",
    label: "CXI Degradation",
    color: "var(--color-warning)",
    defaultRoute: "/cxi-cases",
    users: [
      { id: "u3", name: "Marcus Webb", initials: "MW", role: "CXI Specialist",     email: "m.webb@mindr.network"  },
      { id: "u4", name: "Priya Nair",  initials: "PN", role: "Operations Manager", email: "p.nair@mindr.network"  },
    ],
  },
  {
    id: "s3",
    tag: "Scenario 3",
    label: "Autonomous Recovery",
    color: "var(--color-resolved)",
    defaultRoute: "/dashboard",
    users: [
      { id: "u5", name: "Alex Torres", initials: "AT", role: "Executive",         email: "a.torres@mindr.network" },
      { id: "u6", name: "Jamie Osei",  initials: "JO", role: "Compliance Officer", email: "j.osei@mindr.network"   },
    ],
  },
];

interface ScenarioContextValue {
  scenarios: Scenario[];
  activeScenario: Scenario;
  activeUser: ScenarioUser;
  setScenario: (id: string) => void;
  setUser: (id: string) => void;
}

const ScenarioContext = createContext<ScenarioContextValue | null>(null);

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [activeScenarioId, setActiveScenarioId] = useState(SCENARIOS[0].id);
  const [activeUserId, setActiveUserId] = useState(SCENARIOS[0].users[0].id);

  const activeScenario = SCENARIOS.find((s) => s.id === activeScenarioId)!;
  const activeUser =
    activeScenario.users.find((u) => u.id === activeUserId) ?? activeScenario.users[0];

  function setScenario(id: string) {
    const scenario = SCENARIOS.find((s) => s.id === id);
    if (!scenario) return;
    setActiveScenarioId(id);
    setActiveUserId(scenario.users[0].id);
  }

  function setUser(id: string) {
    setActiveUserId(id);
  }

  return (
    <ScenarioContext.Provider value={{ scenarios: SCENARIOS, activeScenario, activeUser, setScenario, setUser }}>
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario() {
  const ctx = useContext(ScenarioContext);
  if (!ctx) throw new Error("useScenario must be used inside ScenarioProvider");
  return ctx;
}
