import type { RowDataPacket } from "mysql2";
import type { AdminStats } from "../types/stats";
import { query } from "./db";

interface AdminStatsRow extends RowDataPacket {
  articles_published: number;
  articles_draft: number;
  categories_total: number;
  images_in_gallery: number;
  guestbook_approved: number;
  guestbook_pending: number;
  messages_unread: number;
}

const ADMIN_STATS_SELECT = `
  SELECT
    (SELECT COUNT(*) FROM articles WHERE status = 'published') AS articles_published,
    (SELECT COUNT(*) FROM articles WHERE status = 'draft') AS articles_draft,
    (SELECT COUNT(*) FROM categories) AS categories_total,
    (SELECT COUNT(*) FROM images WHERE is_in_gallery = 1) AS images_in_gallery,
    (SELECT COUNT(*) FROM guestbook_entries WHERE status = 'approved') AS guestbook_approved,
    (SELECT COUNT(*) FROM guestbook_entries WHERE status = 'pending') AS guestbook_pending,
    (SELECT COUNT(*) FROM contact_messages WHERE status = 'unread') AS messages_unread`;

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

const getAdminStats = async (): Promise<AdminStats> => {
  const rows = await query<AdminStatsRow[]>(ADMIN_STATS_SELECT);
  return mapRowToAdminStats(rows[0]);
};

export default { getAdminStats };
