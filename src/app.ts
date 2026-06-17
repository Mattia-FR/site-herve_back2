/**
 * Configuration centrale de l'application Express.
 *
 * Rôle : assemble tous les middlewares globaux dans l'ordre correct et monte
 * le routeur principal sous /api. Ce fichier ne démarre pas le serveur —
 * c'est index.ts qui appelle app.listen().
 *
 * Ordre des middlewares (important) :
 *   1. requestId      — UUID par requête, utilisé dans tous les logs suivants
 *   2. helmet         — en-têtes de sécurité HTTP (CSP, HSTS, etc.)
 *   3. cors           — autoriser le frontend (CORS_ORIGIN)
 *   4. express.json   — parse le corps JSON (limite 200 Ko)
 *   5. cookieParser   — parse les cookies (refresh token httpOnly)
 *   6. httpLog        — log structuré Winston de chaque requête HTTP
 *   7. rate limiters  — protection anti-abus par domaine
 *   8. /uploads       — fichiers statiques (images traitées par Sharp)
 *   9. /api router    — toutes les routes métier
 *  10. notFound       — 404 pour les routes inconnues (enregistré via setImmediate
 *                       pour être certain d'être après tous les routeurs)
 *  11. errorHandler   — gestion centralisée des erreurs
 */
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { DEFAULT_ERROR_MESSAGES, ErrorCode } from "./config/errorCodes";
import { helmetMiddleware } from "./config/helmet";
import { UPLOADS_ROOT } from "./config/uploadsPaths";
import { errorHandler } from "./middlewares/errorHandler";
import { httpLogMiddleware } from "./middlewares/httpLog";
import { notFound } from "./middlewares/notFound";
import { requestIdMiddleware } from "./middlewares/requestId";
import router from "./routes";

const app = express();

// En production derrière un reverse-proxy (Nginx/Caddy), on fait confiance
// au premier proxy pour les headers X-Forwarded-For (rate limiting par IP réelle).
if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(requestIdMiddleware);
app.use(helmetMiddleware);
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true, // nécessaire pour envoyer les cookies httpOnly (refresh token)
  })
);
app.use(express.json({ limit: "200kb" }));
app.use(cookieParser());
app.use(httpLogMiddleware);

// Message renvoyé à l'utilisateur quand le rate limit est atteint.
// Reprend le format d'erreur standard de l'API.
const rateLimitMessage = {
  success: false as const,
  code: ErrorCode.RATE_LIMITED,
  message: DEFAULT_ERROR_MESSAGES[ErrorCode.RATE_LIMITED],
};

// Options communes à tous les rate limiters
const rateLimitBase = {
  standardHeaders: true, // renvoie les headers RateLimit-* (RFC 6585)
  legacyHeaders: false, // désactive les anciens headers X-RateLimit-*
  message: rateLimitMessage,
};

// Limite globale : 200 requêtes toutes routes confondues par IP sur 15 minutes.
app.use(rateLimit({ ...rateLimitBase, windowMs: 15 * 60 * 1000, limit: 200 }));

// Limite spécifique pour l'authentification : 20 tentatives / 15 min.
// Protège contre le brute-force des credentials.
app.use(
  "/api/auth",
  rateLimit({
    ...rateLimitBase,
    windowMs: 15 * 60 * 1000,
    limit: 20,
  })
);

// 10 messages de contact max par IP et par heure.
const messagesPostLimiter = rateLimit({
  ...rateLimitBase,
  windowMs: 60 * 60 * 1000,
  limit: 10,
});

// 5 entrées de livre d'or max par IP et par heure.
const guestbookPostLimiter = rateLimit({
  ...rateLimitBase,
  windowMs: 60 * 60 * 1000,
  limit: 5,
});

// Les limiters POST sont appliqués uniquement sur POST pour ne pas pénaliser
// les requêtes GET (lecture publique) sur les mêmes chemins.
app.use("/api/messages", (req, res, next) => {
  if (req.method !== "POST") return next();
  return messagesPostLimiter(req, res, next);
});

app.use("/api/guestbook", (req, res, next) => {
  if (req.method !== "POST") return next();
  return guestbookPostLimiter(req, res, next);
});

// Mise en cache des fichiers statiques :
// - prod : 7 jours avec immutable (les noms de fichiers contiennent un suffixe unique)
// - dev  : pas de cache pour voir les changements immédiatement
const uploadsStaticOptions =
  env.NODE_ENV === "production"
    ? { maxAge: 7 * 24 * 60 * 60 * 1000, immutable: true }
    : { maxAge: 0 };

app.use("/uploads", express.static(UPLOADS_ROOT, uploadsStaticOptions));

// 30 logs client max par IP sur 15 minutes (remontée d'erreurs depuis le frontend).
app.use(
  "/api/client-logs",
  rateLimit({
    ...rateLimitBase,
    windowMs: 15 * 60 * 1000,
    limit: 30,
  })
);

app.use("/api", router);

// setImmediate garantit que notFound et errorHandler sont enregistrés APRÈS
// que tous les routeurs aient été montés, même si certains le sont de façon asynchrone.
setImmediate(() => {
  app.use(notFound);
  app.use(errorHandler);
});

export default app;
