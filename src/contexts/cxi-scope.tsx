import { createContext, useContext, useState, type ReactNode } from "react";

interface CxiScopeCtx {
  scopeId: string;
  setScopeId: (id: string) => void;
}

const CxiScopeContext = createContext<CxiScopeCtx | null>(null);

export function CxiScopeProvider({ children }: { children: ReactNode }) {
  const [scopeId, setScopeId] = useState("germany");
  return (
    <CxiScopeContext.Provider value={{ scopeId, setScopeId }}>
      {children}
    </CxiScopeContext.Provider>
  );
}

export function useCxiScope() {
  const ctx = useContext(CxiScopeContext);
  if (!ctx) throw new Error("useCxiScope must be used inside CxiScopeProvider");
  return ctx;
}
