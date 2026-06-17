/**
 * Configuration de Helmet — en-têtes de sécurité HTTP.
 *
 * Rôle : durcir la réponse HTTP en ajoutant des en-têtes qui protègent contre
 * les attaques XSS, le clickjacking, le MIME-sniffing, etc.
 *
 * Points notables :
 *   - Content-Security-Policy : restreint les sources autorisées pour les scripts,
 *     styles, images et connexions réseau. Les URLs API_URL et CORS_ORIGIN sont
 *     dynamiquement autorisées pour permettre la communication frontend ↔ API.
 *   - crossOriginResourcePolicy "cross-origin" : nécessaire pour que les images
 *     servies depuis /uploads soient accessibles par le frontend (origines différentes).
 *   - frameguard "sameorigin" : interdit l'intégration dans une iframe externe.
 *   - referrerPolicy "no-referrer" : aucune information d'origine transmise aux tiers.
 */
import helmet from "helmet";
import { env } from "./env";

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      fontSrc: ["'self'"],
      // Autorise les images depuis l'API (pour les balises <img> servies par /uploads)
      imgSrc: ["'self'", "data:", env.API_URL],
      // Autorise les requêtes fetch/XHR vers l'API et le frontend
      connectSrc: ["'self'", env.API_URL, env.CORS_ORIGIN],
      frameAncestors: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
  // Permet au frontend (origines différentes) d'afficher les images de /uploads
  crossOriginResourcePolicy: { policy: "cross-origin" },
  frameguard: { action: "sameorigin" },
  referrerPolicy: { policy: "no-referrer" },
});
