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
    <header>
      <div className="header-row">
        <button type="button" className="masthead-btn" onClick={() => onSetView("home")} title="Back to home">
          <span className="logo"><span className="mark">AI</span> DRUDGE</span>
          <span className="tagline">
            Machine intelligence · {totalCount > 0 ? `${totalCount} stories · ${updatedLabel}` : "loading"}
          </span>
        </button>
        <div className="toolbar">
          <button
            type="button"
            className={`tool-btn ${view === "bookmarks" ? "active" : ""}`}
            onClick={() => onSetView(view === "bookmarks" ? "home" : "bookmarks")}
            title="Bookmarks"
          >
            ★ Bookmarks {bookmarksCount}
          </button>
          <button
            type="button"
            className={`tool-btn ${view === "queue" ? "active" : ""}`}
            onClick={() => onSetView(view === "queue" ? "home" : "queue")}
            title="Read later"
          >
            ⏷ Later {queueCount}
          </button>
          <button type="button" className="tool-btn" onClick={onOpenManageMutes} title="Manage hidden sources">
            Mutes {mutedCount}
          </button>
          <button
            type="button"
            className={`tool-btn ${dataStale ? "stale" : ""}`}
            onClick={onToggleTheme}
            title="Toggle theme"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </div>
      <div className="control-row">
        <input
          type="search"
          className="search-input"
          placeholder="search headlines, sources, categories…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search headlines"
        />
      </div>
    </header>
  );
}
