/**
 * Schémas Zod de validation pour les articles.
 */
import { z } from "zod";

// sync with Front/src/validation/schemas.ts

/** Body POST /api/admin/articles. */
export const articleCreateSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(255),
  content: z.string().min(1, "Le contenu est requis"),
  excerpt: z.string().nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  featured_image_id: z.number().int().positive().nullable().optional(),
});

/** Body PUT /api/admin/articles/:id. */
export const articleUpdateSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(255).optional(),
  content: z.string().min(1, "Le contenu est requis").optional(),
  excerpt: z.string().nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  featured_image_id: z.number().int().positive().nullable().optional(),
});

/** Query GET /api/articles/published (?limit=). */
export const articlesPublishedQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1, "Le paramètre limit doit être entre 1 et 50")
    .max(50, "Le paramètre limit doit être entre 1 et 50")
    .optional(),
});

/** Params slug pour routes /published/slug/:slug et admin /slug/:slug. */
export const slugParamSchema = z.object({
  slug: z.string().min(1, "Slug invalide").max(255),
});
