/**
 * Model — statistiques du tableau de bord admin.
 *
 * Rôle : agréger en une seule requête SQL tous les compteurs affichés
 * sur le dashboard admin.
 *
 * Technique : sous-requêtes scalaires dans le SELECT pour obtenir tous
 * les compteurs en une seule passe sur la base de données, sans jointures
 * complexes ni requêtes multiples.
 *
 * Compteurs retournés :
 *   - articles.published / articles.draft
 *   - categories.total
 *   - images.in_gallery
 *   - guestbook.approved / guestbook.pending
 *   - messages.unread
 *
 * Table concernées : articles, categories, images, guestbook_entries, contact_messages
 */
import type { RowDataPacket } from "mysql2";
import type { AdminStats } from "../types/stats";
import { query } from "./db";

/** Interface du résultat SQL brut pour les statistiques admin. */
interface AdminStatsRow extends RowDataPacket {
  articles_published: number;
  articles_draft: number;
  categories_total: number;
  images_in_gallery: number;
  guestbook_approved: number;
  guestbook_pending: number;
  messages_unread: number;
}

/**
 * Requête d'agrégation : calcule tous les compteurs en une seule passe.
 * Les sous-requêtes scalaires sont plus lisibles et suffisamment performantes
 * pour un dashboard avec des données de taille raisonnable.
 */
const ADMIN_STATS_SELECT = `
  SELECT
    (SELECT COUNT(*) FROM articles WHERE status = 'published') AS articles_published,
    (SELECT COUNT(*) FROM articles WHERE status = 'draft') AS articles_draft,
    (SELECT COUNT(*) FROM categories) AS categories_total,
    (SELECT COUNT(*) FROM images WHERE is_in_gallery = 1) AS images_in_gallery,
    (SELECT COUNT(*) FROM guestbook_entries WHERE status = 'approved') AS guestbook_approved,
    (SELECT COUNT(*) FROM guestbook_entries WHERE status = 'pending') AS guestbook_pending,
    (SELECT COUNT(*) FROM contact_messages WHERE status = 'unread') AS messages_unread`;

/** Transforme la ligne SQL brute en objet AdminStats structuré par domaine. */
const mapRowToAdminStats = (row: AdminStatsRow): AdminStats => ({
  articles: {
    published: Number(row.articles_published) || 0,
    draft: Number(row.articles_draft) || 0,
  },
  categories: {
    total: Number(row.categories_total) || 0,
  },
  images: {
    in_gallery: Number(row.images_in_gallery) || 0,
  },
  guestbook: {
    approved: Number(row.guestbook_approved) || 0,
    pending: Number(row.guestbook_pending) || 0,
  },
  messages: {
    unread: Number(row.messages_unread) || 0,
  },
});

/** Retourne les statistiques agrégées du dashboard admin. */
const getAdminStats = async (): Promise<AdminStats> => {
  const rows = await query<AdminStatsRow[]>(ADMIN_STATS_SELECT);
  return mapRowToAdminStats(rows[0]);
};

export default { getAdminStats };
