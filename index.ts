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

async function main() {
  // Vérifications critiques avant d'accepter des requêtes :
  // connexion MySQL, création des dossiers uploads, vérification SMTP optionnelle.
  await checkStartup();

  // Route de diagnostic rapide (non préfixée /api) pour vérifier que le serveur répond.
  app.get("/", (_req, res) => {
    res.status(200).send(`Je suis sur l'API http://localhost:${port}`);
  });

  app.listen(port, () => {
    logger.info({ message: "Server started", port });
  });
}

main().catch((err) => {
  logger.error({ message: "Démarrage impossible", err });
  process.exit(1);
});
