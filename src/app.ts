import cors from "cors";
import express from "express";
import { errorHandler } from "./middlewares/errorHandler";
import { httpLogMiddleware } from "./middlewares/httpLog";
import { notFound } from "./middlewares/notFound";
import { requestIdMiddleware } from "./middlewares/requestId";
import router from "./routes";

export const app = express();

app.use(requestIdMiddleware);
app.use(httpLogMiddleware);
app.use(cors());
app.use(express.json());
app.use("/api", router);

// Root `index.ts` may register routes after this module loads; defer catch-all middleware.
setImmediate(() => {
  app.use(notFound);
  app.use(errorHandler);
});

export default app;
