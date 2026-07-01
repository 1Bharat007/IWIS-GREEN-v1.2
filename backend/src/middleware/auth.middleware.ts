import jwt from "jsonwebtoken";
import { getDB } from "../db";

const JWT_SECRET = process.env.JWT_SECRET || "iwis_super_secret_key";

export const protect = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // DB Check to ensure the user hasn't been deleted
    const db = await getDB();
    const userExists = await db.get("SELECT id FROM users WHERE id = ?", decoded.id);
    
    if (!userExists) {
      console.error("[auth.middleware] User no longer exists:", decoded.id);
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error("[auth.middleware] Error verifying token:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};
