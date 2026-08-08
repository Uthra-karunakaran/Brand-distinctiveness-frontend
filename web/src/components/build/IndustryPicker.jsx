import { useMemo, useState } from "react";

/* generic_corpus.industry, shared by Quick Start (compact) and the standalone
 * Competitors screen (full).
 *
 * Two paths, matching the contract exactly:
 *
 *   - PRIMARY: pick one of the industries GET /industries already knows about.
 *     `items` must not be sent with this -- there is no update/append route,
 *     so re-pasting snippets against an id that already exists just gets
 *     silently ignored by the job (industry_corpus_ignored). The UI enforces
 *     this by construction: picking an existing id clears `items` and hides
 *     the snippet editor, rather than leaving a form open that implies an
 *     edit the backend cannot perform.
 *
 *   - CUSTOM: type an id nothing in the list currently uses, and paste
 *     competitor snippets to seed it. This only ever does something the
 *     first time that id is created -- once it exists, it moves into the
 *     PRIMARY path like any preset.
 *
 * `value` is the shared shape { id, items } that goes straight into the
 * embeddings payload's generic_corpus, and `assetTypes` is the flattened
 * list from GET /schema/assets -- a snippet's asset_type must be one of
 * those, never a hand-typed string, or it comes back as unmapped_asset_type.
 */
export default function IndustryPicker({ industries, assetTypes, value, onChange, compact = false, error }) {
  const known = useMemo(() => new Set(industries.map((i) => i.industry_id)), [industries]);
  const isKnownSelection = value.id && known.has(value.id);
  const isCustomDraft = value.id !== null && !isKnownSelection;

  const [showCustom, setShowCustom] = useState(isCustomDraft);

  const selectExisting = (id) => {
    setShowCustom(false);
    onChange({ id: id || null, items: null });
  };

  const startCustom = () => {
    setShowCustom(true);
    onChange({ id: "", items: [] });
  };

  const setCustomId = (id) => onChange({ ...value, id: id.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_") });

  const items = value.items ?? [];
  const setItems = (items) => onChange({ ...value, items });
  const addItem = () => setItems([...items, { text: "", assetType: assetTypes[0] ?? "homepage" }]);
  const updateItem = (i, patch) => setItems(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const removeItem = (i) => setItems(items.filter((_, j) => j !== i));

  return (
    <div className="indp">
      {!showCustom && (
        <div className="bf-field">
          <label className="bf-label" htmlFor="indp-select">
            Industry <span className="bf-req">Required</span>
          </label>
          <select
            id="indp-select"
            value={isKnownSelection ? value.id : ""}
            onChange={(e) => selectExisting(e.target.value)}
            className={error ? "invalid" : ""}
          >
            <option value="" disabled>Choose the category this brand competes in…</option>
            {industries.map((ind) => (
              <option key={ind.industry_id} value={ind.industry_id}>
                {ind.industry_id.replace(/_/g, " ")} · {ind.chunk_count} chunks
                {ind.brands_using?.length ? ` · e.g. ${ind.brands_using[0]}` : ""}
              </option>
            ))}
          </select>
          <span className="bf-hint">
            This is what "stands out from the category" is measured against.
          </span>
          {error && <span className="bf-error">{error}</span>}

          <button type="button" className="quiet indp-toggle" onClick={startCustom}>
            Don't see your industry? Create one from competitor snippets →
          </button>
        </div>
      )}

      {showCustom && (
        <div className="indp-custom">
          <div className="bf-field">
            <label className="bf-label" htmlFor="indp-custom-id">
              New industry id <span className="bf-req">Required</span>
            </label>
            <input
              id="indp-custom-id" type="text" value={value.id ?? ""}
              onChange={(e) => setCustomId(e.target.value)}
              placeholder="language_learning_edtech"
              className={error ? "invalid" : ""}
            />
            <span className="bf-hint">
              Lowercase, underscores only — this becomes the permanent id other brands in the
              same category will reuse. It can only be created once.
            </span>
            {error && <span className="bf-error">{error}</span>}
          </div>

          <div className="bf-field">
            <span className="bf-label">Competitor snippets</span>
            <span className="bf-hint">
              Paste a few passages of competitor copy. This only takes effect the moment this id
              is created — there's no way to add more to it later.
            </span>

            <div className="indp-items">
              {items.map((item, i) => (
                <div className="indp-item" key={i}>
                  <textarea
                    rows={3} value={item.text}
                    placeholder="Paste a competitor's homepage, ad, or product copy…"
                    aria-label={`Competitor snippet ${i + 1}`}
                    onChange={(e) => updateItem(i, { text: e.target.value })}
                  />
                  <div className="indp-item-meta">
                    <select
                      aria-label={`Snippet ${i + 1} type`}
                      value={item.assetType}
                      onChange={(e) => updateItem(i, { assetType: e.target.value })}
                    >
                      {assetTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                    </select>
                    <button
                      type="button" className="quiet indp-item-remove"
                      onClick={() => removeItem(i)} aria-label={`Remove snippet ${i + 1}`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="ghost" onClick={addItem}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M6 2.2v7.6M2.2 6h7.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Add snippet
            </button>
          </div>

          {!compact && (
            <button type="button" className="quiet indp-toggle" onClick={() => selectExisting(null)}>
              ← Choose an existing industry instead
            </button>
          )}
          {compact && industries.length > 0 && (
            <button type="button" className="quiet indp-toggle" onClick={() => selectExisting(null)}>
              ← Back to the list
            </button>
          )}
        </div>
      )}

      <style>{`
        .indp { display: flex; flex-direction: column; gap: 4px; }
        .indp-toggle {
          align-self: flex-start; height: auto; min-height: 26px; padding: 3px 0;
          font-size: var(--t-tiny); white-space: normal; text-align: left; line-height: 1.4;
        }
        .indp-custom { display: flex; flex-direction: column; gap: 16px; }

        .indp-items { display: flex; flex-direction: column; gap: 10px; }
        .indp-item {
          display: flex; flex-direction: column; gap: 8px;
          padding: 12px; border-radius: var(--r-md); border: 1px solid var(--line);
          background: var(--surface-sunken);
        }
        .indp-item textarea {
          width: 100%; padding: 10px 12px; border-radius: var(--r-sm);
          border: 1px solid var(--line-strong); background: var(--surface);
          color: var(--text); font: 400 var(--t-body)/1.5 var(--font); resize: vertical;
        }
        .indp-item textarea:focus { outline: none; border-color: var(--series-1); }
        .indp-item-meta { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .indp-item-meta select { flex: none; height: 32px; font-size: var(--t-tiny); }
        .indp-item-meta input {
          flex: 1 1 160px; height: 32px; padding: 0 10px; border-radius: var(--r-sm);
          border: 1px solid var(--line-strong); background: var(--surface);
          color: var(--text); font-size: var(--t-tiny);
        }
        .indp-item-meta input:focus { outline: none; border-color: var(--series-1); }
        .indp-item-remove { height: 32px; padding: 0 8px; font-size: var(--t-tiny); color: var(--negative); }
      `}</style>
    </div>
  );
}
