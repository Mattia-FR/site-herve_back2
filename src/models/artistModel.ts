import type { RowDataPacket } from "mysql2";
import type { ArtistProfile } from "../types/artist";

/** ID de l'utilisateur artiste en base (profil public du site). */
const ARTIST_USER_ID = 2;
import type { ImageVariants } from "../types/images";
import { buildImageUrl } from "../utils/image/imageUrl";
import { parseVariants } from "../utils/image/parseVariants";
import { query } from "./db";

interface ArtistProfileRow extends RowDataPacket {
  username: string;
  first_name: string | null;
  last_name: string | null;
  tagline: string | null;
  bio: string | null;
  image_path: string | null;
  image_alt_descr: string | null;
  image_variants: string | ImageVariants | null;
}

const findProfile = async (): Promise<ArtistProfile | null> => {
  const rows = await query<ArtistProfileRow[]>(
    `SELECT u.username, u.first_name, u.last_name, u.tagline, u.bio,
            i.path AS image_path, i.alt_descr AS image_alt_descr, i.variants AS image_variants
     FROM users u
     LEFT JOIN images i ON u.profile_image_id = i.id
     WHERE u.id = ?`,
    [ARTIST_USER_ID]
  );

  const row = rows[0];
  if (!row) return null;

  let profileImage: ArtistProfile["profileImage"] = null;
  if (row.image_path) {
    const imageUrl = buildImageUrl(row.image_path);
    if (imageUrl) {
      const variants = parseVariants(row.image_variants);
      profileImage = {
        imageUrl,
        alt: row.image_alt_descr ?? null,
        variantUrls: variants
          ? {
              thumb: buildImageUrl(variants.thumb),
              md: buildImageUrl(variants.md),
              lg: buildImageUrl(variants.lg),
            }
          : undefined,
      };
    }
  }

  return {
    username: row.username,
    firstName: row.first_name ?? null,
    lastName: row.last_name ?? null,
    tagline: row.tagline ?? null,
    bio: row.bio ?? null,
    profileImage,
  };
};

export default { findProfile };
