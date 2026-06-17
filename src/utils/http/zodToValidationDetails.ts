/**
 * Conversion des erreurs Zod en détails de validation par champ.
 *
 * Rôle : transformer le tableau d'issues d'une ZodError en tableau de
 * ValidationDetail (type partagé avec le frontend) pour les réponses
 * 400 VALIDATION_FAILED.
 *
 * Format retourné :
 *   [{ field: "email", message: "Email invalide" }, ...]
 *
 * Les chemins imbriqués sont joints par "." (ex: "address.city").
 * Un issue sans chemin (validation de la valeur racine) est représenté par "_root".
 */
import type { ZodError } from "zod";
import type { ValidationDetail } from "../../types/apiError";

/**
 * Transforme les issues Zod en tableau de ValidationDetail.
 * @param error - ZodError retournée par schema.safeParse()
 * @returns Tableau de { field, message } pour la réponse HTTP
 */
export function zodToValidationDetails(error: ZodError): ValidationDetail[] {
  return error.issues.map((issue) => ({
    field: issue.path.map(String).join(".") || "_root",
    message: issue.message,
  }));
}
