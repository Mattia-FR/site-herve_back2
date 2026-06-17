/**
 * Controller admin — statistiques du tableau de bord.
 *
 * Rôle : agréger et retourner les compteurs affichés sur le dashboard admin :
 *   - Nombre total d'articles (publiés + brouillons)
 *   - Nombre d'images en galerie
 *   - Nombre de messages non lus
 *   - Nombre d'entrées de livre d'or en attente de modération
 *   - etc. (voir statsModel.getAdminStats)
 *
 * Route correspondante : GET /api/admin/stats
 */
import type { Request, Response } from "express";
import statsModel from "../models/statsModel";
import { asyncHandler } from "../utils/asyncHandler";

/** GET /api/admin/stats — retourne les statistiques agrégées du dashboard. */
const read = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await statsModel.getAdminStats();
  res.status(200).json(stats);
});

export { read };
