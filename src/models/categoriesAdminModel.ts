/**
 * Model admin — catégories (CRUD).
 *
 * Rôle : créer, modifier et supprimer les catégories pour le backoffice.
 * Réutilise findById et findAll de categoriesModel.ts.
 *
 * Note : la suppression d'une catégorie échouera si des images y sont encore
 * associées (contrainte FK ER_NO_REFERENCED_ROW_2 → interceptée dans errorHandler.ts).
 *
 * Table principale : categories
 */
import type { ResultSetHeader } from "mysql2";
import { NotFoundResource } from "../config/errorCodes";
import { NotFoundError } from "../errors/AppError";
import type { Category, CategoryCreateData, CategoryUpdateData } from "../types/categories";
import { buildUpdateQuery } from "../utils/db/buildUpdateQuery";
import { applySlugIfChanged, buildSlug } from "../utils/string/slug";
import publicCategoriesModel, { findById } from "./categoriesModel";
import pool from "./db";

/**
 * Crée une catégorie.
 * Le slug est généré automatiquement depuis le nom (slugify).
 */
const create = async (data: CategoryCreateData): Promise<Category> => {
  const slug = buildSlug(data.name);
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO categories (name, slug, display_order) VALUES (?, ?, ?)",
    [data.name, slug, data.display_order ?? 0]
  );
  const created = await findById(result.insertId);
  if (!created) throw new NotFoundError(NotFoundResource.CATEGORY);
  return created;
};

/**
 * Met à jour une catégorie.
 * Régénère le slug si le nom a changé (applySlugIfChanged).
 * Si aucun champ n'a changé, retourne la catégorie existante sans requête UPDATE.
 */
const update = async (id: number, data: CategoryUpdateData): Promise<Category | null> => {
  const cat = await findById(id);
  if (!cat) return null;

  // Ajoute `slug` dans le payload si le nom a changé
  const payload = applySlugIfChanged({ ...data }, data.name, cat.name);
  const q = buildUpdateQuery("categories", payload);
  if (!q) return cat; // Aucun champ à mettre à jour

  await pool.query<ResultSetHeader>(q.sql, [...q.values, id]);
  return findById(id);
};

/**
 * Supprime une catégorie par son ID.
 * @returns true si supprimée, false si introuvable
 */
const deleteById = async (id: number): Promise<boolean> => {
  const [result] = await pool.query<ResultSetHeader>("DELETE FROM categories WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

/** Délègue à publicCategoriesModel.findAll (même requête pour admin et public). */
const findAll = async (): Promise<Category[]> => publicCategoriesModel.findAll();

export default { findAll, create, update, deleteById };
