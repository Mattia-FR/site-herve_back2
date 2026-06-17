/**
 * Schémas Zod de validation pour l'authentification.
 *
 * Rôle : valider le corps de la requête de connexion avant vérification
 * des identifiants en base de données.
 *
 * Sync avec Front2 :
 *   BASE partagée avec Front2/src/validation/schemas.ts — loginFormSchema.
 *   DELTA Front2 intentionnel : email ajoute .min(1, "L'email est requis")
 *   (message UX du formulaire côté front, non nécessaire côté API).
 *
 * Schémas :
 *   loginSchema → POST /api/auth/login
 */
import { z } from "zod";

/** Body POST /api/auth/login. */
export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});
