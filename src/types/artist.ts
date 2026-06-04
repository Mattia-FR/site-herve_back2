import type { ImageVariantUrls } from "./images";

export interface ArtistProfileImage {
  imageUrl: string;
  alt: string | null;
  variantUrls?: ImageVariantUrls;
}

export interface ArtistProfile {
  username: string;
  firstName: string | null;
  lastName: string | null;
  tagline: string | null;
  bio: string | null;
  profileImage: ArtistProfileImage | null;
}
