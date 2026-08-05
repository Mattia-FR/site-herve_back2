/**
 * Model admin — catégories (CRUD).
 *
 * Rôle : créer, modifier et supprimer les catégories pour le backoffice.
 * Réutilise findById et findAll de categoriesModel.ts.
 *
 * Ordre : création en fin de liste si display_order absent ; insertion à une
 * position donnée avec décalage des voisins ; mise à jour avec algorithme de
 * décalage (transactions MySQL + SELECT FOR UPDATE).
 *
 * Note : la suppression d'une catégorie est bloquée si des images lui sont
 * encore assignées (check applicatif → 400 INVALID_REFERENCE), sous verrou
 * de ligne pour éviter une course COUNT/DELETE.
 * Avec cover_image_id ON DELETE SET NULL, la FK est nettoyée automatiquement
 * si l'image de couverture est supprimée.
 *
 * Table principale : categories
 */
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { DEFAULT_ERROR_MESSAGES, ErrorCode, NotFoundResource } from "../config/errorCodes";
import { BadRequestError, NotFoundError } from "../errors/AppError";
import type { Category, CategoryCreateData, CategoryUpdateData } from "../types/categories";
import { buildUpdateQuery } from "../utils/db/buildUpdateQuery";
import { applySlugIfChanged, buildSlug } from "../utils/string/slug";
import publicCategoriesModel, { findById } from "./categoriesModel";
import pool, { withTransaction } from "./db";

type MaxOrderRow = RowDataPacket & { max_order: number };
type CountRow = RowDataPacket & { cnt: number };
type CategoryLockRow = RowDataPacket & { id: number; name: string; display_order: number };
type CategoryIdRow = RowDataPacket & { id: number };

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

  const insertId = await withTransaction(async (conn) => {
    const displayOrder =
      data.display_order === undefined ? await getNextDisplayOrder(conn) : data.display_order;

    if (data.display_order !== undefined) {
      await shiftOrdersForInsert(conn, displayOrder);
    }

    const [result] = await conn.execute<ResultSetHeader>(
      "INSERT INTO categories (name, slug, display_order) VALUES (?, ?, ?)",
      [data.name, slug, displayOrder]
    );

    return result.insertId;
  });

  const created = await findById(insertId);
  if (!created) throw new NotFoundError(NotFoundResource.CATEGORY);
  return created;
};

/**
 * Met à jour une catégorie.
 * Régénère le slug si le nom a changé (applySlugIfChanged).
 * Si display_order change, applique le décalage des voisins en transaction
 * après verrouillage de la ligne (SELECT FOR UPDATE).
 */
const update = async (id: number, data: CategoryUpdateData): Promise<Category | null> => {
  const newOrder = data.display_order;

  // Pas de réordonnancement : UPDATE simple hors transaction
  if (newOrder === undefined) {
    const cat = await findById(id);
    if (!cat) return null;

    const payload = applySlugIfChanged({ ...data }, data.name, cat.name) as CategoryUpdateData;
    const q = buildUpdateQuery("categories", payload);
    if (!q) return cat;

    await pool.query<ResultSetHeader>(q.sql, [...q.values, id]);
    return findById(id);
  }

  const updated = await withTransaction(async (conn) => {
    const [rows] = await conn.query<CategoryLockRow[]>(
      "SELECT id, name, display_order FROM categories WHERE id = ? FOR UPDATE",
      [id]
    );
    const locked = rows[0];
    if (!locked) return false;

    const orderChanged = newOrder !== locked.display_order;
    const payload = applySlugIfChanged({ ...data }, data.name, locked.name) as CategoryUpdateData;

    if (orderChanged) {
      await shiftOrdersForUpdate(conn, id, locked.display_order, newOrder);
    }

    const q = buildUpdateQuery("categories", payload);
    if (q) {
      await conn.query<ResultSetHeader>(q.sql, [...q.values, id]);
    } else if (orderChanged) {
      await conn.query<ResultSetHeader>("UPDATE categories SET display_order = ? WHERE id = ?", [
        newOrder,
        id,
      ]);
    }

    return true;
  });

  if (!updated) return null;
  return findById(id);
};

/**
 * Supprime une catégorie par son ID.
 * Refusé si des images lui sont encore assignées (évite les images orphelines).
 * Le COUNT et le DELETE sont atomiques sous verrou de ligne.
 * @returns true si supprimée, false si introuvable
 */
const deleteById = async (id: number): Promise<boolean> => {
  return withTransaction(async (conn) => {
    const [catRows] = await conn.query<CategoryIdRow[]>(
      "SELECT id FROM categories WHERE id = ? FOR UPDATE",
      [id]
    );
    if (!catRows[0]) return false;

    const [countRows] = await conn.query<CountRow[]>(
      "SELECT COUNT(*) AS cnt FROM images WHERE category_id = ? AND is_in_gallery = 1",
      [id]
    );
    const count = Number(countRows[0]?.cnt ?? 0);

    if (count > 0) {
      throw new BadRequestError(
        DEFAULT_ERROR_MESSAGES[ErrorCode.INVALID_REFERENCE],
        ErrorCode.INVALID_REFERENCE
      );
    }

    const [result] = await conn.query<ResultSetHeader>("DELETE FROM categories WHERE id = ?", [id]);
    return result.affectedRows > 0;
  });
};

/**
 * Définit ou retire l'image de couverture d'une catégorie.
 * imageId = null → remet la couverture automatique (première image par display_order).
 */
const setCover = async (categoryId: number, imageId: number | null): Promise<Category | null> => {
  const cat = await findById(categoryId);
  if (!cat) return null;

  await pool.query<ResultSetHeader>("UPDATE categories SET cover_image_id = ? WHERE id = ?", [
    imageId,
    categoryId,
  ]);

  return findById(categoryId);
};

/** Délègue à publicCategoriesModel.findAll (même requête pour admin et public). */
const findAll = async (): Promise<Category[]> => publicCategoriesModel.findAll();

export default { findAll, findById, create, update, deleteById, setCover };
