import { randomUUID } from "node:crypto";
import { getArticleEmbedding } from "@/lib/embeddings/articles";
import { getEmbeddingModel } from "@/lib/embeddings/openai";
import { toPgVector, weightedAverageVectors } from "@/lib/embeddings/vector";
import { prisma } from "@/lib/prisma";

export async function rebuildUserProfileEmbedding(userId: string) {
  const [interactions, bookmarks] = await Promise.all([
    prisma.userInteraction.findMany({
      where: {
        userId,
        OR: [
          { clickCount: { gt: 0 } },
          { totalReadingTimeSeconds: { gt: 0 } },
          { article: { bookmarks: { some: { userId } } } }
        ]
      },
      include: {
        article: {
          include: {
            bookmarks: {
              where: { userId },
              select: { id: true }
            }
          }
        }
      },
      orderBy: { updatedAt: "desc" },
      take: 100
    }),
    prisma.bookmark.findMany({
      where: { userId },
      include: {
        article: {
          select: { id: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    })
  ]);

  const behaviorByArticleId = new Map<
    string,
    {
      clickCount: number;
      readingTimeSeconds: number;
      isBookmarked: boolean;
    }
  >();

  for (const interaction of interactions) {
    behaviorByArticleId.set(interaction.articleId, {
      clickCount: interaction.clickCount,
      readingTimeSeconds: interaction.totalReadingTimeSeconds,
      isBookmarked: interaction.article.bookmarks.length > 0
    });
  }

  for (const bookmark of bookmarks) {
    const existing = behaviorByArticleId.get(bookmark.article.id);
    behaviorByArticleId.set(bookmark.article.id, {
      clickCount: existing?.clickCount ?? 0,
      readingTimeSeconds: existing?.readingTimeSeconds ?? 0,
      isBookmarked: true
    });
  }

  const weightedVectors = [];

  for (const [articleId, behavior] of behaviorByArticleId) {
    const embedding = await getArticleEmbedding(articleId);

    if (!embedding) {
      continue;
    }

    weightedVectors.push({
      vector: embedding,
      weight: calculateBehaviorWeight({
        clickCount: behavior.clickCount,
        readingTimeSeconds: behavior.readingTimeSeconds,
        isBookmarked: behavior.isBookmarked
      })
    });
  }

  const profileEmbedding = weightedAverageVectors(weightedVectors);

  if (profileEmbedding.length === 0) {
    return {
      sourceArticleCount: 0,
      updated: false
    };
  }

  await storeUserProfileEmbedding(userId, profileEmbedding, weightedVectors.length);

  return {
    sourceArticleCount: weightedVectors.length,
    updated: true
  };
}

function calculateBehaviorWeight({
  clickCount,
  readingTimeSeconds,
  isBookmarked
}: {
  clickCount: number;
  readingTimeSeconds: number;
  isBookmarked: boolean;
}) {
  return clickCount * 2 + Math.min(readingTimeSeconds / 60, 20) + (isBookmarked ? 10 : 0);
}

async function storeUserProfileEmbedding(
  userId: string,
  embedding: number[],
  sourceArticleCount: number
) {
  const vector = toPgVector(embedding);
  const model = getEmbeddingModel();

  await prisma.$executeRaw`
    INSERT INTO "UserProfileEmbedding" (
      "id",
      "userId",
      "embedding",
      "model",
      "sourceArticleCount",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${randomUUID()},
      ${userId},
      ${vector}::vector,
      ${model},
      ${sourceArticleCount},
      NOW(),
      NOW()
    )
    ON CONFLICT ("userId") DO UPDATE SET
      "embedding" = EXCLUDED."embedding",
      "model" = EXCLUDED."model",
      "sourceArticleCount" = EXCLUDED."sourceArticleCount",
      "updatedAt" = NOW()
  `;
}
