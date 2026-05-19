import { z } from "zod";

const providerSchema = z.object({
  name: z.enum(["newsapi", "gnews", "newsdata"]),
  externalId: z.string().optional()
});

export const unifiedArticleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  source: z.string().min(1),
  category: z
    .enum(["technology", "sports", "politics", "business", "science", "general"])
    .default("general"),
  summary: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
  content: z.string().nullable(),
  publishedAt: z.string().datetime(),
  url: z.string().url(),
  author: z.string().nullable(),
  providers: z.array(providerSchema).default([])
});

export const articleEventSchema = z.object({
  article: unifiedArticleSchema
});

export const bookmarkMetadataSchema = z.object({
  bookmarkId: z.string().min(1).optional(),
  folder: z.string().trim().min(1).max(80).default("Read later"),
  tags: z
    .array(z.string().trim().min(1).max(32))
    .max(12)
    .default([])
    .transform((tags) => Array.from(new Set(tags.map((tag) => tag.toLowerCase())))),
  note: z.string().trim().max(1000).nullable().optional(),
  offlineSnapshot: z.string().trim().max(12000).nullable().optional()
});

export const bookmarkCreateSchema = articleEventSchema.extend({
  bookmark: bookmarkMetadataSchema.partial().optional()
});

export const sourcePreferenceSchema = z.object({
  source: z.string().trim().min(1).max(160),
  action: z.enum(["NEUTRAL", "MUTE", "PRIORITIZE"]).default("NEUTRAL"),
  hideSensational: z.boolean().default(false),
  preferredRegion: z.string().trim().max(12).nullable().optional(),
  preferredLanguage: z.string().trim().max(12).nullable().optional()
});

export const feedPreferenceSchema = z.object({
  topics: z.array(z.string().trim().min(1).max(80)).min(1).max(12),
  sources: z.array(z.string().trim().min(1).max(160)).max(12).default([]),
  location: z.string().trim().min(2).max(12).default("us"),
  readingDepth: z.enum(["QUICK", "BALANCED", "DEEP"]).default("BALANCED"),
  hideNsfw: z.boolean().default(true),
  politicalSensitivity: z
    .enum(["low", "balanced", "high"])
    .default("balanced"),
  onboardingComplete: z.boolean().default(true)
});

export const articleFeedbackSchema = articleEventSchema.extend({
  reason: z
    .enum(["SHOW_FEWER", "SENSITIVE", "LOW_QUALITY"])
    .default("SHOW_FEWER")
});

export const readingEventSchema = articleEventSchema.extend({
  durationSeconds: z.number().int().min(0).max(86400)
});

export const categoryEventSchema = z.object({
  category: z.string().min(1).max(80)
});
