import { getCachedValue, setCachedValue } from "@/lib/news/cache";
import { dedupeArticles } from "@/lib/news/normalization";
import { fetchGNewsArticles } from "@/lib/news/providers/gnews";
import { fetchNewsApiArticles } from "@/lib/news/providers/newsapi";
import { fetchNewsDataArticles } from "@/lib/news/providers/newsdata";
import type {
  AggregatedNewsResult,
  NewsCategory,
  NewsSearchParams,
  ProviderResult
} from "@/lib/news/types";

const CACHE_TTL_SECONDS = 300;
const DEFAULT_PAGE_SIZE = 20;

const categories = new Set<NewsCategory>([
  "technology",
  "sports",
  "politics",
  "business",
  "science"
]);

export function parseNewsSearchParams(
  searchParams: URLSearchParams
): NewsSearchParams {
  const category = searchParams.get("category")?.toLowerCase();
  const pageSize = Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE);

  return {
    query: searchParams.get("q")?.trim() || undefined,
    category: categories.has(category as NewsCategory)
      ? (category as NewsCategory)
      : undefined,
    language: searchParams.get("language") ?? "en",
    country: searchParams.get("country") ?? undefined,
    pageSize: Number.isFinite(pageSize)
      ? Math.min(Math.max(pageSize, 1), 50)
      : DEFAULT_PAGE_SIZE
  };
}

export async function getAggregatedNews(
  params: NewsSearchParams
): Promise<AggregatedNewsResult> {
  const cacheKey = createCacheKey(params);
  const cached = getCachedValue<Omit<AggregatedNewsResult, "cached">>(cacheKey);

  if (cached) {
    return {
      ...cached,
      cached: true
    };
  }

  const results = await Promise.allSettled([
    fetchNewsApiArticles(params),
    fetchGNewsArticles(params),
    fetchNewsDataArticles(params)
  ]);

  const providerResults = results.map((result, index): ProviderResult => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    return {
      provider: ["newsapi", "gnews", "newsdata"][index] as ProviderResult["provider"],
      articles: [],
      error:
        result.reason instanceof Error
          ? result.reason.message
          : "Unexpected provider error."
    };
  });

  const aggregated = {
    articles: dedupeArticles(
      providerResults.flatMap((result) => result.articles)
    ).slice(0, params.pageSize ?? DEFAULT_PAGE_SIZE),
    errors: providerResults.flatMap((result) =>
      result.error ? [{ provider: result.provider, message: result.error }] : []
    )
  };

  setCachedValue(cacheKey, aggregated, CACHE_TTL_SECONDS);

  return {
    ...aggregated,
    cached: false
  };
}

function createCacheKey(params: NewsSearchParams) {
  return JSON.stringify({
    query: params.query ?? "",
    category: params.category ?? "",
    language: params.language ?? "en",
    country: params.country ?? "",
    pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE
  });
}
