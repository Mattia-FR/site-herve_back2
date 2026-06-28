/**
 * Schémas Zod de validation pour les catégories de galerie.
 *
 * Rôle : valider les données de création, mise à jour et gestion des catégories.
 *
 * Sync avec Front2 :
 *   BASE partagée avec Front2/src/validation/schemas.ts — categoryFormSchema,
 *   categoryUpdateFormSchema (aucun delta intentionnel).
 *
 * Schémas :
 *   categoryCreateSchema    → POST /api/admin/categories
 *   categoryUpdateSchema    → PUT /api/admin/categories/:id
 *   reorderImagesSchema     → PATCH /api/admin/categories/:id/images/reorder
 *   setCoverSchema          → PATCH /api/admin/categories/:id/cover
 */
import { z } from "zod";

/** Body POST /api/admin/categories. */
export const categoryCreateSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(50),
  display_order: z.number().int().min(0).optional(),
});

/** Body PUT /api/admin/categories/:id. */
export const categoryUpdateSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(50).optional(),
  display_order: z.number().int().min(0).optional(),
});

/** Body PATCH /api/admin/categories/:id/images/reorder. */
export const reorderImagesSchema = z.object({
  imageIds: z.array(z.number().int().positive()).min(1),
});

/** Body PATCH /api/admin/categories/:id/cover. */
export const setCoverSchema = z.object({
  imageId: z.number().int().positive().nullable(),
});
