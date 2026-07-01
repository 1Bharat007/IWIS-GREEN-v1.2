import { Router } from "express";
import { signup, login, firebaseLogin, forgotPassword, resetPassword, getMe, updateProfile, sendOtp, verifyOtp } from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";
import { strictLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

router.post("/signup", strictLimiter, signup);
router.post("/login", strictLimiter, login);
router.post("/firebase-login", strictLimiter, firebaseLogin);
router.post("/send-otp", strictLimiter, sendOtp);
router.post("/verify-otp", strictLimiter, verifyOtp);
router.post("/forgot-password", strictLimiter, forgotPassword);
router.post("/reset-password", strictLimiter, resetPassword);

// Protected profile routes
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);

export default router;
