/**
 * Routes du profil public de l'artiste — /api/artist
 *
 * GET / → retourne le profil public de l'artiste (nom, bio, tagline, photo)
 *         ainsi que les paramètres de la page d'accueil (hero text, citation).
 */
import { Router } from "express";
import { readProfile } from "../controllers/artistController";

const router = Router();

router.get("/", readProfile);

export default router;
