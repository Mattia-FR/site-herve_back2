export interface ImageVariants {
  thumb: string;
  md: string;
  lg: string;
}

export interface ImageVariantUrls {
  thumb?: string;
  md?: string;
  lg?: string;
}

export interface Image {
  id: number;
  title: string | null;
  description: string | null;
  path: string;
  alt_descr: string | null;
  is_in_gallery: boolean;
  display_order: number;
  user_id: number;
  article_id: number | null;
  variants?: ImageVariants | null;
  created_at: string;
  updated_at: string;
}

export interface ImageWithUrl extends Image {
  imageUrl?: string;
  variantUrls?: ImageVariantUrls;
}

export interface GalleryImage extends ImageWithUrl {
  categories: { id: number; name: string }[];
}

export interface ImageCreateData {
  title?: string | null;
  description?: string | null;
  path: string;
  alt_descr?: string | null;
  is_in_gallery?: boolean;
  display_order?: number;
  user_id: number;
  article_id?: number | null;
  variants?: ImageVariants | null;
}

export interface ImageUpdateData {
  title?: string | null;
  description?: string | null;
  alt_descr?: string | null;
  is_in_gallery?: boolean;
  display_order?: number;
  article_id?: number | null;
}
