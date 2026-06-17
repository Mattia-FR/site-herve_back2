/**
 * Schémas Zod de validation pour le profil utilisateur admin.
 *
 * Rôle : valider les données de mise à jour du profil administrateur.
 *
 * Sync avec Front2 :
 *   BASE partagée avec Front2/src/validation/schemas.ts — userUpdateFormSchema.
 *   DELTA Front2 intentionnel : password accepte .or(z.literal(""))
 *   → champ vide côté formulaire = "ne pas modifier le mot de passe" (UX).
 *   L'API n'a pas ce delta car un password vide serait rejeté (.min(8)).
 *
 * Schémas :
 *   userUpdateSchema → PUT /api/admin/users/me
 */
import { z } from "zod";

/** Body PUT /api/admin/users/me. */
export const userUpdateSchema = z.object({
  username: z.string().min(2, "2 caractères minimum").max(50).optional(),
  email: z.string().email("Email invalide").max(100).optional(),
  password: z.string().min(8, "8 caractères minimum").max(128).optional(),
  first_name: z.string().max(50).nullable().optional(),
  last_name: z.string().max(50).nullable().optional(),
  tagline: z.string().max(255).nullable().optional(),
  bio: z.string().nullable().optional(),
  hero_text: z.string().nullable().optional(),
  quote_text: z.string().nullable().optional(),
  quote_author: z.string().max(100).nullable().optional(),
  profile_image_id: z.number().int().positive().nullable().optional(),
});
