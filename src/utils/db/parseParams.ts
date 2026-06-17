/**
 * Utilitaire pour parser un paramètre d'URL comme entier positif.
 *
 * Rôle : extraire et valider le paramètre `id` (ou tout autre paramètre
 * numérique) depuis req.params. Utilisé par requireValidId dans
 * validationMiddleware.ts.
 *
 * Retourne null si le paramètre est absent, non numérique, ou inférieur à 1.
 */
import type { Request } from "express";

/**
 * Parse un paramètre de route en entier positif.
 * @param req   - Requête Express
 * @param param - Nom du paramètre à parser (défaut : "id")
 * @returns L'entier positif, ou null si invalide
 */
export function parseIdParam(req: Request, param = "id"): number | null {
  const raw = req.params[param];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return null;
  return parsed;
}
