import { z } from "zod";

const DEV_DEFAULTS = {
  CORS_ORIGIN: "http://localhost:5173",
  API_URL: "http://localhost:4242",
} as const;

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
  CORS_ORIGIN: z.string().url().optional(),
  API_URL: z.string().url().optional(),
  IMAGE_BASE_URL: z.string().url().optional(),
  LOG_LEVEL: z.string().optional(),
  LOG_DIR: z.string().optional(),
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

export type Env = z.infer<typeof envSchema> & {
  CORS_ORIGIN: string;
  API_URL: string;
  IMAGE_BASE_URL: string;
  CLIENT_LOG_ENABLED: boolean;
  EMAIL_ENABLED: boolean;
  SMTP_SECURE: boolean;
};

function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  });
}

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const messages = formatZodIssues(parsed.error);
    console.error(`Démarrage impossible — configuration invalide :\n${messages.join("\n")}`);
    process.exit(1);
  }

  const data = parsed.data;
  const isProduction = data.NODE_ENV === "production";

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

  const API_URL = data.API_URL ?? DEV_DEFAULTS.API_URL;
  const CORS_ORIGIN = data.CORS_ORIGIN ?? DEV_DEFAULTS.CORS_ORIGIN;
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

export const env = loadEnv();
