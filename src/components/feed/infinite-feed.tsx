"use client";

import {
  Download,
  EyeOff,
  Mail,
  RefreshCcw,
  Settings2,
  ShieldCheck,
  Star
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArticleCard } from "@/components/articles/article-card";
import { ArticleCardSkeleton } from "@/components/articles/article-card-skeleton";
import { toArticlePreview } from "@/lib/articles/preview";
import { FEED_TOPICS } from "@/lib/constants";
import type { UnifiedArticle } from "@/lib/news/types";
import type { ArticlePreview } from "@/types/article";

type FeedArticle = UnifiedArticle & {
  recommendationScore?: number;
  scoreBreakdown?: {
    userEmbedding: number;
    behavior: number;
    recency: number;
    trending: number;
    sourceControl?: number;
  };
};

type FeedPreferences = {
  topic: string;
  country: string;
};

type SourcePreference = {
  id: string;
  source: string;
  action: "NEUTRAL" | "MUTE" | "PRIORITIZE";
  hideSensational: boolean;
  preferredRegion?: string | null;
  preferredLanguage?: string | null;
};

type PersistedFeedPreference = {
  topics: string[];
  sources: string[];
  location: string;
  readingDepth: "QUICK" | "BALANCED" | "DEEP";
  hideNsfw: boolean;
  politicalSensitivity: "low" | "balanced" | "high";
  onboardingComplete: boolean;
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
  topic: "all",
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
  const [sourcePreferences, setSourcePreferences] = useState<SourcePreference[]>([]);
  const [persistedPreference, setPersistedPreference] =
    useState<PersistedFeedPreference | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasLoadedInitialPage = useRef(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(PREFERENCES_KEY);

    if (!stored) {
      setShowPreferences(true);
      setHasLoadedPreferences(true);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<FeedPreferences> & {
        category?: string;
      };

      setPreferences({
        ...defaultPreferences,
        ...parsed,
        topic: parsed.topic ?? parsed.category ?? defaultPreferences.topic
      });
    } catch {
      setShowPreferences(true);
    } finally {
      setHasLoadedPreferences(true);
    }
  }, []);

  const loadSourcePreferences = useCallback(async () => {
    const response = await fetch("/api/source-preferences", { cache: "no-store" });

    if (response.status === 401) {
      setSourcePreferences([]);
      return;
    }

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { data?: SourcePreference[] };
    setSourcePreferences(payload.data ?? []);
  }, []);

  useEffect(() => {
    void loadSourcePreferences();
  }, [loadSourcePreferences]);

  const loadPersistedPreference = useCallback(async () => {
    const response = await fetch("/api/preferences", { cache: "no-store" });

    if (response.status === 401) {
      return;
    }

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as {
      data?: PersistedFeedPreference | null;
    };

    if (payload.data) {
      setPersistedPreference(payload.data);
      setPreferences((current) => ({
        ...current,
        topic: payload.data?.topics[0] ?? current.topic,
        country: payload.data?.location ?? current.country
      }));
    } else {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    void loadPersistedPreference();
  }, [loadPersistedPreference]);

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
      const selectedTopic = FEED_TOPICS.find(
        (topic) => topic.value === preferences.topic
      );

      if (selectedTopic?.type === "category") {
        params.set("category", selectedTopic.value);
      }

      if (selectedTopic?.type === "query") {
        params.set("q", selectedTopic.value);
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
    if (!hasLoadedPreferences) {
      return;
    }

    if (hasLoadedInitialPage.current) {
      return;
    }

    hasLoadedInitialPage.current = true;
    void loadNextPage();
  }, [hasLoadedPreferences, loadNextPage, refreshToken]);

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
    refreshFeed();
    setShowPreferences(false);
  }

  function refreshFeed() {
    setArticles([]);
    setPage(0);
    setHasMore(true);
    setError(null);
    hasLoadedInitialPage.current = false;
    setRefreshToken((current) => current + 1);
  }

  async function saveSourcePreference(nextPreference: Omit<SourcePreference, "id">) {
    const response = await fetch("/api/source-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextPreference)
    });

    if (!response.ok) {
      setError("Sign in to save source controls.");
      return;
    }

    await loadSourcePreferences();
    refreshFeed();
  }

  async function saveOnboarding(nextPreference: PersistedFeedPreference) {
    const response = await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextPreference)
    });

    if (!response.ok) {
      setError("Sign in to save onboarding preferences.");
      return;
    }

    setPersistedPreference(nextPreference);
    setPreferences({
      topic: nextPreference.topics[0] ?? "all",
      country: nextPreference.location
    });
    setShowOnboarding(false);
    refreshFeed();
  }

  return (
    <section className="space-y-5">
      <div className="rounded-[1.5rem] border-[5px] border-black bg-[#c9b8ff] p-4 shadow-[8px_8px_0_#050505]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-black uppercase text-black">
              <Settings2 className="size-4" />
              Feed preferences
            </div>
            <p className="mt-2 text-sm font-medium text-black/75">
              Choose the topic and region you want prioritized in your feed.
            </p>
          </div>
          <button
            className="w-fit rounded-full border-[3px] border-black bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-[#ffd24a]"
            onClick={() => setShowPreferences((current) => !current)}
            type="button"
          >
            {showPreferences ? "Hide preferences" : "Edit preferences"}
          </button>
          <button
            className="w-fit rounded-full border-[3px] border-black bg-[#ffd24a] px-4 py-2 text-sm font-black text-black transition hover:bg-white"
            onClick={() => setShowOnboarding((current) => !current)}
            type="button"
          >
            Onboarding
          </button>
        </div>

        {showPreferences && (
          <PreferencesForm
            preferences={preferences}
            onSave={updatePreferences}
          />
        )}
      </div>

      {showOnboarding && (
        <OnboardingPanel
          articles={articles}
          initialPreference={persistedPreference}
          onSave={saveOnboarding}
        />
      )}

      <FeedAnalyticsPanel articles={articles} preferences={preferences} />

      <SourceControlsPanel
        articles={articles}
        preferences={sourcePreferences}
        onSave={saveSourcePreference}
      />

      <BriefingPanel articles={articles} preferences={preferences} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard article={article} key={article.id} />
        ))}
        {isLoading && skeletons}
      </div>

      {error && (
        <div className="rounded-[1.5rem] border-[4px] border-black bg-[#ffd24a] p-4 text-sm font-bold text-black">
          <p>{error}</p>
          <button
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-white"
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
        <p className="rounded-full border-[3px] border-black bg-white px-4 py-2 text-center text-sm font-black text-black">
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
      <label className="text-sm font-black uppercase text-black">
        Topic
        <select
          className="mt-2 w-full rounded-full border-[3px] border-black bg-white px-4 py-3 text-sm font-bold text-black"
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              topic: event.target.value
            }))
          }
          value={draft.topic}
        >
          {FEED_TOPICS.map((topic) => (
            <option key={topic.value} value={topic.value}>
              {topic.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-black uppercase text-black">
        Region
        <select
          className="mt-2 w-full rounded-full border-[3px] border-black bg-white px-4 py-3 text-sm font-bold text-black"
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
        className="self-end rounded-full border-[3px] border-black bg-black px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#2b0b64]"
        type="submit"
      >
        Apply
      </button>
    </form>
  );
}

function OnboardingPanel({
  articles,
  initialPreference,
  onSave
}: {
  articles: ArticlePreview[];
  initialPreference: PersistedFeedPreference | null;
  onSave: (preference: PersistedFeedPreference) => Promise<void>;
}) {
  const suggestedSources = Array.from(
    new Set(articles.map((article) => article.source))
  ).slice(0, 8);
  const [topics, setTopics] = useState<string[]>(
    initialPreference?.topics ?? ["technology", "business"]
  );
  const [sources, setSources] = useState<string[]>(
    initialPreference?.sources ?? []
  );
  const [location, setLocation] = useState(initialPreference?.location ?? "us");
  const [readingDepth, setReadingDepth] = useState<
    PersistedFeedPreference["readingDepth"]
  >(initialPreference?.readingDepth ?? "BALANCED");
  const [hideNsfw, setHideNsfw] = useState(initialPreference?.hideNsfw ?? true);
  const [politicalSensitivity, setPoliticalSensitivity] = useState<
    PersistedFeedPreference["politicalSensitivity"]
  >(initialPreference?.politicalSensitivity ?? "balanced");

  function toggleValue(values: string[], value: string) {
    return values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];
  }

  return (
    <section className="rounded-[1.5rem] border-[5px] border-black bg-white p-4 text-black shadow-[8px_8px_0_#050505] dark:bg-slate-950 dark:text-white">
      <div className="flex items-center gap-2 text-sm font-black uppercase text-[#2b0b64] dark:text-[#ffd24a]">
        <ShieldCheck className="size-4" />
        First-run preferences
      </div>
      <h2 className="mt-2 text-3xl font-black uppercase">
        Kick-start your For You feed
      </h2>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-xs font-black uppercase">Topics</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {FEED_TOPICS.filter((topic) => topic.type !== "all").map((topic) => (
              <button
                className={`rounded-full border-2 border-black px-3 py-2 text-xs font-black ${
                  topics.includes(topic.value) ? "bg-[#ffd24a] text-black" : "bg-white text-black"
                }`}
                key={topic.value}
                onClick={() => setTopics((current) => toggleValue(current, topic.value))}
                type="button"
              >
                {topic.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-black uppercase">Trusted sources</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestedSources.length === 0 && (
              <span className="rounded-full border-2 border-black bg-[#f4f0ff] px-3 py-2 text-xs font-black text-black">
                Load feed to suggest sources
              </span>
            )}
            {suggestedSources.map((source) => (
              <button
                className={`rounded-full border-2 border-black px-3 py-2 text-xs font-black ${
                  sources.includes(source) ? "bg-[#ffd24a] text-black" : "bg-white text-black"
                }`}
                key={source}
                onClick={() => setSources((current) => toggleValue(current, source))}
                type="button"
              >
                {source}
              </button>
            ))}
          </div>
        </div>

        <label className="text-xs font-black uppercase">
          Location
          <select
            className="mt-2 w-full rounded-full border-2 border-black bg-white px-3 py-2 text-sm font-black text-black"
            onChange={(event) => setLocation(event.target.value)}
            value={location}
          >
            {regions.map((region) => (
              <option key={region.value} value={region.value}>
                {region.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-black uppercase">
          Reading depth
          <select
            className="mt-2 w-full rounded-full border-2 border-black bg-white px-3 py-2 text-sm font-black text-black"
            onChange={(event) =>
              setReadingDepth(event.target.value as PersistedFeedPreference["readingDepth"])
            }
            value={readingDepth}
          >
            <option value="QUICK">Quick scan</option>
            <option value="BALANCED">Balanced</option>
            <option value="DEEP">Deep reads</option>
          </select>
        </label>

        <label className="flex items-center gap-2 rounded-2xl border-2 border-black bg-[#f4f0ff] p-3 text-sm font-black text-black">
          <input
            checked={hideNsfw}
            onChange={(event) => setHideNsfw(event.target.checked)}
            type="checkbox"
          />
          Hide NSFW or graphic headlines
        </label>

        <label className="text-xs font-black uppercase">
          Political sensitivity
          <select
            className="mt-2 w-full rounded-full border-2 border-black bg-white px-3 py-2 text-sm font-black text-black"
            onChange={(event) =>
              setPoliticalSensitivity(
                event.target.value as PersistedFeedPreference["politicalSensitivity"]
              )
            }
            value={politicalSensitivity}
          >
            <option value="low">Show less politics</option>
            <option value="balanced">Balanced</option>
            <option value="high">Allow more politics</option>
          </select>
        </label>
      </div>

      <button
        className="mt-4 rounded-full border-[3px] border-black bg-[#ffd24a] px-5 py-3 text-sm font-black text-black transition hover:bg-white"
        onClick={() =>
          onSave({
            topics,
            sources,
            location,
            readingDepth,
            hideNsfw,
            politicalSensitivity,
            onboardingComplete: true
          })
        }
        type="button"
      >
        Save onboarding
      </button>
    </section>
  );
}

function dedupeArticles(articles: ArticlePreview[]) {
  return Array.from(new Map(articles.map((article) => [article.id, article])).values());
}

function FeedAnalyticsPanel({
  articles,
  preferences
}: {
  articles: ArticlePreview[];
  preferences: FeedPreferences;
}) {
  const categoryCounts = countBy(articles, (article) => article.category);
  const sourceCounts = countBy(articles, (article) => article.source);
  const providerCounts = countBy(articles, (article) =>
    article.article?.providers.map((provider) => provider.name).join(", ") ||
    "unknown"
  );
  const selectedTopic =
    FEED_TOPICS.find((topic) => topic.value === preferences.topic)?.label ??
    "All topics";
  const topCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const total = Math.max(articles.length, 1);

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      preferences: {
        ...preferences,
        topicLabel: selectedTopic
      },
      totals: {
        articles: articles.length,
        categories: categoryCounts,
        providers: providerCounts,
        sources: sourceCounts
      },
      articles: articles.map((article) => ({
        id: article.id,
        title: article.title,
        source: article.source,
        category: article.category,
        publishedAt: article.publishedAt,
        url: article.url
      }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "news-feed-analytics.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-[1.5rem] border-[5px] border-black bg-white p-4 shadow-[8px_8px_0_#050505] dark:bg-slate-950">
      <div className="flex flex-col gap-3 border-b-[4px] border-black pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black uppercase text-[#2b0b64] dark:text-[#ffd24a]">
            Analyst panel
          </p>
          <h2 className="mt-1 text-3xl font-black uppercase text-black dark:text-white">
            API data collected
          </h2>
        </div>
        <button
          className="inline-flex w-fit items-center gap-2 rounded-full border-[3px] border-black bg-[#ffd24a] px-4 py-2 text-sm font-black text-black transition hover:bg-white"
          onClick={exportData}
          type="button"
        >
          <Download className="size-4" />
          Export JSON
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr_1fr]">
        <div className="rounded-2xl border-[3px] border-black bg-[#c9b8ff] p-4 text-black">
          <p className="text-sm font-black uppercase">Collected articles</p>
          <p className="mt-2 text-5xl font-black">{articles.length}</p>
          <p className="mt-3 text-sm font-bold">
            Topic: {selectedTopic} | Region: {preferences.country.toUpperCase()}
          </p>
        </div>

        <div className="rounded-2xl border-[3px] border-black bg-white p-4 dark:bg-slate-950">
          <p className="text-sm font-black uppercase text-black dark:text-white">
            Category mix
          </p>
          <div className="mt-4 space-y-3">
            {topCategories.length === 0 && (
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                Load articles to visualize category data.
              </p>
            )}
            {topCategories.map(([category, count]) => (
              <div key={category}>
                <div className="flex justify-between text-xs font-black uppercase text-black dark:text-white">
                  <span>{category}</span>
                  <span>{count}</span>
                </div>
                <div className="mt-1 h-4 overflow-hidden rounded-full border-2 border-black bg-[#f4f0ff]">
                  <div
                    className="h-full bg-[#ffd24a]"
                    style={{ width: `${Math.max(8, (count / total) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border-[3px] border-black bg-white p-4 dark:bg-slate-950">
          <p className="text-sm font-black uppercase text-black dark:text-white">
            Top sources
          </p>
          <div className="mt-4 space-y-2">
            {topSources.length === 0 && (
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                Sources appear once articles load.
              </p>
            )}
            {topSources.map(([source, count]) => (
              <div
                className="flex items-center justify-between gap-3 rounded-full border-2 border-black px-3 py-2 text-sm font-black text-black dark:text-white"
                key={source}
              >
                <span className="truncate">{source}</span>
                <span className="rounded-full bg-[#ffd24a] px-2 py-0.5 text-black">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SourceControlsPanel({
  articles,
  onSave,
  preferences
}: {
  articles: ArticlePreview[];
  onSave: (preference: Omit<SourcePreference, "id">) => Promise<void>;
  preferences: SourcePreference[];
}) {
  const topSources = Object.entries(countBy(articles, (article) => article.source))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const preferenceBySource = new Map(
    preferences.map((preference) => [preference.source.toLowerCase(), preference])
  );

  async function updateSource(
    source: string,
    patch: Partial<Omit<SourcePreference, "id" | "source">>
  ) {
    const current = preferenceBySource.get(source.toLowerCase());
    await onSave({
      source,
      action: patch.action ?? current?.action ?? "NEUTRAL",
      hideSensational:
        patch.hideSensational ?? current?.hideSensational ?? false,
      preferredRegion:
        patch.preferredRegion === undefined
          ? current?.preferredRegion ?? null
          : patch.preferredRegion,
      preferredLanguage:
        patch.preferredLanguage === undefined
          ? current?.preferredLanguage ?? null
          : patch.preferredLanguage
    });
  }

  return (
    <section className="rounded-[1.5rem] border-[5px] border-black bg-white p-4 shadow-[8px_8px_0_#050505] dark:bg-slate-950">
      <div className="flex flex-col gap-2 border-b-[4px] border-black pb-4">
        <p className="text-sm font-black uppercase text-[#2b0b64] dark:text-[#ffd24a]">
          Source controls
        </p>
        <h2 className="text-3xl font-black uppercase text-black dark:text-white">
          Tune who gets through
        </h2>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Mute noisy outlets, prioritize trusted ones, and filter sensational
          wording per source.
        </p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {topSources.length === 0 && (
          <p className="rounded-2xl border-[3px] border-black bg-[#f4f0ff] p-4 text-sm font-bold text-black">
            Load your feed to reveal source controls.
          </p>
        )}
        {topSources.map(([source, count]) => {
          const current = preferenceBySource.get(source.toLowerCase());
          const action = current?.action ?? "NEUTRAL";

          return (
            <div
              className="rounded-2xl border-[3px] border-black bg-[#f4f0ff] p-4 text-black"
              key={source}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-black">{source}</h3>
                  <p className="text-xs font-bold text-black/70">
                    {count} loaded articles
                  </p>
                </div>
                <span className="rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-black">
                  {action.toLowerCase()}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className={`inline-flex items-center gap-1 rounded-full border-2 border-black px-3 py-2 text-xs font-black ${
                    action === "PRIORITIZE" ? "bg-[#ffd24a]" : "bg-white"
                  }`}
                  onClick={() =>
                    updateSource(source, {
                      action: action === "PRIORITIZE" ? "NEUTRAL" : "PRIORITIZE"
                    })
                  }
                  type="button"
                >
                  <Star className="size-3.5" />
                  Prioritize
                </button>
                <button
                  className={`inline-flex items-center gap-1 rounded-full border-2 border-black px-3 py-2 text-xs font-black ${
                    action === "MUTE" ? "bg-black text-white" : "bg-white"
                  }`}
                  onClick={() =>
                    updateSource(source, {
                      action: action === "MUTE" ? "NEUTRAL" : "MUTE"
                    })
                  }
                  type="button"
                >
                  <EyeOff className="size-3.5" />
                  Mute
                </button>
                <button
                  className={`rounded-full border-2 border-black px-3 py-2 text-xs font-black ${
                    current?.hideSensational ? "bg-[#ffd24a]" : "bg-white"
                  }`}
                  onClick={() =>
                    updateSource(source, {
                      hideSensational: !(current?.hideSensational ?? false)
                    })
                  }
                  type="button"
                >
                  Hide sensational
                </button>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <select
                  className="rounded-full border-2 border-black bg-white px-3 py-2 text-xs font-black"
                  onChange={(event) =>
                    updateSource(source, {
                      preferredRegion: event.target.value || null
                    })
                  }
                  value={current?.preferredRegion ?? ""}
                >
                  <option value="">Any region</option>
                  {regions.map((region) => (
                    <option key={region.value} value={region.value}>
                      {region.label}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-full border-2 border-black bg-white px-3 py-2 text-xs font-black"
                  onChange={(event) =>
                    updateSource(source, {
                      preferredLanguage: event.target.value || null
                    })
                  }
                  value={current?.preferredLanguage ?? ""}
                >
                  <option value="">Any language</option>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function countBy(
  articles: ArticlePreview[],
  getKey: (article: ArticlePreview) => string
) {
  return articles.reduce<Record<string, number>>((counts, article) => {
    const key = getKey(article);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function BriefingPanel({
  articles,
  preferences
}: {
  articles: ArticlePreview[];
  preferences: FeedPreferences;
}) {
  const selectedTopic =
    FEED_TOPICS.find((topic) => topic.value === preferences.topic)?.label ??
    "All topics";
  const briefingArticles = articles
    .slice()
    .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
    .slice(0, 10);

  function exportBriefing() {
    const lines = [
      `Neural News briefing`,
      `Topic: ${selectedTopic}`,
      `Region: ${preferences.country.toUpperCase()}`,
      `Generated: ${new Date().toLocaleString()}`,
      "",
      ...briefingArticles.map(
        (article, index) =>
          `${index + 1}. ${article.title}\nSource: ${article.source}\nWhy: ${
            article.explanation ?? "Selected from your loaded feed."
          }\n${article.url ?? ""}\n`
      )
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "neural-news-briefing.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-[1.5rem] border-[5px] border-black bg-[#c9b8ff] p-4 shadow-[8px_8px_0_#050505]">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-black uppercase text-black">
            <Mail className="size-4" />
            Daily briefing
          </p>
          <h2 className="mt-1 text-3xl font-black uppercase text-black">
            Top 10 for you
          </h2>
          <p className="mt-2 text-sm font-bold text-black/75">
            Built from your current topic, region, ranking signals, and loaded feed.
          </p>
        </div>
        <button
          className="w-fit rounded-full border-[3px] border-black bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-[#ffd24a]"
          onClick={exportBriefing}
          type="button"
        >
          Export briefing
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {briefingArticles.length === 0 && (
          <p className="rounded-2xl border-[3px] border-black bg-white p-4 text-sm font-bold text-black">
            Load your feed to generate a briefing.
          </p>
        )}
        {briefingArticles.map((article, index) => (
          <article
            className="rounded-2xl border-[3px] border-black bg-white p-4 text-black"
            key={article.id}
          >
            <p className="text-xs font-black uppercase">#{index + 1}</p>
            <h3 className="mt-2 text-base font-black leading-tight">
              {article.title}
            </h3>
            <p className="mt-2 text-xs font-bold text-black/70">
              {article.explanation ?? article.source}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
