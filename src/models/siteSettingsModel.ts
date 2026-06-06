import type { RowDataPacket } from "mysql2";
import type { SiteSettings, SiteSettingsUpdateData } from "../types/siteSettings";
import { query } from "./db";

const SITE_SETTINGS_ID = 1;

interface SiteSettingsRow extends RowDataPacket {
  hero_text: string | null;
  quote_text: string | null;
  quote_author: string | null;
}

const mapRow = (row: SiteSettingsRow): SiteSettings => ({
  heroText: row.hero_text ?? null,
  quoteText: row.quote_text ?? null,
  quoteAuthor: row.quote_author ?? null,
});

const find = async (): Promise<SiteSettings | null> => {
  const rows = await query<SiteSettingsRow[]>(
    `SELECT hero_text, quote_text, quote_author
     FROM site_settings
     WHERE id = ?`,
    [SITE_SETTINGS_ID]
  );
  const row = rows[0];
  if (!row) return null;
  return mapRow(row);
};

const update = async (data: SiteSettingsUpdateData): Promise<SiteSettings | null> => {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.heroText !== undefined) {
    fields.push("hero_text = ?");
    values.push(data.heroText);
  }
  if (data.quoteText !== undefined) {
    fields.push("quote_text = ?");
    values.push(data.quoteText);
  }
  if (data.quoteAuthor !== undefined) {
    fields.push("quote_author = ?");
    values.push(data.quoteAuthor);
  }

  if (fields.length > 0) {
    await query(`UPDATE site_settings SET ${fields.join(", ")} WHERE id = ?`, [
      ...values,
      SITE_SETTINGS_ID,
    ]);
  }

  return find();
};

export default { find, update };
