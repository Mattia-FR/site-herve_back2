import { Router } from "express";
import articlesAdminRouter from "./articlesAdminRouter";
import categoriesAdminRouter from "./categoriesAdminRouter";
import guestbookAdminRouter from "./guestbookAdminRouter";
import imagesAdminRouter from "./imagesAdminRouter";
import messagesAdminRouter from "./messagesAdminRouter";
import usersAdminRouter from "./usersAdminRouter";

const router = Router();

router.use("/articles", articlesAdminRouter);
router.use("/users", usersAdminRouter);
router.use("/images", imagesAdminRouter);
router.use("/categories", categoriesAdminRouter);
router.use("/messages", messagesAdminRouter);
router.use("/guestbook", guestbookAdminRouter);

export default router;
