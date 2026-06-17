/**
 * Controller public — profil de l'artiste.
 *
 * Rôle : lire et retourner le profil public de l'artiste (nom, bio, tagline,
 * photo de profil) ainsi que les paramètres de la page d'accueil (hero, citation).
 *
 * Route correspondante : GET /api/artist
 */
import type { Request, Response } from "express";
import { NotFoundResource } from "../config/errorCodes";
import { NotFoundError } from "../errors/AppError";
import artistModel from "../models/artistModel";
import { asyncHandler } from "../utils/asyncHandler";

/**
 * GET /api/artist
 * Retourne le profil public de l'artiste.
 * Lance NotFoundError si le profil n'existe pas en base.
 */
const readProfile = asyncHandler(async (_req: Request, res: Response) => {
  const profile = await artistModel.findProfile();
  if (!profile) throw new NotFoundError(NotFoundResource.ARTIST_PROFILE);
  res.status(200).json(profile);
});

export { readProfile };
