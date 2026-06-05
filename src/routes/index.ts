import { Router } from "express";
import adminRouter from "./adminRouter";
import authRouter from "./authRouter";
import articlesRouter from "./articlesRouter";
import artistRouter from "./artistRouter";
import categoriesRouter from "./categoriesRouter";
import guestbookRouter from "./guestbookRouter";
import imagesRouter from "./imagesRouter";
import messagesRouter from "./messagesRouter";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRouter);
router.use("/artist", artistRouter);
router.use("/articles", articlesRouter);
router.use("/images", imagesRouter);
router.use("/categories", categoriesRouter);
router.use("/messages", messagesRouter);
router.use("/guestbook", guestbookRouter);
router.use("/admin", adminRouter);

export default router;
