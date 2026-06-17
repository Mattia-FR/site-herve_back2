/**
 * Utilitaire pour construire des requêtes UPDATE paramétrées dynamiquement.
 *
 * Rôle : générer une clause SET à partir d'un payload partiel en ignorant
 * les champs undefined. Évite d'écraser des colonnes existantes avec des
 * valeurs non fournies lors d'une mise à jour partielle.
 *
 * Utilisé dans tous les models qui implémentent des opérations UPDATE
 * (articlesAdminModel, imagesAdminModel, categoriesAdminModel, etc.).
 *
 * Exemple :
 *   buildUpdateQuery("articles", { title: "Nouveau", status: undefined })
 *   → { sql: "UPDATE articles SET title = ? WHERE id = ?", values: ["Nouveau"] }
 */

/**
 * Construit une requête UPDATE paramétrée à partir d'un payload partiel.
 * Seuls les champs définis (non undefined) sont inclus dans le SET.
 * @param table   - Nom de la table SQL
 * @param payload - Objet contenant les champs à mettre à jour (les undefined sont ignorés)
 * @returns Objet { sql, values } prêt pour pool.query(), ou null si aucun champ
 */
export function buildUpdateQuery(
  table: string,
  payload: object
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
