import sharp from "sharp";
import pool from "../models/db";
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
  } catch (err) {
    logger.error({
      message: "Démarrage impossible — connexion à la base de données échouée",
      err,
    });
    process.exit(1);
  }
}
