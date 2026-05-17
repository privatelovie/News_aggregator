import { Clock, ExternalLink, Sparkles } from "lucide-react";
import Image from "next/image";
import type { ArticlePreview } from "@/types/article";

export function ArticleCard({ article }: { article: ArticlePreview }) {
  const title = (
    <h2 className="mt-4 text-xl font-semibold tracking-normal text-slate-950 transition group-hover/link:text-teal-700 dark:text-white dark:group-hover/link:text-teal-300">
      {article.title}
    </h2>
  );

  return (
    <article className="group flex min-h-[26rem] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
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
          <span>{article.source}</span>
          <span className="flex items-center gap-1">
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

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="flex min-w-0 items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <Sparkles className="size-4 shrink-0 text-teal-500" />
            <span className="truncate">{article.publishedAt}</span>
          </span>
          {article.url && (
            <a
              aria-label="Open article"
              className="grid size-9 shrink-0 place-items-center rounded-md border border-slate-200 text-slate-600 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:border-slate-800 dark:text-slate-300 dark:hover:border-white dark:hover:bg-white dark:hover:text-slate-950"
              href={article.url}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink className="size-4" />
            </a>
          )}
        </div>
      </div>
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
        <div className="h-full w-full bg-gradient-to-br from-teal-200 via-white to-rose-200 dark:from-teal-900 dark:via-slate-950 dark:to-rose-950" />
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
