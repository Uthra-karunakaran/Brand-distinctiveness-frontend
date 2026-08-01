/* Section 3 -- Writing Style & Tone -> Personality Profile.
 *
 * evidence.tone_input / tone_brand are five axes on a 0-10 scale, drawn as
 * five dial tiles: one small multiple per personality trait.
 *
 * Two earlier forms were wrong for different reasons. A knob on a track read
 * as a slider and invited people to drag it; a pair of bars per row was
 * honest but read as a spreadsheet. A dial is unmistakably an instrument --
 * something that reports a reading rather than accepts one.
 *
 * The two marks in each dial differ in SHAPE, not just colour: a straight
 * radial notch for the brand target, a filled dot for this copy. On the dark
 * surface the neutral notch grey and the warm status colours sit at ΔE 6.0
 * under protanopia, which is inside the band where colour alone is not
 * allowed to carry the distinction. Shape plus the printed numbers plus the
 * verdict label carry it instead.
 *
 * Colour here is a STATUS scale (on target / drifting / off), never a
 * categorical one, so it ships with an icon and a word every time. The one
 * interpretive rule this component adds is the match band -- within 1 point
 * is on target, 1-2.5 is drifting, beyond that is off -- and the legend says
 * so rather than leaving it implicit. `alignmentScore` is not computed here:
 * it is the API's own tone contribution value (identical across layers, since
 * tone is scored once per document), passed in by the caller so this
 * component never invents a number the scorer didn't produce.
 */

const AXES = [
  { key: "formal_casual", trait: "Formality", left: "Formal", right: "Casual" },
  { key: "serious_playful", trait: "Playfulness", left: "Serious", right: "Playful" },
  { key: "corporate_human", trait: "Warmth", left: "Corporate", right: "Human" },
  { key: "restrained_bold", trait: "Boldness", left: "Restrained", right: "Bold" },
  { key: "technical_accessible", trait: "Accessibility", left: "Technical", right: "Accessible" },
];

const MATCH_BAND = 1;
const DRIFT_BAND = 2.5;

/* Dial geometry. A half circle opening upwards: 0 on the scale is due left,
 * 10 is due right, so the sweep matches the left-word/right-word labels
 * underneath it. */
const R = 44;
const CX = 60;
const CY = 60;
const ARC = Math.PI * R;

/* The brand tick sits OUTSIDE the arc, on the bezel, starting 2px clear of the
 * track's outer edge. Crossing the track instead made the tick and the dot
 * merge into one unreadable blob whenever the two values were close -- which
 * is exactly the case the panel exists to show. */
const TICK_IN = R + 6;
const TICK_OUT = R + 13;
const TRACK = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

function polar(value, radius) {
  const t = Math.PI * (1 - Math.max(0, Math.min(10, value)) / 10);
  return { x: CX + radius * Math.cos(t), y: CY - radius * Math.sin(t) };
}

function verdictFor(diff, axis) {
  const size = Math.abs(diff);
  if (size <= MATCH_BAND) return { tone: "ok", icon: "✓", text: "On target" };
  const word = (diff > 0 ? axis.right : axis.left).toLowerCase();
  return {
    tone: size <= DRIFT_BAND ? "warn" : "bad",
    icon: diff > 0 ? "▸" : "◂",
    text: `${size.toFixed(1)} more ${word}`,
  };
}

function alignmentStatus(score) {
  if (score === null || score === undefined) return { tone: "none", text: "Not scored" };
  if (score >= 80) return { tone: "ok", text: "Closely on tone" };
  if (score >= 60) return { tone: "warn", text: "Mostly on tone" };
  if (score >= 40) return { tone: "warn", text: "Drifting off tone" };
  return { tone: "bad", text: "Off tone" };
}

