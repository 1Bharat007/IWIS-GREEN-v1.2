import { AppError, ValidationError, AuthenticationError, AuthorizationError, DatabaseError } from "../utils/errors";
import { sendSuccess } from "../utils/apiResponse.util";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { z } from "zod";
import { getDB } from "../db";
import { getFirebaseAuth } from "../utils/firebase.util";
import { emailService } from "../services/email.service";
import { smsService } from "../services/sms.service";

const JWT_SECRET = process.env.JWT_SECRET || "iwis_super_secret_key";

// ─── SIGN UP ─────────────────────────────────────────────────────────────────
const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["citizen", "recycler"]).default("citizen"),
  phone: z.string().optional(),
  displayName: z.string().min(2, "Name is required"),
  preferredLanguage: z.enum(["English", "हिन्दी", "Dogri"]).default("English"),
  otp: z.string().optional()
});

export const signup = async (req: Request, res: Response) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { email, password, role, phone, displayName, preferredLanguage, otp } = parsed.data;

    const db = await getDB();

    const isOtpEnabled = process.env.ENABLE_PHONE_OTP !== "false";

    if (isOtpEnabled) {
      if (!phone || !otp) {
        throw new ValidationError("Phone and OTP are required");
      }

      // Verify OTP
      const otpRecord = await db.get("SELECT * FROM otp_codes WHERE phone = ?", [phone]);
      if (!otpRecord) {
        throw new ValidationError("Invalid or expired OTP");
      }
      
      if (otpRecord.attempts >= 5) {
        throw new AppError("Too many failed attempts. Please request a new OTP.", 429, "RATE_LIMIT");
      }

      if (new Date(otpRecord.expiresAt) < new Date()) {
        throw new ValidationError("OTP has expired");
      }

      const isValidOtp = await bcrypt.compare(otp, otpRecord.otp);
      if (!isValidOtp) {
        await db.run("UPDATE otp_codes SET attempts = attempts + 1 WHERE phone = ?", [phone]);
        throw new ValidationError("Invalid OTP");
      }
    }

    // Check existing
    const existingQuery = isOtpEnabled && phone 
      ? "SELECT * FROM users WHERE email = ? OR phone = ?"
      : "SELECT * FROM users WHERE email = ?";
    
    const existingParams = isOtpEnabled && phone ? [email, phone] : [email];
    
    const existing = await db.get(existingQuery, existingParams);
    
    if (existing) {
      throw new ValidationError("User with this email or phone already exists");
    }

    const hashed = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();

    await db.run(
      "INSERT INTO users (id, email, password, role, phone, displayName, preferredLanguage, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, email, hashed, role, phone || null, displayName, preferredLanguage, new Date().toISOString()]
    );

    if (isOtpEnabled && phone) {
      // Cleanup OTP
      await db.run("DELETE FROM otp_codes WHERE phone = ?", [phone]);
    }

    const token = jwt.sign({ id, role }, JWT_SECRET, { expiresIn: "7d" });
    sendSuccess(res, { token, role });
  } catch (err) {
    console.error(err);
    throw new DatabaseError("Signup failed");
  }
};

