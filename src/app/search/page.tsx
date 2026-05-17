import type { Metadata } from "next";
import { ArticleBrowser } from "@/components/articles/article-browser";

export const metadata: Metadata = {
  title: "Search",
  description: "Search news by keyword across connected providers."
};

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;

  return (
    <ArticleBrowser
      description="Search across connected news sources and open the original reporting directly from each result."
      initialQuery={q ?? ""}
      title="Search"
    />
  );
}
