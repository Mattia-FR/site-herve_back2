import sharp from "sharp";
import pool from "../models/db";
import logger from "./logger";
import { ensureUploadDirs } from "./uploadsPaths";

export function configureSharp(): void {
  sharp.concurrency(process.env.NODE_ENV === "production" ? 2 : 0);
}

const REQUIRED_ENV_VARS = ["ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"] as const;

export async function checkStartup(): Promise<void> {
  configureSharp();

  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    logger.error(
      `Démarrage impossible — variables d'environnement manquantes : ${missing.join(", ")}`
    );
    process.exit(1);
  }

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
