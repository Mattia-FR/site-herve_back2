/**
 * Types TypeScript — Articles.
 *
 * Rôle : définir les contrats de données pour les articles du blog,
 * partagés entre les controllers, models et les réponses de l'API.
 *
 * Article       : représentation complète d'un article (retournée par l'API)
 * ArticleCreateData : données requises pour créer un article (model)
 * ArticleUpdateData : données partielles pour mettre à jour un article (model)
 *
 * Note : le champ `content` est optionnel dans Article car il n'est pas inclus
 * dans les listes (pour alléger les réponses), mais présent dans les détails.
 */
import type { ImageVariantUrls } from "./images";

/** Statuts possibles d'un article. */
export type ArticleStatus = "draft" | "published" | "archived";

/** Représentation complète d'un article retournée par l'API. */
export interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content?: string; // absent des listes, présent dans les détails (DETAIL_SELECT)
  status: ArticleStatus;
  user_id: number;
  author_username?: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  featured_image_id: number | null;
  imageUrl?: string; // URL absolue de l'image à la une (construite depuis path)
  imageAlt?: string | null;
  imageVariantUrls?: ImageVariantUrls; // URLs des variantes WebP (thumb/md/lg)
}

/** Données pour créer un article (utilisées par articlesAdminModel.create). */
export interface ArticleCreateData {
  title: string;
  content: string;
  status?: ArticleStatus;
  user_id: number;
  featured_image_id?: number | null;
  published_at?: string | null;
}

/** Données partielles pour mettre à jour un article. */
export interface ArticleUpdateData {
  title?: string;
  content?: string;
  status?: ArticleStatus;
  featured_image_id?: number | null;
  published_at?: string | null;
  slug?: string; // géré automatiquement par applySlugIfChanged, ne pas setter manuellement
}
