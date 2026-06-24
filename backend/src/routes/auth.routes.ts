import { Router } from "express";
import { signup, login, forgotPassword, resetPassword, getMe, updateProfile } from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected profile routes
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);

export default router;
