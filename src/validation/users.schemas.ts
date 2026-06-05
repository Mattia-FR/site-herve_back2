/**
 * Schémas Zod de validation pour le profil utilisateur admin.
 */
import { z } from "zod";

// sync with Front/src/validation/schemas.ts

/** Body PUT /api/admin/users/me. */
export const userUpdateSchema = z.object({
  username: z.string().min(2, "2 caractères minimum").max(50).optional(),
  email: z.string().email("Email invalide").max(100).optional(),
  password: z.string().min(8, "8 caractères minimum").max(128).optional(),
  tagline: z.string().max(255).nullable().optional(),
  bio: z.string().nullable().optional(),
  profile_image_id: z.number().int().positive().nullable().optional(),
});
