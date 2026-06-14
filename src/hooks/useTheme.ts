import { useEffect, useState } from "react";

type Theme = "dark" | "light";
const KEY = "ai-drudge:theme";

function initial(): Theme {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch { /* ignore */ }
  // Drudge is traditionally light; default to dark since AI news tends to
  // be read at night and most users prefer it for this kind of dense layout.
  return "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initial);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
    try { localStorage.setItem(KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, toggle };
}
