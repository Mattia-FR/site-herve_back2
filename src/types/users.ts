/**
 * Types TypeScript — Utilisateurs.
 *
 * Rôle : définir le contrat du profil utilisateur retourné par l'API admin.
 * Le mot de passe n'est jamais inclus dans User (uniquement dans UserWithPasswordRow
 * de usersModel.ts pour l'authentification).
 *
 * User           : profil utilisateur complet (sans mot de passe)
 * UserUpdateData : données partielles pour mettre à jour le profil
 */

/** Profil utilisateur retourné par l'API (sans informations sensibles). */
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  tagline: string | null; // accroche/sous-titre (affiché sur le profil public)
  bio: string | null; // biographie longue
  hero_text: string | null; // texte principal de la page d'accueil
  quote_text: string | null; // citation mise en avant sur la page d'accueil
  quote_author: string | null; // auteur de la citation
  profile_image_id: number | null; // ID de l'image de profil (table images)
  created_at: string;
  updated_at: string;
}

/**
 * Données partielles pour mettre à jour le profil.
 * Si password est fourni, le controller doit le hacher avec Argon2 avant mise à jour.
 */
export interface UserUpdateData {
  username?: string;
  email?: string;
  password?: string; // en clair — à hacher dans usersAdminController avant stockage
  first_name?: string | null;
  last_name?: string | null;
  tagline?: string | null;
  bio?: string | null;
  hero_text?: string | null;
  quote_text?: string | null;
  quote_author?: string | null;
  profile_image_id?: number | null;
}
