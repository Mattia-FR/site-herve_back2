/**
 * Construit une requête UPDATE paramétrée à partir d'un payload partiel.
 * Seuls les champs définis (non undefined) sont inclus dans le SET.
 * Retourne null si aucun champ à mettre à jour.
 */
export function buildUpdateQuery(
  table: string,
  payload: object,
): { sql: string; values: unknown[] } | null {
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) return null;

  return {
    sql: `UPDATE ${table} SET ${fields.join(", ")} WHERE id = ?`,
    values,
  };
}
