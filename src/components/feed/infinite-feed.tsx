"use client";

import { RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArticleCard } from "@/components/articles/article-card";
import { ArticleCardSkeleton } from "@/components/articles/article-card-skeleton";
import type { ArticlePreview } from "@/types/article";

type FeedArticle = {
  id: string;
  title: string;
  source: string;
  category: string;
  summary: string | null;
  imageUrl: string | null;
  publishedAt: string;
  recommendationScore?: number;
  scoreBreakdown?: unknown;
};

const PAGE_SIZE = 6;
const MAX_PAGES = 6;

export function InfiniteFeed() {
  const [articles, setArticles] = useState<ArticlePreview[]>([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasLoadedInitialPage = useRef(false);

  const loadNextPage = useCallback(async () => {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const response = await fetch(`/api/feed?pageSize=${nextPage * PAGE_SIZE}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Sign in to load your personalized feed."
            : "Unable to load feed articles."
        );
      }

      const payload = (await response.json()) as {
        data?: FeedArticle[];
      };
      const nextArticles = (payload.data ?? []).map(toArticlePreview);
      const pageSlice = nextArticles.slice(page * PAGE_SIZE, nextPage * PAGE_SIZE);

      setArticles((current) => dedupeArticles([...current, ...pageSlice]));
      setPage(nextPage);
      setHasMore(pageSlice.length === PAGE_SIZE && nextPage < MAX_PAGES);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load feed articles."
      );
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, page]);

  useEffect(() => {
    if (hasLoadedInitialPage.current) {
      return;
    }

    hasLoadedInitialPage.current = true;
    void loadNextPage();
  }, [loadNextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void loadNextPage();
        }
      },
      { rootMargin: "500px" }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [loadNextPage]);

  const skeletons = useMemo(
    () =>
      Array.from({ length: PAGE_SIZE }).map((_, index) => (
        <ArticleCardSkeleton key={index} />
      )),
    []
  );

  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard article={article} key={article.id} />
        ))}
        {isLoading && skeletons}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          <p>{error}</p>
          <button
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-2 text-white"
            onClick={() => void loadNextPage()}
            type="button"
          >
            <RefreshCcw className="size-4" />
            Retry
          </button>
        </div>
      )}

      <div ref={sentinelRef} />

      {!hasMore && articles.length > 0 && (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          You are caught up.
        </p>
      )}
    </section>
  );
}

function toArticlePreview(article: FeedArticle): ArticlePreview {
  return {
    id: article.id,
    title: article.title,
    source: article.source,
    category: normalizeCategory(article.category),
    summary: article.summary ?? "No summary available.",
    imageUrl: article.imageUrl ?? undefined,
    publishedAt: formatPublishedAt(article.publishedAt),
    readTime: estimateReadTime(article.summary),
    trend:
      typeof article.recommendationScore === "number"
        ? `Score ${Math.round(article.recommendationScore * 100)}`
        : "Ranked"
  };
}

function dedupeArticles(articles: ArticlePreview[]) {
  return Array.from(new Map(articles.map((article) => [article.id, article])).values());
}

function normalizeCategory(category: string): ArticlePreview["category"] {
  const normalized = category.toLowerCase();

  if (normalized === "sports") return "Sports";
  if (normalized === "politics") return "Politics";
  if (normalized === "business") return "Business";
  if (normalized === "science") return "Science";

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

function estimateReadTime(summary: string | null) {
  const words = summary?.split(/\s+/).length ?? 120;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}
