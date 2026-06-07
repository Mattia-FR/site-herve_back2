import type { Request, Response } from "express";
import type { z } from "zod";
import { env } from "../config/env";
import logger from "../config/logger";
import { asyncHandler } from "../utils/asyncHandler";
import { getValidatedBody } from "../utils/http/requestHelpers";
import type { clientLogSchema } from "../validation/clientLogs.schemas";

type ClientLogBody = z.infer<typeof clientLogSchema>;

const create = asyncHandler(async (req: Request, res: Response) => {
  if (!env.CLIENT_LOG_ENABLED) {
    res.status(204).end();
    return;
  }

  const body = getValidatedBody<ClientLogBody>(req);
  logger.warn({
    kind: "client",
    requestId: req.requestId,
    ...body,
  });

  res.status(204).end();
});

export { create };
