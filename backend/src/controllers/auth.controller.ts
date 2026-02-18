import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getDB } from "../db";

const JWT_SECRET = "iwis_super_secret_key";

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
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
      [id, email, hashed, "citizen", new Date().toISOString()]
    );

    const token = jwt.sign({ id, role: "citizen" }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed" });
  }
};

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

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};
