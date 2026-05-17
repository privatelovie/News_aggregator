import { createHash } from "node:crypto";
import { summarizeArticleWithOpenAI } from "@/lib/ai/openai";
import type {
  ArticleSummary,
  ArticleSummaryInput,
  CachedArticleSummary
} from "@/lib/ai/types";
import { prisma } from "@/lib/prisma";

const SUMMARY_CACHE_TTL_DAYS = 14;
const DEFAULT_SUMMARY_MODEL = "gpt-5.4-mini";

export async function getArticleSummary(
  article: ArticleSummaryInput
): Promise<CachedArticleSummary> {
  const model = process.env.OPENAI_SUMMARY_MODEL ?? DEFAULT_SUMMARY_MODEL;
  const articleHash = createArticleHash(article);
  const cached = await prisma.articleSummaryCache.findUnique({
    where: { articleHash }
  });

  if (cached && cached.expiresAt > new Date() && cached.model === model) {
    return {
      articleHash,
      cached: true,
      model,
      threeLineSummary: cached.threeLineSummary,
      explainSimply: cached.explainSimply,
      keyTakeaways: cached.keyTakeaways,
      whyThisMatters: cached.whyThisMatters
    };
  }

  const summary = await summarizeArticleWithOpenAI({ article, model });
  await cacheSummary({ article, articleHash, model, summary });

  return {
    articleHash,
    cached: false,
    model,
    ...summary
  };
}

function createArticleHash(article: ArticleSummaryInput) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        title: article.title,
        url: article.url,
        content: article.content,
        summary: article.summary
      })
    )
    .digest("hex");
}

async function cacheSummary({
  article,
  articleHash,
  model,
  summary
}: {
  article: ArticleSummaryInput;
  articleHash: string;
  model: string;
  summary: ArticleSummary;
}) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SUMMARY_CACHE_TTL_DAYS);

  await prisma.articleSummaryCache.upsert({
    where: { articleHash },
    update: {
      title: article.title,
      url: article.url,
      model,
      threeLineSummary: summary.threeLineSummary,
      explainSimply: summary.explainSimply,
      keyTakeaways: summary.keyTakeaways,
      whyThisMatters: summary.whyThisMatters,
      expiresAt
    },
    create: {
      articleHash,
      title: article.title,
      url: article.url,
      model,
      threeLineSummary: summary.threeLineSummary,
      explainSimply: summary.explainSimply,
      keyTakeaways: summary.keyTakeaways,
      whyThisMatters: summary.whyThisMatters,
      expiresAt
    }
  });
}
