/**
 * Model public — articles publiés.
 *
 * Rôle : lire les articles avec status = "published" depuis la base MySQL.
 * Exporte également les constantes SQL partagées avec articlesAdminModel
 * (ARTICLE_HEAD, ARTICLE_TAIL, ARTICLE_FROM, LIST_SELECT, DETAIL_SELECT)
 * et la fonction mapRow pour éviter la duplication.
 *
 * Table principale : articles
 * Jointures : LEFT JOIN images (featured image), LEFT JOIN users (auteur)
 *
 * Pattern : Les requêtes de liste utilisent LIST_SELECT (sans le champ `content`
 * pour alléger les réponses), et les requêtes de détail utilisent DETAIL_SELECT.
 */
import type { RowDataPacket } from "mysql2";
import type { Article, ArticleStatus } from "../types/articles";
import type { ImageVariants } from "../types/images";
import { buildImageUrl, buildVariantUrls } from "../utils/image/imageUrl";
import { toDateString } from "../utils/string/dateHelpers";
import { query } from "./db";

/** Interface du résultat SQL brut pour un article (avec jointures). */
export interface ArticleRow extends RowDataPacket {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content?: string;
  status: ArticleStatus;
  user_id: number;
  author_username: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  published_at: Date | string | null;
  featured_image_id: number | null;
  image_path: string | null;
  image_alt_descr: string | null;
  image_variants: string | ImageVariants | null;
}

/**
 * Transforme une ligne SQL brute en objet Article typé.
 * Construit l'URL absolue de l'image à la une et ses variantes WebP.
 * @param row            - Ligne brute retournée par MySQL2
 * @param includeContent - Si true, inclut le champ `content` (HTML de l'article)
 */
export const mapRow = (row: ArticleRow, includeContent = false): Article => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  excerpt: row.excerpt,
  ...(includeContent && { content: row.content }),
  status: row.status,
  user_id: row.user_id,
  author_username: row.author_username ?? undefined,
  created_at: toDateString(row.created_at) ?? "",
  updated_at: toDateString(row.updated_at) ?? "",
  published_at: toDateString(row.published_at) ?? null,
  featured_image_id: row.featured_image_id,
  imageUrl: buildImageUrl(row.image_path),
  imageAlt: row.image_alt_descr ?? null,
  imageVariantUrls: buildVariantUrls(row.image_variants),
});

// Fragments SQL réutilisables pour éviter la duplication entre modèles public et admin
const ARTICLE_HEAD = "a.id, a.title, a.slug, a.excerpt";
const ARTICLE_TAIL = `a.status, a.user_id,
  a.created_at, a.updated_at, a.published_at,
  a.featured_image_id, i.path AS image_path, i.alt_descr AS image_alt_descr,
  i.variants AS image_variants, u.username AS author_username`;
const ARTICLE_FROM = `
  FROM articles a
  LEFT JOIN images i ON a.featured_image_id = i.id
  LEFT JOIN users u ON a.user_id = u.id`;

/** SELECT pour les listes (sans le contenu HTML pour alléger les réponses). */
export const LIST_SELECT = `SELECT ${ARTICLE_HEAD}, ${ARTICLE_TAIL}${ARTICLE_FROM}`;
/** SELECT pour les détails (avec le contenu HTML complet). */
export const DETAIL_SELECT = `SELECT ${ARTICLE_HEAD}, a.content, ${ARTICLE_TAIL}${ARTICLE_FROM}`;

/**
 * Retourne les articles publiés, triés par date de publication décroissante.
 * @param limit - Nombre maximum d'articles (optionnel, pas de limite si absent)
 */
const findPublished = async (limit?: number): Promise<Article[]> => {
  const sql = `${LIST_SELECT} WHERE a.status = 'published' ORDER BY a.published_at DESC${limit ? " LIMIT ?" : ""}`;
  const rows = await query<ArticleRow[]>(sql, limit ? [limit] : []);
  return rows.map((r) => mapRow(r));
};

/** Retourne les 4 derniers articles publiés pour l'aperçu de la page d'accueil. */
const findHomepagePreview = async (): Promise<Article[]> => findPublished(4);

/** Retourne un article publié par son ID (avec contenu HTML). */
const findPublishedById = async (id: number): Promise<Article | null> => {
  const rows = await query<ArticleRow[]>(
    `${DETAIL_SELECT} WHERE a.status = 'published' AND a.id = ?`,
    [id]
  );
  return rows[0] ? mapRow(rows[0], true) : null;
};

/** Retourne un article publié par son slug (avec contenu HTML). */
const findPublishedBySlug = async (slug: string): Promise<Article | null> => {
  const rows = await query<ArticleRow[]>(
    `${DETAIL_SELECT} WHERE a.status = 'published' AND a.slug = ?`,
    [slug]
  );
  return rows[0] ? mapRow(rows[0], true) : null;
};

export default { findPublished, findHomepagePreview, findPublishedById, findPublishedBySlug };
