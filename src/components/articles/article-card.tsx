"use client";

import {
  Bookmark,
  Check,
  Clock,
  ExternalLink,
  Loader2,
  Sparkles,
  Wand2,
  X
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import type { CachedArticleSummary } from "@/lib/ai/types";
import type { ArticlePreview } from "@/types/article";

export function ArticleCard({ article }: { article: ArticlePreview }) {
  const { status } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<CachedArticleSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canUseArticleActions = Boolean(article.article);

  async function saveArticle() {
    if (!article.article || isSaving) return;

    if (status !== "authenticated") {
      setMessage("Sign in to save articles.");
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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save article.");
    } finally {
      setIsSaving(false);
    }
  }

  async function summarizeArticle() {
    if (!article.article || isSummarizing) return;

    if (status !== "authenticated") {
      setMessage("Sign in to summarize articles.");
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
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to summarize article."
      );
    } finally {
      setIsSummarizing(false);
    }
  }

  const title = (
    <h2 className="mt-4 text-xl font-semibold tracking-normal text-slate-950 transition group-hover/link:text-teal-700 dark:text-white dark:group-hover/link:text-teal-300">
      {article.title}
    </h2>
  );

  return (
    <article className="group flex min-h-[28rem] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
      {article.url ? (
        <a
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          href={article.url}
          rel="noreferrer"
          target="_blank"
        >
          <ArticleImage article={article} />
        </a>
      ) : (
        <ArticleImage article={article} />
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="truncate">{article.source}</span>
          <span className="flex shrink-0 items-center gap-1">
            <Clock className="size-3.5" />
            {article.readTime ?? "4 min"}
          </span>
        </div>

        {article.url ? (
          <a
            className="group/link focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            href={article.url}
            rel="noreferrer"
            target="_blank"
          >
            {title}
          </a>
        ) : (
          title
        )}

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {article.summary}
        </p>

        {message && (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            {message}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="flex min-w-0 items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <Sparkles className="size-4 shrink-0 text-teal-500" />
            <span className="truncate">{article.publishedAt}</span>
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <button
              aria-label="Summarize article"
              className="grid size-9 place-items-center rounded-md border border-slate-200 text-slate-600 transition hover:border-teal-700 hover:bg-teal-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-300"
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
              className="grid size-9 place-items-center rounded-md border border-slate-200 text-slate-600 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:border-white dark:hover:bg-white dark:hover:text-slate-950"
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
                className="grid size-9 place-items-center rounded-md border border-slate-200 text-slate-600 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:border-slate-800 dark:text-slate-300 dark:hover:border-white dark:hover:bg-white dark:hover:text-slate-950"
                href={article.url}
                rel="noreferrer"
                target="_blank"
                title="Open"
              >
                <ExternalLink className="size-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {summary && (
        <SummaryDialog summary={summary} title={article.title} onClose={() => setSummary(null)} />
      )}
    </article>
  );
}

function ArticleImage({ article }: { article: ArticlePreview }) {
  return (
    <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-900">
      {article.imageUrl ? (
        <Image
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          src={article.imageUrl}
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-slate-100 via-white to-teal-100 dark:from-slate-900 dark:via-slate-950 dark:to-teal-950" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
      <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-950 shadow-sm">
          {article.category}
        </span>
        {article.trend && (
          <span className="rounded-md bg-teal-300/95 px-2.5 py-1 text-xs font-medium text-slate-950 shadow-sm">
            {article.trend}
          </span>
        )}
      </div>
    </div>
  );
}

function SummaryDialog({
  onClose,
  summary,
  title
}: {
  onClose: () => void;
  summary: CachedArticleSummary;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
              AI summary
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
              {title}
            </h3>
          </div>
          <button
            aria-label="Close summary"
            className="grid size-9 shrink-0 place-items-center rounded-md border border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-300"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-sm leading-6 text-slate-700 dark:text-slate-300">
          <div>
            <h4 className="font-semibold text-slate-950 dark:text-white">
              Three-line brief
            </h4>
            <ul className="mt-2 space-y-2">
              {summary.threeLineSummary.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-950 dark:text-white">
              Explain simply
            </h4>
            <p className="mt-2">{summary.explainSimply}</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-950 dark:text-white">
              Key takeaways
            </h4>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {summary.keyTakeaways.map((takeaway) => (
                <li key={takeaway}>{takeaway}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-950 dark:text-white">
              Why this matters
            </h4>
            <p className="mt-2">{summary.whyThisMatters}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
