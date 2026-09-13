/**
 * Point d'entrée principal du serveur.
 *
 * Rôle : charge les variables d'environnement (.env), exécute les vérifications
 * de démarrage (DB, Sharp, SMTP), enregistre la route racine de diagnostic,
 * puis met le serveur en écoute sur le port configuré.
 *
 * Ordre d'import intentionnel : dotenv.config() doit être appelé avant tout
 * import qui lit process.env (env.ts, db.ts, etc.), d'où le `/// <reference>`
 * et l'import dotenv en tête de fichier.
 */
/// <reference path="./src/types/express.d.ts" />
import dotenv from "dotenv";

// dotenv.config() doit précéder tous les imports qui lisent process.env
dotenv.config();

import app from "./src/app";
import { env } from "./src/config/env";
import { checkStartup } from "./src/config/startup";
import logger from "./src/config/logger";

const port = env.PORT;
const host = env.HOST;

async function main() {
  // Vérifications critiques avant d'accepter des requêtes :
  // connexion MySQL, création des dossiers uploads, vérification SMTP optionnelle.
  await checkStartup();

  // Route racine minimale (health principal sur /api/health)
  app.get("/", (_req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // Écoute sur 127.0.0.1 par défaut : l'API n'est joignable que via Nginx (défense en profondeur).
  app.listen(port, host, () => {
    logger.info({ message: "Server started", host, port });
  });
}

main().catch((err) => {
  logger.error({ message: "Démarrage impossible", err });
  process.exit(1);
});
