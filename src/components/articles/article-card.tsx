"use client";

import {
  Bookmark,
  Check,
  Clock,
  ExternalLink,
  ThumbsDown,
  Loader2,
  Sparkles,
  Wand2,
  X
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { sendAnalyticsEvent } from "@/components/analytics/analytics-provider";
import type { CachedArticleSummary } from "@/lib/ai/types";
import type { ArticlePreview } from "@/types/article";

export function ArticleCard({ article }: { article: ArticlePreview }) {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<CachedArticleSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canUseArticleActions = Boolean(article.article);

  function redirectToLogin() {
    router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  async function saveArticle() {
    if (!article.article || isSaving) return;

    if (status !== "authenticated") {
      redirectToLogin();
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article: article.article })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message ?? "Unable to save article.");
      }

      setIsSaved(true);
      sendAnalyticsEvent("save_article", {
        articleId: article.id,
        source: article.source,
        category: article.category
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save article.");
    } finally {
      setIsSaving(false);
    }
  }

  async function summarizeArticle() {
    if (!article.article || isSummarizing) return;

    if (status !== "authenticated") {
      redirectToLogin();
      return;
    }

    setIsSummarizing(true);
    setMessage(null);

    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article: {
            title: article.article.title,
            source: article.article.source,
            url: article.article.url,
            summary: article.article.summary,
            content: article.article.content,
            publishedAt: article.article.publishedAt
          }
        })
      });

      const payload = (await response.json().catch(() => null)) as {
        data?: CachedArticleSummary;
        message?: string;
      } | null;

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.message ?? "Unable to summarize article.");
      }

      setSummary(payload.data);
      sendAnalyticsEvent("summary_open", {
        articleId: article.id,
        source: article.source,
        category: article.category
      });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to summarize article."
      );
    } finally {
      setIsSummarizing(false);
    }
  }

  async function showFewerLikeThis() {
    if (!article.article) return;

    if (status !== "authenticated") {
      redirectToLogin();
      return;
    }

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        article: article.article,
        reason: "SHOW_FEWER"
      })
    });

    if (!response.ok) {
      setMessage("Unable to save feedback.");
      return;
    }

    sendAnalyticsEvent("show_fewer", {
      articleId: article.id,
      source: article.source,
      category: article.category
    });
    setIsDisliked(true);
    setMessage("Got it. You will see fewer like this.");
  }

  const title = (
    <h2 className="mt-4 text-xl font-black leading-tight tracking-normal text-black transition sm:text-2xl group-hover/link:text-[#2b0b64] dark:text-white dark:group-hover/link:text-[#ffd24a]">
      {article.title}
    </h2>
  );

  return (
    <article className="group flex min-h-[26rem] flex-col overflow-hidden rounded-[1.25rem] border-[3px] border-black bg-white shadow-[4px_4px_0_#050505] transition hover:-translate-y-1 hover:shadow-[7px_7px_0_#050505] sm:min-h-[30rem] sm:rounded-[1.5rem] sm:border-[4px] sm:shadow-[6px_6px_0_#050505] sm:hover:shadow-[10px_10px_0_#050505] dark:bg-slate-950">
      {article.url ? (
        <a
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          href={article.url}
          onClick={() =>
            sendAnalyticsEvent("article_open", {
              articleId: article.id,
              source: article.source,
              category: article.category
            })
          }
          rel="noreferrer"
          target="_blank"
        >
          <ArticleImage article={article} />
        </a>
      ) : (
        <ArticleImage article={article} />
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3 text-xs font-black uppercase text-slate-600 dark:text-slate-300">
          <span className="truncate rounded-full bg-[#ffd24a] px-3 py-1 text-black">{article.source}</span>
          <span className="flex shrink-0 items-center gap-1 rounded-full border-2 border-black px-3 py-1 text-black dark:border-white dark:text-white">
            <Clock className="size-3.5" />
            {article.readTime ?? "4 min"}
          </span>
        </div>

        {article.url ? (
          <a
            className="group/link focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            href={article.url}
            onClick={() =>
              sendAnalyticsEvent("article_open", {
                articleId: article.id,
                source: article.source,
                category: article.category
              })
            }
            rel="noreferrer"
            target="_blank"
          >
            {title}
          </a>
        ) : (
          title
        )}

        <p className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">
          {article.summary}
        </p>

        {article.explanation && (
          <p className="mt-3 rounded-xl border-2 border-black bg-[#f4f0ff] px-3 py-2 text-xs font-bold text-black">
            {article.explanation}
          </p>
        )}

        {message && (
          <p className="mt-4 rounded-xl border-[3px] border-black bg-[#ffd24a] px-3 py-2 text-xs font-bold text-black">
            {message}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="flex min-w-0 items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-300">
            <Sparkles className="size-4 shrink-0 text-[#2b0b64] dark:text-[#ffd24a]" />
            <span className="truncate">{article.publishedAt}</span>
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <button
              aria-label="Summarize article"
              className="grid size-9 place-items-center rounded-full border-[3px] border-black bg-white text-black transition hover:bg-[#c9b8ff] disabled:cursor-not-allowed disabled:opacity-50 sm:size-10"
              disabled={!canUseArticleActions || isSummarizing}
              onClick={summarizeArticle}
              title="Summarize"
              type="button"
            >
              {isSummarizing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Wand2 className="size-4" />
              )}
            </button>
            <button
              aria-label="Save article"
              className="grid size-9 place-items-center rounded-full border-[3px] border-black bg-white text-black transition hover:bg-[#ffd24a] disabled:cursor-not-allowed disabled:opacity-50 sm:size-10"
              disabled={!canUseArticleActions || isSaving}
              onClick={saveArticle}
              title="Save"
              type="button"
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isSaved ? (
                <Check className="size-4" />
              ) : (
                <Bookmark className="size-4" />
              )}
            </button>
            {article.url && (
              <a
                aria-label="Open article"
                className="grid size-9 place-items-center rounded-full border-[3px] border-black bg-black text-white transition hover:bg-[#2b0b64] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd24a] sm:size-10"
                href={article.url}
                onClick={() =>
                  sendAnalyticsEvent("article_open", {
                    articleId: article.id,
                    source: article.source,
                    category: article.category
                  })
                }
                rel="noreferrer"
                target="_blank"
                title="Open"
              >
                <ExternalLink className="size-4" />
              </a>
            )}
            <button
              aria-label="Show fewer like this"
              className={`grid size-9 place-items-center rounded-full border-[3px] border-black text-black transition disabled:cursor-not-allowed disabled:opacity-50 sm:size-10 ${
                isDisliked ? "bg-[#ff6b6b]" : "bg-white hover:bg-[#f4f0ff]"
              }`}
              disabled={!canUseArticleActions}
              onClick={showFewerLikeThis}
              title="Show fewer like this"
              type="button"
            >
              <ThumbsDown className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {summary && (
        <SummaryDialog
          source={article.source}
          summary={summary}
          title={article.title}
          url={article.url}
          onClose={() => setSummary(null)}
        />
      )}
    </article>
  );
}

function ArticleImage({ article }: { article: ArticlePreview }) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden border-b-[4px] border-black bg-[#c9b8ff]">
      {article.imageUrl ? (
        <Image
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          src={article.imageUrl}
        />
      ) : (
        <div className="h-full w-full bg-[repeating-linear-gradient(135deg,#fff_0,#fff_12px,#f4f0ff_12px,#f4f0ff_24px)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-black uppercase text-black shadow-sm">
          {article.category}
        </span>
        {article.trend && (
          <span className="rounded-full border-2 border-black bg-[#ffd24a] px-3 py-1 text-xs font-black text-black shadow-sm">
            {article.trend}
          </span>
        )}
      </div>
    </div>
  );
}

function SummaryDialog({
  onClose,
  source,
  summary,
  title,
  url
}: {
  onClose: () => void;
  source: string;
  summary: CachedArticleSummary;
  title: string;
  url?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm">
      <section className="w-full max-w-2xl overflow-hidden rounded-[1.5rem] border-[5px] border-black bg-white shadow-[12px_12px_0_#ffd24a] dark:bg-slate-950">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 p-5 pb-0">
            <p className="text-sm font-black uppercase text-[#2b0b64] dark:text-[#ffd24a]">
              Summary
            </p>
            <h3 className="mt-2 break-words text-xl font-black leading-tight text-black dark:text-white">
              {title}
            </h3>
          </div>
          <button
            aria-label="Close summary"
            className="mr-5 mt-5 grid size-10 shrink-0 place-items-center rounded-full border-[3px] border-black bg-[#ffd24a] text-black"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 max-h-[65vh] space-y-5 overflow-y-auto border-t-[4px] border-black p-5 text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">
          <div>
            <h4 className="font-black uppercase text-slate-950 dark:text-white">
              2-line summary
            </h4>
            <ul className="mt-2 space-y-2 break-words">
              {summary.twoLineSummary.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-black uppercase text-slate-950 dark:text-white">
              Explain simply
            </h4>
            <p className="mt-2 break-words">{summary.explainSimply}</p>
          </div>
          <div>
            <h4 className="font-black uppercase text-slate-950 dark:text-white">
              Key takeaways
            </h4>
            <ul className="mt-2 list-disc space-y-1 break-words pl-5">
              {summary.keyTakeaways.map((takeaway) => (
                <li key={takeaway}>{takeaway}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-black uppercase text-slate-950 dark:text-white">
              Why this matters
            </h4>
            <p className="mt-2 break-words">{summary.whyThisMatters}</p>
          </div>
          <div className="rounded-2xl border-[3px] border-black bg-[#ffd24a] p-4 text-black">
            <h4 className="font-black uppercase">Potential bias / viewpoint note</h4>
            <p className="mt-2 break-words">{summary.viewpointNote}</p>
          </div>
          <div>
            <h4 className="font-black uppercase text-slate-950 dark:text-white">
              Source citations
            </h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {url ? (
                <a
                  className="rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-black text-black transition hover:bg-[#c9b8ff]"
                  href={url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {source}
                </a>
              ) : (
                <span className="rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-black text-black">
                  {source}
                </span>
              )}
              <span className="rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-black text-black">
                Model {summary.model}
              </span>
              {summary.articleHash && (
                <span className="rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-black text-black">
                  Summary ID {summary.articleHash.slice(0, 8)}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
