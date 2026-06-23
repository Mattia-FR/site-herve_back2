/**
 * Model admin — catégories (CRUD).
 *
 * Rôle : créer, modifier et supprimer les catégories pour le backoffice.
 * Réutilise findById et findAll de categoriesModel.ts.
 *
 * Ordre : création en fin de liste si display_order absent ; insertion à une
 * position donnée avec décalage des voisins ; mise à jour avec algorithme de
 * décalage (transactions MySQL).
 *
 * Note : la suppression d'une catégorie échouera si des images y sont encore
 * associées (contrainte FK ER_NO_REFERENCED_ROW_2 → interceptée dans errorHandler.ts).
 *
 * Table principale : categories
 */
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NotFoundResource } from "../config/errorCodes";
import { NotFoundError } from "../errors/AppError";
import type { Category, CategoryCreateData, CategoryUpdateData } from "../types/categories";
import { buildUpdateQuery } from "../utils/db/buildUpdateQuery";
import { applySlugIfChanged, buildSlug } from "../utils/string/slug";
import publicCategoriesModel, { findById } from "./categoriesModel";
import pool from "./db";

type MaxOrderRow = RowDataPacket & { max_order: number };

/** Calcule la prochaine position en fin de liste. */
const getNextDisplayOrder = async (conn: PoolConnection): Promise<number> => {
  const [rows] = await conn.query<MaxOrderRow[]>(
    "SELECT COALESCE(MAX(display_order), -1) AS max_order FROM categories"
  );
  return (rows[0]?.max_order ?? -1) + 1;
};

/** Décale les catégories à partir d'une position avant insertion. */
const shiftOrdersForInsert = async (conn: PoolConnection, displayOrder: number): Promise<void> => {
  await conn.execute(
    "UPDATE categories SET display_order = display_order + 1 WHERE display_order >= ?",
    [displayOrder]
  );
};

/** Décale les voisins lors d'un changement de position. */
const shiftOrdersForUpdate = async (
  conn: PoolConnection,
  id: number,
  currentOrder: number,
  newOrder: number
): Promise<void> => {
  if (newOrder > currentOrder) {
    await conn.execute(
      `UPDATE categories
       SET display_order = display_order - 1
       WHERE id != ? AND display_order > ? AND display_order <= ?`,
      [id, currentOrder, newOrder]
    );
    return;
  }

  if (newOrder < currentOrder) {
    await conn.execute(
      `UPDATE categories
       SET display_order = display_order + 1
       WHERE id != ? AND display_order >= ? AND display_order < ?`,
      [id, newOrder, currentOrder]
    );
  }
};

/**
 * Crée une catégorie.
 * Sans display_order : placée en fin de liste (MAX + 1).
 * Avec display_order : les catégories à partir de cette position sont décalées.
 */
const create = async (data: CategoryCreateData): Promise<Category> => {
  const slug = buildSlug(data.name);
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const displayOrder =
      data.display_order === undefined ? await getNextDisplayOrder(conn) : data.display_order;

    if (data.display_order !== undefined) {
      await shiftOrdersForInsert(conn, displayOrder);
    }

    const [result] = await conn.execute<ResultSetHeader>(
      "INSERT INTO categories (name, slug, display_order) VALUES (?, ?, ?)",
      [data.name, slug, displayOrder]
    );

    await conn.commit();

    const created = await findById(result.insertId);
    if (!created) throw new NotFoundError(NotFoundResource.CATEGORY);
    return created;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Met à jour une catégorie.
 * Régénère le slug si le nom a changé (applySlugIfChanged).
 * Si display_order change, applique le décalage des voisins en transaction.
 */
const update = async (id: number, data: CategoryUpdateData): Promise<Category | null> => {
  const cat = await findById(id);
  if (!cat) return null;

  const newOrder = data.display_order;
  const orderChanged = newOrder !== undefined && newOrder !== cat.display_order;

  const payload = applySlugIfChanged({ ...data }, data.name, cat.name) as CategoryUpdateData;

  if (!orderChanged) {
    const q = buildUpdateQuery("categories", payload);
    if (!q) return cat;

    await pool.query<ResultSetHeader>(q.sql, [...q.values, id]);
    return findById(id);
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
    await shiftOrdersForUpdate(conn, id, cat.display_order, newOrder);

    const q = buildUpdateQuery("categories", payload);
    if (q) {
      await conn.query<ResultSetHeader>(q.sql, [...q.values, id]);
    } else {
      await conn.query<ResultSetHeader>("UPDATE categories SET display_order = ? WHERE id = ?", [
        newOrder,
        id,
      ]);
    }

    await conn.commit();
    return findById(id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
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
