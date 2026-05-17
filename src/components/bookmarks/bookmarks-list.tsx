"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArticleCard } from "@/components/articles/article-card";
import { ArticleCardSkeleton } from "@/components/articles/article-card-skeleton";
import type { ArticlePreview } from "@/types/article";

type BookmarkedArticle = {
  id: string;
  createdAt: string;
  article: {
    id: string;
    title: string;
    source: string;
    summary: string | null;
    imageUrl: string | null;
    publishedAt: string;
    url: string | null;
    category: {
      name: string;
      slug: string;
    };
  };
};

export function BookmarksList() {
  const [articles, setArticles] = useState<ArticlePreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadBookmarks() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/bookmarks", { cache: "no-store" });

        if (response.status === 401) {
          setIsUnauthorized(true);
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load saved articles.");
        }

        const payload = (await response.json()) as { data?: BookmarkedArticle[] };

        if (isActive) {
          setArticles((payload.data ?? []).map(toArticlePreview));
        }
      } catch (caughtError) {
        if (isActive) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load saved articles."
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadBookmarks();

    return () => {
      isActive = false;
    };
  }, []);

  if (isUnauthorized) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <p className="text-slate-600 dark:text-slate-300">
          Sign in to view your saved articles.
        </p>
        <Link
          className="mt-4 inline-flex rounded-md bg-slate-950 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          href="/login?callbackUrl=/bookmarks"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <ArticleCardSkeleton key={index} />
            ))
          : articles.map((article) => (
              <ArticleCard article={article} key={article.id} />
            ))}
      </div>

      {!isLoading && !error && articles.length === 0 && (
        <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          You have not saved any articles yet.
        </p>
      )}
    </section>
  );
}

function toArticlePreview(bookmark: BookmarkedArticle): ArticlePreview {
  return {
    id: bookmark.article.id,
    title: bookmark.article.title,
    source: bookmark.article.source,
    category: normalizeCategory(bookmark.article.category.slug),
    summary: bookmark.article.summary ?? "No summary available.",
    imageUrl: bookmark.article.imageUrl ?? undefined,
    publishedAt: formatPublishedAt(bookmark.article.publishedAt),
    url: bookmark.article.url ?? undefined,
    readTime: estimateReadTime(bookmark.article.summary)
  };
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
  const words = summary?.trim().split(/\s+/).filter(Boolean).length ?? 120;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}
