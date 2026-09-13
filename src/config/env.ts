/**
 * Validation et chargement des variables d'environnement.
 *
 * Rôle : valider toutes les variables d'environnement au démarrage via Zod,
 * appliquer les valeurs par défaut, et exporter un objet `env` fortement typé.
 * Si une variable obligatoire est manquante ou invalide, le processus s'arrête
 * immédiatement avec un message clair (fail-fast).
 *
 * Variables principales :
 *   - DB_*            : connexion MySQL
 *   - ACCESS/REFRESH_TOKEN_SECRET : JWT (min. 32 caractères)
 *   - CORS_ORIGIN     : origine autorisée par CORS (obligatoire en prod)
 *   - API_URL         : URL publique de l'API (pour les liens dans les emails, etc.)
 *   - IMAGE_BASE_URL  : base URL pour construire les URLs d'images (défaut = API_URL)
 *   - EMAIL_ENABLED   : active le transport SMTP (Nodemailer)
 *   - SMTP_*          : config SMTP (obligatoires si EMAIL_ENABLED=true en prod)
 *   - CLIENT_LOG_ENABLED : active la réception des logs depuis le frontend
 */
import { z } from "zod";

// Valeurs par défaut pour le développement local (évitent de devoir
// les définir dans .env en dev).
const DEV_DEFAULTS = {
  CORS_ORIGIN: "http://localhost:5173",
  API_URL: "http://localhost:4242",
} as const;

// Schéma Zod décrivant chaque variable d'environnement attendue.
// z.coerce.number() / z.string().transform() gèrent la conversion depuis les chaînes.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
  DB_HOST: z.string().min(1, "DB_HOST requis"),
  DB_USER: z.string().min(1, "DB_USER requis"),
  DB_PASSWORD: z.string().min(1, "DB_PASSWORD requis"),
  DB_NAME: z.string().min(1, "DB_NAME requis"),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  ACCESS_TOKEN_SECRET: z.string().min(32, "ACCESS_TOKEN_SECRET doit faire au moins 32 caractères"),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(32, "REFRESH_TOKEN_SECRET doit faire au moins 32 caractères"),
  PORT: z.coerce.number().int().positive().default(4242),
  // Interface d'écoute : 127.0.0.1 par défaut (Nginx proxy local, pas d'exposition publique).
  HOST: z.string().min(1).default("127.0.0.1"),
  CORS_ORIGIN: z.string().url().optional(),
  API_URL: z.string().url().optional(),
  IMAGE_BASE_URL: z.string().url().optional(),
  LOG_LEVEL: z.string().optional(),
  LOG_DIR: z.string().optional(),
  // Les variables booléennes sont transmises sous forme de chaîne dans process.env
  CLIENT_LOG_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  EMAIL_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  NOTIFY_EMAIL: z.string().email().optional(),
});

/**
 * Type final de l'objet env exporté.
 * Surcharge l'inférence Zod pour marquer comme non-optionnelles les propriétés
 * auxquelles on a appliqué des valeurs par défaut ou des fallbacks.
 */
export type Env = z.infer<typeof envSchema> & {
  CORS_ORIGIN: string;
  API_URL: string;
  IMAGE_BASE_URL: string;
  CLIENT_LOG_ENABLED: boolean;
  EMAIL_ENABLED: boolean;
  SMTP_SECURE: boolean;
};

/**
 * Formate les erreurs Zod en liste de messages lisibles pour le log de démarrage.
 * @param error - L'erreur Zod retournée par safeParse
 * @returns Tableau de chaînes "champ: message"
 */
function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  });
}

/**
 * Charge, valide et complète les variables d'environnement.
 * Arrête le processus si la configuration est invalide (fail-fast).
 * @returns L'objet env typé et complet
 */
function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const messages = formatZodIssues(parsed.error);
    console.error(`Démarrage impossible — configuration invalide :\n${messages.join("\n")}`);
    process.exit(1);
  }

  const data = parsed.data;
  const isProduction = data.NODE_ENV === "production";

  // En production, CORS_ORIGIN et API_URL sont obligatoires (pas de valeur par défaut safe).
  if (isProduction) {
    const missing: string[] = [];
    if (!data.CORS_ORIGIN) missing.push("CORS_ORIGIN");
    if (!data.API_URL) missing.push("API_URL");
    if (missing.length > 0) {
      console.error(
        `Démarrage impossible — variables obligatoires en production : ${missing.join(", ")}`
      );
      process.exit(1);
    }
  }

  const EMAIL_ENABLED = data.EMAIL_ENABLED ?? false;

  // En production, si l'email est activé, toutes les variables SMTP sont requises.
  if (EMAIL_ENABLED && isProduction) {
    const missing: string[] = [];
    if (!data.SMTP_HOST) missing.push("SMTP_HOST");
    if (!data.SMTP_USER) missing.push("SMTP_USER");
    if (!data.SMTP_PASS) missing.push("SMTP_PASS");
    if (!data.SMTP_FROM) missing.push("SMTP_FROM");
    if (!data.NOTIFY_EMAIL) missing.push("NOTIFY_EMAIL");
    if (missing.length > 0) {
      console.error(
        `Démarrage impossible — email activé en production, variables manquantes : ${missing.join(", ")}`
      );
      process.exit(1);
    }
  }

  // Résolution des valeurs avec fallback sur les constantes de développement
  const API_URL = data.API_URL ?? DEV_DEFAULTS.API_URL;
  const CORS_ORIGIN = data.CORS_ORIGIN ?? DEV_DEFAULTS.CORS_ORIGIN;
  // IMAGE_BASE_URL permet de servir les images depuis un CDN distinct de l'API en prod
  const IMAGE_BASE_URL = data.IMAGE_BASE_URL ?? API_URL;
  const CLIENT_LOG_ENABLED = data.CLIENT_LOG_ENABLED ?? false;
  const SMTP_SECURE = data.SMTP_SECURE ?? false;

  return {
    ...data,
    CORS_ORIGIN,
    API_URL,
    IMAGE_BASE_URL,
    CLIENT_LOG_ENABLED,
    EMAIL_ENABLED,
    SMTP_SECURE,
  };
}

/** Objet d'environnement validé, importé partout dans l'application. */
export const env = loadEnv();
