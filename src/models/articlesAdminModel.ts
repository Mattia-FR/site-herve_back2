import type { ResultSetHeader } from "mysql2";
import type { Article, ArticleCreateData, ArticleUpdateData } from "../types/articles";
import { NotFoundError } from "../errors/AppError";
import { buildUpdateQuery } from "../utils/db/buildUpdateQuery";
import { toMySQLDatetime } from "../utils/string/dateHelpers";
import { createExcerpt } from "../utils/string/excerpt";
import { applySlugIfChanged, buildSlug } from "../utils/string/slug";
import { type ArticleRow, DETAIL_SELECT, LIST_SELECT, mapRow } from "./articlesModel";
import pool, { query } from "./db";

const findAllForAdmin = async (): Promise<Article[]> => {
  const rows = await query<ArticleRow[]>(`${LIST_SELECT} ORDER BY a.updated_at DESC`);
  return rows.map((r) => mapRow(r));
};

const findByIdForAdmin = async (id: number): Promise<Article | null> => {
  const rows = await query<ArticleRow[]>(`${DETAIL_SELECT} WHERE a.id = ?`, [id]);
  return rows[0] ? mapRow(rows[0], true) : null;
};

const findBySlugForAdmin = async (slug: string): Promise<Article | null> => {
  const rows = await query<ArticleRow[]>(`${DETAIL_SELECT} WHERE a.slug = ?`, [slug]);
  return rows[0] ? mapRow(rows[0], true) : null;
};

const create = async (data: ArticleCreateData): Promise<Article> => {
  const slug = buildSlug(data.title);
  const excerpt = createExcerpt(data.content);
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO articles (title, slug, excerpt, content, status, user_id, featured_image_id, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      slug,
      excerpt,
      data.content,
      data.status ?? "draft",
      data.user_id,
      data.featured_image_id ?? null,
      toMySQLDatetime(data.published_at),
    ],
  );
  const article = await findByIdForAdmin(result.insertId);
  if (!article) throw new NotFoundError("Article");
  return article;
};

const update = async (id: number, data: ArticleUpdateData): Promise<Article | null> => {
  const existing = await findByIdForAdmin(id);
  if (!existing) return null;

  const updateData: ArticleUpdateData = { ...data };
  if (updateData.published_at !== undefined) {
    updateData.published_at = toMySQLDatetime(updateData.published_at) ?? undefined;
  }

  const payload = applySlugIfChanged({ ...updateData }, data.title, existing.title);

  if (data.content !== undefined && data.content !== existing.content) {
    payload.excerpt = createExcerpt(data.content);
  }

  const q = buildUpdateQuery("articles", payload);
  if (!q) return existing;

  await pool.query<ResultSetHeader>(q.sql, [...q.values, id]);
  return findByIdForAdmin(id);
};

const deleteById = async (id: number): Promise<boolean> => {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM articles WHERE id = ?",
    [id],
  );
  return result.affectedRows > 0;
};

export default { findAllForAdmin, findByIdForAdmin, findBySlugForAdmin, create, update, deleteById };
