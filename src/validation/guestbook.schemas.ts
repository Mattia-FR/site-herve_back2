/**
 * Schémas Zod de validation pour le livre d'or.
 */
import { z } from "zod";

// sync with Front/src/validation/schemas.ts

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
