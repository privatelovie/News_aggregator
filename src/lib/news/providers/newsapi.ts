import {
  createArticleId,
  normalizeCategory,
  normalizeTitle,
  normalizeUrl
} from "@/lib/news/normalization";
import type { NewsSearchParams, ProviderResult } from "@/lib/news/types";

type NewsApiResponse = {
  status: "ok" | "error";
  totalResults?: number;
  code?: string;
  message?: string;
  articles?: Array<{
    source?: {
      id?: string | null;
      name?: string | null;
    };
    author?: string | null;
    title?: string | null;
    description?: string | null;
    url?: string | null;
    urlToImage?: string | null;
    publishedAt?: string | null;
    content?: string | null;
  }>;
};

const NEWSAPI_URL = "https://newsapi.org/v2/everything";

export async function fetchNewsApiArticles(
  params: NewsSearchParams
): Promise<ProviderResult> {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    return {
      provider: "newsapi",
      articles: [],
      error: "NEWS_API_KEY is not configured."
    };
  }

  const searchParams = new URLSearchParams({
    apiKey,
    q: params.query || params.category || "news",
    language: params.language ?? "en",
    pageSize: String(params.pageSize ?? 20),
    sortBy: "publishedAt"
  });

  const response = await fetch(`${NEWSAPI_URL}?${searchParams}`, {
    next: { revalidate: 300 }
  });
  const payload = (await response.json()) as NewsApiResponse;

  if (!response.ok || payload.status === "error") {
    return {
      provider: "newsapi",
      articles: [],
      error: payload.message ?? `NewsAPI request failed with ${response.status}.`
    };
  }

  return {
    provider: "newsapi",
    articles: (payload.articles ?? []).flatMap((article) => {
      const url = normalizeUrl(article.url);
      const title = normalizeTitle(article.title);

      if (!url || !title || !article.publishedAt) {
        return [];
      }

      return {
        id: createArticleId(url),
        title,
        source: article.source?.name ?? "NewsAPI",
        category: normalizeCategory(params.category),
        summary: article.description ?? null,
        imageUrl: article.urlToImage ?? null,
        content: article.content ?? null,
        publishedAt: article.publishedAt,
        url,
        author: article.author ?? null,
        providers: [
          {
            name: "newsapi" as const,
            externalId: article.source?.id ?? undefined
          }
        ]
      };
    })
  };
}
