/**
 * Extension de l'interface Express Request.
 *
 * Couche : Types globaux.
 * requestId : injecté par requestIdMiddleware sur chaque requête.
 * validated* : injectés par validationMiddleware après validation Zod réussie.
 */
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: { userId: number };
      validatedBody?: unknown;
      validatedQuery?: unknown;
      validatedParams?: unknown;
      validatedId?: number;
    }
  }
}

export {};
