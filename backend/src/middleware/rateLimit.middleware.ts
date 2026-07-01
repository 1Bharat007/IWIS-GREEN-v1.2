import rateLimit from "express-rate-limit";

// Global limiter: 100 requests per minute
export const standardLimiter = rateLimit({
  windowMs: 60 * 1000, 
  limit: 100, 
  standardHeaders: true, 
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later.", code: "RATE_LIMIT" }
});

// Strict limiter for Auth/OTP: 5 requests per 15 minutes
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 5, 
  standardHeaders: true, 
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts, please try again after 15 minutes.", code: "RATE_LIMIT" }
});

// Scanner limiter: 15 requests per minute
export const scannerLimiter = rateLimit({
  windowMs: 60 * 1000, 
  limit: 15, 
  standardHeaders: true, 
  legacyHeaders: false,
  message: { success: false, message: "Scanner rate limit exceeded. Please wait a moment.", code: "RATE_LIMIT" }
});
