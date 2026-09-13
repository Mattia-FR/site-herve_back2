/**
 * Controller admin — déclenchement du rebuild du frontend SSG.
 *
 * Rôle : permettre à l'admin de déclencher un rebuild du frontend depuis l'interface
 * sans nécessiter d'accès SSH ni d'intervention technique manuelle.
 *
 * Fonctionnement :
 *   1. L'admin clique "Publier" dans le dashboard
 *   2. Ce controller écrit un fichier trigger (.rebuild-trigger)
 *   3. Une tâche cron (check-rebuild.sh) détecte le trigger et lance npm run build
 *   4. Le script shell gère le lock, l'atomicité (dist.tmp → dist) et les logs
 *
 * Rate limiting : refuse un nouveau trigger si un fichier existe déjà et a moins
 * de 60 secondes, pour éviter les déclenchements multiples inutiles.
 *
 * Route correspondante : POST /api/admin/rebuild
 * (protégée par requireAuth via adminRouter.ts)
 */
import fs from "node:fs";
import path from "node:path";
import type { Request, Response } from "express";
import { InternalError, TooManyRequestsError } from "../errors/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { logError } from "../utils/log/logHelpers";
import { sendError } from "../utils/sendError";

/** Chemin du fichier trigger dans le dossier racine du backend */
const TRIGGER_PATH = path.join(process.cwd(), ".rebuild-trigger");

/** Délai minimum entre deux triggers (60 secondes) */
const RATE_LIMIT_MS = 60_000;

/**
 * POST /api/admin/rebuild
 * Déclenche un rebuild du frontend en créant un fichier trigger.
 * Rate limited : max 1 trigger toutes les 60 secondes.
 */
export const triggerRebuild = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Vérifier si un trigger existe déjà (rate limiting)
    if (fs.existsSync(TRIGGER_PATH)) {
      const stats = fs.statSync(TRIGGER_PATH);
      const age = Date.now() - stats.mtimeMs;

      if (age < RATE_LIMIT_MS) {
        sendError(
          res,
          new TooManyRequestsError("Publication déjà en cours ou en attente, veuillez patienter.")
        );
        return;
      }
    }

    // Créer le fichier trigger avec timestamp ISO
    fs.writeFileSync(TRIGGER_PATH, new Date().toISOString(), "utf8");

    res.json({
      success: true,
      message: "Publication en cours, les changements seront visibles d'ici une minute.",
    });
  } catch (err) {
    // Logguer l'erreur (permissions, disque plein, etc.)
    logError("Erreur création trigger rebuild", err, req);
    sendError(
      res,
      new InternalError(
        "Impossible de déclencher la publication. Veuillez réessayer ou contacter le support."
      )
    );
  }
});
