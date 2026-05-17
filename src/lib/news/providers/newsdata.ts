import {
  createArticleId,
  normalizeCategory,
  normalizeTitle,
  normalizeUrl
} from "@/lib/news/normalization";
import type { NewsSearchParams, ProviderResult } from "@/lib/news/types";

type NewsDataResponse = {
  status?: "success" | "error";
  totalResults?: number;
  nextPage?: string | null;
  results?: Array<{
    article_id?: string | null;
    title?: string | null;
    link?: string | null;
    description?: string | null;
    content?: string | null;
    image_url?: string | null;
    pubDate?: string | null;
    source_id?: string | null;
    source_name?: string | null;
    creator?: string[] | null;
    category?: string[] | null;
    duplicate?: boolean | null;
  }>;
  resultsCount?: number;
  message?: string;
};

const NEWSDATA_URL = "https://newsdata.io/api/1/latest";

export async function fetchNewsDataArticles(
  params: NewsSearchParams
): Promise<ProviderResult> {
  const apiKey = process.env.NEWSDATA_API_KEY;

  if (!apiKey) {
    return {
      provider: "newsdata",
      articles: [],
      error: "NEWSDATA_API_KEY is not configured."
    };
  }

  const searchParams = new URLSearchParams({
    apikey: apiKey,
    language: params.language ?? "en",
    size: String(Math.min(params.pageSize ?? 10, 50))
  });

  if (params.query) {
    searchParams.set("q", params.query);
  }

  if (params.country) {
    searchParams.set("country", params.country);
  }

  if (params.category) {
    searchParams.set("category", params.category);
  }

  const response = await fetch(`${NEWSDATA_URL}?${searchParams}`, {
    next: { revalidate: 300 }
  });
  const payload = (await response.json()) as NewsDataResponse;

  if (!response.ok || payload.status === "error") {
    return {
      provider: "newsdata",
      articles: [],
      error:
        payload.message ?? `NewsData.io request failed with ${response.status}.`
    };
  }

  return {
    provider: "newsdata",
    articles: (payload.results ?? []).flatMap((article) => {
      const url = normalizeUrl(article.link);
      const title = normalizeTitle(article.title);

      if (!url || !title || !article.pubDate || article.duplicate) {
        return [];
      }

      return {
        id: createArticleId(url),
        title,
        source: article.source_name ?? article.source_id ?? "NewsData.io",
        category: normalizeCategory(article.category?.[0] ?? params.category),
        summary: article.description ?? null,
        imageUrl: article.image_url ?? null,
        content: article.content ?? null,
        publishedAt: new Date(article.pubDate).toISOString(),
        url,
        author: article.creator?.join(", ") ?? null,
        providers: [
          {
            name: "newsdata" as const,
            externalId: article.article_id ?? undefined
          }
        ]
      };
    })
  };
}
