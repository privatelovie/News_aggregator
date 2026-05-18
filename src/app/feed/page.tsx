import type { Metadata } from "next";
import { InfiniteFeed } from "@/components/feed/infinite-feed";

export const metadata: Metadata = {
  title: "Personalized Feed",
  description:
    "Infinite personalized article feed ranked by embeddings, behavior, recency, and trending signals."
};

export default function FeedPage() {
  return (
    <main className="mx-auto flex w-full max-w-[86rem] flex-col gap-6 px-3 py-5 sm:px-5 lg:px-6">
      <section className="rounded-[2rem] border-[5px] border-black bg-white p-5 shadow-[10px_10px_0_#050505] dark:bg-slate-950">
        <p className="text-sm font-black uppercase tracking-wide text-[#2b0b64] dark:text-[#ffd24a]">
          Personalized
        </p>
        <h1 className="mt-3 text-5xl font-black uppercase text-black dark:text-white">
          Your ranked feed
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">
          Articles load continuously and are ordered using your profile
          embedding, behavior score, recency, and trending momentum.
        </p>
      </section>

      <InfiniteFeed />
    </main>
  );
}
