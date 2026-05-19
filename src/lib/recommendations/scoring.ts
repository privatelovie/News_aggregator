import { getAggregatedNews } from "@/lib/news/aggregator";
import type { NewsSearchParams, UnifiedArticle } from "@/lib/news/types";
import { Prisma, prisma } from "@/lib/prisma";
import {
  FEED_RANKING_WEIGHTS,
  RECOMMENDATION_WEIGHTS
} from "@/lib/recommendations/constants";
import type { RankedArticle } from "@/lib/recommendations/types";

type ArticleRankingSignals = {
  url: string;
  embeddingSimilarity: number;
  trendingScore: number;
};

type SourceControlSignal = {
  action: "NEUTRAL" | "MUTE" | "PRIORITIZE";
  hideSensational: boolean;
  preferredRegion?: string | null;
  preferredLanguage?: string | null;
};

export function calculateRecommendationScore({
  clickCount,
  totalReadingTimeSeconds,
  isBookmarked,
  categoryViewCount
}: {
  clickCount: number;
  totalReadingTimeSeconds: number;
  isBookmarked: boolean;
  categoryViewCount: number;
}) {
  const clicks = clickCount * RECOMMENDATION_WEIGHTS.clicks;
  const readingTime =
    totalReadingTimeSeconds * RECOMMENDATION_WEIGHTS.readingTime;
  const bookmarks = (isBookmarked ? 1 : 0) * RECOMMENDATION_WEIGHTS.bookmarks;
  const categoryAffinity =
    categoryViewCount * RECOMMENDATION_WEIGHTS.categoryView;

  return {
    score: clicks + readingTime + bookmarks + categoryAffinity,
    breakdown: {
      clicks,
      readingTime,
      bookmarks,
      categoryAffinity
    }
  };
}

export async function getRankedFeed(
  userId: string,
  params: NewsSearchParams
): Promise<{
  articles: RankedArticle[];
  errors: Array<{ provider: string; message: string }>;
  cached: boolean;
}> {
  const result = await getAggregatedNews(params);
  const urls = result.articles.map((article) => article.url).filter(Boolean);
  const categorySlugs = result.articles.map((article) => article.category);

  const [interactions, bookmarks, categoryViews, rankingSignals, sourcePreferences] = await Promise.all([
    prisma.userInteraction.findMany({
      where: {
        userId,
        article: {
          url: { in: urls }
        }
      },
      include: {
        article: { select: { url: true } }
      }
    }),
    prisma.bookmark.findMany({
      where: {
        userId,
        article: {
          url: { in: urls }
        }
      },
      include: {
        article: { select: { url: true } }
      }
    }),
    prisma.userCategoryView.findMany({
      where: {
        userId,
        category: {
          slug: { in: categorySlugs }
        }
      },
      include: {
        category: { select: { slug: true } }
      }
    }),
    getArticleRankingSignals(userId, urls),
    prisma.sourcePreference.findMany({
      where: {
        userId,
        source: { in: Array.from(new Set(result.articles.map((article) => article.source))) }
      }
    })
  ]);

  const interactionByUrl = new Map(
    interactions.map((interaction) => [interaction.article.url, interaction])
  );
  const bookmarkedUrls = new Set(bookmarks.map((bookmark) => bookmark.article.url));
  const categoryViewsBySlug = new Map(
    categoryViews.map((view) => [view.category.slug, view.viewCount])
  );
  const rankingSignalsByUrl = new Map(
    rankingSignals.map((signals) => [signals.url, signals])
  );
  const sourceControlsByName = new Map(
    sourcePreferences.map((preference) => [
      preference.source.toLowerCase(),
      {
        action: preference.action,
        hideSensational: preference.hideSensational,
        preferredRegion: preference.preferredRegion,
        preferredLanguage: preference.preferredLanguage
      }
    ])
  );

  return {
    articles: result.articles
      .filter((article) => {
        const sourceControl = sourceControlsByName.get(article.source.toLowerCase());

        if (sourceControl?.action === "MUTE") {
          return false;
        }

        if (sourceControl?.hideSensational && isSensationalHeadline(article.title)) {
          return false;
        }

        if (
          sourceControl?.preferredRegion &&
          params.country &&
          sourceControl.preferredRegion !== params.country
        ) {
          return false;
        }

        return true;
      })
      .map((article) =>
        rankArticle({
          article,
          clickCount: interactionByUrl.get(article.url)?.clickCount ?? 0,
          totalReadingTimeSeconds:
            interactionByUrl.get(article.url)?.totalReadingTimeSeconds ?? 0,
          isBookmarked: bookmarkedUrls.has(article.url),
          categoryViewCount: categoryViewsBySlug.get(article.category) ?? 0,
          embeddingSimilarity:
            rankingSignalsByUrl.get(article.url)?.embeddingSimilarity ?? 0,
          trendingScore: rankingSignalsByUrl.get(article.url)?.trendingScore ?? 0,
          sourceControl:
            sourceControlsByName.get(article.source.toLowerCase()) ?? {
              action: "NEUTRAL",
              hideSensational: false,
              preferredRegion: null,
              preferredLanguage: null
            }
        })
      )
      .sort(
        (a, b) =>
          b.recommendationScore - a.recommendationScore ||
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      ),
    errors: result.errors,
    cached: result.cached
  };
}

