/**
 * Redaction des données sensibles avant écriture dans les logs.
 *
 * Couche : Utils log — appliqué par logger.ts (format Winston) et logHelpers.
 * Masque : mots de passe, tokens JWT, cookies, clés API (pattern insensible à la casse).
 */
/** Clés dont la valeur doit être masquée dans les logs (comparaison insensible à la casse). */
const SENSITIVE_KEY_PATTERN =
  /^(password|passwd|pwd|secret|token|authorization|cookie|refreshToken|accessToken|apiKey|api_key|jwt|credential|session|smtpPass|smtp_pass|SMTP_PASS)$/i;

const REDACTED = "[REDACTED]";

const MAX_DEPTH = 8;
const MAX_STRING_LENGTH = 2000;

function truncate(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) return value;
  return `${value.slice(0, MAX_STRING_LENGTH)}…[truncated]`;
}

/** Masque les segments sensibles dans une chaîne (ex. Authorization Bearer …). */
function redactString(value: string): string {
  let out = truncate(value);
  out = out.replace(/\b(Bearer\s+)[A-Za-z0-9._-]+/gi, `$1${REDACTED}`);
  out = out.replace(
    /\b(refreshToken|accessToken|password)=([^&\s]+)/gi,
    `$1=${REDACTED}`,
  );
  return out;
}

function shouldRedactKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key);
}

/**
 * Parcourt récursivement objets/tableaux et masque les champs sensibles.
 */
export function redact<T>(value: T, depth = 0): T {
  if (depth > MAX_DEPTH) {
    return "[max depth]" as T;
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return redactString(value) as T;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
      stack: value.stack ? redactString(value.stack) : undefined,
    } as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1)) as T;
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (shouldRedactKey(key)) {
        result[key] = REDACTED;
      } else {
        result[key] = redact(val, depth + 1);
      }
    }
    return result as T;
  }

  return value;
}
