import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { LiveNewsSection } from "@/components/home/live-news-section";

const quickLinks = [
  { label: "Technology", href: "/categories/technology" },
  { label: "Sports", href: "/categories/sports" },
  { label: "Politics", href: "/categories/politics" },
  { label: "Business", href: "/categories/business" },
  { label: "Science", href: "/categories/science" }
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid min-h-[22rem] gap-6 border-b border-slate-200 pb-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end dark:border-slate-800">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-teal-600 dark:text-teal-300">
            Neural News
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-normal text-slate-950 dark:text-white sm:text-6xl">
            Read the news that fits your interests and region.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
            Search live coverage, save important stories, summarize articles, and
            tune your feed by topic and country.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              href="/feed"
            >
              Personalize feed
              <ArrowRight className="size-4" />
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              href="/search"
            >
              Search news
            </Link>
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <form action="/search">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Search live news
              <span className="mt-3 flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                <Search className="size-4 text-slate-400" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  name="q"
                  placeholder="Search topics, sources, summaries"
                  type="search"
                />
              </span>
            </label>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <Link
                className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <LiveNewsSection />
    </main>
  );
}
