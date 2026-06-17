/**
 * Types MIME acceptés pour les uploads d'images.
 *
 * Rôle : définir la liste blanche des types MIME autorisés, utilisée à deux
 * niveaux de vérification :
 *   1. Filtre Multer (multer.ts) — vérification du Content-Type déclaré
 *   2. Middleware validateMagicBytes.ts — vérification des octets réels du fichier
 *
 * Le Set permet une vérification O(1) par rapport à un tableau.
 * L'export du tableau permet de l'utiliser dans les schémas Zod de validation.
 */

/** Liste des types MIME image acceptés. */
export const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

/** Set pour vérification rapide O(1) dans les middlewares. */
export const ALLOWED_IMAGE_MIME_SET = new Set<string>(ALLOWED_IMAGE_MIMES);
