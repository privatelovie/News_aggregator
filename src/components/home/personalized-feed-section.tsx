import { ArticleCard } from "@/components/articles/article-card";
import { CategoryNav } from "@/components/navigation/category-nav";
import { SectionHeader } from "@/components/ui/section-header";
import { FEATURED_ARTICLES } from "@/lib/constants";

export function PersonalizedFeedSection() {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader title="Personalized Feed" />
        <CategoryNav />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {FEATURED_ARTICLES.map((article) => (
          <ArticleCard article={article} key={article.id} />
        ))}
      </div>
    </section>
  );
}
