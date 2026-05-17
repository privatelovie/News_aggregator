import type { Metadata } from "next";
import { InfiniteFeed } from "@/components/feed/infinite-feed";

export const metadata: Metadata = {
  title: "Personalized Feed",
  description:
    "Infinite personalized article feed ranked by embeddings, behavior, recency, and trending signals."
};

export default function FeedPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-teal-600 dark:text-teal-300">
          Personalized
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-950 dark:text-white">
          Your ranked feed
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Articles load continuously and are ordered using your profile
          embedding, behavior score, recency, and trending momentum.
        </p>
      </section>

      <InfiniteFeed />
    </main>
  );
}
