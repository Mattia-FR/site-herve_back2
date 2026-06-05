import type { Request } from "express";

export function parseIdParam(req: Request, param = "id"): number | null {
  const raw = req.params[param];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return null;
  return parsed;
}
