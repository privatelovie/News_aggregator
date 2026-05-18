import { ArrowRight, Dot, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { LiveNewsSection } from "@/components/home/live-news-section";

const quickLinks = [
  { label: "Technology", href: "/categories/technology" },
  { label: "Sports", href: "/categories/sports" },
  { label: "Politics", href: "/categories/politics" },
  { label: "Business", href: "/categories/business" },
  { label: "Science", href: "/categories/science" },
  { label: "Health", href: "/search?q=health%20news" },
  { label: "World", href: "/search?q=world%20news" },
  { label: "Climate", href: "/search?q=climate%20news" },
  { label: "Entertainment", href: "/search?q=entertainment%20news" }
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-[86rem] flex-col gap-6 px-3 py-4 sm:px-5 lg:px-6">
      <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="relative overflow-hidden rounded-[2rem] border-[5px] border-black bg-white p-5 shadow-[10px_10px_0_#050505] sm:p-7 lg:min-h-[32rem]">
          <div className="absolute right-8 top-8 hidden h-44 w-44 rounded-full border-2 border-[#c9b8ff] lg:block" />
          <div className="absolute bottom-12 right-16 hidden h-28 w-28 rounded-[2rem] border-[12px] border-[#c9b8ff] border-l-transparent border-t-transparent lg:block" />
          <p className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-[#ffd24a] px-4 py-2 text-sm font-black uppercase tracking-wide text-black">
            <Sparkles className="size-4" />
            Neural News
          </p>
          <h1 className="mt-6 max-w-4xl text-[clamp(2.75rem,6vw,6.5rem)] font-black uppercase leading-[0.9] tracking-normal text-[#2b0b64]">
            News that fits your world.
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-700">
            A live news board with topic tuning, regional coverage, saved reads,
            and instant summaries when the story gets too dense.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-full border-[3px] border-black bg-black px-5 py-3 text-sm font-black text-white shadow-[4px_4px_0_#ffd24a] transition hover:-translate-y-0.5"
              href="/feed"
            >
              Personalize feed
              <ArrowRight className="size-4" />
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-full border-[3px] border-black bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-[#ffd24a]"
              href="/search"
            >
              Search news
            </Link>
          </div>
        </div>

        <aside className="overflow-hidden rounded-[2rem] border-[5px] border-black bg-[#c9b8ff] shadow-[10px_10px_0_#050505]">
          <div className="border-b-[5px] border-black bg-[#ffd24a] px-5 py-3 text-center text-sm font-black uppercase text-black">
            Search and collect
          </div>
          <div className="p-5">
          <form action="/search">
            <label className="block text-sm font-black uppercase text-black">
              Search live news
              <span className="mt-3 flex items-center gap-3 rounded-full border-[3px] border-black bg-white px-4 py-3">
                <Search className="size-5 text-black" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-500"
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
                className="rounded-full border-[3px] border-black bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-[#ffd24a]"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </div>
          </div>
        </aside>
      </section>

      <div className="overflow-hidden rounded-full border-[4px] border-black bg-[#ffd24a] py-2 text-black">
        <div className="news-marquee flex min-w-max gap-5 px-4 text-sm font-black uppercase italic">
          {[...["Live news", "Personalized feed", "API analytics", "Save articles", "Free summaries", "Regional coverage"], ...["Live news", "Personalized feed", "API analytics", "Save articles", "Free summaries", "Regional coverage"]].map((item, index) => (
            <span className="flex items-center gap-5" key={`${item}-${index}`}>
              {item}
              <Dot className="size-4 fill-black" />
            </span>
          ))}
        </div>
      </div>

      <LiveNewsSection />
    </main>
  );
}
