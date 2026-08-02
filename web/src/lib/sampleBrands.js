import linguacore from "./sampleData/linguacore.json";
import trailforge from "./sampleData/trailforge.json";

/* Fixture brands for the "Autofill" control on Quick Start.
 *
 * Both JSON files are verbatim ready-to-POST bodies for
 * POST /brands/{id}/embeddings, copied from
 * Brand-distinctiveness/data/request_*_embeddings.json -- not hand-typed
 * here, so they can't drift from what the real backend actually expects.
 * Each one demonstrates a different generic_corpus path on purpose:
 *
 *   linguacore  -- generic_corpus.industry references an id that's assumed
 *                  already registered (the way most brands behave): no
 *                  `items`, so this exercises the "pick an existing
 *                  industry" path and would fail with unknown_industry
 *                  against a server where that id was never created.
 *   trailforge  -- generic_corpus.industry is being created for the first
 *                  time, so `items` is present: this exercises the "create
 *                  a new industry from competitor snippets" path.
 *
 * CORE_FIELD_KEYS is the subset Quick Start's form actually shows; everything
 * else in `assets` is a later-layer field (homepage, blog, case_study...)
 * that Quick Start doesn't have inputs for but is free to submit alongside
 * the six anyway, since /embeddings accepts any asset_type in one call. That
 * split is what QuickStartPage's applySample() uses to fill the visible
 * fields and carry the rest through to submission.
 */

export const CORE_FIELD_KEYS = ["name", "tagline", "mission", "vision", "values", "about"];

function toItem(raw) {
  return { text: raw.text ?? "", assetType: raw.asset_type ?? "homepage", sourceUrl: raw.source_url ?? "" };
}

function normalise(raw, label) {
  const { name: _name, tagline: _tagline, mission: _mission, vision: _vision, values: _values, about: _about, ...extraAssets } = raw.assets;
  return {
    label,
    brandName: raw.brand_name,
    coreFields: Object.fromEntries(CORE_FIELD_KEYS.map((k) => [k, raw.assets[k] ?? ""])),
    extraAssets,
    industryId: raw.generic_corpus.industry,
    industryItems: (raw.generic_corpus.items ?? []).map(toItem),
  };
}

export const SAMPLE_BRANDS = [
  normalise(linguacore, "Linguacore — B2B language assessment"),
  normalise(trailforge, "TrailForge — outdoor gear (new industry)"),
];
