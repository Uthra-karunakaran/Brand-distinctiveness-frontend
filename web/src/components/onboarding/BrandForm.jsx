import { useMemo, useRef, useState } from "react";
import TagInput from "./TagInput";
import UrlList from "./UrlList";

/* Step 1 of onboarding: everything the analysis needs, on one page.
 *
 * One page rather than a wizard. There are only three groups of questions and
 * a wizard would hide two thirds of a five-minute task behind Next buttons,
 * which makes a short form feel longer than it is. The sticky footer carries
 * the completeness meter so the cost of finishing is always on screen.
 *
 * Validation is deliberately quiet until Submit is pressed: flagging an empty
 * required field while someone is still on their way to filling it in is
 * scolding them for typing in order.
 */

const VALUE_SUGGESTIONS = [
  "Playful", "Bold", "Trustworthy", "Human", "Precise",
  "Optimistic", "Irreverent", "Warm", "Rigorous", "Direct",
];

const EMPTY = {
  name: "", tagline: "", mission: "", vision: "",
  values: [], websites: [""], competitors: [""],
};

function tidyUrl(raw) {
  const s = raw.trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

function urlError(raw) {
  if (!raw.trim()) return null;
  try {
    const { hostname } = new URL(tidyUrl(raw));
    return /^[\w-]+(\.[\w-]+)+$/.test(hostname) ? null : "That doesn't look like a web address.";
  } catch {
    return "That doesn't look like a web address.";
  }
}

function listErrors(list) {
  return list.reduce((acc, value, i) => {
    const err = urlError(value);
    if (err) acc[i] = err;
    return acc;
  }, {});
}

export default function BrandForm({ initial, submitting, error, onSubmit, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [attempted, setAttempted] = useState(false);
  const nameRef = useRef(null);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const filledWebsites = form.websites.filter((u) => u.trim());

  const errors = useMemo(() => ({
    name: form.name.trim() ? null : "Your brand needs a name to file the analysis under.",
    websites: listErrors(form.websites),
    competitors: listErrors(form.competitors),
    websitesEmpty: filledWebsites.length ? null : "Add at least one page for us to read.",
  }), [form, filledWebsites.length]);

  const blocked = Boolean(
    errors.name || errors.websitesEmpty
    || Object.keys(errors.websites).length || Object.keys(errors.competitors).length,
  );

  // Six things make an analysis worth running; the meter counts them rather
  // than counting filled inputs, so adding a fourth URL doesn't read as progress.
  const essentials = [
    Boolean(form.name.trim()),
    Boolean(form.tagline.trim()),
    Boolean(form.mission.trim()),
    Boolean(form.vision.trim()),
    form.values.length > 0,
    filledWebsites.length > 0,
  ];
  const done = essentials.filter(Boolean).length;

  const submit = (e) => {
    e.preventDefault();
    setAttempted(true);
    if (blocked) {
      if (errors.name) nameRef.current?.focus();
      document.querySelector(".ob-error")?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    onSubmit({
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      mission: form.mission.trim(),
      vision: form.vision.trim(),
      values: form.values,
      websites: form.websites.map(tidyUrl).filter(Boolean),
      competitors: form.competitors.map(tidyUrl).filter(Boolean),
    });
  };

  return (
    <form className="ob-form" onSubmit={submit} noValidate>
      {/* ── 1. the basics ── */}
      <section className="ob-section">
        <div className="ob-section-head">
          <span className="ob-step-num">1</span>
          <div>
            <h3>The basics</h3>
            <p>What the brand is called, and how it introduces itself.</p>
          </div>
        </div>

        <div className="ob-grid">
          <div className="ob-field">
            <label className="ob-label" htmlFor="ob-name">
              Brand name <span className="ob-req">Required</span>
            </label>
            <input
              id="ob-name" ref={nameRef} className={attempted && errors.name ? "invalid" : ""}
              value={form.name} onChange={(e) => set({ name: e.target.value })}
              placeholder="Duolingo" autoComplete="organization"
              aria-invalid={Boolean(attempted && errors.name)}
            />
            {attempted && errors.name && <span className="ob-error">{errors.name}</span>}
          </div>

          <div className="ob-field">
            <label className="ob-label" htmlFor="ob-tagline">Tagline</label>
            <input
              id="ob-tagline" value={form.tagline}
              onChange={(e) => set({ tagline: e.target.value })}
              placeholder="The free, fun way to learn a language"
            />
            <span className="ob-hint">The one line you'd put under the logo.</span>
          </div>
        </div>
      </section>

      {/* ── 2. what you stand for ── */}
      <section className="ob-section">
        <div className="ob-section-head">
          <span className="ob-step-num">2</span>
          <div>
            <h3>What you stand for</h3>
            <p>The scorer reads these as the brand's own words about itself.</p>
          </div>
        </div>

        <div className="ob-field">
          <label className="ob-label" htmlFor="ob-mission">Mission</label>
          <textarea
            id="ob-mission" rows={3} value={form.mission}
            onChange={(e) => set({ mission: e.target.value })}
            placeholder="Why the company exists today, in a sentence or two."
          />
        </div>

        <div className="ob-field">
          <label className="ob-label" htmlFor="ob-vision">Vision</label>
          <textarea
            id="ob-vision" rows={3} value={form.vision}
            onChange={(e) => set({ vision: e.target.value })}
            placeholder="The world you're trying to bring about."
          />
        </div>

        <div className="ob-field">
          <span className="ob-label">Brand values</span>
          <TagInput
            values={form.values}
            suggestions={VALUE_SUGGESTIONS}
            onChange={(values) => set({ values })}
          />
        </div>
      </section>

      {/* ── 3. sources ── */}
      <section className="ob-section">
        <div className="ob-section-head">
          <span className="ob-step-num">3</span>
          <div>
            <h3>Where to learn from</h3>
            <p>Your pages teach us your voice. Competitor pages teach us what
              the category already sounds like, which is what "distinctive" is
              measured against.</p>
          </div>
        </div>

        <div className="ob-field">
          <UrlList
            label="Company website URLs"
            hint="Homepage, product pages, about page — the more the better."
            placeholder="yourbrand.com/product"
            values={form.websites}
            errors={attempted ? errors.websites : {}}
            onChange={(websites) => set({ websites })}
          />
          {attempted && errors.websitesEmpty && <span className="ob-error">{errors.websitesEmpty}</span>}
        </div>

        <div className="ob-field">
          <UrlList
            label="Competitor URLs"
            hint="Optional, but the stand-out score is sharper with three or more."
            placeholder="competitor.com"
            values={form.competitors}
            errors={attempted ? errors.competitors : {}}
            onChange={(competitors) => set({ competitors })}
          />
        </div>
      </section>

      {error && <p className="error ob-submit-error"><strong>Couldn't start the analysis.</strong> {error}</p>}

      {/* ── sticky action bar ── */}
      <div className="ob-actions">
        <div className="ob-progress">
          <div className="ob-progress-meter" role="presentation">
            <span style={{ width: `${(done / essentials.length) * 100}%` }} />
          </div>
          <span className="ob-progress-text">
            {done} of {essentials.length} essentials filled
            {done < essentials.length && <span className="ob-progress-sub"> — the rest are optional</span>}
          </span>
        </div>

        <div className="ob-actions-buttons">
          {onCancel && (
            <button type="button" className="quiet" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
          )}
          <button type="submit" disabled={submitting}>
            {submitting ? (<><span className="spinner" />Submitting…</>) : "Analyse brand"}
          </button>
        </div>
      </div>

      <style>{`
        .ob-form { display: flex; flex-direction: column; gap: var(--gap); }

        .ob-section {
          background: var(--surface); border: 1px solid var(--line);
          border-radius: var(--r-lg); box-shadow: var(--e1);
          padding: 22px 24px; display: flex; flex-direction: column; gap: 18px;
        }
        .ob-section-head { display: flex; gap: 12px; align-items: flex-start; }
        .ob-section-head h3 {
          margin: 0 0 3px; font-size: var(--t-h3); font-weight: 640; color: var(--text);
        }
        .ob-section-head p {
          margin: 0; font-size: var(--t-small); color: var(--text-2); max-width: 64ch;
        }
        .ob-step-num {
          flex: none; width: 24px; height: 24px; border-radius: 50%;
          display: grid; place-items: center; margin-top: 1px;
          font-size: var(--t-tiny); font-weight: 660;
          background: var(--series-1-soft); color: var(--series-1);
        }

        .ob-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap); }
        @media (max-width: 760px) { .ob-grid { grid-template-columns: 1fr; } }

        .ob-req {
          font-size: var(--t-micro); font-weight: 660; letter-spacing: 0.05em;
          text-transform: uppercase; color: var(--text-3); margin-left: 6px;
        }

        .ob-form input[type="text"], .ob-form input:not([type]) {
          height: 40px; padding: 0 12px; border-radius: var(--r-md);
          border: 1px solid var(--line-strong); background: var(--surface-sunken);
          color: var(--text); font: 400 var(--t-body)/1.4 var(--font);
          transition: border-color 140ms var(--ease), background 140ms var(--ease);
        }
        .ob-form input::placeholder, .ob-form textarea::placeholder { color: var(--text-3); }
        .ob-form input:focus { outline: none; border-color: var(--series-1); background: var(--surface); }
        .ob-form input.invalid { border-color: var(--negative); }
        .ob-form textarea { min-height: 0; font-size: var(--t-body); }

        .ob-submit-error { margin-top: 0; }

        /* Sticky so the meter and the submit stay reachable in a long form. */
        .ob-actions {
          position: sticky; bottom: 0; z-index: 5;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; flex-wrap: wrap;
          padding: 14px 18px; border-radius: var(--r-lg);
          background: color-mix(in srgb, var(--surface) 92%, transparent);
          backdrop-filter: saturate(180%) blur(12px);
          -webkit-backdrop-filter: saturate(180%) blur(12px);
          border: 1px solid var(--line-strong); box-shadow: var(--e2);
        }
        .ob-progress { display: flex; flex-direction: column; gap: 6px; flex: 1 1 220px; min-width: 0; }
        .ob-progress-meter {
          height: 5px; border-radius: var(--r-pill); background: var(--seq-track); overflow: hidden;
        }
        .ob-progress-meter span {
          display: block; height: 100%; border-radius: var(--r-pill);
          background: var(--series-1); transition: width 320ms var(--ease);
        }
        .ob-progress-text { font-size: var(--t-tiny); color: var(--text-2); }
        .ob-progress-sub { color: var(--text-3); }
        .ob-actions-buttons { display: flex; align-items: center; gap: 8px; flex: none; }
      `}</style>
    </form>
  );
}
