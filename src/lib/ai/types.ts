export type ArticleSummaryInput = {
  title: string;
  source?: string | null;
  url?: string | null;
  summary?: string | null;
  content?: string | null;
  publishedAt?: string | null;
};

export type ArticleSummary = {
  threeLineSummary: string[];
  twoLineSummary: string[];
  explainSimply: string;
  keyTakeaways: string[];
  whyThisMatters: string;
  viewpointNote: string;
};

export type CachedArticleSummary = ArticleSummary & {
  cached: boolean;
  model: string;
  articleHash: string;
};
