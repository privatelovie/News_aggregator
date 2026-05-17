import { z } from "zod";
import { unifiedArticleSchema } from "@/lib/recommendations/validation";

export const embedArticleRequestSchema = z.object({
  article: unifiedArticleSchema
});

export const similaritySearchRequestSchema = z.object({
  query: z.string().trim().min(1).max(4000).optional(),
  useUserProfile: z.boolean().default(false),
  limit: z.number().int().min(1).max(50).default(10)
});
