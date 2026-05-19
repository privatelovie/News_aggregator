"use client";

import { Download, Save } from "lucide-react";
import Link from "next/link";
import { useMemo, useEffect, useState } from "react";
import { ArticleCard } from "@/components/articles/article-card";
import { ArticleCardSkeleton } from "@/components/articles/article-card-skeleton";
import type { UnifiedArticle } from "@/lib/news/types";
import type { ArticlePreview } from "@/types/article";

type BookmarkedArticle = {
  id: string;
  createdAt: string;
  folder: string;
  tags: string[];
  note: string | null;
  offlineSnapshot: string | null;
  offlineSavedAt: string | null;
  article: {
    id: string;
    title: string;
    source: string;
    summary: string | null;
    imageUrl: string | null;
    content: string | null;
    publishedAt: string;
    url: string | null;
    category: {
      name: string;
      slug: string;
    };
  };
};

export function BookmarksList() {
  const [bookmarks, setBookmarks] = useState<BookmarkedArticle[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadBookmarks() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/bookmarks", { cache: "no-store" });

        if (response.status === 401) {
          setIsUnauthorized(true);
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load saved articles.");
        }

        const payload = (await response.json()) as { data?: BookmarkedArticle[] };

        if (isActive) {
          setBookmarks(payload.data ?? []);
        }
      } catch (caughtError) {
        if (isActive) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load saved articles."
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadBookmarks();

    return () => {
      isActive = false;
    };
  }, []);

  const folders = useMemo(
    () => ["All", ...Array.from(new Set(bookmarks.map((bookmark) => bookmark.folder)))],
    [bookmarks]
  );
  const filteredBookmarks =
    selectedFolder === "All"
      ? bookmarks
      : bookmarks.filter((bookmark) => bookmark.folder === selectedFolder);
  const allTags = Array.from(
    new Set(bookmarks.flatMap((bookmark) => bookmark.tags))
  ).sort();

  async function updateBookmark(
    bookmark: BookmarkedArticle,
    metadata: Partial<Pick<BookmarkedArticle, "folder" | "tags" | "note" | "offlineSnapshot">>
  ) {
    const response = await fetch("/api/bookmarks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookmarkId: bookmark.id,
        folder: metadata.folder ?? bookmark.folder,
        tags: metadata.tags ?? bookmark.tags,
        note: metadata.note ?? bookmark.note,
        offlineSnapshot:
          metadata.offlineSnapshot === undefined
            ? bookmark.offlineSnapshot
            : metadata.offlineSnapshot
      })
    });

    if (!response.ok) {
      setError("Unable to update saved article.");
      return;
    }

    const payload = (await response.json()) as { data?: BookmarkedArticle };

    if (payload.data) {
      setBookmarks((current) =>
        current.map((item) => (item.id === payload.data?.id ? payload.data : item))
      );
    }
  }

  function exportBookmarks() {
    const payload = {
      exportedAt: new Date().toISOString(),
      folders: folders.filter((folder) => folder !== "All"),
      tags: allTags,
      bookmarks: bookmarks.map((bookmark) => ({
        folder: bookmark.folder,
        tags: bookmark.tags,
        note: bookmark.note,
        offlineSnapshot: bookmark.offlineSnapshot,
        title: bookmark.article.title,
        source: bookmark.article.source,
        url: bookmark.article.url
      }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "news-bookmarks.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (isUnauthorized) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <p className="text-slate-600 dark:text-slate-300">
          Sign in to view your saved articles.
        </p>
        <Link
          className="mt-4 inline-flex rounded-md bg-slate-950 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          href="/login?callbackUrl=/bookmarks"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {!isLoading && bookmarks.length > 0 && (
        <div className="rounded-[1.5rem] border-[5px] border-black bg-[#c9b8ff] p-4 text-black shadow-[8px_8px_0_#050505]">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase">Bookmarks 2.0</p>
              <h2 className="mt-1 text-3xl font-black uppercase">
                Folders, tags, notes
              </h2>
              <p className="mt-2 text-sm font-bold text-black/75">
                Organize saved reporting and keep an offline snapshot for later.
              </p>
            </div>
            <button
              className="inline-flex w-fit items-center gap-2 rounded-full border-[3px] border-black bg-white px-4 py-2 text-sm font-black transition hover:bg-[#ffd24a]"
              onClick={exportBookmarks}
              type="button"
            >
              <Download className="size-4" />
              Export saved
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {folders.map((folder) => (
              <button
                className={`rounded-full border-[3px] border-black px-4 py-2 text-sm font-black ${
                  selectedFolder === folder ? "bg-[#ffd24a]" : "bg-white"
                }`}
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                type="button"
              >
                {folder}
              </button>
            ))}
          </div>

          {allTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
              {allTags.map((tag) => (
                <span
                  className="rounded-full border-2 border-black bg-white px-3 py-1"
                  key={tag}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <ArticleCardSkeleton key={index} />
            ))
          : filteredBookmarks.map((bookmark) => (
              <div className="space-y-3" key={bookmark.id}>
                <BookmarkEditor bookmark={bookmark} onUpdate={updateBookmark} />
                <ArticleCard article={toArticlePreview(bookmark)} />
              </div>
            ))}
      </div>

      {!isLoading && !error && bookmarks.length === 0 && (
        <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          You have not saved any articles yet.
        </p>
      )}
    </section>
  );
}

function BookmarkEditor({
  bookmark,
  onUpdate
}: {
  bookmark: BookmarkedArticle;
  onUpdate: (
    bookmark: BookmarkedArticle,
    metadata: Partial<
      Pick<BookmarkedArticle, "folder" | "tags" | "note" | "offlineSnapshot">
    >
  ) => Promise<void>;
}) {
  const [folder, setFolder] = useState(bookmark.folder);
  const [tags, setTags] = useState(bookmark.tags.join(", "));
  const [note, setNote] = useState(bookmark.note ?? "");
  const hasOfflineSnapshot = Boolean(bookmark.offlineSnapshot);

  useEffect(() => {
    setFolder(bookmark.folder);
    setTags(bookmark.tags.join(", "));
    setNote(bookmark.note ?? "");
  }, [bookmark]);

  return (
    <form
      className="rounded-2xl border-[3px] border-black bg-white p-3 text-black shadow-[4px_4px_0_#050505]"
      onSubmit={(event) => {
        event.preventDefault();
        void onUpdate(bookmark, {
          folder,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          note
        });
      }}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className="rounded-full border-2 border-black px-3 py-2 text-xs font-bold"
          onChange={(event) => setFolder(event.target.value)}
          placeholder="Folder"
          value={folder}
        />
        <input
          className="rounded-full border-2 border-black px-3 py-2 text-xs font-bold"
          onChange={(event) => setTags(event.target.value)}
          placeholder="tags, comma separated"
          value={tags}
        />
      </div>
      <textarea
        className="mt-2 min-h-20 w-full rounded-2xl border-2 border-black px-3 py-2 text-xs font-bold"
        onChange={(event) => setNote(event.target.value)}
        placeholder="Private note"
        value={note}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          className="inline-flex items-center gap-1 rounded-full border-2 border-black bg-[#ffd24a] px-3 py-2 text-xs font-black"
          type="submit"
        >
          <Save className="size-3.5" />
          Save metadata
        </button>
        <button
          className="rounded-full border-2 border-black bg-white px-3 py-2 text-xs font-black"
          onClick={() =>
            void onUpdate(bookmark, {
              folder,
              tags: tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
              note,
              offlineSnapshot: hasOfflineSnapshot
                ? null
                : buildOfflineSnapshot(bookmark)
            })
          }
          type="button"
        >
          {hasOfflineSnapshot ? "Remove offline" : "Save offline"}
        </button>
      </div>
    </form>
  );
}

function toArticlePreview(bookmark: BookmarkedArticle): ArticlePreview {
  return {
    id: bookmark.article.id,
    title: bookmark.article.title,
    source: bookmark.article.source,
    category: normalizeCategory(bookmark.article.category.slug),
    summary: bookmark.article.summary ?? "No summary available.",
    imageUrl: bookmark.article.imageUrl ?? undefined,
    publishedAt: formatPublishedAt(bookmark.article.publishedAt),
    url: bookmark.article.url ?? undefined,
    readTime: estimateReadTime(bookmark.article.summary),
    article: toUnifiedArticle(bookmark)
  };
}

function toUnifiedArticle(bookmark: BookmarkedArticle): UnifiedArticle {
  return {
    id: bookmark.article.id,
    title: bookmark.article.title,
    source: bookmark.article.source,
    category: normalizeUnifiedCategory(bookmark.article.category.slug),
    summary: bookmark.article.summary,
    imageUrl: bookmark.article.imageUrl,
    content: bookmark.article.content,
    publishedAt: bookmark.article.publishedAt,
    url: bookmark.article.url ?? "",
    author: null,
    providers: []
  };
}

function normalizeCategory(category: string): ArticlePreview["category"] {
  const normalized = category.toLowerCase();

  if (normalized === "sports") return "Sports";
  if (normalized === "politics") return "Politics";
  if (normalized === "business") return "Business";
  if (normalized === "science") return "Science";

  return "Tech";
}

function normalizeUnifiedCategory(category: string): UnifiedArticle["category"] {
  const normalized = category.toLowerCase();

  if (
    normalized === "sports" ||
    normalized === "politics" ||
    normalized === "business" ||
    normalized === "science" ||
    normalized === "technology" ||
    normalized === "general"
  ) {
    return normalized;
  }

  return "technology";
}

function formatPublishedAt(value: string) {
  const date = new Date(value);
  const diffHours = Math.max(0, (Date.now() - date.getTime()) / 36e5);

  if (!Number.isFinite(diffHours)) {
    return "Now";
  }

  if (diffHours < 1) {
    return "Just now";
  }

  if (diffHours < 24) {
    return `${Math.floor(diffHours)}h ago`;
  }

  return `${Math.floor(diffHours / 24)}d ago`;
}

function estimateReadTime(summary: string | null) {
  const words = summary?.trim().split(/\s+/).filter(Boolean).length ?? 120;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}

function buildOfflineSnapshot(bookmark: BookmarkedArticle) {
  return [
    bookmark.article.title,
    bookmark.article.source,
    bookmark.article.publishedAt,
    "",
    bookmark.article.summary ?? bookmark.article.content ?? "No saved text.",
    "",
    bookmark.article.url ?? ""
  ].join("\n");
}
