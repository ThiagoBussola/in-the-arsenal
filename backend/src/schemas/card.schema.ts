import { z } from "zod";

export const cardSearchSchema = z.object({
  q: z.string().max(200).optional(),
  type: z.string().max(50).optional(),
  class: z.string().max(50).optional(),
  pitch: z.string().max(5).optional(),
  keyword: z.string().max(100).optional(),
  legalIn: z.enum(["cc", "blitz", "commoner", "ll", "sage"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const cardUsageQuerySchema = z.object({
  hero: z.string().max(50).optional(),
  format: z.enum(["CC", "BLITZ", "COMMONER", "LL", "SAGE"]).optional(),
});

export type CardSearchInput = z.infer<typeof cardSearchSchema>;
export type CardUsageQueryInput = z.infer<typeof cardUsageQuerySchema>;

export const fabCubeSyncSchema = z.object({
  jsonUrl: z.url().optional(),
});

export type FabCubeSyncInput = z.infer<typeof fabCubeSyncSchema>;
