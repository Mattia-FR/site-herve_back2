/**
 * Middlewares de validation des entrées via Zod.
 *
 * Rôle : valider et parser les données entrantes (body, query, params) avant
 * qu'elles n'atteignent les controllers. En cas d'échec, une réponse 400 est
 * retournée avec le détail des erreurs par champ.
 *
 * Les données validées sont stockées dans des propriétés étendues de la requête
 * (voir express.d.ts) : req.validatedBody, req.validatedQuery, req.validatedParams, req.validatedId.
 * Les controllers ne doivent utiliser QUE ces propriétés, jamais req.body directement.
 *
 * Fonctions exportées :
 *   - validateBody(schema)   → valide req.body
 *   - validateQuery(schema)  → valide req.query
 *   - validateParams(schema) → valide req.params
 *   - requireValidId(param)  → parse et valide un paramètre d'URL comme entier positif
 */
import type { NextFunction, Request, Response } from "express";
import type { ZodError } from "zod";
import { DEFAULT_ERROR_MESSAGES, ErrorCode } from "../config/errorCodes";
import { BadRequestError, ValidationFailedError } from "../errors/AppError";
import { parseIdParam } from "../utils/db/parseParams";
import { zodToValidationDetails } from "../utils/http/zodToValidationDetails";
import { sendError } from "../utils/sendError";

/** Interface minimale pour accepter n'importe quel schéma Zod (ou compatible). */
interface SchemaWithSafeParse {
  safeParse(data: unknown): { success: true; data: unknown } | { success: false; error: ZodError };
}

/**
 * Valide req.body avec le schéma fourni.
 * Stocke le résultat parsé dans req.validatedBody.
 */
export function validateBody(schema: SchemaWithSafeParse) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      sendError(res, new ValidationFailedError(zodToValidationDetails(result.error)));
      return;
    }
    req.validatedBody = result.data;
    next();
  };
}

/**
 * Valide req.query avec le schéma fourni.
 * Stocke le résultat parsé dans req.validatedQuery.
 */
export function validateQuery(schema: SchemaWithSafeParse) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      sendError(res, new ValidationFailedError(zodToValidationDetails(result.error)));
      return;
    }
    req.validatedQuery = result.data;
    next();
  };
}

/**
 * Valide req.params avec le schéma fourni.
 * Stocke le résultat parsé dans req.validatedParams.
 */
export function validateParams(schema: SchemaWithSafeParse) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      sendError(res, new ValidationFailedError(zodToValidationDetails(result.error)));
      return;
    }
    req.validatedParams = result.data;
    next();
  };
}

/**
 * Parse et valide un paramètre d'URL (par défaut "id") comme entier positif.
 * Stocke l'ID validé dans req.validatedId.
 * @param param - Nom du paramètre d'URL à valider (défaut : "id")
 */
export function requireValidId(param = "id") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = parseIdParam(req, param);
    if (id === null) {
      sendError(
        res,
        new BadRequestError(DEFAULT_ERROR_MESSAGES[ErrorCode.INVALID_ID], ErrorCode.INVALID_ID)
      );
      return;
    }
    req.validatedId = id;
    next();
  };
}
