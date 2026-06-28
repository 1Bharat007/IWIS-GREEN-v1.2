import { Router } from "express";
import rateLimit from "express-rate-limit";
import { signup, login, firebaseLogin, forgotPassword, resetPassword, getMe, updateProfile, sendOtp, verifyOtp } from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { message: "Too many requests, please try again later." }
});

const otpIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Limit each IP to 30 requests per hour
  message: { message: "Too many OTP requests from this IP. Please try again later." }
});

const router = Router();

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/firebase-login", authLimiter, firebaseLogin);
router.post("/send-otp", otpIpLimiter, sendOtp);
router.post("/verify-otp", authLimiter, verifyOtp);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

// Protected profile routes
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);

export default router;
