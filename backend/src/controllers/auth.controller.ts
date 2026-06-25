import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { getDB } from "../db";

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
export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, role = "citizen" } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    if (role !== "citizen" && role !== "recycler") {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    const db = await getDB();

    const existing = await db.get("SELECT * FROM users WHERE email = ?", email);
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const id = crypto.randomUUID();

    await db.run(
      "INSERT INTO users (id, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?)",
      [id, email, hashed, role, new Date().toISOString()]
    );

    const token = jwt.sign({ id, role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed" });
  }
};

// ─── LOG IN ──────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const db = await getDB();

    const user = await db.get("SELECT * FROM users WHERE email = ?", email);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, role: user.role });
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
      "SELECT id, email, displayName, role, totalScans, totalCO2, streak, tier, greenPoints FROM users WHERE id = ?",
      req.user.id
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
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