// ─── OTP ENDPOINTS ───────────────────────────────────────────────────────────
const otpRequestSchema = z.object({
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Valid email address").optional()
});

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const parsed = otpRequestSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const { phone, email } = parsed.data;
    const db = await getDB();
    
    let targetEmail = email;
    if (!targetEmail) {
      const user = await db.get("SELECT email FROM users WHERE phone = ?", phone);
      if (user && user.email) {
        targetEmail = user.email;
      }
    }
    
    // Check phone-level rate limits
    const existingOTP = await db.get("SELECT * FROM otp_codes WHERE phone = ?", phone);
    const now = new Date();
    
    let hourlyCount = 1;
    if (existingOTP && existingOTP.lastRequestedAt) {
      const lastRequest = new Date(existingOTP.lastRequestedAt);
      const diffMs = now.getTime() - lastRequest.getTime();
      
      // 1 per 60 seconds
      if (diffMs < 60 * 1000) {
        throw new AppError("Please wait 60 seconds before requesting another OTP.", 429, "RATE_LIMIT");
      }
      
      // Reset hourly count if older than 1 hour, otherwise increment
      if (diffMs > 60 * 60 * 1000) {
        hourlyCount = 1;
      } else {
        hourlyCount = (existingOTP.hourlyCount || 0) + 1;
      }
      
      // 5 per hour
      if (hourlyCount > 5) {
        throw new AppError("You have exceeded the maximum number of OTP requests (5 per hour). Please try again later.", 429, "RATE_LIMIT");
      }
    }

    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit random
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    const hashedOtp = await bcrypt.hash(rawOtp, 10);

    await db.run(
      "INSERT INTO otp_codes (phone, otp, expiresAt, lastRequestedAt, hourlyCount, attempts) VALUES (?, ?, ?, ?, ?, 0) ON CONFLICT(phone) DO UPDATE SET otp = excluded.otp, expiresAt = excluded.expiresAt, lastRequestedAt = excluded.lastRequestedAt, hourlyCount = excluded.hourlyCount, attempts = 0",
      [phone, hashedOtp, expiresAt, now.toISOString(), hourlyCount]
    );

    // Send OTP concurrently
    const tasks = [];
    tasks.push(smsService.sendOtpSms(phone, rawOtp).then(res => ({ type: 'sms', success: res })));
    if (targetEmail) {
      // Don't catch the email service promise here. If it throws, it will reject the promise in the allSettled array.
      tasks.push(emailService.sendOtpEmail(targetEmail, rawOtp).then(res => ({ type: 'email', success: res })));
    }

    const results = await Promise.allSettled(tasks);
    
    let emailSent = false;
    let smsSent = false;
    let emailError: string | null = null;

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        if (result.value.type === 'email' && result.value.success) emailSent = true;
        if (result.value.type === 'sms' && result.value.success) smsSent = true;
      } else if (result.status === 'rejected') {
        emailError = result.reason?.message || "Failed to deliver email OTP.";
      }
    });

    if (!emailSent && !smsSent) {
      if (emailError) {
        throw new DatabaseError(`SMTP Error: ${emailError}`);
      }
      throw new DatabaseError("Failed to deliver OTP via any channel. Please try again later.");
    }

    let statusMessage = "OTP sent successfully";
    if (emailSent && smsSent) {
      statusMessage = "OTP sent via Email and SMS.";
    } else if (emailSent && !smsSent) {
      statusMessage = "OTP sent via Email. SMS is disabled or temporarily unavailable.";
    } else if (!emailSent && smsSent) {
      statusMessage = "OTP sent via SMS. Email is temporarily unavailable.";
    }

    sendSuccess(res, { message: statusMessage, emailSent, smsSent });
  } catch (err) {
    console.error("[sendOtp Error]", err);
    throw new DatabaseError("Failed to send OTP");
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) throw new ValidationError("Phone and OTP required");

    const db = await getDB();
    const otpRecord = await db.get("SELECT * FROM otp_codes WHERE phone = ?", [phone]);
    
    if (!otpRecord) throw new ValidationError("Invalid or expired OTP");
    if (otpRecord.attempts >= 5) throw new AppError("Too many failed attempts. Please request a new OTP.", 429, "RATE_LIMIT");
    if (new Date(otpRecord.expiresAt) < new Date()) throw new ValidationError("OTP has expired");

    const isValidOtp = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValidOtp) {
      await db.run("UPDATE otp_codes SET attempts = attempts + 1 WHERE phone = ?", [phone]);
      throw new ValidationError("Invalid OTP");
    }

    sendSuccess(res, { message: "OTP verified successfully" });
  } catch (err) {
    throw new DatabaseError("Failed to verify OTP");
  }
};

// ─── LOG IN ──────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(1, "Password required")
});

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { email, phone, password } = parsed.data;
    if (!email && !phone) throw new ValidationError("Email or phone required");

    const db = await getDB();

    let user;
    if (email) {
      user = await db.get("SELECT * FROM users WHERE email = ?", email);
    } else if (phone) {
      user = await db.get("SELECT * FROM users WHERE phone = ?", phone);
    }

    if (!user) {
      throw new ValidationError("Invalid credentials");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new ValidationError("Invalid credentials");
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    let isApproved = 0;
    if (user.role === 'recycler') {
      const profile = await db.get("SELECT isApproved FROM recycler_profiles WHERE userId = ?", user.id);
      isApproved = profile?.isApproved || 0;
    }

    sendSuccess(res, { token, role: user.role, requiresOnboarding: user.role === 'recycler' && !isApproved });
  } catch (err) {
    console.error(err);
    throw new DatabaseError("Login failed");
  }
};

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError("Email is required");
    }

    const db = await getDB();
    const user = await db.get("SELECT * FROM users WHERE email = ?", email);

    // Always respond with success to prevent email enumeration
    if (!user) {
      return sendSuccess(res, { message: "If that email is registered, a reset link has been sent." });
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Delete any existing tokens for this user first
    await db.run("DELETE FROM reset_tokens WHERE userId = ?", user.id);

    // Store the token
    await db.run(
      "INSERT INTO reset_tokens (token, userId, expiresAt) VALUES (?, ?, ?)",
      [token, user.id, expiresAt]
    );

    // Build the reset link
    const frontendUrl =
      process.env.FRONTEND_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://iwis-green-v103.vercel.app"
        : "http://localhost:3000");

    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    // Send the email using the centralized email service
    await emailService.sendPasswordResetEmail(email, resetLink);

    sendSuccess(res, { message: "If that email is registered, a reset link has been sent." });
  } catch (err) {
    console.error("[forgotPassword] error:", err);
    throw new DatabaseError("Failed to send reset email. Please try again.");
  }
};

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      throw new ValidationError("Token and new password are required");
    }

    if (password.length < 6) {
      throw new ValidationError("Password must be at least 6 characters");
    }

    const db = await getDB();

    const record = await db.get("SELECT * FROM reset_tokens WHERE token = ?", token);

    if (!record) {
      throw new ValidationError("Invalid or expired reset link");
    }

    // Check expiry
    if (new Date(record.expiresAt) < new Date()) {
      await db.run("DELETE FROM reset_tokens WHERE token = ?", token);
      throw new ValidationError("Reset link has expired. Please request a new one.");
    }

    // Hash new password and update user
    const hashed = await bcrypt.hash(password, 10);
    await db.run("UPDATE users SET password = ? WHERE id = ?", [hashed, record.userId]);

    // Delete the used token
    await db.run("DELETE FROM reset_tokens WHERE token = ?", token);

    sendSuccess(res, { message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("[resetPassword] error:", err);
    throw new DatabaseError("Failed to reset password. Please try again.");
  }
};

