import { createContext, useContext, useState, type ReactNode } from "react";
import type { DomainId } from "../data/domains";

interface DomainContextValue {
  activeDomain: DomainId;
  setDomain: (id: DomainId) => void;
}

const DomainContext = createContext<DomainContextValue | null>(null);

export function DomainProvider({ children }: { children: ReactNode }) {
  const [activeDomain, setActiveDomain] = useState<DomainId>("all");

  return (
    <DomainContext.Provider value={{ activeDomain, setDomain: setActiveDomain }}>
      {children}
    </DomainContext.Provider>
  );
}

export function useDomain() {
  const ctx = useContext(DomainContext);
  if (!ctx) throw new Error("useDomain must be used inside DomainProvider");
  return ctx;
}
