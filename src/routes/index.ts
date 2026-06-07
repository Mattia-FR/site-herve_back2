import { Router } from "express";
import pool from "../models/db";
import adminRouter from "./adminRouter";
import authRouter from "./authRouter";
import articlesRouter from "./articlesRouter";
import artistRouter from "./artistRouter";
import categoriesRouter from "./categoriesRouter";
import clientLogsRouter from "./clientLogsRouter";
import guestbookRouter from "./guestbookRouter";
import imagesRouter from "./imagesRouter";
import messagesRouter from "./messagesRouter";

const router = Router();

router.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "ok" });
  } catch {
    res.status(503).json({ status: "degraded", db: "error" });
  }
});

router.use("/client-logs", clientLogsRouter);
router.use("/auth", authRouter);
router.use("/artist", artistRouter);
router.use("/articles", articlesRouter);
router.use("/images", imagesRouter);
router.use("/categories", categoriesRouter);
router.use("/messages", messagesRouter);
router.use("/guestbook", guestbookRouter);
router.use("/admin", adminRouter);

export default router;
