import { useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { fetchBrands } from "./api";
import ImageClassifier from "./components/ImageClassifier";
import ScorerPage from "./pages/ScorerPage";
import BuildingPage from "./pages/build/BuildingPage";
import CompetitorsPage from "./pages/build/CompetitorsPage";
import EnrichHubPage from "./pages/build/EnrichHubPage";
import QuickStartPage from "./pages/build/QuickStartPage";
import ReviewPage from "./pages/build/ReviewPage";

/* The app shell: topbar (shared by every route) plus the router. The scorer
 * (existing GET /brands + POST /brands/{slug}/score, still slug-scoped) lives
 * at "/"; the seven-endpoint brand-build flow lives under /brands/*. They are
 * two different backends today -- the scorer's /brands is unrelated to the
 * build flow's POST /brands -- and are kept as two page trees rather than
 * threaded together until the scorer is migrated onto brand_id itself. */

const THEMES = [
  {
    value: "auto",
    label: "System",
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1.9" y="2.6" width="12.2" height="8.6" rx="1.6" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5.5 13.6h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: "light",
    label: "Light",
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="3.1" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M8 1.4v1.5M8 13.1v1.5M1.4 8h1.5M13.1 8h1.5M3.3 3.3l1.1 1.1M11.6 11.6l1.1 1.1M12.7 3.3l-1.1 1.1M4.4 11.6l-1.1 1.1"
          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M13.4 9.9A5.9 5.9 0 0 1 6.1 2.6a5.9 5.9 0 1 0 7.3 7.3z"
          stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function App() {
  const [brandId, setBrandId] = useState(null);
  const [brands, setBrands] = useState([]);
  const [theme, setTheme] = useState("auto");

  const location = useLocation();
  const navigate = useNavigate();
  const onScorer = location.pathname === "/";

  useEffect(() => {
    fetchBrands().then((list) => {
      setBrands(list);
      if (list.length) setBrandId(list[0].id);
    });
  }, []);

  const brand = useMemo(() => brands.find((b) => b.id === brandId), [brands, brandId]);

  useEffect(() => {
    if (theme === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="wordmark" style={{ textDecoration: "none", color: "inherit" }}>
            {/* Same geometry as public/favicon.svg -- keep the two in sync. */}
            <span className="mark" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 32 32" fill="none">
                <mask id="wordmark-cut">
                  <rect width="32" height="32" fill="#fff" />
                  <circle cx="22.4" cy="9.6" r="5.9" fill="#000" />
                </mask>
                <g mask="url(#wordmark-cut)">
                  <circle cx="16" cy="16" r="9" stroke="#fff" strokeOpacity=".52" strokeWidth="2.6" />
                  <circle cx="16" cy="16" r="2.5" fill="#fff" fillOpacity=".38" />
                </g>
                <circle cx="22.4" cy="9.6" r="4.1" fill="#fff" />
              </svg>
            </span>
            Locify
          </Link>

          <span className="spacer" />

          {/* The brand picker belongs to the scorer; the build flow has its
              own brand-scoped URL and doesn't need a second selector. */}
          {onScorer && (
            <>
              {/* Brand: a native select kept for keyboard and mobile behaviour,
                  wearing a leading icon so it reads as "which brand" without a
                  separate uppercase label taking up the bar. */}
              <label className="field" title="Brand to score against">
                <span className="field-icon" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="5.4" stroke="currentColor" strokeWidth="1.4" />
                    <circle cx="8" cy="8" r="1.7" fill="currentColor" />
                  </svg>
                </span>
                <select
                  value={brandId ?? ""}
                  onChange={(e) => setBrandId(Number(e.target.value))}
                  aria-label="Brand"
                  disabled={!brands.length}
                >
                  {!brands.length && <option value="">Loading…</option>}
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </label>

              <button className="ghost" onClick={() => navigate("/brands/new")}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M6 2.2v7.6M2.2 6h7.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                Add brand
              </button>

              <button className="ghost" onClick={() => navigate("/classifier")}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
                  <circle cx="6" cy="6.5" r="1.3" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M3.4 12.2 7 8.4l2 2 2.3-2.6 1.3 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Logo classifier
              </button>
            </>
          )}

          {/* Theme: three states, all visible at once. A dropdown hid two of
              them behind a click for a control people flip constantly. */}
          <div className="seg" role="group" aria-label="Theme">
            {THEMES.map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                className="seg-btn"
                aria-pressed={theme === value}
                aria-label={`${label} theme`}
                title={`${label} theme`}
                onClick={() => setTheme(value)}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<ScorerPage brand={brand} />} />
        <Route path="/classifier" element={<main className="page"><ImageClassifier onBack={() => navigate("/")} /></main>} />
        <Route path="/brands/new" element={<QuickStartPage />} />
        <Route path="/brands/:brandId/quick-start" element={<QuickStartPage />} />
        <Route path="/brands/:brandId/building" element={<BuildingPage />} />
        <Route path="/brands/:brandId/enrich" element={<EnrichHubPage />} />
        <Route path="/brands/:brandId/competitors" element={<CompetitorsPage />} />
        <Route path="/brands/:brandId/review" element={<ReviewPage />} />
      </Routes>
    </>
  );
}
