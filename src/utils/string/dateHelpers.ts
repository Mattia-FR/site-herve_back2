/** Convertit une Date ou chaîne en string ISO, ou null si absent. */
export function toDateString(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

/** Formate une date pour MySQL DATETIME (YYYY-MM-DD HH:mm:ss, UTC). */
export function toMySQLDatetime(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace("T", " ");
}
