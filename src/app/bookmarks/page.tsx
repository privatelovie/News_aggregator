import type { Metadata } from "next";
import { BookmarksList } from "@/components/bookmarks/bookmarks-list";

export const metadata: Metadata = {
  title: "Saved Articles",
  description: "View your saved news articles."
};

export default function BookmarksPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-teal-600 dark:text-teal-300">
          Saved
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-950 dark:text-white">
          Bookmarks
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Revisit articles you saved while reading your personalized feed.
        </p>
      </section>

      <BookmarksList />
    </main>
  );
}
