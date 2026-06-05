/**
 * Schémas Zod de validation pour les catégories de galerie.
 */
import { z } from "zod";

// sync with Front/src/validation/schemas.ts

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
