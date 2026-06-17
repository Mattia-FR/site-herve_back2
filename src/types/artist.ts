/**
 * Types TypeScript — Profil public de l'artiste.
 *
 * Rôle : définir le contrat de la réponse GET /api/artist.
 * Regroupe les informations du profil utilisateur (user id=2), y compris
 * les textes de la page d'accueil, dans une seule structure.
 *
 * ArtistProfileImage : photo de profil avec URL absolue et variantes WebP
 * ArtistProfile      : profil complet retourné par l'API
 */
import type { ImageVariantUrls } from "./images";

/** Photo de profil de l'artiste avec URL absolue. */
export interface ArtistProfileImage {
  imageUrl: string;
  alt: string | null;
  variantUrls?: ImageVariantUrls; // variantes WebP pour le responsive
}

/** Profil public complet de l'artiste, incluant les textes de la page d'accueil. */
export interface ArtistProfile {
  username: string;
  firstName: string | null;
  lastName: string | null;
  tagline: string | null; // sous-titre/accroche de l'artiste
  bio: string | null; // biographie longue (HTML possible)
  profileImage: ArtistProfileImage | null;
  heroText: string | null; // texte principal de la page d'accueil (users.hero_text)
  quoteText: string | null; // citation mise en avant (users.quote_text)
  quoteAuthor: string | null; // auteur de la citation (users.quote_author)
}
