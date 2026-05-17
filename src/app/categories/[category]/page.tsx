import { notFound } from "next/navigation";
import { ArticleBrowser } from "@/components/articles/article-browser";
import { CATEGORIES } from "@/lib/constants";
import type { NewsCategory } from "@/lib/news/types";

type CategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
};

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category: category.slug }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const matchingCategory = CATEGORIES.find((item) => item.slug === category);

  if (!matchingCategory) {
    notFound();
  }

  return (
    <ArticleBrowser
      category={matchingCategory.slug as NewsCategory}
      description={`Latest ${matchingCategory.label.toLowerCase()} coverage from connected news providers.`}
      title={`${matchingCategory.label} News`}
    />
  );
}
