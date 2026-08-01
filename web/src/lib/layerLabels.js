/* Display names for the API's raw layer keys ("identity" / "messaging" /
 * "voice"). Kept in one place so every component that shows a layer name --
 * LayerCard's title, LayerComparison's pillar, tooltip copy -- renders the
 * same word instead of three independently-typed copies drifting apart.
 */
export const LAYER_LABELS = {
  identity: "Brand Essence",
  messaging: "What You're Saying",
  voice: "How You Say It",
};

export function layerLabel(key) {
  return LAYER_LABELS[key] ?? key;
}
