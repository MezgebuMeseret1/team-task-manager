// backend/middleware/rateLimit.js
import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === "production" ? 10 : 1000, // Allow more requests in dev
  message: "Too many requests, try again later.",
});