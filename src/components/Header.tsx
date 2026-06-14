interface HeaderProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  generatedAt: string | null;
  totalCount: number;
  bookmarksCount: number;
  showingBookmarks: boolean;
  onToggleBookmarks: () => void;
  search: string;
  onSearchChange: (s: string) => void;
}

export function Header({
  theme,
  onToggleTheme,
  generatedAt,
  totalCount,
  bookmarksCount,
  showingBookmarks,
  onToggleBookmarks,
  search,
  onSearchChange,
}: HeaderProps) {
  const updated = generatedAt
    ? new Date(generatedAt).toLocaleString(undefined, {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "—";

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

          <div className="flex items-center gap-2 text-xs">
            <span className="opacity-60">
              {totalCount > 0 ? `${totalCount} stories · updated ${updated}` : "loading…"}
            </span>
            <button
              onClick={onToggleBookmarks}
              className={`px-2 py-1 border rounded ${showingBookmarks ? "bg-[var(--gold)] text-black border-[var(--gold)]" : "opacity-80"}`}
              title="Show bookmarked stories"
            >
              ★ {bookmarksCount}
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