export default function ToneAnalysis({ toneInput, toneBrand, biggestGap, alignmentScore }) {
  if (!toneInput || !toneBrand) return null;

  const rows = AXES.map((axis) => {
    const brand = toneBrand[axis.key] ?? 0;
    const input = toneInput[axis.key] ?? 0;
    return { axis, brand, input, verdict: verdictFor(input - brand, axis) };
  });

  const matches = rows.filter((r) => r.verdict.tone === "ok").length;
  const gapRow = rows.find((r) => r.axis.key === biggestGap);
  const status = alignmentStatus(alignmentScore);
  const hasScore = alignmentScore !== null && alignmentScore !== undefined;

  return (
    <div className="tone">
      {/* ── header: the one number, in plain words ── */}
      <div className="pl-summary">
        <div className="pl-score">
          <span className="pl-score-value">{hasScore ? Math.round(alignmentScore) : "—"}</span>
          <span className="pl-score-max">/100</span>
        </div>
        <div className="pl-score-body">
          <div className="pl-score-top">
            <span className="pl-score-label">Tone alignment</span>
            <span className={`pl-pill ${status.tone}`}>{status.text}</span>
          </div>
          <div className="pl-meter" role="presentation">
            <span
              className={`pl-meter-fill ${status.tone}`}
              style={{ width: `${hasScore ? Math.max(2, Math.min(100, alignmentScore)) : 0}%` }}
            />
          </div>
          <p className="pl-score-note">
            {matches} of {rows.length} personality traits land within a point of the brand
            {gapRow ? <>; the widest gap is <strong>{gapRow.axis.trait}</strong></> : null}.
          </p>
        </div>
      </div>

      {/* ── one dial per trait ── */}
      <div className="dials">
        {rows.map(({ axis, brand, input, verdict }) => {
          const isGap = axis.key === biggestGap;
          const notchIn = polar(brand, TICK_IN);
          const notchOut = polar(brand, TICK_OUT);
          const dot = polar(input, R);

          return (
            <div
              className={`dial ${verdict.tone}${isGap ? " flagged" : ""}`}
              key={axis.key}
              title={`${axis.trait} — ${axis.left} to ${axis.right} on a 0–10 scale. Brand ${brand.toFixed(1)}, your copy ${input.toFixed(1)}. ${verdict.text}.`}
            >
              <div className="dial-head">
                <span className="dial-trait">{axis.trait}</span>
                {isGap && <span className="dial-flag">Biggest gap</span>}
              </div>

              <svg
                className="dial-svg" viewBox="0 0 120 68" role="img"
                aria-label={`${axis.trait}: brand ${brand.toFixed(1)}, your copy ${input.toFixed(1)} on a 0 to 10 scale from ${axis.left} to ${axis.right}. ${verdict.text}.`}
              >
                <path className="dial-track" d={TRACK} />
                <path
                  className="dial-fill" d={TRACK}
                  style={{ strokeDasharray: ARC, strokeDashoffset: ARC * (1 - Math.max(0, Math.min(10, input)) / 10) }}
                />
                <line
                  className="dial-notch"
                  x1={notchIn.x} y1={notchIn.y} x2={notchOut.x} y2={notchOut.y}
                />
                <circle className="dial-dot" cx={dot.x} cy={dot.y} r="5" />
                <text className="dial-value" x={CX} y="55">{input.toFixed(1)}</text>
              </svg>

              <div className="dial-ends">
                <span>{axis.left}</span>
                <span>{axis.right}</span>
              </div>

              <div className="dial-foot">
                <span className={`dial-verdict ${verdict.tone}`}>
                  <span className="dial-verdict-icon" aria-hidden="true">{verdict.icon}</span>
                  {verdict.text}
                </span>
                <span className="dial-brand">Brand {brand.toFixed(1)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── legend: the two marks by shape, then the one interpretive rule ── */}
      <div className="pl-legend">
        <span><span className="pl-key-notch" /> Brand target</span>
        <span><span className="pl-key-dot" /> Your copy</span>
        <span className="pl-legend-rule">
          Dial colour: gap within 1 pt <span className="pl-key-swatch ok" /> on target ·
          1–2.5 <span className="pl-key-swatch warn" /> drifting ·
          over 2.5 <span className="pl-key-swatch bad" /> off
        </span>
      </div>

      <style>{`
        .tone { display: flex; flex-direction: column; gap: 18px; }

        /* ── summary ── */
        .pl-summary {
          display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
          padding: 16px 18px; border-radius: var(--r-md);
          background: var(--surface-sunken); border: 1px solid var(--line);
        }
        .pl-score { display: flex; align-items: baseline; gap: 2px; flex: none; }
        .pl-score-value {
          font-size: 38px; font-weight: 660; letter-spacing: -0.02em;
          color: var(--text); font-variant-numeric: tabular-nums; line-height: 1;
        }
        .pl-score-max { font-size: var(--t-small); color: var(--text-3); font-weight: 560; }
        .pl-score-body { flex: 1 1 220px; display: flex; flex-direction: column; gap: 7px; min-width: 0; }
        .pl-score-top { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .pl-score-label {
          font-size: var(--t-micro); font-weight: 660; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--text-3);
        }
        .pl-score-note { margin: 0; font-size: var(--t-small); color: var(--text-2); }
        .pl-score-note strong { color: var(--text); font-weight: 620; }

        .pl-meter { height: 6px; border-radius: var(--r-pill); background: var(--seq-track); overflow: hidden; }
        .pl-meter-fill {
          display: block; height: 100%; border-radius: var(--r-pill);
          background: var(--text-3); transition: width 700ms var(--ease);
        }
        .pl-meter-fill.ok { background: var(--positive); }
        .pl-meter-fill.warn { background: var(--series-2); }
        .pl-meter-fill.bad { background: var(--negative); }

        .pl-pill {
          font-size: var(--t-tiny); font-weight: 620; padding: 3px 10px;
          border-radius: var(--r-pill); border: 1px solid var(--line-strong);
          color: var(--text-2); background: var(--surface);
        }
        .pl-pill.ok { color: var(--positive); border-color: color-mix(in srgb, var(--positive) 32%, transparent); background: color-mix(in srgb, var(--positive) 9%, transparent); }
        .pl-pill.warn { color: var(--series-2); border-color: color-mix(in srgb, var(--series-2) 32%, transparent); background: color-mix(in srgb, var(--series-2) 9%, transparent); }
        .pl-pill.bad { color: var(--negative); border-color: color-mix(in srgb, var(--negative) 32%, transparent); background: color-mix(in srgb, var(--negative) 9%, transparent); }

        /* ── dial tiles ── */
        .dials {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(198px, 1fr)); gap: 12px;
        }
        .dial {
          --pl: var(--text-3);
          display: flex; flex-direction: column; gap: 8px;
          padding: 14px 14px 12px; border-radius: var(--r-md);
          border: 1px solid var(--line); background: var(--surface);
          transition: border-color 180ms var(--ease), background 180ms var(--ease),
                      box-shadow 180ms var(--ease);
        }
        .dial:hover { box-shadow: var(--e1); background: var(--surface-hover); }
        .dial.ok { --pl: var(--positive); }
        .dial.warn { --pl: var(--series-2); }
        .dial.bad { --pl: var(--negative); }
        .dial.flagged {
          border-color: color-mix(in srgb, var(--pl) 38%, transparent);
          background: color-mix(in srgb, var(--pl) 5%, var(--surface));
        }

        .dial-head { display: flex; align-items: center; gap: 7px; min-height: 18px; flex-wrap: wrap; }
        .dial-trait { font-size: var(--t-body); font-weight: 620; color: var(--text); }
        .dial-flag {
          font-size: var(--t-micro); font-weight: 660; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--pl);
          background: color-mix(in srgb, var(--pl) 12%, transparent);
          padding: 2px 7px; border-radius: var(--r-pill);
        }

        .dial-svg { display: block; width: 100%; height: auto; }
        .dial-track { fill: none; stroke: var(--seq-track); stroke-width: 8; stroke-linecap: round; }
        /* Butt cap, not round: with a round cap a near-zero reading paints a
           bulge past its own dot, so 0.6 rendered as a lozenge twice the size
           of the value it stood for. */
        .dial-fill {
          fill: none; stroke: var(--pl); stroke-width: 8; stroke-linecap: butt;
          transition: stroke-dashoffset 800ms var(--ease);
        }
        .dial-notch { stroke: var(--text-3); stroke-width: 2.6; stroke-linecap: round; }
        .dial-dot { fill: var(--pl); stroke: var(--surface); stroke-width: 2; }
        .dial.flagged .dial-dot { stroke: color-mix(in srgb, var(--pl) 5%, var(--surface)); }
        .dial-value {
          fill: var(--text); font-size: 20px; font-weight: 650; text-anchor: middle;
          font-variant-numeric: tabular-nums; letter-spacing: -0.02em;
        }

        .dial-ends {
          display: flex; justify-content: space-between; gap: 8px; margin-top: -4px;
          font-size: var(--t-tiny); color: var(--text-3); font-weight: 560;
        }

        .dial-foot {
          display: flex; flex-direction: column; gap: 2px;
          padding-top: 8px; border-top: 1px solid var(--grid);
        }
        .dial-verdict {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: var(--t-small); font-weight: 590; color: var(--pl);
          font-variant-numeric: tabular-nums;
        }
        .dial-verdict-icon {
          display: grid; place-items: center; width: 16px; height: 16px; flex: none;
          border-radius: 50%; font-size: 10px; line-height: 1;
          background: color-mix(in srgb, var(--pl) 14%, transparent);
        }
        .dial-brand {
          font-size: var(--t-tiny); color: var(--text-3); padding-left: 22px;
          font-variant-numeric: tabular-nums;
        }

        /* ── legend ── */
        .pl-legend {
          display: flex; align-items: center; gap: 8px 18px; flex-wrap: wrap;
          font-size: var(--t-tiny); color: var(--text-3);
          padding-top: 12px; border-top: 1px solid var(--grid);
        }
        .pl-legend > span { display: inline-flex; align-items: center; gap: 6px; }
        .pl-key-notch { width: 3px; height: 13px; border-radius: 2px; background: var(--text-3); }
        .pl-key-dot {
          width: 11px; height: 11px; border-radius: 50%; background: var(--text-2);
          border: 2px solid var(--surface); box-shadow: 0 0 0 1px var(--line-strong);
        }
        .pl-legend-rule { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; }
        .pl-key-swatch {
          display: inline-block; width: 8px; height: 8px; border-radius: 50%;
          vertical-align: -1px;
        }
        .pl-key-swatch.ok { background: var(--positive); }
        .pl-key-swatch.warn { background: var(--series-2); }
        .pl-key-swatch.bad { background: var(--negative); }

        @media (max-width: 560px) {
          .dials { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
          .pl-legend-rule { margin-left: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .dial-fill { transition: none; }
        }
      `}</style>
    </div>
  );
}
