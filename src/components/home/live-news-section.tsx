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
    <section className="space-y-4 rounded-[1.25rem] border-[3px] border-black bg-white p-4 shadow-[5px_5px_0_#050505] sm:rounded-[2rem] sm:border-[5px] sm:p-5 sm:shadow-[10px_10px_0_#050505] dark:bg-slate-950">
      <div className="flex flex-col gap-3 border-b-[3px] border-black pb-4 sm:flex-row sm:items-end sm:justify-between sm:border-b-[5px]">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-[#2b0b64] dark:text-[#ffd24a]">
            Live coverage
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-normal text-black sm:text-4xl dark:text-white">
            Latest stories
          </h2>
        </div>
        <Link
          className="w-fit rounded-full border-[3px] border-black bg-[#ffd24a] px-4 py-2 text-sm font-black text-black transition hover:bg-white"
          href="/feed"
        >
          Open personalized feed
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border-[3px] border-black bg-[#ffd24a] p-4 text-sm font-semibold text-black">
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
