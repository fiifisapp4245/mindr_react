import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Shield, Zap } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError("Please enter your credentials."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep("mfa"); }, 1200);
  }

  function handleMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaCode) { setError("Please enter your MFA code."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate("/dashboard"); }, 1200);
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
          {step === "credentials" ? (
            <>
              <h2 className="text-sm font-bold mb-5" style={{ color: "var(--color-text-primary)" }}>Sign in to your account</h2>
              <form onSubmit={handleCredentials} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-text-muted)" }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@mindr.network"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-text-muted)" }}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
                  />
                </div>
                {error && <p className="text-[11px]" style={{ color: "var(--color-critical)" }}>{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
                >
                  {loading ? "Verifying…" : "Continue"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(233,30,140,0.12)" }}>
                  <Shield size={15} style={{ color: "var(--color-brand)" }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>Two-Factor Authentication</h2>
                  <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>Enter the 6-digit code from your authenticator app</p>
                </div>
              </div>
              <form onSubmit={handleMfa} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-text-muted)" }}>MFA Code</label>
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none text-center tracking-widest"
                    style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}
                  />
                </div>
                {error && <p className="text-[11px]" style={{ color: "var(--color-critical)" }}>{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: "var(--color-brand)", color: "#fff" }}
                >
                  {loading ? "Authenticating…" : "Sign In"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("credentials")}
                  className="w-full text-center text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  ← Back to credentials
                </button>
              </form>
            </>
          )}
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
