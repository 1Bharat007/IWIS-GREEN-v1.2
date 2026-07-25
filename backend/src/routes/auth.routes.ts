import { Router } from "express";
import { getMe, updateProfile, setRole } from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// Protected profile & auth routes
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);
router.post("/set-role", protect, setRole);

export default router;
