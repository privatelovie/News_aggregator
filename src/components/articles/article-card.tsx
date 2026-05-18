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
    <h2 className="mt-4 text-2xl font-black leading-tight tracking-normal text-black transition group-hover/link:text-[#2b0b64] dark:text-white dark:group-hover/link:text-[#ffd24a]">
      {article.title}
    </h2>
  );

  return (
    <article className="group flex min-h-[30rem] flex-col overflow-hidden rounded-[1.5rem] border-[4px] border-black bg-white shadow-[6px_6px_0_#050505] transition hover:-translate-y-1 hover:shadow-[10px_10px_0_#050505] dark:bg-slate-950">
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
              className="grid size-10 place-items-center rounded-full border-[3px] border-black bg-white text-black transition hover:bg-[#c9b8ff] disabled:cursor-not-allowed disabled:opacity-50"
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
              className="grid size-10 place-items-center rounded-full border-[3px] border-black bg-white text-black transition hover:bg-[#ffd24a] disabled:cursor-not-allowed disabled:opacity-50"
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
                className="grid size-10 place-items-center rounded-full border-[3px] border-black bg-black text-white transition hover:bg-[#2b0b64] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd24a]"
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
  summary,
  title
}: {
  onClose: () => void;
  summary: CachedArticleSummary;
  title: string;
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
            <h4 className="font-semibold text-slate-950 dark:text-white">
              Three-line brief
            </h4>
            <ul className="mt-2 space-y-2 break-words">
              {summary.threeLineSummary.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-950 dark:text-white">
              Explain simply
            </h4>
            <p className="mt-2 break-words">{summary.explainSimply}</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-950 dark:text-white">
              Key takeaways
            </h4>
            <ul className="mt-2 list-disc space-y-1 break-words pl-5">
              {summary.keyTakeaways.map((takeaway) => (
                <li key={takeaway}>{takeaway}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-950 dark:text-white">
              Why this matters
            </h4>
            <p className="mt-2 break-words">{summary.whyThisMatters}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
