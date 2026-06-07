/**
 * Schémas Zod de validation pour l'authentification.
 */
import { z } from "zod";

// sync with site-herve_front2/src/validation/schemas.ts

/** Body POST /api/auth/login. */
export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});
