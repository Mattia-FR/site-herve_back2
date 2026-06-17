/**
 * Schémas Zod de validation pour les messages de contact.
 *
 * Rôle : valider les soumissions publiques du formulaire de contact et les
 * mises à jour de modération admin.
 *
 * Sync avec Front2 :
 *   BASE partagée avec Front2/src/validation/schemas.ts — contactFormSchema,
 *   messageUpdateFormSchema (aucun delta intentionnel).
 *
 * Schémas :
 *   messageCreateSchema → POST /api/messages (formulaire de contact public)
 *   messageUpdateSchema → PATCH /api/admin/messages/:id (modération)
 */
import { z } from "zod";

/** Body POST /api/messages (formulaire contact). */
export const messageCreateSchema = z.object({
  firstname: z.string().max(50).nullable().optional(),
  lastname: z.string().max(50).nullable().optional(),
  email: z.string().email("Email invalide").max(100),
  subject: z.string().min(1, "Le sujet est requis").max(200),
  text: z.string().min(1, "Le message est requis"),
});

/** Body PATCH /api/admin/messages/:id (modération). */
export const messageUpdateSchema = z.object({
  status: z.enum(["unread", "read", "archived", "spam"]),
});
