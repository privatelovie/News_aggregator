import { z } from "zod";

export const articleSummaryRequestSchema = z.object({
  article: z.object({
    title: z.string().trim().min(1).max(500),
    source: z.string().trim().max(200).nullable().optional(),
    url: z.string().url().nullable().optional(),
    summary: z.string().trim().max(4000).nullable().optional(),
    content: z.string().trim().max(30000).nullable().optional(),
    publishedAt: z.string().nullable().optional()
  })
});
