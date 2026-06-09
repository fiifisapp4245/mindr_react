import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/auth";

export function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg-base)" }}>
        <span className="text-xs uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
          Loading…
        </span>
      </div>
    );
  }

  return session ? <Outlet /> : <Navigate to="/login" replace />;
}
