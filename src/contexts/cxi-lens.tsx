import { createContext, useContext, useState, type ReactNode } from "react";

export type CxiLens = "smc" | "ran";

export const LENS_LABEL: Record<CxiLens, string> = {
  smc: "SMC — Incident Handler",
  ran: "RAN — Optimization Expert",
};

interface CxiLensContextValue {
  lens: CxiLens;
  setLens: (lens: CxiLens) => void;
}

const CxiLensContext = createContext<CxiLensContextValue | null>(null);

export function CxiLensProvider({ children }: { children: ReactNode }) {
  const [lens, setLens] = useState<CxiLens>("smc");
  return (
    <CxiLensContext.Provider value={{ lens, setLens }}>
      {children}
    </CxiLensContext.Provider>
  );
}

export function useCxiLens() {
  const ctx = useContext(CxiLensContext);
  if (!ctx) throw new Error("useCxiLens must be used inside CxiLensProvider");
  return ctx;
}
