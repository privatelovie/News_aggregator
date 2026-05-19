import type { UnifiedArticle } from "@/lib/news/types";

export type NewsCategory =
  | "Tech"
  | "Sports"
  | "Politics"
  | "Business"
  | "Science";

export type ArticlePreview = {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: NewsCategory;
  publishedAt: string;
  imageUrl?: string;
  url?: string;
  readTime?: string;
  trend?: string;
  article?: UnifiedArticle;
  explanation?: string;
  relevanceScore?: number;
};
