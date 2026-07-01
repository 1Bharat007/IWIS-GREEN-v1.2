import { sendSuccess } from "../utils/apiResponse.util";
import { AppError, ValidationError, AuthenticationError, AuthorizationError, DatabaseError } from "../utils/errors";
import { Request, Response } from "express";
import crypto from "crypto";
import { getDB } from "../db";

export const getNotifications = async (req: any, res: Response) => {
  try {
    const db = await getDB();
    const notifications = await db.all(
      "SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 50",
      req.user.id
    );
    sendSuccess(res, notifications);
  } catch (err) {
    console.error("[getNotifications] error:", err);
    throw new DatabaseError("Failed to fetch notifications.");
  }
};

export const markAsRead = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDB();
    await db.run("UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?", [id, req.user.id]);
    sendSuccess(res, { message: "Marked as read." });
  } catch (err) {
    console.error("[markAsRead] error:", err);
    throw new DatabaseError("Failed to mark notification as read.");
  }
};

export const markAllAsRead = async (req: any, res: Response) => {
  try {
    const db = await getDB();
    await db.run("UPDATE notifications SET isRead = 1 WHERE userId = ?", req.user.id);
    sendSuccess(res, { message: "All marked as read." });
  } catch (err) {
    console.error("[markAllAsRead] error:", err);
    throw new DatabaseError("Failed to mark all as read.");
  }
};

export const createNotification = async (userId: string, title: string, message: string, type: string = "info") => {
  try {
    const db = await getDB();
    await db.run(
      "INSERT INTO notifications (id, userId, title, message, type, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      [crypto.randomUUID(), userId, title, message, type, new Date().toISOString()]
    );
  } catch (err) {
    console.error("[createNotification] error:", err);
  }
};
