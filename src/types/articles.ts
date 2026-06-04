import type { ImageVariantUrls } from "./images";

export type ArticleStatus = "draft" | "published" | "archived";

export interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content?: string;
  status: ArticleStatus;
  user_id: number;
  author_username?: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  featured_image_id: number | null;
  imageUrl?: string;
  imageAlt?: string | null;
  imageVariantUrls?: ImageVariantUrls;
}

export interface ArticleCreateData {
  title: string;
  content: string;
  excerpt?: string | null;
  status?: ArticleStatus;
  user_id: number;
  featured_image_id?: number | null;
  published_at?: string | null;
}

export interface ArticleUpdateData {
  title?: string;
  excerpt?: string | null;
  content?: string;
  status?: ArticleStatus;
  featured_image_id?: number | null;
  published_at?: string | null;
  slug?: string;
}
