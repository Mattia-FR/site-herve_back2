/**
 * Routeur admin — regroupe tous les sous-routeurs du backoffice.
 *
 * Rôle : monté sous "/api/admin" dans routes/index.ts.
 * Applique requireAuth en premier sur toute la zone : toutes les routes
 * filles héritent automatiquement de la protection JWT sans devoir
 * le déclarer individuellement dans chaque sous-routeur.
 *
 * Routes admin disponibles (préfixe /api/admin) :
 *   *  /articles   → CRUD articles + upload images
 *   *  /users      → profil admin connecté (GET/PUT /me)
 *   *  /images     → CRUD galerie + gestion catégories
 *   *  /categories → CRUD catégories
 *   *  /messages   → liste et modération des messages de contact
 *   *  /guestbook  → modération du livre d'or
 *   *  /stats      → statistiques du dashboard
 */
import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import articlesAdminRouter from "./articlesAdminRouter";
import categoriesAdminRouter from "./categoriesAdminRouter";
import guestbookAdminRouter from "./guestbookAdminRouter";
import imagesAdminRouter from "./imagesAdminRouter";
import messagesAdminRouter from "./messagesAdminRouter";
import rebuildAdminRouter from "./rebuildAdminRouter";
import statsAdminRouter from "./statsAdminRouter";
import usersAdminRouter from "./usersAdminRouter";

const router = Router();

// requireAuth vérifie le Bearer token JWT sur TOUTES les routes de ce routeur.
router.use(requireAuth);

router.use("/articles", articlesAdminRouter);
router.use("/users", usersAdminRouter);
router.use("/images", imagesAdminRouter);
router.use("/categories", categoriesAdminRouter);
router.use("/messages", messagesAdminRouter);
router.use("/guestbook", guestbookAdminRouter);
router.use("/stats", statsAdminRouter);
router.use("/rebuild", rebuildAdminRouter);

export default router;
