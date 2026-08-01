import { useEffect, useRef, useState } from "react";

/* A single-value progress ring. Animates on mount and on value change by
 * transitioning stroke-dashoffset -- the arc sweeps in rather than appearing,
 * which is what makes three of these read as a dashboard rather than a
 * spec sheet. */
export default function CircularProgress({
  value, size = 128, thickness = 10, color = "var(--series-1)", digits = 0, suffix = "",
}) {
  const [display, setDisplay] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setDisplay(value ?? 0));
    mounted.current = true;
    return () => cancelAnimationFrame(id);
  }, [value]);

  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, display ?? 0));
  const offset = c * (1 - pct / 100);

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--seq-track)" strokeWidth={thickness}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={thickness} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="ring-arc"
        />
      </svg>
      <div className="ring-center">
        <span className="ring-value">
          {value === null || value === undefined ? "—" : value.toFixed(digits)}
          {value === null || value === undefined ? "" : <span className="ring-suffix">{suffix}</span>}
        </span>
      </div>
      <style>{`
        .ring { position: relative; display: inline-grid; place-items: center; flex: none; }
        .ring svg { position: absolute; inset: 0; }
        .ring-arc { transition: stroke-dashoffset 900ms var(--ease); }
        .ring-center {
          position: relative; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
        }
        .ring-value {
          font-size: 30px; font-weight: 640; letter-spacing: -0.02em;
          line-height: 1; font-variant-numeric: tabular-nums; color: var(--text);
        }
        .ring-suffix { font-size: 0.5em; font-weight: 620; color: var(--text-3); margin-left: 1px; }
        @media (prefers-reduced-motion: reduce) { .ring-arc { transition: none; } }
      `}</style>
    </div>
  );
}
