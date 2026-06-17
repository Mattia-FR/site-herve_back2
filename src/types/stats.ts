/**
 * Types TypeScript — Statistiques du tableau de bord admin.
 *
 * Rôle : définir la structure des compteurs retournés par GET /api/admin/stats.
 * Chaque groupe correspond à une entité du site.
 *
 * AdminStats est construit par statsModel.getAdminStats() via une requête SQL
 * qui agrège tous les compteurs en une seule passe.
 */

/** Statistiques agrégées retournées par l'API admin. */
export interface AdminStats {
  articles: {
    published: number; // articles avec status = "published"
    draft: number; // articles avec status = "draft"
  };
  categories: {
    total: number; // nombre total de catégories
  };
  images: {
    in_gallery: number; // images avec is_in_gallery = true
  };
  guestbook: {
    approved: number; // entrées visibles publiquement
    pending: number; // entrées en attente de modération
  };
  messages: {
    unread: number; // messages de contact non lus
  };
}
