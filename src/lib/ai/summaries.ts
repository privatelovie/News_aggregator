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
const LOCAL_SUMMARY_MODEL = "local-extractive";

export async function getArticleSummary(
  article: ArticleSummaryInput
): Promise<CachedArticleSummary> {
  const requestedModel = process.env.OPENAI_SUMMARY_MODEL ?? DEFAULT_SUMMARY_MODEL;
  const model = process.env.OPENAI_API_KEY ? requestedModel : LOCAL_SUMMARY_MODEL;
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

  const { model: resolvedModel, summary } = await summarizeArticle({
    article,
    model
  });
  await cacheSummary({ article, articleHash, model: resolvedModel, summary });

  return {
    articleHash,
    cached: false,
    model: resolvedModel,
    ...summary
  };
}

async function summarizeArticle({
  article,
  model
}: {
  article: ArticleSummaryInput;
  model: string;
}) {
  if (model === LOCAL_SUMMARY_MODEL) {
    return {
      model,
      summary: summarizeArticleLocally(article)
    };
  }

  try {
    return {
      model,
      summary: await summarizeArticleWithOpenAI({ article, model })
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const shouldFallback =
      message.toLowerCase().includes("quota") ||
      message.toLowerCase().includes("billing") ||
      message.toLowerCase().includes("429");

    if (!shouldFallback) {
      throw error;
    }

    return {
      model: LOCAL_SUMMARY_MODEL,
      summary: summarizeArticleLocally(article)
    };
  }
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

function summarizeArticleLocally(article: ArticleSummaryInput): ArticleSummary {
  const text = normalizeText(
    [article.title, article.summary, article.content].filter(Boolean).join(". ")
  );
  const sentences = splitSentences(text);
  const rankedSentences = rankSentences(sentences);
  const selected = rankedSentences.slice(0, 3);
  const fallbackLine = article.summary || article.title;
  const threeLineSummary = fillLines(selected, fallbackLine, 3);
  const keyTakeaways = fillLines(
    rankedSentences.slice(0, 5),
    fallbackLine,
    3
  ).slice(0, 5);

  return {
    threeLineSummary,
    explainSimply:
      threeLineSummary[0] ??
      `${article.title} is the main story, but there is not enough article text for a deeper summary.`,
    keyTakeaways,
    whyThisMatters:
      rankedSentences[3] ??
      "This matters because it may affect readers following this topic, region, or source."
  };
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function splitSentences(value: string) {
  return value
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 24)
    .slice(0, 30);
}

function rankSentences(sentences: string[]) {
  const frequency = new Map<string, number>();

  for (const sentence of sentences) {
    for (const word of tokenize(sentence)) {
      frequency.set(word, (frequency.get(word) ?? 0) + 1);
    }
  }

  return sentences
    .map((sentence, index) => ({
      index,
      score: tokenize(sentence).reduce(
        (total, word) => total + (frequency.get(word) ?? 0),
        0
      ),
      sentence
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.sentence);
}

function tokenize(value: string) {
  const stopWords = new Set([
    "about",
    "after",
    "also",
    "because",
    "been",
    "being",
    "from",
    "have",
    "into",
    "over",
    "that",
    "their",
    "there",
    "this",
    "were",
    "with",
    "would"
  ]);

  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));
}

function fillLines(lines: string[], fallback: string, count: number) {
  const uniqueLines = Array.from(new Set(lines)).slice(0, count);

  while (uniqueLines.length < count) {
    uniqueLines.push(fallback);
  }

  return uniqueLines;
}
