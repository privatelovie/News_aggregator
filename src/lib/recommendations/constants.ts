import type {
  FeedRankingWeights,
  RecommendationWeights
} from "@/lib/recommendations/types";

export const RECOMMENDATION_WEIGHTS: RecommendationWeights = {
  clicks: 3,
  readingTime: 0.05,
  bookmarks: 12,
  categoryView: 0.75
};

export const FEED_RANKING_WEIGHTS: FeedRankingWeights = {
  userEmbedding: 0.4,
  behavior: 0.3,
  recency: 0.2,
  trending: 0.1
};