function rankArticle({
  article,
  clickCount,
  totalReadingTimeSeconds,
  isBookmarked,
  categoryViewCount,
  embeddingSimilarity,
  trendingScore,
  sourceControl
}: {
  article: UnifiedArticle;
  clickCount: number;
  totalReadingTimeSeconds: number;
  isBookmarked: boolean;
  categoryViewCount: number;
  embeddingSimilarity: number;
  trendingScore: number;
  sourceControl: SourceControlSignal;
}): RankedArticle {
  const { score, breakdown } = calculateRecommendationScore({
    clickCount,
    totalReadingTimeSeconds,
    isBookmarked,
    categoryViewCount
  });
  const behavior = normalizeBehaviorScore(score);
  const recency = calculateRecencyScore(article.publishedAt);
  const userEmbedding = clamp01(embeddingSimilarity);
  const trending = clamp01(trendingScore);
  const sourceControlBoost = sourceControl.action === "PRIORITIZE" ? 0.14 : 0;
  const recommendationScore = clamp01(
    userEmbedding * FEED_RANKING_WEIGHTS.userEmbedding +
    behavior * FEED_RANKING_WEIGHTS.behavior +
    recency * FEED_RANKING_WEIGHTS.recency +
    trending * FEED_RANKING_WEIGHTS.trending +
    sourceControlBoost
  );

  return {
    ...article,
    recommendationScore,
    scoreBreakdown: {
      userEmbedding,
      behavior,
      recency,
      trending,
      sourceControl: sourceControlBoost,
      behaviorSignals: breakdown
    }
  };
}

async function getArticleRankingSignals(
  userId: string,
  urls: string[]
): Promise<ArticleRankingSignals[]> {
  if (urls.length === 0) {
    return [];
  }

  const rows = await prisma.$queryRaw<
    Array<{
      url: string;
      embeddingSimilarity: number | null;
      globalClicks: number | bigint | null;
      globalReadingTime: number | bigint | null;
      globalBookmarks: number | bigint | null;
    }>
  >`
    SELECT
      a."url",
      CASE
        WHEN upe."embedding" IS NULL OR a."embedding" IS NULL THEN 0
        ELSE GREATEST(0, 1 - (a."embedding" <=> upe."embedding"))
      END AS "embeddingSimilarity",
      COALESCE(SUM(ui."clickCount"), 0) AS "globalClicks",
      COALESCE(SUM(ui."totalReadingTimeSeconds"), 0) AS "globalReadingTime",
      COUNT(DISTINCT b."id") AS "globalBookmarks"
    FROM "Article" a
    LEFT JOIN "UserProfileEmbedding" upe ON upe."userId" = ${userId}
    LEFT JOIN "UserInteraction" ui ON ui."articleId" = a."id"
    LEFT JOIN "Bookmark" b ON b."articleId" = a."id"
    WHERE a."url" IN (${Prisma.join(urls)})
    GROUP BY a."id", a."url", a."embedding", upe."embedding"
  `;

  return rows.map((row) => ({
    url: row.url,
    embeddingSimilarity: Number(row.embeddingSimilarity ?? 0),
    trendingScore: normalizeTrendingScore({
      globalClicks: Number(row.globalClicks ?? 0),
      globalReadingTime: Number(row.globalReadingTime ?? 0),
      globalBookmarks: Number(row.globalBookmarks ?? 0)
    })
  }));
}

function calculateRecencyScore(publishedAt: string) {
  const ageHours =
    (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);

  if (!Number.isFinite(ageHours) || ageHours < 0) {
    return 1;
  }

  return Math.exp(-ageHours / 72);
}

function normalizeBehaviorScore(score: number) {
  return clamp01(score / 50);
}

function normalizeTrendingScore({
  globalClicks,
  globalReadingTime,
  globalBookmarks
}: {
  globalClicks: number;
  globalReadingTime: number;
  globalBookmarks: number;
}) {
  const raw =
    globalClicks * 2 + Math.min(globalReadingTime / 60, 30) + globalBookmarks * 8;

  return clamp01(raw / 50);
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 1);
}

function isSensationalHeadline(title: string) {
  return /\b(shocking|bombshell|you won't believe|destroyed|exposed|insane|secret|panic|disaster|meltdown)\b/i.test(
    title
  );
}
