import helmet from "helmet";
import { env } from "./env";

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      fontSrc: ["'self'"],
      imgSrc: ["'self'", "data:", env.API_URL],
      connectSrc: ["'self'", env.API_URL, env.CORS_ORIGIN],
      frameAncestors: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  frameguard: { action: "sameorigin" },
  referrerPolicy: { policy: "no-referrer" },
});
