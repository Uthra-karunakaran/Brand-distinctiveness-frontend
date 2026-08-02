/* Display names for the API's raw layer keys ("identity" / "messaging" /
 * "voice"). Kept in one place so every component that shows a layer name --
 * LayerCard's title, LayerComparison's pillar, tooltip copy -- renders the
 * same word instead of three independently-typed copies drifting apart.
 */
export const LAYER_LABELS = {
  identity: "Brand Identity",
  messaging: "How Brand Communicates",
  voice: "How Brand Sounds",
};

export function layerLabel(key) {
  return LAYER_LABELS[key] ?? key;
}
