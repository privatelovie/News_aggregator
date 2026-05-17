import type { UnifiedArticle } from "@/lib/news/types";

export type EmbeddingVector = number[];

export type SimilarArticle = UnifiedArticle & {
  similarity: number;
};

export type ArticleEmbeddingInput = Pick<
  UnifiedArticle,
  "title" | "summary" | "content"
> & {
  url?: string | null;
};
