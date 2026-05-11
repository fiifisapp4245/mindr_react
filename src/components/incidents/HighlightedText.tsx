export function HighlightedText({ text, highlights }: { text: string; highlights: string[] }) {
  type Part = string | { h: string };
  let parts: Part[] = [text];

  for (const hi of highlights) {
    const next: Part[] = [];
    for (const p of parts) {
      if (typeof p !== "string") { next.push(p); continue; }
      const idx = p.indexOf(hi);
      if (idx === -1) { next.push(p); continue; }
      if (idx > 0) next.push(p.slice(0, idx));
      next.push({ h: hi });
      if (idx + hi.length < p.length) next.push(p.slice(idx + hi.length));
    }
    parts = next;
  }

  return (
    <>
      {parts.map((p, i) =>
        typeof p === "string" ? (
          <span key={i}>{p}</span>
        ) : (
          <span key={i} style={{ color: "var(--color-brand)", fontWeight: 600 }}>
            {p.h}
          </span>
        )
      )}
    </>
  );
}
