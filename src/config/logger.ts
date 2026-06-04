/**
 * Instance Winston centralisée pour les logs applicatifs et HTTP.
 *
 * Couche : Config — consommée par errorHandler, httpLog, index.
 * Dev : format colorisé lisible (HH:mm:ss level: message {meta}).
 * Prod : JSON sur stdout + fichiers error.log / combined.log.
 * Env : LOG_LEVEL (défaut : debug en dev, info en prod).
 */
import winston from "winston";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const isProduction = process.env.NODE_ENV === "production";
const logLevel = process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug");
const logDir = process.env.LOG_DIR ?? "logs";

const customLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
} as const;

winston.addColors({
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
});

const devFormat = combine(
  colorize(),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf((info) => {
    const { timestamp: ts, level, message, stack, ...meta } = info;
    const metaKeys = Object.keys(meta).filter(
      (k) => !["level", "splat"].includes(k),
    );
    const metaSuffix =
      metaKeys.length > 0 ? ` ${JSON.stringify(meta, null, 0)}` : "";
    const text = typeof message === "string" ? message : JSON.stringify(message);
    const base = `${ts} ${level}: ${text}${metaSuffix}`;
    return stack ? `${base}\n${stack}` : base;
  }),
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json(),
);

const logger = winston.createLogger({
  level: logLevel,
  levels: customLevels,
  format: isProduction ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
    ...(isProduction
      ? [
          new winston.transports.File({
            filename: `${logDir}/error.log`,
            level: "error",
          }),
          new winston.transports.File({
            filename: `${logDir}/combined.log`,
          }),
        ]
      : []),
  ],
});

export default logger;
