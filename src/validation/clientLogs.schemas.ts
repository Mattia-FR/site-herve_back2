/**
 * Schémas Zod de validation pour les rapports d'erreurs client.
 */
import { z } from "zod";

/** Body POST /api/client-logs (remontée d'erreurs navigateur). */
export const clientLogSchema = z.object({
  message: z.string().min(1).max(500),
  stack: z.string().max(4000).optional(),
  url: z.string().max(2000).optional(),
  release: z.string().max(100).optional(),
  name: z.string().max(200).optional(),
  apiCode: z.string().max(100).optional(),
  status: z.number().int().optional(),
  context: z.record(z.string(), z.string()).optional(),
});
