import { Response, NextFunction } from "express";

export interface AuthRequest extends Express.Request {
  user?: any;
  userRole?: string;
}

export const requireAdmin = (
  req: any,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};
