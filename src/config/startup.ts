/**
 * Vérifications effectuées au démarrage du serveur.
 *
 * Rôle : s'assurer que toutes les dépendances externes sont opérationnelles
 * avant d'accepter des requêtes. Si l'une d'elles échoue, le processus s'arrête.
 *
 * Vérifications :
 *   1. Sharp concurrency  — limité à 2 en prod pour ne pas saturer le CPU
 *   2. Dossiers uploads   — créés s'ils n'existent pas (gallery, content, featured + variants)
 *   3. MySQL              — ping via SELECT 1
 *   4. SMTP               — vérification du transport si EMAIL_ENABLED=true
 */
import sharp from "sharp";
import pool from "../models/db";
import mailService from "../services/mailService";
import { logError } from "../utils/log/logHelpers";
import { env } from "./env";
import logger from "./logger";
import { ensureUploadDirs } from "./uploadsPaths";

/**
 * Configure la concurrence Sharp selon l'environnement.
 * - Production : 2 threads max pour éviter de saturer le CPU sur un petit VPS
 * - Développement : 0 = automatique (utilise tous les cœurs disponibles)
 */
export function configureSharp(): void {
  sharp.concurrency(env.NODE_ENV === "production" ? 2 : 0);
}

/**
 * Exécute toutes les vérifications de démarrage de façon séquentielle.
 * Arrête le processus (exit 1) en cas d'échec sur n'importe quelle étape.
 */
export async function checkStartup(): Promise<void> {
  configureSharp();

  try {
    await ensureUploadDirs();
    // Ping léger pour valider la connexion au pool MySQL
    await pool.query("SELECT 1");
    logger.info({ message: "Connexion à la base de données OK" });

    if (env.EMAIL_ENABLED) {
      await mailService.verifyTransporter();
    }
  } catch (err) {
    logError("Démarrage impossible", err);
    process.exit(1);
  }
}
