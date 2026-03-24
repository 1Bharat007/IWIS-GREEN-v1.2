import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { handleChat } from "../controllers/chat.controller";

const router = Router();

router.post("/", protect, handleChat);

export default router;
