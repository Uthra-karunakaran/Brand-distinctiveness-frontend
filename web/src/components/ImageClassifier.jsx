import { useCallback, useEffect, useRef, useState } from "react";
import { searchByImage } from "../lib/classifierApi";

const STAGE_LABEL = {
  searching: "Searching for matches…",
};

// Google's Drive-thumbnail CDN (lh3.googleusercontent.com) rate-limits bursts
// of anonymous requests with 429s when several thumbnails load at once, and
// occasionally 403s a single file outright. Stagger each thumbnail's request
// by rank and retry transient failures with backoff before giving up.
const THUMB_STAGGER_MS = 250;
const THUMB_RETRY_DELAYS_MS = [1000, 3000, 6000];

function DriveThumb({ src, alt, rank, className }) {
  const [attempt, setAttempt] = useState(-1); // -1 = not started (staggering)
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setAttempt(-1);
    setFailed(false);
    const t = setTimeout(() => setAttempt(0), rank * THUMB_STAGGER_MS);
    return () => clearTimeout(t);
  }, [src, rank]);

  const onError = useCallback(() => {
    setAttempt((prev) => {
      const next = prev + 1;
      if (next >= THUMB_RETRY_DELAYS_MS.length) {
        setFailed(true);
        return prev;
      }
      return next;
    });
  }, []);

  if (attempt < 0) return <span className={`${className} thumb-pending`} />;
  if (failed) return <span className={`${className} thumb-broken`}>{alt?.[0]?.toUpperCase() ?? "?"}</span>;

  return (
    <img
      key={attempt}
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setTimeout(onError, THUMB_RETRY_DELAYS_MS[attempt])}
    />
  );
}

export default function ImageClassifier({ onBack }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [stage, setStage] = useState("idle"); // idle | searching | done
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const pickFile = useCallback((f) => {
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setResult(null);
    setError(null);
  }, []);

  const clear = useCallback(() => {
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setResult(null);
    setError(null);
    setStage("idle");
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      pickFile(e.dataTransfer.files?.[0]);
    },
    [pickFile],
  );

  const run = useCallback(async () => {
    if (!file) return;
    setError(null);
    setResult(null);
    try {
      setStage("searching");
      const data = await searchByImage(file, 5);
      setResult(data);
      setStage("done");
    } catch (e) {
      setError(e.message);
      setStage("idle");
    }
  }, [file]);

  const busy = stage === "searching";

  return (
    <div className="grid">
      {onBack && (
        <div className="col-12">
          <button className="quiet bf-back" onClick={onBack}>← Back</button>
        </div>
      )}

      <div className="col-12">
        <div className="card">
          <div className="card-head">
            <h2>Upload a logo to find its closest matches</h2>
            {/* <span className="sub">Upload a logo to find its closest matches</span> */}
          </div>

          

          <div
            className={`dropzone${previewUrl ? " has-image" : ""}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            {previewUrl ? (
              <img src={previewUrl} alt="Selected upload" className="dropzone-preview" />
            ) : (
              <span className="dropzone-hint">Drop an image here, or click to choose one</span>
            )}
          </div>

          <div className="run-row">
            <button onClick={run} disabled={!file || busy}>
              {busy ? (
                <>
                  <span className="spinner" />
                  {STAGE_LABEL[stage]}
                </>
              ) : (
                "Classify"
              )}
            </button>
            {file && !busy && (
              <button className="quiet" onClick={clear}>
                Clear
              </button>
            )}
          </div>

          {error && (
            <p className="error">
              <strong>Couldn't classify that.</strong> {error}
            </p>
          )}
        </div>
      </div>

      {result && (
        <div className="col-12">
          <div className="card">
            <div className="card-head">
              <h2>Matches</h2>
              <span className="sub">{result.matches?.length ?? 0} results</span>
            </div>
            <div className="match-list">
              {(result.matches ?? []).map((m) => (
                <a key={m.rank} className="match" href={m.drive_url} target="_blank" rel="noreferrer">
                  <span className="match-rank">#{m.rank}</span>
                  <DriveThumb className="match-thumb" src={m.drive_url} alt={m.file_name} rank={m.rank} />
                  <span className="match-body">
                    <strong>{(m.logo_names ?? []).join(", ") || m.file_name}</strong>
                    <span className="match-file">{m.file_name}</span>
                  </span>
                  <span className="match-score">
                    {/* <span className="match-score-bar">
                      <span style={{ width: `${Math.round(m.similarity * 100)}%` }} />
                    </span> */}
                    <span className="match-score-value">{(m.similarity * 100).toFixed(1)}%</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .bf-back { align-self: flex-start; height: 30px; padding: 0 6px; margin-bottom: -8px; color: var(--text-2); }

        .dropzone {
          display: flex; align-items: center; justify-content: center;
          min-height: 200px; border: 1.5px dashed var(--line-strong);
          border-radius: var(--r-md); background: var(--surface-sunken);
          cursor: pointer; padding: 16px; margin-top: 4px;
              margin-bottom: 15px;
        }
        .dropzone:hover { background: var(--surface-hover); }
        .dropzone.has-image { padding: 8px; }
        .dropzone-hint { color: var(--text-3); font-size: var(--t-small); }
        .dropzone-preview { max-height: 220px; max-width: 100%; border-radius: var(--r-sm); object-fit: contain; }

        .match-list { display: flex; flex-direction: column; gap: 10px; }
        .match {
          display: flex; align-items: center; gap: 12px; padding: 10px 12px;
          border: 1px solid var(--line); border-radius: var(--r-md);
          background: var(--surface-sunken); text-decoration: none; color: inherit;
        }
        .match:hover { background: var(--surface-hover); }
        .match-rank { flex: none; width: 24px; font-size: var(--t-tiny); color: var(--text-3); font-weight: 620; }
        .match-thumb { flex: none; width: 44px; height: 44px; object-fit: contain; border-radius: var(--r-sm); background: var(--surface); border: 1px solid var(--line); }
        .thumb-pending { display: block; }
        .thumb-broken {
          display: flex; align-items: center; justify-content: center;
          font-size: var(--t-small); font-weight: 620; color: var(--text-3);
        }
        .match-body { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .match-body strong { font-size: var(--t-body); color: var(--text); }
        .match-file { font-size: var(--t-tiny); color: var(--text-3); }
        .match-score { flex: none; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; font-size: var(--t-body); color: var(--text-2); width: 90px; }
        .match-score-value {
          font-weight: 680; color: var(--series-1);
          padding: 2px 8px; border-radius: var(--r-pill);
          background: var(--series-1-soft);
        }
        .match-score-bar { width: 100%; height: 4px; border-radius: var(--r-pill); background: var(--seq-track); overflow: hidden; }
        .match-score-bar span { display: block; height: 100%; background: var(--seq-fill); }
      `}</style>
    </div>
  );
}
