import {
  createArticleId,
  normalizeCategory,
  normalizeTitle,
  normalizeUrl
} from "@/lib/news/normalization";
import type { NewsSearchParams, ProviderResult } from "@/lib/news/types";

type GNewsResponse = {
  totalArticles?: number;
  errors?: unknown;
  articles?: Array<{
    title?: string | null;
    description?: string | null;
    content?: string | null;
    url?: string | null;
    image?: string | null;
    publishedAt?: string | null;
    source?: {
      name?: string | null;
      url?: string | null;
    };
  }>;
};

const GNEWS_URL = "https://gnews.io/api/v4/search";

export async function fetchGNewsArticles(
  params: NewsSearchParams
): Promise<ProviderResult> {
  const apiKey = process.env.GNEWS_API_KEY;

  if (!apiKey) {
    return {
      provider: "gnews",
      articles: [],
      error: "GNEWS_API_KEY is not configured."
    };
  }

  const searchParams = new URLSearchParams({
    apikey: apiKey,
    q: params.query || params.category || "news",
    lang: params.language ?? "en",
    max: String(Math.min(params.pageSize ?? 10, 10)),
    sortby: "publishedAt"
  });

  if (params.country) {
    searchParams.set("country", params.country);
  }

  const response = await fetch(`${GNEWS_URL}?${searchParams}`, {
    next: { revalidate: 300 }
  });
  const payload = (await response.json()) as GNewsResponse;

  if (!response.ok || payload.errors) {
    return {
      provider: "gnews",
      articles: [],
      error:
        typeof payload.errors === "string"
          ? payload.errors
          : `GNews request failed with ${response.status}.`
    };
  }

  return {
    provider: "gnews",
    articles: (payload.articles ?? []).flatMap((article) => {
      const url = normalizeUrl(article.url);
      const title = normalizeTitle(article.title);

      if (!url || !title || !article.publishedAt) {
        return [];
      }

      return {
        id: createArticleId(url),
        title,
        source: article.source?.name ?? "GNews",
        category: normalizeCategory(params.category),
        summary: article.description ?? null,
        imageUrl: article.image ?? null,
        content: article.content ?? null,
        publishedAt: article.publishedAt,
        url,
        author: null,
        providers: [{ name: "gnews" as const, externalId: article.source?.url ?? undefined }]
      };
    })
  };
}
