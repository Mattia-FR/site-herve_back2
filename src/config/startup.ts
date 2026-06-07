import sharp from "sharp";
import pool from "../models/db";
import mailService from "../services/mailService";
import { logError } from "../utils/log/logHelpers";
import { env } from "./env";
import logger from "./logger";
import { ensureUploadDirs } from "./uploadsPaths";

export function configureSharp(): void {
  sharp.concurrency(env.NODE_ENV === "production" ? 2 : 0);
}

export async function checkStartup(): Promise<void> {
  configureSharp();

  try {
    await ensureUploadDirs();
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
