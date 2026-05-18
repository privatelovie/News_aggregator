"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArticleCard } from "@/components/articles/article-card";
import { ArticleCardSkeleton } from "@/components/articles/article-card-skeleton";
import { toArticlePreview } from "@/lib/articles/preview";
import type { UnifiedArticle } from "@/lib/news/types";
import type { ArticlePreview } from "@/types/article";

export function LiveNewsSection() {
  const [articles, setArticles] = useState<ArticlePreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadArticles() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/articles?pageSize=9&country=us", {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Unable to load live news.");
        }

        const payload = (await response.json()) as {
          data?: UnifiedArticle[];
          meta?: {
            errors?: Array<{ message: string; provider: string }>;
          };
        };
        const nextArticles = (payload.data ?? []).map(toArticlePreview);

        if (isActive) {
          setArticles(nextArticles);
          if (nextArticles.length === 0) {
            const providerErrors = payload.meta?.errors ?? [];
            setError(
              providerErrors.length > 0
                ? providerErrors.map((item) => item.message).join(" ")
                : "No live articles are available yet."
            );
          }
        }
      } catch (caughtError) {
        if (isActive) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load live news."
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadArticles();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-teal-600 dark:text-teal-300">
            Live coverage
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
            Latest stories
          </h2>
        </div>
        <Link
          className="text-sm font-medium text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
          href="/feed"
        >
          Open personalized feed
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
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
    </section>
  );
}
