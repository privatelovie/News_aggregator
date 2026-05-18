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
    <main className="mx-auto flex w-full max-w-[86rem] flex-col gap-6 px-3 py-5 sm:px-5 lg:px-6">
      <section className="grid gap-5 rounded-[2rem] border-[5px] border-black bg-white p-5 shadow-[10px_10px_0_#050505] lg:grid-cols-[minmax(0,1fr)_minmax(18rem,28rem)] lg:items-end dark:bg-slate-950">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-[#2b0b64] dark:text-[#ffd24a]">
            Discover
          </p>
          <h1 className="mt-3 text-5xl font-black uppercase tracking-normal text-black dark:text-white">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">
            {description}
          </p>
        </div>

        <form
          className="flex items-center gap-2 rounded-full border-[4px] border-black bg-[#c9b8ff] p-2 shadow-[4px_4px_0_#050505]"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmittedQuery(query);
          }}
        >
          <Search className="ml-2 size-5 shrink-0 text-black" />
          <input
            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm font-bold text-black outline-none placeholder:text-black/60"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search topics, sources, summaries"
            type="search"
            value={query}
          />
          <button
            className="rounded-full bg-black px-5 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#2b0b64]"
            type="submit"
          >
            Search
          </button>
        </form>
      </section>

      {error && (
        <div className="rounded-[1.5rem] border-[4px] border-black bg-[#ffd24a] p-4 text-sm font-bold text-black">
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
        <p className="rounded-[1.5rem] border-[4px] border-black bg-white p-5 text-sm font-bold text-black shadow-[6px_6px_0_#050505]">
          No articles matched your search.
        </p>
      )}
    </main>
  );
}
