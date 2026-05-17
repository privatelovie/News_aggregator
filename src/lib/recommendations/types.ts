import type { UnifiedArticle } from "@/lib/news/types";

export type RecommendationWeights = {
  clicks: number;
  readingTime: number;
  bookmarks: number;
  categoryView: number;
};

export type FeedRankingWeights = {
  userEmbedding: number;
  behavior: number;
  recency: number;
  trending: number;
};

export type RankedArticle = UnifiedArticle & {
  recommendationScore: number;
  scoreBreakdown: {
    userEmbedding: number;
    behavior: number;
    recency: number;
    trending: number;
    behaviorSignals: {
      clicks: number;
      readingTime: number;
      bookmarks: number;
      categoryAffinity: number;
    };
  };
};

export type TrackArticleInput = {
  article: UnifiedArticle;
};

export type TrackReadingInput = TrackArticleInput & {
  durationSeconds: number;
};

export type TrackCategoryInput = {
  category: string;
};
