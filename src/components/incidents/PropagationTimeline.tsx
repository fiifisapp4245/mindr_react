import { Target } from "lucide-react";
import type { TimelineStage } from "../../types/incident";

export function PropagationTimeline({ stages }: { stages: TimelineStage[] }) {
  return (
    <div
      className="rounded-lg p-5"
      style={{
        backgroundColor: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <p
        className="text-[10px] font-medium uppercase tracking-widest mb-6"
        style={{ color: "var(--color-text-muted)" }}
      >
        Propagation Timeline
      </p>

      <div className="flex">
        {stages.map((stage, i) => {
          const isActive    = stage.status === "active";
          const isCompleted = stage.status === "completed";

          const lineColor  = isCompleted || isActive
            ? "var(--color-brand)"
            : "rgba(255,255,255,0.1)";

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center"
              style={{ gap: 10 }}
            >
              {/* Dot + connecting line */}
              <div
                style={{
                  height: 36,
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                {/* Line to left (spans from centre of prev stage to centre of this) */}
                {i > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      transform: "translateY(-50%)",
                      left: "-50%",
                      right: "50%",
                      height: 1.5,
                      backgroundColor: lineColor,
                      zIndex: 0,
                    }}
                  />
                )}

                {/* Dot — rendered above the line */}
                <div style={{ position: "relative", zIndex: 1 }}>
                  {isActive ? (
                    <div
                      className="flex items-center justify-center rounded-full"
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: "var(--color-brand)",
                        boxShadow: "0 0 18px rgba(233,30,140,0.45)",
                      }}
                    >
                      <Target size={16} color="#fff" strokeWidth={2.5} />
                    </div>
                  ) : isCompleted ? (
                    <div
                      className="rounded-full"
                      style={{
                        width: 14,
                        height: 14,
                        backgroundColor: "var(--color-brand)",
                        boxShadow: "0 0 6px rgba(233,30,140,0.3)",
                      }}
                    />
                  ) : (
                    <div
                      className="rounded-full"
                      style={{
                        width: 14,
                        height: 14,
                        border: "1.5px solid rgba(255,255,255,0.2)",
                        backgroundColor: "var(--color-bg-elevated)",
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Label — centred directly below the dot */}
              <div className="text-center px-1 w-full">
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide leading-tight"
                  style={{
                    color: isActive
                      ? "var(--color-text-primary)"
                      : isCompleted
                      ? "var(--color-brand)"
                      : "var(--color-text-muted)",
                  }}
                >
                  {stage.label}
                </p>
                <p className="text-[10px] mt-1 leading-snug" style={{ color: "var(--color-text-muted)" }}>
                  {stage.time ?? stage.sub ?? "—"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
