/**
 * Model — profil public de l'artiste.
 *
 * Rôle : lire le profil de l'artiste (user id = 2) pour la page d'accueil,
 * y compris les textes éditoriaux (hero, citation).
 *
 * La requête SQL joint la table `users` et `images` (photo de profil).
 *
 * Table principale : users (id = ARTIST_USER_ID)
 */
import type { RowDataPacket } from "mysql2";
import type { ArtistProfile } from "../types/artist";
import type { ImageVariants } from "../types/images";
import { buildImageUrl, buildVariantUrls } from "../utils/image/imageUrl";
import { query } from "./db";

/** ID fixe de l'utilisateur artiste en base. À ne pas confondre avec l'admin (id=1). */
const ARTIST_USER_ID = 2;

/** Interface du résultat SQL brut pour le profil artiste. */
interface ArtistProfileRow extends RowDataPacket {
  username: string;
  first_name: string | null;
  last_name: string | null;
  tagline: string | null;
  bio: string | null;
  hero_text: string | null;
  quote_text: string | null;
  quote_author: string | null;
  image_path: string | null;
  image_variants: string | ImageVariants | null;
}

/**
 * Retourne le profil public de l'artiste avec sa photo et les textes de la page d'accueil.
 * @returns Le profil complet ou null si l'utilisateur n'existe pas
 */
const findProfile = async (): Promise<ArtistProfile | null> => {
  const rows = await query<ArtistProfileRow[]>(
    `SELECT u.username, u.first_name, u.last_name, u.tagline, u.bio,
            u.hero_text, u.quote_text, u.quote_author,
            i.path AS image_path, i.variants AS image_variants
     FROM users u
     LEFT JOIN images i ON u.profile_image_id = i.id
     WHERE u.id = ?`,
    [ARTIST_USER_ID]
  );

  const row = rows[0];
  if (!row) return null;

  // Construction de l'objet photo de profil avec URL absolue et variantes WebP
  let profileImage: ArtistProfile["profileImage"] = null;
  if (row.image_path) {
    const imageUrl = buildImageUrl(row.image_path);
    if (imageUrl) {
      profileImage = {
        imageUrl,
        variantUrls: buildVariantUrls(row.image_variants),
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
    heroText: row.hero_text ?? null,
    quoteText: row.quote_text ?? null,
    quoteAuthor: row.quote_author ?? null,
  };
};

export default { findProfile };
