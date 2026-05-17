import { NextResponse } from "next/server";
import {
  buildArticleEmbeddingText,
  storeArticleEmbedding
} from "@/lib/embeddings/articles";
import { createEmbedding, getEmbeddingModel } from "@/lib/embeddings/openai";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

type ArticleWithoutEmbeddingRow = {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  url: string | null;
};

export async function POST(request: Request) {
  const session = await getCurrentUser();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") ?? 25) || 25, 1),
    100
  );

  const articles = await getArticlesWithoutEmbeddings(limit);
  const embeddedArticleIds: string[] = [];
  const errors: Array<{ articleId: string; message: string }> = [];

  for (const article of articles) {
    try {
      const embedding = await createEmbedding(buildArticleEmbeddingText(article));
      await storeArticleEmbedding(article.id, embedding);
      embeddedArticleIds.push(article.id);
    } catch (error) {
      errors.push({
        articleId: article.id,
        message:
          error instanceof Error
            ? error.message
            : "Unable to create article embedding."
      });
    }
  }

  return NextResponse.json({
    data: {
      embeddedArticleIds,
      model: getEmbeddingModel()
    },
    meta: {
      attempted: articles.length,
      embedded: embeddedArticleIds.length,
      errors
    }
  });
}

async function getArticlesWithoutEmbeddings(limit: number) {
  return prisma.$queryRaw<ArticleWithoutEmbeddingRow[]>`
    SELECT "id", "title", "summary", "content", "url"
    FROM "Article"
    WHERE "embedding" IS NULL
    ORDER BY "publishedAt" DESC
    LIMIT ${limit}
  `;
}