// ─── GET MY PROFILE ───────────────────────────────────────────────────────────
export const getMe = async (req: any, res: Response) => {
  try {
    const db = await getDB();
    const user = await db.get(
      `SELECT u.id, u.email, u.phone, u.displayName, u.role, u.totalScans, u.totalCO2, u.streak, u.tier, 
              u.greenPoints, u.createdAt, u.totalEarnings, u.city, r.isApproved 
       FROM users u 
       LEFT JOIN recycler_profiles r ON u.id = r.userId 
       WHERE u.id = ?`,
      req.user.id
    );
    if (!user) throw new ValidationError("User not found");

    // Aggregate stats
    let completedPickups = 0;
    let successfulListings = 0;
    let totalWasteRecycledKg = 0;
    let recyclerRating = 4.8; // Default mock rating

    if (user.role === 'citizen') {
      const stats = await db.get("SELECT COUNT(*) as count, SUM(estimatedWeightKg) as weight FROM waste_listings WHERE citizenId = ? AND status = 'completed'", user.id);
      successfulListings = stats?.count || 0;
      totalWasteRecycledKg = stats?.weight || 0;
    } else {
      const stats = await db.get("SELECT COUNT(*) as count, SUM(estimatedWeightKg) as weight FROM waste_listings WHERE recyclerId = ? AND status = 'completed'", user.id);
      completedPickups = stats?.count || 0;
      totalWasteRecycledKg = stats?.weight || 0;
      
      const rating = await db.get("SELECT averageRating FROM recycler_profiles WHERE userId = ?", user.id);
      if (rating && rating.averageRating) recyclerRating = rating.averageRating;
    }

    sendSuccess(res, {
      ...user,
      completedPickups,
      successfulListings,
      totalWasteRecycledKg,
      recyclerRating
    });
  } catch (err) {
    console.error("[getMe] error:", err);
    throw new DatabaseError("Failed to load profile.");
  }
};

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
export const updateProfile = async (req: any, res: Response) => {
  try {
    const { displayName } = req.body;
    if (!displayName || typeof displayName !== "string" || displayName.trim().length === 0) {
      throw new ValidationError("Display name is required.");
    }
    const db = await getDB();
    await db.run(
      "UPDATE users SET displayName = ? WHERE id = ?",
      [displayName.trim().slice(0, 60), req.user.id]
    );
    sendSuccess(res, { message: "Profile updated.", displayName: displayName.trim() });
  } catch (err) {
    console.error("[updateProfile] error:", err);
    throw new DatabaseError("Failed to update profile.");
  }
};

// ─── FIREBASE LOGIN ──────────────────────────────────────────────────────────
export const firebaseLogin = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken) throw new ValidationError("Firebase ID token required");

    const auth = getFirebaseAuth();
    if (!auth) {
      throw new DatabaseError("Firebase Auth is not configured on the server.");
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    const phone = decodedToken.phone_number;
    const email = decodedToken.email;
    const name = decodedToken.name;

    if (!phone && !email) {
      throw new ValidationError("No phone number or email found in Firebase token");
    }

    const db = await getDB();
    let user;

    if (phone) {
      user = await db.get("SELECT * FROM users WHERE phone = ?", phone);
    } 
    if (!user && email) {
      user = await db.get("SELECT * FROM users WHERE email = ?", email);
    }

    if (user) {
      let updates = [];
      let values = [];
      if (phone && !user.phoneVerified) {
        updates.push("phoneVerified = 1");
      }
      // If user logged in with Google (email) but their email wasn't in DB, we could update it, but they are matched by email or phone.
      if (email && !user.email) {
        updates.push("email = ?");
        values.push(email);
      }
      
      if (updates.length > 0) {
        values.push(user.id);
        await db.run(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);
      }
    } else {
      // Register new user seamlessly
      const id = crypto.randomUUID();
      const role = "citizen";
      const createdAt = new Date().toISOString();
      const displayName = name || (phone ? "Citizen " + phone.slice(-4) : "Citizen"); 
      const hashed = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10);
      const phoneVerified = phone ? 1 : 0;

      await db.run(
        "INSERT INTO users (id, phone, email, password, role, displayName, phoneVerified, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [id, phone || null, email || null, hashed, role, displayName, phoneVerified, createdAt]
      );
      user = { id, role, phone, email };
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    sendSuccess(res, { token, role: user.role, requiresOnboarding: user.role === 'recycler' && !user.isApproved });
  } catch (err) {
    console.error("[firebaseLogin] error:", err);
    throw new AuthenticationError("Invalid Firebase token or verification failed");
  }
};
