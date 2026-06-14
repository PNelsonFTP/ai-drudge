import type { Brief } from "../lib/types";

export function DailyBrief({ brief }: { brief: Brief | null }) {
  if (!brief) return null;

  const generated = new Date(brief.generatedAt).toLocaleString(undefined, {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <section className="border border-current opacity-90 p-4 mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="section-heading" style={{ borderBottom: "none", marginBottom: 0 }}>
          DAILY BRIEF
        </h2>
        <span className="text-[10px] uppercase tracking-wider opacity-50">
          {brief.source === "claude" ? "AI-generated" : "Top headlines"} · {generated}
        </span>
      </div>
      <p className="font-bold mb-2">{brief.headline}</p>
      <ul className="space-y-1.5 list-disc list-inside">
        {brief.bullets.map((b, i) => (
          <li key={i} className="text-[13px] opacity-90">{b}</li>
        ))}
      </ul>
      {brief.citedArticles.length > 0 && (
        <div className="mt-3 pt-2 border-t border-current opacity-60 text-[11px]">
          <span className="uppercase tracking-wider">Cited:</span>{" "}
          {brief.citedArticles.slice(0, 5).map((c, i) => (
            <span key={c.url}>
              {i > 0 && " · "}
              <a href={c.url} target="_blank" rel="noreferrer noopener" className="underline">{c.source}</a>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
