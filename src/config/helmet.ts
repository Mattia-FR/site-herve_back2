import helmet from "helmet";

const API_URL = process.env.API_URL || "http://localhost:4242";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      fontSrc: ["'self'"],
      imgSrc: ["'self'", "data:", API_URL],
      connectSrc: ["'self'", API_URL, CORS_ORIGIN],
      frameAncestors: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  frameguard: { action: "sameorigin" },
  referrerPolicy: { policy: "no-referrer" },
});
