/**
 * Extension de l'interface Express Request.
 *
 * Rôle : enrichir le type Request d'Express avec les propriétés injectées
 * par les middlewares de l'application. Ce fichier est référencé dans index.ts
 * via un triple-slash reference pour être pris en compte par TypeScript.
 *
 * Propriétés ajoutées :
 *   requestId       → UUID injecté par requestIdMiddleware (corrélation des logs)
 *   user            → userId JWT injecté par requireAuth
 *   validatedBody   → corps validé par validateBody (type inconnu, casté dans les controllers)
 *   validatedQuery  → query string validée par validateQuery
 *   validatedParams → paramètres de route validés par validateParams
 *   validatedId     → ID de route parsé par requireValidId
 *
 * Les controllers utilisent getValidatedBody<T>(req) etc. pour accéder à ces
 * propriétés de façon typée et sûre.
 */
declare global {
  namespace Express {
    interface Request {
      /** UUID unique par requête, injecté par requestIdMiddleware. */
      requestId: string;
      /** Payload JWT, injecté par requireAuth. undefined si non authentifié. */
      user?: { userId: number };
      /** Corps de requête validé par Zod, injecté par validateBody. */
      validatedBody?: unknown;
      /** Query string validée par Zod, injectée par validateQuery. */
      validatedQuery?: unknown;
      /** Paramètres de route validés par Zod, injectés par validateParams. */
      validatedParams?: unknown;
      /** ID numérique de route parsé et validé par requireValidId. */
      validatedId?: number;
    }
  }
}

export {};
