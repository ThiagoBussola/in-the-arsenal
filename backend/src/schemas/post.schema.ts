import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(3).max(255),
  slug: z
    .string()
    .min(3)
    .max(280)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1),
  coverImage: z.string().url().max(500).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  categoryId: z.string().uuid().optional(),
  tagNames: z.array(z.string().min(1).max(60)).max(20).optional(),
});

export const updatePostSchema = createPostSchema.partial();

export const postQuerySchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  authorId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  tagIds: z
    .string()
    .transform((v) => v.split(",").filter(Boolean))
    .optional(),
  search: z.string().max(200).optional(),
  fromDate: z
    .string()
    .datetime()
    .transform((v) => new Date(v))
    .optional(),
  toDate: z
    .string()
    .datetime()
    .transform((v) => new Date(v))
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PostQueryInput = z.infer<typeof postQuerySchema>;
