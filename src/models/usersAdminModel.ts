/**
 * Model admin — mise à jour du profil utilisateur.
 *
 * Rôle : mettre à jour les informations du profil de l'utilisateur connecté
 * (nom, tagline, bio, photo de profil, mot de passe haché).
 * La lecture du profil est déléguée à usersModel.findById.
 *
 * Utilise buildUpdateQuery pour construire dynamiquement la clause SET
 * en ne mettant à jour que les champs effectivement fournis.
 *
 * Table principale : users
 */
import type { ResultSetHeader } from "mysql2";
import type { User, UserUpdateData } from "../types/users";
import { buildUpdateQuery } from "../utils/db/buildUpdateQuery";
import pool from "./db";
import { findById } from "./usersModel";

/**
 * Met à jour les données du profil d'un utilisateur.
 * Les champs undefined dans data ne sont pas inclus dans la requête UPDATE.
 * Si aucun champ n'a changé, retourne l'utilisateur existant sans requête UPDATE.
 * @returns L'utilisateur mis à jour, ou null s'il n'existe pas
 */
const update = async (id: number, data: UserUpdateData): Promise<User | null> => {
  const user = await findById(id);
  if (!user) return null;

  const q = buildUpdateQuery("users", data);
  if (!q) return user; // Aucun champ à mettre à jour

  await pool.query<ResultSetHeader>(q.sql, [...q.values, id]);
  return findById(id);
};

export default { update };
