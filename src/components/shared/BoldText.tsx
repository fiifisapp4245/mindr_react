export function BoldText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 0 ? (
          <span key={i}>{p}</span>
        ) : (
          <strong key={i} style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
            {p}
          </strong>
        )
      )}
    </>
  );
}
