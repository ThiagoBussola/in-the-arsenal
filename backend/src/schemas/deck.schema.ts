import { z } from "zod";

export const createDeckSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(220)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
  description: z.string().max(2000).optional(),
  heroCardId: z.string().max(50).optional(),
  format: z.enum(["CC", "BLITZ", "COMMONER", "LL", "SAGE"]).default("CC"),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PRIVATE"),
});

export const updateDeckSchema = createDeckSchema.partial();

export const addCardSchema = z.object({
  cardUniqueId: z.string().min(1).max(50),
  quantity: z.number().int().min(1).max(3).default(1),
  zone: z.enum(["MAIN", "EQUIPMENT", "WEAPON", "SIDEBOARD"]).default("MAIN"),
});

export const replaceCardsSchema = z.object({
  cards: z.array(addCardSchema).max(100),
});

export const deckQuerySchema = z.object({
  format: z.enum(["CC", "BLITZ", "COMMONER", "LL", "SAGE"]).optional(),
  heroCardId: z.string().max(50).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateDeckInput = z.infer<typeof createDeckSchema>;
export type UpdateDeckInput = z.infer<typeof updateDeckSchema>;
export type AddCardInput = z.infer<typeof addCardSchema>;
export type ReplaceCardsInput = z.infer<typeof replaceCardsSchema>;
export type DeckQueryInput = z.infer<typeof deckQuerySchema>;

export const fabraryImportSchema = z.object({
  raw: z.string().min(1).max(500_000),
});

export type FabraryImportInput = z.infer<typeof fabraryImportSchema>;
