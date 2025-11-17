/**
 * Error Handling Middleware
 * 
 * Centralized error handling for the application.
 * 
 * @module middlewares/error
 */

import { Request, Response, NextFunction } from "express";
import { config } from "../config/env";

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 * 
 * @param err - Error object
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Default error values
  let statusCode = 500;
  let message = "Internal Server Error";
  let isOperational = false;

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }

  // Log error
  console.error("❌ Error:", {
    statusCode,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.nodeEnv === "development" && {
      stack: err.stack,
      details: err.message,
    }),
  });
}

