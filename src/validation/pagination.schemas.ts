import { z } from "zod";

export function createPaginationQuerySchema(opts: {
  defaultLimit: number;
  maxLimit: number;
}) {
  return z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(opts.maxLimit)
      .default(opts.defaultLimit),
  });
}

export const adminPaginationQuerySchema = createPaginationQuerySchema({
  defaultLimit: 20,
  maxLimit: 50,
});
