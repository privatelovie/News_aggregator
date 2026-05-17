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

  for (const article of articles) {
    const normalizedUrl = normalizeUrl(article.url);
    const titleSourceKey = `${normalizeTitle(article.title).toLowerCase()}::${article.source.toLowerCase()}`;
    const existing = normalizedUrl
      ? byUrl.get(normalizedUrl)
      : byTitleSource.get(titleSourceKey);

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
  }

  return Array.from(byTitleSource.values()).sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

function mergeProviders(existing: UnifiedArticle, incoming: UnifiedArticle) {
  const seen = new Set(existing.providers.map((provider) => provider.name));

  return [
    ...existing.providers,
    ...incoming.providers.filter((provider) => !seen.has(provider.name))
  ];
}
