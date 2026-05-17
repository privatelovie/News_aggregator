import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

export function CategoryNav() {
  return (
    <nav className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      <Link
        className="shrink-0 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm dark:bg-white dark:text-slate-950"
        href="/feed"
      >
        For You
      </Link>
      {CATEGORIES.map((category) => (
        <Link
          className="shrink-0 whitespace-nowrap rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          href={`/categories/${category.slug}`}
          key={category.slug}
        >
          {category.label}
        </Link>
      ))}
    </nav>
  );
}
