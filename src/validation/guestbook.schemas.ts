/**
 * Schémas Zod de validation pour le livre d'or.
 *
 * Rôle : valider les soumissions publiques et les mises à jour de modération
 * admin pour les entrées du livre d'or.
 *
 * Sync avec Front2 :
 *   BASE partagée avec Front2/src/validation/schemas.ts — guestbookFormSchema,
 *   guestbookUpdateFormSchema.
 *   DELTA Front2 intentionnel (guestbookFormSchema) : email accepte z.literal("")
 *   transformé en undefined → gère le cas "champ email laissé vide dans le formulaire"
 *   (l'API reçoit soit un email valide, soit rien).
 *
 * Schémas :
 *   guestbookCreateSchema → POST /api/guestbook (soumission publique)
 *   guestbookUpdateSchema → PATCH /api/admin/guestbook/:id (modération)
 */
import { z } from "zod";

/** Body POST /api/guestbook. */
export const guestbookCreateSchema = z.object({
  author_name: z.string().min(1, "Le nom est requis").max(100),
  email: z.string().email("Email invalide").max(100).optional(),
  message: z.string().min(1, "Le message est requis").max(2000),
});

/** Body PATCH /api/admin/guestbook/:id (modération). */
export const guestbookUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "spam"]),
});
