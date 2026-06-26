import { Router } from "express";
import { getNotifications, markAsRead, markAllAsRead } from "../controllers/notification.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect);

router.get("/", getNotifications);
router.put("/read-all", markAllAsRead);
router.put("/:id/read", markAsRead);

export default router;
