import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Lock, Zap } from "lucide-react";
import { useAuth } from "../contexts/auth";
import { getRouteForRole } from "../lib/roleRoutes";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, session, role, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!loading && session) return <Navigate to={getRouteForRole(role)} replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setError("");
    setSubmitting(true);
    const { error, role } = await signIn(email, password);
    setSubmitting(false);
    if (error) { setError(error); return; }
    navigate(getRouteForRole(role), { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg-base)" }}>
      <div className="w-full max-w-sm mx-4">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "var(--color-brand)" }}>
            <Zap size={22} color="#fff" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>MINDR AI</h1>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>Network Operations Center</p>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <h2 className="text-sm font-bold mb-5" style={{ color: "var(--color-text-primary)" }}>Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@mindr.network"
                autoComplete="email"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
              />
            </div>
            {error && (
              <p className="text-[11px]" style={{ color: "var(--color-critical)" }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <div className="flex items-center justify-center gap-3 mt-4">
          <Lock size={10} style={{ color: "var(--color-text-muted)" }} />
          <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
            256-bit encrypted · Policy compliant
          </span>
        </div>
      </div>
    </div>
  );
}
