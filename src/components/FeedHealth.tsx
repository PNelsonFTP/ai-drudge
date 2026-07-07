interface FeedHealthProps {
  stats: { source: string; ok: boolean; count: number }[];
  generatedAt: string | null;
  onClose: () => void;
}

// Operator-facing feed health panel (#10 from the roadmap). Opened from the
// footer "N/M feeds OK" link. Failing feeds first, then zero-item feeds
// (usually SPA/interstitial responses), then healthy ones.
export function FeedHealth({ stats, generatedAt, onClose }: FeedHealthProps) {
  const failing = stats.filter((f) => !f.ok);
  const zero = stats.filter((f) => f.ok && f.count === 0);
  const healthy = stats.filter((f) => f.ok && f.count > 0);

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center pt-20 px-4 bg-black/60" onClick={onClose}>
      <div
        className="max-w-lg w-full p-5 border max-h-[70vh] overflow-y-auto"
        style={{ background: "var(--bg, #161616)", borderColor: "#444" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="text-lg font-bold">Feed health</h2>
          <button onClick={onClose} className="opacity-60 hover:opacity-100 text-sm">✕ close</button>
        </div>
        <p className="text-[11px] opacity-50 mb-4">
          {healthy.length + zero.length}/{stats.length} feeds OK at last build
          {generatedAt ? ` (${new Date(generatedAt).toLocaleString()})` : ""}.
        </p>

        {failing.length > 0 && (
          <div className="mb-5">
            <h3 className="text-[11px] uppercase tracking-wider mb-2 text-[var(--siren)]">
              Failing ({failing.length})
            </h3>
            <div className="space-y-1">
              {failing.map((f) => (
                <div key={f.source} className="flex items-center justify-between text-sm py-0.5">
                  <span>{f.source}</span>
                  <span className="text-xs text-[var(--siren)]">fetch failed</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {zero.length > 0 && (
          <div className="mb-5">
            <h3 className="text-[11px] uppercase tracking-wider opacity-60 mb-2">
              OK but zero items ({zero.length})
            </h3>
            <div className="space-y-1">
              {zero.map((f) => (
                <div key={f.source} className="flex items-center justify-between text-sm py-0.5 opacity-70">
                  <span>{f.source}</span>
                  <span className="text-xs">0 items</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-[11px] uppercase tracking-wider opacity-60 mb-2">
            Healthy ({healthy.length})
          </h3>
          <div className="space-y-1">
            {healthy.map((f) => (
              <div key={f.source} className="flex items-center justify-between text-sm py-0.5 opacity-70">
                <span>{f.source}</span>
                <span className="text-xs">{f.count} items</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
