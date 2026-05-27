import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/theme";
import { ScenarioProvider } from "./contexts/scenario";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Topology from "./pages/Topology";
import Agents from "./pages/Agents";
import Incidents from "./pages/Incidents";
import IncidentDetail from "./pages/IncidentDetail";
import Reports from "./pages/Reports";
import Assistant from "./pages/Assistant";
import Login from "./pages/Login";

export default function App() {
  return (
    <ThemeProvider>
      <ScenarioProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="topology" element={<Topology />} />
            <Route path="agents" element={<Agents />} />
            <Route path="incidents" element={<Incidents />} />
            <Route path="incidents/:id" element={<IncidentDetail />} />
            <Route path="reports" element={<Reports />} />
            <Route path="assistant" element={<Assistant />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </ScenarioProvider>
    </ThemeProvider>
  );
}
