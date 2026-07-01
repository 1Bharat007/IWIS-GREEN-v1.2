import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { sendError } from "../utils/apiResponse.util";

export default function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = (req as any).id || "unknown";
  
  // Log error privately without leaking stack trace to user
  console.error(`[RequestId: ${requestId}] Error:`, err);

  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.message, err.code);
  }

  // Handle generic errors securely
  return sendError(res, 500, "Internal Server Error", "UNEXPECTED_ERROR");
}
