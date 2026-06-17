/**
 * Routes publiques de la galerie — /api/images
 *
 * GET /gallery/carousel → aperçu carrousel (images marquées in_gallery, limitées)
 * GET /gallery          → galerie complète paginée avec filtres par catégorie
 *
 * Accès public, aucune authentification requise.
 */
import { Router } from "express";
import { browseGallery, readCarouselPreview } from "../controllers/imagesController";
import { validateQuery } from "../middlewares/validationMiddleware";
import { galleryBrowseQuerySchema } from "../validation/images.schemas";

const router = Router();

// La route carousel est déclarée avant /gallery pour éviter tout conflit de correspondance
router.get("/gallery/carousel", readCarouselPreview);
router.get("/gallery", validateQuery(galleryBrowseQuerySchema), browseGallery);

export default router;
