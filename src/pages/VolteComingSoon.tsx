import { useNavigate } from "react-router-dom";
import { ArrowLeft, Construction, Radio } from "lucide-react";

export default function VolteComingSoon() {
  const navigate = useNavigate();

  return (
    <div
      className="flex flex-col items-center justify-center min-h-full py-20"
      style={{ color: "var(--color-text-primary)" }}
    >
      {/* Icon cluster */}
      <div className="relative mb-8">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(45,212,191,0.10)", border: "1px solid rgba(45,212,191,0.25)" }}
        >
          <Radio size={36} style={{ color: "#2DD4BF" }} strokeWidth={1.5} />
        </div>
        <div
          className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <Construction size={15} style={{ color: "var(--color-text-muted)" }} />
        </div>
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold tracking-tight mb-2">
        VoLTE Domain
      </h1>
      <p
        className="text-sm font-semibold uppercase tracking-widest mb-4"
        style={{ color: "#2DD4BF" }}
      >
        Under Construction
      </p>

      {/* Body */}
      <p
        className="text-sm text-center max-w-sm leading-relaxed mb-1"
        style={{ color: "var(--color-text-muted)" }}
      >
        Monitoring screens for the VoLTE domain are currently being designed.
        Requirements are being finalised and will be built out in the next sprint.
      </p>
      <p
        className="text-xs text-center max-w-xs leading-relaxed mb-10"
        style={{ color: "var(--color-text-muted)", opacity: 0.6 }}
      >
        You can still navigate to the Network Model to explore the VoLTE topology.
      </p>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/overview")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
          style={{ border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
        >
          <ArrowLeft size={14} />
          Back to Overview
        </button>
        <button
          onClick={() => navigate("/network-model/volte")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{ backgroundColor: "rgba(45,212,191,0.12)", color: "#2DD4BF", border: "1px solid rgba(45,212,191,0.25)" }}
        >
          View VoLTE Network Model
        </button>
      </div>
    </div>
  );
}
