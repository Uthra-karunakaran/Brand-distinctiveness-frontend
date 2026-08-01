/* Step 3 of onboarding: the extracted profile.
 *
 * This screen is shown as soon as the job carries *any* profile, which is
 * before the analysis has finished. Sections the server hasn't filled in yet
 * render as placeholders in their final position rather than being hidden, so
 * when the next poll lands the content appears in place instead of pushing
 * the page around. The strip at the top is the honest status: it says the
 * page is still filling in, and it goes away by itself.
 *
 * Nothing here is invented on the client. Every field is either what the user
 * typed or what the analysis returned.
 */

function Placeholder({ lines = 3 }) {
  return (
    <div className="bp-placeholder" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <span className="shimmer" key={i} style={{ width: `${100 - i * 14}%` }} />
      ))}
    </div>
  );
}

function Card({ title, note, children, span }) {
  return (
    <section className={`bp-card${span ? " wide" : ""}`}>
      <div className="bp-card-head">
        <h3>{title}</h3>
        {note && <span className="bp-card-note">{note}</span>}
      </div>
      {children}
    </section>
  );
}

export default function BrandPreview({ job, onScore, onEdit }) {
  const profile = job?.profile;
  if (!profile) return null;

  const ready = job.status === "ready";
  const initial = (profile.name || "?").trim().charAt(0).toUpperCase();
  const websites = profile.sources.filter((s) => s.kind === "website");
  const competitors = profile.sources.filter((s) => s.kind === "competitor");

  return (
    <div className="bp">
      {!ready && (
        <div className="bp-live">
          <span className="bp-live-dot" />
          <span className="bp-live-text">
            Still analysing — <strong>{job.progress}%</strong>. This page fills in as results land.
          </span>
          <span className="bp-live-meter"><span style={{ width: `${job.progress}%` }} /></span>
        </div>
      )}

      <header className="bp-head">
        <span className="bp-avatar" aria-hidden="true">{initial}</span>
        <div className="bp-head-copy">
          <span className="ob-eyebrow">Brand profile</span>
          <h2>{profile.name}</h2>
          {profile.tagline && <p className="bp-tagline">{profile.tagline}</p>}
        </div>
        <span className={`bp-status ${ready ? "ready" : "working"}`}>
          {ready ? "Analysis complete" : "Analysing…"}
        </span>
      </header>

      <div className="bp-grid">
        <Card title="Mission">
          {profile.mission
            ? <p className="bp-prose">{profile.mission}</p>
            : <p className="bp-empty">Not provided — you can add this later.</p>}
        </Card>

        <Card title="Vision">
          {profile.vision
            ? <p className="bp-prose">{profile.vision}</p>
            : <p className="bp-empty">Not provided — you can add this later.</p>}
        </Card>

        <Card title="Brand values" note={`${profile.values.length} captured`}>
          {profile.values.length
            ? (
              <div className="bp-chips">
                {profile.values.map((v) => <span className="bp-chip" key={v}>{v}</span>)}
              </div>
            )
            : <p className="bp-empty">None captured.</p>}
        </Card>

        <Card title="Recurring language" note="Pulled from your copy">
          {profile.keywords.length
            ? (
              <div className="bp-chips">
                {profile.keywords.map((k) => <span className="bp-chip quiet" key={k}>{k}</span>)}
              </div>
            )
            : <Placeholder lines={2} />}
        </Card>

        <Card title="Tone profile" note="Where the brand sits on five axes" span>
          {profile.tone
            ? (
              <div className="bp-tone">
                {profile.tone.map((a) => (
                  <div className="bp-tone-row" key={a.key}>
                    <span className="bp-tone-trait">{a.trait}</span>
                    <span className="bp-tone-end">{a.left}</span>
                    <span className="bp-tone-bar">
                      <span className="bp-tone-fill" style={{ width: `${(a.value / 10) * 100}%` }} />
                    </span>
                    <span className="bp-tone-end right">{a.right}</span>
                    <span className="bp-tone-val">{a.value.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )
            : <Placeholder lines={5} />}
        </Card>

        <Card title="Sources read" note={`${websites.length} of yours · ${competitors.length} competitor`} span>
          <ul className="bp-sources">
            {profile.sources.map((s) => (
              <li className={`bp-source ${s.state}`} key={s.url}>
                <span className={`bp-source-kind ${s.kind}`}>{s.kind === "website" ? "You" : "Category"}</span>
                <span className="bp-source-url" title={s.url}>{s.url.replace(/^https?:\/\//, "")}</span>
                <span className="bp-source-state">
                  {s.state === "done" ? `${s.pages} pages` : "Queued…"}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Scoring baseline" note="What future copy gets measured against" span>
          {profile.baseline
            ? (
              <div className="bp-baseline">
                <div className="bp-metric">
                  <span className="bp-metric-label">On-brand reference</span>
                  <span className="bp-metric-value">{profile.baseline.consistency}</span>
                  <span className="bp-metric-note">Median score for your own published copy</span>
                </div>
                <div className="bp-metric">
                  <span className="bp-metric-label">Stand-out reference</span>
                  <span className="bp-metric-value">{profile.baseline.distinctiveness}</span>
                  <span className="bp-metric-note">Distance from the category language we read</span>
                </div>
                <div className="bp-metric">
                  <span className="bp-metric-label">Indexed passages</span>
                  <span className="bp-metric-value">{profile.baseline.chunks}</span>
                  <span className="bp-metric-note">Searchable chunks now backing this brand</span>
                </div>
              </div>
            )
            : <Placeholder lines={2} />}
        </Card>
      </div>

      <div className="bp-actions">
        <button onClick={onScore} disabled={!ready}>
          {ready ? "Score copy against this brand" : "Finishing analysis…"}
        </button>
        <button className="ghost" onClick={onEdit}>Edit details</button>
      </div>

      <style>{`
        .bp { display: flex; flex-direction: column; gap: var(--gap); }

        .bp-live {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
          padding: 11px 16px; border-radius: var(--r-md);
          background: var(--series-1-soft);
          border: 1px solid color-mix(in srgb, var(--series-1) 26%, transparent);
        }
        .bp-live-dot {
          width: 8px; height: 8px; border-radius: 50%; background: var(--series-1); flex: none;
          animation: bp-blink 1.6s var(--ease) infinite;
        }
        @keyframes bp-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
        .bp-live-text { font-size: var(--t-small); color: var(--text-2); }
        .bp-live-text strong { color: var(--series-1); font-variant-numeric: tabular-nums; }
        .bp-live-meter {
          flex: 1 1 120px; height: 4px; border-radius: var(--r-pill);
          background: color-mix(in srgb, var(--series-1) 16%, transparent); overflow: hidden;
        }
        .bp-live-meter span {
          display: block; height: 100%; background: var(--series-1);
          transition: width 600ms var(--ease);
        }

        .bp-head {
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
          padding: 22px 24px; border-radius: var(--r-lg);
          background: var(--surface); border: 1px solid var(--line); box-shadow: var(--e1);
        }
        .bp-avatar {
          flex: none; width: 52px; height: 52px; border-radius: 14px;
          display: grid; place-items: center; font-size: 24px; font-weight: 660; color: #fff;
          background: linear-gradient(140deg,
            color-mix(in srgb, var(--series-1) 76%, #fff) 0%, var(--series-1) 100%);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
        }
        .bp-head-copy { flex: 1 1 220px; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .bp-head-copy h2 {
          margin: 0; font-size: 26px; font-weight: 660; letter-spacing: -0.02em; color: var(--text);
        }
        .bp-tagline { margin: 2px 0 0; font-size: var(--t-lead); color: var(--text-2); }
        .bp-status {
          flex: none; font-size: var(--t-tiny); font-weight: 620; padding: 5px 12px;
          border-radius: var(--r-pill); border: 1px solid var(--line-strong); color: var(--text-2);
        }
        .bp-status.ready {
          color: var(--positive); background: color-mix(in srgb, var(--positive) 9%, transparent);
          border-color: color-mix(in srgb, var(--positive) 32%, transparent);
        }
        .bp-status.working {
          color: var(--series-1); background: var(--series-1-soft);
          border-color: color-mix(in srgb, var(--series-1) 32%, transparent);
        }

        .bp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap); }
        .bp-card {
          background: var(--surface); border: 1px solid var(--line);
          border-radius: var(--r-lg); box-shadow: var(--e1); padding: 18px 20px;
          display: flex; flex-direction: column; gap: 12px; min-width: 0;
        }
        .bp-card.wide { grid-column: 1 / -1; }
        @media (max-width: 820px) {
          .bp-grid { grid-template-columns: 1fr; }
          .bp-card.wide { grid-column: auto; }
        }
        .bp-card-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
        .bp-card h3 {
          margin: 0; font-size: var(--t-micro); font-weight: 660; letter-spacing: 0.085em;
          text-transform: uppercase; color: var(--text-3);
        }
        .bp-card-note { font-size: var(--t-tiny); color: var(--text-3); text-align: right; }

        .bp-prose { margin: 0; font-size: var(--t-body); color: var(--text-2); line-height: 1.6; }
        .bp-empty { margin: 0; font-size: var(--t-small); color: var(--text-3); font-style: italic; }

        .bp-chips { display: flex; flex-wrap: wrap; gap: 7px; }
        .bp-chip {
          font-size: var(--t-small); font-weight: 560; padding: 4px 11px;
          border-radius: var(--r-pill); color: var(--series-1);
          background: var(--series-1-soft);
          border: 1px solid color-mix(in srgb, var(--series-1) 24%, transparent);
        }
        .bp-chip.quiet {
          color: var(--text-2); background: var(--surface-sunken); border-color: var(--line);
        }

        .bp-tone { display: flex; flex-direction: column; gap: 9px; }
        .bp-tone-row {
          display: grid; grid-template-columns: 108px 88px 1fr 88px 32px;
          align-items: center; gap: 10px;
        }
        .bp-tone-trait { font-size: var(--t-small); font-weight: 590; color: var(--text); }
        .bp-tone-end { font-size: var(--t-tiny); color: var(--text-3); }
        .bp-tone-end.right { text-align: right; }
        .bp-tone-bar { height: 8px; border-radius: 3px; background: var(--seq-track); overflow: hidden; }
        .bp-tone-fill {
          display: block; height: 100%; border-radius: 3px; min-width: 3px;
          background: var(--series-1); transition: width 700ms var(--ease);
        }
        .bp-tone-val {
          font-size: var(--t-tiny); color: var(--text-2); text-align: right;
          font-variant-numeric: tabular-nums;
        }
        @media (max-width: 640px) {
          .bp-tone-row { grid-template-columns: 1fr 1fr; row-gap: 4px; }
          .bp-tone-bar { grid-column: 1 / -1; }
          .bp-tone-val { grid-column: 2; }
        }

        .bp-sources { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
        .bp-source {
          display: flex; align-items: center; gap: 12px; padding: 9px 0;
          border-bottom: 1px solid var(--grid); font-size: var(--t-small);
        }
        .bp-source:last-child { border-bottom: none; }
        .bp-source.pending { opacity: 0.55; }
        .bp-source-kind {
          flex: none; width: 66px; font-size: var(--t-micro); font-weight: 660;
          letter-spacing: 0.05em; text-transform: uppercase;
        }
        .bp-source-kind.website { color: var(--series-1); }
        .bp-source-kind.competitor { color: var(--series-2); }
        .bp-source-url {
          flex: 1 1 auto; min-width: 0; color: var(--text-2);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .bp-source-state { flex: none; font-size: var(--t-tiny); color: var(--text-3); }

        .bp-baseline { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--gap); }
        @media (max-width: 700px) { .bp-baseline { grid-template-columns: 1fr; } }
        .bp-metric { display: flex; flex-direction: column; gap: 2px; }
        .bp-metric-label {
          font-size: var(--t-micro); font-weight: 660; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--text-3);
        }
        .bp-metric-value {
          font-size: 28px; font-weight: 640; color: var(--text);
          font-variant-numeric: tabular-nums; line-height: 1.15;
        }
        .bp-metric-note { font-size: var(--t-tiny); color: var(--text-3); }

        .bp-placeholder { display: flex; flex-direction: column; gap: 8px; }
        .bp-placeholder .shimmer { display: block; height: 11px; border-radius: 4px; }

        .bp-actions { display: flex; gap: 8px; flex-wrap: wrap; }
      `}</style>
    </div>
  );
}
