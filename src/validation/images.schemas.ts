/**
 * Schémas Zod de validation pour les images.
 */
import { z } from "zod";

// sync with site-herve_front2/src/validation/schemas.ts

/** Body POST /api/admin/images (métadonnées après upload Multer). */
export const imageMetadataSchema = z.object({
  title: z.string().max(255).nullable().optional(),
  description: z.string().nullable().optional(),
  alt_descr: z.string().max(255).nullable().optional(),
  is_in_gallery: z.union([z.boolean(), z.string().transform((v) => v === "true")]).optional(),
  display_order: z.union([z.number().int().min(0), z.string().transform(Number)]).optional(),
  article_id: z.union([z.number().int().positive(), z.null()]).optional(),
});

/** Body PUT /api/admin/images/:id. */
export const imageUpdateSchema = z.object({
  title: z.string().max(255).nullable().optional(),
  description: z.string().nullable().optional(),
  alt_descr: z.string().max(255).nullable().optional(),
  is_in_gallery: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
  article_id: z.union([z.number().int().positive(), z.null()]).optional(),
});

/** Body PUT /api/admin/images/:id/categories. */
export const imageCategoriesSchema = z.object({
  categoryIds: z.array(z.number().int().positive()).max(1),
});

/** Query GET /api/images/gallery (?category=slug). */
export const galleryBrowseQuerySchema = z.object({
  category: z
    .string()
    .min(1, "Slug de catégorie invalide")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug de catégorie invalide")
    .optional(),
});
