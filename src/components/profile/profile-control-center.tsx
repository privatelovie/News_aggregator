"use client";

import { Download, EyeOff, RefreshCcw, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
  location: string;
};

const regions = [
  { label: "United States", value: "us" },
  { label: "India", value: "in" },
  { label: "United Kingdom", value: "gb" },
  { label: "Australia", value: "au" },
  { label: "Canada", value: "ca" }
] as const;

export function ProfileControlCenter() {
  const [articles, setArticles] = useState<ArticlePreview[]>([]);
  const [preferences, setPreferences] = useState<FeedPreferences>({
    topic: "all",
    country: "us"
  });
  const [sourcePreferences, setSourcePreferences] = useState<SourcePreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSourcePreferences = useCallback(async () => {
    const response = await fetch("/api/source-preferences", { cache: "no-store" });

    if (response.ok) {
      const payload = (await response.json()) as { data?: SourcePreference[] };
      setSourcePreferences(payload.data ?? []);
    }
  }, []);

  const loadControlData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const preferenceResponse = await fetch("/api/preferences", {
        cache: "no-store"
      });
      let nextPreferences: FeedPreferences = { topic: "all", country: "us" };

      if (preferenceResponse.ok) {
        const payload = (await preferenceResponse.json()) as {
          data?: PersistedFeedPreference | null;
        };

        if (payload.data) {
          nextPreferences = {
            topic: payload.data.topics[0] ?? "all",
            country: payload.data.location ?? "us"
          };
        }
      }

      const params = new URLSearchParams({
        pageSize: "18",
        country: nextPreferences.country
      });
      const selectedTopic = FEED_TOPICS.find(
        (topic) => topic.value === nextPreferences.topic
      );

      if (selectedTopic?.type === "category") {
        params.set("category", selectedTopic.value);
      }

      if (selectedTopic?.type === "query") {
        params.set("q", selectedTopic.value);
      }

      const feedResponse = await fetch(`/api/feed?${params}`, {
        cache: "no-store"
      });

      if (!feedResponse.ok) {
        throw new Error("Unable to load profile panels.");
      }

      const feedPayload = (await feedResponse.json()) as { data?: FeedArticle[] };
      setPreferences(nextPreferences);
      setArticles((feedPayload.data ?? []).map(toArticlePreview));
      await loadSourcePreferences();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load profile panels."
      );
    } finally {
      setIsLoading(false);
    }
  }, [loadSourcePreferences]);

  useEffect(() => {
    void loadControlData();
  }, [loadControlData]);

  async function saveSourcePreference(nextPreference: Omit<SourcePreference, "id">) {
    const response = await fetch("/api/source-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextPreference)
    });

    if (!response.ok) {
      setError("Unable to save source control.");
      return;
    }

    await loadControlData();
  }

  return (
    <section className="space-y-5">
      <div className="rounded-[1.5rem] border-[5px] border-black bg-[#ffd24a] p-4 text-black shadow-[8px_8px_0_#050505]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase">Profile control center</p>
            <h2 className="mt-1 text-3xl font-black uppercase">
              Sources and analyst tools
            </h2>
            <p className="mt-2 text-sm font-bold text-black/75">
              These tools use your saved feed preferences and ranked article set.
            </p>
          </div>
          <button
            className="inline-flex w-fit items-center gap-2 rounded-full border-[3px] border-black bg-white px-4 py-2 text-sm font-black"
            onClick={() => void loadControlData()}
            type="button"
          >
            <RefreshCcw className="size-4" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-[1.5rem] border-[4px] border-black bg-white p-4 text-sm font-black text-black">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="rounded-[1.5rem] border-[4px] border-black bg-white p-4 text-sm font-black text-black">
          Loading profile tools...
        </p>
      ) : (
        <>
          <SourceControlsPanel
            articles={articles}
            preferences={sourcePreferences}
            onSave={saveSourcePreference}
          />
          <FeedAnalyticsPanel articles={articles} preferences={preferences} />
        </>
      )}
    </section>
  );
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
      preferences: { ...preferences, topicLabel: selectedTopic },
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
