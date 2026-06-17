/**
 * Routes publiques des catégories — /api/categories
 *
 * GET /     → liste de toutes les catégories (avec compteur d'images)
 * GET /:id  → détail d'une catégorie par ID
 *
 * Accès public, aucune authentification requise.
 */
import { Router } from "express";
import { browse, read } from "../controllers/categoriesController";
import { requireValidId } from "../middlewares/validationMiddleware";

const router = Router();

router.get("/", browse);
router.get("/:id", requireValidId(), read);

export default router;
