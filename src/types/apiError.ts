/**
 * Types TypeScript — Corps des réponses d'erreur de l'API.
 *
 * Rôle : définir le contrat des erreurs retournées par sendError().
 * Ce format est partagé avec le frontend (Front2/src/types/api/errors.ts).
 *
 * Format de réponse d'erreur :
 *   { success: false, code: "VALIDATION_FAILED", message: "...", details?: [...] }
 *
 * ValidationDetail est présent uniquement pour les erreurs de validation Zod
 * (VALIDATION_FAILED) et liste les problèmes par champ.
 *
 * Sync : garder en sync avec Front2/src/types/api/errors.ts.
 */

/** Détail de validation pour un champ spécifique. */
export interface ValidationDetail {
  field: string; // chemin du champ (ex: "email", "address.city", "_root")
  message: string; // message d'erreur Zod localisé
}

/** Corps JSON d'une réponse d'erreur HTTP. */
export interface ApiErrorBody {
  success: false; // toujours false pour distinguer des succès
  code: string; // code machine stable (ErrorCode)
  message: string; // message lisible (français)
  details?: ValidationDetail[]; // présent uniquement pour VALIDATION_FAILED
}
