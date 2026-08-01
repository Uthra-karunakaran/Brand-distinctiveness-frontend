/* Quadrant metadata, shared by every section that renders one.
 *
 * Colours are the validated categorical tokens from theme.css
 * (--positive/--negative/--series-1/--series-2) with the standard 60/40 tint
 * against the surface -- not new arbitrary hexes. `insight` is the one line
 * of synthesis the flat numbers don't say on their own; it is a fixed mapping
 * off the API's own quadrant string, not a generated claim.
 */

export const QUADRANTS = {
  IDEAL: {
    icon: "🟢",
    label: "Ideal",
    color: "var(--positive)",
    insight:
      "This copy sounds like the brand and stands apart from the category — " +
      "the combination this scorer exists to find.",
  },
  "ON-BRAND BUT GENERIC": {
    icon: "🔵",
    label: "On-brand but generic",
    color: "var(--series-1)",
    insight:
      "This copy sounds like the brand, but doesn't yet say anything the " +
      "category isn't already saying.",
  },
  "UNIQUE BUT OFF-BRAND": {
    icon: "🟠",
    label: "Unique but off-brand",
    color: "var(--series-2)",
    insight:
      "This copy stands out from the category, but doesn't yet sound like " +
      "this brand.",
  },
  LOST: {
    icon: "🔴",
    label: "Lost",
    color: "var(--negative)",
    insight:
      "This copy is neither distinctly on-brand nor differentiated from the " +
      "category — it could be describing almost any competitor.",
  },
};

const FALLBACK = {
  icon: "⚪",
  label: "Unknown",
  color: "var(--text-3)",
  insight: "",
};

export function quadrantMeta(name) {
  const meta = QUADRANTS[name];
  if (!meta) return { ...FALLBACK, label: name || FALLBACK.label };
  return meta;
}

export function quadrantSoft(color) {
  return `color-mix(in srgb, ${color} 14%, transparent)`;
}

export function quadrantBorder(color) {
  return `color-mix(in srgb, ${color} 30%, transparent)`;
}
