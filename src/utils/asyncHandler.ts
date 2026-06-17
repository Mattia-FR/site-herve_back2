/**
 * Wrapper pour les handlers asynchrones Express.
 *
 * Rôle : intercepter les rejets de Promise dans les handlers async et les
 * transmettre à `next(err)` pour qu'ils soient traités par errorHandler.ts.
 *
 * Sans ce wrapper, une Promise rejetée dans un handler async passerait
 * inaperçue (Express 4 ne gère pas nativement les erreurs async).
 *
 * Usage :
 *   router.get("/", asyncHandler(async (req, res) => {
 *     const data = await someQuery(); // si ça lance, errorHandler prend le relais
 *     res.json(data);
 *   }));
 */
import type { NextFunction, Request, Response } from "express";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const asyncHandler =
  (fn: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
