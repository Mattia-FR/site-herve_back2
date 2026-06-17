/**
 * Model — utilisateurs (authentification + profil).
 *
 * Rôle : fournir les opérations liées aux utilisateurs pour l'authentification
 * (login, refresh token) et la lecture du profil.
 *
 * Sécurité des refresh tokens :
 *   - Le token est haché avec Argon2 avant d'être stocké dans la colonne
 *     `refresh_token_hash` de la table users.
 *   - rotateRefreshToken utilise une clause WHERE sur expectedTokenHash pour
 *     garantir la mise à jour atomique et détecter la réutilisation de tokens
 *     révoqués (si affectedRows = 0, quelqu'un a déjà utilisé ce token).
 *
 * Table principale : users
 */
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { User } from "../types/users";
import { toDateString } from "../utils/string/dateHelpers";
import pool, { query } from "./db";

/** Interface du résultat SQL brut pour un utilisateur (sans le mot de passe). */
export interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  tagline: string | null;
  bio: string | null;
  hero_text: string | null;
  quote_text: string | null;
  quote_author: string | null;
  profile_image_id: number | null;
  created_at: Date | string;
  updated_at: Date | string;
}

/** Étend UserRow avec le hash du mot de passe (pour l'authentification uniquement). */
export interface UserWithPasswordRow extends UserRow {
  password: string;
}

/** Transforme une ligne SQL brute en objet User typé (sans mot de passe). */
export const mapRowToUser = (row: UserRow): User => ({
  id: row.id,
  username: row.username,
  email: row.email,
  first_name: row.first_name ?? null,
  last_name: row.last_name ?? null,
  tagline: row.tagline ?? null,
  bio: row.bio ?? null,
  hero_text: row.hero_text ?? null,
  quote_text: row.quote_text ?? null,
  quote_author: row.quote_author ?? null,
  profile_image_id: row.profile_image_id ?? null,
  created_at: toDateString(row.created_at) ?? "",
  updated_at: toDateString(row.updated_at) ?? "",
});

/**
 * Retourne un utilisateur par son ID (sans le mot de passe).
 * Exportée pour réutilisation dans usersAdminModel.ts.
 */
export const findById = async (id: number): Promise<User | null> => {
  const rows = await query<UserRow[]>(
    "SELECT id, username, email, first_name, last_name, tagline, bio, hero_text, quote_text, quote_author, profile_image_id, created_at, updated_at FROM users WHERE id = ?",
    [id]
  );
  return rows[0] ? mapRowToUser(rows[0]) : null;
};

/**
 * Retourne un utilisateur par son email, avec le hash du mot de passe.
 * Utilisé uniquement par authController pour vérifier les credentials au login.
 */
const findByEmail = async (email: string): Promise<(User & { password: string }) | null> => {
  const rows = await query<UserWithPasswordRow[]>(
    "SELECT id, username, email, password, first_name, last_name, tagline, bio, hero_text, quote_text, quote_author, profile_image_id, created_at, updated_at FROM users WHERE email = ?",
    [email]
  );
  if (!rows[0]) return null;
  return { ...mapRowToUser(rows[0]), password: rows[0].password };
};

/**
 * Enregistre le hash du refresh token en base après un login réussi.
 * Remplace un éventuel token précédent (un seul token actif par utilisateur).
 */
const saveRefreshToken = async (userId: number, tokenHash: string): Promise<void> => {
  await pool.query("UPDATE users SET refresh_token_hash = ? WHERE id = ?", [tokenHash, userId]);
};

/** Interface pour lire le hash du refresh token. */
interface RefreshTokenRow extends RowDataPacket {
  refresh_token_hash: string | null;
}

/** Retourne le hash du refresh token stocké en base pour un utilisateur donné. */
const findRefreshTokenHash = async (userId: number): Promise<string | null> => {
  const rows = await query<RefreshTokenRow[]>("SELECT refresh_token_hash FROM users WHERE id = ?", [
    userId,
  ]);
  return rows[0]?.refresh_token_hash ?? null;
};

/** Efface le refresh token (logout) — force une reconnexion au prochain accès. */
const clearRefreshToken = async (userId: number): Promise<void> => {
  await pool.query("UPDATE users SET refresh_token_hash = NULL WHERE id = ?", [userId]);
};

/**
 * Remplace atomiquement l'ancien hash du refresh token par le nouveau (rotation).
 * La clause WHERE sur expectedTokenHash garantit qu'on ne met à jour que si
 * le token actuel correspond bien à ce qu'on attendait (détection de réutilisation).
 * @returns true si la rotation a réussi (affectedRows = 1), false sinon
 */
const rotateRefreshToken = async (
  userId: number,
  expectedTokenHash: string,
  newTokenHash: string
): Promise<boolean> => {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE users SET refresh_token_hash = ? WHERE id = ? AND refresh_token_hash = ?",
    [newTokenHash, userId, expectedTokenHash]
  );
  return result.affectedRows === 1;
};

export default {
  findById,
  findByEmail,
  saveRefreshToken,
  findRefreshTokenHash,
  clearRefreshToken,
  rotateRefreshToken,
};
