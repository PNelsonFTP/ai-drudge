interface HeaderProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  generatedAt: string | null;
  totalCount: number;
  bookmarksCount: number;
  queueCount: number;
  mutedCount: number;
  view: "home" | "bookmarks" | "queue";
  onSetView: (v: "home" | "bookmarks" | "queue") => void;
  onOpenManageMutes: () => void;
  search: string;
  onSearchChange: (s: string) => void;
}

function relativeUpdated(generatedAt: string | null): { label: string; stale: boolean } {
  if (!generatedAt) return { label: "—", stale: false };
  const then = new Date(generatedAt).getTime();
  if (isNaN(then)) return { label: "—", stale: false };
  const diffH = (Date.now() - then) / 3_600_000;
  const ago = (() => {
    if (diffH < 1) return `${Math.max(0, Math.floor(diffH * 60))}m ago`;
    if (diffH < 24) return `${Math.floor(diffH)}h ago`;
    return `${Math.floor(diffH / 24)}d ago`;
  })();
  return { label: `updated ${ago}`, stale: diffH > 6 };
}

export function Header({
  theme,
  onToggleTheme,
  generatedAt,
  totalCount,
  bookmarksCount,
  queueCount,
  mutedCount,
  view,
  onSetView,
  onOpenManageMutes,
  search,
  onSearchChange,
}: HeaderProps) {
  const { label: updatedLabel, stale: dataStale } = relativeUpdated(generatedAt);

  return (
    <header className="border-b-2 border-[var(--siren)] px-4 py-3">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="masthead text-[var(--siren)]" style={{ fontSize: "clamp(28px, 5vw, 52px)" }}>
              AI&nbsp;DRUDGE
            </h1>
            <p className="text-[11px] uppercase tracking-widest opacity-60 mt-1">
              Machine-intelligence headlines, refreshed hourly
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap justify-end">
            <span className={`mr-1 ${dataStale ? "text-[var(--siren)]" : "opacity-60"}`}>
              {totalCount > 0 ? `${totalCount} stories · ${updatedLabel}` : "loading…"}
            </span>
            <button
              onClick={() => onSetView(view === "bookmarks" ? "home" : "bookmarks")}
              className={`px-2 py-1 border rounded ${view === "bookmarks" ? "bg-[var(--gold)] text-black border-[var(--gold)]" : "opacity-80"}`}
              title="Bookmarks (save permanently)"
            >
              ★ {bookmarksCount}
            </button>
            <button
              onClick={() => onSetView(view === "queue" ? "home" : "queue")}
              className={`px-2 py-1 border rounded ${view === "queue" ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "opacity-80"}`}
              title="Read-later queue (clears on open)"
            >
              ◷ {queueCount}
            </button>
            <button
              onClick={onOpenManageMutes}
              className="px-2 py-1 border rounded opacity-80"
              title="Manage hidden sources & sections"
            >
              ✕ {mutedCount}
            </button>
            <button
              onClick={onToggleTheme}
              className="px-2 py-1 border rounded opacity-80"
              title="Toggle theme"
            >
              {theme === "dark" ? "☀ light" : "☾ dark"}
            </button>
          </div>
        </div>

        <div className="mt-3 max-w-md">
          <input
            type="search"
            className="search-input"
            placeholder="Search headlines, sources, categories…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </header>
  );
}
