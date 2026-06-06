/**
 * Schémas Zod de validation pour le contenu page d'accueil.
 */
import { z } from "zod";

/** Body PUT /api/admin/site. */
export const siteSettingsUpdateSchema = z.object({
  heroText: z.string().nullable().optional(),
  quoteText: z.string().nullable().optional(),
  quoteAuthor: z.string().max(100).nullable().optional(),
});
