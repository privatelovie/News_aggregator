"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { sendAnalyticsEvent } from "@/components/analytics/analytics-provider";
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
  const [searchMode, setSearchMode] = useState<"keyword" | "semantic">("keyword");

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
        const response =
          searchMode === "semantic" && submittedQuery.trim()
            ? await fetch("/api/embeddings/similar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  query: submittedQuery.trim(),
                  limit: 18,
                  useUserProfile: false
                })
              })
            : await fetch(endpoint, { cache: "no-store" });

        if (!response.ok) {
          if (searchMode === "semantic") {
            const fallbackResponse = await fetch(endpoint, { cache: "no-store" });

            if (!fallbackResponse.ok) {
              throw new Error("Unable to load articles.");
            }

            const fallbackPayload = (await fallbackResponse.json()) as {
              data?: UnifiedArticle[];
            };

            if (isActive) {
              setError("Semantic search is unavailable, showing keyword results.");
              setArticles((fallbackPayload.data ?? []).map(toArticlePreview));
            }

            return;
          }

          throw new Error("Unable to load articles.");
        }

        const payload = (await response.json()) as { data?: UnifiedArticle[] };

        if (isActive) {
          setArticles((payload.data ?? []).map(toArticlePreview));
          if (submittedQuery.trim()) {
            sendAnalyticsEvent("search_success", {
              mode: searchMode,
              query: submittedQuery.trim(),
              resultCount: payload.data?.length ?? 0
            });
          }
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
  }, [endpoint, searchMode, submittedQuery]);

  return (
    <main className="mx-auto flex w-full max-w-[86rem] flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-5 lg:px-6">
      <section className="grid min-w-0 gap-4 rounded-[1.25rem] border-[3px] border-black bg-white p-4 shadow-[5px_5px_0_#050505] sm:gap-5 sm:rounded-[2rem] sm:border-[5px] sm:p-5 sm:shadow-[10px_10px_0_#050505] lg:grid-cols-[minmax(0,1fr)_minmax(18rem,28rem)] lg:items-end dark:bg-slate-950">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-[#2b0b64] dark:text-[#ffd24a]">
            Discover
          </p>
          <h1 className="mt-3 break-words text-4xl font-black uppercase tracking-normal text-black sm:text-5xl dark:text-white">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">
            {description}
          </p>
        </div>

        <form
          className="flex min-w-0 flex-col gap-3 rounded-[1.25rem] border-[3px] border-black bg-[#c9b8ff] p-3 shadow-[4px_4px_0_#050505] sm:rounded-[1.5rem] sm:border-[4px]"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmittedQuery(query);
            sendAnalyticsEvent("search_submit", {
              mode: searchMode,
              query: query.trim()
            });
          }}
        >
          <div className="flex min-w-0 rounded-full border-[3px] border-black bg-white p-1">
            {(["keyword", "semantic"] as const).map((mode) => (
              <button
                className={`min-w-0 flex-1 rounded-full px-2 py-2 text-xs font-black uppercase text-black transition sm:px-3 ${
                  searchMode === mode ? "bg-[#ffd24a]" : "bg-white"
                }`}
                key={mode}
                onClick={() => setSearchMode(mode)}
                type="button"
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="grid min-w-0 gap-2 sm:flex sm:items-center">
            <label className="flex min-w-0 items-center gap-2 rounded-full border-[3px] border-black bg-white px-3 py-2 sm:flex-1 sm:border-0 sm:bg-transparent sm:px-0">
              <Search className="size-5 shrink-0 text-black sm:ml-2" />
              <input
                className="min-w-0 flex-1 bg-transparent px-1 py-1 text-sm font-bold text-black outline-none placeholder:text-black/60"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search topics, sources, summaries"
                type="search"
                value={query}
              />
            </label>
            <button
              className="w-full rounded-full bg-black px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#2b0b64] sm:w-auto sm:py-2"
              type="submit"
            >
              Search
            </button>
          </div>
        </form>
      </section>

      {error && (
        <div className="rounded-[1.5rem] border-[4px] border-black bg-[#ffd24a] p-4 text-sm font-bold text-black">
          {error}
        </div>
      )}

      {category && <TrendPanel articles={articles} category={category} />}

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

function TrendPanel({
  articles,
  category
}: {
  articles: ArticlePreview[];
  category: NewsCategory;
}) {
  const now = Date.now();
  const last24h = articles.filter((article) => {
    const publishedAt = article.article?.publishedAt;

    if (!publishedAt) {
      return false;
    }

    const ageHours = (now - new Date(publishedAt).getTime()) / 36e5;
    return Number.isFinite(ageHours) && ageHours <= 24;
  });
  const sources = new Set(articles.map((article) => article.source));
  const agreementScore =
    articles.length === 0
      ? 0
      : Math.min(100, Math.round((sources.size / Math.max(articles.length, 1)) * 140));
  const fastestSource = Object.entries(
    articles.reduce<Record<string, number>>((counts, article) => {
      counts[article.source] = (counts[article.source] ?? 0) + 1;
      return counts;
    }, {})
  ).sort((a, b) => b[1] - a[1])[0];

  return (
    <section className="grid gap-4 rounded-[1.5rem] border-[5px] border-black bg-[#ffd24a] p-4 text-black shadow-[8px_8px_0_#050505] md:grid-cols-3">
      <div>
        <p className="text-xs font-black uppercase">Trending in {category}</p>
        <p className="mt-2 text-4xl font-black">{last24h.length}</p>
        <p className="text-sm font-bold">fresh stories in the last 24h</p>
      </div>
      <div>
        <p className="text-xs font-black uppercase">Cross-source agreement</p>
        <p className="mt-2 text-4xl font-black">{agreementScore}%</p>
        <p className="text-sm font-bold">
          Based on breadth across {sources.size} sources.
        </p>
      </div>
      <div>
        <p className="text-xs font-black uppercase">Velocity signal</p>
        <p className="mt-2 text-2xl font-black">
          {fastestSource ? fastestSource[0] : "Waiting for data"}
        </p>
        <p className="text-sm font-bold">
          {fastestSource
            ? `${fastestSource[1]} stories in this loaded category set.`
            : "Load articles to calculate category momentum."}
        </p>
      </div>
    </section>
  );
}
