import type { ResultSetHeader } from "mysql2";
import type { Category, CategoryCreateData, CategoryUpdateData } from "../types/categories";
import { NotFoundError } from "../errors/AppError";
import { buildUpdateQuery } from "../utils/db/buildUpdateQuery";
import { applySlugIfChanged, buildSlug } from "../utils/string/slug";
import publicCategoriesModel, { findById } from "./categoriesModel";
import pool from "./db";

const create = async (data: CategoryCreateData): Promise<Category> => {
  const slug = buildSlug(data.name);
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO categories (name, slug, display_order) VALUES (?, ?, ?)",
    [data.name, slug, data.display_order ?? 0],
  );
  const created = await findById(result.insertId);
  if (!created) throw new NotFoundError("Catégorie");
  return created;
};

const update = async (id: number, data: CategoryUpdateData): Promise<Category | null> => {
  const cat = await findById(id);
  if (!cat) return null;

  const payload = applySlugIfChanged({ ...data }, data.name, cat.name);
  const q = buildUpdateQuery("categories", payload);
  if (!q) return cat;

  await pool.query<ResultSetHeader>(q.sql, [...q.values, id]);
  return findById(id);
};

const deleteById = async (id: number): Promise<boolean> => {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM categories WHERE id = ?",
    [id],
  );
  return result.affectedRows > 0;
};

const findAll = async (): Promise<Category[]> => publicCategoriesModel.findAll();

export default { findAll, create, update, deleteById };
