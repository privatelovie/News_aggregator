"use client";

import {
  Bookmark,
  ExternalLink,
  Heart,
  Loader2,
  RefreshCcw,
  ThumbsDown
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { sendAnalyticsEvent } from "@/components/analytics/analytics-provider";
import { toArticlePreview } from "@/lib/articles/preview";
import { FEED_TOPICS } from "@/lib/constants";
import type { UnifiedArticle } from "@/lib/news/types";
import type { ArticlePreview } from "@/types/article";

type FeedArticle = UnifiedArticle & {
  recommendationScore?: number;
};

type PersistedFeedPreference = {
  topics: string[];
  location: string;
};

type SwipeDirection = "left" | "right";

export function HomeBriefingSwipe() {
  const { status } = useSession();
  const [articles, setArticles] = useState<ArticlePreview[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSignal, setIsSavingSignal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSwipe, setLastSwipe] = useState<SwipeDirection | null>(null);

  const currentArticle = articles[currentIndex];
  const nextArticle = articles[currentIndex + 1];
  const progress = articles.length
    ? `${Math.min(currentIndex + 1, articles.length)} / ${articles.length}`
    : "0 / 0";

  const loadBriefing = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLastSwipe(null);

    try {
      const preferenceResponse = await fetch("/api/preferences", {
        cache: "no-store"
      });
      let topic = "all";
      let country = "us";

      if (preferenceResponse.ok) {
        const payload = (await preferenceResponse.json()) as {
          data?: PersistedFeedPreference | null;
        };

        topic = payload.data?.topics[0] ?? topic;
        country = payload.data?.location ?? country;
      }

      const selectedTopic = FEED_TOPICS.find((item) => item.value === topic);
      const params = new URLSearchParams({
        country,
        pageSize: "12"
      });

      if (selectedTopic?.type === "category") {
        params.set("category", selectedTopic.value);
      }

      if (selectedTopic?.type === "query") {
        params.set("q", selectedTopic.value);
      }

      const response = await fetch(`/api/feed?${params}`, { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Unable to load your briefing.");
      }

      const payload = (await response.json()) as { data?: FeedArticle[] };
      const nextArticles = (payload.data ?? []).map(toArticlePreview);

      setArticles(nextArticles);
      setCurrentIndex(0);

      if (nextArticles.length === 0) {
        setError("No personalized briefing stories are ready yet.");
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load your briefing."
      );
      setArticles([]);
      setCurrentIndex(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBriefing();
  }, [loadBriefing]);

  const cardClassName = useMemo(() => {
    if (lastSwipe === "right") {
      return "translate-x-3 rotate-1 bg-[#ffd24a]";
    }

    if (lastSwipe === "left") {
      return "-translate-x-3 -rotate-1 bg-[#f4f0ff]";
    }

    return "translate-x-0 rotate-0 bg-white";
  }, [lastSwipe]);

  async function likeArticle() {
    if (!currentArticle?.article || isSavingSignal) return;

    if (status !== "authenticated") {
      setError("Sign in to like stories and tune your briefing.");
      return;
    }

    setIsSavingSignal(true);

    try {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article: currentArticle.article })
      });

      if (!response.ok) {
        throw new Error("Unable to save your like.");
      }

      sendAnalyticsEvent("briefing_like", {
        articleId: currentArticle.id,
        source: currentArticle.source,
        category: currentArticle.category
      });
      advance("right");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to save your like."
      );
    } finally {
      setIsSavingSignal(false);
    }
  }

  async function dislikeArticle() {
    if (!currentArticle?.article || isSavingSignal) return;

    if (status !== "authenticated") {
      setError("Sign in to dislike stories and tune your briefing.");
      return;
    }

    setIsSavingSignal(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article: currentArticle.article,
          reason: "SHOW_FEWER"
        })
      });

      if (!response.ok) {
        throw new Error("Unable to save your dislike.");
      }

      sendAnalyticsEvent("briefing_dislike", {
        articleId: currentArticle.id,
        source: currentArticle.source,
        category: currentArticle.category
      });
      advance("left");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save your dislike."
      );
    } finally {
      setIsSavingSignal(false);
    }
  }

  function skipArticle() {
    advance("left");
  }

  function advance(direction: SwipeDirection) {
    setLastSwipe(direction);
    window.setTimeout(() => {
      setCurrentIndex((index) => {
        if (index + 1 >= articles.length) {
          void loadBriefing();
          return index;
        }

        return index + 1;
      });
      setLastSwipe(null);
      setError(null);
    }, 220);
  }

  return (
    <section className="mt-5 w-full max-w-3xl sm:mt-7">
      <div className="rounded-[1.25rem] border-[3px] border-black bg-[#c9b8ff] p-2 shadow-[4px_4px_0_#050505] sm:rounded-[1.5rem] sm:border-[4px] sm:p-3 sm:shadow-[8px_8px_0_#050505]">
        <div className="flex items-center justify-between gap-3 border-b-[3px] border-black pb-3 sm:border-b-[4px]">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-black">
              Daily briefing
            </p>
            <h2 className="text-lg font-black uppercase leading-tight text-black sm:text-xl">
              Swipe your For You story
            </h2>
          </div>
          <button
            aria-label="Reload briefing"
            className="grid size-9 shrink-0 place-items-center rounded-full border-[3px] border-black bg-white text-black transition hover:bg-[#ffd24a] sm:size-10"
            onClick={() => void loadBriefing()}
            type="button"
          >
            <RefreshCcw className="size-4" />
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-2xl border-[3px] border-black bg-[#ffd24a] p-3 text-sm font-black text-black">
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="mt-3 grid min-h-56 place-items-center rounded-[1rem] border-[3px] border-black bg-white text-black sm:min-h-72 sm:rounded-[1.25rem]">
            <Loader2 className="size-8 animate-spin" />
          </div>
        ) : currentArticle ? (
          <article
            className={`mt-3 min-h-[26rem] rounded-[1rem] border-[3px] border-black p-3 text-black transition duration-200 sm:min-h-80 sm:rounded-[1.25rem] sm:p-4 ${cardClassName}`}
          >
            <div className="flex items-center justify-between gap-3 text-xs font-black uppercase">
              <span className="min-w-0 truncate rounded-full border-2 border-black bg-[#ffd24a] px-3 py-1">
                {currentArticle.source}
              </span>
              <span className="shrink-0">{progress}</span>
            </div>
            <h3 className="mt-4 text-[1.55rem] font-black leading-tight sm:text-3xl">
              {currentArticle.title}
            </h3>
            <p className="mt-3 line-clamp-4 text-sm font-bold leading-6 text-black/75">
              {currentArticle.summary}
            </p>
            {currentArticle.explanation && (
              <p className="mt-4 rounded-2xl border-2 border-black bg-[#f4f0ff] p-3 text-xs font-black">
                {currentArticle.explanation}
              </p>
            )}
            {nextArticle && (
              <p className="mt-3 text-xs font-black uppercase text-black/60">
                Next up: {nextArticle.source}
              </p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2 min-[430px]:flex min-[430px]:flex-wrap min-[430px]:items-center">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full border-[3px] border-black bg-white px-3 py-2 text-sm font-black transition hover:bg-[#f4f0ff] sm:px-4"
                disabled={isSavingSignal}
                onClick={dislikeArticle}
                type="button"
              >
                <ThumbsDown className="size-4" />
                Dislike
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full border-[3px] border-black bg-[#ffd24a] px-3 py-2 text-sm font-black transition hover:bg-white sm:px-4"
                disabled={isSavingSignal}
                onClick={likeArticle}
                type="button"
              >
                <Heart className="size-4" />
                Like
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full border-[3px] border-black bg-white px-3 py-2 text-sm font-black transition hover:bg-[#ffd24a] sm:px-4"
                onClick={skipArticle}
                type="button"
              >
                <Bookmark className="size-4" />
                Skip
              </button>
              {currentArticle.url && (
                <a
                  className="inline-flex items-center justify-center gap-2 rounded-full border-[3px] border-black bg-black px-3 py-2 text-sm font-black text-white transition hover:bg-[#2b0b64] sm:px-4"
                  href={currentArticle.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLink className="size-4" />
                  Read
                </a>
              )}
            </div>
          </article>
        ) : (
          <p className="mt-3 rounded-[1.25rem] border-[3px] border-black bg-white p-4 text-sm font-black text-black">
            Your briefing is empty right now.
          </p>
        )}
      </div>
    </section>
  );
}
