# Running the frontend

This repo is **frontend only**. It talks to the Locify scoring API you run
yourself on port 8001.

```sh
cd web
npm install
npm run dev          # http://localhost:5173
```

`npm run dev` also works from this directory — [package.json](package.json) is a
shim that forwards to `web/`.

## The API contract it consumes

Three endpoints, and that is the whole surface:

| Endpoint | Used for |
| --- | --- |
| `GET /brands` | the brand selector |
| `POST /brands/{slug}/score` | every score, and the re-score after a rewrite |
| `GET /brands/{slug}/vocabulary` | explaining flagged phrases, and deciding what the rewriter may cut |

There is no `/health`, `/analyze` or `/rewrite`. Everything the UI shows beyond
the raw Report is derived on this side.

### `GET /brands` — two shapes, both handled

The API currently returns

```json
{"brands": [{"brand_id": "duolingo", "brand_name": "Duolingo", "warnings": []}]}
```

[api.js](web/src/api.js) normalises that — and the flat
`[{"id": 1, "name": "...", "slug": "..."}]` form — to `{id, name, slug}`, so
either shape works. `slug` is what the scoring routes are keyed by.

## CORS: why requests go through `/api`

The scoring API sends no `Access-Control-Allow-Origin`, so a browser on the Vite
origin cannot call `http://127.0.0.1:8001` directly — every request dies as a
CORS failure *before* it reaches the network.

Rather than change the API, [vite.config.js](web/vite.config.js) proxies
`/api/*` to it, which makes the calls same-origin. `src/api.js` therefore
defaults to the relative base `/api` and no `.env` is needed.

```sh
# point the proxy somewhere else
VITE_API_TARGET=http://127.0.0.1:9000 npm run dev
```

A **production build has no dev server and therefore no proxy** — deploying it
means either serving it from the same origin as the API, or configuring CORS on
the API and setting `VITE_API_BASE` to its absolute URL.

## What the frontend derives from the Report

The API returns a per-layer Report. The UI needs a flat view, so three modules
translate:

| Module | Job |
| --- | --- |
| [lib/adapt.js](web/src/lib/adapt.js) | Report → the object every component renders. Collapses the per-layer weights into one weight per sub-score, and renames the API's CONSISTENCY axis to the UI's FIDELITY. |
| [lib/spans.js](web/src/lib/spans.js) | Cliché *terms* → character *offsets* for the heat-map, plus six more deterministic rules. |
| [lib/rewriteLocal.js](web/src/lib/rewriteLocal.js) | The rewriter: phrase book, brand-specific cliché cuts, sentence splitting. Then re-scores via the real endpoint. |

The weight collapse is the load-bearing part. [scoring.js](web/src/lib/scoring.js)
re-blends the sub-scores as the sliders move, so the shipped weights must
reproduce the API's own overall figure when untouched — otherwise the gauge
disagrees with itself the moment a result lands. Verified against the live API:
scorer `consistency 19.8 / distinctiveness 40.2`, UI `fidelity 19.8 /
distinctiveness 40.3` (the 0.1 is the API's own per-layer rounding). The weights
are read from each layer's `contributions`, so nothing is hardcoded.

Nothing is invented to fill gaps: the API reports no engine/config/encoder
version, so the Table view shows brand, intended layer, the scorer's own
verdict and the tone judge instead.

## Things the UI derives rather than fetches

- **Status badge** — no `/health`, so it reflects `evidence.tone_judge` from the
  last real score.
- **Rewrite** — no `/rewrite`, so it runs in the browser: it deletes and
  substitutes, never invents, and the delta comes from re-scoring the new text
  through `POST /brands/{slug}/score`.
- **Notes card** — the API's per-layer verdicts, plus `nearest_brand_chunk` and
  `nearest_generic_chunk`, which the flat gauge would otherwise hide.
- **Brand selector** — every score is scoped to a slug, so there is no
  "no brand" option; there would be nothing to score against.

## Verifying

```sh
cd web
node scripts/verify-connection.mjs http://localhost:5173
```

Drives the real page in Chromium: brands, scoring, the seven sub-score bars,
heat-map offsets, per-layer verdicts, the table, and a full rewrite round trip.
It catches CORS failures, missing Report fields and `NaN` renders. Currently
12/12.
