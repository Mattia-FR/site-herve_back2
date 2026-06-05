import type { RowDataPacket } from "mysql2";
import type { Article, ArticleStatus } from "../types/articles";
import type { ImageVariants } from "../types/images";
import { buildImageUrl } from "../utils/image/imageUrl";
import { parseVariants } from "../utils/image/parseVariants";
import { toDateString } from "../utils/string/dateHelpers";
import { query } from "./db";

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

export const mapRow = (row: ArticleRow, includeContent = false): Article => {
  const v = parseVariants(row.image_variants);
  return {
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
    imageVariantUrls: v
      ? {
          thumb: buildImageUrl(v.thumb),
          md: buildImageUrl(v.md),
          lg: buildImageUrl(v.lg),
        }
      : undefined,
  };
};

const ARTICLE_HEAD = "a.id, a.title, a.slug, a.excerpt";
const ARTICLE_TAIL = `a.status, a.user_id,
  a.created_at, a.updated_at, a.published_at,
  a.featured_image_id, i.path AS image_path, i.alt_descr AS image_alt_descr,
  i.variants AS image_variants, u.username AS author_username`;
const ARTICLE_FROM = `
  FROM articles a
  LEFT JOIN images i ON a.featured_image_id = i.id
  LEFT JOIN users u ON a.user_id = u.id`;

export const LIST_SELECT = `SELECT ${ARTICLE_HEAD}, ${ARTICLE_TAIL}${ARTICLE_FROM}`;
export const DETAIL_SELECT = `SELECT ${ARTICLE_HEAD}, a.content, ${ARTICLE_TAIL}${ARTICLE_FROM}`;

const findPublished = async (limit?: number): Promise<Article[]> => {
  const sql = `${LIST_SELECT} WHERE a.status = 'published' ORDER BY a.published_at DESC${limit ? " LIMIT ?" : ""}`;
  const rows = await query<ArticleRow[]>(sql, limit ? [limit] : []);
  return rows.map((r) => mapRow(r));
};

const findHomepagePreview = async (): Promise<Article[]> => findPublished(4);

const findPublishedById = async (id: number): Promise<Article | null> => {
  const rows = await query<ArticleRow[]>(
    `${DETAIL_SELECT} WHERE a.status = 'published' AND a.id = ?`,
    [id]
  );
  return rows[0] ? mapRow(rows[0], true) : null;
};

const findPublishedBySlug = async (slug: string): Promise<Article | null> => {
  const rows = await query<ArticleRow[]>(
    `${DETAIL_SELECT} WHERE a.status = 'published' AND a.slug = ?`,
    [slug]
  );
  return rows[0] ? mapRow(rows[0], true) : null;
};

export default { findPublished, findHomepagePreview, findPublishedById, findPublishedBySlug };
