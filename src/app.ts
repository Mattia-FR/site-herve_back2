import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { helmetMiddleware } from "./config/helmet";
import { UPLOADS_ROOT } from "./config/uploadsPaths";
import { errorHandler } from "./middlewares/errorHandler";
import { httpLogMiddleware } from "./middlewares/httpLog";
import { notFound } from "./middlewares/notFound";
import { requestIdMiddleware } from "./middlewares/requestId";
import router from "./routes";

const app = express();

if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(requestIdMiddleware);
app.use(helmetMiddleware);
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "200kb" }));
app.use(cookieParser());
app.use(httpLogMiddleware);

const rateLimitMessage = {
  success: false as const,
  code: "RATE_LIMITED",
  message: "Trop de requêtes, réessayez plus tard",
};

const rateLimitBase = {
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
};

app.use(rateLimit({ ...rateLimitBase, windowMs: 15 * 60 * 1000, limit: 200 }));

app.use(
  "/api/auth",
  rateLimit({
    ...rateLimitBase,
    windowMs: 15 * 60 * 1000,
    limit: 20,
  })
);

const messagesPostLimiter = rateLimit({
  ...rateLimitBase,
  windowMs: 60 * 60 * 1000,
  limit: 10,
});

const guestbookPostLimiter = rateLimit({
  ...rateLimitBase,
  windowMs: 60 * 60 * 1000,
  limit: 5,
});

app.use("/api/messages", (req, res, next) => {
  if (req.method !== "POST") return next();
  return messagesPostLimiter(req, res, next);
});

app.use("/api/guestbook", (req, res, next) => {
  if (req.method !== "POST") return next();
  return guestbookPostLimiter(req, res, next);
});

const uploadsStaticOptions =
  env.NODE_ENV === "production"
    ? { maxAge: 7 * 24 * 60 * 60 * 1000, immutable: true }
    : { maxAge: 0 };

app.use("/uploads", express.static(UPLOADS_ROOT, uploadsStaticOptions));

app.use(
  "/api/client-logs",
  rateLimit({
    ...rateLimitBase,
    windowMs: 15 * 60 * 1000,
    limit: 30,
  }),
);

app.use("/api", router);

setImmediate(() => {
  app.use(notFound);
  app.use(errorHandler);
});

export default app;
