import type { UnifiedArticle } from "@/lib/news/types";
import type { ArticlePreview } from "@/types/article";

export function toArticlePreview(
  article: UnifiedArticle & {
    recommendationScore?: number;
  }
): ArticlePreview {
  return {
    id: article.id,
    title: article.title,
    source: article.source,
    category: normalizeCategory(article.category),
    summary: article.summary ?? article.content ?? "No summary available.",
    imageUrl: article.imageUrl ?? undefined,
    publishedAt: formatPublishedAt(article.publishedAt),
    url: article.url,
    readTime: estimateReadTime(article.summary ?? article.content),
    trend:
      typeof article.recommendationScore === "number"
        ? `Score ${Math.round(article.recommendationScore * 100)}`
        : undefined,
    article
  };
}

function normalizeCategory(category: UnifiedArticle["category"]): ArticlePreview["category"] {
  if (category === "sports") return "Sports";
  if (category === "politics") return "Politics";
  if (category === "business") return "Business";
  if (category === "science") return "Science";

  return "Tech";
}

function formatPublishedAt(value: string) {
  const date = new Date(value);
  const diffHours = Math.max(0, (Date.now() - date.getTime()) / 36e5);

  if (!Number.isFinite(diffHours)) {
    return "Now";
  }

  if (diffHours < 1) {
    return "Just now";
  }

  if (diffHours < 24) {
    return `${Math.floor(diffHours)}h ago`;
  }

  return `${Math.floor(diffHours / 24)}d ago`;
}

function estimateReadTime(text: string | null) {
  const words = text?.trim().split(/\s+/).filter(Boolean).length ?? 120;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}
