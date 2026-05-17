import {
  Activity,
  ArrowRight,
  Brain,
  Flame,
  Gauge,
  Search,
  Sparkles,
  Zap
} from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArticleCardSkeleton } from "@/components/articles/article-card-skeleton";
import { SectionHeader } from "@/components/ui/section-header";
import { TRENDING_TOPICS } from "@/lib/constants";

const PersonalizedFeedSection = dynamic(
  () =>
    import("@/components/home/personalized-feed-section").then(
      (mod) => mod.PersonalizedFeedSection
    ),
  {
    loading: () => (
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <ArticleCardSkeleton key={index} />
        ))}
      </section>
    )
  }
);

const feedSignals = [
  { label: "Semantic match", value: "91%", icon: Brain },
  { label: "Freshness", value: "18m", icon: Zap },
  { label: "Trend lift", value: "+36%", icon: Activity }
];

const sidebarItems = [
  "Regulators draft AI disclosure rules",
  "Chip supply chain updates",
  "Space lab announces new payload",
  "Markets price in productivity gains"
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="grid min-h-[28rem] gap-0 lg:grid-cols-[1fr_300px]">
            <div className="flex flex-col justify-between p-6 sm:p-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-900 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-200">
                  <Sparkles className="size-4" />
                  AI-ranked briefing
                </div>
                <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 dark:text-white sm:text-6xl">
                  News that learns what matters to you.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
                  Personalized headlines, source-aware summaries, semantic
                  search, and behavior-based ranking in one responsive news
                  workspace.
                </p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {feedSignals.map((signal) => (
                  <div
                    className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70"
                    key={signal.label}
                  >
                    <signal.icon className="size-4 text-teal-600 dark:text-teal-300" />
                    <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
                      {signal.value}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {signal.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-80 overflow-hidden bg-slate-950">
              <Image
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-70"
                fill
                priority
                sizes="(min-width: 1024px) 300px, 100vw"
                src="https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=900&q=80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <div className="rounded-lg border border-white/10 bg-white/10 p-4 text-white backdrop-blur-md">
                  <p className="text-sm text-white/70">Live recommendation</p>
                  <p className="mt-2 text-lg font-semibold">
                    Embeddings, recency, and trend velocity are blended before
                    stories reach your feed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <SectionHeader title="Search" />
            <form action="/search" className="mt-4">
              <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                <Search className="size-4 text-slate-400" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  name="q"
                  placeholder="Search topics, sources, summaries"
                  type="search"
                />
              </label>
            </form>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <SectionHeader title="Signal Stack" />
            <div className="mt-4 space-y-3">
              {[
                ["User embedding", "40%"],
                ["Reading behavior", "30%"],
                ["Recency", "20%"],
                ["Trending", "10%"]
              ].map(([label, value]) => (
                <div className="flex items-center gap-3" key={label}>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-teal-500"
                      style={{ width: value }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm font-medium">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <SectionHeader title="Briefing Queue" />
            <div className="mt-4 space-y-3">
              {sidebarItems.map((item) => (
                <Link
                  className="flex items-start justify-between gap-3 rounded-md border border-slate-200 p-3 text-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                  href="/feed"
                  key={item}
                >
                  <span>{item}</span>
                  <ArrowRight className="mt-0.5 size-4 shrink-0 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <SectionHeader title="Trending Now" />
          <Link
            className="hidden items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950 sm:flex dark:text-slate-300 dark:hover:text-white"
            href="/search"
          >
            Explore all
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
          {TRENDING_TOPICS.map((topic) => (
            <article
              className="min-w-[17rem] rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
              key={topic.title}
            >
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-200">
                  {topic.category}
                </span>
                <span className="flex items-center gap-1 text-sm font-medium text-teal-600 dark:text-teal-300">
                  <Flame className="size-4" />
                  {topic.velocity}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
                {topic.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {topic.summary}
              </p>
            </article>
          ))}
        </div>
      </section>

      <PersonalizedFeedSection />

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto] md:items-center dark:border-slate-800 dark:bg-slate-950">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-teal-700 dark:text-teal-300">
            <Gauge className="size-4" />
            Ranking engine
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
            Feed order is recalculated from embeddings, behavior, freshness,
            and global momentum.
          </h2>
        </div>
        <Link
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          href="/feed"
        >
          Open feed
          <ArrowRight className="size-4" />
        </Link>
      </section>
    </main>
  );
}
