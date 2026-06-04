export interface CategoryCoverImage {
  imageUrl: string;
  alt_descr: string | null;
  variantUrls?: {
    thumb: string;
    md: string;
    lg: string;
  };
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  display_order: number;
  created_at: string;
  image_count: number;
  cover_image: CategoryCoverImage | null;
}

export interface CategoryCreateData {
  name: string;
  display_order?: number;
}

export interface CategoryUpdateData {
  name?: string;
  display_order?: number;
  slug?: string;
}
