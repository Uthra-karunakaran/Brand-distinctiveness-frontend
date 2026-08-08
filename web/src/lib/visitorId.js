/* Anonymous per-browser identifier -- not identity, not auth. A random UUID
 * generated once and cached in localStorage, sent as X-Visitor-Id so the
 * backends can count unique visitors and apply a second daily rate-limit
 * dimension alongside IP. Clearing browser storage resets it; nothing here
 * is meant to survive that.
 */

const STORAGE_KEY = "locify_visitor_id";

export function getVisitorId() {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    // Storage unavailable (private mode, disabled) -- fall back to a
    // per-page-load id rather than breaking requests.
    return crypto.randomUUID();
  }
}
