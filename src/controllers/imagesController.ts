/**
 * Controller public — galerie d'images.
 *
 * Rôle : exposer les endpoints de lecture publique de la galerie.
 *
 * Routes correspondantes (voir imagesRouter.ts) :
 *   GET /api/images/gallery/carousel → aperçu carrousel (images limitées)
 *   GET /api/images/gallery          → galerie complète avec filtre par catégorie
 */
import type { Request, Response } from "express";
import type { z } from "zod";
import imagesModel from "../models/imagesModel";
import { asyncHandler } from "../utils/asyncHandler";
import { getValidatedQuery } from "../utils/http/requestHelpers";
import type { galleryBrowseQuerySchema } from "../validation/images.schemas";

/**
 * GET /api/images/gallery
 * Retourne les images de la galerie (is_in_gallery = true).
 * Accepte un paramètre optionnel `category` pour filtrer par catégorie.
 */
const browseGallery = asyncHandler(async (req: Request, res: Response) => {
  const { category } = getValidatedQuery<z.infer<typeof galleryBrowseQuerySchema>>(req);
  const images = await imagesModel.findByGallery(category);
  res.status(200).json(images);
});

/**
 * GET /api/images/gallery/carousel
 * Retourne un sous-ensemble d'images pour le carrousel de la page d'accueil.
 * Aucun filtre — les images sont sélectionnées selon display_order.
 */
const readCarouselPreview = asyncHandler(async (_req: Request, res: Response) => {
  const images = await imagesModel.findCarouselPreview();
  res.status(200).json(images);
});

export { browseGallery, readCarouselPreview };
