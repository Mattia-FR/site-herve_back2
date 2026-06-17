/**
 * Helpers de conversion de dates.
 *
 * Rôle : normaliser les dates entre le format JavaScript (ISO 8601)
 * et le format MySQL (DATETIME : "YYYY-MM-DD HH:mm:ss").
 *
 * MySQL2 peut retourner les dates comme objets Date ou comme chaînes selon
 * la configuration du driver — toDateString gère les deux cas.
 *
 * toMySQLDatetime est utilisé pour les INSERT/UPDATE sur les colonnes DATETIME
 * (published_at des articles notamment).
 */

/**
 * Convertit une Date JS ou une chaîne en chaîne ISO 8601.
 * @returns Chaîne ISO (ex: "2024-03-15T10:30:00.000Z"), ou null si absent
 */
export function toDateString(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

/**
 * Formate une date pour MySQL DATETIME (YYYY-MM-DD HH:mm:ss, UTC).
 * MySQL ne comprend pas le format ISO 8601 avec le "T" et les millisecondes.
 * @param value - Date à convertir (Date, string ISO, null ou undefined)
 * @returns Chaîne MySQL DATETIME ou null si absent/invalide
 */
export function toMySQLDatetime(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  // "2024-03-15T10:30:00.000Z" → "2024-03-15 10:30:00"
  return date.toISOString().slice(0, 19).replace("T", " ");
}
