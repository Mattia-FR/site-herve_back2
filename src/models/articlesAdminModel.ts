/**
 * Model admin — articles (tous statuts).
 *
 * Rôle : opérations CRUD sur les articles pour le backoffice.
 * Réutilise les fragments SQL et la fonction mapRow de articlesModel.ts
 * pour éviter la duplication.
 *
 * Différences vs le model public :
 *   - findPaginated : tous les articles (publiés + brouillons), triés par updated_at
 *   - findByIdForAdmin / findBySlugForAdmin : pas de filtre sur le status
 *   - create : génère le slug depuis le titre et l'extrait depuis le contenu HTML
 *   - update : met à jour dynamiquement via buildUpdateQuery, régénère le slug
 *              si le titre a changé, et recalcule l'extrait si le contenu a changé
 *
 * Table principale : articles
 */
import type { ResultSetHeader } from "mysql2";
import { NotFoundResource } from "../config/errorCodes";
import { NotFoundError } from "../errors/AppError";
import type { Article, ArticleCreateData, ArticleUpdateData } from "../types/articles";
import type { PaginatedResponse } from "../types/pagination";
import { buildUpdateQuery } from "../utils/db/buildUpdateQuery";
import { paginateQuery } from "../utils/db/paginate";
import { toMySQLDatetime } from "../utils/string/dateHelpers";
import { createExcerpt } from "../utils/string/excerpt";
import { applySlugIfChanged, buildSlug } from "../utils/string/slug";
import { type ArticleRow, DETAIL_SELECT, LIST_SELECT, mapRow } from "./articlesModel";
import pool, { query } from "./db";

/**
 * Retourne la liste paginée de tous les articles (admin), triés par date de mise à jour.
 * Utilise paginateQuery pour calculer le total et retourner { data, pagination }.
 */
const findPaginated = async (page: number, limit: number): Promise<PaginatedResponse<Article>> => {
  return paginateQuery<ArticleRow, Article>({
    selectSql: `${LIST_SELECT} ORDER BY a.updated_at DESC`,
    countSql: "SELECT COUNT(*) AS total FROM articles a",
    page,
    limit,
    mapRow: (r) => mapRow(r),
  });
};

/** Retourne un article par son ID (tous statuts confondus, avec contenu HTML). */
const findByIdForAdmin = async (id: number): Promise<Article | null> => {
  const rows = await query<ArticleRow[]>(`${DETAIL_SELECT} WHERE a.id = ?`, [id]);
  return rows[0] ? mapRow(rows[0], true) : null;
};

/** Retourne un article par son slug (tous statuts confondus, avec contenu HTML). */
const findBySlugForAdmin = async (slug: string): Promise<Article | null> => {
  const rows = await query<ArticleRow[]>(`${DETAIL_SELECT} WHERE a.slug = ?`, [slug]);
  return rows[0] ? mapRow(rows[0], true) : null;
};

/**
 * Crée un article en base.
 * Le slug est généré automatiquement depuis le titre (slugify).
 * L'extrait est extrait automatiquement des 25 premiers mots du contenu HTML.
 */
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
  if (!article) throw new NotFoundError(NotFoundResource.ARTICLE);
  return article;
};

/**
 * Met à jour un article existant.
 * - Régénère le slug si le titre a changé (applySlugIfChanged)
 * - Recalcule l'extrait si le contenu HTML a changé
 * - Si aucun champ n'a changé, retourne l'article existant sans requête UPDATE
 */
const update = async (id: number, data: ArticleUpdateData): Promise<Article | null> => {
  const existing = await findByIdForAdmin(id);
  if (!existing) return null;

  const updateData: ArticleUpdateData = { ...data };
  if (updateData.published_at !== undefined) {
    updateData.published_at = toMySQLDatetime(updateData.published_at) ?? undefined;
  }

  // Ajoute `slug` dans le payload si le titre a changé
  const payload = applySlugIfChanged({ ...updateData }, data.title, existing.title);

  // L'extrait est recalculé uniquement si le contenu change (jamais accepté depuis le client)
  if (data.content !== undefined && data.content !== existing.content) {
    payload.excerpt = createExcerpt(data.content);
  }

  const q = buildUpdateQuery("articles", payload);
  if (!q) return existing; // Aucun champ à mettre à jour

  await pool.query<ResultSetHeader>(q.sql, [...q.values, id]);
  return findByIdForAdmin(id);
};

/**
 * Supprime un article par son ID.
 * @returns true si une ligne a été supprimée, false si l'article n'existait pas
 */
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
