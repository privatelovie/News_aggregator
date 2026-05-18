"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ArticleCard } from "@/components/articles/article-card";
import { ArticleCardSkeleton } from "@/components/articles/article-card-skeleton";
import { toArticlePreview } from "@/lib/articles/preview";
import type { NewsCategory, UnifiedArticle } from "@/lib/news/types";
import type { ArticlePreview } from "@/types/article";

type ArticleBrowserProps = {
  category?: NewsCategory;
  initialQuery?: string;
  title: string;
  description: string;
};

export function ArticleBrowser({
  category,
  initialQuery = "",
  title,
  description
}: ArticleBrowserProps) {
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [articles, setArticles] = useState<ArticlePreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ pageSize: "18" });

    if (submittedQuery.trim()) {
      params.set("q", submittedQuery.trim());
    }

    if (category) {
      params.set("category", category);
    }

    return `/api/articles?${params}`;
  }, [category, submittedQuery]);

  useEffect(() => {
    let isActive = true;

    async function loadArticles() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(endpoint, { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Unable to load articles.");
        }

        const payload = (await response.json()) as { data?: UnifiedArticle[] };

        if (isActive) {
          setArticles((payload.data ?? []).map(toArticlePreview));
        }
      } catch (caughtError) {
        if (isActive) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load articles."
          );
          setArticles([]);
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
  }, [endpoint]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,28rem)] lg:items-end">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-teal-600 dark:text-teal-300">
            Discover
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950 dark:text-white">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {description}
          </p>
        </div>

        <form
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmittedQuery(query);
          }}
        >
          <Search className="ml-2 size-4 shrink-0 text-slate-400" />
          <input
            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-slate-400"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search topics, sources, summaries"
            type="search"
            value={query}
          />
          <button
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            type="submit"
          >
            Search
          </button>
        </form>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <ArticleCardSkeleton key={index} />
            ))
          : articles.map((article) => (
              <ArticleCard article={article} key={article.id} />
            ))}
      </section>

      {!isLoading && !error && articles.length === 0 && (
        <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          No articles matched your search.
        </p>
      )}
    </main>
  );
}
