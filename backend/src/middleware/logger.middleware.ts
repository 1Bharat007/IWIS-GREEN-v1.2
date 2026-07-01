import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Attach request ID for tracing
  const requestId = crypto.randomUUID();
  (req as any).id = requestId;
  res.setHeader("X-Request-Id", requestId);

  // When request finishes, log it
  res.on("finish", () => {
    const latency = Date.now() - start;
    const userId = (req as any).user?.id || "anonymous";
    const status = res.statusCode;
    const method = req.method;
    const route = req.originalUrl;
    
    // Explicitly omit sensitive endpoints logging parameters
    console.log(`[${new Date().toISOString()}] [RequestId: ${requestId}] [User: ${userId}] ${method} ${route} ${status} - ${latency}ms`);
  });

  next();
};
