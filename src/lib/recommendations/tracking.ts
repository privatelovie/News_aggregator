import { ensureArticle, ensureCategory } from "@/lib/recommendations/article-persistence";
import { prisma } from "@/lib/prisma";
import type {
  TrackArticleInput,
  TrackCategoryInput,
  TrackReadingInput
} from "@/lib/recommendations/types";
import type { z } from "zod";
import type { bookmarkMetadataSchema } from "@/lib/recommendations/validation";

type BookmarkMetadataInput = Partial<z.infer<typeof bookmarkMetadataSchema>>;

export async function trackArticleClick(userId: string, input: TrackArticleInput) {
  const article = await ensureArticle(input.article);

  return prisma.userInteraction.upsert({
    where: {
      userId_articleId: {
        userId,
        articleId: article.id
      }
    },
    update: {
      clickCount: { increment: 1 },
      lastClickedAt: new Date()
    },
    create: {
      userId,
      articleId: article.id,
      clickCount: 1,
      lastClickedAt: new Date()
    }
  });
}

export async function trackReadingDuration(
  userId: string,
  input: TrackReadingInput
) {
  const article = await ensureArticle(input.article);
  const durationSeconds = Math.max(0, Math.floor(input.durationSeconds));

  return prisma.userInteraction.upsert({
    where: {
      userId_articleId: {
        userId,
        articleId: article.id
      }
    },
    update: {
      totalReadingTimeSeconds: { increment: durationSeconds },
      lastReadAt: new Date()
    },
    create: {
      userId,
      articleId: article.id,
      totalReadingTimeSeconds: durationSeconds,
      lastReadAt: new Date()
    }
  });
}

export async function trackCategoryView(
  userId: string,
  input: TrackCategoryInput
) {
  const category = await ensureCategory(input.category);

  return prisma.userCategoryView.upsert({
    where: {
      userId_categoryId: {
        userId,
        categoryId: category.id
      }
    },
    update: {
      viewCount: { increment: 1 },
      lastViewedAt: new Date()
    },
    create: {
      userId,
      categoryId: category.id,
      viewCount: 1,
      lastViewedAt: new Date()
    }
  });
}

export async function bookmarkArticle(
  userId: string,
  input: TrackArticleInput,
  metadata: BookmarkMetadataInput = {}
) {
  const article = await ensureArticle(input.article);
  const offlineSnapshot = metadata.offlineSnapshot?.trim() || null;

  return prisma.bookmark.upsert({
    where: {
      userId_articleId: {
        userId,
        articleId: article.id
      }
    },
    update: {
      folder: metadata.folder,
      tags: metadata.tags,
      note: metadata.note,
      offlineSnapshot,
      offlineSavedAt: offlineSnapshot ? new Date() : null
    },
    create: {
      userId,
      articleId: article.id,
      folder: metadata.folder ?? "Read later",
      tags: metadata.tags ?? [],
      note: metadata.note,
      offlineSnapshot,
      offlineSavedAt: offlineSnapshot ? new Date() : null
    }
  });
}
