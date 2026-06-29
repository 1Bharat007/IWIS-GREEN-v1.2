import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { z } from "zod";
import { getDB } from "../db";
import { getFirebaseAuth } from "../utils/firebase.util";

const JWT_SECRET = process.env.JWT_SECRET || "iwis_super_secret_key";

// ─── Email transporter ───────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── SIGN UP ─────────────────────────────────────────────────────────────────
const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["citizen", "recycler"]).default("citizen"),
  phone: z.string().min(10, "Valid phone number required"),
  displayName: z.string().min(2, "Name is required"),
  preferredLanguage: z.enum(["English", "हिन्दी", "Dogri"]).default("English"),
  otp: z.string().length(6, "Invalid OTP format")
});

export const signup = async (req: Request, res: Response) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }

    const { email, password, role, phone, displayName, preferredLanguage, otp } = parsed.data;

    const db = await getDB();

    // Verify OTP
    const otpRecord = await db.get("SELECT * FROM otp_codes WHERE phone = ? AND otp = ?", [phone, otp]);
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    if (new Date(otpRecord.expiresAt) < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Check existing
    const existing = await db.get("SELECT * FROM users WHERE email = ? OR phone = ?", [email, phone]);
    if (existing) {
      return res.status(400).json({ message: "User with this email or phone already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();

    await db.run(
      "INSERT INTO users (id, email, password, role, phone, displayName, preferredLanguage, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, email, hashed, role, phone, displayName, preferredLanguage, new Date().toISOString()]
    );

    // Cleanup OTP
    await db.run("DELETE FROM otp_codes WHERE phone = ?", [phone]);

    const token = jwt.sign({ id, role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed" });
  }
};

// ─── OTP ENDPOINTS ───────────────────────────────────────────────────────────
const phoneSchema = z.object({
  phone: z.string().min(10, "Valid phone number required")
});

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const parsed = phoneSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

    const { phone } = parsed.data;
    const db = await getDB();
    
    // Check phone-level rate limits
    const existingOTP = await db.get("SELECT * FROM otp_codes WHERE phone = ?", phone);
    const now = new Date();
    
    let hourlyCount = 1;
    if (existingOTP && existingOTP.lastRequestedAt) {
      const lastRequest = new Date(existingOTP.lastRequestedAt);
      const diffMs = now.getTime() - lastRequest.getTime();
      
      // 1 per 60 seconds
      if (diffMs < 60 * 1000) {
        return res.status(429).json({ message: "Please wait 60 seconds before requesting another OTP." });
      }
      
      // Reset hourly count if older than 1 hour, otherwise increment
      if (diffMs > 60 * 60 * 1000) {
        hourlyCount = 1;
      } else {
        hourlyCount = (existingOTP.hourlyCount || 0) + 1;
      }
      
      // 5 per hour
      if (hourlyCount > 5) {
        return res.status(429).json({ message: "You have exceeded the maximum number of OTP requests (5 per hour). Please try again later." });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit random
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    await db.run(
      "INSERT INTO otp_codes (phone, otp, expiresAt, lastRequestedAt, hourlyCount) VALUES (?, ?, ?, ?, ?) ON CONFLICT(phone) DO UPDATE SET otp = excluded.otp, expiresAt = excluded.expiresAt, lastRequestedAt = excluded.lastRequestedAt, hourlyCount = excluded.hourlyCount",
      [phone, otp, expiresAt, now.toISOString(), hourlyCount]
    );

    // In production, integrate MSG91 or Twilio here. For now, log to console.
    if (process.env.NODE_ENV !== "production") {
      console.log(`
==========================================
IWIS DEVELOPMENT OTP

Phone : ${phone}
OTP   : ${otp}
Valid : 5 minutes

==========================================
`);
    }

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: "Phone and OTP required" });

    const db = await getDB();
    const otpRecord = await db.get("SELECT * FROM otp_codes WHERE phone = ? AND otp = ?", [phone, otp]);
    if (!otpRecord) return res.status(400).json({ message: "Invalid OTP" });
    if (new Date(otpRecord.expiresAt) < new Date()) return res.status(400).json({ message: "OTP has expired" });

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to verify OTP" });
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
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }

    const { email, phone, password } = parsed.data;
    if (!email && !phone) return res.status(400).json({ message: "Email or phone required" });

    const db = await getDB();

    let user;
    if (email) {
      user = await db.get("SELECT * FROM users WHERE email = ?", email);
    } else if (phone) {
      user = await db.get("SELECT * FROM users WHERE phone = ?", phone);
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    let isApproved = 0;
    if (user.role === 'recycler') {
      const profile = await db.get("SELECT isApproved FROM recycler_profiles WHERE userId = ?", user.id);
      isApproved = profile?.isApproved || 0;
    }

    res.json({ token, role: user.role, requiresOnboarding: user.role === 'recycler' && !isApproved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const db = await getDB();
    const user = await db.get("SELECT * FROM users WHERE email = ?", email);

    // Always respond with success to prevent email enumeration
    if (!user) {
      return res.json({ message: "If that email is registered, a reset link has been sent." });
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

    // Send the email
    await transporter.sendMail({
      from: `"IWIS Green" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset your IWIS password",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f0f0f;color:#fff;border-radius:16px;">
          <h2 style="color:#4ade80;margin-bottom:8px;">🌿 IWIS Green</h2>
          <h3 style="margin-top:0;">Password Reset Request</h3>
          <p style="color:#a3a3a3;">We received a request to reset your password. Click the button below to create a new one. This link expires in <strong style="color:#fff;">1 hour</strong>.</p>
          <a href="${resetLink}"
             style="display:inline-block;margin:24px 0;padding:14px 32px;background:linear-gradient(135deg,#4ade80,#06b6d4);color:#000;font-weight:700;border-radius:12px;text-decoration:none;font-size:16px;">
            Reset Password →
          </a>
          <p style="color:#737373;font-size:12px;">If you didn't request this, ignore this email — your password won't change.</p>
          <hr style="border-color:#262626;margin:24px 0;" />
          <p style="color:#525252;font-size:11px;">IWIS Green · Towards a greener planet</p>
        </div>
      `,
    });

    res.json({ message: "If that email is registered, a reset link has been sent." });
  } catch (err) {
    console.error("[forgotPassword] error:", err);
    res.status(500).json({ message: "Failed to send reset email. Please try again." });
  }
};

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const db = await getDB();

    const record = await db.get("SELECT * FROM reset_tokens WHERE token = ?", token);

    if (!record) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    // Check expiry
    if (new Date(record.expiresAt) < new Date()) {
      await db.run("DELETE FROM reset_tokens WHERE token = ?", token);
      return res.status(400).json({ message: "Reset link has expired. Please request a new one." });
    }

    // Hash new password and update user
    const hashed = await bcrypt.hash(password, 10);
    await db.run("UPDATE users SET password = ? WHERE id = ?", [hashed, record.userId]);

    // Delete the used token
    await db.run("DELETE FROM reset_tokens WHERE token = ?", token);

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("[resetPassword] error:", err);
    res.status(500).json({ message: "Failed to reset password. Please try again." });
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
    if (!user) return res.status(404).json({ message: "User not found" });

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

    res.json({
      ...user,
      completedPickups,
      successfulListings,
      totalWasteRecycledKg,
      recyclerRating
    });
  } catch (err) {
    console.error("[getMe] error:", err);
    res.status(500).json({ message: "Failed to load profile." });
  }
};

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
export const updateProfile = async (req: any, res: Response) => {
  try {
    const { displayName } = req.body;
    if (!displayName || typeof displayName !== "string" || displayName.trim().length === 0) {
      return res.status(400).json({ message: "Display name is required." });
    }
    const db = await getDB();
    await db.run(
      "UPDATE users SET displayName = ? WHERE id = ?",
      [displayName.trim().slice(0, 60), req.user.id]
    );
    res.json({ message: "Profile updated.", displayName: displayName.trim() });
  } catch (err) {
    console.error("[updateProfile] error:", err);
    res.status(500).json({ message: "Failed to update profile." });
  }
};

// ─── FIREBASE LOGIN ──────────────────────────────────────────────────────────
export const firebaseLogin = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "Firebase ID token required" });

    const auth = getFirebaseAuth();
    if (!auth) {
      return res.status(500).json({ message: "Firebase Auth is not configured on the server." });
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    const phone = decodedToken.phone_number;
    const email = decodedToken.email;
    const name = decodedToken.name;

    if (!phone && !email) {
      return res.status(400).json({ message: "No phone number or email found in Firebase token" });
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
    res.json({ token, role: user.role, requiresOnboarding: user.role === 'recycler' && !user.isApproved });
  } catch (err) {
    console.error("[firebaseLogin] error:", err);
    res.status(401).json({ message: "Invalid Firebase token or verification failed" });
  }
};
