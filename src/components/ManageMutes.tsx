interface ManageMutesProps {
  mutedSources: string[];
  mutedCategories: string[];
  categoryLabelsById: Record<string, string>;
  onUnmuteSource: (s: string) => void;
  onUnmuteCategory: (c: string) => void;
  onClose: () => void;
}

export function ManageMutes({
  mutedSources,
  mutedCategories,
  categoryLabelsById,
  onUnmuteSource,
  onUnmuteCategory,
  onClose,
}: ManageMutesProps) {
  const empty = mutedSources.length === 0 && mutedCategories.length === 0;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center pt-20 px-4 bg-black/60" onClick={onClose}>
      <div
        className="max-w-lg w-full p-5 border max-h-[70vh] overflow-y-auto"
        style={{ background: "var(--bg, #161616)", borderColor: "#444" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-bold">Hidden sources & sections</h2>
          <button onClick={onClose} className="opacity-60 hover:opacity-100 text-sm">✕ close</button>
        </div>

        {empty && (
          <p className="text-sm opacity-60">
            Nothing hidden yet. Hover any headline and click "mute" to hide that source,
            or click "✕" next to a section heading to hide the whole section.
          </p>
        )}

        {mutedCategories.length > 0 && (
          <div className="mb-5">
            <h3 className="text-[11px] uppercase tracking-wider opacity-60 mb-2">
              Hidden sections ({mutedCategories.length})
            </h3>
            <div className="space-y-1">
              {mutedCategories.map((c) => (
                <div key={c} className="flex items-center justify-between text-sm py-1">
                  <span>{categoryLabelsById[c] ?? c}</span>
                  <button
                    onClick={() => onUnmuteCategory(c)}
                    className="text-xs underline opacity-70 hover:opacity-100"
                  >
                    restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {mutedSources.length > 0 && (
          <div>
            <h3 className="text-[11px] uppercase tracking-wider opacity-60 mb-2">
              Hidden sources ({mutedSources.length})
            </h3>
            <div className="space-y-1">
              {mutedSources.map((s) => (
                <div key={s} className="flex items-center justify-between text-sm py-1">
                  <span>{s}</span>
                  <button
                    onClick={() => onUnmuteSource(s)}
                    className="text-xs underline opacity-70 hover:opacity-100"
                  >
                    restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
