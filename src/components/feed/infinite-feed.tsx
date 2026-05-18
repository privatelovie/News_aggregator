"use client";

import { RefreshCcw, Settings2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArticleCard } from "@/components/articles/article-card";
import { ArticleCardSkeleton } from "@/components/articles/article-card-skeleton";
import { toArticlePreview } from "@/lib/articles/preview";
import { CATEGORIES } from "@/lib/constants";
import type { NewsCategory, UnifiedArticle } from "@/lib/news/types";
import type { ArticlePreview } from "@/types/article";

type FeedArticle = UnifiedArticle & {
  recommendationScore?: number;
  scoreBreakdown?: unknown;
};

type FeedPreferences = {
  category: NewsCategory | "all";
  country: string;
};

const PAGE_SIZE = 6;
const MAX_PAGES = 6;
const PREFERENCES_KEY = "news-app-feed-preferences";

const regions = [
  { label: "United States", value: "us" },
  { label: "India", value: "in" },
  { label: "United Kingdom", value: "gb" },
  { label: "Australia", value: "au" },
  { label: "Canada", value: "ca" }
] as const;

const defaultPreferences: FeedPreferences = {
  category: "all",
  country: "us"
};

export function InfiniteFeed() {
  const [articles, setArticles] = useState<ArticlePreview[]>([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [preferences, setPreferences] =
    useState<FeedPreferences>(defaultPreferences);
  const [showPreferences, setShowPreferences] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasLoadedInitialPage = useRef(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(PREFERENCES_KEY);

    if (!stored) {
      setShowPreferences(true);
      return;
    }

    try {
      setPreferences({ ...defaultPreferences, ...JSON.parse(stored) });
    } catch {
      setShowPreferences(true);
    }
  }, []);

  const loadNextPage = useCallback(async () => {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const params = new URLSearchParams({
        pageSize: String(nextPage * PAGE_SIZE),
        country: preferences.country
      });

      if (preferences.category !== "all") {
        params.set("category", preferences.category);
      }

      const response = await fetch(`/api/feed?${params}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Unable to load feed articles.");
      }

      const payload = (await response.json()) as {
        data?: FeedArticle[];
        meta?: {
          errors?: Array<{ message: string; provider: string }>;
        };
      };
      const nextArticles = (payload.data ?? []).map(toArticlePreview);
      const pageSlice = nextArticles.slice(page * PAGE_SIZE, nextPage * PAGE_SIZE);

      setArticles((current) => dedupeArticles([...current, ...pageSlice]));
      setPage(nextPage);
      setHasMore(pageSlice.length === PAGE_SIZE && nextPage < MAX_PAGES);

      if (nextPage === 1 && pageSlice.length === 0) {
        const providerErrors = payload.meta?.errors ?? [];
        setError(
          providerErrors.length > 0
            ? providerErrors.map((providerError) => providerError.message).join(" ")
            : "No articles are available for these preferences yet."
        );
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load feed articles."
      );
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, page, preferences]);

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

  function updatePreferences(nextPreferences: FeedPreferences) {
    setPreferences(nextPreferences);
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(nextPreferences));
    setArticles([]);
    setPage(0);
    setHasMore(true);
    setError(null);
    setShowPreferences(false);
    hasLoadedInitialPage.current = false;
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-teal-700 dark:text-teal-300">
              <Settings2 className="size-4" />
              Feed preferences
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Choose the topic and region you want prioritized in your feed.
            </p>
          </div>
          <button
            className="w-fit rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            onClick={() => setShowPreferences((current) => !current)}
            type="button"
          >
            {showPreferences ? "Hide preferences" : "Edit preferences"}
          </button>
        </div>

        {showPreferences && (
          <PreferencesForm
            preferences={preferences}
            onSave={updatePreferences}
          />
        )}
      </div>

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

function PreferencesForm({
  onSave,
  preferences
}: {
  onSave: (preferences: FeedPreferences) => void;
  preferences: FeedPreferences;
}) {
  const [draft, setDraft] = useState(preferences);

  return (
    <form
      className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
      }}
    >
      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
        Topic
        <select
          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              category: event.target.value as FeedPreferences["category"]
            }))
          }
          value={draft.category}
        >
          <option value="all">All topics</option>
          {CATEGORIES.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
        Region
        <select
          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
          onChange={(event) =>
            setDraft((current) => ({ ...current, country: event.target.value }))
          }
          value={draft.country}
        >
          {regions.map((region) => (
            <option key={region.value} value={region.value}>
              {region.label}
            </option>
          ))}
        </select>
      </label>

      <button
        className="self-end rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        type="submit"
      >
        Apply
      </button>
    </form>
  );
}

function dedupeArticles(articles: ArticlePreview[]) {
  return Array.from(new Map(articles.map((article) => [article.id, article])).values());
}
