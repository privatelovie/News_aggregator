import { create } from "zustand";
import type { ArticlePreview } from "@/types/article";

type FeedState = {
  articles: ArticlePreview[];
  setArticles: (articles: ArticlePreview[]) => void;
};

export const useFeedStore = create<FeedState>((set) => ({
  articles: [],
  setArticles: (articles) => set({ articles })
}));
