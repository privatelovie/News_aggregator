import { prisma } from "@/lib/prisma";
import type { UnifiedArticle } from "@/lib/news/types";

export async function ensureCategory(category: string) {
  const slug = normalizeSlug(category || "general");

  return prisma.category.upsert({
    where: { slug },
    update: {},
    create: {
      name: toTitleCase(slug),
      slug
    }
  });
}

export async function ensureArticle(article: UnifiedArticle) {
  const category = await ensureCategory(article.category);
  const url = article.url || `generated:${article.id}`;

  return prisma.article.upsert({
    where: { url },
    update: {
      title: article.title,
      source: article.source,
      categoryId: category.id,
      summary: article.summary,
      imageUrl: article.imageUrl,
      content: article.content,
      publishedAt: new Date(article.publishedAt)
    },
    create: {
      title: article.title,
      source: article.source,
      categoryId: category.id,
      summary: article.summary,
      imageUrl: article.imageUrl,
      content: article.content,
      url,
      publishedAt: new Date(article.publishedAt)
    }
  });
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toTitleCase(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
