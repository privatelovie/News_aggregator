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

export const readingEventSchema = articleEventSchema.extend({
  durationSeconds: z.number().int().min(0).max(86400)
});

export const categoryEventSchema = z.object({
  category: z.string().min(1).max(80)
});
