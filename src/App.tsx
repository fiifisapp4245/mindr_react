import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/theme";
import { ScenarioProvider } from "./contexts/scenario";
import { AuthProvider } from "./contexts/auth";
import { CxiLensProvider } from "./contexts/cxi-lens";
import { CxiScopeProvider } from "./contexts/cxi-scope";
import { FLMIncidentsProvider } from "./contexts/flm-incidents";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Topology from "./pages/Topology";
import Agents from "./pages/Agents";
import Incidents from "./pages/Incidents";
import IncidentDetail from "./pages/IncidentDetail";
import IncidentCompare from "./pages/IncidentCompare";
import Reports from "./pages/Reports";
import Assistant from "./pages/Assistant";
import Login from "./pages/Login";
import CxiCases from "./pages/CxiCases";
import CxiCaseDetail from "./pages/CxiCaseDetail";
import FLMDashboard from "./pages/FLMDashboard";
import Alarms from "./pages/Alarms";
import Playbooks from "./pages/Playbooks";
import FLMReports from "./pages/FLMReports";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";

export default function App() {
  return (
    <ThemeProvider>
      <ScenarioProvider>
        <CxiLensProvider>
        <CxiScopeProvider>
        <FLMIncidentsProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="topology" element={<Topology />} />
                  <Route path="agents" element={<Agents />} />
                  <Route path="incidents" element={<Incidents />} />
                  <Route path="incidents/compare" element={<IncidentCompare />} />
                  <Route path="incidents/:id" element={<IncidentDetail />} />
                  <Route path="cxi-cases" element={<CxiCases />} />
                  <Route path="cxi-cases/:caseId" element={<CxiCaseDetail />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="assistant" element={<Assistant />} />
                  <Route path="flm-dashboard" element={<FLMDashboard />} />
                  <Route path="alarms" element={<Alarms />} />
                  <Route path="playbooks" element={<Playbooks />} />
                  <Route path="events" element={<Events />} />
                  <Route path="events/:id" element={<EventDetail />} />
                  <Route path="flm-reports" element={<FLMReports />} />
                </Route>
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
        </FLMIncidentsProvider>
        </CxiScopeProvider>
        </CxiLensProvider>
      </ScenarioProvider>
    </ThemeProvider>
  );
}
