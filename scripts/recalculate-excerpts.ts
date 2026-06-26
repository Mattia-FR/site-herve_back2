/**
 * Recalcule les extraits de tous les articles existants via createExcerpt.
 *
 * Utile une fois après déploiement si des extraits manuels subsistent en base.
 *
 * Exécution (depuis Back2) :
 *   npm run recalculate:excerpts
 */
import dotenv from "dotenv";
import pool, { query } from "../src/models/db";
import { createExcerpt } from "../src/utils/string/excerpt";

dotenv.config();

type ArticleRow = { id: number; content: string };

async function recalculateExcerpts(): Promise<void> {
  const rows = await query<ArticleRow[]>("SELECT id, content FROM articles");

  for (const row of rows) {
    await pool.query("UPDATE articles SET excerpt = ? WHERE id = ?", [
      createExcerpt(row.content),
      row.id,
    ]);
  }

  console.log(`✅ ${rows.length} extrait(s) recalculé(s).`);
}

recalculateExcerpts()
  .catch((err: unknown) => {
    console.error("❌ Échec du recalcul des extraits :", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
