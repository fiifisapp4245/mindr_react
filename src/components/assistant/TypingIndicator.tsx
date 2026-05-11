export function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm"
      style={{ backgroundColor: "var(--color-bg-elevated)", width: "fit-content" }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
          style={{ backgroundColor: "var(--color-brand)", animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  );
}
