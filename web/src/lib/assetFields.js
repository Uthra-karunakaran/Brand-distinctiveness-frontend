/* Presentation metadata for asset keys that GET /schema/assets only names.
 *
 * The schema is authoritative for WHICH keys exist and which layer they
 * belong to; it says nothing about how to label them or whether a key takes
 * one string or a list. That distinction has to live somewhere, so it lives
 * here, in one small table, rather than guessed inline by every form that
 * needs it. An unlisted key still renders -- title-cased, single-value,
 * placeholder-only -- so a schema addition never breaks the form, it just
 * looks a little plainer until someone adds an entry.
 */

const FIELDS = {
  name: { label: "Brand name", multi: false, placeholder: "Linguacore" },
  tagline: { label: "Tagline", multi: false, placeholder: "The one line you'd put under the logo." },
  mission: { label: "Mission", multi: false, area: true, placeholder: "Why the company exists today, in a sentence or two." },
  vision: { label: "Vision", multi: false, area: true, placeholder: "The world you're trying to bring about." },
  values: { label: "Brand values", multi: false, area: true, placeholder: "What the brand refuses to compromise on." },
  about: { label: "About", multi: false, area: true, placeholder: "How the brand introduces itself, in its own words." },
  founder_story: { label: "Founder story", multi: false, area: true, placeholder: "Why this got started, told the way the brand tells it." },

  homepage: { label: "Homepage copy", multi: true, placeholder: "Paste the text of your homepage." },
  product_page: { label: "Product page copy", multi: true, placeholder: "Paste the text of a product page." },
  landing_page: { label: "Landing page copy", multi: true, placeholder: "Paste the text of a landing page." },
  cta: { label: "Calls to action", multi: true, placeholder: "\"Start your free trial\"" },
  email: { label: "Email copy", multi: true, placeholder: "Paste a marketing or lifecycle email." },

  blog: { label: "Blog posts", multi: true, placeholder: "Paste a blog post." },
  social: { label: "Social posts", multi: true, placeholder: "Paste a social caption or thread." },
  ad: { label: "Ad copy", multi: true, placeholder: "Paste an ad's headline and body." },
  support_doc: { label: "Support docs", multi: true, placeholder: "Paste a help-center article." },
  job_post: { label: "Job posts", multi: true, placeholder: "Paste a job listing." },

  sales_deck: { label: "Sales deck copy", multi: true, placeholder: "Paste slide text from a sales deck." },
  investor_deck: { label: "Investor deck copy", multi: true, placeholder: "Paste slide text from an investor deck." },
  comparison_page: { label: "Comparison page copy", multi: true, placeholder: "Paste a \"vs.\" or comparison page." },

  case_study: { label: "Case studies", multi: true, placeholder: "Paste a case study." },
  testimonial: { label: "Testimonials", multi: true, placeholder: "Paste a customer quote." },
  review: { label: "Reviews", multi: true, placeholder: "Paste a review." },
};

const LAYER_META = {
  identity: { label: "Brand Identity", blurb: "The words the brand uses about itself." },
  messaging: { label: "How Brand Communicates", blurb: "How the product is talked about across owned pages." },
  voice: { label: "How Brand Sounds", blurb: "How the brand sounds in the wild, day to day." },
  positioning: { label: "Positioning", blurb: "How the brand argues its place in the market." },
  proof: { label: "Proof", blurb: "Third-party evidence. Collected, but doesn't move a score." },
};

function titleCase(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function fieldMeta(key) {
  return FIELDS[key] ?? { label: titleCase(key), multi: true, placeholder: `Paste ${titleCase(key).toLowerCase()}.` };
}

export function layerMeta(layer) {
  return LAYER_META[layer] ?? { label: titleCase(layer), blurb: "" };
}
