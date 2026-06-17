import { useState, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

interface Props {
  description: string;
  source: string;
  thresholdLabel: string;
}

const TIP_W = 260;

export function InfoTooltip({ description, source, thresholdLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, above: true, arrowLeft: 130 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  function calcPos() {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const tipH = 120; // conservative height estimate
    const above = r.top > tipH + 16;

    let rawLeft = r.left + r.width / 2 - TIP_W / 2;
    const clampedLeft = Math.max(8, Math.min(rawLeft, window.innerWidth - TIP_W - 8));
    // keep arrow pointed at the trigger button regardless of edge clamping
    const arrowLeft = Math.max(12, Math.min(r.left + r.width / 2 - clampedLeft, TIP_W - 12));

    const top = above ? r.top - tipH - 10 : r.bottom + 10;
    setPos({ top, left: clampedLeft, above, arrowLeft });
  }

  function show() { calcPos(); setOpen(true); }
  function hide() { setOpen(false); }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="More information"
        aria-describedby={open ? id : undefined}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full transition-opacity focus:outline-none"
        style={{
          color: 'var(--color-text-muted)',
          opacity: open ? 1 : 0.45,
          boxShadow: open ? '0 0 0 2px var(--color-brand)' : undefined,
          flexShrink: 0,
        }}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={(e) => e.stopPropagation()} // prevent card-level click navigation
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Escape') hide();
        }}
      >
        <Info size={11} />
      </button>

      {open &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: TIP_W,
              zIndex: 9999,
              pointerEvents: 'none',
            }}
          >
            {/* Arrow caret */}
            <div
              style={{
                position: 'absolute',
                [pos.above ? 'bottom' : 'top']: -5,
                left: pos.arrowLeft,
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                ...(pos.above
                  ? { borderTop: '5px solid rgba(255,255,255,0.08)' }
                  : { borderBottom: '5px solid rgba(255,255,255,0.08)' }),
              }}
            />
            {/* Tooltip surface */}
            <div
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '10px 12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              <p style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--color-text-primary)', marginBottom: 6 }}>
                {description}
              </p>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                Source:{' '}
                <span style={{ color: 'var(--color-text-primary)' }}>{source}</span>
              </p>
              <p style={{ fontSize: 11, color: 'var(--color-brand)' }}>{thresholdLabel}</p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
