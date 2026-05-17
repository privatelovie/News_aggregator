import { createEmbedding } from "@/lib/embeddings/openai";
import { toPgVector } from "@/lib/embeddings/vector";
import type { SimilarArticle } from "@/lib/embeddings/types";
import { prisma } from "@/lib/prisma";

type SimilarArticleRow = {
  id: string;
  title: string;
  source: string;
  category: string;
  summary: string | null;
  imageUrl: string | null;
  content: string | null;
  publishedAt: Date;
  url: string | null;
  similarity: number;
};

export async function searchSimilarArticlesByText(query: string, limit = 10) {
  const embedding = await createEmbedding(query);

  return searchSimilarArticlesByVector(embedding, limit);
}

export async function searchSimilarArticlesForUser(userId: string, limit = 10) {
  const rows = await prisma.$queryRaw<Array<{ embedding: string | null }>>`
    SELECT "embedding"::text AS embedding
    FROM "UserProfileEmbedding"
    WHERE "userId" = ${userId}
    LIMIT 1
  `;

  if (!rows[0]?.embedding) {
    return [];
  }

  return searchSimilarArticlesByVector(parsePgVector(rows[0].embedding), limit);
}

async function searchSimilarArticlesByVector(vector: number[], limit: number) {
  const pgVector = toPgVector(vector);
  const rows = await prisma.$queryRaw<SimilarArticleRow[]>`
    SELECT
      a."id",
      a."title",
      a."source",
      c."slug" AS "category",
      a."summary",
      a."imageUrl",
      a."content",
      a."publishedAt",
      a."url",
      1 - (a."embedding" <=> ${pgVector}::vector) AS "similarity"
    FROM "Article" a
    JOIN "Category" c ON c."id" = a."categoryId"
    WHERE a."embedding" IS NOT NULL
    ORDER BY a."embedding" <=> ${pgVector}::vector
    LIMIT ${Math.min(Math.max(limit, 1), 50)}
  `;

  return rows.map(rowToSimilarArticle);
}

function rowToSimilarArticle(row: SimilarArticleRow): SimilarArticle {
  return {
    id: row.id,
    title: row.title,
    source: row.source,
    category: row.category as SimilarArticle["category"],
    summary: row.summary,
    imageUrl: row.imageUrl,
    content: row.content,
    publishedAt: row.publishedAt.toISOString(),
    url: row.url ?? "",
    author: null,
    providers: [],
    similarity: Number(row.similarity)
  };
}

function parsePgVector(value: string) {
  return value
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((item) => Number(item.trim()));
}
