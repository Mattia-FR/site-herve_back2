import type { ResultSetHeader } from "mysql2";
import { NotFoundError } from "../errors/AppError";
import type { PaginatedResponse } from "../types/pagination";
import type { Article, ArticleCreateData, ArticleUpdateData } from "../types/articles";
import { buildUpdateQuery } from "../utils/db/buildUpdateQuery";
import { paginateQuery } from "../utils/db/paginate";
import { toMySQLDatetime } from "../utils/string/dateHelpers";
import { createExcerpt } from "../utils/string/excerpt";
import { applySlugIfChanged, buildSlug } from "../utils/string/slug";
import { type ArticleRow, DETAIL_SELECT, LIST_SELECT, mapRow } from "./articlesModel";
import pool, { query } from "./db";

const findPaginated = async (
  page: number,
  limit: number,
): Promise<PaginatedResponse<Article>> => {
  return paginateQuery<ArticleRow, Article>({
    selectSql: `${LIST_SELECT} ORDER BY a.updated_at DESC`,
    countSql: "SELECT COUNT(*) AS total FROM articles a",
    page,
    limit,
    mapRow: (r) => mapRow(r),
  });
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
    ]
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
  const [result] = await pool.query<ResultSetHeader>("DELETE FROM articles WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

export default {
  findPaginated,
  findByIdForAdmin,
  findBySlugForAdmin,
  create,
  update,
  deleteById,
};
