export type NewsProvider = "newsapi" | "gnews" | "newsdata";

export type NewsCategory =
  | "technology"
  | "sports"
  | "politics"
  | "business"
  | "science";

export type ArticleSourceProvider = {
  name: NewsProvider;
  externalId?: string;
};

export type UnifiedArticle = {
  id: string;
  title: string;
  source: string;
  category: NewsCategory | "general";
  summary: string | null;
  imageUrl: string | null;
  content: string | null;
  publishedAt: string;
  url: string;
  author: string | null;
  providers: ArticleSourceProvider[];
};

export type NewsSearchParams = {
  query?: string;
  category?: NewsCategory;
  language?: string;
  country?: string;
  pageSize?: number;
};

export type ProviderResult = {
  provider: NewsProvider;
  articles: UnifiedArticle[];
  error?: string;
};

export type AggregatedNewsResult = {
  articles: UnifiedArticle[];
  errors: Array<{
    provider: NewsProvider;
    message: string;
  }>;
  cached: boolean;
};
