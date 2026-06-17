/**
 * Controller public — livre d'or.
 *
 * Rôle : lire les entrées approuvées et permettre aux visiteurs de soumettre
 * une nouvelle entrée (en attente de modération).
 *
 * Routes correspondantes (voir guestbookRouter.ts) :
 *   GET  /api/guestbook → entrées approuvées uniquement
 *   POST /api/guestbook → soumettre une entrée (statut initial : "pending")
 */
import type { Request, Response } from "express";
import guestbookModel from "../models/guestbookModel";
import mailService from "../services/mailService";
import type { GuestbookCreateData } from "../types/guestbook";
import { asyncHandler } from "../utils/asyncHandler";
import { getValidatedBody } from "../utils/http/requestHelpers";

/**
 * GET /api/guestbook
 * Retourne toutes les entrées avec statut "approved".
 */
const browseApproved = asyncHandler(async (_req: Request, res: Response) => {
  const entries = await guestbookModel.findApproved();
  res.status(200).json(entries);
});

/**
 * POST /api/guestbook
 * Crée une entrée de livre d'or avec statut "pending" (modération requise).
 * Envoie une notification email à l'administrateur (asynchrone, non bloquant).
 */
const add = asyncHandler(async (req: Request, res: Response) => {
  const body = getValidatedBody<GuestbookCreateData>(req);
  const entry = await guestbookModel.create(body);
  // Notification email asynchrone — une erreur SMTP ne doit pas faire échouer la requête
  void mailService.notifyNewGuestbookEntry(entry);
  res.status(201).json(entry);
});

export { add, browseApproved };
