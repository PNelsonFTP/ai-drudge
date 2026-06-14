import type { CategoryBucket, GroupedArticle } from "../lib/types";
import { Headline } from "./Headline";

interface CategoryColumnProps {
  bucket: CategoryBucket;
  bookmarkSet: Set<string>;
  onToggleBookmark: (id: string) => void;
  onHover: (article: GroupedArticle, e: React.MouseEvent) => void;
  onHoverEnd: () => void;
}

export function CategoryColumn({
  bucket,
  bookmarkSet,
  onToggleBookmark,
  onHover,
  onHoverEnd,
}: CategoryColumnProps) {
  return (
    <section>
      <h2 className="section-heading">{bucket.label}</h2>
      <div>
        {bucket.articles.map((a) => (
          <Headline
            key={a.id}
            article={a}
            isBookmark={bookmarkSet.has(a.id)}
            onToggleBookmark={onToggleBookmark}
            onHover={onHover}
            onHoverEnd={onHoverEnd}
          />
        ))}
      </div>
    </section>
  );
}
