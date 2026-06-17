/**
 * Routeur principal — agrège tous les sous-routeurs de l'API.
 *
 * Rôle : point d'entrée unique monté sous "/api" dans app.ts.
 * Expose la route de santé /api/health et délègue chaque préfixe
 * à son routeur dédié.
 *
 * Arborescence des routes :
 *   GET  /api/health          → ping base de données
 *   POST /api/client-logs     → remontée d'erreurs frontend
 *   *    /api/auth            → authentification JWT
 *   GET  /api/artist          → profil public de l'artiste
 *   *    /api/articles        → articles publiés (lecture publique)
 *   *    /api/images          → galerie publique
 *   *    /api/categories      → catégories (lecture publique)
 *   POST /api/messages        → formulaire de contact (honeypot + rate limit)
 *   *    /api/guestbook       → livre d'or public
 *   *    /api/admin           → backoffice complet (JWT requis)
 */
import { Router } from "express";
import pool from "../models/db";
import adminRouter from "./adminRouter";
import authRouter from "./authRouter";
import articlesRouter from "./articlesRouter";
import artistRouter from "./artistRouter";
import categoriesRouter from "./categoriesRouter";
import clientLogsRouter from "./clientLogsRouter";
import guestbookRouter from "./guestbookRouter";
import imagesRouter from "./imagesRouter";
import messagesRouter from "./messagesRouter";

const router = Router();

// Route de santé utilisée par les health-checks des reverse-proxies et outils de monitoring.
// Renvoie 503 si la DB est inaccessible, 200 + { status: "ok" } sinon.
router.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "ok" });
  } catch {
    res.status(503).json({ status: "degraded", db: "error" });
  }
});

router.use("/client-logs", clientLogsRouter);
router.use("/auth", authRouter);
router.use("/artist", artistRouter);
router.use("/articles", articlesRouter);
router.use("/images", imagesRouter);
router.use("/categories", categoriesRouter);
router.use("/messages", messagesRouter);
router.use("/guestbook", guestbookRouter);
// Tout /admin/* est protégé par requireAuth dans adminRouter.ts
router.use("/admin", adminRouter);

export default router;
