import type { Article } from "@prisma/client";
import { createEmbedding, getEmbeddingModel } from "@/lib/embeddings/openai";
import { toPgVector } from "@/lib/embeddings/vector";
import type { ArticleEmbeddingInput, EmbeddingVector } from "@/lib/embeddings/types";
import { prisma } from "@/lib/prisma";
import { ensureArticle } from "@/lib/recommendations/article-persistence";
import type { UnifiedArticle } from "@/lib/news/types";

export function buildArticleEmbeddingText(article: ArticleEmbeddingInput) {
  return [
    `Title: ${article.title}`,
    `Summary: ${article.summary ?? ""}`,
    `Content: ${article.content ?? ""}`
  ].join("\n\n");
}

export async function createAndStoreArticleEmbedding(article: UnifiedArticle) {
  const storedArticle = await ensureArticle(article);
  const embedding = await createEmbedding(buildArticleEmbeddingText(article));

  await storeArticleEmbedding(storedArticle.id, embedding);

  return {
    articleId: storedArticle.id,
    model: getEmbeddingModel()
  };
}

export async function storeArticleEmbedding(
  articleId: string,
  embedding: EmbeddingVector
) {
  const vector = toPgVector(embedding);

  await prisma.$executeRaw`
    UPDATE "Article"
    SET "embedding" = ${vector}::vector, "updatedAt" = NOW()
    WHERE "id" = ${articleId}
  `;
}

export async function getArticleEmbedding(articleId: string) {
  const rows = await prisma.$queryRaw<Array<{ embedding: string | null }>>`
    SELECT "embedding"::text AS embedding
    FROM "Article"
    WHERE "id" = ${articleId}
    LIMIT 1
  `;

  return rows[0]?.embedding ? parsePgVector(rows[0].embedding) : null;
}

export function articleToUnifiedArticle(
  article: Article & { category: { slug: string } }
): UnifiedArticle {
  return {
    id: article.id,
    title: article.title,
    source: article.source,
    category: article.category.slug as UnifiedArticle["category"],
    summary: article.summary,
    imageUrl: article.imageUrl,
    content: article.content,
    publishedAt: article.publishedAt.toISOString(),
    url: article.url ?? "",
    author: null,
    providers: []
  };
}

function parsePgVector(value: string) {
  return value
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((item) => Number(item.trim()));
}
