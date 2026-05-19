import { createHash } from "node:crypto";
import type { NewsCategory, UnifiedArticle } from "@/lib/news/types";

export function createArticleId(input: string) {
  return createHash("sha256").update(input).digest("hex").slice(0, 24);
}

export function normalizeCategory(category?: string | null): NewsCategory | "general" {
  const normalized = category?.toLowerCase().trim();

  if (
    normalized === "technology" ||
    normalized === "sports" ||
    normalized === "politics" ||
    normalized === "business" ||
    normalized === "science"
  ) {
    return normalized;
  }

  return "general";
}

export function normalizeUrl(url?: string | null) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.searchParams.sort();
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function normalizeTitle(title?: string | null) {
  return title?.replace(/\s+/g, " ").trim() ?? "";
}

export function dedupeArticles(articles: UnifiedArticle[]) {
  const byUrl = new Map<string, UnifiedArticle>();
  const byTitleSource = new Map<string, UnifiedArticle>();
  const byCluster = new Map<string, UnifiedArticle>();

  for (const article of articles) {
    const normalizedUrl = normalizeUrl(article.url);
    if (!normalizedUrl || isBrokenNewsUrl(normalizedUrl)) {
      continue;
    }

    article.url = normalizedUrl;
    const titleSourceKey = `${normalizeTitle(article.title).toLowerCase()}::${article.source.toLowerCase()}`;
    const clusterKey = createTitleClusterKey(article.title);
    const existing =
      byUrl.get(normalizedUrl) ??
      byTitleSource.get(titleSourceKey) ??
      byCluster.get(clusterKey);

    if (existing) {
      existing.providers = mergeProviders(existing, article);
      existing.summary ??= article.summary;
      existing.content ??= article.content;
      existing.imageUrl ??= article.imageUrl;
      continue;
    }

    if (normalizedUrl) {
      byUrl.set(normalizedUrl, article);
    }

    byTitleSource.set(titleSourceKey, article);
    byCluster.set(clusterKey, article);
  }

  return Array.from(byTitleSource.values()).sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

function createTitleClusterKey(title: string) {
  return normalizeTitle(title)
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !TITLE_STOP_WORDS.has(word))
    .slice(0, 8)
    .sort()
    .join("-");
}

function isBrokenNewsUrl(url: string) {
  try {
    const parsed = new URL(url);
    return !["http:", "https:"].includes(parsed.protocol) || parsed.hostname.length < 4;
  } catch {
    return true;
  }
}

const TITLE_STOP_WORDS = new Set([
  "about",
  "after",
  "from",
  "have",
  "into",
  "over",
  "that",
  "this",
  "with",
  "your",
  "will"
]);

function mergeProviders(existing: UnifiedArticle, incoming: UnifiedArticle) {
  const seen = new Set(existing.providers.map((provider) => provider.name));

  return [
    ...existing.providers,
    ...incoming.providers.filter((provider) => !seen.has(provider.name))
  ];
}
