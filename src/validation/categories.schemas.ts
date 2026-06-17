/**
 * Schémas Zod de validation pour les catégories de galerie.
 *
 * Rôle : valider les données de création et de mise à jour des catégories
 * qui organisent la galerie d'images.
 *
 * Sync avec Front2 :
 *   BASE partagée avec Front2/src/validation/schemas.ts — categoryFormSchema,
 *   categoryUpdateFormSchema (aucun delta intentionnel).
 *
 * Schémas :
 *   categoryCreateSchema → POST /api/admin/categories
 *   categoryUpdateSchema → PUT /api/admin/categories/:id
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
