/**
 * Controller admin — gestion des articles.
 *
 * Rôle : CRUD complet des articles (brouillons et publiés) et upload des images
 * associées (contenu riche + image à la une).
 *
 * Routes correspondantes (voir articlesAdminRouter.ts, préfixe /api/admin/articles) :
 *   GET    /             → liste paginée de tous les articles
 *   GET    /slug/:slug   → article par slug (pour l'éditeur)
 *   GET    /:id          → article par ID
 *   POST   /             → créer un article
 *   PUT    /:id          → modifier un article
 *   DELETE /:id          → supprimer un article
 *   POST   /content-images  → uploader une image insérée dans le contenu
 *   POST   /featured-image  → uploader l'image à la une
 *
 * Note sur published_at : la date de première publication est définie
 * automatiquement lors du passage à "published" et n'est jamais écrasée ensuite.
 */
import type { Request, Response } from "express";
import type { z } from "zod";
import { NotFoundResource } from "../config/errorCodes";
import {
  UPLOADS_CONTENT_VARIANTS_DIR,
  UPLOADS_FEATURED_VARIANTS_DIR,
} from "../config/uploadsPaths";
import { NotFoundError } from "../errors/AppError";
import articlesAdminModel from "../models/articlesAdminModel";
import imagesAdminModel from "../models/imagesAdminModel";
import type { ArticleUpdateData } from "../types/articles";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getAuthUserId,
  getUploadedFile,
  getValidatedBody,
  getValidatedId,
  getValidatedParams,
  getValidatedQuery,
} from "../utils/http/requestHelpers";
import { processUploadedImage } from "../utils/image/processUploadedImage";
import { toMySQLDatetime } from "../utils/string/dateHelpers";
import type {
  articleCreateSchema,
  articleUpdateSchema,
  slugParamSchema,
} from "../validation/articles.schemas";
import type { adminPaginationQuerySchema } from "../validation/pagination.schemas";

/**
 * GET /api/admin/articles
 * Liste paginée de tous les articles (publiés + brouillons).
 */
const browseAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getValidatedQuery<z.infer<typeof adminPaginationQuerySchema>>(req);
  const result = await articlesAdminModel.findPaginated(page, limit);
  res.status(200).json(result);
});

/**
 * GET /api/admin/articles/:id
 * Retourne un article par son ID, tous statuts confondus.
 */
const readById = asyncHandler(async (req: Request, res: Response) => {
  const article = await articlesAdminModel.findByIdForAdmin(getValidatedId(req));
  if (!article) throw new NotFoundError(NotFoundResource.ARTICLE);
  res.status(200).json(article);
});

/**
 * GET /api/admin/articles/slug/:slug
 * Retourne un article par son slug, tous statuts confondus.
 * Utilisé par l'éditeur pour charger un article via son URL publique.
 */
const readBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = getValidatedParams<z.infer<typeof slugParamSchema>>(req);
  const article = await articlesAdminModel.findBySlugForAdmin(slug);
  if (!article) throw new NotFoundError(NotFoundResource.ARTICLE);
  res.status(200).json(article);
});

/**
 * POST /api/admin/articles
 * Crée un nouvel article. Définit published_at si le statut est "published".
 * Le slug est généré automatiquement par le model depuis le titre.
 */
const add = asyncHandler(async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const { title, content, status, featured_image_id } =
    getValidatedBody<z.infer<typeof articleCreateSchema>>(req);

  // published_at est défini à la date de création si l'article est directement publié
  const published_at = status === "published" ? toMySQLDatetime(new Date()) : null;

  const article = await articlesAdminModel.create({
    title,
    content,
    status,
    featured_image_id,
    user_id: userId,
    published_at,
  });
  res.status(201).json(article);
});

/**
 * PUT /api/admin/articles/:id
 * Met à jour un article existant.
 * Si l'article passe de "draft" à "published", published_at est défini maintenant
 * (mais n'est jamais réinitialisé si l'article est republié après avoir été dépublié).
 */
const edit = asyncHandler(async (req: Request, res: Response) => {
  const id = getValidatedId(req);
  const data: ArticleUpdateData = {
    ...getValidatedBody<z.infer<typeof articleUpdateSchema>>(req),
  };

  // Définir published_at uniquement lors du premier passage à "published"
  if (data.status === "published") {
    const existing = await articlesAdminModel.findByIdForAdmin(id);
    if (existing && existing.status !== "published") {
      data.published_at = toMySQLDatetime(new Date());
    }
  }

  const article = await articlesAdminModel.update(id, data);
  if (!article) throw new NotFoundError(NotFoundResource.ARTICLE);
  res.status(200).json(article);
});

/**
 * DELETE /api/admin/articles/:id
 * Supprime un article. Retourne 204 si supprimé, 404 si introuvable.
 */
const destroy = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await articlesAdminModel.deleteById(getValidatedId(req));
  if (!deleted) throw new NotFoundError(NotFoundResource.ARTICLE);
  res.sendStatus(204);
});

/**
 * POST /api/admin/articles/content-images
 * Traite l'image uploadée par Multer avec Sharp (génère les variantes WebP),
 * et retourne uniquement l'URL de la variante md (utilisée dans l'éditeur WYSIWYG).
 * L'image n'est pas enregistrée en base de données (image "inline" dans le contenu).
 */
const uploadContentImage = asyncHandler(async (req: Request, res: Response) => {
  const file = getUploadedFile(req);
  const variants = await processUploadedImage(file.path, UPLOADS_CONTENT_VARIANTS_DIR);
  res.status(201).json({ url: variants.md });
});

/**
 * POST /api/admin/articles/featured-image
 * Traite l'image à la une : génère les variantes WebP, l'enregistre en base
 * (table images, is_in_gallery = false), et retourne son ID + URL md.
 * L'ID est utilisé pour lier l'image à un article via featured_image_id.
 */
const uploadFeaturedImage = asyncHandler(async (req: Request, res: Response) => {
  const file = getUploadedFile(req);
  const userId = getAuthUserId(req);

  const variants = await processUploadedImage(file.path, UPLOADS_FEATURED_VARIANTS_DIR);

  // Créer l'entrée image en base (sans galerie) pour avoir un ID référençable
  const image = await imagesAdminModel.create({
    path: `/uploads/featured/${file.filename}`,
    variants,
    user_id: userId,
    is_in_gallery: false,
  });

  res.status(201).json({ id: image.id, url: variants.md });
});

export {
  add,
  browseAll,
  destroy,
  edit,
  readById,
  readBySlug,
  uploadContentImage,
  uploadFeaturedImage,
};
