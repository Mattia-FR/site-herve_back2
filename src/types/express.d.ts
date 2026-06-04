/**
 * Extension de l'interface Express Request.
 *
 * Couche : Types globaux.
 * requestId : injecté par requestIdMiddleware sur chaque requête.
 * user : réservé pour l'authentification JWT (non implémentée).
 */
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: { userId: number };
    }
  }
}

export {};
