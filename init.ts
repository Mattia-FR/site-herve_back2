import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
/**
 * Script d'initialisation de la base de données - Site Herve
 * Supprime la base si elle existe, recrée les tables via schema.sql, puis insère les données de test (seeds).
 *
 * Exécution (depuis le dossier Back) :
 *   npx ts-node init.ts
 *
 * Variables d'environnement requises dans .env :
 *   DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
 *   DB_PORT (optionnel, défaut 3306)
 */
import mysql from "mysql2/promise";
import { runSeeds } from "./seeds";

dotenv.config();

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  console.error("❌ Variables d'environnement manquantes (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)");
  process.exit(1);
}

async function initDatabase(): Promise<void> {
  // Connexion sans sélectionner de base (pour pouvoir la supprimer/créer)
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT ? Number.parseInt(DB_PORT) : 3306,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true, // nécessaire pour exécuter le schéma SQL en une passe
  });

  try {
    // ── Étape 1 : suppression et création de la base ─────────────────────────
    console.log(`🗑️  Suppression de la base "${DB_NAME}" si elle existe...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);

    console.log(`🛠️  Création de la base "${DB_NAME}"...`);
    await connection.query(
      `CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );

    await connection.query(`USE \`${DB_NAME}\``);

    // ── Étape 2 : création des tables ────────────────────────────────────────
    console.log("📐 Création des tables...");
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");
    await connection.query(schema);

    // ── Étape 3 : insertion des données de test ──────────────────────────────
    console.log("🌱 Insertion des données de test...");
    await runSeeds(connection);

    console.log(`\n✅ Base de données "${DB_NAME}" initialisée avec succès !`);
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation :", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initDatabase();
